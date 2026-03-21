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
const getBaseUrl = () => {
  const url = process.env.CANONICAL_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  return url.split(',')[0].trim() || 'http://localhost:3000';
};

export const sendVerificationEmail = async (to, username, token) => {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  const logoUrl = `${baseUrl}/logo_chisteteca.png`;
  const from = getFromAddress();

  const html = `
    <div style="font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="Chisteteca" width="120" height="auto" style="display: block; margin: 0 auto 12px;" />
        <p style="color: #1a1a2e; margin: 0; font-size: 14px; font-weight: 500;">Tu biblioteca de humor</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">¡Hola ${username}!</h2>
        <p style="color: #555; line-height: 1.6;">Gracias por registrarte. Haz clic en el botón para confirmar tu email:</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background: #ffc107; color: #1a1a2e !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Confirmar mi email</a>
        </p>
        <p style="color: #888; font-size: 13px;">Si no creaste esta cuenta, ignora este mensaje.</p>
        <p style="color: #999; font-size: 12px;">El enlace expira en 24 horas.</p>
      </div>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}" style="color: #e0a800; font-size: 12px;">chisteteca.es</a>
      </p>
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
