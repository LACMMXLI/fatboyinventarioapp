import { useAuthStore } from '../context/auth-store';
import { UserRole } from '@inventarioapp/shared';
import { EncargadoDashboard } from './EncargadoDashboard';
import { AdminDashboard } from './AdminDashboard';

export function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === UserRole.ENCARGADO) {
    return <EncargadoDashboard />;
  }

  return <AdminDashboard />;
}
