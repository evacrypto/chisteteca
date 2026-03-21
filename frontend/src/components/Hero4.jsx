import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { contentAPI } from '../services/api';
import './Hero4.css';

const Hero4 = () => {
  const { isAuthenticated } = useAuthStore();
  const [totalContent, setTotalContent] = useState(null);

  useEffect(() => {
    contentAPI.getAll({ limit: 1 })
      .then((res) => setTotalContent(res.data?.pagination?.total ?? null))
      .catch(() => {});
  }, []);

  return (
    <section className="hero4-section">
      <div className="hero4-overlay"></div>
      
      <div className="container hero4-content">

        {/* Logo grande centrado */}
        <div className="hero4-logo">
          <img 
            src="/logo_chisteteca.png" 
            alt="Chisteteca" 
            className="hero4-logo-image"
          />
        </div>

        {/* Título principal */}
        <h1>
          Tu plataforma de <span>humor</span> favorita
        </h1>

        {/* Subtítulo */}
        <p className="hero4-subtitle">
          Descubre, comparte y ríete con los mejores chistes, memes y videos graciosos. 
          Únete a nuestra comunidad y haz reír a miles de usuarios.
        </p>

        {/* Botones */}
        <div className="hero4-actions">
          {isAuthenticated ? (
            <>
              <Link to="/create" className="hero4-btn hero4-btn-primary">
                <i className="btn-icon icon-plus" aria-hidden="true"></i>
                Crear Contenido
              </Link>
              <Link to="/search" className="hero4-btn hero4-btn-outline">
                <i className="btn-icon icon-search" aria-hidden="true"></i>
                Buscar
              </Link>
            </>
          ) : (
            <>
              <Link to="/unete-gratis" className="hero4-btn hero4-btn-primary">
                <i className="btn-icon icon-smile" aria-hidden="true"></i>
                Únete Gratis
              </Link>
              <Link to="/login" className="hero4-btn hero4-btn-outline">
                Iniciar Sesión
              </Link>
            </>
          )}
        </div>

        {/* Stats rápidas */}
        <div className="hero4-stats">
          <div className="hero4-stat">
            <span className="stat-number">{totalContent ?? '—'}</span>
            <span className="stat-label">Chistes</span>
          </div>
          <div className="hero4-stat">
            <span className="stat-number">∞</span>
            <span className="stat-label">Risas</span>
          </div>
          <div className="hero4-stat">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Diversión</span>
          </div>
        </div>

      </div>

      {/* Shape Divider - Espejo invertido */}
      <div className="hero4-shape-divider">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#ffffff" />
        </svg>
      </div>
    </section>
  );
};

export default Hero4;
