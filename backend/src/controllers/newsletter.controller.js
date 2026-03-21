import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import NewsletterSubscriber from '../models/NewsletterSubscriber.model.js';
import {
  sendNewsletterVerificationEmail,
  addContactToResendSegment,
  sendWeeklyDigestBroadcast,
  getOrCreateNewsletterSegment
} from '../services/newsletter.service.js';
import { protect, admin } from '../middleware/auth.middleware.js';

export const subscribeValidators = [body('email').isEmail().normalizeEmail().withMessage('Email no válido')];

/**
 * POST /api/newsletter/subscribe
 * Suscripción a la newsletter (double opt-in).
 */
export const subscribe = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Email no válido', errors: errors.array() });
    }

    const { email } = req.body;
    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });

    if (existing?.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Ya estás suscrito a la newsletter'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const verifyExpire = new Date(Date.now() + 48 * 60 * 60 * 1000);

    if (existing) {
      existing.verifyToken = token;
      existing.verifyExpire = verifyExpire;
      await existing.save();
    } else {
      await NewsletterSubscriber.create({
        email: email.toLowerCase(),
        verifyToken: token,
        verifyExpire
      });
    }

    sendNewsletterVerificationEmail(email, token).catch((err) =>
      console.error('[Newsletter] Error enviando email de confirmación:', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Revisa tu email para confirmar la suscripción'
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ success: false, message: 'Error al suscribirse' });
  }
};

/**
 * GET /api/newsletter/confirm?token=xxx
 * Confirma la suscripción y añade el contacto a Resend.
 */
export const confirm = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }

    const subscriber = await NewsletterSubscriber.findOne({
      verifyToken: token,
      verifyExpire: { $gt: new Date() }
    });

    if (!subscriber) {
      return res.status(400).json({
        success: false,
        message: 'Enlace expirado o inválido. Puedes suscribirte de nuevo.'
      });
    }

    subscriber.isVerified = true;
    subscriber.verifiedAt = new Date();
    subscriber.verifyToken = undefined;
    subscriber.verifyExpire = undefined;
    await subscriber.save();

    const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID || (await getOrCreateNewsletterSegment());
    if (segmentId) {
      addContactToResendSegment(subscriber.email, segmentId).catch((err) =>
        console.error('[Newsletter] Error añadiendo a Resend:', err.message)
      );
    }

    const baseUrl = (process.env.CANONICAL_URL || process.env.FRONTEND_URL || 'http://localhost:3000')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');

    res.redirect(`${baseUrl}/newsletter/confirmed`);
  } catch (error) {
    console.error('Newsletter confirm error:', error);
    res.status(500).json({ success: false, message: 'Error al confirmar' });
  }
};

/**
 * POST /api/newsletter/send-digest
 * Admin: envía el digest semanal a los suscriptores (Resend Broadcast).
 */
export const sendDigest = async (req, res) => {
  try {
    const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID || (await getOrCreateNewsletterSegment());
    if (!segmentId) {
      return res.status(500).json({
        success: false,
        message: 'Configura RESEND_NEWSLETTER_SEGMENT_ID o crea un segmento en Resend'
      });
    }

    const { id } = await sendWeeklyDigestBroadcast(segmentId);

    res.json({
      success: true,
      message: 'Digest enviado correctamente',
      data: { broadcastId: id }
    });
  } catch (error) {
    console.error('Newsletter send digest error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al enviar el digest'
    });
  }
};
