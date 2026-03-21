import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

/**
 * Entry point for "Populares del año" - fetches 30 most popular jokes of the current year
 * (sorted by likes) and redirects directly to the first one in ContentDetailPage (Jab mode).
 * Home button returns to /#popular-year (the popular of the year card).
 */
const PopularYearEntryPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const goToFirstPopularYear = async () => {
      try {
        const res = await contentAPI.getPopular({ limit: 30, period: 'year' });
        const data = res.data?.data || [];
        const ids = data.map((c) => c._id).filter(Boolean);

        if (ids.length === 0) {
          toast.info('No hay chistes populares del año todavía');
          navigate('/', { replace: true });
          return;
        }

        navigate(`/content/${ids[0]}`, {
          replace: true,
          state: { contentIds: ids, returnPath: '/#popular-year' }
        });
      } catch (error) {
        toast.error('Error al cargar los populares del año');
        navigate('/', { replace: true });
      }
    };

    goToFirstPopularYear();
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <LoadingSpinner text="Cargando populares del año..." />
    </div>
  );
};

export default PopularYearEntryPage;
