import nodemailer from 'nodemailer';

/**
 * Crea el transporter de nodemailer.
 * En desarrollo sin SMTP configurado, usa Ethereal (credenciales de prueba).
 */
const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  // Sin SMTP: en desarrollo se puede usar Ethereal o simplemente loguear
  return null;
};

/**
 * Envía email de verificación de cuenta.
 * @param {string} to - Email del destinatario
 * @param {string} username - Nombre de usuario
 * @param {string} token - Token de verificación
 * @returns {Promise<boolean>} true si se envió, false si no hay SMTP
 */
export const sendVerificationEmail = async (to, username, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] SMTP no configurado. Enlace de verificación:', verifyUrl);
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Chisteteca" <noreply@chisteteca.es>',
    to,
    subject: 'Confirma tu cuenta en Chisteteca',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>¡Hola ${username}!</h2>
        <p>Gracias por registrarte en Chisteteca. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
        <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #6f42c1; color: white; text-decoration: none; border-radius: 8px;">Confirmar mi email</a></p>
        <p>Si no has creado una cuenta, puedes ignorar este mensaje.</p>
        <p style="color: #666; font-size: 12px;">Este enlace expira en 24 horas.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  return true;
};
