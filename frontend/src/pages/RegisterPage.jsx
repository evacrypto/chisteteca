import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import './AuthForms.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, login, resendVerification, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('register');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    acceptLegal: false
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'email') setShowResendVerification(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('¡Bienvenido de nuevo!');
      const user = result.user || useAuthStore.getState().user;
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile/me');
      }
    } else if (result.code === 'EMAIL_NOT_VERIFIED') {
      setShowResendVerification(true);
      toast.warning('Debes verificar tu email antes de iniciar sesión');
    } else {
      toast.error(result.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.username.length < 3) {
      toast.error('El username debe tener al menos 3 caracteres');
      return;
    }

    if (!formData.acceptLegal) {
      toast.error('Debes aceptar la Política de Privacidad y los Términos');
      return;
    }

    const result = await register(formData.email, formData.username, formData.password);

    if (result.success) {
      if (result.needsVerification) {
        toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
        setActiveTab('login');
      } else {
        toast.success('¡Cuenta creada exitosamente!');
        const user = result.user || useAuthStore.getState().user;
        const from = location.state?.from;
        if (user?.role === 'admin' && !from) {
          navigate('/admin');
        } else {
          navigate(from || '/profile/me');
        }
      }
    } else {
      toast.error(result.message);
    }
  };

  return (
    <section id="auth-page" className="auth-page-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-8">

            <div className="text-center mb-5">
              <h2 className="auth-title fw-bold mb-3">
                <i className="title-icon icon-user" aria-hidden="true"></i>
                Mi Cuenta
              </h2>
              <p className="auth-subtitle text-muted">
                Inicia sesión o crea una cuenta para comenzar a disfrutar
              </p>
            </div>

            <div className="tabs-container">

              {/* Tabs Navigation */}
              <ul className="tab-nav">
                <li className={activeTab === 'login' ? 'active' : ''}>
                  <button onClick={() => setActiveTab('login')}>
                    <i className="tab-icon icon-sign-in-alt" aria-hidden="true"></i>
                    Iniciar Sesión
                  </button>
                </li>
                <li className={activeTab === 'register' ? 'active' : ''}>
                  <button onClick={() => setActiveTab('register')}>
                    <i className="tab-icon icon-user-plus" aria-hidden="true"></i>
                    Registrarse
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content-container">

                {/* Login Tab */}
                {activeTab === 'login' && (
                  <div className="tab-content active">
                    <div className="auth-card">
                      <div className="card-body">
                        <h3 className="card-title">Accede a tu Cuenta</h3>

                        <form onSubmit={handleLogin} className="auth-form">
                          <div className="form-group">
                            <label htmlFor="login-email">
                              <i className="label-icon icon-envelope" aria-hidden="true"></i>
                              Email:
                            </label>
                            <input
                              type="email"
                              id="login-email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="form-control"
                              placeholder="tu@email.com"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="login-password">
                              <i className="label-icon icon-lock" aria-hidden="true"></i>
                              Contraseña:
                            </label>
                            <input
                              type="password"
                              id="login-password"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className="form-control auth-password-input"
                              placeholder=""
                              required
                            />
                          </div>

                          <div className="form-group">
                            <button
                              type="submit"
                              className="btn-submit"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                            </button>
                            {showResendVerification && (
                              <button
                                type="button"
                                className="btn btn-link text-primary d-block mt-2"
                                onClick={async () => {
                                  const r = await resendVerification(formData.email);
                                  if (r.success) {
                                    toast.success('Email de verificación reenviado');
                                    setShowResendVerification(false);
                                  } else {
                                    toast.error(r.message);
                                  }
                                }}
                                disabled={isLoading}
                              >
                                Reenviar email de verificación
                              </button>
                            )}
                            <Link to="/reset-password" className="forgot-link">
                              ¿Olvidaste tu contraseña?
                            </Link>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Register Tab */}
                {activeTab === 'register' && (
                  <div className="tab-content active">
                    <div className="auth-card">
                      <div className="card-body">
                        <h3 className="card-title">Crear Nueva Cuenta</h3>

                        <form onSubmit={handleRegister} className="auth-form">
                          <div className="form-group">
                            <label htmlFor="register-username">
                              <i className="label-icon icon-user" aria-hidden="true"></i>
                              Nombre de usuario:
                            </label>
                            <input
                              type="text"
                              id="register-username"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              className="form-control"
                              placeholder="introduce tu nombre"
                              autoComplete="username"
                              required
                            />
                            <small className="form-text">3-30 caracteres. Puedes usar letras, números, espacios (ej: pepe perez)</small>
                          </div>

                          <div className="form-group">
                            <label htmlFor="register-email">
                              <i className="label-icon icon-envelope" aria-hidden="true"></i>
                              Email:
                            </label>
                            <input
                              type="email"
                              id="register-email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="form-control"
                              placeholder="introduce tu email"
                              autoComplete="email"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="register-password">
                              <i className="label-icon icon-lock" aria-hidden="true"></i>
                              Contraseña:
                            </label>
                            <input
                              type="password"
                              id="register-password"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className="form-control auth-password-input"
                              placeholder="••••••••"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="register-confirm">
                              <i className="label-icon icon-lock" aria-hidden="true"></i>
                              Confirmar Contraseña:
                            </label>
                            <input
                              type="password"
                              id="register-confirm"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className="form-control auth-password-input"
                              placeholder="••••••••"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-check-label d-flex align-items-start gap-2">
                              <input
                                type="checkbox"
                                name="acceptLegal"
                                checked={formData.acceptLegal}
                                onChange={(e) => setFormData({ ...formData, acceptLegal: e.target.checked })}
                                className="form-check-input mt-1"
                              />
                              <span>
                                Acepto la <Link to="/privacidad" target="_blank" rel="noopener noreferrer">Política de Privacidad</Link> y los <Link to="/terminos" target="_blank" rel="noopener noreferrer">Términos y Condiciones</Link>
                              </span>
                            </label>
                          </div>

                          <div className="form-group">
                            <button
                              type="submit"
                              className="btn-submit"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Creando cuenta...' : 'Registrarme Ahora'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
