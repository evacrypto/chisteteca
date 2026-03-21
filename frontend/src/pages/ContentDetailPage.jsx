import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { contentAPI, interactionsAPI, usersAPI, getUploadUrl, getShareUrl } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import './ContentDetailPage.css';

const ContentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { contentIds = [], returnPath = '/', navDirection } = location.state || {};
  const { isAuthenticated, user } = useAuthStore();
  
  const [content, setContent] = useState(null);
  const [comments, setComments] = useState([]);
  const [adjacent, setAdjacent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const currentUserId = user?._id || user?.id;
  const VIEWED_KEY = 'chisteteca_viewed';
  const authorId = content?.author?._id || null;
  const authorName = content?.authorName || content?.author?.name || content?.author?.username || 'Autor desconocido';
  const authorAvatar = getUploadUrl(content?.author?.avatar || content?.authorAvatar) || '/logo_chisteteca.png';

  const useAdjacentNav = returnPath === '/' || returnPath === '/random';

  // prevId/nextId para navegación (botones y gestos)
  const idx = contentIds.indexOf(id);
  const prevId = contentIds.length > 0 && idx > 0
    ? contentIds[idx - 1]
    : (useAdjacentNav ? adjacent?.prev : null);
  const nextId = contentIds.length > 0 && idx >= 0 && idx < contentIds.length - 1
    ? contentIds[idx + 1]
    : (useAdjacentNav ? adjacent?.next : null);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && nextId && !loading) {
        navigate(`/content/${nextId}`, { state: { contentIds, returnPath, navDirection: 'next' } });
      }
    },
    onSwipedRight: () => {
      if (isMobile && prevId && !loading) {
        navigate(`/content/${prevId}`, { state: { contentIds, returnPath, navDirection: 'prev' } });
      }
    },
    trackMouse: false,
    delta: 50,
    preventScrollOnSwipe: false
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (useAdjacentNav && id) {
      contentAPI.getAdjacent(id)
        .then((res) => setAdjacent(res.data.data))
        .catch(() => setAdjacent(null));
    } else {
      setAdjacent(null);
    }
  }, [id, useAdjacentNav]);

  // Scroll to top when entering the page (fixes footer visible on mobile when coming from list)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Scroll to comments if hash is present
  useEffect(() => {
    if (window.location.hash === '#comments') {
      setTimeout(() => {
        const commentsSection = document.getElementById('comments');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [comments]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contentRes, commentsRes] = await Promise.all([
        contentAPI.getOne(id),
        interactionsAPI.getComments(id, { limit: 50 })
      ]);
      
      const contentData = contentRes.data.data;
      setContent(contentData);
      setComments(commentsRes.data.data);
      
      const liked = contentData.likes?.some(l => l._id === currentUserId || l === currentUserId);
      setIsLiked(liked || false);
      setLikesCount(contentData.likes?.length || 0);

      // Registrar visita solo una vez por visitante (localStorage)
      try {
        const viewed = JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]');
        const idStr = String(id);
        if (!viewed.includes(idStr)) {
          // Guardar ANTES de la llamada para evitar doble conteo (React Strict Mode, etc.)
          const updated = [...viewed, idStr].slice(-200);
          localStorage.setItem(VIEWED_KEY, JSON.stringify(updated));
          contentAPI.registerView(id).then(() => {
            setContent((prev) => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
          }).catch(() => {});
        }
      } catch {
        // Ignorar errores de registro de vista
      }

      if (isAuthenticated) {
        try {
          const favRes = await usersAPI.getFavorites();
          const favIds = (favRes.data.data || []).map(f => String(f._id || f));
          setIsFavorite(favIds.includes(String(id)));
        } catch {
          setIsFavorite(false);
        }
      } else {
        setIsFavorite(false);
      }

      // Espacio reservado para publicidad futura (antes: contenido relacionado por categoría)
    } catch (error) {
      toast.error('Error loading content');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.info('Inicia sesión para dar risa');
      return;
    }

    try {
      await interactionsAPI.likeContent(id);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    } catch (error) {
      toast.error('Error al dar risa');
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Inicia sesión para guardar favoritos');
      return;
    }
    try {
      if (isFavorite) {
        await usersAPI.removeFromFavorites(id);
        setIsFavorite(false);
        toast.success('Eliminado de favoritos');
      } else {
        await usersAPI.addToFavorites(id);
        setIsFavorite(true);
        toast.success('Guardado en favoritos');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar favorito');
    }
  };

  const shareUrl = id ? getShareUrl(id) : window.location.href;
  const shareText = content?.text?.substring(0, 100) || 'Chiste';

  const handleComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.info('Escribe un comentario');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Inicia sesión para comentar');
      return;
    }

    setSubmittingComment(true);
    try {
      await interactionsAPI.createComment(id, { text: commentText });
      setCommentText('');
      fetchData();
      toast.success('Comentario añadido');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al comentar';
      toast.error(msg);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getChisteGradientClass = () => {
    const source = content._id || content.text || 'chiste';
    let hash = 0;
    for (let i = 0; i < source.length; i += 1) {
      hash = (hash << 5) - hash + source.charCodeAt(i);
      hash |= 0;
    }
    const gradientIndex = Math.abs(hash) % 8;
    return `content-chiste-gradient-${gradientIndex}`;
  };

  const renderContent = () => {
    switch (content.type) {
      case 'chiste':
        return (
          <div className={`content-chiste ${getChisteGradientClass()}`}>
            <p>{content.text}</p>
          </div>
        );
      
      case 'image':
        return (
          <div className="content-image-wrapper">
            <img src={getUploadUrl(content.mediaUrl) || content.mediaUrl} alt={content.text?.substring(0, 50) || 'Imagen'} className="content-image" />
          </div>
        );
      
      case 'video':
        return (
          <div className="content-video-wrapper">
            <video src={getUploadUrl(content.mediaUrl) || content.mediaUrl} controls className="content-video" />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading && !content) {
    return <LoadingSpinner text="Cargando contenido..." />;
  }

  if (!content) {
    return (
      <div className="not-found-container">
        <h2>Contenido no encontrado</h2>
        <Link to="/#home-top-cards" className="btn-back">
          <i className="icon-arrow-left me-2" aria-hidden="true"></i> Volver al inicio
        </Link>
      </div>
    );
  }

  const ogTitle = content?.text ? `${content.text.substring(0, 60)}${content.text.length > 60 ? '...' : ''}` : 'Chiste - Chisteteca';
  const ogDescription = content?.text?.substring(0, 160) || 'Descubre este chiste en Chisteteca';
  const rawImage = content?.mediaUrl ? getUploadUrl(content.mediaUrl) : '/logo_chisteteca.png';
  const ogImage = rawImage?.startsWith('http') ? rawImage : `${window.location.origin}${rawImage || '/logo_chisteteca.png'}`;
  const ogUrl = window.location.href;

  return (
    <section className="content-detail-page">
      <Helmet>
        <title>{ogTitle} | Chisteteca</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Chisteteca" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <div className="container">
        
        {/* Navigation: Anterior | Volver | Siguiente */}
        <div className="detail-nav-buttons">
          {(contentIds.length > 0 || useAdjacentNav) ? (
            <>
              <button className="btn-back-top" onClick={() => navigate(returnPath?.startsWith('/#') ? returnPath : '/#home-top-cards')} title="Volver al inicio">
                <i className="icon-home" aria-hidden="true"></i>
              </button>
              {(prevId || nextId) && (
                <span className="detail-swipe-hint">Desliza para ver más chistes</span>
              )}
              <button 
                className="btn-nav-prev btn-nav-desktop" 
                onClick={() => prevId && navigate(`/content/${prevId}`, { state: { contentIds, returnPath, navDirection: 'prev' } })}
                disabled={!prevId}
                title="Chiste anterior"
              >
                <i className="icon-arrow-left" aria-hidden="true"></i> Anterior
              </button>
              <button 
                className="btn-nav-next btn-nav-desktop" 
                onClick={() => nextId && navigate(`/content/${nextId}`, { state: { contentIds, returnPath, navDirection: 'next' } })}
                disabled={!nextId}
                title="Siguiente chiste"
              >
                Siguiente <i className="icon-arrow-left icon-arrow-right" aria-hidden="true"></i>
              </button>
            </>
          ) : (
            <button className="btn-back-top" onClick={() => navigate(returnPath?.startsWith('/#') ? returnPath : '/#home-top-cards')} title="Volver al inicio">
              <i className="icon-home" aria-hidden="true"></i>
            </button>
          )}
        </div>

        <div className="row">
          
          {/* Main Content - gestos swipe en móvil cuando hay prev/next */}
          <div 
            className="col-12" 
            style={{ position: 'relative', perspective: 1200 }}
            {...(isMobile && (prevId || nextId) ? swipeHandlers : {})}
          >
            <AnimatePresence>
              {loading && content && (
                <motion.div
                  key="loading-overlay"
                  className="content-loading-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    borderRadius: 15
                  }}
                >
                  <LoadingSpinner text="Cargando..." />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.article
                key={content?._id ?? id}
                className="detail-article detail-article--card-style"
                initial={
                  navDirection === 'prev'
                    ? { opacity: 0, x: -80, rotateY: 25 }
                    : navDirection === 'next'
                    ? { opacity: 0, x: 80, rotateY: -25 }
                    : { opacity: 0, y: 24, scale: 0.96 }
                }
                animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotateY: 0 }}
                exit={
                  navDirection === 'prev'
                    ? { opacity: 0, x: 80, rotateY: -25 }
                    : navDirection === 'next'
                    ? { opacity: 0, x: -80, rotateY: 25 }
                    : { opacity: 0, scale: 0.98 }
                }
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 30,
                  mass: 0.8
                }}
                style={{ transformOrigin: 'center center' }}
              >
              
              {/* Contenido (caja de color / imagen / vídeo) */}
              <div className="detail-content-block">
                {renderContent()}
                {content.description && (
                  <div className="article-description">
                    <p>{content.description}</p>
                  </div>
                )}
              </div>

              {/* Autor, categorías y acciones (diseño tipo ficha) */}
              <div className="card-desc">
                <div className="detail-author-categories-row">
                  <div className="card-author">
                    <span className="author-avatar-wrap">
                      <img src={authorAvatar} alt={authorName} className="author-avatar" />
                    </span>
                    {authorId ? (
                      <Link to={`/profile/${authorId}`} className="author-name">
                        {authorName}
                      </Link>
                    ) : (
                      <span className="author-name">{authorName}</span>
                    )}
                  </div>

                  {content.categories?.length > 0 && (
                    <div className="card-categories">
                    {content.categories.slice(0, 3).map((cat, idx) => (
                      <Link 
                        key={idx} 
                        to={`/category/${cat._id}`}
                        className="category-tag"
                        style={{ 
                          '--cat-color': cat.color,
                          backgroundColor: (cat.color || '#6c757d') + '20',
                          color: cat.color || '#6c757d',
                          borderColor: (cat.color || '#6c757d') + '40'
                        }}
                      >
                        {cat.emoji} {cat.name}
                      </Link>
                    ))}
                  </div>
                  )}
                </div>

                <div className="card-actions">
                  <div className="actions-left">
                    <button 
                      className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                      onClick={handleLike}
                      title="Dar risa"
                    >
                      <i className={isLiked ? 'icon-heart' : 'icon-heart-empty'} aria-hidden="true"></i>
                      <span>{likesCount}</span>
                    </button>
                    
                    <a 
                      href="#comments" 
                      className="action-btn"
                      title="Comentarios"
                    >
                      <i className="icon-comment" aria-hidden="true"></i>
                      <span>{comments.length}</span>
                    </a>
                  </div>
                  
                  <div className="actions-right">
                    <span className="views-badge action-btn" title="Visualizaciones">
                      <i className="icon-line-eye" aria-hidden="true"></i>
                      <span>{content.views || 0}</span>
                    </span>
                    <button 
                      className={`action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
                      onClick={handleToggleFavorite}
                      title="Guardar en favoritos"
                    >
                      <i className={isFavorite ? 'icon-bookmark' : 'icon-bookmark-empty'} aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </div>

            </motion.article>
            </AnimatePresence>

            {/* Share box - between joke and comments */}
            <div className="share-box">
              <h4 className="share-box-title">Compartir</h4>
              <div className="share-box-buttons">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn facebook"
                title="Compartir en Facebook"
              >
                <i className="icon-facebook" aria-hidden="true"></i>
                <span className="share-btn-text">Facebook</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn x-share"
                title="Compartir en X"
              >
                <span className="x-logo" aria-hidden="true">X</span>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn whatsapp"
                title="Compartir en WhatsApp"
              >
                <svg className="whatsapp-logo" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="share-btn-text">WhatsApp</span>
              </a>
              </div>
            </div>

            {/* Comments - right after the joke (author already shown in header) */}
            <div id="comments" className="comments-section">
              <h3 className="comments-title">
                <i className="icon-comment me-2" aria-hidden="true"></i>
                {comments.length} {comments.length === 1 ? 'Comentario' : 'Comentarios'}
              </h3>

              {/* Comment Form */}
              {isAuthenticated ? (
                <form onSubmit={handleComment} className="comment-form">
                  <div className="form-group">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escribe tu comentario..."
                      className="form-control"
                      rows={4}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-submit-comment"
                    disabled={submittingComment}
                  >
                    {submittingComment ? 'Enviando...' : 'Enviar Comentario'}
                  </button>
                </form>
              ) : (
                <div className="login-prompt">
                  <p><Link to="/login">Inicia sesión</Link> para comentar</p>
                </div>
              )}

              {/* Comments List */}
              {comments.length > 0 ? (
                <ol className="comments-list">
                  {comments.map((comment) => (
                    <li key={comment._id} className="comment-item">
                      <div className="comment-wrap">
                        <div className="comment-avatar">
                          <img 
                            src={getUploadUrl(comment.userAvatar) || '/logo_chisteteca.png'} 
                            alt={comment.username}
                          />
                        </div>
                        <div className="comment-body">
                          <div className="comment-header">
                            <strong className="comment-author">{comment.username}</strong>
                            <span className="comment-date">
                              {new Date(comment.createdAt).toLocaleDateString('es-ES', { dateStyle: 'short' })}
                            </span>
                          </div>
                          <p className="comment-text">{comment.text}</p>
                          <button className="comment-reply">
                            <i className="icon-reply me-1" aria-hidden="true"></i> Responder
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="no-comments">Sé el primero en comentar</p>
              )}
            </div>

          </div>

          {/* Sidebar - Reservado para publicidad. Oculto. Para mostrar: quitar display:none en CSS y cambiar col-12 a col-lg-9 arriba. */}
          <aside className="col-lg-3 sidebar sidebar--ad-placeholder">
            <div className="sidebar-widget sidebar-ad-slot">
              {/* Añadir aquí el banner de publicidad cuando se desee */}
            </div>
          </aside>

        </div>
      </div>
    </section>
  );
};

export default ContentDetailPage;
