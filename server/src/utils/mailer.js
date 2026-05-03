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

// --- EMAIL TEMPLATE ENGINE ---
const getEmailTemplate = ({ title, preheader, body, ctaText, ctaLink, footerNote }) => {
  const primaryColor = '#CEDE0B'; // Lime-Yellow from design system
  const bgColor = '#0D0D0D';
  const textColor = '#EDEDED';
  const secondaryTextColor = '#A3A3A3';
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: ${textColor};
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .logo {
      height: 60px;
      margin-bottom: 20px;
    }
    
    .content-box {
      background-color: #1A1A1A;
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 40px;
      text-align: center;
      position: relative;
    }
    
    .title {
      font-family: 'Bebas Neue', 'Impact', 'Arial Black', sans-serif;
      font-size: 48px;
      line-height: 0.9;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-style: italic;
      color: ${primaryColor};
    }
    
    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
      color: ${textColor};
    }
    
    .cta-button {
      display: inline-block;
      background-color: ${primaryColor};
      color: #0D0D0D !important;
      padding: 18px 40px;
      font-family: 'Bebas Neue', 'Impact', 'Arial Black', sans-serif;
      font-size: 20px;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: bold;
      transition: all 0.3s ease;
      /* Simulated aggressive shape since clip-path has low support */
      border-left: 10px solid #B5C40A;
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: ${secondaryTextColor};
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, ${primaryColor}, transparent);
      margin: 30px 0;
      opacity: 0.3;
    }

    .footer-note {
      font-size: 10px;
      color: #555;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${appUrl}/images/logotipo.png" alt="CANCHA LIBRE" class="logo">
    </div>
    
    <div class="content-box">
      <div class="title">${title}</div>
      <div class="divider"></div>
      <div class="message">
        ${body}
      </div>
      <a href="${ctaLink}" class="cta-button">${ctaText}</a>
      
      <div class="footer-note">
        ${footerNote}
      </div>
    </div>
    
    <div class="footer">
      © ${new Date().getFullYear()} CANCHA LIBRE. RENDIMIENTO SIN COMPROMISO.
    </div>
  </div>
</body>
</html>
  `;
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

  const html = getEmailTemplate({
    title: 'VERIFICÁ TU CUENTA',
    body: 'ESTÁS A UN PASO DE TRANSFORMAR TU TORNEO. CONFIRMÁ TU IDENTIDAD PARA ACCEDER AL PANEL DE CONTROL PROFESIONAL.',
    ctaText: 'VERIFICAR AHORA',
    ctaLink: link,
    footerNote: `Este link expira en ${process.env.VERIFICATION_TOKEN_EXPIRES_HOURS || 24} horas. Si no creaste esta cuenta, ignorá este mensaje.`
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@ligaamateur.com',
    to: toEmail,
    subject: 'VERIFICÁ TU CUENTA - CANCHA LIBRE',
    html
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

  const html = getEmailTemplate({
    title: 'RECUPERAR ACCESO',
    body: 'SOLICITASTE RESTABLECER TU CONTRASEÑA. HACÉ CLICK EN EL BOTÓN PARA CONFIGURAR UNA NUEVA Y VOLVER AL JUEGO.',
    ctaText: 'RESTABLECER CONTRASEÑA',
    ctaLink: link,
    footerNote: 'Este link expira en 1 hora. Si no solicitaste este cambio, podés ignorar este mensaje de forma segura.'
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@ligaamateur.com',
    to: toEmail,
    subject: 'RECUPERACIÓN DE CONTRASEÑA - CANCHA LIBRE',
    html
  });
};

