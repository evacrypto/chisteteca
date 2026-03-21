import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

/**
 * Entry point for "Populares de siempre" - fetches 30 most popular jokes of all time
 * and redirects directly to the first one in ContentDetailPage (Jab mode).
 */
const PopularAlwaysEntryPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const goToFirstPopularAlways = async () => {
      try {
        const res = await contentAPI.getPopular({ limit: 30, period: 'all' });
        const data = res.data?.data || [];
        const ids = data.map((c) => c._id).filter(Boolean);

        if (ids.length === 0) {
          toast.info('No hay chistes populares todavía');
          navigate('/', { replace: true });
          return;
        }

        navigate(`/content/${ids[0]}`, {
          replace: true,
          state: { contentIds: ids, returnPath: '/#popular-always' }
        });
      } catch (error) {
        toast.error('Error al cargar los populares');
        navigate('/', { replace: true });
      }
    };

    goToFirstPopularAlways();
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <LoadingSpinner text="Cargando populares de siempre..." />
    </div>
  );
};

export default PopularAlwaysEntryPage;
