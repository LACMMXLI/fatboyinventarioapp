import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../context/auth-store';
import { countsApi } from '../api/client';
import { CountDto, CountStatus } from '@inventarioapp/shared';

export function EncargadoDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<CountDto | null>(null);
  const [recentCounts, setRecentCounts] = useState<CountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check for existing draft
      const draftRes = await countsApi.getCurrentDraft();
      const draftData = draftRes.data?.data ?? draftRes.data;
      setDraft(draftData);

      // Load recent counts
      const countsRes = await countsApi.list({ limit: 5 });
      const countsData = countsRes.data?.data?.data ?? countsRes.data?.data ?? [];
      setRecentCounts(countsData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCount = async () => {
    setCreating(true);
    try {
      if (draft) {
        // Continue existing draft
        navigate(`/counts/${draft.id}`);
      } else {
        // Create new count
        const res = await countsApi.create();
        const newCount = res.data?.data ?? res.data;
        toast.success('Conteo iniciado');
        navigate(`/counts/${newCount.id}`);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al crear conteo';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
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
        <h1 className="page__title">
          Hola, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="page__subtitle">
          📍 {user?.branchName || 'Sin sucursal'}
        </p>
      </div>

      <div className="page__content">
        {/* Main Action Button */}
        <button
          className={`btn ${draft ? 'btn--secondary' : 'btn--primary'} btn--lg`}
          onClick={handleStartCount}
          disabled={creating}
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          {creating ? (
            <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          ) : draft ? (
            '📋 Continuar Conteo en Progreso'
          ) : (
            '📋 Iniciar Conteo del Día'
          )}
        </button>

        {draft && (
          <div
            className="card"
            style={{
              marginBottom: 'var(--space-xl)',
              borderColor: 'rgba(255, 209, 102, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span className="badge badge--draft">Borrador</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {draft.itemCount || 0} productos capturados
              </span>
            </div>
          </div>
        )}

        {/* Recent Counts */}
        <h2
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-md)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Conteos Recientes
        </h2>

        {recentCounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📦</div>
            <div className="empty-state__title">Sin conteos aún</div>
            <div className="empty-state__text">
              Inicia tu primer conteo del día
            </div>
          </div>
        ) : (
          recentCounts.map((count) => (
            <div
              key={count.id}
              className="count-card"
              onClick={() => navigate(`/counts/${count.id}`)}
            >
              <div>
                <div className="count-card__date">
                  {formatDate(count.countDate)}
                </div>
                <div className="count-card__meta">
                  {count.itemCount || 0} productos •{' '}
                  {count.finalizedAt
                    ? new Date(count.finalizedAt).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'En progreso'}
                </div>
              </div>
              <span
                className={`badge ${
                  count.status === CountStatus.FINALIZED
                    ? 'badge--finalized'
                    : 'badge--draft'
                }`}
              >
                {count.status === CountStatus.FINALIZED
                  ? '✓ Listo'
                  : 'Borrador'}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
