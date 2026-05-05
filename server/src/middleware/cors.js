import cors from 'cors'

const allowedOrigins = [
  'https://app.canchalibre.pro',
  'http://localhost:5173',
  'http://localhost:3000'
]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como herramientas de testeo o apps móviles)
    if (!origin) return callback(null, true)

    const isLocalhost = origin.startsWith('http://localhost:') || origin === 'http://localhost'
    const isAllowed = allowedOrigins.includes(origin)

    if (isAllowed || isLocalhost) {
      callback(null, true)
    } else {
      console.warn(`CORS Bloqueado para el origen: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
})
