import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthScene from './components/authscene';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import Results from './pages/Results';
import SecureCode from './pages/securecode';
import AdminDashboard from './pages/AdminDashboard'; 

const App = () => {
  // FIX: Synchronous state initialization. 
  // This checks local storage instantly before React even paints the first screen!
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('access_token') !== null;
  });

  // Fired when the Lamp UI finishes its success animation
  const handleLoginSuccess = (payload) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
  };

  return (
    // Wrap the ENTIRE app in BrowserRouter to prevent routing glitches
    <BrowserRouter>
      {!isAuthenticated ? (
        // IF NOT LOGGED IN: Show the Lamp UI 
        <Routes>
          <Route path="*" element={<AuthScene onSubmit={handleLoginSuccess} />} />
        </Routes>
      ) : (
        // IF LOGGED IN: Show the secure layout and specific pages
        <MainLayout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} /> {/* Added an alias just in case */}
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results" element={<Results />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MainLayout>
      )}
    </BrowserRouter>
  );
};

export default App;