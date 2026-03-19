import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setCookieConsent, needsConsent } from '../store/cookieConsentStore';
import './CookieBanner.css';

const CookieBanner = ({ onConsentChange }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(needsConsent());
  }, []);

  const handleAccept = () => {
    setCookieConsent('accepted');
    setVisible(false);
    onConsentChange?.('accepted');
  };

  const handleReject = () => {
    setCookieConsent('rejected');
    setVisible(false);
    onConsentChange?.('rejected');
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de cookies">
      <div className="cookie-banner-content">
        <p className="cookie-banner-text">
          Utilizamos cookies propias y de Google Analytics para mejorar tu experiencia y analizar 
          el uso del sitio. Puedes aceptar todas, rechazar las analíticas o ver más en nuestra{' '}
          <Link to="/cookies" className="cookie-banner-link">
            Política de Cookies
          </Link>.
        </p>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-banner-btn cookie-banner-btn-reject"
            onClick={handleReject}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="cookie-banner-btn cookie-banner-btn-accept"
            onClick={handleAccept}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
