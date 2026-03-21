import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const getResendClient = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    });
  }
  return null;
};

const getFromAddress = () =>
  process.env.SMTP_FROM || process.env.RESEND_FROM || '"Chisteteca" <noreply@chisteteca.es>';

/**
 * Envía email de verificación de cuenta.
 * Prioridad: Resend API (HTTPS) > SMTP.
 * @param {string} to - Email del destinatario
 * @param {string} username - Nombre de usuario
 * @param {string} token - Token de verificación
 * @returns {Promise<boolean>} true si se envió o se intentó, false si no hay config
 */
export const sendVerificationEmail = async (to, username, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  const from = getFromAddress();

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2>¡Hola ${username}!</h2>
      <p>Gracias por registrarte en Chisteteca. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
      <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #6f42c1; color: white; text-decoration: none; border-radius: 8px;">Confirmar mi email</a></p>
      <p>Si no has creado una cuenta, puedes ignorar este mensaje.</p>
      <p style="color: #666; font-size: 12px;">Este enlace expira en 24 horas.</p>
    </div>
  `;

  // Resend API (HTTPS) - no bloqueado por Railway
  const resend = getResendClient();
  if (resend) {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: 'Confirma tu cuenta en Chisteteca',
      html
    });
    if (error) {
      throw new Error(error.message);
    }
    return true;
  }

  // Fallback: SMTP
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] Sin Resend ni SMTP. Enlace de verificación:', verifyUrl);
    return false;
  }

  await transporter.sendMail({
    from,
    to,
    subject: 'Confirma tu cuenta en Chisteteca',
    html
  });
  return true;
};
