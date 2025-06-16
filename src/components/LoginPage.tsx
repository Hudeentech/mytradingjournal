import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.PROD 
  ? 'https://mytradingjournal.vercel.app/api'
  : 'http://localhost:4000/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white/90 p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">Sign In</h1>
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <input
            className="p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            className="p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold py-3 rounded-lg shadow hover:scale-105 transition-transform"
          >
            Login
          </button>
        </form>
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="text-center text-sm mt-2">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-blue-600 hover:underline">Register</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
