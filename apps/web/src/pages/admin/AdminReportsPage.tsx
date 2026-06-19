import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi, branchesApi } from '../../api/client';
import { BranchDto, CountStatus } from '@inventarioapp/shared';

export function AdminReportsPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [filterEndDate, setFilterEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => { loadBranches(); }, []);
  useEffect(() => { loadReport(); }, [filterBranch, filterStartDate, filterEndDate]);

  const loadBranches = async () => {
    try {
      const res = await branchesApi.list({ isActive: true });
      setBranches(res.data?.data ?? res.data ?? []);
    } catch (err) { console.error(err); }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterBranch) params.branchId = filterBranch;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const res = await reportsApi.countsSummary(params);
      const data = res.data?.data ?? res.data;
      setCounts(data.counts || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <div className="page__header">
        <h1 className="page__title">📊 Reportes</h1>
      </div>

      <div className="page__content">
        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <select className="form-select" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
            <option value="">Todas las sucursales</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input type="date" className="form-input" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ flex: 1 }} />
            <input type="date" className="form-input" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ flex: 1 }} />
          </div>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner spinner--lg" /></div>
        ) : counts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <div className="empty-state__title">Sin conteos</div>
            <div className="empty-state__text">No hay conteos en el rango seleccionado</div>
          </div>
        ) : (
          counts.map((count: any) => (
            <div
              key={count.id}
              className="count-card"
              onClick={() => navigate(`/counts/${count.id}`)}
            >
              <div>
                <div className="count-card__date">{formatDate(count.countDate)}</div>
                <div className="count-card__meta">
                  {count.branchName} · {count.userName}
                </div>
              </div>
              <span className={`badge ${count.status === CountStatus.FINALIZED ? 'badge--finalized' : 'badge--draft'}`}>
                {count.status === CountStatus.FINALIZED ? '✓ Listo' : 'Borrador'}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
