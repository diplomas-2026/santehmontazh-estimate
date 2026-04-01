import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { AuthPage } from '../screens/AuthPage';
import { DashboardPage } from '../screens/DashboardPage';
import { Layout } from '../screens/Layout';
import { ProjectsPage } from '../screens/ProjectsPage';
import { MaterialsPage } from '../screens/MaterialsPage';
import { SuppliersPage } from '../screens/SuppliersPage';
import { EstimatesPage } from '../screens/EstimatesPage';
import { PurchasesPage } from '../screens/PurchasesPage';
import { ReportsPage } from '../screens/ReportsPage';
import { UsersPage } from '../screens/UsersPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-panel">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="estimates" element={<EstimatesPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="reports/deviations" element={<ReportsPage />} />
        <Route
          path="admin/users"
          element={(
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          )}
        />
      </Route>
    </Routes>
  );
}
