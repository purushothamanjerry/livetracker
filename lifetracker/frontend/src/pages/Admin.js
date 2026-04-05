import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { key: 'activities',    label: '⏱ Activity Timeline' },
  { key: 'health',        label: '💪 Health' },
  { key: 'expenses',      label: '💰 Expenses' },
  { key: 'notes',         label: '📝 Notes' },
  { key: 'schedule',      label: '📅 Schedule' },
  { key: 'relationships', label: '👥 Relationships' },
  { key: 'memories',      label: '💭 Memories' },
];

function PermissionToggle({ user, onUpdate }) {
  const [perms, setPerms] = useState(user.permissions || {});
  const [saving, setSaving] = useState(false);

  const toggle = async (key) => {
    const updated = { ...perms, [key]: !perms[key] };
    setPerms(updated);
    setSaving(true);
    try {
      await api.put(`/api/users/${user._id}/permissions`, updated);
      onUpdate();
    } catch (e) { alert('Error updating permissions'); }
    setSaving(false);
  };

  return (
    <div className="permission-grid">
      {FEATURES.map(f => (
        <button key={f.key}
          className={`perm-toggle ${perms[f.key] ? 'on' : 'off'}`}
          onClick={() => toggle(f.key)}
          disabled={saving}>
          {perms[f.key] ? '✓' : '✕'} {f.label}
        </button>
      ))}
    </div>
  );
}

function UserCard({ user, onAction }) {
  const [showPerms, setShowPerms] = useState(false);

  const statusColor = {
    pending: '#fbbf24', active: '#4ade80',
    blocked: '#f87171', rejected: '#94a3b8'
  };

  return (
    <div className={`user-request-card status-${user.status}`}>
      <div className="urc-header">
        <div className="urc-avatar" style={{ background: user.avatarColor || '#22d3ee' }}>
          {user.username?.[0]?.toUpperCase()}
        </div>
        <div className="urc-info">
          <div className="urc-name">{user.username}</div>
          <div className="urc-email">{user.email}</div>
          <div className="urc-meta">
            Requested: {new Date(user.requestedAt).toLocaleDateString('en-IN')}
            {user.approvedAt && ` · Approved: ${new Date(user.approvedAt).toLocaleDateString('en-IN')}`}
          </div>
        </div>
        <div className="urc-status" style={{ color: statusColor[user.status] }}>
          ● {user.status}
        </div>
      </div>

      {user.requestMessage && (
        <div className="urc-message">
          💬 "{user.requestMessage}"
        </div>
      )}

      {user.blockedReason && (
        <div className="urc-blocked-reason">🚫 Block reason: {user.blockedReason}</div>
      )}

      <div className="urc-actions">
        {user.status === 'pending' && (
          <>
            <button className="urc-btn approve" onClick={() => onAction(user._id, 'approve')}>
              ✓ Approve
            </button>
            <button className="urc-btn reject" onClick={() => onAction(user._id, 'reject')}>
              ✕ Reject
            </button>
          </>
        )}
        {user.status === 'active' && (
          <>
            <button className="urc-btn perms" onClick={() => setShowPerms(!showPerms)}>
              ⚙ Permissions
            </button>
            <button className="urc-btn block" onClick={() => {
              const reason = prompt('Block reason (optional):') || '';
              onAction(user._id, 'block', { reason });
            }}>🚫 Block</button>
          </>
        )}
        {user.status === 'blocked' && (
          <button className="urc-btn approve" onClick={() => onAction(user._id, 'unblock')}>
            ↩ Unblock
          </button>
        )}
        {user.status === 'rejected' && (
          <button className="urc-btn approve" onClick={() => onAction(user._id, 'approve')}>
            ↩ Re-approve
          </button>
        )}
        <button className="urc-btn delete" onClick={() => {
          if (window.confirm(`Delete ${user.username}?`)) onAction(user._id, 'delete');
        }}>🗑</button>
      </div>

      {showPerms && user.status === 'active' && (
        <div className="urc-perms-section">
          <div className="card-label">FEATURE ACCESS FOR {user.username.toUpperCase()}</div>
          <PermissionToggle user={user} onUpdate={() => {}} />
        </div>
      )}
    </div>
  );
}

export default function UsersAdmin() {
  const { user } = useAuth();
  const [data, setData] = useState({ pending: [], active: [], blocked: [], rejected: [] });
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user?.role === 'owner') fetchUsers(); }, [user]);

  const handleAction = async (userId, action, extra = {}) => {
    try {
      if (action === 'delete') {
        await api.delete(`/api/users/${userId}`);
      } else {
        await api.post(`/api/users/${userId}/${action}`, extra);
      }
      fetchUsers();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  if (user?.role !== 'owner') {
    return <div className="card"><p className="empty-msg">Owner access required.</p></div>;
  }

  const tabs = [
    { key: 'pending',  label: `⏳ Pending`,  count: data.pending.length  },
    { key: 'active',   label: `✓ Active`,    count: data.active.length   },
    { key: 'blocked',  label: `🚫 Blocked`,  count: data.blocked.length  },
    { key: 'rejected', label: `✕ Rejected`,  count: data.rejected.length },
  ];

  const currentList = data[tab] || [];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2 style={{ marginBottom: 4 }}>User Management</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            {data.pending.length > 0
              ? `⚠️ ${data.pending.length} pending request${data.pending.length > 1 ? 's' : ''} waiting!`
              : 'No pending requests'}
          </p>
        </div>
      </div>

      <div className="range-tabs" style={{ marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.key}
            className={`range-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
            {t.count > 0 && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card"><p className="empty-msg">Loading...</p></div>
      ) : currentList.length === 0 ? (
        <div className="card">
          <p className="empty-msg">No {tab} users.</p>
        </div>
      ) : (
        currentList.map(u => (
          <UserCard key={u._id} user={u} onAction={handleAction} />
        ))
      )}
    </div>
  );
}
