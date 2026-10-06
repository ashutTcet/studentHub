import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AcademicRecordsPage = lazy(() => import('./pages/AcademicRecordsPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const InternshipsPage = lazy(() => import('./pages/InternshipsPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const CompetitionsPage = lazy(() => import('./pages/CompetitionsPage'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const FacultyVerificationPage = lazy(() => import('./pages/FacultyVerificationPage'));
const FacultyVerificationDetailPage = lazy(() => import('./pages/FacultyVerificationDetailPage'));
const StudentDirectoryPage = lazy(() => import('./pages/StudentDirectoryPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const ConsolidatedProfilePage = lazy(() => import('./pages/ConsolidatedProfilePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const RouteFallback = <div className="state-card loading-state">Loading page...</div>;

const App = () => {
  return (
    <Suspense fallback={RouteFallback}>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic-records"
        element={
          <ProtectedRoute>
            <Layout>
              <AcademicRecordsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/internships"
        element={
          <ProtectedRoute>
            <Layout>
              <InternshipsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedRoute>
            <Layout>
              <CertificatesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <Layout>
              <AchievementsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/competitions"
        element={
          <ProtectedRoute>
            <Layout>
              <CompetitionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities"
        element={
          <ProtectedRoute>
            <Layout>
              <ActivitiesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sports-and-cultural"
        element={
          <ProtectedRoute>
            <Layout>
              <ActivitiesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/consolidated"
        element={
          <ProtectedRoute>
            <Layout>
              <ConsolidatedProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/verified"
        element={
          <ProtectedRoute>
            <Layout>
              <ConsolidatedProfilePage verifiedOnly />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/verification/:resourceType/:id"
        element={
          <ProtectedRoute allowedRoles={['faculty', 'admin']}>
            <Layout>
              <FacultyVerificationDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/verification"
        element={
          <ProtectedRoute allowedRoles={['faculty', 'admin']}>
            <Layout>
              <FacultyVerificationPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/directory"
        element={
          <ProtectedRoute allowedRoles={['faculty', 'admin']}>
            <Layout>
              <StudentDirectoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminUsersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminAuditLogsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminAnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
