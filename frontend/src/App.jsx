import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

import LandingPage      from './pages/LandingPage';
import ServicesPage     from './pages/ServicesPage';
import AboutPage        from './pages/AboutPage';
import HowItWorksPage   from './pages/HowItWorksPage';
import TrackingPage     from './pages/TrackingPage';
import ContactPage      from './pages/ContactPage';
import FAQPage          from './pages/FAQPage';
import RequestQuotePage from './pages/RequestQuotePage';
import RegisterPage     from './pages/RegisterPage';
import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import QuoteDetailPage  from './pages/QuoteDetailPage';
import KYCPage          from './pages/KYCPage';
import ShipmentsPage    from './pages/ShipmentsPage';
import ShipmentDetailPage from './pages/ShipmentDetailPage';

// Pages that render their own full-page layout (no shared Navbar)
const STANDALONE = ['/quote', '/login', '/register', '/dashboard', '/shipments'];

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated
    ? children
    : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function Layout() {
  const location = useLocation();
  const isStandalone = STANDALONE.some(p => location.pathname.startsWith(p));

  return (
    <>
      {!isStandalone && <Navbar />}
      <Routes>
        {/* Public pages with shared Navbar */}
        <Route path="/"             element={<LandingPage />} />
        <Route path="/services"     element={<ServicesPage />} />
        <Route path="/about"        element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/tracking"     element={<TrackingPage />} />
        <Route path="/contact"      element={<ContactPage />} />
        <Route path="/faq"          element={<FAQPage />} />

        {/* Standalone pages (own layout) */}
        <Route path="/quote"    element={<RequestQuotePage />} />
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Protected */}
        <Route path="/dashboard"        element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/dashboard/quotations" element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
        <Route path="/dashboard/shipments" element={<PrivateRoute><ShipmentsPage /></PrivateRoute>} />
        <Route path="/dashboard/shipments/:id" element={<PrivateRoute><ShipmentDetailPage /></PrivateRoute>} />
        <Route path="/quote/detail/:id" element={<PrivateRoute><QuoteDetailPage /></PrivateRoute>} />
        <Route path="/profile/verify"   element={<PrivateRoute><KYCPage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
