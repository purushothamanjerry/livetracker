import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../utils/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const CATEGORIES = ['Food', 'Travel', 'Personal Care', 'Health', 'Education', 'Entertainment', 'Shopping', 'Utilities', 'Rent', 'Investment', 'Other'];
const PAYMENT_METHODS = ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Other'];

const CAT_COLORS = {
  Food: '#fb923c', Travel: '#60a5fa', 'Personal Care': '#f472b6',
  Health: '#4ade80', Education: '#a78bfa', Entertainment: '#fbbf24',
  Shopping: '#34d399', Utilities: '#94a3b8', Rent: '#f87171',
  Investment: '#22d3ee', Other: '#64748b'
};

const CAT_ICONS = {
  Food: '🍽️', Travel: '✈️', 'Personal Care': '💆', Health: '💊',
  Education: '📚', Entertainment: '🎬', Shopping: '🛍️',
  Utilities: '⚡', Rent: '🏠', Investment: '📈', Other: '💼'
};

const PAY_ICONS = { UPI: '📲', Cash: '💵', 'Bank Transfer': '🏦', Card: '💳', Other: '💰' };
const PAY_COLORS = { UPI: '#06b6d4', Cash: '#10b981', 'Bank Transfer': '#8b5cf6', Card: '#f59e0b', Other: '#64748b' };

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function StatCard({ icon, value, label, color = 'var(--cyan)', sub }) {
  return (
    <div className="exp-stat-card" style={{ '--stat-color': color }}>
      <div className="exp-stat-icon">{icon}</div>
      <div className="exp-stat-body">
        <div className="exp-stat-val">{value}</div>
        <div className="exp-stat-lbl">{label}</div>
        {sub && <div className="exp-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function Expenses() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    itemName: '', amount: '', category: 'Food',
    paymentMethod: 'UPI', note: '', date: today, time: format(new Date(), 'HH:mm')
  });
  const [filterCategory, setFilterCategory] = useState('');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [lastBought, setLastBought] = useState(null);
  const [searchItem, setSearchItem] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchExpenses = async () => {
    const res = await api.get(`/api/expenses?start=${dateRange.start}&end=${dateRange.end}${filterCategory ? `&category=${filterCategory}` : ''}`);
    setExpenses(res.data.expenses);
  };

  const fetchSummary = async () => {
    const now = new Date();
    const res = await api.get(`/api/expenses/summary?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
    setSummary(res.data);
  };

  useEffect(() => { fetchExpenses(); fetchSummary(); }, [dateRange, filterCategory]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    await api.post('/api/expenses', { ...form, amount: Number(form.amount) });
    setForm({ itemName: '', amount: '', category: 'Food', paymentMethod: 'UPI', note: '', date: today, time: format(new Date(), 'HH:mm') });
    setShowForm(false);
    setAdding(false);
    fetchExpenses();
    fetchSummary();
  };

  const deleteExpense = async (id) => {
    await api.delete(`/api/expenses/${id}`);
    fetchExpenses();
    fetchSummary();
  };

  const checkLastBought = async () => {
    if (!searchItem) return;
    const res = await api.get(`/api/expenses/last-item?itemName=${searchItem}`);
    setLastBought(res.data.last);
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const pieData = summary ? Object.entries(summary.byCategory).map(([name, value]) => ({ name, value })) : [];
  const paymentData = summary ? Object.entries(summary.byPayment).map(([name, value]) => ({ name, value })) : [];

  // Group expenses by date for list view
  const grouped = expenses.reduce((acc, exp) => {
    const d = exp.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(exp);
    return acc;
  }, {});

  return (
    <div className="expenses-page">

      {/* ── Header ── */}
      <div className="exp-header">
        <div className="exp-header-left">
          <h1 className="exp-title">💰 Expenses</h1>
          <p className="exp-subtitle">Track every rupee you spend</p>
        </div>
        <div className="exp-header-right">
          <div className="exp-view-tabs">
            {[
              { id: 'list', label: '📋 List' },
              { id: 'monthly', label: '📊 Monthly' },
              { id: 'search', label: '🔍 History' },
            ].map(t => (
              <button
                key={t.id}
                className={`exp-tab ${view === t.id ? 'active' : ''}`}
                onClick={() => setView(t.id)}
              >{t.label}</button>
            ))}
          </div>
          <button className="exp-btn-add" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Expense'}
          </button>
        </div>
      </div>

      {/* ── Quick Stats Row (always visible) ── */}
      {summary && (
        <div className="exp-stats-row">
          <StatCard icon="💸" value={formatINR(summary.total)} label="This Month" color="var(--cyan)" />
          <StatCard icon="📦" value={summary.count} label="Transactions" color="var(--purple)" />
          <StatCard icon="📅" value={formatINR(Math.round(summary.total / 30))} label="Daily Avg" color="var(--orange)" />
          <StatCard
            icon="🏆"
            value={pieData.sort((a, b) => b.value - a.value)[0]?.name || '—'}
            label="Top Category"
            color="var(--pink)"
            sub={pieData[0] ? formatINR(pieData[0].value) : ''}
          />
        </div>
      )}

      {/* ── Add Expense Form ── */}
      {showForm && (
        <div className="exp-form-card">
          <div className="exp-form-header">
            <span>✨ New Expense</span>
            <button className="exp-form-close" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <form onSubmit={handleAdd}>
            {/* Category picker */}
            <div className="exp-form-section-label">CATEGORY</div>
            <div className="exp-cat-picker">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`exp-cat-chip ${form.category === c ? 'active' : ''}`}
                  style={{ '--chip-color': CAT_COLORS[c] }}
                  onClick={() => setForm({ ...form, category: c })}
                >
                  <span>{CAT_ICONS[c]}</span>
                  <span>{c}</span>
                </button>
              ))}
            </div>

            <div className="exp-form-row">
              <div className="exp-form-group">
                <label>Item Name *</label>
                <input required placeholder="e.g. Lunch, Auto, Soap"
                  value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} />
              </div>
              <div className="exp-form-group exp-form-group--sm">
                <label>Amount (₹) *</label>
                <input required type="number" placeholder="0" min="0"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>

            <div className="exp-form-section-label">PAYMENT METHOD</div>
            <div className="exp-pay-picker">
              {PAYMENT_METHODS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`exp-pay-chip ${form.paymentMethod === p ? 'active' : ''}`}
                  style={{ '--pay-color': PAY_COLORS[p] }}
                  onClick={() => setForm({ ...form, paymentMethod: p })}
                >
                  {PAY_ICONS[p]} {p}
                </button>
              ))}
            </div>

            <div className="exp-form-row">
              <div className="exp-form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="exp-form-group">
                <label>Time</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>

            <div className="exp-form-group">
              <label>Note (optional)</label>
              <input placeholder="Any details..." value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>

            <button type="submit" className="exp-btn-submit" disabled={adding}>
              {adding ? 'Adding...' : `Add ${form.itemName ? `"${form.itemName}"` : 'Expense'} ${form.amount ? `· ${formatINR(form.amount)}` : ''}`}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════
          VIEW: LIST
      ══════════════════════════════════ */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div className="exp-filters">
            <div className="exp-filter-group">
              <label>From</label>
              <input type="date" value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
            </div>
            <div className="exp-filter-group">
              <label>To</label>
              <input type="date" value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
            </div>
            <div className="exp-filter-group">
              <label>Category</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="exp-filter-total">
              <span className="exp-filter-count">{expenses.length} expenses</span>
              <span className="exp-filter-sum">{formatINR(total)}</span>
            </div>
          </div>

          {/* Expense cards */}
          {expenses.length === 0 ? (
            <div className="exp-empty">
              <div className="exp-empty-icon">🧾</div>
              <div className="exp-empty-text">No expenses in this range</div>
              <button className="exp-btn-add" onClick={() => setShowForm(true)}>+ Add First Expense</button>
            </div>
          ) : (
            <div className="exp-list-section">
              {Object.entries(grouped)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .map(([date, items]) => (
                  <div key={date} className="exp-date-group">
                    <div className="exp-date-header">
                      <span className="exp-date-label">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="exp-date-total">
                        {formatINR(items.reduce((s, e) => s + e.amount, 0))}
                      </span>
                    </div>
                    <div className="exp-cards-grid">
                      {items.map(exp => (
                        <div key={exp._id} className="exp-card" style={{ '--cat-color': CAT_COLORS[exp.category] }}>
                          <div className="exp-card-top">
                            <div className="exp-card-icon">{CAT_ICONS[exp.category]}</div>
                            <div className="exp-card-body">
                              <div className="exp-card-name">{exp.itemName}</div>
                              <div className="exp-card-meta">
                                <span className="exp-card-cat" style={{ color: CAT_COLORS[exp.category] }}>
                                  {exp.category}
                                </span>
                                <span className="exp-card-dot">·</span>
                                <span className="exp-card-pay">{PAY_ICONS[exp.paymentMethod]} {exp.paymentMethod}</span>
                                <span className="exp-card-dot">·</span>
                                <span className="exp-card-time">{exp.time}</span>
                              </div>
                              {exp.note && <div className="exp-card-note">📝 {exp.note}</div>}
                            </div>
                            <div className="exp-card-right">
                              <div className="exp-card-amount">{formatINR(exp.amount)}</div>
                              <button className="exp-card-delete" onClick={() => deleteExpense(exp._id)} title="Delete">✕</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════
          VIEW: MONTHLY
      ══════════════════════════════════ */}
      {view === 'monthly' && summary && (
        <div className="exp-monthly">
          <div className="exp-charts-grid">
            {/* Pie: By Category */}
            <div className="exp-chart-card">
              <div className="exp-chart-title">🍩 By Category</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CAT_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => formatINR(v)} contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="exp-legend">
                {pieData.sort((a, b) => b.value - a.value).map(d => (
                  <div key={d.name} className="exp-legend-item">
                    <span className="exp-legend-dot" style={{ background: CAT_COLORS[d.name] }} />
                    <span className="exp-legend-name">{CAT_ICONS[d.name]} {d.name}</span>
                    <span className="exp-legend-val">{formatINR(d.value)}</span>
                    <span className="exp-legend-pct">{Math.round((d.value / summary.total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="exp-chart-card">
              <div className="exp-chart-title">💳 By Payment Method</div>
              <div className="exp-payment-list">
                {paymentData.sort((a, b) => b.value - a.value).map(d => (
                  <div key={d.name} className="exp-payment-item">
                    <div className="exp-payment-top">
                      <span className="exp-payment-name" style={{ color: PAY_COLORS[d.name] }}>
                        {PAY_ICONS[d.name]} {d.name}
                      </span>
                      <span className="exp-payment-amount">{formatINR(d.value)}</span>
                    </div>
                    <div className="exp-payment-track">
                      <div
                        className="exp-payment-fill"
                        style={{
                          width: `${(d.value / summary.total) * 100}%`,
                          background: PAY_COLORS[d.name]
                        }}
                      />
                    </div>
                    <div className="exp-payment-pct">{Math.round((d.value / summary.total) * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category breakdown boxes */}
          <div className="exp-chart-title" style={{ marginTop: 8, marginBottom: 12 }}>📦 Category Breakdown</div>
          <div className="exp-cat-breakdown">
            {pieData.sort((a, b) => b.value - a.value).map(d => (
              <div key={d.name} className="exp-cat-box" style={{ '--cat-color': CAT_COLORS[d.name] }}>
                <div className="exp-cat-box-icon">{CAT_ICONS[d.name]}</div>
                <div className="exp-cat-box-name">{d.name}</div>
                <div className="exp-cat-box-val">{formatINR(d.value)}</div>
                <div className="exp-cat-box-pct">{Math.round((d.value / summary.total) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          VIEW: ITEM HISTORY
      ══════════════════════════════════ */}
      {view === 'search' && (
        <div className="exp-search-section">
          <div className="exp-search-card">
            <div className="exp-search-icon">🔍</div>
            <div className="exp-search-title">When did I last buy this?</div>
            <div className="exp-search-row">
              <input
                placeholder="Type item name e.g. Soap, Shampoo, Coffee..."
                value={searchItem}
                onChange={e => setSearchItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkLastBought()}
                className="exp-search-input"
              />
              <button className="exp-search-btn" onClick={checkLastBought}>Search</button>
            </div>
          </div>

          {lastBought ? (
            <div className="exp-result-card" style={{ '--cat-color': CAT_COLORS[lastBought.category] || 'var(--cyan)' }}>
              <div className="exp-result-header">
                <span className="exp-result-icon">{CAT_ICONS[lastBought.category] || '📦'}</span>
                <div>
                  <div className="exp-result-name">{lastBought.itemName}</div>
                  <div className="exp-result-cat">{lastBought.category}</div>
                </div>
                <div className="exp-result-amount">{formatINR(lastBought.amount)}</div>
              </div>
              <div className="exp-result-meta">
                <div className="exp-result-stat">
                  <span className="exp-result-stat-label">Last bought</span>
                  <span className="exp-result-stat-val">📅 {lastBought.date}</span>
                </div>
                <div className="exp-result-stat">
                  <span className="exp-result-stat-label">Days ago</span>
                  <span className="exp-result-stat-val exp-result-days">
                    {Math.floor((Date.now() - new Date(lastBought.date)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div className="exp-result-stat">
                  <span className="exp-result-stat-label">Paid via</span>
                  <span className="exp-result-stat-val">{PAY_ICONS[lastBought.paymentMethod]} {lastBought.paymentMethod}</span>
                </div>
              </div>
              {lastBought.note && (
                <div className="exp-result-note">📝 {lastBought.note}</div>
              )}
            </div>
          ) : searchItem && lastBought === null ? (
            <div className="exp-empty">
              <div className="exp-empty-icon">🤷</div>
              <div className="exp-empty-text">Never bought "{searchItem}" before</div>
            </div>
          ) : null}
        </div>
      )}

      <style>{`
        /* ── PAGE LAYOUT ── */
        .expenses-page {
          padding: 28px 32px;
          max-width: 1100px;
        }

        /* ── HEADER ── */
        .exp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .exp-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text);
          margin: 0 0 3px;
        }
        .exp-subtitle {
          font-size: 12px;
          color: var(--text3);
          font-weight: 500;
        }
        .exp-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .exp-view-tabs {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: 3px;
          gap: 3px;
        }
        .exp-tab {
          padding: 7px 14px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text2);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font);
          transition: all 0.15s;
          white-space: nowrap;
        }
        .exp-tab.active {
          background: var(--cyan-dim);
          color: var(--cyan2);
          border: 1px solid rgba(6,182,212,0.2);
        }
        .exp-btn-add {
          background: linear-gradient(135deg, var(--cyan), #0ea5e9);
          color: #000;
          border: none;
          padding: 9px 18px;
          border-radius: var(--r-sm);
          cursor: pointer;
          font-family: var(--font);
          font-weight: 700;
          font-size: 13px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .exp-btn-add:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ── STATS ROW ── */
        .exp-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .exp-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .exp-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--stat-color, var(--cyan));
          opacity: 0.6;
        }
        .exp-stat-card:hover { border-color: var(--border2); transform: translateY(-2px); }
        .exp-stat-icon { font-size: 24px; flex-shrink: 0; }
        .exp-stat-val {
          font-size: 18px;
          font-weight: 800;
          font-family: var(--mono);
          color: var(--stat-color, var(--cyan));
          line-height: 1;
        }
        .exp-stat-lbl {
          font-size: 10px;
          color: var(--text3);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin-top: 4px;
        }
        .exp-stat-sub {
          font-size: 11px;
          color: var(--text2);
          margin-top: 2px;
          font-family: var(--mono);
        }

        /* ── ADD FORM ── */
        .exp-form-card {
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: var(--r-xl);
          padding: 24px;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
          animation: slideDown 0.25s ease;
        }
        .exp-form-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--cyan), var(--purple), var(--pink));
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .exp-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }
        .exp-form-close {
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text3);
          width: 28px; height: 28px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .exp-form-close:hover { color: var(--red); border-color: rgba(239,68,68,0.3); }
        .exp-form-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: var(--text3);
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .exp-cat-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 18px;
        }
        .exp-cat-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--text2);
          cursor: pointer;
          font-size: 12px;
          font-family: var(--font);
          font-weight: 500;
          transition: all 0.15s;
        }
        .exp-cat-chip:hover { border-color: var(--border2); color: var(--text); }
        .exp-cat-chip.active {
          background: color-mix(in srgb, var(--chip-color) 12%, transparent);
          border-color: color-mix(in srgb, var(--chip-color) 40%, transparent);
          color: var(--chip-color);
          font-weight: 600;
        }
        .exp-pay-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 18px;
        }
        .exp-pay-chip {
          padding: 8px 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          color: var(--text2);
          cursor: pointer;
          font-size: 13px;
          font-family: var(--font);
          font-weight: 500;
          transition: all 0.15s;
        }
        .exp-pay-chip:hover { color: var(--text); border-color: var(--border2); }
        .exp-pay-chip.active {
          background: color-mix(in srgb, var(--pay-color) 12%, transparent);
          border-color: color-mix(in srgb, var(--pay-color) 40%, transparent);
          color: var(--pay-color);
          font-weight: 700;
        }
        .exp-form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 4px;
        }
        .exp-form-group { flex: 1; }
        .exp-form-group--sm { flex: 0 0 160px; }
        .exp-btn-submit {
          width: 100%;
          background: linear-gradient(135deg, var(--cyan), #0ea5e9);
          color: #000;
          border: none;
          padding: 12px 22px;
          border-radius: var(--r-sm);
          cursor: pointer;
          font-weight: 800;
          font-size: 14px;
          font-family: var(--font);
          transition: all 0.2s;
          margin-top: 8px;
          letter-spacing: 0.3px;
        }
        .exp-btn-submit:hover { opacity: 0.88; transform: translateY(-1px); }
        .exp-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ── FILTERS ── */
        .exp-filters {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 16px 20px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .exp-filter-group { flex: 1; min-width: 130px; }
        .exp-filter-total {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-left: auto;
          gap: 2px;
          padding-bottom: 2px;
        }
        .exp-filter-count { font-size: 11px; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; }
        .exp-filter-sum { font-size: 20px; font-weight: 800; font-family: var(--mono); color: var(--cyan); }

        /* ── EXPENSE LIST ── */
        .exp-list-section { display: flex; flex-direction: column; gap: 20px; }
        .exp-date-group {}
        .exp-date-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding: 0 2px;
        }
        .exp-date-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .exp-date-total {
          font-size: 12px;
          font-weight: 700;
          color: var(--text2);
          font-family: var(--mono);
        }
        .exp-cards-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .exp-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 14px 16px;
          transition: all 0.15s;
          position: relative;
          overflow: hidden;
        }
        .exp-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--cat-color, var(--cyan));
          border-radius: 3px 0 0 3px;
        }
        .exp-card:hover { border-color: var(--border2); background: var(--surface2); }
        .exp-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .exp-card-icon {
          font-size: 22px;
          flex-shrink: 0;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface2);
          border-radius: 8px;
        }
        .exp-card-body { flex: 1; min-width: 0; }
        .exp-card-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .exp-card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 3px;
          flex-wrap: wrap;
        }
        .exp-card-cat { font-size: 11px; font-weight: 600; }
        .exp-card-dot { color: var(--text3); font-size: 10px; }
        .exp-card-pay { font-size: 11px; color: var(--text2); }
        .exp-card-time { font-size: 11px; color: var(--text3); font-family: var(--mono); }
        .exp-card-note { font-size: 11px; color: var(--text3); margin-top: 4px; font-style: italic; }
        .exp-card-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .exp-card-amount {
          font-size: 15px;
          font-weight: 800;
          color: var(--cyan);
          font-family: var(--mono);
        }
        .exp-card-delete {
          background: transparent;
          border: none;
          color: var(--text3);
          cursor: pointer;
          font-size: 11px;
          padding: 4px 6px;
          border-radius: 6px;
          transition: all 0.15s;
          opacity: 0;
        }
        .exp-card:hover .exp-card-delete { opacity: 1; }
        .exp-card-delete:hover { color: var(--red); background: var(--red-dim); }

        /* ── EMPTY STATE ── */
        .exp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 20px;
          color: var(--text3);
        }
        .exp-empty-icon { font-size: 40px; }
        .exp-empty-text { font-size: 14px; color: var(--text2); font-weight: 500; }

        /* ── MONTHLY ── */
        .exp-monthly {}
        .exp-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .exp-chart-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 20px;
        }
        .exp-chart-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 16px;
        }
        .exp-legend { display: flex; flex-direction: column; gap: 6px; }
        .exp-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .exp-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .exp-legend-name { flex: 1; color: var(--text2); }
        .exp-legend-val { font-family: var(--mono); font-weight: 700; color: var(--text); }
        .exp-legend-pct { font-size: 10px; color: var(--text3); font-family: var(--mono); width: 32px; text-align: right; }

        .exp-payment-list { display: flex; flex-direction: column; gap: 14px; }
        .exp-payment-item {}
        .exp-payment-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .exp-payment-name { font-size: 13px; font-weight: 600; }
        .exp-payment-amount { font-size: 13px; font-weight: 700; font-family: var(--mono); color: var(--text); }
        .exp-payment-track {
          height: 6px;
          background: var(--surface2);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 3px;
        }
        .exp-payment-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        .exp-payment-pct { font-size: 10px; color: var(--text3); font-family: var(--mono); text-align: right; }

        .exp-cat-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 10px;
        }
        .exp-cat-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 14px 16px;
          text-align: center;
          transition: all 0.15s;
          position: relative;
          overflow: hidden;
        }
        .exp-cat-box::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: var(--cat-color);
          opacity: 0.5;
        }
        .exp-cat-box:hover { border-color: var(--border2); transform: translateY(-2px); }
        .exp-cat-box-icon { font-size: 22px; margin-bottom: 6px; }
        .exp-cat-box-name { font-size: 11px; color: var(--text3); font-weight: 600; margin-bottom: 6px; }
        .exp-cat-box-val { font-size: 14px; font-weight: 800; font-family: var(--mono); color: var(--cat-color); }
        .exp-cat-box-pct { font-size: 10px; color: var(--text3); margin-top: 2px; font-family: var(--mono); }

        /* ── SEARCH ── */
        .exp-search-section { display: flex; flex-direction: column; gap: 16px; }
        .exp-search-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-xl);
          padding: 32px;
          text-align: center;
        }
        .exp-search-icon { font-size: 32px; margin-bottom: 8px; }
        .exp-search-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 20px; }
        .exp-search-row {
          display: flex;
          gap: 10px;
          max-width: 500px;
          margin: 0 auto;
        }
        .exp-search-input { flex: 1; margin: 0; }
        .exp-search-btn {
          padding: 10px 20px;
          background: var(--cyan);
          color: #000;
          border: none;
          border-radius: var(--r-sm);
          font-weight: 700;
          font-size: 13px;
          font-family: var(--font);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .exp-search-btn:hover { opacity: 0.85; }

        .exp-result-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-xl);
          padding: 24px;
          position: relative;
          overflow: hidden;
          animation: slideDown 0.2s ease;
        }
        .exp-result-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--cat-color);
        }
        .exp-result-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .exp-result-icon { font-size: 36px; }
        .exp-result-name { font-size: 20px; font-weight: 800; color: var(--text); }
        .exp-result-cat { font-size: 12px; color: var(--cat-color); font-weight: 600; margin-top: 2px; }
        .exp-result-amount {
          margin-left: auto;
          font-size: 24px;
          font-weight: 800;
          font-family: var(--mono);
          color: var(--cyan);
        }
        .exp-result-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background: var(--surface2);
          border-radius: var(--r);
          padding: 16px;
        }
        .exp-result-stat { text-align: center; }
        .exp-result-stat-label { font-size: 10px; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 6px; }
        .exp-result-stat-val { font-size: 13px; font-weight: 600; color: var(--text2); }
        .exp-result-days { color: var(--cyan); font-family: var(--mono); font-size: 15px; font-weight: 800; }
        .exp-result-note { margin-top: 14px; font-size: 13px; color: var(--text2); background: var(--surface2); border-radius: var(--r-sm); padding: 10px 14px; border-left: 3px solid var(--border2); }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .expenses-page { padding: 16px 14px 76px; }
          .exp-stats-row { grid-template-columns: 1fr 1fr; }
          .exp-charts-grid { grid-template-columns: 1fr; }
          .exp-header { flex-direction: column; }
          .exp-header-right { width: 100%; }
          .exp-view-tabs { flex: 1; }
          .exp-tab { flex: 1; text-align: center; font-size: 11px; padding: 6px 8px; }
          .exp-filters { flex-direction: column; }
          .exp-filter-total { flex-direction: row; align-items: center; justify-content: space-between; width: 100%; margin-left: 0; }
          .exp-result-meta { grid-template-columns: 1fr; }
          .exp-form-row { flex-direction: column; }
          .exp-form-group--sm { flex: 1; }
        }
      `}</style>
    </div>
  );
}