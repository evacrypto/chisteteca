import LegalPage from './LegalPage';

const CookiesPage = () => (
  <LegalPage title="Política de Cookies">
    <p>
      En cumplimiento del artículo 22.2 de la Ley 34/2002 de Servicios de la Sociedad de la 
      Información y del Comercio Electrónico (LSSI-CE), y del RGPD, le informamos sobre el uso 
      de cookies en <strong>chisteteca.es</strong>.
    </p>

    <h2>Responsable</h2>
    <p>
      <strong>Evraristo Gundín Araújo</strong> (PURO.MARKETING)<br />
      C/ Los Lirios 7, 03186 Torrevieja, Alicante<br />
      Email: <a href="mailto:somos@puro.marketing">somos@puro.marketing</a>
    </p>

    <h2>¿Qué son las cookies?</h2>
    <p>
      Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo 
      (ordenador, móvil o tablet) cuando los visita. Permiten recordar preferencias, mantener 
      la sesión iniciada o analizar el uso del sitio.
    </p>

    <h2>Tipos de cookies que utilizamos</h2>

    <h3>Cookies técnicas (necesarias)</h3>
    <p>
      Son esenciales para el funcionamiento del sitio. No requieren consentimiento previo.
    </p>
    <ul>
      <li><strong>Sesión:</strong> mantienen el usuario identificado al navegar.</li>
      <li><strong>Seguridad:</strong> relacionadas con la autenticación y protección de la cuenta.</li>
      <li><strong>Preferencias:</strong> guardan opciones como el consentimiento de cookies.</li>
    </ul>

    <h3>Cookies analíticas</h3>
    <p>
      Utilizamos <strong>Google Analytics</strong> para conocer cómo se usa el sitio (páginas visitadas, 
      tiempo de permanencia, etc.). Estas cookies solo se activan si el usuario ha dado su 
      consentimiento mediante el banner de cookies RGPD.
    </p>
    <ul>
      <li><strong>_ga, _gid, _gat:</strong> cookies de Google Analytics para análisis estadístico.</li>
    </ul>

    <h3>Cookies de terceros</h3>
    <p>
      Google Analytics puede instalar cookies propias. Puede consultar la política de privacidad 
      de Google en: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
    </p>

    <h2>Banner de cookies RGPD</h2>
    <p>
      Al acceder al sitio por primera vez, se muestra un banner con las opciones <strong>Aceptar</strong> 
      o <strong>Rechazar</strong> las cookies no esenciales (analíticas). El consentimiento se guarda 
      para no volver a preguntar en cada visita. Las cookies analíticas solo se cargan si el usuario 
      acepta.
    </p>

    <h2>Gestión de cookies</h2>
    <p>
      También puede configurar su navegador para bloquear o eliminar cookies. En los enlaces 
      siguientes encontrará instrucciones para los navegadores más habituales:
    </p>
    <ul>
      <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
      <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
      <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
      <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
    </ul>

    <h2>Actualización</h2>
    <p>
      Esta política puede modificarse para reflejar cambios en las cookies utilizadas o en la 
      normativa aplicable.
    </p>

    <p>
      <em>Última actualización: marzo 2025</em>
    </p>
  </LegalPage>
);

export default CookiesPage;
