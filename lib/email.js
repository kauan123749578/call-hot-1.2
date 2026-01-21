const nodemailer = require('nodemailer');

// Configuração do transporter de email
let transporter = null;

function initEmail() {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  // Se não tiver credenciais configuradas, usar modo de desenvolvimento (console.log)
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️  SMTP não configurado. Emails serão logados no console.');
    return null;
  }

  transporter = nodemailer.createTransport(emailConfig);
  return transporter;
}

/**
 * Envia email de recuperação de senha
 */
async function sendPasswordResetEmail(email, resetToken, baseUrl) {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"CallHot" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Recuperação de Senha - CallHot',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #d61f1f; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Recuperação de Senha</h2>
          <p>Você solicitou a recuperação de senha para sua conta CallHot.</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <a href="${resetUrl}" class="button">Redefinir Senha</a>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>Este link expira em 1 hora.</strong></p>
          <p>Se você não solicitou esta recuperação, ignore este email.</p>
          <div class="footer">
            <p>CallHot - Sistema de Chamadas Simuladas</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Recuperação de Senha - CallHot
      
      Você solicitou a recuperação de senha para sua conta CallHot.
      
      Clique no link abaixo para redefinir sua senha:
      ${resetUrl}
      
      Este link expira em 1 hora.
      
      Se você não solicitou esta recuperação, ignore este email.
    `,
  };

  if (!transporter) {
    console.log('📧 [DEV MODE] Email de recuperação de senha:');
    console.log('Para:', email);
    console.log('Token:', resetToken);
    console.log('URL:', resetUrl);
    return { messageId: 'dev-mode' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperação enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
}

/**
 * Envia email de boas-vindas
 */
async function sendWelcomeEmail(email, username) {
  const mailOptions = {
    from: `"CallHot" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Bem-vindo ao CallHot!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Bem-vindo ao CallHot, ${username}!</h2>
          <p>Sua conta foi criada com sucesso.</p>
          <p>Você já pode começar a criar chamadas simuladas e compartilhar com seus clientes.</p>
          <div class="footer">
            <p>CallHot - Sistema de Chamadas Simuladas</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  if (!transporter) {
    console.log('📧 [DEV MODE] Email de boas-vindas para:', email);
    return { messageId: 'dev-mode' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de boas-vindas enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error);
    // Não lançar erro, apenas logar
  }
}

// Inicializar ao carregar o módulo
initEmail();

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  initEmail,
};

