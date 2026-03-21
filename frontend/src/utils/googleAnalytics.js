/**
 * Carga Google Analytics solo si el usuario ha dado su consentimiento.
 * Usa VITE_GA_MEASUREMENT_ID de .env o el ID por defecto de Chisteteca.
 * En producción usa Cloudflare Google Tag Gateway (first-party) para mejor compatibilidad.
 */
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-X8XJ314J27';
const CANONICAL_URL = import.meta.env.VITE_CANONICAL_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const loadGoogleAnalytics = () => {
  if (!GA_MEASUREMENT_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());

  const config = {
    anonymize_ip: true
  };
  if (CANONICAL_URL && !CANONICAL_URL.includes('localhost')) {
    config.transport_url = `${CANONICAL_URL.replace(/\/$/, '')}/analytics`;
    config.first_party_collection = true;
  }

  gtag('config', GA_MEASUREMENT_ID, config);

  window.gtag = gtag;
};
