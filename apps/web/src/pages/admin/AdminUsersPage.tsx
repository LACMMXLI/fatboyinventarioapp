import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { usersApi, branchesApi, authApi } from '../../api/client';
import { UserDto, BranchDto, UserRole } from '@inventarioapp/shared';

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>(UserRole.ENCARGADO);
  const [formBranchId, setFormBranchId] = useState('');
  const [adminInvitationCode, setAdminInvitationCode] = useState('');
  const [encargadoInvitationCode, setEncargadoInvitationCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingCodes, setSavingCodes] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        usersApi.list({ limit: 100 }),
        branchesApi.list({ isActive: true }),
      ]);
      const codesRes = await authApi.getInvitationCodes();
      setUsers(usersRes.data?.data?.data ?? usersRes.data?.data ?? []);
      setBranches(branchesRes.data?.data ?? branchesRes.data ?? []);
      const codes = codesRes.data?.data ?? codesRes.data;
      setAdminInvitationCode(codes.adminInvitationCode ?? '');
      setEncargadoInvitationCode(codes.encargadoInvitationCode ?? '');
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null); setFormEmail(''); setFormPassword(''); setFormFullName('');
    setFormRole(UserRole.ENCARGADO); setFormBranchId(''); setShowForm(true);
  };

  const openEdit = (u: UserDto) => {
    setEditingId(u.id); setFormEmail(u.email); setFormPassword(''); setFormFullName(u.fullName);
    setFormRole(u.role); setFormBranchId(u.branchId || ''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formFullName.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await usersApi.update(editingId, {
          fullName: formFullName, role: formRole,
          branchId: formBranchId || null,
        });
        toast.success('Usuario actualizado');
      } else {
        if (!formEmail.trim() || !formPassword) { toast.error('Email y contraseña son requeridos'); setSaving(false); return; }
        await usersApi.create({
          email: formEmail, password: formPassword, fullName: formFullName,
          role: formRole, branchId: formBranchId || undefined,
        });
        toast.success('Usuario creado');
      }
      setShowForm(false); loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u: UserDto) => {
    try {
      await usersApi.update(u.id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Desactivado' : 'Activado'); loadData();
    } catch { toast.error('Error'); }
  };

  const saveInvitationCodes = async () => {
    setSavingCodes(true);
    try {
      const res = await authApi.updateInvitationCodes({
        adminInvitationCode,
        encargadoInvitationCode,
      });
      const codes = res.data?.data ?? res.data;
      setAdminInvitationCode(codes.adminInvitationCode);
      setEncargadoInvitationCode(codes.encargadoInvitationCode);
      toast.success('Códigos actualizados');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error al guardar códigos'); }
    finally { setSavingCodes(false); }
  };

  const roleLabel: Record<string, string> = {
    ADMIN: '👑 Admin', ENCARGADO: '📋 Encargado', CONSULTA: '👁 Consulta',
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner--lg" /></div>;

  return (
    <>
      <div className="page__header">
        <h1 className="page__title">👥 Usuarios</h1>
      </div>
      <div className="page__content">
        <button className="btn btn--primary" onClick={openCreate} style={{ marginBottom: 'var(--space-lg)' }}>
          + Nuevo Usuario
        </button>
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-md)' }}>
            Códigos de invitación
          </h2>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Administradores</label>
              <input className="form-input" value={adminInvitationCode} onChange={(e) => setAdminInvitationCode(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Encargados</label>
              <input className="form-input" value={encargadoInvitationCode} onChange={(e) => setEncargadoInvitationCode(e.target.value)} />
            </div>
            <button className="btn btn--secondary" onClick={saveInvitationCodes} disabled={savingCodes}>
              {savingCodes ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Guardar códigos'}
            </button>
          </div>
        </div>
        {users.map((u) => (
          <div key={u.id} className="product-row" style={{ opacity: u.isActive ? 1 : 0.5 }}>
            <div className="product-row__info" onClick={() => openEdit(u)} style={{ cursor: 'pointer' }}>
              <div className="product-row__name">{u.fullName}</div>
              <div className="product-row__unit">{roleLabel[u.role]} · {u.branchName || 'Sin sucursal'}</div>
            </div>
            <button
              className={`btn btn--sm ${u.isActive ? 'btn--danger' : 'btn--success'}`}
              onClick={() => toggleActive(u)}
              style={{ width: 'auto', minWidth: '70px' }}
            >
              {u.isActive ? 'Desact.' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editingId ? 'Editar' : 'Nuevo'} Usuario</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className="form-input" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} />
              </div>
              {!editingId && (
                <>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <input type="password" className="form-input" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="form-select" value={formRole} onChange={(e) => setFormRole(e.target.value as UserRole)}>
                  <option value={UserRole.ENCARGADO}>Encargado</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sucursal</label>
                <select className="form-select" value={formBranchId} onChange={(e) => setFormBranchId(e.target.value)}>
                  <option value="">Sin asignar</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
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
