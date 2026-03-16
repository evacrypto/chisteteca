import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <section className="notfound-page">
      <div className="container">
        <div className="notfound-content">
          
          {/* Icono principal animado */}
          <div className="notfound-icon-wrapper">
            <div className="notfound-icon-bounce">
              <i className="notfound-main-icon icon-smile" aria-hidden="true"></i>
            </div>
            <div className="notfound-404">
              <span>4</span>
              <i className="icon-0 icon-smile" aria-hidden="true"></i>
              <span>4</span>
            </div>
          </div>

          {/* Mensaje */}
          <h1 className="notfound-title">
            ¡Vaya! Este chiste no tiene gracia
          </h1>
          
          <p className="notfound-subtitle">
            Parece que te has perdido en la Chisteteca. 
            La página que buscas no existe o se ha ido a contar chistes a otro lado.
          </p>

          {/* Frase graciosa */}
          <div className="notfound-joke">
            <p>
              <strong>¿Sabías qué?</strong> Los chistes perdidos tienen su propia categoría... 
              ¡pero esta no es una de ellas! 😄
            </p>
          </div>

          {/* Botones de acción */}
          <div className="notfound-actions">
            <Link to="/" className="btn-home">
              <i className="icon-home me-2" aria-hidden="true"></i>
              Volver al Inicio
            </Link>
            <button onClick={() => window.history.back()} className="btn-back">
              <i className="icon-arrow-left me-2" aria-hidden="true"></i>
              Página Anterior
            </button>
          </div>

          {/* Búsqueda */}
          <div className="notfound-search">
            <p>¿O quizás quieres buscar algo?</p>
            <div className="search-box">
              <input type="text" placeholder="Buscar chistes, memes..." />
              <button>
                <i className="icon-search" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          {/* Stats divertidas */}
          <div className="notfound-stats">
            <div className="nf-stat">
              <span className="stat-num">∞</span>
              <span className="stat-label">Risas disponibles</span>
            </div>
            <div className="nf-stat">
              <span className="stat-num">0</span>
              <span className="stat-label">Páginas perdidas</span>
            </div>
            <div className="nf-stat">
              <span className="stat-num">100%</span>
              <span className="stat-label">Diversión garantizada</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
