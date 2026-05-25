import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { authRepository } from "../../repositories/authRepository.js";
import OrganizadorService from "../../services/identity/OrganizadorService.js";
import LigaService from "../../services/identity/LigaService.js";
import AppError from "../../utils/AppError.js";
import { isDeployed } from "../../utils/envHelpers.js";
import { signToken, setTokenCookie } from "../../utils/jwtUtils.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWaitlistEmail,
  sendAdminNotificationEmail,
} from "../../utils/emails/mailer.js";

/**
 * POST /api/identity/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Email y contraseña son requeridos", 400);
    }

    // 1. Buscar organizador
    const organizador = await OrganizadorService.findByEmail(email);
    if (!organizador || !organizador.password_hash) {
      throw new AppError("Credenciales inválidas", 401);
    }

    // 2. Verificar email y periodo de gracia
    if (!organizador.email_verified) {
      const cutoffDateString =
        process.env.REQUIRE_VERIFICATION_AFTER_DATE || "2026-04-12";
      const cutoffDate = new Date(cutoffDateString);
      const userCreatedAt = new Date(organizador.created_at);

      // Si el usuario es nuevo (CÓDIGO POSTERIOR a la fecha de corte) NO tiene gracia.
      if (userCreatedAt >= cutoffDate) {
        throw new AppError(
          "Debés verificar tu email antes de iniciar sesión.",
          403,
        );
      } else {
        // Usuario viejo (ANTERIOR a la fecha de corte), tiene 7 días de gracia desde SU fecha de creación
        const msIn7Days = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - userCreatedAt.getTime() > msIn7Days) {
          throw new AppError(
            "Tu período de gracia expiró. Debés verificar tu email para continuar.",
            403,
          );
        }
        // Si está dentro de los 7 días de gracia, lo dejamos pasar.
      }
    }

    // 3. Verificar contraseña
    const isMatch = await bcrypt.compare(password, organizador.password_hash);
    if (!isMatch) {
      throw new AppError("Credenciales inválidas", 401);
    }

    // 4. Generar token
    const token = signToken(organizador.id, organizador.email);
    setTokenCookie(res, token);

    res.status(200).json({
      status: "success",
      data: {
        token,
        user: {
          id: organizador.id,
          nombre: organizador.nombre,
          email: organizador.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/identity/logout
 */
export async function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isDeployed(),
    sameSite: isDeployed() ? "none" : "lax",
  });
  res.status(200).json({ status: "success" });
}

/**
 * POST /api/identity/verify-email
 */
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) throw new AppError("Token requerido", 400);

    // 1. Buscar el registro pendiente
    const { data: pr, error } = await authRepository.findPendingRegistrationByToken(token);

    if (error || !pr) {
      throw new AppError(
        "El link de verificación es inválido o ha expirado.",
        410,
      );
    }

    // 2. Verificar que el email no se haya registrado entre medio (race condition)
    const existingUser = await OrganizadorService.findByEmail(pr.email);
    if (existingUser && existingUser.email_verified) {
      await authRepository.markPendingRegistrationAsUsed(pr.id);
      throw new AppError("Este email ya fue verificado previamente.", 409);
    }

    // 3. CREACIÓN REAL: Organizador + Liga (Todo en una "transacción" lógica)
    // Si el organizador ya existe (pero no estaba verificado), lo actualizamos.
    let organizadorId;
    if (existingUser) {
      organizadorId = existingUser.id;
      await authRepository.updateOrganizador(organizadorId, {
        nombre: pr.nombre_organizador,
        password_hash: pr.password_hash,
        telefono: pr.telefono,
        email_verified: true,
        status: "pending",
      });
    } else {
      const { data: newOrg, error: orgErr } = await authRepository.createOrganizador({
        nombre: pr.nombre_organizador,
        email: pr.email,
        password_hash: pr.password_hash,
        telefono: pr.telefono,
        email_verified: true,
        status: "pending",
      });

      if (orgErr) {
        console.error(
          "Error insertando organizador desde registro pendiente:",
          orgErr,
        );
        throw new AppError("Error al crear el perfil del organizador", 500);
      }
      organizadorId = newOrg.id;
    }

    // Crear la liga
    await LigaService.createLiga(organizadorId, {
      nombre: pr.nombre_liga,
      slug: pr.slug,
      zona: pr.zona,
      tipo_futbol: pr.tipo_futbol,
    });

    // 4. Marcar registro como usado
    await authRepository.markPendingRegistrationAsUsed(pr.id);

    res.json({
      status: "success",
      message:
        "¡Cuenta creada exitosamente! Tu acceso está en lista de espera.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/identity/resend-verification
 */
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw new AppError("Email requerido", 400);

    // Buscar si hay un registro pendiente activo para ese email
    const { data: pr, error } = await authRepository.findLatestPendingRegistrationByEmail(email);

    // Respondemos siempre OK para no revelar datos, igual que antes
    if (!pr) {
      return res
        .status(200)
        .json({
          status: "success",
          message: "Si el registro está pendiente, recibirás un nuevo link.",
        });
    }

    // Rate limit (1 minuto)
    if (new Date(pr.created_at).getTime() > Date.now() - 60000) {
      throw new AppError(
        "Por favor, esperá al menos 1 minuto antes de solicitar otro email.",
        429,
      );
    }

    // Generar nuevo token para el mismo registro (o uno nuevo)
    const newToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    await authRepository.updatePendingRegistrationToken(pr.id, newToken, expiresAt);

    // Email de verificación aislado
    try {
      await sendVerificationEmail(email, newToken);
    } catch (emailError) {
      console.error(
        "[Email Warning] sendVerificationEmail failed, process continues:",
        emailError.message,
      );
    }

    res
      .status(200)
      .json({
        status: "success",
        message: "Si el registro está pendiente, recibirás un nuevo link.",
      });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/identity/forgot-password
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw new AppError("Email requerido", 400);

    const user = await OrganizadorService.findByEmail(email);
    if (!user) {
      return res
        .status(200)
        .json({
          status: "success",
          message:
            "Si el email está registrado, enviaremos un link de recuperación.",
        });
    }

    // Rate limit (1 min)
    const { data: recentTokens } = await authRepository.findRecentPasswordResetTokens(user.id);

    if (recentTokens && recentTokens.length > 0) {
      throw new AppError(
        "Esperá 1 minuto antes de solicitar otro link.",
        429,
      );
    }

    await authRepository.invalidateAllPasswordResetTokensForUser(user.id);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    await authRepository.createPasswordResetToken(user.id, token, expiresAt);
    // Email de recuperación aislado
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (emailError) {
      console.error(
        "[Email Warning] sendPasswordResetEmail failed, process continues:",
        emailError.message,
      );
    }

    res
      .status(200)
      .json({
        status: "success",
        message:
          "Si el email está registrado, enviaremos un link de recuperación.",
      });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/identity/reset-password
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      throw new AppError("Token y nueva contraseña son requeridos", 400);
    if (password.length < 6)
      throw new AppError(
        "La contraseña debe tener al menos 6 caracteres",
        400,
      );

    const { data: tokenData, error } = await authRepository.findPasswordResetToken(token);

    if (error || !tokenData)
      throw new AppError("Token de recuperación inválido o expirado", 410);

    const password_hash = await bcrypt.hash(password, 10);

    await authRepository.updateOrganizador(tokenData.user_id, { password_hash });
    await authRepository.markPasswordResetTokenAsUsed(tokenData.id);

    res.json({
      status: "success",
      message:
        "Contraseña actualizada exitosamente. Ya podés iniciar sesión con tu nueva clave.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/identity/change-password
 * Requiere estar autenticado (via middleware requireAuth)
 */
export async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      throw new AppError("Faltan datos de contraseña", 400);
    if (newPassword.length < 6)
      throw new AppError(
        "La nueva contraseña debe tener al menos 6 caracteres",
        400,
      );

    const organizadorId = req.organizador.id;

    // Conseguir el hash viejo real
    const { data: userData, error } = await authRepository.findOrganizadorPasswordHash(organizadorId);

    if (error || !userData) throw new AppError("Usuario no encontrado", 404);

    // Verificar que coincida con el oldPassword
    const isMatch = await bcrypt.compare(oldPassword, userData.password_hash);
    if (!isMatch)
      throw new AppError("La contraseña actual es incorrecta", 401);

    const password_hash = await bcrypt.hash(newPassword, 10);
    await authRepository.updateOrganizador(organizadorId, { password_hash });

    res.json({
      status: "success",
      message: "Contraseña cambiada exitosamente.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/identity/google
 */
export async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) throw new AppError("Token de Google requerido", 400);

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    // 1. Buscar si ya existe el organizador por email
    let organizador = await OrganizadorService.findByEmail(email);

    if (!organizador) {
      // 2. Si no existe, lo creamos (Login Social) -> Entra como PENDING
      const { data: newOrg, error: orgErr } = await authRepository.createOrganizador({
        nombre: name,
        email: email,
        email_verified: true,
        status: "pending",
        // No seteamos password_hash ya que entra por Google
      });

      if (orgErr) throw new AppError("Error al crear perfil con Google", 500);
      organizador = newOrg;

      // Enviar email de lista de espera para nuevos usuarios de Google (aislado)
      try {
        await sendWaitlistEmail(email, name);
        await sendAdminNotificationEmail(email, name);
      } catch (emailError) {
        console.error(
          "[Email Warning] sendWaitlistEmail failed, login continues:",
          emailError.message,
        );
      }
    } else if (!organizador.email_verified) {
      // Si ya existe pero no estaba verificado, lo verificamos ahora que entró por Google
      await authRepository.updateOrganizador(organizador.id, { email_verified: true });
    }

    // 3. Generar nuestro JWT
    const token = signToken(organizador.id, organizador.email);
    setTokenCookie(res, token);

    res.status(200).json({
      status: "success",
      data: {
        token,
        user: {
          id: organizador.id,
          nombre: organizador.nombre,
          email: organizador.email,
          status: organizador.status,
        },
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    next(new AppError("Error en la autenticación con Google", 401));
  }
}

export const AuthController = {
  login,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  googleLogin
};

export default AuthController;
