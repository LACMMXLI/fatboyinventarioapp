import { Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from '@inventarioapp/shared';
import { useAuthStore } from './context/auth-store';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CountCapturePage } from './pages/CountCapturePage';
import { CountHistoryPage } from './pages/CountHistoryPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminBranchesPage } from './pages/admin/AdminBranchesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

      {/* Protected routes with AppShell layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Dashboard - all roles */}
          <Route path="/" element={<DashboardPage />} />

          {/* Counts - ADMIN & ENCARGADO */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ENCARGADO]} />}>
            <Route path="/counts/new" element={<CountCapturePage />} />
            <Route path="/counts/:id" element={<CountCapturePage />} />
            <Route path="/counts/history" element={<CountHistoryPage />} />
          </Route>

          {/* Admin - ADMIN only */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/branches" element={<AdminBranchesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* Reports - ADMIN & CONSULTA */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CONSULTA]} />}>
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
