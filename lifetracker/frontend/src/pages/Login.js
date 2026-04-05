import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | request
  const [form, setForm] = useState({ email: '', password: '', username: '', requestMessage: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      const status = err.response?.data?.status;
      if (status === 'pending') {
        setError('⏳ Your account is pending approval. The owner will review your request.');
      } else if (status === 'blocked') {
        setError('🚫 Your access has been blocked by the owner.');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/api/auth/request-access', {
        username: form.username,
        email: form.email,
        password: form.password,
        requestMessage: form.requestMessage,
      });
      if (res.data.isOwner) {
        // First user = owner, log them in
        await login(form.email, form.password);
        navigate('/');
      } else {
        setSuccess('✅ Request sent! Please wait for the owner to approve your account.');
        setMode('login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="plm-logo">
          <div className="plm-logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <circle cx="20" cy="20" r="3" fill="currentColor"/>
              <line x1="20" y1="20" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="20" y1="20" x2="30" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <circle cx="20" cy="6" r="2" fill="currentColor"/>
              <circle cx="34" cy="20" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="6" cy="20" r="1.5" fill="currentColor" opacity="0.5"/>
              <circle cx="20" cy="34" r="1.5" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <div className="plm-logo-title">Personal Life Manager</div>
            <div className="plm-logo-sub">Your private life dashboard</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
            Login
          </button>
          <button className={`auth-tab ${mode === 'request' ? 'active' : ''}`}
            onClick={() => { setMode('request'); setError(''); setSuccess(''); }}>
            Request Access
          </button>
        </div>

        {success && <div className="success-msg">{success}</div>}
        {error && <div className="error-msg">{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequest}>
            <input placeholder="Username"
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            <input type="email" placeholder="Email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Password (min 6 chars)"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <textarea placeholder="Why do you want access? (optional)"
              value={form.requestMessage}
              onChange={e => setForm({ ...form, requestMessage: e.target.value })}
              rows={2} style={{ marginBottom: 12 }} />
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Access Request'}
            </button>
            <p className="auth-note">
              Your request will be reviewed by the owner before you can login.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
