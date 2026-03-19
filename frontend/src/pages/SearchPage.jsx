import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import ContentCard from '../components/ContentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import HeroSearch from '../components/HeroSearch';
import { contentAPI } from '../services/api';
import { toast } from 'react-toastify';
import './SearchPage.css';

const PAGE_SIZE = 15;

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(q);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchResults = useCallback(async (searchTerm, pageNum = 1, append = false) => {
    if (!searchTerm.trim()) {
      setContent([]);
      setHasMore(false);
      setSearched(false);
      return;
    }

    if (append) setLoadingMore(true);
    else setLoading(true);
    setSearched(true);

    try {
      const res = await contentAPI.getAll({
        search: searchTerm.trim(),
        limit: PAGE_SIZE,
        page: pageNum
      });
      const newData = res.data?.data || [];
      const pagination = res.data?.pagination;

      setContent(prev => append ? [...prev, ...newData] : newData);
      setPage(pageNum);
      setHasMore(pagination && pageNum < pagination.pages);
    } catch (error) {
      toast.error('Error al buscar');
      console.error(error);
      setContent([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setQuery(q);
    if (q) {
      fetchResults(q, 1, false);
    } else {
      setContent([]);
      setSearched(false);
    }
  }, [q, fetchResults]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = query.trim();
    if (term) {
      setSearchParams({ q: term });
    }
  };

  const handleLoadMore = () => {
    if (q) fetchResults(q, page + 1, true);
  };

  return (
    <div className="fade-in search-page">
      <HeroSearch
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <Container className="py-4">
        {loading ? (
          <LoadingSpinner text="Buscando..." />
        ) : !searched ? (
          <div className="text-center py-5 text-muted">
            <i className="icon-search mb-3" style={{ fontSize: '48px' }} aria-hidden="true"></i>
            <p>Escribe algo en el buscador para encontrar chistes</p>
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No se encontraron resultados para &quot;{q}&quot;</p>
            <p className="text-muted small">Prueba con otras palabras</p>
          </div>
        ) : (
          <>
            <p className="text-muted mb-3">
              {content.length} resultado{content.length !== 1 ? 's' : ''} para &quot;{q}&quot;
            </p>
            <Row xs={1} md={2} lg={3} className="g-4">
              {content.map((item, idx) => (
                <Col key={item._id} className="h-auto">
                  <ContentCard
                    content={item}
                    contentIds={content.map(c => c._id)}
                    currentIndex={idx}
                    returnPath="/search"
                  />
                </Col>
              ))}
            </Row>
            {hasMore && (
              <div className="text-center mt-4 mb-4">
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
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default SearchPage;
