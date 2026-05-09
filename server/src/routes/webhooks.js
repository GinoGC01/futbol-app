import { Router } from "express";
import {
  sendWelcomeBetaEmail,
  sendSuspendedEmail,
  sendReactivationEmail,
  sendSubscriberEmail,
} from "../utils/emails/mailer.js";

const router = Router();

/**
 * Webhook para cambios de estado en Supabase
 * Escucha cambios en la tabla 'organizador' (columna status)
 *
 * Paso 3: Seguridad con header x-supabase-webhook-secret
 */
router.post("/supabase/status-change", async (req, res) => {
  try {
    // 1. Validar Secreto
    const webhookSecret = req.headers["x-supabase-webhook-secret"];
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.warn(
        "[Webhook Security] Intento de acceso no autorizado o secreto inválido",
      );
      return res.status(401).json({ error: "No autorizado" });
    }

    // 2. Parsear Payload
    const { type, table, record, old_record } = req.body;

    // Solo procesamos UPDATE en la tabla organizador
    if (table !== "organizador" || type !== "UPDATE") {
      return res
        .status(200)
        .json({ skipped: true, reason: "Evento o tabla no relevante" });
    }

    const newStatus = record.status;
    const oldStatus = old_record?.status;
    const email = record.email;
    const nombre = record.nombre || email;

    // 3. Lógica de Transiciones (Paso 2)
    console.log(
      `[Webhook Status] Procesando transición para ${email}: ${oldStatus} -> ${newStatus}`,
    );

    if (newStatus === oldStatus) {
      return res
        .status(200)
        .json({ skipped: true, reason: "Status no ha cambiado" });
    }

    // Mapa de transiciones
    if (oldStatus === "pending" && newStatus === "beta") {
      await sendWelcomeBetaEmail(email, nombre);
      console.log(`[Webhook Success] Email de admisión enviado a ${email}`);
    } else if (oldStatus === "pending" && newStatus === "suspended") {
      // Reclazo cordial (opcional)
      await sendSuspendedEmail(
        email,
        nombre,
        "Lo sentimos, en este momento no podemos habilitar tu cuenta.",
      );
      console.log(`[Webhook Success] Email de rechazo enviado a ${email}`);
    } else if (oldStatus === "beta" && newStatus === "suspended") {
      await sendSuspendedEmail(
        email,
        nombre,
        "Tu cuenta ha sido suspendida por incumplimiento de términos.",
      );
      console.log(`[Webhook Success] Email de suspensión enviado a ${email}`);
    } else if (oldStatus === "suspended" && newStatus === "beta") {
      await sendReactivationEmail(email, nombre);
      console.log(`[Webhook Success] Email de reactivación enviado a ${email}`);
    } else if (newStatus === "subscriber") {
      await sendSubscriberEmail(email, nombre);
      console.log(`[Webhook Success] Email de suscripción enviado a ${email}`);
    } else {
      console.log(
        `[Webhook Info] Transición ${oldStatus} -> ${newStatus} no tiene email mapeado.`,
      );
    }

    return res
      .status(200)
      .json({ received: true, transition: `${oldStatus}->${newStatus}` });
  } catch (error) {
    console.error("[Webhook Error]", error);
    return res.status(500).json({ error: "Error interno procesando webhook" });
  }
});

export default router;
