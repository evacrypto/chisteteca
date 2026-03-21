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
        <p style="color: #1a1a2e; margin: 0; font-size: 14px; font-weight: 500;">La biblioteca de chistes</p>
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

/**
 * Notifica al admin que hay contenido o categorías pendientes de revisar.
 * Solo se llama cuando una cola pasa de vacía a tener elementos.
 * @param {number} pendingContent - Cantidad de chistes pendientes
 * @param {number} pendingCategories - Cantidad de categorías pendientes
 * @returns {Promise<boolean>}
 */
export const sendPendingReviewNotification = async (pendingContent, pendingCategories) => {
  const to = process.env.ADMIN_REVIEW_EMAIL || 'guillotiname@gmail.com';
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const adminUrl = `${baseUrl}/admin`;
  const logoUrl = `${baseUrl}/logo_chisteteca.png`;
  const from = getFromAddress();

  const parts = [];
  if (pendingContent > 0) parts.push(`${pendingContent} chiste${pendingContent !== 1 ? 's' : ''}`);
  if (pendingCategories > 0) parts.push(`${pendingCategories} categoría${pendingCategories !== 1 ? 's' : ''}`);
  const summary = parts.join(' y ');

  const html = `
    <div style="font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="Chisteteca" width="120" height="auto" style="display: block; margin: 0 auto 12px;" />
        <p style="color: #1a1a2e; margin: 0; font-size: 14px; font-weight: 500;">La biblioteca de chistes</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">Contenido pendiente de revisar</h2>
        <p style="color: #555; line-height: 1.6;">Hay ${summary} esperando tu aprobación en el panel de administración.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${adminUrl}" style="display: inline-block; padding: 14px 28px; background: #ffc107; color: #1a1a2e !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Ir al panel de admin</a>
        </p>
      </div>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}" style="color: #e0a800; font-size: 12px;">chisteteca.es</a>
      </p>
    </div>
  `;

  const resend = getResendClient();
  if (resend) {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Chisteteca: ${summary} pendiente${(pendingContent + pendingCategories) > 1 ? 's' : ''} de revisar`,
      html
    });
    if (error) {
      console.error('[Email] Pending review notification error:', error);
      return false;
    }
    return true;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] Sin Resend ni SMTP. No se envió notificación de revisión.');
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Chisteteca: ${summary} pendiente${(pendingContent + pendingCategories) > 1 ? 's' : ''} de revisar`,
      html
    });
    return true;
  } catch (err) {
    console.error('[Email] Pending review notification error:', err);
    return false;
  }
};

/**
 * Notifica al usuario que ha sido nombrado VIP.
 * @param {string} to - Email del usuario
 * @param {string} username - Nombre de usuario
 * @returns {Promise<boolean>}
 */
export const sendVipNotification = async (to, username) => {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const logoUrl = `${baseUrl}/logo_chisteteca.png`;
  const from = getFromAddress();
  const safeName = escapeHtml(username || 'usuario');

  const html = `
    <div style="font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="Chisteteca" width="120" height="auto" style="display: block; margin: 0 auto 12px;" />
        <p style="color: #1a1a2e; margin: 0; font-size: 14px; font-weight: 500;">La biblioteca de chistes</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">¡Hola ${safeName}!</h2>
        <p style="color: #555; line-height: 1.6;">Ahora eres un usuario VIP de la Chisteteca. Podrás subir categorías y chistes sin necesidad de aprobación.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${baseUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #ffc107, #fd7e14); color: #1a1a2e !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Ir a Chisteteca</a>
        </p>
      </div>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}" style="color: #e0a800; font-size: 12px;">chisteteca.es</a>
      </p>
    </div>
  `;

  const resend = getResendClient();
  if (resend) {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: '¡Eres usuario VIP de Chisteteca!',
      html
    });
    if (error) {
      console.error('[Email] VIP notification error:', error);
      return false;
    }
    return true;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] Sin Resend ni SMTP. No se envió notificación VIP.');
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: '¡Eres usuario VIP de Chisteteca!',
      html
    });
    return true;
  } catch (err) {
    console.error('[Email] VIP notification error:', err);
    return false;
  }
};

/**
 * Notifica al admin cuando un usuario se registra y confirma su email.
 * Un solo email cuando se cumplen ambas condiciones.
 * @param {string} username - Nombre del usuario
 * @param {string} email - Email del usuario
 * @param {Date} createdAt - Fecha de registro
 * @returns {Promise<boolean>}
 */
export const sendNewUserConfirmationNotification = async (username, email, createdAt) => {
  const to = process.env.ADMIN_NEW_USER_EMAIL || 'guillotiname@gmail.com';
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const logoUrl = `${baseUrl}/logo_chisteteca.png`;
  const from = getFromAddress();
  const safeUsername = escapeHtml(username || '');
  const safeEmail = escapeHtml(email || '');
  const dateStr = createdAt ? new Date(createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  const html = `
    <div style="font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="Chisteteca" width="120" height="auto" style="display: block; margin: 0 auto 12px;" />
        <p style="color: #1a1a2e; margin: 0; font-size: 14px; font-weight: 500;">La biblioteca de chistes</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">Nuevo usuario registrado y verificado</h2>
        <p style="color: #555; line-height: 1.6;">Un usuario se ha registrado y ha confirmado su email:</p>
        <ul style="color: #555; line-height: 1.8;">
          <li><strong>Usuario:</strong> ${safeUsername}</li>
          <li><strong>Email:</strong> ${safeEmail}</li>
          <li><strong>Registrado:</strong> ${dateStr}</li>
        </ul>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${baseUrl}/admin" style="display: inline-block; padding: 14px 28px; background: #ffc107; color: #1a1a2e !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Ir al panel de admin</a>
        </p>
      </div>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}" style="color: #e0a800; font-size: 12px;">chisteteca.es</a>
      </p>
    </div>
  `;

  const resend = getResendClient();
  if (resend) {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Chisteteca: nuevo usuario ${safeUsername} registrado y verificado`,
      html
    });
    if (error) {
      console.error('[Email] New user confirmation notification error:', error);
      return false;
    }
    return true;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] Sin Resend ni SMTP. No se envió notificación de nuevo usuario.');
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Chisteteca: nuevo usuario ${safeUsername} registrado y verificado`,
      html
    });
    return true;
  } catch (err) {
    console.error('[Email] New user confirmation notification error:', err);
    return false;
  }
};

const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Notifica al autor de un chiste que alguien ha comentado.
 * @param {string} to - Email del autor
 * @param {string} authorUsername - Nombre del autor del chiste
 * @param {string} commenterUsername - Quién comentó
 * @param {string} commentText - Texto del comentario (preview)
 * @param {string} contentId - ID del contenido para el enlace
 * @returns {Promise<boolean>}
 */
export const sendNewCommentNotification = async (to, authorUsername, commenterUsername, commentText, contentId) => {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const contentUrl = `${baseUrl}/content/${contentId}`;
  const logoUrl = `${baseUrl}/logo_chisteteca.png`;
  const from = getFromAddress();
  const commentPreview = escapeHtml(commentText?.substring(0, 150) || '');
  const commentDisplay = commentPreview + (commentText?.length > 150 ? '...' : '');

  const html = `
    <div style="font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="Chisteteca" width="120" height="auto" style="display: block; margin: 0 auto 12px;" />
        <p style="color: #1a1a2e; margin: 0; font-size: 14px; font-weight: 500;">La biblioteca de chistes</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">Nuevo comentario en tu chiste</h2>
        <p style="color: #555; line-height: 1.6;">¡Hola ${escapeHtml(authorUsername)}! <strong>${escapeHtml(commenterUsername)}</strong> ha comentado en tu chiste:</p>
        <blockquote style="margin: 16px 0; padding: 12px 16px; background: #f8f9fa; border-left: 4px solid #ffc107; color: #555; font-style: italic;">
          ${commentDisplay || '(sin texto)'}
        </blockquote>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${contentUrl}" style="display: inline-block; padding: 14px 28px; background: #ffc107; color: #1a1a2e !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Ver comentario</a>
        </p>
      </div>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}" style="color: #e0a800; font-size: 12px;">chisteteca.es</a>
      </p>
    </div>
  `;

  const resend = getResendClient();
  if (resend) {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `${commenterUsername} comentó en tu chiste - Chisteteca`,
      html
    });
    if (error) {
      console.error('[Email] New comment notification error:', error);
      return false;
    }
    return true;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] Sin Resend ni SMTP. No se envió notificación de comentario.');
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `${commenterUsername} comentó en tu chiste - Chisteteca`,
      html
    });
    return true;
  } catch (err) {
    console.error('[Email] New comment notification error:', err);
    return false;
  }
};
