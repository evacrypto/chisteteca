import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Modal, Button, Badge } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ContentCard from '../components/ContentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import useAuthStore from '../store/authStore';
import { usersAPI, contentAPI, getUploadUrl } from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [publishedContent, setPublishedContent] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('published');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: '', bio: '' });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const normalizeId = (val) => (val != null ? String(val) : '');
  const currentUserId = normalizeId(currentUser?.id ?? currentUser?._id);
  const urlId = normalizeId(id);
  const isOwnProfile = isAuthenticated && !!currentUserId && !!urlId && currentUserId === urlId;

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchProfileData();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'pending' && !isOwnProfile) {
      setActiveTab('published');
    }
  }, [activeTab, isOwnProfile]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const userRes = await usersAPI.getProfile(id);
      const userData = userRes.data.data.user;
      setProfileUser(userData);
      setEditData({ username: userData?.username || '', bio: userData?.bio || '' });

      const current = useAuthStore.getState().user;
      const isOwn = isAuthenticated && (String(current?.id ?? current?._id) === String(id));
      if (isOwn) {
        const updated = { ...current, username: userData.username, bio: userData.bio };
        useAuthStore.setState({ user: updated });
        localStorage.setItem('user', JSON.stringify(updated));
      }

      const userId = id || (currentUser?.id ?? currentUser?._id);
      
      if (userId) {
        try {
          const approvedRes = await contentAPI.getAll({ author: userId, limit: 100, isApproved: 'true' });
          setPublishedContent(approvedRes.data.data || []);
          if (isOwn) {
            const pendingRes = await contentAPI.getAll({ author: userId, limit: 100, isApproved: 'false' });
            setPendingContent(pendingRes.data.data || []);
          } else {
            setPendingContent([]);
          }
        } catch (contentError) {
          setPublishedContent([]);
          setPendingContent([]);
        }
      }

      try {
        if (isOwn) {
          const favRes = await usersAPI.getFavorites();
          const favData = favRes.data.data || [];
          setFavorites(Array.isArray(favData) ? favData.filter(Boolean) : []);
        } else if (userId) {
          const favRes = await usersAPI.getPublicFavorites(userId);
          const favData = favRes.data.data || [];
          setFavorites(Array.isArray(favData) ? favData.filter(Boolean) : []);
        }
      } catch (favError) {
        setFavorites([]);
      }
    } catch (error) {
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const result = await useAuthStore.getState().updateProfile(editData);
      if (result.success) {
        toast.success('Perfil actualizado');
        setIsEditing(false);
        const freshUser = useAuthStore.getState().user;
        setProfileUser(freshUser);
        setEditData({ username: freshUser?.username || '', bio: freshUser?.bio || '' });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al actualizar perfil');
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      setShowAvatarModal(true);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await usersAPI.updateAvatar(formData);
      const newAvatar = res.data?.data?.avatar;
      if (newAvatar) {
        useAuthStore.getState().updateAvatar(newAvatar);
        setProfileUser(useAuthStore.getState().user);
      }
      toast.success('Avatar actualizado');
      setShowAvatarModal(false);
    } catch (error) {
      toast.error('Error al actualizar avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveFavorite = async (contentId) => {
    try {
      await usersAPI.removeFromFavorites(contentId);
      toast.success('Eliminado de favoritos');
      fetchProfileData();
    } catch (error) {
      toast.error('Error al eliminar favorito');
    }
  };

  if (!isAuthenticated) {
    return (
      <Container className="py-5 text-center">
        <i className="icon-user text-muted mb-3" style={{ fontSize: '60px' }} aria-hidden="true"></i>
        <h3>Debes iniciar sesión</h3>
        <p className="text-muted">Para ver tu perfil, debes estar logueado</p>
        <Link to="/login" className="btn btn-primary mt-3">Ir al Login</Link>
      </Container>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Cargando perfil..." />;
  }

  return (
    <div className="profile-page fade-in">
      <Container className="py-4">
        
        {/* Header del Perfil */}
        <Card className="profile-header-card mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col xs={12} md={3} className="text-center mb-3 mb-md-0">
                <div className="profile-avatar-large" style={{ cursor: isOwnProfile ? 'pointer' : 'default' }} onClick={handleAvatarClick}>
                  <img
                    src={getUploadUrl(profileUser?.avatar) || '/logo_chisteteca.png'}
                    alt={profileUser?.username}
                    style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
                  />
                  {isOwnProfile && (
                    <div className="avatar-edit-overlay">
                      <i className="icon-camera"></i>
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <small className="text-muted d-block mt-2">Click para cambiar avatar</small>
                )}
              </Col>
              <Col xs={12} md={6}>
                <div className="profile-info">
                  {isEditing ? (
                    <div className="edit-form">
                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editData.username}
                          onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Bio</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={editData.bio}
                          onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                          maxLength={500}
                        />
                        <small className="text-muted">{editData.bio?.length || 0}/500</small>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-success btn-sm" onClick={handleSaveProfile}>
                          <i className="icon-save me-1" aria-hidden="true"></i> Guardar
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="profile-username mb-2">
                        {profileUser?.username}
                        {profileUser?.role === 'admin' && (
                          <Badge bg="warning" className="ms-2">Admin</Badge>
                        )}
                      </h2>
                      <p className="profile-bio text-muted mb-3">
                        {profileUser?.bio || 'Sin biografía'}
                      </p>
                      {isOwnProfile && (
                        <button className="btn btn-outline-primary btn-sm" onClick={() => setIsEditing(true)}>
                          <i className="icon-edit me-1" aria-hidden="true"></i> Editar Perfil
                        </button>
                      )}
                    </>
                  )}
                </div>
              </Col>
              <Col xs={12} md={3}>
                <div className="profile-stats">
                  <div className="stat-item">
                    <i className="stat-icon icon-file-alt" aria-hidden="true"></i>
                    <span className="stat-number">{publishedContent.length}</span>
                    <span className="stat-label">Publicados</span>
                  </div>
                  <div className="stat-item">
                    <i className="stat-icon icon-clock" aria-hidden="true"></i>
                    <span className="stat-number">{pendingContent.length}</span>
                    <span className="stat-label">Pendientes</span>
                  </div>
                  <div className="stat-item">
                    <i className="stat-icon icon-heart" aria-hidden="true"></i>
                    <span className="stat-number">{profileUser?.stats?.totalLikes || 0}</span>
                    <span className="stat-label">Likes</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Tabs de Navegación */}
        <div className="d-flex justify-content-between align-items-center mb-4 profile-tabs-wrapper">
          <div className="profile-tabs nav nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={`nav-link ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => setActiveTab('published')}
            >
              <i className="icon-file-alt me-2" aria-hidden="true"></i>
              Publicados ({publishedContent.length})
            </button>
            {isOwnProfile && (
              <button
                type="button"
                role="tab"
                className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <i className="icon-clock me-2" aria-hidden="true"></i>
                Pendientes ({pendingContent.length})
              </button>
            )}
            <button
              type="button"
              role="tab"
              className={`nav-link ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('favorites');
                fetchProfileData();
              }}
            >
              <i className="icon-bookmark me-2" aria-hidden="true"></i>
              Favoritos ({favorites.length})
            </button>
          </div>
        </div>

        {/* Contenido de las Tabs */}
        <div className="profile-tab-content">
            {activeTab === 'published' && (
              <div className="tab-pane-content">
                {publishedContent.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="icon-file-alt text-muted mb-3" style={{ fontSize: '60px' }} aria-hidden="true"></i>
                    <p className="text-muted">Aún no has publicado ningún chiste</p>
                    <Link to="/create" className="btn btn-primary">Crear mi primer chiste</Link>
                  </div>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {publishedContent.map((item) => (
                      <Col key={item._id}>
                        <ContentCard content={item} />
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="tab-pane-content">
                {pendingContent.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="icon-clock text-muted mb-3" style={{ fontSize: '60px' }} aria-hidden="true"></i>
                    <p className="text-muted">¡No tienes contenido pendiente!</p>
                    <p className="text-muted small">Todo tu contenido ha sido aprobado</p>
                  </div>
                ) : (
                  <>
                    <div className="pending-info alert alert-warning">
                      <i className="icon-clock me-2" aria-hidden="true"></i>
                      <strong>Contenido en moderación:</strong> Estos chistes están esperando aprobación del administrador.
                    </div>
                    <Row xs={1} md={2} lg={3} className="g-4 mt-2">
                      {pendingContent.map((item) => (
                        <Col key={item._id}>
                          <ContentCard content={item} />
                        </Col>
                      ))}
                    </Row>
                  </>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="tab-pane-content">
                {favorites.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="icon-bookmark text-muted mb-3" style={{ fontSize: '60px' }} aria-hidden="true"></i>
                    <p className="text-muted">{isOwnProfile ? 'No tienes favoritos guardados' : 'Este usuario no tiene favoritos guardados'}</p>
                    <Link to="/" className="btn btn-primary">Explorar contenido</Link>
                  </div>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {favorites.map((item) => (
                      <Col key={item._id}>
                        <ContentCard
                          content={item}
                          initialIsFavorite={isOwnProfile}
                          onToggleFavorite={isOwnProfile ? fetchProfileData : undefined}
                        />
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            )}
        </div>

      </Container>

      {/* Modal para cambiar avatar */}
      <Modal show={showAvatarModal} onHide={() => setShowAvatarModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Avatar</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4 avatar-preview-wrapper">
            <img
              src={getUploadUrl(profileUser?.avatar) || '/logo_chisteteca.png'}
              alt="Avatar actual"
              className="avatar-preview-img"
            />
          </div>
          <div className="avatar-upload-guide">
            <strong>Recomendado:</strong> imagen cuadrada (proporción 1:1), mínimo 200×200 px. Se recortará al centro.
          </div>
          <p className="text-muted mb-3">Sube una nueva imagen de perfil</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
            className="form-control"
            id="avatar-upload"
          />
          {uploadingAvatar && (
            <div className="mt-3">
              <LoadingSpinner text="Subiendo imagen..." />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAvatarModal(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProfilePage;
