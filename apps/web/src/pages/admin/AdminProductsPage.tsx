import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productsApi, categoriesApi } from '../../api/client';
import { ProductDto, CategoryDto } from '@inventarioapp/shared';

export function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.list({ limit: 200 }),
        categoriesApi.list(),
      ]);
      setProducts(prodRes.data?.data?.data ?? prodRes.data?.data ?? []);
      setCategories(catRes.data?.data ?? catRes.data ?? []);
    } catch (err) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormCategoryId(categories[0]?.id || '');
    setFormUnit('pzas');
    setFormSortOrder(0);
    setShowForm(true);
  };

  const openEdit = (product: ProductDto) => {
    setEditingId(product.id);
    setFormName(product.name);
    setFormCategoryId(product.categoryId);
    setFormUnit(product.unit);
    setFormSortOrder(product.sortOrder);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCategoryId || !formUnit.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formName,
        categoryId: formCategoryId,
        unit: formUnit,
        sortOrder: formSortOrder,
      };

      if (editingId) {
        await productsApi.update(editingId, data);
        toast.success('Producto actualizado');
      } else {
        await productsApi.create(data);
        toast.success('Producto creado');
      }

      setShowForm(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: ProductDto) => {
    try {
      await productsApi.update(product.id, { isActive: !product.isActive });
      toast.success(product.isActive ? 'Producto desactivado' : 'Producto activado');
      loadData();
    } catch (err) {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  return (
    <>
      <div className="page__header">
        <h1 className="page__title">📦 Productos</h1>
        <p className="page__subtitle">{products.length} productos en catálogo</p>
      </div>

      <div className="page__content">
        <button
          className="btn btn--primary"
          onClick={openCreate}
          style={{ marginBottom: 'var(--space-lg)' }}
        >
          + Nuevo Producto
        </button>

        {products.map((product) => (
          <div
            key={product.id}
            className="product-row"
            style={{ opacity: product.isActive ? 1 : 0.5 }}
          >
            <div className="product-row__info" onClick={() => openEdit(product)} style={{ cursor: 'pointer' }}>
              <div className="product-row__name">{product.name}</div>
              <div className="product-row__unit">
                {product.categoryName} · {product.unit}
              </div>
            </div>
            <button
              className={`btn btn--sm ${product.isActive ? 'btn--danger' : 'btn--success'}`}
              onClick={() => toggleActive(product)}
              style={{ width: 'auto', minWidth: '70px' }}
            >
              {product.isActive ? 'Desact.' : 'Activar'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Carne molida"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Unidad de medida</label>
                <select
                  className="form-select"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                >
                  {['pzas', 'kg', 'litros', 'cajas', 'bolsas', 'paquetes', 'sobres', 'galones', 'rollos'].map(
                    (u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Orden de aparición</label>
                <input
                  type="number"
                  className="form-input"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>

              <button
                className="btn btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : editingId ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Producto'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
