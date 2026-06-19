import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/auth-store';
import { BottomNav } from './BottomNav';

export function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <>
      <header className="top-nav">
        <span className="top-nav__brand">🍔 FATBOY</span>
        <div className="top-nav__user">
          <span style={{ display: 'none' }}>{user?.fullName}</span>
          <button
            className="top-nav__avatar"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            {initials}
          </button>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <BottomNav />
    </>
  );
}
