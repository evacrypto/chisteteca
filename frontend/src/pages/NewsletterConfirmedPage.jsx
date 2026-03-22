import { Link, useSearchParams } from 'react-router-dom';
import './AuthForms.css';

const NewsletterConfirmedPage = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const messages = {
    invalid: { title: 'Enlace inválido', text: 'El enlace de confirmación no es válido. Intenta suscribirte de nuevo desde el pie de página.', type: 'warning' },
    expired: { title: 'Enlace expirado', text: 'El enlace ha caducado (válido 48 horas). Puedes suscribirte de nuevo desde el pie de página.', type: 'warning' },
    confirm: { title: 'Error al confirmar', text: 'Ha ocurrido un error. Prueba a suscribirte de nuevo desde el pie de página.', type: 'danger' }
  };

  const msg = error ? messages[error] : null;

  return (
    <section id="auth-page" className="auth-page-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-6 col-lg-8">
            <div className="text-center mb-5">
              <h2 className="auth-title fw-bold mb-3">
                <i className={`title-icon icon-${msg ? 'times-circle' : 'smile'}`} aria-hidden="true"></i>
                {msg ? msg.title : '¡Suscripción confirmada!'}
              </h2>
            </div>

            <div className="auth-card">
              <div className="card-body text-center py-5">
                {msg ? (
                  <>
                    <p className={`text-${msg.type} mb-4`}>
                      <i className="icon-times-circle me-2" aria-hidden="true"></i>
                      {msg.text}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-success mb-4">
                      <i className="icon-check-circle me-2" aria-hidden="true"></i>
                      Ya estás suscrito a la newsletter de Chisteteca.
                    </p>
                    <p className="text-muted mb-4">
                      Recibirás los mejores chistes cada semana directamente en tu email. ¡Sin spam, solo risas!
                    </p>
                  </>
                )}
                <Link to="/" className="btn-submit">
                  Ir al inicio
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
