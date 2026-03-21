import { Link } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { interactionsAPI, usersAPI, getUploadUrl, getShareUrl } from '../services/api';
import { toast } from 'react-toastify';
import VipBadge from './VipBadge';
import './ContentCard.css';

const CHISTE_GRADIENT_COUNT = 8;

const ContentCard = ({ content, onLike, onToggleFavorite, initialIsFavorite = false, contentIds, currentIndex, returnPath, compact = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  const currentUserId = user?._id || user?.id;
  const authorId = content.author?._id || null;
  const authorName = content.authorName || content.author?.name || content.author?.username || 'Autor desconocido';
  const authorAvatar = getUploadUrl(content.author?.avatar || content.authorAvatar) || '/logo_chisteteca.png';

  const [isLiked, setIsLiked] = useState(content.likes?.some(l => l._id === currentUserId || l === currentUserId));
  const [likesCount, setLikesCount] = useState(content.likes?.length || 0);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Inicia sesión para dar risa');
      return;
    }

    try {
      await interactionsAPI.likeContent(content._id);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      if (onLike) onLike();
    } catch (error) {
      toast.error('Error al dar risa');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    const contentUrl = getShareUrl(content._id);
    try {
      if (navigator.share) {
        await navigator.share({
          title: content.text?.substring(0, 50) || 'Chiste',
          text: content.text?.substring(0, 100),
          url: contentUrl
        });
      } else {
        await navigator.clipboard.writeText(contentUrl);
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Error al compartir');
      }
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Inicia sesión para guardar favoritos');
      return;
    }

    try {
      if (isFavorite) {
        await usersAPI.removeFromFavorites(content._id);
        setIsFavorite(false);
        toast.success('Eliminado de favoritos');
      } else {
        await usersAPI.addToFavorites(content._id);
        setIsFavorite(true);
        toast.success('Guardado en favoritos');
      }
      if (onToggleFavorite) onToggleFavorite();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar favorito');
    }
  };

  const getChisteGradientClass = () => {
    const source = content._id || content.text || 'chiste';
    let hash = 0;

    for (let i = 0; i < source.length; i += 1) {
      hash = (hash << 5) - hash + source.charCodeAt(i);
      hash |= 0;
    }

    const gradientIndex = Math.abs(hash) % CHISTE_GRADIENT_COUNT;
    return `card-gradient-${gradientIndex}`;
  };

  const renderContent = () => {
    switch (content.type) {
      case 'chiste': {
        const text = content.text || '';
        const truncated = text.length > 50 ? text.substring(0, 50) : text;
        const hasMore = text.length > 50;
        return (
          <div className={`card-chiste-preview ${getChisteGradientClass()}`}>
            <p>
              {truncated}{hasMore && '...'}
            </p>
          </div>
        );
      }
      
      case 'image':
        return (
          <img 
            src={getUploadUrl(content.mediaUrl) || content.mediaUrl} 
            alt={content.text?.substring(0, 50) || 'Imagen'}
            className="card-image"
          />
        );
      
      case 'video':
        return (
          <div className="card-video-preview">
            <video 
              src={getUploadUrl(content.mediaUrl) || content.mediaUrl} 
              className="card-video"
              preload="metadata"
            />
            <div className="video-play-overlay">
              <i className="play-icon icon-video" aria-hidden="true"></i>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <article className={`chisteteca-card ${compact ? 'chisteteca-card--compact' : ''}`}>
      <div className="card-inner">

        {/* Imagen/Contenido */}
        <div className={`card-image-wrapper rounded ${content.type === 'chiste' ? 'card-image-wrapper--chiste' : ''}`}>
          <Link 
            to={`/content/${content._id}`} 
            state={contentIds && currentIndex != null ? { contentIds, returnPath: returnPath || '/' } : undefined}
            className="card-link"
          >
            {renderContent()}
          </Link>
        </div>

        {/* Descripción - oculta en modo compact */}
        {!compact && (
        <div className="card-desc">
          {/* Autor */}
          <div className="card-author">
            <span className="author-avatar-wrap">
              <img 
                src={authorAvatar}
                alt={authorName}
                className="author-avatar"
              />
            </span>
            {authorId ? (
              <Link to={`/profile/${authorId}`} className="author-name">
                {authorName}
              </Link>
            ) : (
              <span className="author-name">{authorName}</span>
            )}
            {(content.author?.isVip) && <VipBadge className="ms-1" />}
          </div>

          {/* Categorías */}
          {content.categories?.length > 0 && (
            <div className="card-categories">
              {content.categories.slice(0, 3).map((cat, idx) => (
                <Link 
                  key={idx} 
                  to={`/category/${cat._id}`}
                  className="category-tag"
                  style={{ 
                    '--cat-color': cat.color,
                    backgroundColor: cat.color + '20',
                    color: cat.color,
                    borderColor: cat.color + '40'
                  }}
                >
                  {cat.emoji} {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Acciones */}
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
              
              <Link 
                to={`/content/${content._id}#comments`} 
                state={contentIds && currentIndex != null ? { contentIds, returnPath: returnPath || '/' } : undefined}
                className="action-btn"
                title="Comentar"
              >
                <i className="icon-comment" aria-hidden="true"></i>
                <span>{content.commentsCount || 0}</span>
              </Link>
              
              <button 
                className="action-btn"
                onClick={handleShare}
                title="Compartir"
              >
                <i className="icon-share-alt" aria-hidden="true"></i>
              </button>
            </div>
            
            <button 
              className={`action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleToggleFavorite}
              title="Guardar en favoritos"
            >
              <i className={isFavorite ? 'icon-bookmark' : 'icon-bookmark-empty'} aria-hidden="true"></i>
            </button>
          </div>
        </div>
        )}

      </div>
    </article>
  );
};

export default ContentCard;
