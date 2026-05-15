import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import stateRouter from './routes/state.js'
import stickersRouter from './routes/stickers.js'
import swapRequestsRouter from './routes/swapRequests.js'
import accountTransfersRouter from './routes/accountTransfers.js'

export const prisma = new PrismaClient()

const PEOPLE = ['Ivan', 'Ruy', 'Giovanni', 'Ruben', 'Andres']

async function seed() {
  for (const name of PEOPLE) {
    await prisma.person.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }
}

const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use('/api', stateRouter)
app.use('/api', stickersRouter)
app.use('/api', swapRequestsRouter)
app.use('/api', accountTransfersRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, async () => {
  await seed()
  console.log(`API running on http://localhost:${PORT}`)
})
