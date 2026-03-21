import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import { loadGoogleAnalytics } from './utils/googleAnalytics';
import { hasAcceptedCookies } from './store/cookieConsentStore';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CreateContentPage from './pages/CreateContentPage';
import AdminDashboard from './pages/AdminDashboard';
import ContentDetailPage from './pages/ContentDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import RandomPage from './pages/RandomPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import AvisoLegalPage from './pages/AvisoLegalPage';
import PrivacidadPage from './pages/PrivacidadPage';
import CookiesPage from './pages/CookiesPage';
import TerminosPage from './pages/TerminosPage';
import useAuthStore from './store/authStore';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Redirige /profile/me al perfil del usuario actual (evita problemas de timing en móvil)
const ProfileMeRedirect = () => {
  const { user } = useAuthStore();
  const userId = user?.id ?? user?._id;
  if (!userId) return <Navigate to="/" replace />;
  return <Navigate to={`/profile/${userId}`} replace />;
};

function App() {
  useEffect(() => {
    if (hasAcceptedCookies()) {
      loadGoogleAnalytics();
    }
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <div className="min-vh-100 d-flex flex-column">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateContentPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/popular" element={<HomePage />} />
            <Route path="/trending" element={<Navigate to="/popular" replace />} />
            <Route path="/random" element={<RandomPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route
              path="/profile/me"
              element={
                <ProtectedRoute>
                  <ProfileMeRedirect />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/profile/:id" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route path="/category/:id" element={<HomePage />} />
            <Route path="/content/:id" element={<ContentDetailPage />} />
            <Route path="/aviso-legal" element={<AvisoLegalPage />} />
            <Route path="/privacidad" element={<PrivacidadPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/terminos" element={<TerminosPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />

        <CookieBanner onConsentChange={(v) => v === 'accepted' && loadGoogleAnalytics()} />

        <BackToTop />

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </Router>
  );
}

export default App;
