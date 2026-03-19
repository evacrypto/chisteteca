const COOKIE_CONSENT_KEY = 'chisteteca_cookie_consent';

export const getCookieConsent = () => localStorage.getItem(COOKIE_CONSENT_KEY);

export const setCookieConsent = (value) => {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
};

export const hasAcceptedCookies = () => getCookieConsent() === 'accepted';
export const hasRejectedCookies = () => getCookieConsent() === 'rejected';
export const needsConsent = () => !getCookieConsent();
