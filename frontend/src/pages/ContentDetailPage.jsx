import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { contentAPI, interactionsAPI, usersAPI, getUploadUrl, getShareUrl } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ContentCard from '../components/ContentCard';
import './ContentDetailPage.css';

const ContentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { contentIds = [], returnPath = '/' } = location.state || {};
  const { isAuthenticated, user } = useAuthStore();
  
  const [content, setContent] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [adjacent, setAdjacent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const currentUserId = user?._id || user?.id;
  const authorId = content?.author?._id || null;
  const authorName = content?.authorName || content?.author?.name || content?.author?.username || 'Autor desconocido';
  const authorAvatar = getUploadUrl(content?.author?.avatar || content?.authorAvatar) || '/logo_chisteteca.png';

  const useAdjacentNav = returnPath === '/' || returnPath === '/random';

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
      
      setContent(contentRes.data.data);
      setComments(commentsRes.data.data);
      
      const liked = contentRes.data.data.likes?.some(l => l._id === currentUserId || l === currentUserId);
      setIsLiked(liked || false);
      setLikesCount(contentRes.data.data.likes?.length || 0);

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

      if (contentRes.data.data.categories?.length > 0) {
        const relatedRes = await contentAPI.getAll({
          category: contentRes.data.data.categories[0]._id,
          limit: 7
        });
        setRelated(relatedRes.data.data.filter(c => c._id !== id).slice(0, 6));
      }
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

  if (loading) {
    return <LoadingSpinner text="Cargando contenido..." />;
  }

  if (!content) {
    return (
      <div className="not-found-container">
        <h2>Contenido no encontrado</h2>
        <Link to="/" className="btn-back">
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
              <button className="btn-back-top" onClick={() => navigate(returnPath)} title="Volver">
                <i className="icon-home" aria-hidden="true"></i>
              </button>
              {(() => {
                const idx = contentIds.indexOf(id);
                const prevId = contentIds.length > 0 && idx > 0
                  ? contentIds[idx - 1]
                  : (useAdjacentNav ? adjacent?.prev : null);
                const nextId = contentIds.length > 0 && idx >= 0 && idx < contentIds.length - 1
                  ? contentIds[idx + 1]
                  : (useAdjacentNav ? adjacent?.next : null);
                return (
                  <>
                    <button 
                      className="btn-nav-prev" 
                      onClick={() => prevId && navigate(`/content/${prevId}`, { state: { contentIds, returnPath } })}
                      disabled={!prevId}
                      title="Chiste anterior"
                    >
                      <i className="icon-arrow-left" aria-hidden="true"></i> Anterior
                    </button>
                    <button 
                      className="btn-nav-next" 
                      onClick={() => nextId && navigate(`/content/${nextId}`, { state: { contentIds, returnPath } })}
                      disabled={!nextId}
                      title="Siguiente chiste"
                    >
                      Siguiente <i className="icon-arrow-left icon-arrow-right" aria-hidden="true"></i>
                    </button>
                  </>
                );
              })()}
            </>
          ) : (
            <button className="btn-back-top" onClick={() => navigate(returnPath)} title="Volver">
              <i className="icon-home" aria-hidden="true"></i>
            </button>
          )}
        </div>

        <div className="row">
          
          {/* Main Content */}
          <div className="col-lg-9">
            
            <article className="detail-article detail-article--card-style">
              
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

            </article>

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
                <i className="icon-facebook" aria-hidden="true"></i> Facebook
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
                <i className="icon-share-alt" aria-hidden="true"></i> WhatsApp
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

          {/* Sidebar - Related Content */}
          {related.length > 0 && (
            <aside className="col-lg-3 sidebar">
              <div className="sidebar-widget related-sidebar">
                <h4>Contenido Relacionado</h4>
                <div className="related-grid related-grid--sidebar">
                  {related.map((item) => (
                    <ContentCard key={item._id} content={item} compact />
                  ))}
                </div>
              </div>
            </aside>
          )}

        </div>
      </div>
    </section>
  );
};

export default ContentDetailPage;
