import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Button, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { adminAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AdminDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [pendingContent, setPendingContent] = useState([]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is admin
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      toast.error('No tienes permisos de administrador');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, categoriesRes, allCategoriesRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingContent({ limit: 20 }),
        adminAPI.getPendingCategories(),
        categoriesAPI.getAll()
      ]);
      setStats(statsRes.data.data);
      setPendingContent(pendingRes.data.data);
      setPendingCategories(categoriesRes.data.data);
      setAllCategories(allCategoriesRes.data.data || []);
      await Promise.all([loadUsers(), loadAllContent()]);
    } catch (error) {
      console.error('Full error:', error);
      const message = error.response?.data?.message || error.message || 'Error loading dashboard data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const usersRes = await adminAPI.getUsers({ limit: 50 });
    setUsers(usersRes.data.data || []);
  };

  const loadAllContent = async () => {
    const contentRes = await adminAPI.getAllContent({ limit: 50 });
    setAllContent(contentRes.data.data || []);
  };

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveContent(id);
      toast.success('✅ Contenido aprobado correctamente');
      fetchData();
    } catch (error) {
      toast.error('❌ Error al aprobar contenido');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Motivo del rechazo (opcional):') || 'No cumple con las normas de la comunidad';
    try {
      await adminAPI.rejectContent(id, reason);
      toast.info('🚫 Contenido rechazado');
      fetchData();
    } catch (error) {
      toast.error('❌ Error al rechazar contenido');
    }
  };

  const handleRefreshPending = async () => {
    try {
      const pendingRes = await adminAPI.getPendingContent({ limit: 20 });
      setPendingContent(pendingRes.data.data);
      toast.success('Lista actualizada');
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleDeleteManagedContent = async (id, title) => {
    const confirmed = window.confirm(`¿Eliminar contenido \"${title || 'Sin título'}\"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    try {
      await adminAPI.deleteContent(id);
      toast.success('Contenido eliminado');
      await Promise.all([fetchData(), loadAllContent()]);
    } catch (error) {
      toast.error('No se pudo eliminar el contenido');
    }
  };

  const handleToggleSuspendUser = async (targetUser) => {
    if (targetUser.role === 'admin') {
      toast.info('No puedes suspender un administrador');
      return;
    }

    try {
      if (targetUser.isSuspended) {
        await adminAPI.unsuspendUser(targetUser._id);
        toast.success('Usuario reactivado');
      } else {
        const reason = prompt('Motivo de suspensión (opcional):') || 'Moderación administrativa';
        await adminAPI.suspendUser(targetUser._id, reason);
        toast.success('Usuario suspendido');
      }
      await loadUsers();
    } catch (error) {
      toast.error('No se pudo actualizar el estado del usuario');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const confirmed = window.confirm(`¿Eliminar usuario \"${targetUser.username}\"? Se eliminará también su contenido.`);
    if (!confirmed) return;

    try {
      await adminAPI.deleteUser(targetUser._id);
      toast.success('Usuario eliminado');
      await Promise.all([loadUsers(), fetchData(), loadAllContent()]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar el usuario');
    }
  };

  const handleApproveCategory = async (id) => {
    try {
      await adminAPI.approveCategory(id);
      toast.success('✅ Categoría aprobada');
      fetchData();
    } catch (error) {
      toast.error('Error al aprobar categoría');
    }
  };

  const handleRejectCategory = async (id, name) => {
    const reason = prompt(`Motivo para rechazar "${name}" (opcional):`) || 'No cumple con los criterios';
    try {
      await adminAPI.rejectCategory(id, reason);
      toast.info(`🚫 Categoría "${name}" rechazada`);
      fetchData();
    } catch (error) {
      toast.error('Error al rechazar categoría');
    }
  };

  const handleDeleteCategory = async (targetCategory) => {
    const confirmed = window.confirm(`¿Eliminar categoría "${targetCategory.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await categoriesAPI.delete(targetCategory._id);
      toast.success(`Categoría "${targetCategory.name}" eliminada`);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar la categoría');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando panel de administración..." />;
  }

  if (!stats) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <i className="icon-chart-line text-muted mb-3" style={{ fontSize: '60px' }} aria-hidden="true"></i>
          <h3>No se pudo cargar el dashboard</h3>
          <p className="text-muted">Asegúrate de haber iniciado sesión como administrador</p>
          <Link to="/login" className="btn btn-primary mt-3">Ir al Login</Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <i className="icon-chart-line me-2 text-warning" aria-hidden="true"></i>
        Panel de Administración
      </h1>

      <div className="admin-tab-buttons mb-4" role="tablist" aria-label="Pestanas de administracion">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          aria-pressed={activeTab === 'overview'}
        >
          Resumen
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
          aria-pressed={activeTab === 'pending'}
        >
          Pendientes ({pendingContent.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
          aria-pressed={activeTab === 'categories'}
        >
          Categorías ({pendingCategories.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          aria-pressed={activeTab === 'users'}
        >
          Usuarios ({users.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
          aria-pressed={activeTab === 'content'}
        >
          Contenidos ({allContent.length})
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <Row className="g-4 mb-4">
            <Col md={3}>
              <Card className="card-custom stats-card">
                <Card.Body>
                  <i className="icon-users text-primary mb-2" style={{ fontSize: '30px' }} aria-hidden="true"></i>
                  <h3>{stats?.overview?.totalUsers || 0}</h3>
                  <p className="text-muted mb-0">Usuarios</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-custom stats-card">
                <Card.Body>
                  <i className="icon-file-alt text-success mb-2" style={{ fontSize: '30px' }} aria-hidden="true"></i>
                  <h3>{stats?.overview?.totalContent || 0}</h3>
                  <p className="text-muted mb-0">Contenidos</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-custom stats-card">
                <Card.Body>
                  <i className="icon-check-circle text-warning mb-2" style={{ fontSize: '30px' }} aria-hidden="true"></i>
                  <h3>{stats?.overview?.pendingContent || 0}</h3>
                  <p className="text-muted mb-0">Pendientes</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-custom stats-card">
                <Card.Body>
                  <i className="icon-chart-line text-info mb-2" style={{ fontSize: '30px' }} aria-hidden="true"></i>
                  <h3>{stats?.overview?.totalCategories || 0}</h3>
                  <p className="text-muted mb-0">Categorías</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Top Content */}
          <Card className="card-custom mb-4">
            <Card.Header className="bg-transparent border-0">
              <h4 className="mb-0">Contenido Más Popular</h4>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Autor</th>
                    <th>Likes</th>
                    <th>Vistas</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topContent?.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <Link to={`/content/${item._id}`} className="text-gradient">
                          {item.title || 'Sin título'}
                        </Link>
                      </td>
                      <td>
                        <Badge bg="secondary">{item.type}</Badge>
                      </td>
                      <td>{item.author?.username || 'Desconocido'}</td>
                      <td>{item.likes?.length || 0}</td>
                      <td>{item.views || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="card-custom mb-4">
            <Card.Body>
              <div className="admin-legend-grid">
                <div className="admin-legend-item">
                  <span className="admin-legend-label">Usuarios</span>
                  <span className="admin-legend-value">Cuentas que inician sesión en la plataforma.</span>
                </div>
                <div className="admin-legend-item">
                  <span className="admin-legend-label">Contenidos</span>
                  <span className="admin-legend-value">Publicaciones creadas por usuarios y moderadas por el panel admin.</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {activeTab === 'pending' && (
          <Card className="card-custom">
            <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Contenido Pendiente de Aprobación</h4>
              <Button variant="outline-light" size="sm" onClick={handleRefreshPending}>
                🔄 Actualizar
              </Button>
            </Card.Header>
            <Card.Body>
              {pendingContent.length === 0 ? (
                <div className="text-center py-5">
                  <i className="icon-check-circle text-success mb-3" style={{ fontSize: '50px' }} aria-hidden="true"></i>
                  <p className="text-muted">¡No hay contenido pendiente de aprobación!</p>
                </div>
              ) : (
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Contenido</th>
                      <th>Tipo</th>
                      <th>Autor</th>
                      <th>Fecha</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingContent.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div>
                            <strong className="text-light">{item.title || 'Sin título'}</strong>
                            {item.text && (
                              <p className="text-muted small mb-1 mt-1">
                                📝 {item.text.length > 80 ? item.text.substring(0, 80) + '...' : item.text}
                              </p>
                            )}
                            {item.mediaUrl && (
                              <div className="mt-2">
                                {item.type === 'image' && (
                                  <img 
                                    src={item.mediaUrl} 
                                    alt="Preview" 
                                    style={{ maxWidth: '150px', borderRadius: '8px' }}
                                  />
                                )}
                                {item.type === 'video' && (
                                  <video 
                                    src={item.mediaUrl} 
                                    controls 
                                    style={{ maxWidth: '200px', borderRadius: '8px' }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge 
                            bg={item.type === 'video' ? 'danger' : item.type === 'image' ? 'info' : 'secondary'}
                            className="px-3 py-2"
                          >
                            {item.type === 'chiste' && '📝 '}
                            {item.type === 'image' && '🖼️ '}
                            {item.type === 'video' && '🎬 '}
                            {item.type}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {item.author?.avatar && (
                              <img 
                                src={item.author.avatar} 
                                alt={item.author.username}
                                style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                              />
                            )}
                            <span>{item.author?.username || 'Desconocido'}</span>
                          </div>
                        </td>
                        <td className="text-muted">
                          {new Date(item.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="text-end">
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleApprove(item._id)}
                            title="Aprobar contenido"
                          >
                            <i className="icon-check-circle" aria-hidden="true"></i> Aprobar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(item._id)}
                            title="Rechazar contenido"
                          >
                            <i className="icon-times-circle" aria-hidden="true"></i> Rechazar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
      )}

      {activeTab === 'categories' && (
        <>
          <Card className="card-custom mb-4">
            <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Categorías Pendientes de Aprobación</h4>
              <Button variant="outline-light" size="sm" onClick={fetchData}>
                🔄 Actualizar
              </Button>
            </Card.Header>
            <Card.Body>
              {pendingCategories.length === 0 ? (
                <div className="text-center py-5">
                  <i className="icon-check-circle text-success mb-3" style={{ fontSize: '50px' }} aria-hidden="true"></i>
                  <p className="text-muted">¡No hay categorías pendientes!</p>
                </div>
              ) : (
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Emoji</th>
                      <th>Sugerida por</th>
                      <th>Fecha</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCategories.map((cat) => (
                      <tr key={cat._id}>
                        <td>
                          <strong>{cat.name}</strong>
                        </td>
                        <td className="fs-3">{cat.emoji}</td>
                        <td>{cat.createdBy?.username || 'Desconocido'}</td>
                        <td className="text-muted">
                          {new Date(cat.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="text-end">
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleApproveCategory(cat._id)}
                          >
                            <i className="icon-check-circle" aria-hidden="true"></i> Aprobar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="me-2"
                            onClick={() => handleRejectCategory(cat._id, cat.name)}
                          >
                            <i className="icon-times-circle" aria-hidden="true"></i> Rechazar
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat)}
                          >
                            <i className="icon-trash" aria-hidden="true"></i> Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Todas las Categorías Activas</h4>
              <span className="text-muted small">{allCategories.length} categorías</span>
            </Card.Header>
            <Card.Body>
              {allCategories.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No hay categorías activas.</p>
                </div>
              ) : (
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Emoji</th>
                      <th>Color</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCategories.map((cat) => (
                      <tr key={cat._id}>
                        <td><strong>{cat.name}</strong></td>
                        <td className="fs-4">{cat.emoji}</td>
                        <td>
                          <span
                            className="d-inline-flex align-items-center"
                            style={{ gap: '8px' }}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: cat.color || '#ffc107',
                                border: '1px solid rgba(255,255,255,0.35)'
                              }}
                            ></span>
                            <span className="text-muted">{cat.color || '#ffc107'}</span>
                          </span>
                        </td>
                        <td className="text-end">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat)}
                          >
                            <i className="icon-trash" aria-hidden="true"></i> Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {activeTab === 'users' && (
        <Card className="card-custom">
          <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Gestión de Usuarios</h4>
            <Button variant="outline-light" size="sm" onClick={loadUsers}>🔄 Actualizar</Button>
          </Card.Header>
          <Card.Body>
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Posts</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.username}</td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <Badge bg={u.role === 'admin' ? 'warning' : 'secondary'}>{u.role}</Badge>
                    </td>
                    <td>
                      <Badge bg={u.isSuspended ? 'danger' : 'success'}>
                        {u.isSuspended ? 'Suspendido' : 'Activo'}
                      </Badge>
                    </td>
                    <td>{u.stats?.totalPosts || 0}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant={u.isSuspended ? 'success' : 'outline-warning'}
                        className="me-2"
                        onClick={() => handleToggleSuspendUser(u)}
                      >
                        {u.isSuspended ? 'Reactivar' : 'Suspender'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteUser(u)}
                        disabled={u.role === 'admin'}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'content' && (
        <Card className="card-custom">
          <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Gestión de Contenidos</h4>
            <Button variant="outline-light" size="sm" onClick={loadAllContent}>🔄 Actualizar</Button>
          </Card.Header>
          <Card.Body>
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Autor</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allContent.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <Link to={`/content/${item._id}`} className="text-gradient">
                        {item.title || 'Sin título'}
                      </Link>
                    </td>
                    <td>
                      <Badge bg="secondary">{item.type}</Badge>
                    </td>
                    <td>{item.author?.username || item.authorName || 'Desconocido'}</td>
                    <td>
                      <Badge bg={item.isApproved ? 'success' : 'warning'}>
                        {item.isApproved ? 'Aprobado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="text-muted">{new Date(item.createdAt).toLocaleDateString('es-ES')}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteManagedContent(item._id, item.title)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AdminDashboard;
