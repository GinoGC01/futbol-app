import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const isMockMode = () => {
  return (
    process.env.NODE_ENV !== "production" &&
    (!process.env.EMAIL_USER ||
      process.env.EMAIL_USER === "tu_cuenta@gmail.com")
  );
};

// --- EMAIL TEMPLATE LOADER ---
const loadTemplate = (templateName, data = {}) => {
  try {
    const templatePath = path.join(
      __dirname,
      "templates",
      `${templateName}.html`,
    );
    let content = fs.readFileSync(templatePath, "utf8");

    // Add default data
    const templateData = {
      year: new Date().getFullYear(),
      ...data,
    };

    // Simple placeholder replacement: {{variable}}
    Object.keys(templateData).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, templateData[key]);
    });

    return content;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    return "";
  }
};

export const sendVerificationEmail = async (toEmail, token) => {
  const link = `${process.env.APP_URL}/admin/verify?token=${token}`;
  const expires = process.env.VERIFICATION_TOKEN_EXPIRES_HOURS || 24;

  if (isMockMode()) {
    console.log("\n--- 📧 EMAIL DE VERIFICACIÓN (MOCK) ---");
    console.log(`Para: ${toEmail}`);
    console.log(`Link: ${link}`);
    console.log("-------------------------------------\n");
    return;
  }

  const html = loadTemplate("verification", { link, expires });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@ligaamateur.com",
    to: toEmail,
    subject: "VERIFICÁ TU CUENTA - CANCHA LIBRE",
    html,
  });
};

export const sendWaitlistEmail = async (toEmail, nombre) => {
  const link = process.env.LANDING_URL || "https://canchalibre.pro";

  if (isMockMode()) {
    console.log("\n--- 📧 EMAIL DE LISTA DE ESPERA (MOCK) ---");
    console.log(`Para: ${toEmail}`);
    console.log(`Nombre: ${nombre}`);
    console.log("----------------------------------------\n");
    return;
  }

  const html = loadTemplate("waitlist", { nombre, link });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@ligaamateur.com",
    to: toEmail,
    subject: "TE AGREGAMOS A LA LISTA DE ESPERA - CANCHA LIBRE",
    html,
  });
};

export const sendWelcomeBetaEmail = async (toEmail, nombre) => {
  const link = `${process.env.APP_URL}/admin/login`;

  if (isMockMode()) {
    console.log("\n--- 📧 EMAIL DE BIENVENIDA BETA (MOCK) ---");
    console.log(`Para: ${toEmail}`);
    console.log(`Nombre: ${nombre}`);
    console.log("----------------------------------------\n");
    return;
  }

  const html = loadTemplate("welcome_beta", { nombre, link });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@ligaamateur.com",
    to: toEmail,
    subject: "¡TU CUENTA HA SIDO ACTIVADA! - CANCHA LIBRE",
    html,
  });
};

export const sendPasswordResetEmail = async (toEmail, token) => {
  const link = `${process.env.APP_URL}/admin/reset-password?token=${token}`;

  if (isMockMode()) {
    console.log("\n--- 📧 EMAIL DE RECUPERACIÓN (MOCK) ---");
    console.log(`Para: ${toEmail}`);
    console.log(`Link: ${link}`);
    console.log("--------------------------------------\n");
    return;
  }

  const html = loadTemplate("password_reset", { link });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@ligaamateur.com",
    to: toEmail,
    subject: "RECUPERACIÓN DE CONTRASEÑA - CANCHA LIBRE",
    html,
  });
};

export const sendSuspendedEmail = async (
  toEmail,
  nombre,
  motivo = "INCUMPLIMIENTO DE TÉRMINOS",
) => {
  const link = `mailto:ginociancia10@gmail.com?subject=Suspension de cuenta: ${toEmail}`;

  if (isMockMode()) {
    console.log("\n--- 📧 EMAIL DE SUSPENSIÓN (MOCK) ---");
    console.log(`Para: ${toEmail}`);
    console.log(`Motivo: ${motivo}`);
    console.log("------------------------------------\n");
    return;
  }

  const html = loadTemplate("suspended", { nombre, motivo, link });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@ligaamateur.com",
    to: toEmail,
    subject: "AVISO DE SUSPENSIÓN DE CUENTA - CANCHA LIBRE",
    html,
  });
};

export const sendReactivationEmail = async (toEmail, nombre) => {
  const link = `${process.env.APP_URL}/admin/login`;

  if (isMockMode()) {
    console.log("\n--- 📧 EMAIL DE REACTIVACIÓN (MOCK) ---");
    console.log(`Para: ${toEmail}`);
    console.log("--------------------------------------\n");
    return;
  }

  const html = loadTemplate("reactivation", { nombre, link });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@ligaamateur.com",
    to: toEmail,
    subject: "TU CUENTA HA SIDO REACTIVADA - CANCHA LIBRE",
    html,
  });
};

export const sendSubscriberEmail = async (toEmail, nombre) => {
  const link = `${process.env.APP_URL}/admin/settings`;

  if (isMockMode()) {
    console.log("\n--- 📧 EMAIL DE SUSCRIPCIÓN (MOCK) ---");
    console.log(`Para: ${toEmail}`);
    console.log("-------------------------------------\n");
    return;
  }

  const html = loadTemplate("subscriber", { nombre, link });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@ligaamateur.com",
    to: toEmail,
    subject: "¡BIENVENIDO A CANCHA LIBRE PRO! - SUSCRIPCIÓN ACTIVA",
    html,
  });
};
