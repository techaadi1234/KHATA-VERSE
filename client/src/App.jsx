import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import RoomHub from './pages/RoomHub';
import Navbar from './components/Navbar';
import Canteen from './pages/Canteen';
import VendorDashboard from './pages/VendorDashboard';
import Ledger from './pages/Ledger';
import Dashboard from './pages/Dashboard';

// Route protection helper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('khataverse_token');
  return token ? children : <Navigate to="/" replace />;
};

// Layout component to control Navbar visibility
const MainLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-darkBg text-white antialiased">
      {!isAuthPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Auth />} />
        
        <Route 
          path="/room-hub" 
          element={
            <ProtectedRoute>
              <RoomHub />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/vendor-dashboard" 
          element={
            <ProtectedRoute>
              <div className="p-8 text-center text-neonCyan font-bold">Canteen Bhaiya Dashboard Placeholder</div>
            </ProtectedRoute>
          } 
        />
        <Route 
  path="/canteen" 
  element={
    <ProtectedRoute>
      <Canteen />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/ledger" 
  element={
    <ProtectedRoute>
      <Ledger />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/vendor-dashboard" 
  element={
    <ProtectedRoute>
      <VendorDashboard />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
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