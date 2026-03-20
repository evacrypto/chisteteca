/**
 * Carga Google Analytics solo si el usuario ha dado su consentimiento.
 * Usa VITE_GA_MEASUREMENT_ID de .env o el ID por defecto de Chisteteca.
 */
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-X8XJ314J27';

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
  gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });

  window.gtag = gtag;
};
