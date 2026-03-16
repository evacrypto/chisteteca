import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Nav, Tab, Badge, Modal, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ContentCard from '../components/ContentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import useAuthStore from '../store/authStore';
import { usersAPI, contentAPI } from '../services/api';
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

  const isOwnProfile = isAuthenticated && (currentUser?.id === id || currentUser?.id === profileUser?.id || currentUser?.id === profileUser?._id);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [id, isOwnProfile]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Si es mi propio perfil, usar datos del store
      if (isOwnProfile) {
        setProfileUser(currentUser);
        setEditData({ username: currentUser?.username || '', bio: currentUser?.bio || '' });
      } else {
        // Si es otro perfil, obtener datos de la API
        const userRes = await usersAPI.getProfile(id);
        setProfileUser(userRes.data.data.user);
      }

      // Obtener contenido publicado
      const publishedRes = await contentAPI.getAll({ author: id || currentUser?.id, limit: 50 });
      const published = publishedRes.data.data.filter(c => c.isApproved);
      const pending = publishedRes.data.data.filter(c => !c.isApproved);
      setPublishedContent(published);
      setPendingContent(pending);

      // Obtener favoritos (solo si es mi perfil)
      if (isOwnProfile) {
        const favRes = await usersAPI.getFavorites();
        setFavorites(favRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await usersAPI.updateProfile(editData);
      toast.success('Perfil actualizado');
      setIsEditing(false);
      fetchProfileData();
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

      await usersAPI.updateAvatar(formData);
      toast.success('Avatar actualizado');
      setShowAvatarModal(false);
      fetchProfileData();
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
                    src={profileUser?.avatar || '/logo_chisteteca.png'}
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
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="tabs" className="profile-tabs mb-4">
            <Nav.Item>
              <Nav.Link eventKey="published">
                <i className="icon-file-alt me-2" aria-hidden="true"></i>
                Publicados ({publishedContent.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="pending">
                <i className="icon-clock me-2" aria-hidden="true"></i>
                Pendientes ({pendingContent.length})
              </Nav.Link>
            </Nav.Item>
            {isOwnProfile && (
              <Nav.Item>
                <Nav.Link eventKey="favorites">
                  <i className="icon-bookmark me-2" aria-hidden="true"></i>
                  Favoritos ({favorites.length})
                </Nav.Link>
              </Nav.Item>
            )}
          </Nav>

          {/* Contenido de las Tabs */}
          <Tab.Content>
            {/* Publicados */}
            <Tab.Pane eventKey="published">
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
            </Tab.Pane>

            {/* Pendientes */}
            <Tab.Pane eventKey="pending">
              {pendingContent.length === 0 ? (
                <div className="text-center py-5">
                  <i className="icon-clock text-muted mb-3" style={{ fontSize: '60px' }} aria-hidden="true"></i>
                  <p className="text-muted">¡No tienes contenido pendiente!</p>
                  <p className="text-muted small">Todo tu contenido ha sido aprobado</p>
                </div>
              ) : (
                <div className="pending-info alert alert-warning">
                  <i className="icon-clock me-2" aria-hidden="true"></i>
                  <strong>Contenido en moderación:</strong> Estos chistes están esperando aprobación del administrador.
                </div>
              )}
              {pendingContent.length > 0 && (
                <Row xs={1} md={2} lg={3} className="g-4 mt-2">
                  {pendingContent.map((item) => (
                    <Col key={item._id}>
                      <ContentCard content={item} />
                    </Col>
                  ))}
                </Row>
              )}
            </Tab.Pane>

            {/* Favoritos */}
            {isOwnProfile && (
              <Tab.Pane eventKey="favorites">
                {favorites.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="icon-bookmark text-muted mb-3" style={{ fontSize: '60px' }} aria-hidden="true"></i>
                    <p className="text-muted">No tienes favoritos guardados</p>
                    <Link to="/" className="btn btn-primary">Explorar contenido</Link>
                  </div>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {favorites.map((item) => (
                      <Col key={item._id}>
                        <ContentCard content={item} />
                      </Col>
                    ))}
                  </Row>
                )}
              </Tab.Pane>
            )}
          </Tab.Content>
        </Tab.Container>

      </Container>

      {/* Modal para cambiar avatar */}
      <Modal show={showAvatarModal} onHide={() => setShowAvatarModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Avatar</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <img
              src={profileUser?.avatar || '/logo_chisteteca.png'}
              alt="Avatar actual"
              className="rounded-circle mb-3"
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            />
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
