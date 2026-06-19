import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productStoresApi, productsApi } from '../../api/client';
import {
  ProductDto,
  ProductStoreDto,
  ProductsByStore,
} from '@inventarioapp/shared';

export function AdminStoresPage() {
  const [stores, setStores] = useState<ProductStoreDto[]>([]);
  const [productsByStore, setProductsByStore] = useState<ProductsByStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storesRes, groupedRes] = await Promise.all([
        productStoresApi.list(),
        productsApi.getByStore(true),
      ]);

      setStores(storesRes.data?.data ?? storesRes.data ?? []);
      setProductsByStore(groupedRes.data?.data ?? groupedRes.data ?? []);
    } catch (err) {
      toast.error('Error al cargar tiendas');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormAddress('');
    setFormPhone('');
    setShowForm(true);
  };

  const openEdit = (store: ProductStoreDto) => {
    setEditingId(store.id);
    setFormName(store.name);
    setFormAddress(store.address || '');
    setFormPhone(store.phone || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Escribe el nombre de la tienda');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formName,
        address: formAddress || undefined,
        phone: formPhone || undefined,
      };

      if (editingId) {
        await productStoresApi.update(editingId, data);
        toast.success('Tienda actualizada');
      } else {
        await productStoresApi.create(data);
        toast.success('Tienda creada');
      }

      setShowForm(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (store: ProductStoreDto) => {
    try {
      await productStoresApi.update(store.id, { isActive: !store.isActive });
      toast.success(store.isActive ? 'Tienda desactivada' : 'Tienda activada');
      loadData();
    } catch (err) {
      toast.error('Error al actualizar tienda');
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
        <h1 className="page__title">🏬 Tiendas</h1>
        <p className="page__subtitle">
          Asigna productos a tiendas y revisa el catálogo agrupado
        </p>
      </div>

      <div className="page__content">
        <button
          className="btn btn--primary"
          onClick={openCreate}
          style={{ marginBottom: 'var(--space-lg)' }}
        >
          + Nueva Tienda
        </button>

        <h2 className="section-title">Tiendas registradas</h2>
        {stores.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__title">Sin tiendas</div>
            <div className="empty-state__text">
              Crea una tienda y luego asígnala desde Productos.
            </div>
          </div>
        ) : (
          stores.map((store) => (
            <div
              key={store.id}
              className="product-row"
              style={{ opacity: store.isActive ? 1 : 0.5 }}
            >
              <div
                className="product-row__info"
                onClick={() => openEdit(store)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-row__name">{store.name}</div>
                <div className="product-row__unit">
                  {store.productCount || 0} productos
                  {store.phone ? ` · ${store.phone}` : ''}
                </div>
              </div>
              <button
                className={`btn btn--sm ${
                  store.isActive ? 'btn--danger' : 'btn--success'
                }`}
                onClick={() => toggleActive(store)}
                style={{ width: 'auto', minWidth: '70px' }}
              >
                {store.isActive ? 'Desact.' : 'Activar'}
              </button>
            </div>
          ))
        )}

        <h2 className="section-title section-title--spaced">
          Productos por tienda
        </h2>
        {productsByStore.map((group) => (
          <div key={group.store?.id || 'unassigned'} className="store-group">
            <div className="store-group__header">
              <span>{group.store?.name || 'Sin tienda asignada'}</span>
              <span>{group.products.length}</span>
            </div>
            {group.products.length === 0 ? (
              <div className="store-group__empty">Sin productos asignados</div>
            ) : (
              group.products.map((product: ProductDto) => (
                <div key={product.id} className="store-product-row">
                  <span>{product.name}</span>
                  <span>
                    {product.categoryName} · {product.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">
                {editingId ? 'Editar Tienda' : 'Nueva Tienda'}
              </h2>
              <button
                className="modal__close"
                onClick={() => setShowForm(false)}
              >
                x
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
              }}
            >
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Costco"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  className="form-input"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  className="form-input"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <button
                className="btn btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <span
                    className="spinner"
                    style={{ width: 18, height: 18, borderWidth: 2 }}
                  />
                ) : editingId ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Tienda'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
