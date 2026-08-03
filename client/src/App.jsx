import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import RoomHub from './pages/RoomHub';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-darkBg text-white antialiased">
        <Routes>
          <Route path="/" element={<Auth />} />
          {/* Placeholders for our upcoming screens */}
          <Route path="/room-hub" element={<div className="p-8 text-center text-neonGreen font-bold">Student Room Hub Placeholder</div>} />
          <Route path="/vendor-dashboard" element={<div className="p-8 text-center text-neonCyan font-bold">Canteen Bhaiya Dashboard Placeholder</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;