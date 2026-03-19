import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CreateContentPage from './pages/CreateContentPage';
import AdminDashboard from './pages/AdminDashboard';
import ContentDetailPage from './pages/ContentDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import RandomPage from './pages/RandomPage';
import ProfilePage from './pages/ProfilePage';
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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-vh-100 d-flex flex-column">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
            <Route path="/settings" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />

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
