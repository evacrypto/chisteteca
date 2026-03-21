import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import './AuthForms.css';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        await authAPI.verifyEmail(token);
        setStatus('success');
        toast.success('Email verificado correctamente');
      } catch (error) {
        setStatus('error');
        toast.error(error.response?.data?.message || 'Token inválido o expirado');
      }
    };

    verify();
  }, [token]);

  return (
    <section id="auth-page" className="auth-page-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-8">
            <div className="text-center mb-5">
              <h2 className="auth-title fw-bold mb-3">
                <i className="title-icon icon-envelope" aria-hidden="true"></i>
                Verificación de email
              </h2>
            </div>

            <div className="auth-card">
              <div className="card-body text-center py-5">
                {status === 'loading' && (
                  <>
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Verificando...</span>
                    </div>
                    <p className="text-muted mb-0">Verificando tu email...</p>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <p className="text-success mb-4">
                      <i className="icon-check-circle me-2" aria-hidden="true"></i>
                      Tu cuenta ha sido verificada correctamente.
                    </p>
                    <p className="text-muted mb-4">Ya puedes iniciar sesión y disfrutar de Chisteteca.</p>
                    <Link to="/login" className="btn-submit">
                      Iniciar sesión
                    </Link>
                  </>
                )}

                {status === 'error' && (
                  <>
                    <p className="text-danger mb-4">
                      <i className="icon-times-circle me-2" aria-hidden="true"></i>
                      El enlace de verificación no es válido o ha expirado.
                    </p>
                    <p className="text-muted mb-4">
                      Puedes solicitar un nuevo email de verificación al intentar iniciar sesión.
                    </p>
                    <Link to="/login" className="btn-submit">
                      Ir a iniciar sesión
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmailPage;
