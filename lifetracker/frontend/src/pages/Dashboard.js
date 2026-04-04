import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';

const ACTIVITY_PRESETS = [
  { name: 'Sleep', icon: '😴', category: 'Health' },
  { name: 'Wake Up / Freshen Up', icon: '🌅', category: 'Health' },
  { name: 'Breakfast', icon: '🍳', category: 'Health' },
  { name: 'Lunch', icon: '🍱', category: 'Health' },
  { name: 'Dinner', icon: '🍽️', category: 'Health' },
  { name: 'Study', icon: '📚', category: 'Productive' },
  { name: 'Work', icon: '💼', category: 'Productive' },
  { name: 'Exercise', icon: '🏃', category: 'Health' },
  { name: 'Travel', icon: '🚗', category: 'Personal' },
  { name: 'Break', icon: '☕', category: 'Leisure' },
  { name: 'Entertainment', icon: '📱', category: 'Leisure' },
  { name: 'Chores', icon: '🧹', category: 'Personal' },
  { name: 'Social', icon: '👥', category: 'Personal' },
  { name: 'Other', icon: '⚡', category: 'General' },
];

function formatDuration(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function timeSince(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 60000);
  return formatDuration(diff);
}

export default function Dashboard() {
  const [current, setCurrent] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [ticker, setTicker] = useState(0);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [customActivity, setCustomActivity] = useState('');
  const [showInterrupt, setShowInterrupt] = useState(false);
  const [interruptForm, setInterruptForm] = useState({ activity: '', startTime: '', endTime: '', note: '' });
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchData = useCallback(async () => {
    const [cur, logs, sched] = await Promise.all([
      api.get('/api/activities/current'),
      api.get(`/api/activities?date=${today}`),
      api.get(`/api/schedules?date=${today}`),
    ]);
    setCurrent(cur.data.current);
    setTodayLogs(logs.data.logs);
    setSchedules(sched.data.schedules);
  }, [today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live clock tick every 30s
  useEffect(() => {
    const t = setInterval(() => setTicker(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const startActivity = async (activityName, category) => {
    setLoading(true);
    try {
      await api.post('/api/activities/start', { activity: activityName, category });
      await fetchData();
      setShowActivityPicker(false);
      setCustomActivity('');
    } catch (e) { alert(e.response?.data?.message || 'Error') }
    setLoading(false);
  };

  const addInterruption = async () => {
    try {
      await api.post('/api/activities/interrupt', interruptForm);
      setShowInterrupt(false);
      setInterruptForm({ activity: '', startTime: '', endTime: '', note: '' });
      await fetchData();
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  };

  const toggleTask = async (task) => {
    await api.put(`/api/schedules/${task._id}`, { completed: !task.completed });
    await fetchData();
  };

  const totalToday = todayLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0);

  const categoryColors = {
    Health: '#4ade80',
    Productive: '#60a5fa',
    Personal: '#f472b6',
    Leisure: '#fb923c',
    General: '#a78bfa',
  };

  return (
    <div className="dashboard">
      {/* Current Activity Card */}
      <div className="card current-card">
        <div className="card-label">NOW</div>
        {current ? (
          <>
            <div className="current-activity">
              <span className="current-icon">
                {ACTIVITY_PRESETS.find(a => a.name === current.activity)?.icon || '⚡'}
              </span>
              <div>
                <div className="current-name">{current.activity}</div>
                <div className="current-time">
                  Started {format(new Date(current.startTime), 'h:mm a')} · {timeSince(current.startTime)} ago
                </div>
              </div>
            </div>
            <div className="current-actions">
              <button className="btn-switch" onClick={() => setShowActivityPicker(true)}>
                ⇄ Switch Activity
              </button>
              <button className="btn-interrupt" onClick={() => setShowInterrupt(true)}>
                + Add Gap/Interruption
              </button>
            </div>
          </>
        ) : (
          <div className="no-activity">
            <p>No activity running</p>
            <button className="btn-switch" onClick={() => setShowActivityPicker(true)}>
              ▶ Start Activity
            </button>
          </div>
        )}
      </div>

      {/* Today's Schedule */}
      {schedules.length > 0 && (
        <div className="card">
          <div className="card-label">TODAY'S TASKS</div>
          <div className="task-list">
            {schedules.map(task => (
              <div key={task._id} className={`task-item ${task.completed ? 'done' : ''} priority-${task.priority}`}>
                <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} />
                <div className="task-info">
                  <span className="task-title">{task.title}</span>
                  {task.time && <span className="task-time">⏰ {task.time}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Timeline */}
      <div className="card">
        <div className="card-label">TODAY'S TIMELINE · {formatDuration(totalToday)} tracked</div>
        {todayLogs.length === 0 ? (
          <p className="empty-msg">No activities logged today yet.</p>
        ) : (
          <div className="timeline">
            {todayLogs.map((log, i) => (
              <div key={log._id} className="timeline-item">
                <div className="timeline-dot" style={{ background: categoryColors[log.category] || '#a78bfa' }} />
                <div className="timeline-content">
                  <div className="timeline-activity">
                    <span>{ACTIVITY_PRESETS.find(a => a.name === log.activity)?.icon || '⚡'} {log.activity}</span>
                    <span className="timeline-dur">{formatDuration(log.durationMinutes || 0)}</span>
                  </div>
                  <div className="timeline-times">
                    {format(new Date(log.startTime), 'h:mm a')}
                    {log.endTime ? ` → ${format(new Date(log.endTime), 'h:mm a')}` : ' → now'}
                  </div>
                  {log.interruptions?.length > 0 && (
                    <div className="interruptions">
                      {log.interruptions.map((intr, j) => (
                        <div key={j} className="interruption-item">
                          ↳ {intr.activity} ({formatDuration(intr.durationMinutes)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {current && (
              <div className="timeline-item active">
                <div className="timeline-dot pulse" style={{ background: '#22d3ee' }} />
                <div className="timeline-content">
                  <div className="timeline-activity">
                    <span>{ACTIVITY_PRESETS.find(a => a.name === current.activity)?.icon || '⚡'} {current.activity}</span>
                    <span className="timeline-dur live">● LIVE</span>
                  </div>
                  <div className="timeline-times">
                    {format(new Date(current.startTime), 'h:mm a')} → now ({timeSince(current.startTime)})
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Picker Modal */}
      {showActivityPicker && (
        <div className="modal-overlay" onClick={() => setShowActivityPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {current ? 'Switch Activity' : 'Start Activity'}
            </div>
            <div className="activity-grid">
              {ACTIVITY_PRESETS.map(a => (
                <button
                  key={a.name}
                  className={`activity-btn ${current?.activity === a.name ? 'active-btn' : ''}`}
                  onClick={() => startActivity(a.name, a.category)}
                  disabled={loading}
                >
                  <span className="act-icon">{a.icon}</span>
                  <span className="act-name">{a.name}</span>
                </button>
              ))}
            </div>
            <div className="custom-activity">
              <input
                placeholder="Custom activity name..."
                value={customActivity}
                onChange={e => setCustomActivity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && customActivity && startActivity(customActivity, 'General')}
              />
              <button
                onClick={() => customActivity && startActivity(customActivity, 'General')}
                disabled={!customActivity || loading}
              >Start</button>
            </div>
            <button className="modal-close" onClick={() => setShowActivityPicker(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Interruption Modal */}
      {showInterrupt && (
        <div className="modal-overlay" onClick={() => setShowInterrupt(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Gap / Interruption</div>
            <p className="modal-sub">Something happened between your activity? Add it here.</p>
            <input
              placeholder="What did you do? (e.g. Phone call)"
              value={interruptForm.activity}
              onChange={e => setInterruptForm({ ...interruptForm, activity: e.target.value })}
            />
            <label>Start Time</label>
            <input type="datetime-local"
              value={interruptForm.startTime}
              onChange={e => setInterruptForm({ ...interruptForm, startTime: e.target.value })}
            />
            <label>End Time</label>
            <input type="datetime-local"
              value={interruptForm.endTime}
              onChange={e => setInterruptForm({ ...interruptForm, endTime: e.target.value })}
            />
            <input
              placeholder="Note (optional)"
              value={interruptForm.note}
              onChange={e => setInterruptForm({ ...interruptForm, note: e.target.value })}
            />
            <button onClick={addInterruption} disabled={!interruptForm.activity || !interruptForm.startTime || !interruptForm.endTime}>
              Add Interruption
            </button>
            <button className="modal-close" onClick={() => setShowInterrupt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
