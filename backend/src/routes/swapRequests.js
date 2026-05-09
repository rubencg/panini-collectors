// GET    /api/swap-requests            — list all requests (client filters by active person)
// POST   /api/swap-requests            — create a new request
// PUT    /api/swap-requests/:id        — replace items on a pending request
// POST   /api/swap-requests/:id/complete — atomically apply the swap
// DELETE /api/swap-requests/:id        — delete a request + its items (cascade)

import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Shape a raw SwapRequest DB row (with items + person relations) into the API response. */
function formatSwapRequest(sr) {
  return {
    id: sr.id,
    fromPerson: sr.fromPerson.name,
    toPerson: sr.toPerson.name,
    status: sr.status,
    fromOffers: sr.items.filter(i => i.direction === 'from_offers').map(i => i.stickerId),
    toOffers: sr.items.filter(i => i.direction === 'to_offers').map(i => i.stickerId),
    fromForOtherAccount: sr.fromForOtherAccount,
    toForOtherAccount: sr.toForOtherAccount,
    createdAt: sr.createdAt,
    updatedAt: sr.updatedAt,
  }
}

const INCLUDE_FULL = {
  fromPerson: true,
  toPerson: true,
  items: true,
}

// ─── GET /api/swap-requests ───────────────────────────────────────────────────

router.get('/swap-requests', async (req, res) => {
  try {
    const rows = await prisma.swapRequest.findMany({
      include: INCLUDE_FULL,
      orderBy: { createdAt: 'desc' },
    })
    res.json(rows.map(formatSwapRequest))
  } catch (err) {
    console.error('GET /swap-requests error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── POST /api/swap-requests ──────────────────────────────────────────────────

router.post('/swap-requests', async (req, res) => {
  const { fromPerson: fromName, toPerson: toName, fromOffers = [], toOffers = [], fromForOtherAccount = false, toForOtherAccount = false } = req.body

  if (!fromName || !toName) {
    return res.status(400).json({ error: 'fromPerson and toPerson are required' })
  }
  if (fromName === toName) {
    return res.status(400).json({ error: 'fromPerson and toPerson must be different' })
  }
  if (!Array.isArray(fromOffers) || !Array.isArray(toOffers)) {
    return res.status(400).json({ error: 'fromOffers and toOffers must be arrays' })
  }
  if (fromOffers.length + toOffers.length === 0) {
    return res.status(400).json({ error: 'At least one sticker must be included in the swap' })
  }

  try {
    const [fromPerson, toPerson] = await Promise.all([
      prisma.person.findUnique({ where: { name: fromName } }),
      prisma.person.findUnique({ where: { name: toName } }),
    ])
    if (!fromPerson) return res.status(404).json({ error: `Person not found: ${fromName}` })
    if (!toPerson) return res.status(404).json({ error: `Person not found: ${toName}` })

    const created = await prisma.$transaction(async (tx) => {
      const sr = await tx.swapRequest.create({
        data: {
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
          fromForOtherAccount,
          toForOtherAccount,
          items: {
            createMany: {
              data: [
                ...fromOffers.map(stickerId => ({ stickerId, direction: 'from_offers' })),
                ...toOffers.map(stickerId => ({ stickerId, direction: 'to_offers' })),
              ],
            },
          },
        },
        include: INCLUDE_FULL,
      })
      return sr
    })

    res.status(201).json(formatSwapRequest(created))
  } catch (err) {
    console.error('POST /swap-requests error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── PUT /api/swap-requests/:id ───────────────────────────────────────────────

router.put('/swap-requests/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  const { fromPerson: fromName, toPerson: toName, fromOffers = [], toOffers = [], fromForOtherAccount = false, toForOtherAccount = false } = req.body

  if (!fromName || !toName) {
    return res.status(400).json({ error: 'fromPerson and toPerson are required' })
  }
  if (fromName === toName) {
    return res.status(400).json({ error: 'fromPerson and toPerson must be different' })
  }
  if (!Array.isArray(fromOffers) || !Array.isArray(toOffers)) {
    return res.status(400).json({ error: 'fromOffers and toOffers must be arrays' })
  }
  if (fromOffers.length + toOffers.length === 0) {
    return res.status(400).json({ error: 'At least one sticker must be included in the swap' })
  }

  try {
    const existing = await prisma.swapRequest.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Swap request not found' })
    if (existing.status === 'completed') {
      return res.status(409).json({ error: 'Cannot edit a completed swap request' })
    }

    const [fromPerson, toPerson] = await Promise.all([
      prisma.person.findUnique({ where: { name: fromName } }),
      prisma.person.findUnique({ where: { name: toName } }),
    ])
    if (!fromPerson) return res.status(404).json({ error: `Person not found: ${fromName}` })
    if (!toPerson) return res.status(404).json({ error: `Person not found: ${toName}` })

    const updated = await prisma.$transaction(async (tx) => {
      await tx.swapRequestItem.deleteMany({ where: { swapRequestId: id } })
      const sr = await tx.swapRequest.update({
        where: { id },
        data: {
          fromPersonId: fromPerson.id,
          toPersonId: toPerson.id,
          fromForOtherAccount,
          toForOtherAccount,
          updatedAt: new Date(),
          items: {
            createMany: {
              data: [
                ...fromOffers.map(stickerId => ({ stickerId, direction: 'from_offers' })),
                ...toOffers.map(stickerId => ({ stickerId, direction: 'to_offers' })),
              ],
            },
          },
        },
        include: INCLUDE_FULL,
      })
      return sr
    })

    res.json(formatSwapRequest(updated))
  } catch (err) {
    console.error(`PUT /swap-requests/${id} error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── POST /api/swap-requests/:id/complete ─────────────────────────────────────

router.post('/swap-requests/:id/complete', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  const warnings = []

  try {
    await prisma.$transaction(async (tx) => {
      const sr = await tx.swapRequest.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!sr) {
        const err = new Error('Not found'); err.status = 404; throw err
      }
      if (sr.status === 'completed') {
        const err = new Error('Already completed'); err.status = 409; throw err
      }

      const fromOffers = sr.items.filter(i => i.direction === 'from_offers').map(i => i.stickerId)
      const toOffers   = sr.items.filter(i => i.direction === 'to_offers').map(i => i.stickerId)

      // Apply one side of the swap: giver loses 1 extra (clamped at 0), taker gains sticker
      // takerUsesOtherAccount=true  → mark inOtherAccount on taker, leave count at 0
      // takerUsesOtherAccount=false → set count=1, inOtherAccount=false on taker
      const apply = async (giverId, takerId, stickerIds, takerUsesOtherAccount) => {
        for (const stickerId of stickerIds) {
          const g = await tx.personSticker.findUnique({
            where: { personId_stickerId: { personId: giverId, stickerId } },
          })
          const currentExtra = g?.extra ?? 0
          if (currentExtra < 1) {
            warnings.push(`${stickerId}: giver had no extra (clamped)`)
          }
          const newExtra = Math.max(0, currentExtra - 1)

          if (g) {
            if (newExtra <= 0 && (g.count ?? 0) <= 0) {
              await tx.personSticker.delete({
                where: { personId_stickerId: { personId: giverId, stickerId } },
              })
            } else {
              await tx.personSticker.update({
                where: { personId_stickerId: { personId: giverId, stickerId } },
                data: { extra: newExtra },
              })
            }
          }
          // Taker: place sticker in album or 2nd account
          const t = await tx.personSticker.findUnique({
            where: { personId_stickerId: { personId: takerId, stickerId } },
          })
          if (!takerUsesOtherAccount && t?.count >= 1) {
            warnings.push(`${stickerId}: taker already owned this sticker`)
          }
          if (takerUsesOtherAccount) {
            await tx.personSticker.upsert({
              where: { personId_stickerId: { personId: takerId, stickerId } },
              update: { inOtherAccount: true },
              create: { personId: takerId, stickerId, count: 0, extra: 0, inOtherAccount: true },
            })
          } else {
            await tx.personSticker.upsert({
              where: { personId_stickerId: { personId: takerId, stickerId } },
              update: { count: 1, inOtherAccount: false },
              create: { personId: takerId, stickerId, count: 1, extra: 0, inOtherAccount: false },
            })
          }
        }
      }

      await apply(sr.fromPersonId, sr.toPersonId,   fromOffers, sr.toForOtherAccount)
      await apply(sr.toPersonId,   sr.fromPersonId, toOffers,   sr.fromForOtherAccount)

      // Delete-on-complete per README §6.1
      await tx.swapRequest.delete({ where: { id } })
    })

    const response = { ok: true }
    if (warnings.length > 0) {
      response.warnings = warnings
      console.warn(`complete swap ${id}: ${warnings.join('; ')}`)
    }
    res.json(response)
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Swap request not found' })
    if (err.status === 409) return res.status(409).json({ error: 'Swap request already completed' })
    console.error(`POST /swap-requests/${id}/complete error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── DELETE /api/swap-requests/:id ───────────────────────────────────────────

router.delete('/swap-requests/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  try {
    await prisma.swapRequest.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    // Prisma throws P2025 when the record doesn't exist
    if (err.code === 'P2025') return res.status(404).json({ error: 'Swap request not found' })
    console.error(`DELETE /swap-requests/${id} error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
