// PUT /api/sticker
// Body: { person: "Ivan", stickerId: "MEX-0", count: 2 }
// Upserts count. count <= 0 deletes the record.

// POST /api/stickers/bulk
// Body: { person: "Ivan", stickers: [{ id: "MEX-0", count: 1 }, ...] }
// Bulk upsert for "mark page collected" etc.

import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

router.put('/sticker', async (req, res) => {
  const { person: personName, stickerId, count } = req.body
  if (!personName || !stickerId || count === undefined) {
    return res.status(400).json({ error: 'person, stickerId, count required' })
  }
  const person = await prisma.person.findUnique({ where: { name: personName } })
  if (!person) return res.status(404).json({ error: 'Person not found' })

  if (count <= 0) {
    await prisma.personSticker.deleteMany({
      where: { personId: person.id, stickerId }
    })
  } else {
    await prisma.personSticker.upsert({
      where: { personId_stickerId: { personId: person.id, stickerId } },
      update: { count },
      create: { personId: person.id, stickerId, count }
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

  await prisma.$transaction(
    stickers.map(({ id: stickerId, count }) =>
      count > 0
        ? prisma.personSticker.upsert({
            where: { personId_stickerId: { personId: person.id, stickerId } },
            update: { count },
            create: { personId: person.id, stickerId, count }
          })
        : prisma.personSticker.deleteMany({
            where: { personId: person.id, stickerId }
          })
    )
  )
  res.json({ ok: true })
})

export default router
