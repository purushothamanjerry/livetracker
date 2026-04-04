import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { format, addDays } from 'date-fns';

export default function Scheduler() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'),
    time: '', priority: 'medium'
  });
  const [showForm, setShowForm] = useState(false);
  const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchTasks = async () => {
    const end = format(addDays(new Date(viewDate), 30), 'yyyy-MM-dd');
    const res = await api.get(`/api/schedules?start=${viewDate}&end=${end}`);
    setTasks(res.data.schedules);
  };

  useEffect(() => { fetchTasks(); }, [viewDate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/api/schedules', form);
    setForm({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', priority: 'medium' });
    setShowForm(false);
    fetchTasks();
  };

  const toggle = async (task) => {
    await api.put(`/api/schedules/${task._id}`, { completed: !task.completed });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await api.delete(`/api/schedules/${id}`);
    fetchTasks();
  };

  // Group by date
  const grouped = tasks.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const dateLabel = (d) => {
    if (d === today) return 'Today';
    if (d === tomorrow) return 'Tomorrow';
    return format(new Date(d + 'T00:00:00'), 'EEE, MMM d');
  };

  const priorityColor = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Task'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <form onSubmit={handleAdd}>
            <input required placeholder="Task title"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input placeholder="Description (optional)"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Time (optional)</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <button type="submit">Add Task</button>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="card"><p className="empty-msg">No upcoming tasks. Add one!</p></div>
      ) : (
        Object.entries(grouped).map(([date, dateTasks]) => (
          <div key={date} className="date-group">
            <div className="date-label">{dateLabel(date)}</div>
            {dateTasks.map(task => (
              <div key={task._id} className={`task-card ${task.completed ? 'done' : ''}`}>
                <input type="checkbox" checked={task.completed} onChange={() => toggle(task)} />
                <div className="task-body">
                  <div className="task-title-row">
                    <span className="task-title">{task.title}</span>
                    <span className="task-priority" style={{ color: priorityColor[task.priority] }}>
                      ● {task.priority}
                    </span>
                  </div>
                  {task.description && <div className="task-desc">{task.description}</div>}
                  {task.time && <div className="task-time">⏰ {task.time}</div>}
                </div>
                <button className="btn-delete" onClick={() => deleteTask(task._id)}>✕</button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
