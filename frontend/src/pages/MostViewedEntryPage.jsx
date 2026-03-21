import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

/**
 * Entry point for "Los más vistos" - fetches 30 most viewed jokes
 * and redirects directly to the first one in ContentDetailPage (Jab mode).
 * Home button returns to /#most-viewed (the most viewed card).
 */
const MostViewedEntryPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const goToFirstMostViewed = async () => {
      try {
        const res = await contentAPI.getAll({
          limit: 30,
          sortBy: 'views',
          sortOrder: 'desc'
        });
        const data = res.data?.data || [];
        const ids = data.map((c) => c._id).filter(Boolean);

        if (ids.length === 0) {
          toast.info('No hay chistes todavía');
          navigate('/', { replace: true });
          return;
        }

        navigate(`/content/${ids[0]}`, {
          replace: true,
          state: { contentIds: ids, returnPath: '/#most-viewed' }
        });
      } catch (error) {
        toast.error('Error al cargar los más vistos');
        navigate('/', { replace: true });
      }
    };

    goToFirstMostViewed();
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <LoadingSpinner text="Cargando los más vistos..." />
    </div>
  );
};

export default MostViewedEntryPage;
