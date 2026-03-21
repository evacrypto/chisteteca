import nodemailer from 'nodemailer';

let etherealAccount = null;

/**
 * Obtiene el transporter de nodemailer.
 * - Con SMTP configurado: usa credenciales reales.
 * - Sin SMTP: usa Ethereal (emails de prueba; no llegan al destinatario real).
 */
const getTransporter = async () => {
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
  // Sin SMTP: usar Ethereal para desarrollo (el email se puede ver en la URL de preview)
  if (!etherealAccount) {
    etherealAccount = await nodemailer.createTestAccount();
    console.log('[Email] SMTP no configurado. Usando Ethereal (emails de prueba).');
  }
  return nodemailer.createTransport({
    host: etherealAccount.smtp.host,
    port: etherealAccount.smtp.port,
    secure: etherealAccount.smtp.secure,
    auth: {
      user: etherealAccount.user,
      pass: etherealAccount.pass
    }
  });
};

/**
 * Envía email de verificación de cuenta.
 * @param {string} to - Email del destinatario
 * @param {string} username - Nombre de usuario
 * @param {string} token - Token de verificación
 * @returns {Promise<boolean>} true si se envió correctamente
 */
export const sendVerificationEmail = async (to, username, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Chisteteca" <mail@chisteteca.es>',
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

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);

    // Si usamos Ethereal, loguear la URL para ver el email en el navegador
    if (!process.env.SMTP_HOST && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[Email] Vista previa del email de verificación:', previewUrl);
      }
    }
    return true;
  } catch (err) {
    console.error('[Email] Error al enviar verificación:', err.message);
    throw err;
  }
};
