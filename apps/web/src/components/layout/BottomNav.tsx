import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../context/auth-store';
import { UserRole } from '@inventarioapp/shared';

export function BottomNav() {
  const { user } = useAuthStore();

  if (!user) return null;

  const encargadoLinks = [
    { to: '/', label: 'Inicio', icon: '🏠' },
    { to: '/counts/new', label: 'Conteo', icon: '📋' },
    { to: '/counts/history', label: 'Historial', icon: '📊' },
  ];

  const adminLinks = [
    { to: '/', label: 'Inicio', icon: '🏠' },
    { to: '/admin/products', label: 'Productos', icon: '📦' },
    { to: '/admin/reports', label: 'Reportes', icon: '📊' },
    { to: '/admin/users', label: 'Usuarios', icon: '👥' },
  ];

  const consultaLinks = [
    { to: '/', label: 'Inicio', icon: '🏠' },
    { to: '/admin/reports', label: 'Reportes', icon: '📊' },
  ];

  const links =
    user.role === UserRole.ADMIN
      ? adminLinks
      : user.role === UserRole.ENCARGADO
        ? encargadoLinks
        : consultaLinks;

  return (
    <nav className="bottom-nav">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          <span className="bottom-nav__icon">{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
