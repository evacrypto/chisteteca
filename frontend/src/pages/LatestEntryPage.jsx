import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

/**
 * Entry point for "Últimos chistes" - fetches latest content and redirects
 * directly to the first joke in ContentDetailPage (Jab mode) with navigation.
 */
const LatestEntryPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const goToFirstLatest = async () => {
      try {
        const res = await contentAPI.getAll({ limit: 30 });
        const data = res.data?.data || [];
        const ids = data.map((c) => c._id).filter(Boolean);

        if (ids.length === 0) {
          toast.info('No hay chistes todavía');
          navigate('/', { replace: true });
          return;
        }

        navigate(`/content/${ids[0]}`, {
          replace: true,
          state: { contentIds: ids, returnPath: '/' }
        });
      } catch (error) {
        toast.error('Error al cargar los últimos chistes');
        navigate('/', { replace: true });
      }
    };

    goToFirstLatest();
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <LoadingSpinner text="Cargando último chiste..." />
    </div>
  );
};

export default LatestEntryPage;
