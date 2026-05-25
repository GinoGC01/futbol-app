import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authRepository } from "../../repositories/authRepository.js";
import OrganizadorService from "./OrganizadorService.js";
import LigaService from "./LigaService.js";
import AppError from "../../utils/AppError.js";
import {
  sendVerificationEmail,
  sendWaitlistEmail,
  sendAdminNotificationEmail,
} from "../../utils/emails/mailer.js";

export const RegistrationService = {
  /**
   * Procesa el registro diferido de un organizador y su liga.
   * Guarda los datos de forma pendiente hasta que se verifique el email.
   */
  async registerPending({
    email,
    password,
    nombre_organizador,
    telefono,
    nombre_liga,
    slug,
    zona,
    tipo_futbol,
  }) {
    console.log("--- REGISTER SERVICE DEBUG (Deferred Registration) ---");

    // 1. Validar que el email no esté ya verificado en organizador
    const existingUser = await OrganizadorService.findByEmail(email);
    if (existingUser && existingUser.email_verified) {
      throw new AppError("El email ya está registrado y verificado", 409);
    }

    // 2. Validar slug antes de crear nada
    await LigaService.validateSlug(slug);

    // 3. Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Inhabilitar registros pendientes previos del mismo email
    await authRepository.invalidateAllPendingRegistrationsForEmail(email);

    // 5. Crear registro pendiente
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

    const { error: prError } = await authRepository.createPendingRegistration({
      email,
      password_hash,
      nombre_organizador,
      telefono,
      nombre_liga,
      slug,
      zona,
      tipo_futbol,
      token,
      expires_at: expiresAt,
    });

    if (prError) {
      console.error("Error insertando registro pendiente:", prError);
      throw new AppError(
        "No se pudo procesar el registro. Intentalo de nuevo.",
        500,
      );
    }

    // 6. Enviar emails
    await sendVerificationEmail(email, token);
    await sendWaitlistEmail(email, nombre_organizador);
    await sendAdminNotificationEmail(email, nombre_organizador);

    return { token };
  }
};

export default RegistrationService;
