import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Hero.css';

const Hero = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <section id="hero" className="chisteteca-hero">
      <div className="hero-inner">
        {/* Overlay gradient */}
        <div className="hero-overlay"></div>

        {/* Patrón de fondo decorativo */}
        <div className="hero-pattern"></div>

        <div className="container">
          <div className="hero-content">
            {/* Icono principal animado */}
            <div className="hero-icon-wrapper" data-animate="fadeInUp">
              <div className="hero-icon-bounce">
                <i className="hero-main-icon icon-smile" aria-hidden="true"></i>
              </div>
            </div>

            {/* Título principal */}
            <h1 
              className="hero-title" 
              data-animate="fadeInUp" 
              data-delay="200"
            >
              Bienvenido a <span className="text-gradient">Chisteteca</span>
            </h1>

            {/* Subtítulo */}
            <p 
              className="hero-subtitle d-none d-md-block" 
              data-animate="fadeInUp" 
              data-delay="300"
            >
              Tu plataforma para compartir y descubrir el mejor contenido humorístico.
              Chistes, memes y videos que te harán reír a carcajadas.
            </p>

            {/* Tags decorativos */}
            <div 
              className="hero-tags" 
              data-animate="fadeInUp" 
              data-delay="400"
            >
              <span className="hero-tag">😂 Chistes</span>
              <span className="hero-tag">🖼️ Memes</span>
              <span className="hero-tag">🎬 Videos</span>
              <span className="hero-tag">🔥 Populares</span>
            </div>

            {/* Botones de acción */}
            <div 
              className="hero-buttons" 
              data-animate="fadeInUp" 
              data-delay="500"
            >
              {isAuthenticated ? (
                <>
                  <Link to="/create" className="hero-btn hero-btn-primary">
                    <i className="btn-icon icon-plus" aria-hidden="true"></i>
                    Crear Contenido
                  </Link>
                  <Link to="/popular" className="hero-btn hero-btn-outline">
                    <i className="btn-icon icon-fire" aria-hidden="true"></i>
                    Ver Populares
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="hero-btn hero-btn-primary">
                    <i className="btn-icon icon-smile" aria-hidden="true"></i>
                    Únete Ahora
                  </Link>
                  <Link to="/popular" className="hero-btn hero-btn-outline">
                    <i className="btn-icon icon-fire" aria-hidden="true"></i>
                    Explorar
                  </Link>
                </>
              )}
              
              <Link to="/random" className="hero-btn hero-btn-ghost">
                <i className="btn-icon icon-random" aria-hidden="true"></i>
                Aleatorio
              </Link>
            </div>

            {/* Stats rápidas */}
            <div 
              className="hero-stats" 
              data-animate="fadeInUp" 
              data-delay="600"
            >
              <div className="hero-stat-item">
                <span className="hero-stat-number">10+</span>
                <span className="hero-stat-label">Categorías</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat-item">
                <span className="hero-stat-number">1000+</span>
                <span className="hero-stat-label">Contenidos</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat-item">
                <span className="hero-stat-number">∞</span>
                <span className="hero-stat-label">Risas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-wheel"></div>
          </div>
          <span>Scroll</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
