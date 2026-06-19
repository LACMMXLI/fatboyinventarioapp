import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { countsApi } from '../api/client';
import { CountDto, CountStatus } from '@inventarioapp/shared';

export function CountHistoryPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<CountDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const res = await countsApi.list({ limit: 30 });
      const data = res.data?.data?.data ?? res.data?.data ?? [];
      setCounts(data);
    } catch (err) {
      console.error('Error loading counts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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
        <h1 className="page__title">📊 Historial</h1>
        <p className="page__subtitle">Tus conteos anteriores</p>
      </div>

      <div className="page__content">
        {counts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <div className="empty-state__title">Sin conteos</div>
            <div className="empty-state__text">
              Aún no has realizado ningún conteo
            </div>
          </div>
        ) : (
          counts.map((count) => (
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
                  {count.branchName}
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
