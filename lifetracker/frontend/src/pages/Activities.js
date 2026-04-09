import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { format, addDays, subDays } from 'date-fns';

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

const CAT_COLOR = { Health:'#10b981', Productive:'#60a5fa', Personal:'#f472b6', Leisure:'#fb923c', General:'#a78bfa' };

function getIcon(name) { return ACTIVITY_PRESETS.find(a => a.name === name)?.icon || '⚡'; }
function timeSince(d) {
  const diff = Math.round((Date.now() - new Date(d)) / 60000);
  const h = Math.floor(diff / 60), m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtDur(min) {
  if (!min) return '0m';
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Activities() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const isToday = selectedDate === today;

  const [current, setCurrent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showInterrupt, setShowInterrupt] = useState(false);
  const [customActivity, setCustomActivity] = useState('');
  const [interruptForm, setInterruptForm] = useState({ activity: '', startTime: '', endTime: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const promises = [api.get(`/api/activities?date=${selectedDate}`)];
      if (isToday) promises.push(api.get('/api/activities/current'));
      const results = await Promise.all(promises);
      setLogs(results[0].data.logs || []);
      if (isToday) setCurrent(results[1].data.current);
      else setCurrent(null);
    } catch (e) { console.error(e); }
  }, [selectedDate, isToday]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setInterval(() => setTicker(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const startActivity = async (name, category) => {
    setLoading(true);
    try {
      await api.post('/api/activities/start', { activity: name, category });
      await fetchData();
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
      await fetchData();
    } catch (e) { alert('Error'); }
  };

  const deleteLog = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    await api.delete(`/api/activities/${id}`);
    fetchData();
  };

  const totalTracked = logs.reduce((s, l) => s + (l.durationMinutes || 0), 0);

  return (
    <div className="activities-page">

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Activity Timeline</div>
          <div className="page-subtitle">Track every moment of your day</div>
        </div>
        {isToday && (
          <button className="btn-add" onClick={() => setShowPicker(true)}>
            {current ? '⇄ Switch' : '▶ Start Activity'}
          </button>
        )}
      </div>

      {/* Date Navigator */}
      <div className="date-nav" style={{ marginBottom: 20 }}>
        <button className="date-arrow" onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}>←</button>
        <div className="date-center">
          <input type="date" value={selectedDate} max={today}
            onChange={e => setSelectedDate(e.target.value)}
            className="date-input"/>
          <span className="date-label-text">
            {isToday ? '📅 Today'
              : selectedDate === format(subDays(new Date(), 1), 'yyyy-MM-dd') ? '📅 Yesterday'
              : format(new Date(selectedDate + 'T00:00:00'), 'EEE, MMM d yyyy')}
          </span>
        </div>
        <button className="date-arrow" onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))} disabled={isToday}>→</button>
      </div>

      {/* Current Activity (today only) */}
      {isToday && (
        <div className="current-card" style={{ marginBottom: 16 }}>
          <div className="now-label">Now</div>
          {current ? (
            <>
              <div className="current-activity">
                <span className="current-icon">{getIcon(current.activity)}</span>
                <div>
                  <div className="current-name">{current.activity}</div>
                  <div className="current-time">Started {format(new Date(current.startTime), 'h:mm a')} · {timeSince(current.startTime)} ago</div>
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
      )}

      {/* Timeline */}
      <div className="card">
        <div className="card-label">
          {isToday ? 'Today\'s Timeline' : 'Timeline'} · {fmtDur(totalTracked)} tracked
        </div>
        {logs.length === 0 ? (
          <p className="empty-msg">No activities logged {isToday ? 'today' : 'on this day'} yet.</p>
        ) : (
          <div className="timeline">
            {logs.map(log => (
              <div key={log._id} className="timeline-item">
                <div className="timeline-dot"
                  style={{ background: CAT_COLOR[log.category] || 'var(--border3)', borderColor: CAT_COLOR[log.category] || 'var(--border3)' }}/>
                <div className="timeline-content">
                  <div className="timeline-activity">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{getIcon(log.activity)}</span>
                      <span style={{ fontWeight: 600 }}>{log.activity}</span>
                      {log.category && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: CAT_COLOR[log.category] + '22', color: CAT_COLOR[log.category], fontWeight: 700 }}>
                          {log.category}
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="timeline-dur">{fmtDur(log.durationMinutes || 0)}</span>
                      <button className="btn-delete" style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => deleteLog(log._id)}>✕</button>
                    </div>
                  </div>
                  <div className="timeline-times">
                    {format(new Date(log.startTime), 'h:mm a')}
                    {log.endTime ? ` → ${format(new Date(log.endTime), 'h:mm a')}` : ' → now'}
                  </div>
                  {log.interruptions?.map((intr, j) => (
                    <div key={j} className="interruption-item">
                      ↳ {intr.activity} ({fmtDur(intr.durationMinutes)}) — {intr.note || ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {isToday && current && (
              <div className="timeline-item">
                <div className="timeline-dot pulse" />
                <div className="timeline-content">
                  <div className="timeline-activity">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{getIcon(current.activity)}</span>
                      <span style={{ fontWeight: 600 }}>{current.activity}</span>
                    </span>
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

      {/* Activity Picker */}
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
              <input placeholder="Custom activity..." value={customActivity}
                onChange={e => setCustomActivity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && customActivity && startActivity(customActivity, 'General')} />
              <button onClick={() => customActivity && startActivity(customActivity, 'General')} disabled={!customActivity || loading}>Start</button>
            </div>
            <button className="modal-close" onClick={() => setShowPicker(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Interruption Modal */}
      {showInterrupt && (
        <div className="modal-overlay" onClick={() => setShowInterrupt(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Gap / Interruption</div>
            <p className="modal-sub">Add something that happened in between.</p>
            <input placeholder="What did you do?" value={interruptForm.activity}
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
              Add
            </button>
            <button className="modal-close" onClick={() => setShowInterrupt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
