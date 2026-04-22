import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import identityRouter from './routes/identity.js'
import competitionRouter from './routes/competition.js'
import rosterRouter from './routes/roster.js'
import matchRouter from './routes/match.js'
import statsRouter from './routes/stats.js'
import awardsRouter from './routes/awards.js'

import { errorHandler } from './middleware/errorHandler.js'
import { startCleanupJob } from './jobs/cleanupTokens.js'

const app = express()

// Iniciar cron jobs
startCleanupJob()

const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

app.use(express.json())
app.use(cookieParser())

// Health check — usado por cron-job.org para mantener Render activo
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

app.use('/api/identity', identityRouter)
app.use('/api/competition', competitionRouter)
app.use('/api/roster', rosterRouter)
app.use('/api/match', matchRouter)
app.use('/api/stats', statsRouter)     // Público — sin auth
app.use('/api/awards', awardsRouter)   // Admin — requireAuth + requireOrganizador

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Error handler global
app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`))
}

export default app
