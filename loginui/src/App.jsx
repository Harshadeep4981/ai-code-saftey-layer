import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthScene from './components/authscene';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import Results from './pages/Results';
import SecureCode from './pages/securecode';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is already logged in when they refresh the page
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fired when the Lamp UI finishes its success animation
  const handleLoginSuccess = (payload) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
  };

  // 1. IF NOT LOGGED IN: Show the Lamp UI (No routing needed yet)
  if (!isAuthenticated) {
    return <AuthScene onSubmit={handleLoginSuccess} />;
  }

  // 2. IF LOGGED IN: Show the Dashboard inside the Premium Layout
  return (
    <BrowserRouter>
      <MainLayout onLogout={handleLogout}>
        <Routes>
          {/* The Home Page */}
          <Route path="/" element={<Dashboard />} />
          
          {/* The Code Editor Page */}
          <Route path="/analyze" element={<Analyze />} />
          
          {/* The Score & AI Explanation Page */}
          <Route path="/results" element={<Results />} />
          
          <Route path="/secure-code" element={<SecureCode />} />
          
          {/* Fallback: If they type a weird URL, send them back to the dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;