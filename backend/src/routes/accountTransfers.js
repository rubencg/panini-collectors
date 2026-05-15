// GET    /api/account-transfers            — list all (client filters by person)
// POST   /api/account-transfers            — create a transfer
// PUT    /api/account-transfers/:id        — edit a pending transfer
// POST   /api/account-transfers/:id/complete — mark 2nd-acct stickers as owned in main album
// DELETE /api/account-transfers/:id        — delete a transfer + items (cascade)

import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTransfer(t) {
  return {
    id: t.id,
    person: t.person.name,
    status: t.status,
    otherAcctStickers: t.items.filter(i => i.itemType === 'other_acct').map(i => i.stickerId),
    dupeStickers: t.items.filter(i => i.itemType === 'dupe').map(i => i.stickerId),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

const INCLUDE_FULL = { person: true, items: true }

// ─── GET /api/account-transfers ───────────────────────────────────────────────

router.get('/account-transfers', async (req, res) => {
  try {
    const rows = await prisma.accountTransfer.findMany({
      include: INCLUDE_FULL,
      orderBy: { createdAt: 'desc' },
    })
    res.json(rows.map(formatTransfer))
  } catch (err) {
    console.error('GET /account-transfers error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── POST /api/account-transfers ──────────────────────────────────────────────

router.post('/account-transfers', async (req, res) => {
  const { person: personName, otherAcctStickers = [], dupeStickers = [] } = req.body

  if (!personName) return res.status(400).json({ error: 'person is required' })
  if (!Array.isArray(otherAcctStickers) || !Array.isArray(dupeStickers)) {
    return res.status(400).json({ error: 'otherAcctStickers and dupeStickers must be arrays' })
  }
  if (otherAcctStickers.length === 0) {
    return res.status(400).json({ error: 'At least one other-account sticker is required' })
  }

  try {
    const person = await prisma.person.findUnique({ where: { name: personName } })
    if (!person) return res.status(404).json({ error: `Person not found: ${personName}` })

    const created = await prisma.accountTransfer.create({
      data: {
        personId: person.id,
        items: {
          createMany: {
            data: [
              ...otherAcctStickers.map(stickerId => ({ stickerId, itemType: 'other_acct' })),
              ...dupeStickers.map(stickerId => ({ stickerId, itemType: 'dupe' })),
            ],
          },
        },
      },
      include: INCLUDE_FULL,
    })

    res.status(201).json(formatTransfer(created))
  } catch (err) {
    console.error('POST /account-transfers error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── PUT /api/account-transfers/:id ───────────────────────────────────────────

router.put('/account-transfers/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  const { person: personName, otherAcctStickers = [], dupeStickers = [] } = req.body

  if (!personName) return res.status(400).json({ error: 'person is required' })
  if (!Array.isArray(otherAcctStickers) || !Array.isArray(dupeStickers)) {
    return res.status(400).json({ error: 'otherAcctStickers and dupeStickers must be arrays' })
  }
  if (otherAcctStickers.length === 0) {
    return res.status(400).json({ error: 'At least one other-account sticker is required' })
  }

  try {
    const existing = await prisma.accountTransfer.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Account transfer not found' })
    if (existing.status === 'completed') {
      return res.status(409).json({ error: 'Cannot edit a completed transfer' })
    }

    const person = await prisma.person.findUnique({ where: { name: personName } })
    if (!person) return res.status(404).json({ error: `Person not found: ${personName}` })

    const updated = await prisma.$transaction(async (tx) => {
      await tx.accountTransferItem.deleteMany({ where: { transferId: id } })
      return tx.accountTransfer.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          items: {
            createMany: {
              data: [
                ...otherAcctStickers.map(stickerId => ({ stickerId, itemType: 'other_acct' })),
                ...dupeStickers.map(stickerId => ({ stickerId, itemType: 'dupe' })),
              ],
            },
          },
        },
        include: INCLUDE_FULL,
      })
    })

    res.json(formatTransfer(updated))
  } catch (err) {
    console.error(`PUT /account-transfers/${id} error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── POST /api/account-transfers/:id/complete ─────────────────────────────────

router.post('/account-transfers/:id/complete', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  try {
    await prisma.$transaction(async (tx) => {
      const transfer = await tx.accountTransfer.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!transfer) { const e = new Error('Not found'); e.status = 404; throw e }
      if (transfer.status === 'completed') { const e = new Error('Already completed'); e.status = 409; throw e }

      const otherAcctIds = transfer.items
        .filter(i => i.itemType === 'other_acct')
        .map(i => i.stickerId)

      // Mark each 2nd-acct sticker as owned in main album (count=1, inOtherAccount=false)
      for (const stickerId of otherAcctIds) {
        await tx.personSticker.upsert({
          where: { personId_stickerId: { personId: transfer.personId, stickerId } },
          update: { count: 1, inOtherAccount: false },
          create: { personId: transfer.personId, stickerId, count: 1, extra: 0, inOtherAccount: false },
        })
      }

      await tx.accountTransfer.delete({ where: { id } })
    })

    res.json({ ok: true })
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Account transfer not found' })
    if (err.status === 409) return res.status(409).json({ error: 'Transfer already completed' })
    console.error(`POST /account-transfers/${id}/complete error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── DELETE /api/account-transfers/:id ────────────────────────────────────────

router.delete('/account-transfers/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  try {
    await prisma.accountTransfer.delete({ where: { id } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Account transfer not found' })
    console.error(`DELETE /account-transfers/${id} error:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
