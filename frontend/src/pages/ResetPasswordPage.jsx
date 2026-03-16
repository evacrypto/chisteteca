import { Link } from 'react-router-dom';

const ResetPasswordPage = () => {
  return (
    <section className="auth-page-section py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card p-4 text-center">
              <div className="mb-3">
                <i className="icon-key text-warning" style={{ fontSize: '42px' }} aria-hidden="true"></i>
              </div>
              <h2 className="mb-3">Recuperar contrasena</h2>
              <p className="text-muted mb-4">
                Esta funcionalidad estara disponible pronto.
                Por ahora, contacta al soporte para recuperar tu acceso.
              </p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <a href="mailto:soporte@chisteteca.com" className="btn btn-primary">
                  Contactar soporte
                </a>
                <Link to="/login" className="btn btn-outline-secondary">
                  <i className="icon-arrow-left me-2" aria-hidden="true"></i>Volver a login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
