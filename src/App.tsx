import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Dashboard from './components/Dashboard'
import Home from './components/Home'
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      {/* Add Google OAuth callback handler */}
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}

function AuthCallback() {
  // Parse token from URL and store in localStorage, then redirect
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const username = params.get('username');
    if (token) {
      localStorage.setItem('token', token);
      if (username) localStorage.setItem('username', username);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate]);
  return <div className="flex items-center justify-center min-h-screen text-lg">Signing in...</div>;
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppRoutes />
    </div>
  );
}

export default App
