import { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ContentCard from '../components/ContentCard';
import CategoryFilter from '../components/CategoryFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import Hero4 from '../components/Hero4';
import { contentAPI } from '../services/api';
import './HomePage.css';

const PAGE_SIZE = 15;

const HomePage = () => {
  const { id: categoryId } = useParams();
  const location = useLocation();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const pageRef = useRef(1);

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

  const fetchData = useCallback(async (pageNum = 1, replace = true) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    try {
      // Populares: 20 fijos, sin paginación. Inicio/categorías: 15 por página.
      const contentRes = isPopularPage
        ? await contentAPI.getPopular({ limit: 20 })
        : await contentAPI.getAll({
            limit: PAGE_SIZE,
            page: pageNum,
            ...(selectedCategory && { category: selectedCategory })
          });
      const newData = contentRes.data?.data || [];
      const pagination = contentRes.data?.pagination;

      setContent(prev => replace ? newData : [...prev, ...newData]);
      setPage(pageNum);
      pageRef.current = pageNum;
      // Populares: sin "Cargar más" (solo 20). Inicio/categorías: paginación normal.
      const moreFromPagination = !isPopularPage && pagination && pageNum < pagination.pages;
      const moreFromFullPage = !isPopularPage && newData.length >= PAGE_SIZE;
      setHasMore(newData.length > 0 && (moreFromPagination || moreFromFullPage));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar contenido');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, isPopularPage]);

  useEffect(() => {
    setPage(1);
    pageRef.current = 1;
    fetchData(1, true);
  }, [fetchData]);

  const getPageTitle = () => {
    if (isPopularPage) {
      return (
        <>
          <i className="icon-fire text-warning me-2" aria-hidden="true"></i>
          Los 20 chistes más populares de esta semana
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

    return <>📢 Últimos chistes</>;
  };

  const handleLoadMore = () => {
    fetchData(pageRef.current + 1, false);
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
            <a href="/" className="btn btn-outline-primary btn-sm text-nowrap">
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
          <>
            <Row xs={1} md={2} lg={3} className="g-4">
              {content.map((item, idx) => (
                <Col key={item._id} className="h-auto">
                  <ContentCard 
                    content={item} 
                    contentIds={content.map(c => c._id)}
                    currentIndex={idx}
                    returnPath={location.pathname}
                  />
                </Col>
              ))}
            </Row>
            <div className="text-center mt-4 mb-4">
              {hasMore ? (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-lg"
                  onClick={handleLoadMore}
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
              ) : content.length > 0 ? (
                <p className="text-muted small mb-0">
                  {content.length} chistes mostrados. No hay más.
                </p>
              ) : null}
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default HomePage;
