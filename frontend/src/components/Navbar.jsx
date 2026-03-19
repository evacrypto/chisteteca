import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { getUploadUrl } from '../services/api';
import './Navbar.css';

const BASE_NAV_ITEMS = [
  { to: '/', icon: 'icon-home', label: 'Inicio' },
  { to: '/popular', icon: 'icon-fire', label: 'Populares' },
  { to: '/random', icon: 'icon-random', label: 'Aleatorio' },
  { to: '/search', icon: 'icon-search', label: 'Buscar' }
];

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleAvatarClick = () => {
    if (isAuthenticated && user) {
      navigate('/profile/me');
    }
  };

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(isAuthenticated && user?.role === 'admin'
      ? [{ to: '/admin', icon: 'icon-cog', label: 'Admin', className: 'admin-link' }]
      : [])
  ];

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
                {navItems.map((item) => (
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
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                      <i className="icon-sign-out-alt" aria-hidden="true"></i> Salir
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="header-login">
                    Iniciar sesión
                  </Link>
                  <Link to="/register" className="header-cta-btn">
                    <i className="btn-icon icon-user" aria-hidden="true"></i> Únete
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
