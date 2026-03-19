import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Button, Badge, Pagination, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { adminAPI, categoriesAPI, contentAPI, getUploadUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import EmojiPicker from 'emoji-picker-react';
import es from 'emoji-picker-react/dist/data/emojis-es';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [pendingContent, setPendingContent] = useState([]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [contentPagination, setContentPagination] = useState({ page: 1, total: 0, pages: 1, limit: 50 });
  const [contentSortBy, setContentSortBy] = useState('date');
  const [contentSortOrder, setContentSortOrder] = useState('desc');
  const [pendingPagination, setPendingPagination] = useState({ page: 1, total: 0, pages: 1, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ emoji: '', color: '#ffc107' });
  const [editingContent, setEditingContent] = useState(null);
  const [editContentText, setEditContentText] = useState('');
  const [editContentCategories, setEditContentCategories] = useState([]);
  const [editCatDropdownOpen, setEditCatDropdownOpen] = useState(false);
  const [editCatSearch, setEditCatSearch] = useState('');
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', emoji: '😂', color: '#ffc107' });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryEmojiModalOpen, setNewCategoryEmojiModalOpen] = useState(false);
  const [usersSortBy, setUsersSortBy] = useState('date');
  const [usersSortOrder, setUsersSortOrder] = useState('desc');

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
        adminAPI.getPendingContent({ limit: 50, page: 1 }),
        adminAPI.getPendingCategories(),
        categoriesAPI.getAll()
      ]);
      setStats(statsRes.data.data);
      setPendingContent(pendingRes.data.data);
      if (pendingRes.data.pagination) {
        setPendingPagination(prev => ({
          ...prev,
          page: pendingRes.data.pagination.page,
          total: pendingRes.data.pagination.total,
          pages: pendingRes.data.pagination.pages,
          limit: pendingRes.data.pagination.limit
        }));
      }
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

  const loadUsers = async (sortOverride) => {
    const sortBy = sortOverride?.sortBy ?? usersSortBy;
    const sortOrder = sortOverride?.sortOrder ?? usersSortOrder;
    const params = { limit: 50, sortOrder };
    if (sortBy === 'posts') params.sortBy = 'posts';
    const usersRes = await adminAPI.getUsers(params);
    setUsers(usersRes.data.data || []);
  };

  const handleUsersSort = (field) => {
    let newOrder;
    if (usersSortBy === field) {
      newOrder = usersSortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      newOrder = field === 'posts' ? 'asc' : 'desc';
    }
    setUsersSortBy(field);
    setUsersSortOrder(newOrder);
    loadUsers({ sortBy: field, sortOrder: newOrder });
  };

  const loadAllContent = async (page = 1, sortOverride) => {
    const sortBy = sortOverride?.sortBy ?? contentSortBy;
    const sortOrder = sortOverride?.sortOrder ?? contentSortOrder;
    const sortByParam = { date: 'createdAt', author: 'author', likes: 'likes', views: 'views', comments: 'comments' }[sortBy] || 'createdAt';
    const contentRes = await adminAPI.getAllContent({
      limit: 50,
      page,
      sortBy: sortByParam,
      sortOrder
    });
    setAllContent(contentRes.data.data || []);
    if (contentRes.data.pagination) {
      setContentPagination(prev => ({
        ...prev,
        page: contentRes.data.pagination.page,
        total: contentRes.data.pagination.total,
        pages: contentRes.data.pagination.pages,
        limit: contentRes.data.pagination.limit
      }));
    }
  };

  const handleContentSort = (field) => {
    let newOrder;
    if (contentSortBy === field) {
      newOrder = contentSortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      newOrder = ['author', 'likes', 'views', 'comments'].includes(field) ? 'asc' : 'desc';
    }
    setContentSortBy(field);
    setContentSortOrder(newOrder);
    loadAllContent(1, { sortBy: field, sortOrder: newOrder });
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

  const loadPendingContent = async (page = 1) => {
    try {
      const pendingRes = await adminAPI.getPendingContent({ limit: 50, page });
      setPendingContent(pendingRes.data.data);
      if (pendingRes.data.pagination) {
        setPendingPagination(prev => ({
          ...prev,
          page: pendingRes.data.pagination.page,
          total: pendingRes.data.pagination.total,
          pages: pendingRes.data.pagination.pages,
          limit: pendingRes.data.pagination.limit
        }));
      }
    } catch (error) {
      toast.error('Error al cargar pendientes');
    }
  };

  const handleRefreshPending = async () => {
    await loadPendingContent(pendingPagination.page);
    toast.success('Lista actualizada');
  };

  const handleApproveAll = async () => {
    const count = stats?.overview?.pendingContent ?? pendingPagination.total;
    if (count === 0) {
      toast.info('No hay contenido pendiente');
      return;
    }
    const confirmed = window.confirm(`¿Aprobar los ${count} contenidos pendientes de una vez?`);
    if (!confirmed) return;
    try {
      const res = await adminAPI.approveAllPendingContent();
      const approved = res.data?.data?.approved ?? 0;
      toast.success(`✅ ${approved} contenidos aprobados`);
      await fetchData();
      await loadPendingContent(1);
    } catch (error) {
      toast.error('Error al aprobar todo');
    }
  };

  const handleEditContent = (item) => {
    setEditingContent(item);
    setEditContentText(item.type === 'chiste' ? (item.text || '') : (item.title || item.text || ''));
    setEditContentCategories((item.categories || []).map(c => c._id || c));
    setEditCatDropdownOpen(false);
    setEditCatSearch('');
  };

  const handleEditCategoryToggle = (catId) => {
    setEditContentCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSaveContentEdit = async () => {
    if (!editingContent) return;
    const text = editContentText.trim();
    if (!text) {
      toast.error('El texto no puede estar vacío');
      return;
    }
    try {
      const updateData = { text };
      if (editingContent.type === 'chiste') {
        updateData.title = text.substring(0, 50);
      }
      updateData.categories = editContentCategories;
      await contentAPI.update(editingContent._id, updateData);
      toast.success('Contenido actualizado');
      setEditingContent(null);
      setEditContentCategories([]);
      await fetchData();
      await loadAllContent(contentPagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar');
    }
  };

  const handleDeleteManagedContent = async (id, title) => {
    const confirmed = window.confirm(`¿Eliminar contenido \"${title || 'Sin título'}\"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    try {
      await adminAPI.deleteContent(id);
      toast.success('Contenido eliminado');
      await fetchData();
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

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditForm({ emoji: cat.emoji || '😂', color: cat.color || '#ffc107' });
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    try {
      await categoriesAPI.update(editingCategory._id, { emoji: editForm.emoji, color: editForm.color });
      toast.success(`Categoría "${editingCategory.name}" actualizada`);
      setEditingCategory(null);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar la categoría');
    }
  };

  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    const name = newCategoryForm.name.trim();
    if (!name) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }
    setIsCreatingCategory(true);
    try {
      await categoriesAPI.create({
        name,
        emoji: newCategoryForm.emoji || '😂',
        color: newCategoryForm.color || '#ffc107'
      });
      toast.success(`Categoría "${name}" creada`);
      setNewCategoryForm({ name: '', emoji: '😂', color: '#ffc107' });
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo crear la categoría');
    } finally {
      setIsCreatingCategory(false);
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
          Pendientes ({stats?.overview?.pendingContent ?? pendingPagination.total})
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
          Contenidos ({contentPagination.total || allContent.length})
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
                    <th>Contenido</th>
                    <th>Autor</th>
                    <th>Vistas</th>
                    <th>Likes</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topContent?.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <Link to={`/content/${item._id}`} className="text-gradient">
                          {(() => {
                            const t = (item.type === 'chiste' ? item.text : item.title) || item.title || item.text || 'Sin título';
                            return t.length > 60 ? t.substring(0, 60) + '...' : t;
                          })()}
                        </Link>
                      </td>
                      <td>
                        {item.author?._id ? (
                          <Link to={`/profile/${item.author._id}`} className="text-decoration-none">
                            {item.author?.username || item.authorName || 'Desconocido'}
                          </Link>
                        ) : (
                          item.author?.username || item.authorName || 'Desconocido'
                        )}
                      </td>
                      <td>{item.views || 0}</td>
                      <td>{item.likes?.length || 0}</td>
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
            <Card.Header className="bg-transparent border-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h4 className="mb-0">Contenido Pendiente de Aprobación</h4>
              <div className="d-flex gap-2">
                <Button variant="success" size="sm" onClick={handleApproveAll} disabled={(stats?.overview?.pendingContent ?? pendingPagination.total) === 0}>
                  <i className="icon-check-circle" aria-hidden="true"></i> Aprobar todo
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handleRefreshPending}>
                  🔄 Actualizar
                </Button>
              </div>
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
                            <strong className="text-dark">
                              {(() => {
                                const t = (item.type === 'chiste' ? item.text : item.title) || item.title || item.text || 'Sin título';
                                return t.length > 80 ? t.substring(0, 80) + '...' : t;
                              })()}
                            </strong>
                            {item.text && item.type !== 'chiste' && (
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
                          <div className="d-flex align-items-center gap-2">
                            {item.author?.avatar && (
                              <span className="admin-avatar-wrap">
                                <img
                                  src={getUploadUrl(item.author.avatar)}
                                  alt={item.authorName || item.author?.username || 'Autor'}
                                />
                              </span>
                            )}
                            <span>{item.authorName || item.author?.username || 'Desconocido'}</span>
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
                        <td className="text-end admin-actions-cell">
                          <Button
                            variant="success"
                            size="sm"
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
            {pendingContent.length > 0 && pendingPagination.pages > 1 && (
              <Card.Footer className="bg-transparent border-0 d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
                <span className="text-muted small">
                  {pendingPagination.total} en total · Página {pendingPagination.page} de {pendingPagination.pages}
                </span>
                <Pagination className="mb-0">
                  <Pagination.Prev
                    disabled={pendingPagination.page <= 1}
                    onClick={(e) => { e.preventDefault(); if (pendingPagination.page > 1) loadPendingContent(pendingPagination.page - 1); }}
                  />
                  {Array.from({ length: Math.min(5, pendingPagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pendingPagination.pages <= 5) pageNum = i + 1;
                    else if (pendingPagination.page <= 3) pageNum = i + 1;
                    else if (pendingPagination.page >= pendingPagination.pages - 2) pageNum = pendingPagination.pages - 4 + i;
                    else pageNum = pendingPagination.page - 2 + i;
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === pendingPagination.page}
                        onClick={(e) => { e.preventDefault(); loadPendingContent(pageNum); }}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  <Pagination.Next
                    disabled={pendingPagination.page >= pendingPagination.pages}
                    onClick={(e) => { e.preventDefault(); if (pendingPagination.page < pendingPagination.pages) loadPendingContent(pendingPagination.page + 1); }}
                  />
                </Pagination>
              </Card.Footer>
            )}
          </Card>
      )}

      {activeTab === 'categories' && (
        <>
          <Card className="card-custom mb-4">
            <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Categorías Pendientes de Aprobación</h4>
              <Button variant="outline-secondary" size="sm" onClick={fetchData}>
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
                        <td className="text-end admin-actions-cell">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveCategory(cat._id)}
                          >
                            <i className="icon-check-circle" aria-hidden="true"></i> Aprobar
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditCategory(cat)}
                          >
                            <i className="icon-edit" aria-hidden="true"></i> Editar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
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

          <Card className="card-custom mb-4">
            <Card.Header className="bg-transparent border-0">
              <h4 className="mb-0">Nueva categoría</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleCreateCategory} className="row g-3">
                <Form.Group as={Col} md={4}>
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Chistes de programadores"
                    value={newCategoryForm.name}
                    onChange={(e) => setNewCategoryForm(f => ({ ...f, name: e.target.value }))}
                    maxLength={50}
                    required
                  />
                </Form.Group>
                <Form.Group as={Col} md={2}>
                  <Form.Label>Emoji</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">{newCategoryForm.emoji || '—'}</span>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setNewCategoryEmojiModalOpen(true)}
                      title="Elegir emoji"
                    >
                      Elegir emoji
                    </Button>
                  </div>
                </Form.Group>
                <Form.Group as={Col} md={2}>
                  <Form.Label>Color</Form.Label>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Form.Control
                      type="color"
                      value={newCategoryForm.color}
                      onChange={(e) => setNewCategoryForm(f => ({ ...f, color: e.target.value }))}
                      style={{ width: 50, height: 38, padding: 4, cursor: 'pointer' }}
                    />
                    <Form.Control
                      type="text"
                      value={newCategoryForm.color}
                      onChange={(e) => setNewCategoryForm(f => ({ ...f, color: e.target.value }))}
                      placeholder="#ffc107"
                      style={{ flex: 1, minWidth: 90 }}
                    />
                    <Button
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setNewCategoryForm(f => ({ ...f, color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') }))}
                    >
                      🎲
                    </Button>
                  </div>
                </Form.Group>
                <Form.Group as={Col} md={4} className="d-flex align-items-end">
                  <Button type="submit" variant="primary" disabled={isCreatingCategory}>
                    {isCreatingCategory ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <i className="icon-plus me-1" aria-hidden="true"></i>
                        Crear categoría
                      </>
                    )}
                  </Button>
                </Form.Group>
              </Form>
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
                        <td className="text-end admin-actions-cell">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditCategory(cat)}
                          >
                            <i className="icon-edit" aria-hidden="true"></i> Editar
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
        </>
      )}

      {activeTab === 'users' && (
        <Card className="card-custom">
          <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Gestión de Usuarios</h4>
            <Button variant="outline-secondary" size="sm" onClick={loadUsers}>🔄 Actualizar</Button>
          </Card.Header>
          <Card.Body>
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>
                    <button
                      type="button"
                      className="admin-sort-th"
                      onClick={() => handleUsersSort('posts')}
                      title="Ordenar por posts (menos a más / más a menos)"
                    >
                      Posts
                      <i className={`icon-chevron-${usersSortBy === 'posts' ? (usersSortOrder === 'asc' ? 'up' : 'down') : 'down'} ms-1 admin-sort-icon ${usersSortBy !== 'posts' ? 'admin-sort-icon-inactive' : ''}`} aria-hidden="true"></i>
                    </button>
                  </th>
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
                    <td className="text-end admin-actions-cell">
                      <Button
                        size="sm"
                        variant={u.isSuspended ? 'success' : 'outline-warning'}
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
          <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h4 className="mb-0">Gestión de chistes</h4>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">
                {contentPagination.total} en total · Página {contentPagination.page} de {contentPagination.pages}
              </span>
              <Button variant="outline-secondary" size="sm" onClick={() => loadAllContent(contentPagination.page)}>🔄 Actualizar</Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Chiste</th>
                  <th>
                    <button
                      type="button"
                      className="admin-sort-th admin-sort-th-center"
                      onClick={() => handleContentSort('views')}
                      title="Ordenar por vistas (menos a más / más a menos)"
                    >
                      <i className="icon-line-eye" aria-hidden="true"></i>
                      <i className={`icon-chevron-${contentSortBy === 'views' ? (contentSortOrder === 'asc' ? 'up' : 'down') : 'down'} ms-1 admin-sort-icon ${contentSortBy !== 'views' ? 'admin-sort-icon-inactive' : ''}`} aria-hidden="true"></i>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="admin-sort-th admin-sort-th-center"
                      onClick={() => handleContentSort('likes')}
                      title="Ordenar por risas (menos a más / más a menos)"
                    >
                      <i className="icon-heart" aria-hidden="true"></i>
                      <i className={`icon-chevron-${contentSortBy === 'likes' ? (contentSortOrder === 'asc' ? 'up' : 'down') : 'down'} ms-1 admin-sort-icon ${contentSortBy !== 'likes' ? 'admin-sort-icon-inactive' : ''}`} aria-hidden="true"></i>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="admin-sort-th admin-sort-th-center"
                      onClick={() => handleContentSort('comments')}
                      title="Ordenar por comentarios (menos a más / más a menos)"
                    >
                      <i className="icon-comment" aria-hidden="true"></i>
                      <i className={`icon-chevron-${contentSortBy === 'comments' ? (contentSortOrder === 'asc' ? 'up' : 'down') : 'down'} ms-1 admin-sort-icon ${contentSortBy !== 'comments' ? 'admin-sort-icon-inactive' : ''}`} aria-hidden="true"></i>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="admin-sort-th"
                      onClick={() => handleContentSort('author')}
                      title="Ordenar por autor (A-Z / Z-A)"
                    >
                      Autor
                      <i className={`icon-chevron-${contentSortBy === 'author' ? (contentSortOrder === 'asc' ? 'up' : 'down') : 'down'} ms-1 admin-sort-icon ${contentSortBy !== 'author' ? 'admin-sort-icon-inactive' : ''}`} aria-hidden="true"></i>
                    </button>
                  </th>
                  <th>Categorías</th>
                  <th>
                    <button
                      type="button"
                      className="admin-sort-th"
                      onClick={() => handleContentSort('date')}
                      title="Ordenar por fecha"
                    >
                      Fecha
                      <i className={`icon-chevron-${contentSortBy === 'date' ? (contentSortOrder === 'asc' ? 'up' : 'down') : 'down'} ms-1 admin-sort-icon ${contentSortBy !== 'date' ? 'admin-sort-icon-inactive' : ''}`} aria-hidden="true"></i>
                    </button>
                  </th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allContent.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <Link to={`/content/${item._id}`} className="text-gradient">
                        {(() => {
                          const t = (item.type === 'chiste' ? item.text : item.title) || item.title || item.text || 'Sin título';
                          return t.length > 30 ? t.substring(0, 30) + '...' : t;
                        })()}
                      </Link>
                    </td>
                    <td className="text-center">{item.views ?? 0}</td>
                    <td className="text-center">{item.likes?.length ?? 0}</td>
                    <td className="text-center">{item.commentsCount ?? 0}</td>
                    <td>
                      {(item.author?._id || item.author) ? (
                        <Link to={`/profile/${item.author?._id || item.author}`} className="text-decoration-none">
                          {item.authorName || item.author?.username || 'Desconocido'}
                        </Link>
                      ) : (
                        item.authorName || 'Desconocido'
                      )}
                    </td>
                    <td>
                      {item.categories?.length > 0 ? (
                        <span className="d-flex flex-wrap gap-1">
                          {item.categories.slice(0, 3).map((cat) => (
                            <span
                              key={cat._id}
                              className="badge"
                              style={{ backgroundColor: (cat.color || '#6c757d') + '30', color: cat.color || '#6c757d', fontSize: '0.7rem' }}
                            >
                              {cat.emoji} {cat.name}
                            </span>
                          ))}
                          {item.categories.length > 3 && (
                            <span className="text-muted small">+{item.categories.length - 3}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td className="text-muted">{new Date(item.createdAt).toLocaleDateString('es-ES')}</td>
                    <td className="text-end admin-actions-cell">
                      {item.type === 'chiste' && (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleEditContent(item)}
                        >
                          <i className="icon-edit" aria-hidden="true"></i> Editar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteManagedContent(item._id, (item.type === 'chiste' ? item.text : item.title) || item.title || item.text)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {contentPagination.pages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <Pagination>
                  <Pagination.Prev
                    disabled={contentPagination.page <= 1}
                    onClick={(e) => { e.preventDefault(); if (contentPagination.page > 1) loadAllContent(contentPagination.page - 1); }}
                  />
                  {Array.from({ length: Math.min(5, contentPagination.pages) }, (_, i) => {
                    let pageNum;
                    if (contentPagination.pages <= 5) pageNum = i + 1;
                    else if (contentPagination.page <= 3) pageNum = i + 1;
                    else if (contentPagination.page >= contentPagination.pages - 2) pageNum = contentPagination.pages - 4 + i;
                    else pageNum = contentPagination.page - 2 + i;
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === contentPagination.page}
                        onClick={(e) => { e.preventDefault(); loadAllContent(pageNum); }}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  <Pagination.Next
                    disabled={contentPagination.page >= contentPagination.pages}
                    onClick={(e) => { e.preventDefault(); if (contentPagination.page < contentPagination.pages) loadAllContent(contentPagination.page + 1); }}
                  />
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modal Emoji para nueva categoría */}
      <Modal show={newCategoryEmojiModalOpen} onHide={() => setNewCategoryEmojiModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Elegir emoji</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">Busca y elige un emoji para la categoría</p>
          <div className="emoji-picker-wrapper">
            <EmojiPicker
              emojiData={es}
              onEmojiClick={(data) => {
                setNewCategoryForm(f => ({ ...f, emoji: data.emoji }));
                setNewCategoryEmojiModalOpen(false);
              }}
              searchPlaceholder="Buscar emoji..."
              width={320}
              height={320}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal Editar Categoría */}
      <Modal show={!!editingCategory} onHide={() => setEditingCategory(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar categoría</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingCategory && (
            <>
              <p className="text-muted mb-3">Modifica el emoji y el color de <strong>{editingCategory.name}</strong></p>
              <Form.Group className="mb-3">
                <Form.Label>Emoji</Form.Label>
                <p className="text-muted small mb-2">Busca en el cuadro de búsqueda y elige un emoji de la lista (no se puede escribir texto libre)</p>
                <div className="mb-2">
                  <strong>Seleccionado:</strong> <span className="fs-4">{editForm.emoji || '—'}</span>
                </div>
                <div className="emoji-picker-wrapper">
                  <EmojiPicker
                    emojiData={es}
                    onEmojiClick={(data) => setEditForm(f => ({ ...f, emoji: data.emoji }))}
                    searchPlaceholder="Buscar emoji..."
                    width={320}
                    height={320}
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              </Form.Group>
              <Form.Group>
                <Form.Label>Color</Form.Label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Form.Control
                    type="color"
                    value={editForm.color}
                    onChange={(e) => setEditForm(f => ({ ...f, color: e.target.value }))}
                    style={{ width: 50, height: 38, padding: 4, cursor: 'pointer' }}
                  />
                  <Form.Control
                    type="text"
                    value={editForm.color}
                    onChange={(e) => setEditForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="#ffc107"
                    style={{ flex: 1, minWidth: 100 }}
                  />
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setEditForm(f => ({ ...f, color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') }))}
                  >
                    🎲 Aleatorio
                  </Button>
                </div>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingCategory(null)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveCategory}>
            <i className="icon-check me-1" aria-hidden="true"></i> Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Editar texto del chiste */}
      <Modal show={!!editingContent} onHide={() => { setEditingContent(null); setEditContentCategories([]); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar texto del chiste</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingContent && (
            <>
              <Form.Group className="mb-4">
                <Form.Label>Texto del chiste</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={editContentText}
                  onChange={(e) => setEditContentText(e.target.value)}
                  placeholder="Escribe el texto del chiste..."
                />
              </Form.Group>

              <Form.Group className="admin-edit-categories">
                <Form.Label><i className="icon-tag me-2" aria-hidden="true"></i>Categorías</Form.Label>
                <div className="cat-dropdown-wrapper admin-cat-dropdown">
                  <button
                    type="button"
                    className="cat-dropdown-trigger"
                    onClick={() => { setEditCatDropdownOpen(o => !o); setEditCatSearch(''); }}
                  >
                    <span>
                      {editContentCategories.length === 0
                        ? 'Selecciona una o más categorías'
                        : `${editContentCategories.length} categoría${editContentCategories.length > 1 ? 's' : ''} seleccionada${editContentCategories.length > 1 ? 's' : ''}`}
                    </span>
                    <i className={editCatDropdownOpen ? 'icon-chevron-up' : 'icon-chevron-down'} aria-hidden="true"></i>
                  </button>

                  {editCatDropdownOpen && (
                    <div className="cat-dropdown-panel">
                      <div className="cat-search-wrapper">
                        <i className="icon-search cat-search-icon" aria-hidden="true"></i>
                        <input
                          type="text"
                          className="cat-search"
                          placeholder="Buscar categoría..."
                          value={editCatSearch}
                          onChange={e => setEditCatSearch(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      <ul className="cat-option-list">
                        {allCategories
                          .filter(c => c.name.toLowerCase().includes(editCatSearch.toLowerCase()))
                          .map(cat => {
                            const selected = editContentCategories.includes(cat._id);
                            return (
                              <li
                                key={cat._id}
                                className={`cat-option ${selected ? 'selected' : ''}`}
                                onClick={() => handleEditCategoryToggle(cat._id)}
                              >
                                <span className="cat-option-check">
                                  {selected && <i className="icon-check" aria-hidden="true"></i>}
                                </span>
                                <span className="cat-option-emoji">{cat.emoji}</span>
                                <span className="cat-option-name">{cat.name}</span>
                              </li>
                            );
                          })}
                        {allCategories.filter(c => c.name.toLowerCase().includes(editCatSearch.toLowerCase())).length === 0 && (
                          <li className="cat-option-empty">Sin resultados</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {editContentCategories.length > 0 && (
                  <div className="cat-chips mt-2">
                    {editContentCategories.map(id => {
                      const cat = allCategories.find(c => c._id === id);
                      if (!cat) return null;
                      return (
                        <span
                          key={id}
                          className="cat-chip"
                          style={{ backgroundColor: (cat.color || '#ffc107') + '25', color: cat.color || '#ffc107', borderColor: (cat.color || '#ffc107') + '55' }}
                        >
                          {cat.emoji} {cat.name}
                          <button
                            type="button"
                            className="cat-chip-remove"
                            onClick={() => handleEditCategoryToggle(id)}
                            aria-label={`Quitar ${cat.name}`}
                          >×</button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingContent(null)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveContentEdit}>
            <i className="icon-check me-1" aria-hidden="true"></i> Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
