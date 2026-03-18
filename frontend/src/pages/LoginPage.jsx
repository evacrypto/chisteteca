import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import './AuthForms.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('¡Bienvenido de nuevo!');
      // Redirigir según rol
      const { user } = useAuthStore.getState();
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(`/profile/${user?.id || user?._id}`);
      }
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

    // Import register from authStore
    const { register } = useAuthStore.getState();
    const result = await register(formData.email, formData.username, formData.password);
    
    if (result.success) {
      toast.success('¡Cuenta creada exitosamente!');
      // Redirigir según rol
      const { user } = useAuthStore.getState();
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(`/profile/${user?.id || user?._id}`);
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
                              className="form-control"
                              placeholder="••••••••"
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
                              Username:
                            </label>
                            <input
                              type="text"
                              id="register-username"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              className="form-control"
                              placeholder="Tu nombre de usuario"
                              required
                            />
                            <small className="form-text">3-30 caracteres, solo letras, números y guiones bajos</small>
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
                              placeholder="tu@email.com"
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
                              className="form-control"
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
                              className="form-control"
                              placeholder="••••••••"
                              required
                            />
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

export default LoginPage;
