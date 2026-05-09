// GET /api/state
// Returns { Ivan: { "MEX-0": { count: 1, extra: 0 }, ... }, ... }
// (only stickers with count > 0 or extra > 0 are included)
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
      if (s.count > 0 || s.extra > 0 || s.inOtherAccount) {
        result[person.name][s.stickerId] = { count: s.count, extra: s.extra, inOtherAccount: s.inOtherAccount }
      }
    }
  }
  res.json(result)
})

export default router
