import { Resend } from 'resend';
import Content from '../models/Content.model.js';

/** Cliente Resend con Sending access (solo emails.send) */
const getResendClient = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

/** Cliente Resend con Full access (broadcasts, contacts, segments). Usa RESEND_API_KEY_FULL o fallback a RESEND_API_KEY */
const getResendClientFull = () => {
  const key = process.env.RESEND_API_KEY_FULL || process.env.RESEND_API_KEY;
  if (key) {
    return new Resend(key);
  }
  return null;
};

const getFromAddress = () =>
  process.env.SMTP_FROM || process.env.RESEND_FROM || '"Chisteteca" <noreply@chisteteca.es>';

const getBaseUrl = () => {
  const url = process.env.CANONICAL_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  return url.split(',')[0].trim().replace(/\/$/, '') || 'http://localhost:3000';
};

const getBackendUrl = () => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return 'http://localhost:5000';
};

/**
 * Envía email de confirmación de suscripción a la newsletter (double opt-in).
 */
export const sendNewsletterVerificationEmail = async (email, token) => {
  const baseUrl = getBaseUrl();
  const backendUrl = getBackendUrl();
  const confirmUrl = `${backendUrl}/api/newsletter/confirm?token=${token}`;
  const logoUrl = `${baseUrl}/logo_chisteteca.png`;
  const from = getFromAddress();

  const html = `
    <div style="font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="Chisteteca" width="120" height="auto" style="display: block; margin: 0 auto 12px;" />
        <p style="color: #1a1a2e; margin: 0; font-size: 14px; font-weight: 500;">La biblioteca de chistes</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">¡Confirma tu suscripción!</h2>
        <p style="color: #555; line-height: 1.6;">Recibirás los mejores chistes cada semana. Haz clic para confirmar:</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${confirmUrl}" style="display: inline-block; padding: 14px 28px; background: #ffc107; color: #1a1a2e !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Confirmar suscripción</a>
        </p>
        <p style="color: #888; font-size: 13px;">Si no te suscribiste, ignora este mensaje.</p>
        <p style="color: #999; font-size: 12px;">El enlace expira en 48 horas.</p>
      </div>
      <p style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}" style="color: #e0a800; font-size: 12px;">chisteteca.es</a>
      </p>
    </div>
  `;

  const resend = getResendClient();
  if (!resend) {
    console.log('[Newsletter] Sin Resend. Enlace de confirmación:', confirmUrl);
    return false;
  }

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: 'Confirma tu suscripción a Chisteteca',
    html
  });
  if (error) throw new Error(error.message);
  return true;
};

/**
 * Añade un contacto verificado al segmento de Resend para recibir broadcasts.
 */
export const addContactToResendSegment = async (email, segmentId) => {
  const resend = getResendClientFull();
  if (!resend || !segmentId) return false;

  const { error: createError } = await resend.contacts.create({
    email,
    segments: [{ id: segmentId }],
    unsubscribed: false
  });

  if (!createError) return true;

  if (createError.message?.toLowerCase().includes('already exists') || createError.name === 'validation_error') {
    const { error: addError } = await resend.contacts.segments.add({ email, segmentId });
    if (!addError) return true;
  }

  throw new Error(createError.message);
};

/**
 * Crea y envía un broadcast con los chistes de la semana.
 * @param {string} segmentId - ID del segmento en Resend
 * @returns {Promise<{id: string}>}
 */
export const sendWeeklyDigestBroadcast = async (segmentId) => {
  const resend = getResendClientFull();
  if (!resend || !segmentId) {
    throw new Error('RESEND_API_KEY (o RESEND_API_KEY_FULL) y RESEND_NEWSLETTER_SEGMENT_ID son requeridos');
  }

  const content = await Content.find({ isApproved: true, isRejected: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('categories', 'name emoji')
    .lean();

  const baseUrl = getBaseUrl();
  const logoUrl = `${baseUrl}/logo_chisteteca.png`;
  const from = getFromAddress();

  const jokesHtml = content
    .map((c) => {
      const text = c.text ? `<p style="color: #333; line-height: 1.6; margin: 0 0 12px;">${escapeHtml(c.text)}</p>` : '';
      const link = c._id ? `<a href="${baseUrl}/content/${c._id}" style="color: #e0a800; font-size: 13px;">Ver chiste →</a>` : '';
      const cats = c.categories?.length
        ? `<span style="color: #888; font-size: 12px;">${c.categories.map((cat) => cat.emoji || '').join(' ')}</span>`
        : '';
      return `<div style="border-bottom: 1px solid #eee; padding: 16px 0;">${text}${link} ${cats}</div>`;
    })
    .join('');

  const html = `
    <div style="font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="Chisteteca" width="120" height="auto" style="display: block; margin: 0 auto 12px;" />
        <p style="color: #1a1a2e; margin: 0; font-size: 14px; font-weight: 500;">La biblioteca de chistes</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">😂 Los mejores chistes de la semana</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">Hola {{{FIRST_NAME|amigo}}}, aquí tienes una selección de chistes para que te rías un rato:</p>
        ${jokesHtml}
        <p style="text-align: center; margin-top: 24px;">
          <a href="${baseUrl}" style="display: inline-block; padding: 14px 28px; background: #ffc107; color: #1a1a2e !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Ver más en Chisteteca</a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 24px; text-align: center;">
          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #999;">Darse de baja</a>
        </p>
      </div>
    </div>
  `;

  const { data, error } = await resend.broadcasts.create({
    segmentId,
    from,
    subject: '😂 Los mejores chistes de la semana - Chisteteca',
    html,
    name: `Chisteteca digest ${new Date().toISOString().slice(0, 10)}`,
    send: true
  });

  if (error) throw new Error(error.message);
  return { id: data.id };
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
 * Crea el segmento en Resend si no existe. Devuelve el ID.
 */
export const getOrCreateNewsletterSegment = async () => {
  const resend = getResendClientFull();
  if (!resend) return null;

  const existingId = process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  if (existingId) return existingId;

  const { data: list } = await resend.segments.list();
  const segments = list?.data || [];
  const chisteteca = Array.isArray(segments) ? segments.find((s) => s.name === 'Chisteteca Newsletter') : null;
  if (chisteteca) return chisteteca.id;

  const { data: created, error } = await resend.segments.create({ name: 'Chisteteca Newsletter' });
  if (error) throw new Error(error.message);
  return created?.id || null;
};
