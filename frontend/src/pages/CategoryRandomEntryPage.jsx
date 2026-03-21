import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const PAGE_SIZE = 100;

/** Fisher-Yates shuffle - mezcla el array para empezar por un chiste aleatorio */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Entry point for category buttons. Fetches ALL jokes from the category
 * and redirects to the first one (random order) in ContentDetailPage for full navigation.
 */
const CategoryRandomEntryPage = () => {
  const { id: categoryId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAllAndNavigate = async () => {
      if (!categoryId) {
        navigate('/', { replace: true });
        return;
      }
      try {
        const allIds = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const res = await contentAPI.getAll({
            category: categoryId,
            limit: PAGE_SIZE,
            page
          });
          const data = res.data?.data || [];
          const ids = data.map((c) => c._id).filter(Boolean);
          allIds.push(...ids);
          const pagination = res.data?.pagination;
          hasMore = pagination && page < pagination.pages && ids.length === PAGE_SIZE;
          page++;
        }

        if (allIds.length === 0) {
          toast.info('No hay chistes en esta categoría');
          navigate('/', { replace: true });
          return;
        }

        const shuffledIds = shuffle(allIds);

        navigate(`/content/${shuffledIds[0]}`, {
          replace: true,
          state: { contentIds: shuffledIds, returnPath: `/category/${categoryId}` }
        });
      } catch (error) {
        toast.error('Error al cargar chistes de la categoría');
        navigate('/', { replace: true });
      }
    };

    loadAllAndNavigate();
  }, [categoryId, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <LoadingSpinner text="Cargando chistes de la categoría..." />
    </div>
  );
};

export default CategoryRandomEntryPage;
