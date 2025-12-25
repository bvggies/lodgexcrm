import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PropertiesPage from './pages/properties/PropertiesPage';
import PropertyDetailPage from './pages/properties/PropertyDetailPage';
import GuestsPage from './pages/guests/GuestsPage';
import GuestDetailPage from './pages/guests/GuestDetailPage';
import BookingsPage from './pages/bookings/BookingsPage';
import BookingDetailPage from './pages/bookings/BookingDetailPage';
import OwnersPage from './pages/owners/OwnersPage';
import CleaningTasksPage from './pages/cleaning/CleaningTasksPage';
import MaintenanceTasksPage from './pages/maintenance/MaintenanceTasksPage';
import FinancePage from './pages/finance/FinancePage';
import StaffPage from './pages/staff/StaffPage';
import UsersPage from './pages/users/UsersPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import UnitsPage from './pages/units/UnitsPage';
import UnitDetailPage from './pages/units/UnitDetailPage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import AutomationsPage from './pages/automations/AutomationsPage';
import ArchivePage from './pages/archive/ArchivePage';
import ImportPage from './pages/import/ImportPage';
import MyBookingsPage from './pages/bookings/MyBookingsPage';
import SettingsPage from './pages/settings/SettingsPage';
import OwnerStatementsPage from './pages/owners/OwnerStatementsPage';
import GuestDashboardPage from './pages/guest/GuestDashboardPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import OwnerMyStatementsPage from './pages/owner/OwnerStatementsPage';
import CallPage from './pages/calling/CallPage';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { getCurrentUser } from './store/slices/authSlice';
import { CallingProvider } from './contexts/CallingContext';

const { Content } = Layout;

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, accessToken } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Restore user session on page refresh
  useEffect(() => {
    if (accessToken && !user) {
      dispatch(getCurrentUser());
    }
  }, [accessToken, user, dispatch]);

  return (
    <ErrorBoundary>
      <CallingProvider>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <AppLayout>
                  <Content style={{ padding: '24px', minHeight: '100vh', overflow: 'visible' }}>
                    <Routes location={location} key={location.pathname}>
                      {/* Guest Routes */}
                      {user?.role === 'guest' && (
                        <>
                          <Route path="/guest/dashboard" element={<GuestDashboardPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="/" element={<Navigate to="/guest/dashboard" replace />} />
                          <Route path="*" element={<Navigate to="/guest/dashboard" replace />} />
                        </>
                      )}
                      {/* Owner Routes */}
                      {user?.role === 'owner_view' && (
                        <>
                          <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
                          <Route path="/owner/statements" element={<OwnerMyStatementsPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="/" element={<Navigate to="/owner/dashboard" replace />} />
                          <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
                        </>
                      )}
                      {/* Staff Routes */}
                      {user?.role !== 'guest' &&
                        user?.role !== 'admin' &&
                        user?.role !== 'owner_view' && (
                          <>
                            <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
                          </>
                        )}
                      {/* Admin Routes */}
                      {user?.role === 'admin' && (
                        <>
                          <Route path="/" element={<DashboardPage />} />
                          <Route path="/properties" element={<PropertiesPage />} />
                          <Route path="/properties/:id" element={<PropertyDetailPage />} />
                          <Route path="/units" element={<UnitsPage />} />
                          <Route path="/units/:id" element={<UnitDetailPage />} />
                          <Route path="/guests" element={<GuestsPage />} />
                          <Route path="/guests/:id" element={<GuestDetailPage />} />
                          <Route path="/bookings" element={<BookingsPage />} />
                          <Route path="/bookings/:id" element={<BookingDetailPage />} />
                          <Route path="/my-bookings" element={<MyBookingsPage />} />
                          <Route path="/owners" element={<OwnersPage />} />
                          <Route path="/owners/:id/statements" element={<OwnerStatementsPage />} />
                          <Route path="/cleaning" element={<CleaningTasksPage />} />
                          <Route path="/maintenance" element={<MaintenanceTasksPage />} />
                          <Route path="/finance" element={<FinancePage />} />
                          <Route path="/calls" element={<CallPage />} />
                          <Route path="/staff" element={<StaffPage />} />
                          <Route path="/users" element={<UsersPage />} />
                          <Route path="/analytics" element={<AnalyticsPage />} />
                          <Route path="/audit" element={<AuditLogPage />} />
                          <Route path="/integrations" element={<IntegrationsPage />} />
                          <Route path="/automations" element={<AutomationsPage />} />
                          <Route path="/archive" element={<ArchivePage />} />
                          <Route path="/import" element={<ImportPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="*" element={<NotFound />} />
                        </>
                      )}
                    </Routes>
                  </Content>
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </CallingProvider>
    </ErrorBoundary>
  );
}

export default App;
