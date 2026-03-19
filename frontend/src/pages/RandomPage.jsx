import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ContentCard from '../components/ContentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { contentAPI } from '../services/api';
import { toast } from 'react-toastify';

const RANDOM_BATCH = 15;

const RandomPage = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchRandomContent = async (append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await contentAPI.getRandom(RANDOM_BATCH);
      const newData = res.data.data || [];
      setContent(prev => append ? [...prev, ...newData] : newData);
    } catch (error) {
      toast.error('Error al cargar contenido aleatorio');
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRandomContent();
  }, []);

  return (
    <div className="fade-in home-page">
      <Container className="py-4">
        {/* Header con botón de refresh */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="icon-random text-info me-2" aria-hidden="true"></i>
            CHISTES AL AZAR
          </h2>
          <button 
            onClick={() => fetchRandomContent(false)} 
            className="btn btn-outline-primary btn-sm"
            disabled={loading}
          >
            <i className={`icon-sync me-1 ${loading ? 'spinning' : ''}`} aria-hidden="true"></i>
            {loading ? 'Cargando...' : 'Nuevos aleatorios'}
          </button>
        </div>

        {/* Contenido */}
        {loading ? (
          <LoadingSpinner text="Buscando chistes aleatorios..." />
        ) : content.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No hay contenido disponible</p>
            <Link to="/" className="btn btn-primary mt-3">Volver al Inicio</Link>
          </div>
        ) : (
          <>
          <Row xs={1} md={2} lg={3} className="g-4">
            {content.map((item, idx) => (
              <Col key={item._id} className="h-auto">
                <ContentCard 
                  content={item} 
                  contentIds={content.map(c => c._id)}
                  currentIndex={idx}
                  returnPath="/random"
                />
              </Col>
            ))}
          </Row>
          <div className="text-center mt-4 mb-4">
            <button
              className="btn btn-outline-primary btn-lg"
              onClick={() => fetchRandomContent(true)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Cargando...
                </>
              ) : (
                'Cargar más'
              )}
            </button>
          </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default RandomPage;
