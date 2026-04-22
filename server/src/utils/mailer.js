import nodemailer from 'nodemailer';

// Creamos un transportador "dummy" por defecto si estamos en dev y no hay credenciales reales.
// En producción, esto fallaría a menos que SMTP_HOST apunte a un servidor real.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  tls: { rejectUnauthorized: false }
});

export const sendVerificationEmail = async (toEmail, token) => {
  const link = `${process.env.APP_URL}/admin/verify?token=${token}`;
  
  if (process.env.NODE_ENV !== 'production' && process.env.SMTP_HOST === 'localhost') {
    console.log('\n--- 📧 EMAIL DE VERIFICACIÓN (MOCK) ---');
    console.log(`Para: ${toEmail}`);
    console.log(`Link: ${link}`);
    console.log('-------------------------------------\n');
    return; // Simula éxito
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@tuapp.com',
    to: toEmail,
    subject: 'Verificá tu cuenta en LigaAmateur',
    html: `
      <h2>Bienvenido a LigaAmateur</h2>
      <p>Hacé click en el siguiente link para verificar tu correo electrónico:</p>
      <a href="${link}">${link}</a>
      <p><small>Este link expira en 24 horas. Si no creaste esta cuenta, ignorá este mensaje.</small></p>
    `
  });
};

export const sendPasswordResetEmail = async (toEmail, token) => {
  const link = `${process.env.APP_URL}/admin/reset-password?token=${token}`;
  
  if (process.env.NODE_ENV !== 'production' && process.env.SMTP_HOST === 'localhost') {
    console.log('\n--- 📧 EMAIL DE RECUPERACIÓN (MOCK) ---');
    console.log(`Para: ${toEmail}`);
    console.log(`Link: ${link}`);
    console.log('--------------------------------------\n');
    return; // Simula éxito
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@tuapp.com',
    to: toEmail,
    subject: 'Recuperación de contraseña - LigaAmateur',
    html: `
      <h2>Recuperación de Contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña. Hacé click en el link para continuar:</p>
      <a href="${link}">${link}</a>
      <p><small>Este link expira en 1 hora. Si no lo solicitaste, podés ignorar este mensaje.</small></p>
    `
  });
};
