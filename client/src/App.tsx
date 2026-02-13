import { Routes, Route } from 'react-router-dom';
import { TenantProvider } from './contexts/TenantContext';
import { DateRangeProvider } from './contexts/DateRangeContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppHeader from './components/AppHeader';
import OfflineIndicator from './components/OfflineIndicator';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Webhooks from './pages/Webhooks';
import ScheduledExports from './pages/ScheduledExports';
import AdminUsers from './pages/AdminUsers';
import AdminTenants from './pages/AdminTenants';
import TenantUsers from './pages/TenantUsers';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <ThemeProvider>
      <TenantProvider>
        <DateRangeProvider>
          <OfflineIndicator />
          <a href="#main-content" className="skip-to-main">
            Skip to main content
          </a>
          <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute roles={["admin", "asda_executive", "cpm_manager", "super_admin"]}>
              <div className="min-h-screen">
                <AppHeader />
                <Dashboard />
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute roles={["admin", "asda_executive", "cpm_manager", "super_admin"]}>
              <div className="min-h-screen">
                <AppHeader />
                <div className="container mx-auto py-8 px-4">
                  <Analytics />
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/webhooks" 
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <div className="min-h-screen">
                <AppHeader />
                <div className="container mx-auto py-8 px-4">
                  <Webhooks />
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/scheduled-exports" 
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <div className="min-h-screen">
                <AppHeader />
                <ScheduledExports />
              </div>
            </ProtectedRoute>
          } 
        />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/tenants" 
          element={
            <ProtectedRoute roles={["super_admin"]}>
              <div className="min-h-screen">
                <AppHeader />
                <AdminTenants />
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/tenants/:tenantId/users" 
          element={
            <ProtectedRoute roles={["super_admin"]}>
              <div className="min-h-screen">
                <AppHeader />
                <TenantUsers />
              </div>
            </ProtectedRoute>
          } 
        />
      </Routes>
        </DateRangeProvider>
      </TenantProvider>
    </ThemeProvider>
  );
}
