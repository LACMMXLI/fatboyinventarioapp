import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { countsApi, productsApi } from '../api/client';
import { CountStatus, ProductsByCategory, CountDetailDto, CountItemDto } from '@inventarioapp/shared';

export function CountCapturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ProductsByCategory[]>([]);
  const [countDetail, setCountDetail] = useState<CountDetailDto | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [catRes, countRes] = await Promise.all([
        productsApi.getByCategory(true),
        id ? countsApi.getById(id) : Promise.resolve(null),
      ]);

      const catData = catRes.data?.data ?? catRes.data ?? [];
      setCategories(catData);

      if (countRes) {
        const detail = countRes.data?.data ?? countRes.data;
        setCountDetail(detail);

        // Pre-fill quantities from existing items
        const existing: Record<string, string> = {};
        (detail.items || []).forEach((item: CountItemDto) => {
          existing[item.productId] = String(item.quantity);
        });
        setQuantities(existing);
      }
    } catch (err) {
      console.error('Error loading count data:', err);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    // Only allow numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Only allow one decimal point
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;

    setQuantities((prev) => ({ ...prev, [productId]: formatted }));
  };

  const saveProgress = useCallback(async () => {
    if (!id) return;
    setSaving(true);

    try {
      const items = Object.entries(quantities)
        .filter(([_, val]) => val !== '' && val !== undefined)
        .map(([productId, qty]) => ({
          productId,
          quantity: parseFloat(qty) || 0,
        }));

      if (items.length > 0) {
        await countsApi.updateItems(id, items);
        setLastSaved(
          new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [id, quantities]);

  const handleFinalize = async () => {
    if (!id) return;

    // Save first
    await saveProgress();

    try {
      await countsApi.finalize(id);
      toast.success('✅ Conteo finalizado exitosamente');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al finalizar');
    }
  };

  const isFinalized = countDetail?.status === CountStatus.FINALIZED;

  const capturedCount = Object.values(quantities).filter(
    (v) => v !== '' && v !== undefined,
  ).length;
  const totalProducts = categories.reduce(
    (acc, cat) => acc + cat.products.length,
    0,
  );
  const progressPercent =
    totalProducts > 0 ? Math.round((capturedCount / totalProducts) * 100) : 0;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  const currentCategory = categories[activeCategory];

  return (
    <>
      {/* Header with progress */}
      <div className="page__header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="page__title" style={{ fontSize: 'var(--font-size-xl)' }}>
            {isFinalized ? '📋 Detalle del Conteo' : '📋 Captura de Conteo'}
          </h1>
          {isFinalized && (
            <span className="badge badge--finalized">Finalizado</span>
          )}
        </div>

        {!isFinalized && (
          <>
            <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div className="progress" style={{ flex: 1 }}>
                <div
                  className="progress__bar"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                {capturedCount}/{totalProducts}
              </span>
            </div>
            {lastSaved && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                💾 Último guardado: {lastSaved}
              </p>
            )}
          </>
        )}
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map((cat, i) => {
          const catCaptured = cat.products.filter(
            (p) => quantities[p.id] !== '' && quantities[p.id] !== undefined,
          ).length;

          return (
            <button
              key={cat.category.id}
              className={`category-tab ${i === activeCategory ? 'category-tab--active' : ''}`}
              onClick={() => setActiveCategory(i)}
            >
              {cat.category.name}
              {catCaptured > 0 && (
                <span className="category-tab__count">
                  {catCaptured}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Product List */}
      <div className="page__content">
        {currentCategory?.products.map((product) => (
          <div key={product.id} className="product-row">
            <div className="product-row__info">
              <div className="product-row__name">{product.name}</div>
              <div className="product-row__unit">{product.unit}</div>
            </div>
            <div className="product-row__input">
              <input
                type="text"
                inputMode="decimal"
                className="form-input form-input--numeric"
                placeholder="0"
                value={quantities[product.id] || ''}
                onChange={(e) =>
                  handleQuantityChange(product.id, e.target.value)
                }
                disabled={isFinalized}
              />
            </div>
          </div>
        ))}

        {!isFinalized && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
              marginTop: 'var(--space-xl)',
              paddingBottom: 'var(--space-xl)',
            }}
          >
            <button
              className="btn btn--secondary"
              onClick={saveProgress}
              disabled={saving}
            >
              {saving ? (
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                '💾 Guardar Avance'
              )}
            </button>

            <button
              className="btn btn--success btn--lg"
              onClick={handleFinalize}
              disabled={capturedCount === 0}
            >
              ✅ Finalizar Conteo
            </button>
          </div>
        )}
      </div>
    </>
  );
}
