import { Link, useNavigate } from 'react-router-dom';
import VipBadge from './VipBadge';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import { getUploadUrl } from '../services/api';
import './Navbar.css';

const BASE_NAV_ITEMS = [
  { to: '/', icon: 'icon-home', label: 'Inicio' }
];

const POPULAR_SUBMENU = [
  { to: '/popular-week', label: 'De la semana' },
  { to: '/popular-year', label: 'Del año' },
  { to: '/popular-always', label: 'De siempre' },
  { to: '/most-viewed', label: 'Los más vistos' }
];

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPopularOpen, setIsPopularOpen] = useState(false);
  const popularRef = useRef(null);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    if (!isPopularOpen) return;
    const handler = (e) => {
      if (popularRef.current && !popularRef.current.contains(e.target)) {
        setIsPopularOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isPopularOpen]);

  const handleAvatarClick = () => {
    if (isAuthenticated && user) {
      navigate('/profile/me');
    }
  };

  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
    navigate('/');
  };

  return (
    <header id="header" className="chisteteca-header">
      <div id="header-wrap">
        <div className="container">
          <div className="header-row">

            {/* Logo */}
            <div id="logo">
              <Link to="/" className="standard-logo">
                <img 
                  src="/logo_chisteteca.png" 
                  alt="Chisteteca" 
                  className="logo-image"
                />
              </Link>
            </div>

            {/* Botón móvil */}
            <button
              id="primary-menu-trigger"
              className={`mobile-menu-trigger ${isMobileMenuOpen ? 'active' : ''}`}
              type="button"
              aria-label="Abrir o cerrar menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            {/* Navegación principal */}
            <nav className={`primary-menu ${isMobileMenuOpen ? 'is-open' : ''}`}>
              <ul className="menu-container">
                {BASE_NAV_ITEMS.map((item) => (
                  <li key={item.to} className="menu-item">
                    <Link
                      to={item.to}
                      className={`menu-link ${item.className || ''}`.trim()}
                      onClick={closeMobileMenu}
                    >
                      <div><i className={`menu-icon ${item.icon}`} aria-hidden="true"></i> {item.label}</div>
                    </Link>
                  </li>
                ))}
                {/* Populares dropdown */}
                <li className="menu-item menu-item-dropdown" ref={popularRef}>
                  <button
                    type="button"
                    className={`menu-link menu-link-dropdown ${isPopularOpen ? 'is-open' : ''}`}
                    onClick={() => setIsPopularOpen((prev) => !prev)}
                    aria-expanded={isPopularOpen}
                    aria-haspopup="true"
                  >
                    <div><i className="menu-icon icon-fire" aria-hidden="true"></i> Populares <i className={`icon-chevron-${isPopularOpen ? 'up' : 'down'} dropdown-chevron`} aria-hidden="true"></i></div>
                  </button>
                  <ul className={`dropdown-menu-nav ${isPopularOpen ? 'is-open' : ''}`}>
                    {POPULAR_SUBMENU.map((sub) => (
                      <li key={sub.to}>
                        <Link
                          to={sub.to}
                          className="dropdown-item-nav"
                          onClick={() => { setIsPopularOpen(false); closeMobileMenu(); }}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="menu-item">
                  <Link to="/search" className="menu-link" onClick={closeMobileMenu}>
                    <div><i className="menu-icon icon-search" aria-hidden="true"></i> Buscar</div>
                  </Link>
                </li>
                {isAuthenticated && user?.role === 'admin' && (
                  <li className="menu-item">
                    <Link to="/admin" className="menu-link admin-link" onClick={closeMobileMenu}>
                      <div><i className="menu-icon icon-cog" aria-hidden="true"></i> Admin</div>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            {/* Acciones derecha */}
            <div className="header-misc">
              {isAuthenticated ? (
                <>
                  <Link to="/create" className="header-cta-btn">
                    <i className="btn-icon icon-plus" aria-hidden="true"></i> Crear
                  </Link>
                  
                  <div className="user-dropdown">
                    <button onClick={handleAvatarClick} className="user-avatar-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="user-avatar-wrap">
                        <img
                          src={getUploadUrl(user?.avatar) || '/logo_chisteteca.png'}
                          alt={user?.username}
                          className="user-avatar"
                        />
                      </span>
                      <span className="user-name">{user?.username}</span>
                      {user?.isVip && <VipBadge className="ms-1" />}
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                      <i className="icon-sign-out-alt" aria-hidden="true"></i> Salir
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/unete-gratis" className="header-cta-btn header-cta-btn--yellow">
                    <i className="btn-icon icon-user" aria-hidden="true"></i> Únete gratis
                  </Link>
                  <Link to="/login" className="header-login header-login--blue">
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
