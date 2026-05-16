// GET    /api/pack-openings            — list all (client filters by person)
// POST   /api/pack-openings            — create a pack opening
// PUT    /api/pack-openings/:id        — edit a pending pack opening
// POST   /api/pack-openings/:id/complete — apply changes to sticker counts
// DELETE /api/pack-openings/:id        — delete

import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatPackOpening(p) {
  return {
    id: p.id,
    person: p.person.name,
    status: p.status,
    albumItems:    p.items.filter(i => i.itemType === 'album').map(i => i.stickerId),
    dupesItems:    p.items.filter(i => i.itemType === 'dupe').map(i => i.stickerId),
    otherAcctItems: p.items.filter(i => i.itemType === 'other_acct').map(i => i.stickerId),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

const INCLUDE_FULL = { person: true, items: true }

// ─── GET /api/pack-openings ───────────────────────────────────────────────────

router.get('/pack-openings', async (req, res) => {
  try {
    const rows = await prisma.packOpening.findMany({
      include: INCLUDE_FULL,
      orderBy: { createdAt: 'desc' },
    })
    res.json(rows.map(formatPackOpening))
  } catch (err) {
    console.error('GET /pack-openings error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── POST /api/pack-openings ──────────────────────────────────────────────────

router.post('/pack-openings', async (req, res) => {
  const { person: personName, albumItems = [], dupesItems = [], otherAcctItems = [] } = req.body

  if (!personName) return res.status(400).json({ error: 'person is required' })
  if (!Array.isArray(albumItems) || !Array.isArray(dupesItems) || !Array.isArray(otherAcctItems)) {
    return res.status(400).json({ error: 'albumItems, dupesItems and otherAcctItems must be arrays' })
  }
  if (albumItems.length + dupesItems.length + otherAcctItems.length === 0) {
    return res.status(400).json({ error: 'At least one sticker is required' })
  }

  try {
    const person = await prisma.person.findUnique({ where: { name: personName } })
    if (!person) return res.status(404).json({ error: `Person not found: ${personName}` })

    const created = await prisma.packOpening.create({
      data: {
        personId: person.id,
        items: {
          createMany: {
            data: [
              ...albumItems.map(stickerId => ({ stickerId, itemType: 'album' })),
              ...dupesItems.map(stickerId => ({ stickerId, itemType: 'dupe' })),
              ...otherAcctItems.map(stickerId => ({ stickerId, itemType: 'other_acct' })),
            ],
          },
        },
      },
      include: INCLUDE_FULL,
    })

    res.status(201).json(formatPackOpening(created))
  } catch (err) {
    console.error('POST /pack-openings error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── PUT /api/pack-openings/:id ───────────────────────────────────────────────

router.put('/pack-openings/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  const { albumItems = [], dupesItems = [], otherAcctItems = [] } = req.body

  if (!Array.isArray(albumItems) || !Array.isArray(dupesItems) || !Array.isArray(otherAcctItems)) {
    return res.status(400).json({ error: 'albumItems, dupesItems and otherAcctItems must be arrays' })
  }
  if (albumItems.length + dupesItems.length + otherAcctItems.length === 0) {
    return res.status(400).json({ error: 'At least one sticker is required' })
  }

  try {
    const existing = await prisma.packOpening.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Pack opening not found' })
    if (existing.status === 'completed') {
      return res.status(409).json({ error: 'Cannot edit a completed pack opening' })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.packOpeningItem.deleteMany({ where: { packOpeningId: id } })
      return tx.packOpening.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          items: {
            createMany: {
              data: [
                ...albumItems.map(stickerId => ({ stickerId, itemType: 'album' })),
                ...dupesItems.map(stickerId => ({ stickerId, itemType: 'dupe' })),
                ...otherAcctItems.map(stickerId => ({ stickerId, itemType: 'other_acct' })),
              ],
            },
          },
        },
        include: INCLUDE_FULL,
      })
    })

    res.json(formatPackOpening(updated))
  } catch (err) {
    console.error(`PUT /pack-openings/${id} error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── POST /api/pack-openings/:id/complete ─────────────────────────────────────

router.post('/pack-openings/:id/complete', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  try {
    await prisma.$transaction(async (tx) => {
      const po = await tx.packOpening.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!po) { const e = new Error('Not found'); e.status = 404; throw e }
      if (po.status === 'completed') { const e = new Error('Already completed'); e.status = 409; throw e }

      const albumIds    = po.items.filter(i => i.itemType === 'album').map(i => i.stickerId)
      const dupeIds     = po.items.filter(i => i.itemType === 'dupe').map(i => i.stickerId)
      const otherAcctIds = po.items.filter(i => i.itemType === 'other_acct').map(i => i.stickerId)

      // Album: mark as owned; detect if it was in 2nd acct → auto +1 extra for that copy
      for (const stickerId of albumIds) {
        const current = await tx.personSticker.findUnique({
          where: { personId_stickerId: { personId: po.personId, stickerId } },
        })
        const wasInOtherAccount = current?.inOtherAccount ?? false
        await tx.personSticker.upsert({
          where: { personId_stickerId: { personId: po.personId, stickerId } },
          update: {
            count: 1,
            inOtherAccount: false,
            ...(wasInOtherAccount ? { extra: { increment: 1 } } : {}),
          },
          create: { personId: po.personId, stickerId, count: 1, extra: 0, inOtherAccount: false },
        })
      }

      // Dupes: +1 extra per occurrence (same sticker may appear multiple times)
      for (const stickerId of dupeIds) {
        await tx.personSticker.upsert({
          where: { personId_stickerId: { personId: po.personId, stickerId } },
          update: { extra: { increment: 1 } },
          create: { personId: po.personId, stickerId, count: 0, extra: 1, inOtherAccount: false },
        })
      }

      // 2nd account: mark as inOtherAccount
      for (const stickerId of otherAcctIds) {
        await tx.personSticker.upsert({
          where: { personId_stickerId: { personId: po.personId, stickerId } },
          update: { inOtherAccount: true },
          create: { personId: po.personId, stickerId, count: 0, extra: 0, inOtherAccount: true },
        })
      }

      await tx.packOpening.delete({ where: { id } })
    })

    res.json({ ok: true })
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Pack opening not found' })
    if (err.status === 409) return res.status(409).json({ error: 'Pack opening already completed' })
    console.error(`POST /pack-openings/${id}/complete error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── DELETE /api/pack-openings/:id ────────────────────────────────────────────

router.delete('/pack-openings/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  try {
    await prisma.packOpening.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Pack opening not found' })
    console.error(`DELETE /pack-openings/${id} error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
