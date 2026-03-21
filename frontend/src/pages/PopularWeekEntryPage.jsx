import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

/**
 * Entry point for "Populares de la semana" - fetches 30 most popular jokes
 * and redirects directly to the first one in ContentDetailPage (Jab mode).
 * Home button returns to /#popular-week (the popular cards section).
 */
const PopularWeekEntryPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const goToFirstPopular = async () => {
      try {
        const res = await contentAPI.getPopular({ limit: 30 });
        const data = res.data?.data || [];
        const ids = data.map((c) => c._id).filter(Boolean);

        if (ids.length === 0) {
          toast.info('No hay chistes populares todavía');
          navigate('/', { replace: true });
          return;
        }

        navigate(`/content/${ids[0]}`, {
          replace: true,
          state: { contentIds: ids, returnPath: '/#popular-week' }
        });
      } catch (error) {
        toast.error('Error al cargar los populares');
        navigate('/', { replace: true });
      }
    };

    goToFirstPopular();
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <LoadingSpinner text="Cargando populares de la semana..." />
    </div>
  );
};

export default PopularWeekEntryPage;
