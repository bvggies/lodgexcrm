import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import { AnimatePresence } from 'framer-motion';
import AppLayout from './components/layout/AppLayout';
import PageTransition from './components/animations/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PropertiesPage from './pages/properties/PropertiesPage';
import GuestsPage from './pages/guests/GuestsPage';
import BookingsPage from './pages/bookings/BookingsPage';
import OwnersPage from './pages/owners/OwnersPage';
import CleaningTasksPage from './pages/cleaning/CleaningTasksPage';
import MaintenanceTasksPage from './pages/maintenance/MaintenanceTasksPage';
import FinancePage from './pages/finance/FinancePage';
import StaffPage from './pages/staff/StaffPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import UnitsPage from './pages/units/UnitsPage';
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
import { useAppSelector } from './store/hooks';

const { Content } = Layout;

function App() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Content style={{ padding: '24px', minHeight: '100vh', overflow: 'visible' }}>
                  <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                      {/* Guest Routes */}
                      {user?.role === 'guest' && (
                        <>
                          <Route
                            path="/guest/dashboard"
                            element={
                              <PageTransition>
                                <GuestDashboardPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/settings"
                            element={
                              <PageTransition>
                                <SettingsPage />
                              </PageTransition>
                            }
                          />
                          <Route path="/" element={<Navigate to="/guest/dashboard" replace />} />
                          <Route path="*" element={<Navigate to="/guest/dashboard" replace />} />
                        </>
                      )}
                      {/* Owner Routes */}
                      {user?.role === 'owner_view' && (
                        <>
                          <Route
                            path="/owner/dashboard"
                            element={
                              <PageTransition>
                                <OwnerDashboardPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/owner/statements"
                            element={
                              <PageTransition>
                                <OwnerMyStatementsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/settings"
                            element={
                              <PageTransition>
                                <SettingsPage />
                              </PageTransition>
                            }
                          />
                          <Route path="/" element={<Navigate to="/owner/dashboard" replace />} />
                          <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
                        </>
                      )}
                      {/* Staff Routes */}
                      {user?.role !== 'guest' &&
                        user?.role !== 'admin' &&
                        user?.role !== 'owner_view' && (
                          <>
                            <Route
                              path="/staff/dashboard"
                              element={
                                <PageTransition>
                                  <StaffDashboardPage />
                                </PageTransition>
                              }
                            />
                            <Route
                              path="/settings"
                              element={
                                <PageTransition>
                                  <SettingsPage />
                                </PageTransition>
                              }
                            />
                            <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
                          </>
                        )}
                      {/* Admin Routes */}
                      {user?.role === 'admin' && (
                        <>
                          <Route
                            path="/"
                            element={
                              <PageTransition>
                                <DashboardPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/properties"
                            element={
                              <PageTransition>
                                <PropertiesPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/units"
                            element={
                              <PageTransition>
                                <UnitsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/guests"
                            element={
                              <PageTransition>
                                <GuestsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/bookings"
                            element={
                              <PageTransition>
                                <BookingsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/my-bookings"
                            element={
                              <PageTransition>
                                <MyBookingsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/owners"
                            element={
                              <PageTransition>
                                <OwnersPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/owners/:id/statements"
                            element={
                              <PageTransition>
                                <OwnerStatementsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/cleaning"
                            element={
                              <PageTransition>
                                <CleaningTasksPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/maintenance"
                            element={
                              <PageTransition>
                                <MaintenanceTasksPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/finance"
                            element={
                              <PageTransition>
                                <FinancePage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/staff"
                            element={
                              <PageTransition>
                                <StaffPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/analytics"
                            element={
                              <PageTransition>
                                <AnalyticsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/audit"
                            element={
                              <PageTransition>
                                <AuditLogPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/integrations"
                            element={
                              <PageTransition>
                                <IntegrationsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/automations"
                            element={
                              <PageTransition>
                                <AutomationsPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/archive"
                            element={
                              <PageTransition>
                                <ArchivePage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/import"
                            element={
                              <PageTransition>
                                <ImportPage />
                              </PageTransition>
                            }
                          />
                          <Route
                            path="/settings"
                            element={
                              <PageTransition>
                                <SettingsPage />
                              </PageTransition>
                            }
                          />
                          <Route path="*" element={<NotFound />} />
                        </>
                      )}
                    </Routes>
                  </AnimatePresence>
                </Content>
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
