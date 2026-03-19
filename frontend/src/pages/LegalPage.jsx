import { Link } from 'react-router-dom';
import './LegalPage.css';

const LegalPage = ({ title, children }) => (
  <section className="legal-page">
    <div className="container">
      <div className="legal-content">
        <Link to="/" className="legal-back">
          <i className="icon-arrow-left me-2" aria-hidden="true"></i>
          Volver al inicio
        </Link>
        <h1 className="legal-title">{title}</h1>
        <div className="legal-body">
          {children}
        </div>
      </div>
    </div>
  </section>
);

export default LegalPage;
