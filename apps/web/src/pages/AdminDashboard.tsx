import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi, branchesApi } from '../api/client';
import { BranchDto } from '@inventarioapp/shared';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [summaryRes, branchesRes] = await Promise.all([
        reportsApi.countsSummary({ startDate: today, endDate: today }),
        branchesApi.list({ isActive: true }),
      ]);

      setSummary(summaryRes.data?.data ?? summaryRes.data);
      setBranches(branchesRes.data?.data ?? branchesRes.data ?? []);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  const todayFinalized = summary?.finalizedCounts ?? 0;
  const todayDrafts = summary?.draftCounts ?? 0;
  const totalBranches = branches.length;

  return (
    <>
      <div className="page__header">
        <h1 className="page__title">Panel Admin 🏠</h1>
        <p className="page__subtitle">Resumen del día</p>
      </div>

      <div className="page__content">
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="stat-card">
            <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>
              {todayFinalized}
            </div>
            <div className="stat-card__label">Conteos Hoy</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>
              {todayDrafts}
            </div>
            <div className="stat-card__label">En Progreso</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{totalBranches}</div>
            <div className="stat-card__label">Sucursales</div>
          </div>
          <div className="stat-card">
            <div
              className="stat-card__value"
              style={{
                color:
                  todayFinalized >= totalBranches
                    ? 'var(--color-success)'
                    : 'var(--color-danger)',
              }}
            >
              {totalBranches > 0
                ? Math.round((todayFinalized / totalBranches) * 100)
                : 0}
              %
            </div>
            <div className="stat-card__label">Cobertura</div>
          </div>
        </div>

        {/* Quick Actions */}
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
          Administrar
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-sm)',
          }}
        >
          {[
            { icon: '📦', label: 'Productos', to: '/admin/products' },
            { icon: '🏬', label: 'Tiendas', to: '/admin/stores' },
            { icon: '📂', label: 'Categorías', to: '/admin/categories' },
            { icon: '🏪', label: 'Sucursales', to: '/admin/branches' },
            { icon: '👥', label: 'Usuarios', to: '/admin/users' },
            { icon: '📊', label: 'Reportes', to: '/admin/reports' },
            { icon: '📋', label: 'Nuevo Conteo', to: '/counts/new' },
          ].map((action) => (
            <div
              key={action.to}
              className="card card--interactive"
              onClick={() => navigate(action.to)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-lg)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '28px' }}>{action.icon}</span>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                }}
              >
                {action.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
