import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../../api/client';
import { CategoryDto } from '@inventarioapp/shared';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await categoriesApi.list();
      setCategories(res.data?.data ?? res.data ?? []);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null); setFormName(''); setFormSortOrder(0); setShowForm(true);
  };

  const openEdit = (cat: CategoryDto) => {
    setEditingId(cat.id); setFormName(cat.name); setFormSortOrder(cat.sortOrder); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await categoriesApi.update(editingId, { name: formName, sortOrder: formSortOrder });
        toast.success('Categoría actualizada');
      } else {
        await categoriesApi.create({ name: formName, sortOrder: formSortOrder });
        toast.success('Categoría creada');
      }
      setShowForm(false); loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (cat: CategoryDto) => {
    try {
      await categoriesApi.update(cat.id, { isActive: !cat.isActive });
      toast.success(cat.isActive ? 'Desactivada' : 'Activada'); loadData();
    } catch { toast.error('Error'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner--lg" /></div>;

  return (
    <>
      <div className="page__header">
        <h1 className="page__title">📂 Categorías</h1>
      </div>
      <div className="page__content">
        <button className="btn btn--primary" onClick={openCreate} style={{ marginBottom: 'var(--space-lg)' }}>
          + Nueva Categoría
        </button>
        {categories.map((cat) => (
          <div key={cat.id} className="product-row" style={{ opacity: cat.isActive ? 1 : 0.5 }}>
            <div className="product-row__info" onClick={() => openEdit(cat)} style={{ cursor: 'pointer' }}>
              <div className="product-row__name">{cat.name}</div>
              <div className="product-row__unit">Orden: {cat.sortOrder} · {cat.productCount ?? 0} productos</div>
            </div>
            <button
              className={`btn btn--sm ${cat.isActive ? 'btn--danger' : 'btn--success'}`}
              onClick={() => toggleActive(cat)}
              style={{ width: 'auto', minWidth: '70px' }}
            >
              {cat.isActive ? 'Desact.' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editingId ? 'Editar' : 'Nueva'} Categoría</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej: Carnes" />
              </div>
              <div className="form-group">
                <label className="form-label">Orden</label>
                <input type="number" className="form-input" value={formSortOrder} onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)} min={0} />
              </div>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
