import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Health from './pages/Health';
import Scheduler from './pages/Scheduler';
import Notes from './pages/Notes';
import Admin from './pages/Admin';
import Login from './pages/Login';
import './App.css';

function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⏱</span>
          <span className="logo-text">LifeTracker</span>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="user-name">{user?.username}</div>
        </div>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span>🏠</span> Dashboard
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span>📊</span> Analytics
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span>📅</span> Schedule
          </NavLink>
          <NavLink to="/health" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span>💪</span> Health
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span>📝</span> Notes
          </NavLink>
          {user?.isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <span>👤</span> Users
            </NavLink>
          )}
        </div>
        <button className="logout-btn" onClick={logout}>↩ Logout</button>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/schedule" element={<Scheduler />} />
          <Route path="/health" element={<Health />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGate />} />
          <Route path="/*" element={
            <ProtectedRoute><Layout /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LoginGate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading...</div>;
  if (user) return <Navigate to="/" />;
  return <Login />;
}
