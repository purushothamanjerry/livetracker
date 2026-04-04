import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [msg, setMsg] = useState('');

  const fetchUsers = async () => {
    const res = await api.get('/api/users');
    setUsers(res.data.users);
  };

  useEffect(() => { if (user?.isAdmin) fetchUsers(); }, [user]);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', form);
      setMsg('User created successfully!');
      setForm({ username: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error creating user');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/api/users/${id}`);
    fetchUsers();
  };

  if (!user?.isAdmin) {
    return <div className="card"><p>Admin access required.</p></div>;
  }

  return (
    <div className="admin-page">
      <div className="card">
        <div className="card-label">ADD NEW USER</div>
        <form onSubmit={createUser}>
          <input required placeholder="Username"
            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <input required type="email" placeholder="Email"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input required type="password" placeholder="Password"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          {msg && <div className={msg.includes('success') ? 'success-msg' : 'error-msg'}>{msg}</div>}
          <button type="submit">Create User</button>
        </form>
      </div>

      <div className="card">
        <div className="card-label">ALL USERS</div>
        {users.map(u => (
          <div key={u._id} className="user-row">
            <div className="user-info">
              <span className="user-name">{u.username}</span>
              <span className="user-email">{u.email}</span>
              {u.isAdmin && <span className="admin-badge">ADMIN</span>}
            </div>
            {!u.isAdmin && (
              <button className="btn-delete" onClick={() => deleteUser(u._id)}>Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
