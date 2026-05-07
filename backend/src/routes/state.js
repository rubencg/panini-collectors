// GET /api/state
// Returns { Ivan: { "MEX-0": 2, "ARG-3": 1, ... }, Ruy: { ... }, ... }
// (only stickers with count > 0 are included)
import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

router.get('/state', async (req, res) => {
  const people = await prisma.person.findMany({
    include: { stickers: true }
  })
  const result = {}
  for (const person of people) {
    result[person.name] = {}
    for (const s of person.stickers) {
      if (s.count > 0) result[person.name][s.stickerId] = s.count
    }
  }
  res.json(result)
})

export default router
