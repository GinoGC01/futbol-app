import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRouter from './routes/auth.js'
import ligasRouter from './routes/ligas.js'
import equiposRouter from './routes/equipos.js'
import partidosRouter from './routes/partidos.js'
import statsRouter from './routes/stats.js'
import jugadoresRouter from './routes/jugadores.js'

const app = express()
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

// Health check — usado por cron-job.org para mantener Render activo
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

app.use('/api/auth', authRouter)
app.use('/api/ligas', ligasRouter)
app.use('/api/equipos', equiposRouter)
app.use('/api/partidos', partidosRouter)
app.use('/api/stats', statsRouter)
app.use('/api/jugadores', jugadoresRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Error handler global
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Error interno del servidor' })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`))
}

export default app
