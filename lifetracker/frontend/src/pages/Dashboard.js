import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { format, addDays, differenceInDays } from 'date-fns';

const ACTIVITY_PRESETS = [
  { name: 'Sleep',              icon: '😴', category: 'Health'     },
  { name: 'Wake Up / Freshen Up', icon: '🌅', category: 'Health'  },
  { name: 'Breakfast',          icon: '🍳', category: 'Health'     },
  { name: 'Lunch',              icon: '🍱', category: 'Health'     },
  { name: 'Dinner',             icon: '🍽️', category: 'Health'    },
  { name: 'Study',              icon: '📚', category: 'Productive' },
  { name: 'Work',               icon: '💼', category: 'Productive' },
  { name: 'Exercise',           icon: '🏃', category: 'Health'     },
  { name: 'Travel',             icon: '🚗', category: 'Personal'   },
  { name: 'Break',              icon: '☕', category: 'Leisure'    },
  { name: 'Entertainment',      icon: '📱', category: 'Leisure'    },
  { name: 'Chores',             icon: '🧹', category: 'Personal'   },
  { name: 'Social',             icon: '👥', category: 'Personal'   },
  { name: 'Other',              icon: '⚡', category: 'General'    },
];

function getIcon(name) {
  return ACTIVITY_PRESETS.find(a => a.name === name)?.icon || '⚡';
}

function timeSince(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 60000);
  const h = Math.floor(diff / 60), m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function getBirthdayInfo(dob) {
  if (!dob) return null;
  const today = new Date();
  const parts = dob.split('-');
  if (parts.length < 3) return null;
  const m = parseInt(parts[1]) - 1, d = parseInt(parts[2]);
  const thisYear = new Date(today.getFullYear(), m, d);
  const target = thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, m, d);
  const days = differenceInDays(target, today);
  return { days, label: `${target.toLocaleString('default', { month: 'short' })} ${d}`, isToday: days === 0 };
}

export default function Dashboard() {
  const [current, setCurrent] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [weekExpenses, setWeekExpenses] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showInterrupt, setShowInterrupt] = useState(false);
  const [customActivity, setCustomActivity] = useState('');
  const [interruptForm, setInterruptForm] = useState({ activity: '', startTime: '', endTime: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState(0);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)), 'yyyy-MM-dd');

  const fetchAll = useCallback(async () => {
    try {
      const [curRes, schedRes, bdRes, expTodayRes, expWeekRes, healthRes] = await Promise.all([
        api.get('/api/activities/current'),
        api.get(`/api/schedules?date=${today}`),
        api.get('/api/people/birthdays/upcoming'),
        api.get(`/api/expenses?date=${today}`),
        api.get(`/api/expenses?start=${weekStart}&end=${today}`),
        api.get('/api/health'),
      ]);
      setCurrent(curRes.data.current);
      setSchedules(schedRes.data.schedules || []);
      setBirthdays(bdRes.data.upcoming || []);
      setTodayExpenses(expTodayRes.data.total || 0);
      setWeekExpenses(expWeekRes.data.total || 0);
      const entries = healthRes.data.entries || [];
      const latest = entries.find(e => e.weight);
      if (latest) setCurrentWeight(latest.weight);
    } catch (e) { console.error(e); }
  }, [today, weekStart]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const t = setInterval(() => setTicker(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const startActivity = async (name, category) => {
    setLoading(true);
    try {
      await api.post('/api/activities/start', { activity: name, category });
      await fetchAll();
      setShowPicker(false);
      setCustomActivity('');
    } catch (e) { alert('Error'); }
    setLoading(false);
  };

  const addInterruption = async () => {
    try {
      await api.post('/api/activities/interrupt', interruptForm);
      setShowInterrupt(false);
      setInterruptForm({ activity: '', startTime: '', endTime: '', note: '' });
      await fetchAll();
    } catch (e) { alert('Error'); }
  };

  const toggleTask = async (task) => {
    await api.put(`/api/schedules/${task._id}`, { completed: !task.completed });
    await fetchAll();
  };

  const todayBirthdays = birthdays.filter(b => b.daysUntil === 0);
  const upcomingBirthdays = birthdays.filter(b => b.daysUntil > 0 && b.daysUntil <= 15);
  const pendingTasks = schedules.filter(t => !t.completed);
  const doneTasks = schedules.filter(t => t.completed);

  return (
    <div className="dashboard">

      {/* Birthday alerts */}
      {birthdays.length > 0 && (
        <div className="birthday-banner">
          {todayBirthdays.map(b => (
            <div key={b.person._id} className="birthday-item">
              🎂 <strong>{b.person.name}</strong> — Birthday TODAY! 🎉
            </div>
          ))}
          {upcomingBirthdays.map(b => (
            <div key={b.person._id} className="birthday-item">
              🎂 <strong>{b.person.name}</strong> — Birthday in {b.daysUntil} day{b.daysUntil > 1 ? 's' : ''} ({b.date})
            </div>
          ))}
        </div>
      )}

      {/* Current Activity — Hero */}
      <div className="current-card card-accent-top">
        <div className="now-label">Now</div>
        {current ? (
          <>
            <div className="current-activity">
              <span className="current-icon">{getIcon(current.activity)}</span>
              <div>
                <div className="current-name">{current.activity}</div>
                <div className="current-time">
                  Started {format(new Date(current.startTime), 'h:mm a')} · {timeSince(current.startTime)} ago
                </div>
              </div>
            </div>
            <div className="current-actions">
              <button className="btn-switch" onClick={() => setShowPicker(true)}>⇄ Switch Activity</button>
              <button className="btn-interrupt" onClick={() => setShowInterrupt(true)}>+ Add Gap</button>
            </div>
          </>
        ) : (
          <div className="no-activity">
            <p>No activity running</p>
            <button className="btn-switch" onClick={() => setShowPicker(true)}>▶ Start Activity</button>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="db-stats-row">
        <div className="db-stat-card">
          <div className="db-stat-icon">💰</div>
          <div>
            <div className="db-stat-val">{formatINR(todayExpenses)}</div>
            <div className="db-stat-lbl">Today's Spend</div>
          </div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-icon">📅</div>
          <div>
            <div className="db-stat-val">{formatINR(weekExpenses)}</div>
            <div className="db-stat-lbl">This Week</div>
          </div>
        </div>
        {currentWeight && (
          <div className="db-stat-card">
            <div className="db-stat-icon">⚖️</div>
            <div>
              <div className="db-stat-val">{currentWeight} kg</div>
              <div className="db-stat-lbl">Current Weight</div>
            </div>
          </div>
        )}
        <div className="db-stat-card">
          <div className="db-stat-icon">✅</div>
          <div>
            <div className="db-stat-val">{doneTasks.length}/{schedules.length}</div>
            <div className="db-stat-lbl">Tasks Done</div>
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      {schedules.length > 0 && (
        <div className="card">
          <div className="card-label">Today's Tasks</div>
          {schedules.map(task => (
            <div key={task._id} className={`task-item ${task.completed ? 'done' : ''}`}>
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} />
              <div className="task-info">
                <span className="task-title">{task.title}</span>
                {task.time && <span className="task-time">⏰ {task.time}</span>}
                <span className={`task-priority-dot priority-${task.priority}`}>●</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Picker Modal */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{current ? '⇄ Switch Activity' : '▶ Start Activity'}</div>
            <div className="activity-grid">
              {ACTIVITY_PRESETS.map(a => (
                <button key={a.name}
                  className={`activity-btn ${current?.activity === a.name ? 'active-btn' : ''}`}
                  onClick={() => startActivity(a.name, a.category)} disabled={loading}>
                  <span className="act-icon">{a.icon}</span>
                  <span className="act-name">{a.name}</span>
                </button>
              ))}
            </div>
            <div className="custom-activity">
              <input placeholder="Custom activity name..."
                value={customActivity}
                onChange={e => setCustomActivity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && customActivity && startActivity(customActivity, 'General')} />
              <button onClick={() => customActivity && startActivity(customActivity, 'General')}
                disabled={!customActivity || loading}>Start</button>
            </div>
            <button className="modal-close" onClick={() => setShowPicker(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Gap/Interruption Modal */}
      {showInterrupt && (
        <div className="modal-overlay" onClick={() => setShowInterrupt(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Gap / Interruption</div>
            <p className="modal-sub">Add something that happened between your activity.</p>
            <input placeholder="What did you do? (e.g. Phone call)"
              value={interruptForm.activity}
              onChange={e => setInterruptForm({ ...interruptForm, activity: e.target.value })} />
            <label>Start Time</label>
            <input type="datetime-local" value={interruptForm.startTime}
              onChange={e => setInterruptForm({ ...interruptForm, startTime: e.target.value })} />
            <label>End Time</label>
            <input type="datetime-local" value={interruptForm.endTime}
              onChange={e => setInterruptForm({ ...interruptForm, endTime: e.target.value })} />
            <input placeholder="Note (optional)" value={interruptForm.note}
              onChange={e => setInterruptForm({ ...interruptForm, note: e.target.value })} />
            <button onClick={addInterruption}
              disabled={!interruptForm.activity || !interruptForm.startTime || !interruptForm.endTime}
              style={{ background: 'linear-gradient(135deg, var(--cyan), #0ea5e9)', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, width: '100%', fontFamily: 'var(--font)' }}>
              Add Interruption
            </button>
            <button className="modal-close" onClick={() => setShowInterrupt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}