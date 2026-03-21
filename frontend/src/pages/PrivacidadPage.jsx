import LegalPage from './LegalPage';

const PrivacidadPage = () => (
  <LegalPage title="Política de Privacidad">
    <p>
      En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y de la Ley Orgánica 3/2018 de Protección 
      de Datos y garantía de los derechos digitales (LOPDGDD), le informamos sobre el tratamiento 
      de sus datos personales.
    </p>

    <h2>Responsable del tratamiento</h2>
    <p>
      <strong>Identidad:</strong> Evaristo Gundin<br />
      <strong>NIF:</strong> 45563737R<br />
      <strong>Domicilio:</strong> C/ Los Lirios 7, 03180 Torrevieja (Alicante), España<br />
      <strong>Email:</strong> <a href="mailto:somos@puro.marketing">somos@puro.marketing</a>
    </p>

    <h2>Finalidad del tratamiento</h2>
    <p>Se recogen y tratan los siguientes datos con las finalidades indicadas:</p>
    <ul>
      <li><strong>Registro y cuenta de usuario:</strong> email, nombre de usuario y contraseña para crear y gestionar su cuenta.</li>
      <li><strong>Perfil:</strong> avatar, biografía y datos que el usuario decida publicar en su perfil.</li>
      <li><strong>Contenido:</strong> chistes, imágenes y vídeos que el usuario publique.</li>
      <li><strong>Comentarios:</strong> contenido de los comentarios realizados.</li>
      <li><strong>Interacciones:</strong> likes, favoritos y seguimientos a otros usuarios.</li>
      <li><strong>Newsletter:</strong> email para el envío de comunicaciones periódicas (si el usuario se suscribe).</li>
    </ul>

    <h2>Base legitimadora</h2>
    <ul>
      <li><strong>Ejecución del contrato:</strong> registro, gestión de cuenta y acceso a los servicios.</li>
      <li><strong>Consentimiento:</strong> newsletter, perfil público y preferencias.</li>
      <li><strong>Interés legítimo:</strong> mejora del servicio, seguridad y análisis estadísticos (con cookies, previo consentimiento).</li>
    </ul>

    <h2>Destinatarios</h2>
    <p>
      Los datos se almacenan en servidores de <strong>MongoDB Atlas</strong> (base de datos). 
      El sitio web está alojado en <strong>Cloudflare Pages</strong> (frontend) y <strong>Railway</strong> (backend). 
      La plataforma de newsletter puede implicar terceros proveedores de servicios de email. 
      Estos proveedores actúan como encargados del tratamiento y cumplen con el RGPD.
    </p>

    <h2>Conservación</h2>
    <p>
      Los datos se conservarán mientras dure la relación y el usuario no solicite su supresión. 
      Tras la baja, se conservarán bloqueados durante el tiempo legalmente exigible.
    </p>

    <h2>Derechos</h2>
    <p>Puede ejercer sus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición:</p>
    <ul>
      <li>Enviando un email a <a href="mailto:somos@puro.marketing">somos@puro.marketing</a></li>
      <li>Presentando una reclamación ante la Agencia Española de Protección de Datos (AEPD): <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a></li>
    </ul>

    <h2>Edad mínima</h2>
    <p>
      El registro requiere una edad mínima de 14 años. Los menores de 14 años no deben registrarse 
      sin consentimiento de sus padres o tutores.
    </p>

    <h2>Modificaciones</h2>
    <p>
      El titular se reserva el derecho de modificar esta política para adaptarla a cambios 
      legislativos o en el servicio. Se informará de cambios sustanciales.
    </p>

    <p>
      <em>Última actualización: marzo 2025</em>
    </p>
  </LegalPage>
);

export default PrivacidadPage;
