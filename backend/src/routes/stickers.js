// PUT /api/sticker
// Body: { person, stickerId, count?, extra? }
// Partial update — only provided fields are changed.
// Record is deleted when both count and extra drop to 0.

// POST /api/stickers/bulk
// Body: { person, stickers: [{ id, count }] }
// Bulk upsert for album-only operations (mark/unmark page).
// Preserves existing extra counts.

import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

router.put('/sticker', async (req, res) => {
  const { person: personName, stickerId, count, extra } = req.body
  if (!personName || !stickerId || (count === undefined && extra === undefined)) {
    return res.status(400).json({ error: 'person, stickerId, and count or extra required' })
  }
  const person = await prisma.person.findUnique({ where: { name: personName } })
  if (!person) return res.status(404).json({ error: 'Person not found' })

  const existing = await prisma.personSticker.findUnique({
    where: { personId_stickerId: { personId: person.id, stickerId } }
  })
  const newCount = count !== undefined ? Math.max(0, count) : (existing?.count ?? 0)
  const newExtra = extra !== undefined ? Math.max(0, extra) : (existing?.extra ?? 0)

  if (newCount <= 0 && newExtra <= 0) {
    await prisma.personSticker.deleteMany({ where: { personId: person.id, stickerId } })
  } else {
    await prisma.personSticker.upsert({
      where: { personId_stickerId: { personId: person.id, stickerId } },
      update: { count: newCount, extra: newExtra },
      create: { personId: person.id, stickerId, count: newCount, extra: newExtra }
    })
  }
  res.json({ ok: true })
})

router.post('/stickers/bulk', async (req, res) => {
  const { person: personName, stickers } = req.body
  if (!personName || !Array.isArray(stickers)) {
    return res.status(400).json({ error: 'person and stickers[] required' })
  }
  const person = await prisma.person.findUnique({ where: { name: personName } })
  if (!person) return res.status(404).json({ error: 'Person not found' })

  await prisma.$transaction(async (tx) => {
    for (const { id: stickerId, count } of stickers) {
      if (count > 0) {
        await tx.personSticker.upsert({
          where: { personId_stickerId: { personId: person.id, stickerId } },
          update: { count },
          create: { personId: person.id, stickerId, count, extra: 0 }
        })
      } else {
        const existing = await tx.personSticker.findUnique({
          where: { personId_stickerId: { personId: person.id, stickerId } }
        })
        if (existing) {
          if (existing.extra > 0) {
            await tx.personSticker.update({
              where: { personId_stickerId: { personId: person.id, stickerId } },
              data: { count: 0 }
            })
          } else {
            await tx.personSticker.delete({
              where: { personId_stickerId: { personId: person.id, stickerId } }
            })
          }
        }
      }
    }
  })
  res.json({ ok: true })
})

export default router
