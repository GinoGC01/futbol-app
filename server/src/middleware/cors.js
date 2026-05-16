import cors from "cors";

// --- Orígenes estáticos permitidos ---
const allowedOrigins = [
  "https://staging.canchalibre.pro",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Agregar FRONTEND_URL de las env vars (staging / preview deploys)
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como herramientas de testeo o apps móviles)
    if (!origin) return callback(null, true);

    const isLocalhost =
      origin.startsWith("http://localhost:") || origin === "http://localhost";
    const isAllowed = allowedOrigins.includes(origin);
    // Permitir deploys de preview en Vercel (*.vercel.app)
    const isVercelPreview = origin.endsWith(".vercel.app");

    if (isAllowed || isLocalhost || isVercelPreview) {
      callback(null, true);
    } else {
      console.warn(`CORS Bloqueado para el origen: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});
