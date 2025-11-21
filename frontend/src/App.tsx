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
import { useAppSelector } from './store/hooks';

const { Content } = Layout;

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
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
                <Content style={{ padding: '24px', minHeight: '100vh' }}>
                  <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
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
