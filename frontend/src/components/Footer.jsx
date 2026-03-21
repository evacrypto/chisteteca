import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesAPI } from '../services/api';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoriesAPI.getAll()
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => {});
  }, []);

  return (
    <footer id="footer" className="chisteteca-footer">
      <div className="container">
        <div className="footer-widgets-wrap">
          
          {/* Banda superior con newsletter */}
          <div className="footer-band">
            <div className="row align-items-center justify-content-between">
              <div className="col-lg-5">
                <h3 className="footer-band-title mb-2">
                  <i className="title-icon icon-smile" aria-hidden="true"></i>
                  Únete a la comunidad más divertida
                </h3>
                <p className="footer-band-note mb-0">
                  Recibe los mejores chistes, memes y videos directamente en tu email. 
                  ¡Sin spam, solo risas garantizadas!
                </p>
              </div>

              <div className="col-lg-5">
                <div className="widget subscribe-widget mb-0">
                  <form className="mb-0" onSubmit={(e) => e.preventDefault()}>
                    <div className="input-group input-group-lg">
                      <input 
                        type="email" 
                        name="subscribe-email" 
                        className="form-control" 
                        placeholder="Tu email para risas semanales"
                        required
                      />
                      <button className="btn btn-primary" type="submit">
                        ¡Suscribirme!
                      </button>
                    </div>
                    <p className="subscribe-legal small mt-2 mb-0">
                      Al suscribirte aceptas nuestra <Link to="/privacidad">Política de Privacidad</Link>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Columnas principales */}
          <div className="row">
            
            {/* Columna 1: Logo + Descripción + Redes */}
            <div className="col-lg-4">
              <div className="widget">
                <Link to="/" className="footer-logo">
                  <img 
                    src="/logo_chisteteca.png" 
                    alt="Chisteteca" 
                    className="footer-logo-image"
                  />
                </Link>
                <p className="footer-description">
                  La plataforma líder en contenido humorístico en español.
                  Comparte, descubre y ríete con miles de usuarios cada día.
                </p>
                
                {/* Redes sociales */}
                <div className="footer-social">
                  <a href="#" className="social-icon facebook">
                    <i className="icon-facebook" aria-hidden="true"></i>
                  </a>
                  <a href="#" className="social-icon instagram">
                    <i className="icon-instagram" aria-hidden="true"></i>
                  </a>
                  <a href="#" className="social-icon twitter">
                    <i className="icon-twitter" aria-hidden="true"></i>
                  </a>
                  <a href="#" className="social-icon tiktok">
                    <i className="icon-tiktok" aria-hidden="true"></i>
                  </a>
                  <a href="#" className="social-icon youtube">
                    <i className="icon-youtube" aria-hidden="true"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Columna 2: Empresa */}
            <div className="col-sm-6 col-lg-2">
              <div className="widget widget_links">
                <h4 className="widget-title">Chisteteca</h4>
                <ul>
                  <li><Link to="/">Inicio</Link></li>
                  <li><Link to="/popular">Populares</Link></li>
                  <li><Link to="/random">Aleatorio</Link></li>
                  <li><Link to="/unete-gratis">Únete gratis</Link></li>
                  <li><Link to="/login">Iniciar sesión</Link></li>
                </ul>
              </div>
            </div>

            {/* Columna 3: Categorías (dinámicas desde API) */}
            <div className="col-sm-6 col-lg-2">
              <div className="widget widget_links">
                <h4 className="widget-title">Categorías</h4>
                <ul>
                  {categories.slice(0, 6).map((cat) => (
                    <li key={cat._id}>
                      <Link to={`/category/${cat._id}`}>{cat.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Columna 4: Contacto */}
            <div className="col-lg-4">
              <div className="widget">
                <h4 className="widget-title">Contacto</h4>
                <ul className="list-unstyled footer-contact mb-0">
                  <li>
                    <i className="contact-icon icon-map-marker-alt" aria-hidden="true"></i>
                    <span className="contact-text">Internet, Mundo Digital</span>
                  </li>
                  <li>
                    <a href="mailto:info@chisteteca.es" className="contact-link">
                      <i className="contact-icon icon-envelope" aria-hidden="true"></i>
                      info@chisteteca.es
                    </a>
                  </li>
                  <li>
                    <span className="contact-link">
                      <span className="contact-icon infinity-icon" aria-hidden="true">∞</span>
                      Risas
                    </span>
                  </li>
                  <li>
                    <i className="contact-icon icon-clock" aria-hidden="true"></i>
                    <span className="contact-text">Diversión 24/7</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Línea divisoria */}
          <div className="footer-divider"></div>

          {/* Copyright y enlaces legales */}
          <div className="footer-bottom">
            <div className="row align-items-center">
              <div className="col-md-6">
                <p className="copyright-text mb-0">
                  © {currentYear} Chisteteca. Todos los derechos reservados.
                  <span className="d-md-inline-block d-none mx-2">|</span>
                  Hecho con 😂 y mucho café.
                </p>
              </div>
              <div className="col-md-6">
                <div className="footer-legal">
                  <Link to="/aviso-legal">Aviso Legal</Link>
                  <Link to="/privacidad">Privacidad</Link>
                  <Link to="/cookies">Cookies</Link>
                  <Link to="/terminos">Términos</Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
