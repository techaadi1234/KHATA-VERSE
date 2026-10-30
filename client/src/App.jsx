import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import RoomHub from './pages/RoomHub';
import Navbar from './components/Navbar';
import Canteen from './pages/Canteen';
import VendorDashboard from './pages/VendorDashboard';
import Ledger from './pages/Ledger';
import Dashboard from './pages/Dashboard';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('khataverse_user') || 'null');
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('khataverse_token');
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'vendor' ? '/vendor-dashboard' : '/room-hub';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

const AuthRoute = () => {
  const token = localStorage.getItem('khataverse_token');
  const user = getStoredUser();

  if (token && user) {
    return (
      <Navigate
        to={user.role === 'vendor' ? '/vendor-dashboard' : '/room-hub'}
        replace
      />
    );
  }

  return <Auth />;
};

const MainLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-darkBg text-white antialiased">
      {!isAuthPage && <Navbar />}
      <Routes>
        <Route path="/" element={<AuthRoute />} />

        <Route
          path="/room-hub"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <RoomHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/canteen"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Canteen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ledger"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Ledger />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor-dashboard"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
