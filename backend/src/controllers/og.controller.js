import Content from '../models/Content.model.js';
import mongoose from 'mongoose';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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
 * Serves HTML with Open Graph meta tags for social media crawlers (Facebook, X, etc.).
 * Crawlers don't execute JavaScript, so React Helmet meta tags are invisible to them.
 * This endpoint returns static HTML that crawlers can read.
 * Humans get a redirect to the frontend.
 */
export const serveOgHtml = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).send('Invalid content ID');
    }

    const content = await Content.findById(id)
      .populate('author', 'username')
      .populate('categories', 'name')
      .lean();

    if (!content) {
      return res.status(404).send('Content not found');
    }

    const backendBase = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
    const canonicalUrl = `${frontendBase.replace(/\/$/, '')}/content/${id}`;

    const ogTitle = content.text
      ? escapeHtml(content.text.substring(0, 60) + (content.text.length > 60 ? '...' : ''))
      : 'Chiste - Chisteteca';
    const ogDescription = escapeHtml(
      content.text?.substring(0, 160) || 'Descubre este chiste en Chisteteca'
    );
    const rawImage = content.mediaUrl
      ? (content.mediaUrl.startsWith('http') ? content.mediaUrl : `${backendBase}${content.mediaUrl.startsWith('/') ? '' : '/'}${content.mediaUrl}`)
      : `${frontendBase.replace(/\/$/, '')}/logo_chisteteca.png`;
    const ogImage = rawImage;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Chisteteca">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${ogImage}">
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
  <title>${ogTitle} | Chisteteca</title>
</head>
<body>
  <p>Redirigiendo a <a href="${canonicalUrl}">Chisteteca</a>...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('OG serve error:', err);
    res.status(500).send('Error loading content');
  }
};
