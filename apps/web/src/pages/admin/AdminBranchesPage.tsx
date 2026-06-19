import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { branchesApi } from '../../api/client';
import { BranchDto } from '@inventarioapp/shared';

export function AdminBranchesPage() {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await branchesApi.list();
      setBranches(res.data?.data ?? res.data ?? []);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null); setFormName(''); setFormAddress(''); setFormPhone(''); setShowForm(true);
  };

  const openEdit = (b: BranchDto) => {
    setEditingId(b.id); setFormName(b.name); setFormAddress(b.address || ''); setFormPhone(b.phone || ''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      const data = { name: formName, address: formAddress, phone: formPhone };
      if (editingId) {
        await branchesApi.update(editingId, data);
        toast.success('Sucursal actualizada');
      } else {
        await branchesApi.create(data);
        toast.success('Sucursal creada');
      }
      setShowForm(false); loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (b: BranchDto) => {
    try {
      await branchesApi.update(b.id, { isActive: !b.isActive });
      toast.success(b.isActive ? 'Desactivada' : 'Activada'); loadData();
    } catch { toast.error('Error'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner--lg" /></div>;

  return (
    <>
      <div className="page__header">
        <h1 className="page__title">🏪 Sucursales</h1>
      </div>
      <div className="page__content">
        <button className="btn btn--primary" onClick={openCreate} style={{ marginBottom: 'var(--space-lg)' }}>
          + Nueva Sucursal
        </button>
        {branches.map((b) => (
          <div key={b.id} className="product-row" style={{ opacity: b.isActive ? 1 : 0.5 }}>
            <div className="product-row__info" onClick={() => openEdit(b)} style={{ cursor: 'pointer' }}>
              <div className="product-row__name">{b.name}</div>
              <div className="product-row__unit">{b.address || 'Sin dirección'} · {b.phone || 'Sin teléfono'}</div>
            </div>
            <button
              className={`btn btn--sm ${b.isActive ? 'btn--danger' : 'btn--success'}`}
              onClick={() => toggleActive(b)}
              style={{ width: 'auto', minWidth: '70px' }}
            >
              {b.isActive ? 'Desact.' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editingId ? 'Editar' : 'Nueva'} Sucursal</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej: Fatboy Centro" />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className="form-input" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Opcional" />
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
