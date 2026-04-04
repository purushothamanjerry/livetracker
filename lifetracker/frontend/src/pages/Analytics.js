import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';

const COLORS = {
  Health: '#4ade80',
  Productive: '#60a5fa',
  Personal: '#f472b6',
  Leisure: '#fb923c',
  General: '#a78bfa',
  Sleep: '#818cf8',
};

function getColor(name) {
  return COLORS[name] || '#' + Math.floor(Math.random()*16777215).toString(16);
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Analytics() {
  const [range, setRange] = useState('week'); // week, month, custom
  const [stats, setStats] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getRangeDates = () => {
    const now = new Date();
    if (range === 'week') return {
      start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    };
    if (range === 'lastweek') return {
      start: format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    };
    if (range === 'month') return {
      start: format(startOfMonth(now), 'yyyy-MM-dd'),
      end: format(endOfMonth(now), 'yyyy-MM-dd')
    };
    if (range === 'lastmonth') return {
      start: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
      end: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
    };
    return { start: format(startOfWeek(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { start, end } = getRangeDates();
      const [statsRes, logsRes] = await Promise.all([
        api.get(`/api/activities/stats?start=${start}&end=${end}`),
        api.get(`/api/activities?start=${start}&end=${end}`)
      ]);

      setStats(statsRes.data.summary);

      // Build daily bar chart data
      const byDay = {};
      logsRes.data.logs.forEach(log => {
        if (!byDay[log.date]) byDay[log.date] = { date: log.date, Productive: 0, Health: 0, Leisure: 0, Personal: 0, General: 0 };
        const cat = log.category || 'General';
        byDay[log.date][cat] = (byDay[log.date][cat] || 0) + Math.round((log.durationMinutes || 0) / 60 * 10) / 10;
      });
      setDailyData(Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)));
      setLoading(false);
    };
    fetchStats();
  }, [range]);

  const pieData = stats ? Object.entries(stats).map(([name, val]) => ({
    name,
    value: val.totalMinutes,
    category: val.category
  })) : [];

  const totalMinutes = pieData.reduce((s, d) => s + d.value, 0);
  const sortedActivities = pieData.sort((a, b) => b.value - a.value);

  return (
    <div className="analytics-page">
      <div className="range-tabs">
        {[
          { key: 'week', label: 'This Week' },
          { key: 'lastweek', label: 'Last Week' },
          { key: 'month', label: 'This Month' },
          { key: 'lastmonth', label: 'Last Month' },
        ].map(r => (
          <button key={r.key} className={`range-tab ${range === r.key ? 'active' : ''}`}
            onClick={() => setRange(r.key)}>{r.label}</button>
        ))}
      </div>

      {loading ? <div className="loading">Loading stats...</div> : (
        <>
          <div className="stats-summary">
            <div className="stat-box">
              <div className="stat-val">{formatDuration(totalMinutes)}</div>
              <div className="stat-lbl">Total Tracked</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{formatDuration(stats?.['Study']?.totalMinutes || stats?.['Work']?.totalMinutes || 0)}</div>
              <div className="stat-lbl">Study / Work</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{formatDuration(stats?.['Sleep']?.totalMinutes || 0)}</div>
              <div className="stat-lbl">Sleep</div>
            </div>
          </div>

          <div className="charts-row">
            <div className="card chart-card">
              <div className="card-label">ACTIVITY BREAKDOWN</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={getColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatDuration(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card chart-card">
              <div className="card-label">DAILY HOURS BY CATEGORY</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                  <YAxis unit="h" />
                  <Tooltip />
                  <Legend />
                  {['Productive', 'Health', 'Leisure', 'Personal'].map(cat => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[cat]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-label">TOP ACTIVITIES</div>
            <div className="activity-list">
              {sortedActivities.map((a, i) => (
                <div key={a.name} className="activity-row">
                  <span className="activity-rank">#{i + 1}</span>
                  <span className="activity-name">{a.name}</span>
                  <div className="activity-bar-wrap">
                    <div className="activity-bar"
                      style={{
                        width: `${(a.value / (sortedActivities[0]?.value || 1)) * 100}%`,
                        background: getColor(a.category)
                      }} />
                  </div>
                  <span className="activity-time">{formatDuration(a.value)}</span>
                  <span className="activity-pct">{Math.round(a.value / totalMinutes * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
