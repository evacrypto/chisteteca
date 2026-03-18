import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { contentAPI, categoriesAPI } from '../services/api';
import './CreateContentPage.css';

const CreateContentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    text: '',
    categories: [],
    newCategory: '',
    newCategoryEmoji: ''
  });
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const catDropdownRef = useRef(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef(null);

  const EMOJI_PALETTE = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','😊',
    '😇','🙂','🙃','😉','😍','🥰','😘','😗','😋','😛',
    '😜','🤪','😝','🫠','🫡','🤗','🤭','🫢','🤫','🤔',
    '🧐','🤓','😎','🤩','🥳','😤','😴','🤤','🤠','😈',
    '👻','💀','🤡','👽','🤖','🎭','🃏','🎉','🎊','🎈',
    '🎁','🎂','🍰','🧁','🍩','🍪','🍫','🍬','🍭','🍿',
    '🍕','🍔','🌭','🍟','🌮','🌯','🥙','🍜','🍝','🍣',
    '🍤','🥟','🍗','🍖','🥓','🍳','🧀','🥪','🥞','🧇',
    '☕','🍵','🧃','🥤','🍺','🍻','🍷','🍸','🍹','🧉',
    '⚽','🏀','🏈','⚾','🎾','🏐','🏓','🏸','🥊','🏆',
    '🎮','🕹️','🎲','🎯','🎸','🎹','🎤','🎧','🎬','📸',
    '🚀','🛸','✈️','🚁','🚗','🏍️','🚲','⛵','🗺️','🏝️',
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
    '🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🐙',
    '🦄','🐢','🦋','🐝','🐞','🕷️','🦂','🐬','🦀','🦈',
    '🌞','🌛','⭐','🌟','✨','⚡','🔥','💧','🌊','🌈',
    '🌵','🌴','🍀','🌷','🌸','🌼','🍁','🍂','❄️','⛄',
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💖',
    '💘','💝','💯','💫','💥','🎯','✅','🆗','🆒','🔔',
    '📢','📣','💡','🧠','📚','✏️','📌','📍','🔗','🧩',
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [emojiPickerOpen]);

  useEffect(() => {
    if (!catDropdownOpen) return;
    const handler = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catDropdownOpen]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data.filter(cat => cat.isActive && !cat.isPending));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      toast.error('Escribe el contenido del chiste');
      return;
    }

    if (formData.categories.length === 0 && !formData.newCategory.trim()) {
      toast.error('Selecciona al menos una categoría');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.text?.trim().substring(0, 50) || 'Sin título');
      submitData.append('type', 'chiste');
      submitData.append('text', formData.text);

      formData.categories.forEach(cat => {
        submitData.append('categories', cat);
      });

      // Nueva categoría sugerida
      if (formData.newCategory.trim()) {
        submitData.append('newCategory', formData.newCategory);
        submitData.append('newCategoryEmoji', formData.newCategoryEmoji || '📁');
      }

      await contentAPI.create(submitData);

      toast.success('¡Contenido publicado exitosamente!');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al publicar contenido';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="create-content" className="create-content-section">
      <div className="content-wrap">
        <div className="container">
          
          {/* Header */}
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <span className="section-badge">
                <i className="badge-icon icon-plus" aria-hidden="true"></i>
                Crear Contenido
              </span>
              <h2 className="section-title mt-3">
                Comparte tu humor con el mundo
              </h2>
              <p className="section-subtitle text-muted">
                Publica tus chistes en texto y haz reír a miles de usuarios
              </p>
            </div>
          </div>

          <div className="row justify-content-between align-items-start">
            
            {/* Columna Izquierda: Beneficios */}
            <div className="col-lg-5 mb-5 mb-lg-0" style={{ marginTop: '7px' }}>
              <div className="benefits-panel">
                <h3 className="benefits-title">¿Por qué publicar en Chisteteca?</h3>
                
                <ul className="benefits-list">
                  <li className="benefit-item">
                    <i className="benefit-icon icon-check-circle" aria-hidden="true"></i>
                    <div>
                      <strong>Alcance masivo</strong>
                      <p>Comparte tu contenido con miles de usuarios cada día</p>
                    </div>
                  </li>
                  <li className="benefit-item">
                    <i className="benefit-icon icon-lightbulb" aria-hidden="true"></i>
                    <div>
                      <strong>Feedback inmediato</strong>
                      <p>Recibe likes, comentarios y comparte risas</p>
                    </div>
                  </li>
                  <li className="benefit-item">
                    <i className="benefit-icon icon-shield-alt" aria-hidden="true"></i>
                    <div>
                      <strong>Comunidad segura</strong>
                      <p>Moderación activa para mantener el buen humor</p>
                    </div>
                  </li>
                  <li className="benefit-item">
                    <i className="benefit-icon icon-rocket" aria-hidden="true"></i>
                    <div>
                      <strong>Viraliza tu contenido</strong>
                      <p>Los mejores contenidos llegan a portada</p>
                    </div>
                  </li>
                </ul>

                <div className="tips-card">
                  <h4><i className="icon-lightbulb me-2" aria-hidden="true"></i> Consejos para tu publicación</h4>
                  <ul className="tips-list">
                    <li>Elige la categoría correcta para más visibilidad</li>
                    <li>Escribe chistes claros y divertidos</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Formulario */}
            <div className="col-lg-6 px-0 pt-4">
              <div className="content-card">
                <div className="card-body">
                  <form onSubmit={handleSubmit} className="content-form">
                    
                    {/* Texto del chiste */}
                    <div className="form-group">
                      <label className="form-label">
                        <i className="label-icon icon-align-left" aria-hidden="true"></i>
                        Texto del Chiste
                      </label>
                      <textarea
                        name="text"
                        value={formData.text}
                        onChange={handleChange}
                        className="form-control textarea"
                        placeholder="Escribe tu chiste aquí..."
                        rows={6}
                        required
                      />
                    </div>

                    {/* Categorías */}
                    <div className="form-group">
                      <label className="form-label">
                        <i className="label-icon icon-tag" aria-hidden="true"></i>
                        Categorías <span style={{ color: '#dc3545', fontWeight: 700 }}>*</span>
                      </label>

                      {/* Dropdown */}
                      <div className="cat-dropdown-wrapper" ref={catDropdownRef}>
                        <button
                          type="button"
                          className="cat-dropdown-trigger"
                          onClick={() => { setCatDropdownOpen(o => !o); setCatSearch(''); }}
                        >
                          <span>
                            {formData.categories.length === 0
                              ? 'Selecciona una o más categorías'
                              : `${formData.categories.length} categoría${formData.categories.length > 1 ? 's' : ''} seleccionada${formData.categories.length > 1 ? 's' : ''}`}
                          </span>
                          <i className={catDropdownOpen ? 'icon-chevron-up' : 'icon-chevron-down'} aria-hidden="true"></i>
                        </button>

                        {catDropdownOpen && (
                          <div className="cat-dropdown-panel">
                            <div className="cat-search-wrapper">
                              <i className="icon-search cat-search-icon" aria-hidden="true"></i>
                              <input
                                type="text"
                                className="cat-search"
                                placeholder="Buscar categoría..."
                                value={catSearch}
                                onChange={e => setCatSearch(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                            <ul className="cat-option-list">
                              {categories
                                .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                                .map(cat => {
                                  const selected = formData.categories.includes(cat._id);
                                  return (
                                    <li
                                      key={cat._id}
                                      className={`cat-option ${selected ? 'selected' : ''}`}
                                      onClick={() => handleCategoryChange(cat._id)}
                                    >
                                      <span className="cat-option-check">
                                        {selected && <i className="icon-check" aria-hidden="true"></i>}
                                      </span>
                                      <span className="cat-option-emoji">{cat.emoji}</span>
                                      <span className="cat-option-name">{cat.name}</span>
                                    </li>
                                  );
                                })}
                              {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                                <li className="cat-option-empty">Sin resultados</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Chips de seleccionadas */}
                      {formData.categories.length > 0 && (
                        <div className="cat-chips">
                          {formData.categories.map(id => {
                            const cat = categories.find(c => c._id === id);
                            if (!cat) return null;
                            return (
                              <span
                                key={id}
                                className="cat-chip"
                                style={{ backgroundColor: cat.color + '25', color: cat.color, borderColor: cat.color + '55' }}
                              >
                                {cat.emoji} {cat.name}
                                <button
                                  type="button"
                                  className="cat-chip-remove"
                                  onClick={() => handleCategoryChange(id)}
                                  aria-label={`Quitar ${cat.name}`}
                                >×</button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Sugerir nueva categoría */}
                      <div className="new-category-section mt-3">
                        <label className="form-label small">
                          <i className="label-icon icon-plus me-1" aria-hidden="true"></i>
                          ¿No encuentras tu categoría? Sugiere una nueva:
                        </label>
                        <div className="d-flex gap-2 align-items-start">
                          <input
                            type="text"
                            name="newCategory"
                            value={formData.newCategory}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Nombre de la nueva categoría"
                            maxLength={50}
                            style={{ height: '52px' }}
                          />
                          <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
                            <button
                              type="button"
                              className="emoji-picker-trigger"
                              onClick={() => setEmojiPickerOpen(o => !o)}
                              title="Elegir emoji"
                            >
                              {formData.newCategoryEmoji || '😀'}
                            </button>
                            {emojiPickerOpen && (
                              <div className="emoji-picker-panel">
                                {EMOJI_PALETTE.map(em => (
                                  <button
                                    key={em}
                                    type="button"
                                    className={`emoji-option ${formData.newCategoryEmoji === em ? 'selected' : ''}`}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, newCategoryEmoji: em }));
                                      setEmojiPickerOpen(false);
                                    }}
                                  >{em}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <small className="text-muted">
                          ℹ️ La sugerencia será revisada antes de publicarse
                        </small>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="form-group">
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner"></span>
                            Publicando...
                          </>
                        ) : (
                          <>
                            <i className="btn-icon icon-plus" aria-hidden="true"></i>
                            Publicar Contenido
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateContentPage;
