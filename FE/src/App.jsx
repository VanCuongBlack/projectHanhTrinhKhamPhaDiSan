import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CommunityPage from './pages/CommunityPage';
import TourDetailPage from './pages/TourDetailPage';
import WalletPage from './pages/WalletPage';
import GuideCheckoutPage from './pages/GuideCheckoutPage';
import PartnerPage from './pages/PartnerPage';
import CheckinPage from './pages/CheckinPage';
import GuideSchedulePage from './pages/GuideSchedulePage';
import TourSearchPage from './pages/TourSearchPage';
import GuideSearchPage from './pages/GuideSearchPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ApplyPage from './pages/ApplyPage';
import ApplicationStatusPage from './pages/ApplicationStatusPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/guides/search" element={<GuideSearchPage />} />
          <Route path="/tours/search" element={<TourSearchPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply"
            element={
              <ProtectedRoute>
                <ApplyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply/status"
            element={
              <ProtectedRoute>
                <ApplicationStatusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guides/schedule"
            element={
              <ProtectedRoute>
                <GuideSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guides/checkout/:id"
            element={
              <ProtectedRoute>
                <GuideCheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partners/apply"
            element={
              <ProtectedRoute>
                <PartnerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkin"
            element={
              <ProtectedRoute>
                <CheckinPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
