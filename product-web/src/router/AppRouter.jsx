import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { AuthPage } from '../screens/AuthPage';
import { CheckoutPage } from '../screens/CheckoutPage';
import { DashboardPage } from '../screens/DashboardPage';
import { LandingPage } from '../screens/LandingPage';
import { Layout } from '../screens/Layout';
import { ProjectDetailsPage } from '../screens/ProjectDetailsPage';
import { ProjectsPage } from '../screens/ProjectsPage';
import { MaterialsPage } from '../screens/MaterialsPage';
import { SuppliersPage } from '../screens/SuppliersPage';
import { EstimatesPage } from '../screens/EstimatesPage';
import { EstimateDetailsPage } from '../screens/EstimateDetailsPage';
import { PurchasesPage } from '../screens/PurchasesPage';
import { PurchaseDetailsPage } from '../screens/PurchaseDetailsPage';
import { PricingPage } from '../screens/PricingPage';
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
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route
        path="/checkout"
        element={(
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        )}
      />
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
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailsPage />} />
        <Route path="estimates/:id" element={<EstimateDetailsPage />} />
        <Route path="purchases/:id" element={<PurchaseDetailsPage />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
