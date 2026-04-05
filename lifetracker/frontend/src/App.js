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
import Expenses from './pages/Expenses';
import Relationships from './pages/Relationships';
import './App.css';
import './NewFeatures.css';

function PLMLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <circle cx="16" cy="16" r="3" fill="currentColor"/>
      <line x1="16" y1="16" x2="16" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="16" x2="24" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <circle cx="16" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="27" cy="16" r="1.2" fill="currentColor" opacity="0.5"/>
      <circle cx="5" cy="16" r="1.2" fill="currentColor" opacity="0.5"/>
      <circle cx="16" cy="27" r="1.2" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

function Layout() {
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner';
  const perms = user?.permissions || {};

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '🏠', always: true },
    { to: '/analytics', label: 'Analytics', icon: '📊', always: true },
    { to: '/schedule', label: 'Schedule', icon: '📅', perm: 'schedule' },
    { to: '/health', label: 'Health', icon: '💪', perm: 'health' },
    { to: '/expenses', label: 'Expenses', icon: '💰', perm: 'expenses' },
    { to: '/relationships', label: 'People', icon: '👥', perm: 'relationships' },
    { to: '/notes', label: 'Notes', icon: '📝', perm: 'notes' },
  ];

  const visibleNav = navItems.filter(item => item.always || isOwner || perms[item.perm]);

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div style={{ color: 'var(--accent)' }}><PLMLogo /></div>
          <div>
            <div className="logo-text">Personal Life</div>
            <div className="logo-sub">Manager</div>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{isOwner ? '👑 Owner' : '👤 Guest'}</div>
          </div>
        </div>
        <div className="nav-links">
          {visibleNav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
          {isOwner && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <span>⚙️</span> Users
            </NavLink>
          )}
        </div>
        <button className="logout-btn" onClick={logout}>↩ Logout</button>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/schedule" element={<PermGuard perm="schedule"><Scheduler /></PermGuard>} />
          <Route path="/health" element={<PermGuard perm="health"><Health /></PermGuard>} />
          <Route path="/expenses" element={<PermGuard perm="expenses"><Expenses /></PermGuard>} />
          <Route path="/relationships" element={<PermGuard perm="relationships"><Relationships /></PermGuard>} />
          <Route path="/notes" element={<PermGuard perm="notes"><Notes /></PermGuard>} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

function PermGuard({ perm, children }) {
  const { user } = useAuth();
  if (user?.role === 'owner') return children;
  if (!user?.permissions?.[perm]) {
    return (
      <div className="card" style={{ margin: 24 }}>
        <p style={{ textAlign: 'center', padding: 40 }}>
          🔒 You don't have access to this feature.<br/>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Contact the owner to request access.</span>
        </p>
      </div>
    );
  }
  return children;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function LoginGate() {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader">Loading...</div>;
  if (user) return <Navigate to="/" />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGate />} />
          <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
