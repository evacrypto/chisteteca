import { Link } from 'react-router-dom';
import './AuthForms.css';

const NewsletterConfirmedPage = () => {
  return (
    <section id="auth-page" className="auth-page-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-8">
            <div className="text-center mb-5">
              <h2 className="auth-title fw-bold mb-3">
                <i className="title-icon icon-smile" aria-hidden="true"></i>
                ¡Suscripción confirmada!
              </h2>
            </div>

            <div className="auth-card">
              <div className="card-body text-center py-5">
                <p className="text-success mb-4">
                  <i className="icon-check-circle me-2" aria-hidden="true"></i>
                  Ya estás suscrito a la newsletter de Chisteteca.
                </p>
                <p className="text-muted mb-4">
                  Recibirás los mejores chistes cada semana directamente en tu email. ¡Sin spam, solo risas!
                </p>
                <Link to="/" className="btn-submit">
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterConfirmedPage;
