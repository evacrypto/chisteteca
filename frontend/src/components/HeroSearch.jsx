import { useState, useEffect } from 'react';
import { contentAPI, categoriesAPI } from '../services/api';
import './HeroSearch.css';

const HeroSearch = ({ query, onQueryChange, onSubmit, loading = false }) => {
  const [stats, setStats] = useState({ content: null, categories: null });

  useEffect(() => {
    Promise.all([
      contentAPI.getAll({ limit: 1 }),
      categoriesAPI.getAll()
    ])
      .then(([contentRes, categoriesRes]) => {
        const totalContent = contentRes.data?.pagination?.total ?? null;
        const totalCategories = categoriesRes.data?.data?.length ?? null;
        setStats({ content: totalContent, categories: totalCategories });
      })
      .catch(() => {});
  }, []);

  return (
    <section className="hero-search-section">
      <div className="hero-search-overlay"></div>
      
      <div className="container hero-search-content">
        {/* Título */}
        <h1 className="hero-search-title">
          Busca <span>chistes</span>
        </h1>

        {/* Caja de búsqueda */}
        <form onSubmit={onSubmit} className="hero-search-form">
          <div className="hero-search-input-wrap">
            <input
              type="search"
              className="hero-search-input"
              placeholder="Busca aquí chistes"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              aria-label="Buscar chistes"
            />
            <button type="submit" className="hero-search-btn" disabled={loading}>
              <i className="icon-search" aria-hidden="true"></i>
              Buscar
            </button>
          </div>
        </form>

        {/* Stats */}
        <div className="hero-search-stats">
          <div className="hero-search-stat">
            <span className="stat-number">{stats.content ?? '—'}</span>
            <span className="stat-label">Chistes</span>
          </div>
          <div className="hero-search-stat">
            <span className="stat-number">{stats.categories ?? '—'}</span>
            <span className="stat-label">Categorías</span>
          </div>
          <div className="hero-search-stat">
            <span className="stat-number">∞</span>
            <span className="stat-label">Risas</span>
          </div>
          <div className="hero-search-stat">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Diversión</span>
          </div>
        </div>
      </div>

      {/* Shape Divider */}
      <div className="hero-search-shape-divider">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#ffffff" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSearch;
