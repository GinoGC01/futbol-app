import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- RESEND CLIENT ---
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "ginociancia10@gmail.com";

const isMockMode = () => {
  return process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY;
};

// --- EMAIL TEMPLATE LOADER ---
const loadTemplate = (templateName, data = {}) => {
  try {
    const templatesDir = path.join(__dirname, "templates");

    // Load Master Layout
    const layoutPath = path.join(templatesDir, "layout.html");
    let layout = fs.readFileSync(layoutPath, "utf8");

    // Load Specific Template
    const templatePath = path.join(templatesDir, `${templateName}.html`);
    let templateContent = fs.readFileSync(templatePath, "utf8");

    // Default template data
    const templateData = {
      year: new Date().getFullYear(),
      logoUrl: "https://app.canchalibre.pro/images/logotipo.webp",
      ...data,
    };

    // Replace placeholders in the specific template first
    Object.keys(templateData).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      templateContent = templateContent.replace(regex, templateData[key]);
    });

    let finalHtml = layout;

    // Replace layout placeholders
    Object.keys(templateData).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      finalHtml = finalHtml.replace(regex, templateData[key]);
    });

    // Special injection for layout fragments
    if (!data.body) {
      finalHtml = finalHtml.replace(/{{body}}/g, templateContent);
    }

    // Simple cleanup for the {{#if}} in layout
    finalHtml = finalHtml.replace(
      /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
      (match, p1, p2) => {
        return templateData[p1] ? p2 : "";
      },
    );

    return finalHtml;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    return "";
  }
};

// --- HELPER: enviar email via Resend ---
const sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      throw new Error(`Resend email failed: ${error.message}`);
    }

    console.log(
      `✅ Email enviado desde ${EMAIL_FROM} a ${to} (id: ${data?.id})`,
    );
    return data;
  } catch (err) {
    console.error("❌ Error en sendEmail:", err);
    throw err;
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

  const html = loadTemplate("verification", {
    variant: "primary",
    title: "VERIFICÁ TU CUENTA",
    ctaLink: link,
    ctaText: "VERIFICAR AHORA",
    expires,
  });

  await sendEmail({
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

  const html = loadTemplate("waitlist", {
    variant: "warning",
    title: "ESTÁS EN LA LISTA",
    ctaLink: link,
    ctaText: "CONOCER MÁS",
    nombre,
  });

  await sendEmail({
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

  const html = loadTemplate("welcome_beta", {
    variant: "primary",
    title: "ACCESO CONCEDIDO",
    ctaLink: link,
    ctaText: "INGRESAR AL PANEL",
    nombre,
  });

  await sendEmail({
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

  const html = loadTemplate("password_reset", {
    variant: "warning",
    title: "RESTABLECER CLAVE",
    ctaLink: link,
    ctaText: "CAMBIAR CONTRASEÑA",
  });

  await sendEmail({
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

  const html = loadTemplate("suspended", {
    variant: "danger",
    title: "CUENTA SUSPENDIDA",
    ctaLink: link,
    ctaText: "CONTACTAR SOPORTE",
    nombre,
    motivo,
  });

  await sendEmail({
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

  const html = loadTemplate("reactivation", {
    variant: "primary",
    title: "CUENTA REACTIVADA",
    ctaLink: link,
    ctaText: "VOLVER A ENTRAR",
    nombre,
  });

  await sendEmail({
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

  const html = loadTemplate("subscriber", {
    variant: "primary",
    title: "SUSCRIPCIÓN ACTIVA",
    ctaLink: link,
    ctaText: "VER MI PLAN",
    nombre,
  });

  await sendEmail({
    to: toEmail,
    subject: "¡BIENVENIDO A CANCHA LIBRE PRO! - SUSCRIPCIÓN ACTIVA",
    html,
  });
};
