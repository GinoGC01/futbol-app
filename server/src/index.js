import "dotenv/config";
import express from "express";
import { corsMiddleware } from "./middleware/cors.js";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import identityRouter from "./routes/identity.js";
import competitionRouter from "./routes/competition.js";
import rosterRouter from "./routes/roster.js";
import matchRouter from "./routes/match.js";
import statsRouter from "./routes/stats.js";
import awardsRouter from "./routes/awards.js";
import alertsRouter from "./routes/alerts.js";
import healthRouter from "./routes/health.js";
import webhooksRouter from "./routes/webhooks.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { startCleanupJob } from "./jobs/cleanupTokens.js";
import { isTest, currentEnv } from "./utils/envHelpers.js";

const app = express();

// Iniciar cron jobs
startCleanupJob();

const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(corsMiddleware);

if (!isTest()) {
  app.use(morgan("dev"));
}

// Header para permitir popups de Google Auth en contextos cross-origin
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use(express.json());
app.use(cookieParser());

// Health check — usado por monitoreo y para mantener Render activo
app.use("/health", healthRouter);

app.use("/api/identity", identityRouter);
app.use("/api/competition", competitionRouter);
app.use("/api/roster", rosterRouter);
app.use("/api/match", matchRouter);
app.use("/api/stats", statsRouter); // Público — sin auth
app.use("/api/awards", awardsRouter); // Admin — requireAuth + requireOrganizador
app.use("/api/alerts", alertsRouter); // Admin — requireAuth + requireOrganizador

// Webhooks (Sin /api prefix para facilitar config en servicios externos)
app.use("/webhooks", webhooksRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler global
app.use(errorHandler);

if (!isTest()) {
  app.listen(PORT, () => console.log(`[${currentEnv}] Servidor en http://localhost:${PORT}`));
}

export default app;
