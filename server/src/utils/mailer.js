import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

const isMockMode = () => {
  return (
    process.env.NODE_ENV !== 'production' && 
    (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'tu_cuenta@gmail.com')
  );
};

export const sendVerificationEmail = async (toEmail, token) => {
  const link = `${process.env.APP_URL}/admin/verify?token=${token}`;
  
  if (isMockMode()) {
    console.log('\n--- 📧 EMAIL DE VERIFICACIÓN (MOCK) ---');
    console.log(`Para: ${toEmail}`);
    console.log(`Link: ${link}`);
    console.log('-------------------------------------\n');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@ligaamateur.com',
    to: toEmail,
    subject: 'Verificá tu cuenta en LigaAmateur',
    html: `
      <h2>Bienvenido a LigaAmateur</h2>
      <p>Hacé click en el siguiente link para verificar tu correo electrónico:</p>
      <a href="${link}">${link}</a>
      <p><small>Este link expira en ${process.env.VERIFICATION_TOKEN_EXPIRES_HOURS || 24} horas. Si no creaste esta cuenta, ignorá este mensaje.</small></p>
    `
  });
};

export const sendPasswordResetEmail = async (toEmail, token) => {
  const link = `${process.env.APP_URL}/admin/reset-password?token=${token}`;
  
  if (isMockMode()) {
    console.log('\n--- 📧 EMAIL DE RECUPERACIÓN (MOCK) ---');
    console.log(`Para: ${toEmail}`);
    console.log(`Link: ${link}`);
    console.log('--------------------------------------\n');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@ligaamateur.com',
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

