import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { contentAPI, interactionsAPI, getUploadUrl } from '../services/api';
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
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  const currentUserId = user?._id || user?.id;
  const authorId = content?.author?._id || null;
  const authorName = content?.authorName || content?.author?.name || content?.author?.username || 'Autor desconocido';
  const authorAvatar = getUploadUrl(content?.author?.avatar || content?.authorAvatar) || '/logo_chisteteca.png';

  useEffect(() => {
    fetchData();
  }, [id]);

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

      // Get related content (same category)
      if (contentRes.data.data.categories?.length > 0) {
        const relatedRes = await contentAPI.getAll({
          category: contentRes.data.data.categories[0]._id,
          limit: 4
        });
        setRelated(relatedRes.data.data.filter(c => c._id !== id).slice(0, 3));
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: content.text?.substring(0, 50) || 'Chiste',
          text: content.text?.substring(0, 100),
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Error al compartir');
      }
    }
  };

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
            <img src={content.mediaUrl} alt={content.text?.substring(0, 50) || 'Imagen'} className="content-image" />
          </div>
        );
      
      case 'video':
        return (
          <div className="content-video-wrapper">
            <video src={content.mediaUrl} controls className="content-video" />
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

  return (
    <section className="content-detail-page">
      <div className="container">
        
        {/* Navigation: Anterior | Volver | Siguiente */}
        <div className="detail-nav-buttons">
          {contentIds.length > 0 ? (
            <>
              <button className="btn-back-top" onClick={() => navigate(returnPath)} title="Volver">
                <i className="icon-home" aria-hidden="true"></i>
              </button>
              <button 
                className="btn-nav-prev" 
                onClick={() => {
                  const idx = contentIds.indexOf(id);
                  if (idx > 0) {
                    navigate(`/content/${contentIds[idx - 1]}`, { state: { contentIds, returnPath } });
                  }
                }}
                disabled={contentIds.indexOf(id) <= 0}
                title="Chiste anterior"
              >
                <i className="icon-arrow-left" aria-hidden="true"></i> Anterior
              </button>
              <button 
                className="btn-nav-next" 
                onClick={() => {
                  const idx = contentIds.indexOf(id);
                  if (idx >= 0 && idx < contentIds.length - 1) {
                    navigate(`/content/${contentIds[idx + 1]}`, { state: { contentIds, returnPath } });
                  }
                }}
                disabled={contentIds.indexOf(id) < 0 || contentIds.indexOf(id) >= contentIds.length - 1}
                title="Siguiente chiste"
              >
                Siguiente <i className="icon-arrow-left icon-arrow-right" aria-hidden="true"></i>
              </button>
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
            
            <article className="detail-article">
              
              {/* Header */}
              <header className="article-header">
                {content.categories?.length > 0 && (
                  <div className="article-categories">
                    {content.categories.map((cat, idx) => (
                      <Link 
                        key={idx} 
                        to={`/category/${cat._id}`}
                        className="category-badge"
                        style={{ 
                          '--cat-color': cat.color,
                          backgroundColor: cat.color,
                          color: '#fff'
                        }}
                      >
                        {cat.emoji} {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
                
                {content.type !== 'chiste' && (content.title || content.text) && (
                  <h1 className="article-title">{content.title || content.text}</h1>
                )}
                
                <div className="article-meta">
                  <div className="meta-author">
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
                  
                  <div className="meta-info">
                    <span><i className="icon-calendar me-1" aria-hidden="true"></i> {new Date(content.createdAt).toLocaleDateString('es-ES', { dateStyle: 'short' })}</span>
                    <span><i className="icon-comment me-1" aria-hidden="true"></i> {comments.length} comentarios</span>
                  </div>
                </div>
              </header>

              {/* Content */}
              <div className="article-content">
                {renderContent()}
                
                {content.description && (
                  <div className="article-description">
                    <p>{content.description}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="article-actions">
                <div className="actions-left">
                  <button 
                    className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                  >
                    <i className={isLiked ? 'icon-heart' : 'icon-heart-empty'} aria-hidden="true"></i>
                    <span>{likesCount} Risas</span>
                  </button>
                  
                  <button className="action-btn" onClick={handleShare}>
                    <i className="icon-share-alt" aria-hidden="true"></i> Compartir
                  </button>
                </div>
                
                <div className="views-count">
                  👁️ {content.views || 0} vistas
                </div>
              </div>

            </article>

            {/* Author Info */}
            <div className="author-info-card">
              <div className="author-info-header">
                <strong>Publicado por {authorName}</strong>
              </div>
              <div className="author-info-body">
                <span className="author-avatar-lg-wrap">
                  <img src={authorAvatar} alt={authorName} className="author-avatar-lg" />
                </span>
                <p>{content.author?.bio || 'Usuario de Chisteteca'}</p>
              </div>
            </div>

            {/* Related Content */}
            {related.length > 0 && (
              <div className="related-section">
                <h3>Contenido Relacionado</h3>
                <div className="related-grid">
                  {related.map((item) => (
                    <ContentCard key={item._id} content={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
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

          {/* Sidebar */}
          <aside className="col-lg-3 sidebar">
            
            {/* Quick Stats */}
            <div className="sidebar-widget">
              <div className="stats-grid">
                <div className="stat-item" aria-label="Vistas" title="Vistas">
                  <i className="stat-icon icon-line-eye" aria-hidden="true"></i>
                  <span className="stat-value">{content.views || 0}</span>
                </div>
                <div className="stat-item" aria-label="Risas" title="Risas">
                  <i className="stat-icon icon-line-heart" aria-hidden="true"></i>
                  <span className="stat-value">{likesCount}</span>
                </div>
                <div className="stat-item" aria-label="Comentarios" title="Comentarios">
                  <i className="stat-icon icon-comment" aria-hidden="true"></i>
                  <span className="stat-value">{comments.length}</span>
                </div>
              </div>
            </div>

            {/* Share Widget */}
            <div className="sidebar-widget">
              <h4>Compartir</h4>
              <div className="share-buttons">
                <button className="share-btn facebook" onClick={handleShare}>
                  <i className="icon-share-alt" aria-hidden="true"></i> Facebook
                </button>
                <button className="share-btn twitter" onClick={handleShare}>
                  <i className="icon-share-alt" aria-hidden="true"></i> Twitter
                </button>
                <button className="share-btn whatsapp" onClick={handleShare}>
                  <i className="icon-share-alt" aria-hidden="true"></i> WhatsApp
                </button>
                <button className="share-btn copy" onClick={handleShare}>
                  <i className="icon-share-alt" aria-hidden="true"></i> Copiar enlace
                </button>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </section>
  );
};

export default ContentDetailPage;
