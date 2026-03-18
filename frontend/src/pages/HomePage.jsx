import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ContentCard from '../components/ContentCard';
import CategoryFilter from '../components/CategoryFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import Hero4 from '../components/Hero4';
import { contentAPI } from '../services/api';
import './HomePage.css';

const CONTENT_LIMIT = 50;

const HomePage = () => {
  const { id: categoryId } = useParams();
  const location = useLocation();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Detectar si estamos en populares o random
  const isPopularPage = location.pathname === '/popular' || location.pathname === '/trending';
  const isRandomPage = location.pathname === '/random';
  const isSpecialPage = isPopularPage || isRandomPage || categoryId;

  // Detect category from URL
  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    } else if (location.pathname === '/') {
      setSelectedCategory(null);
    }
  }, [categoryId, location.pathname]);

  useEffect(() => {
    fetchData();
  }, [selectedCategory, isPopularPage, isRandomPage]);

  const getPageTitle = () => {
    if (isPopularPage) {
      return (
        <>
          <i className="icon-fire text-warning me-2" aria-hidden="true"></i>
          Populares de la Semana
        </>
      );
    }

    if (isRandomPage) {
      return (
        <>
          <i className="icon-random text-info me-2" aria-hidden="true"></i>
          Aleatorio
        </>
      );
    }

    if (categoryId) {
      return <>📁 Contenido por Categoría</>;
    }

    return <>📢 Último Contenido</>;
  };

  const loadContent = async () => {
    if (isPopularPage) {
      return contentAPI.getPopular(CONTENT_LIMIT);
    }

    const params = { limit: CONTENT_LIMIT };
    if (selectedCategory) params.category = selectedCategory;

    return contentAPI.getAll(params);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const contentRes = await loadContent();
      setContent(contentRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar contenido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in home-page">
      {/* Hero Section - Solo en Home */}
      {!isSpecialPage && <Hero4 />}

      {/* Category Filter - Solo en Home */}
      {!isSpecialPage && (
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {/* Latest Content */}
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">{getPageTitle()}</h2>
          {(categoryId || isPopularPage || isRandomPage) && (
            <a href="/" className="btn btn-outline-primary btn-sm">
              ← Ver todo
            </a>
          )}
        </div>
        
        {loading ? (
          <LoadingSpinner text="Cargando contenido..." />
        ) : content.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No hay contenido disponible</p>
          </div>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {content.map((item) => (
              <Col key={item._id} className="h-auto">
                <ContentCard content={item} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default HomePage;
