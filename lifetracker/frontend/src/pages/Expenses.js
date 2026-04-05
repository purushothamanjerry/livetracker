import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export default function Expenses() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [view, setView] = useState('list'); // list | monthly
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
    await api.post('/api/expenses', { ...form, amount: Number(form.amount) });
    setForm({ itemName: '', amount: '', category: 'Food', paymentMethod: 'UPI', note: '', date: today, time: format(new Date(), 'HH:mm') });
    setShowForm(false);
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

  const paymentIcon = { UPI: '📲', Cash: '💵', 'Bank Transfer': '🏦', Card: '💳', Other: '💰' };

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <div className="view-tabs">
          <button className={`range-tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>📋 Expenses</button>
          <button className={`range-tab ${view === 'monthly' ? 'active' : ''}`} onClick={() => setView('monthly')}>📊 Monthly</button>
          <button className={`range-tab ${view === 'search' ? 'active' : ''}`} onClick={() => setView('search')}>🔍 Item History</button>
        </div>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="card form-card">
          <div className="card-label">NEW EXPENSE</div>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label>Item Name</label>
                <input required placeholder="e.g. Soap, Auto ride, Lunch"
                  value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input required type="number" placeholder="0"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                  {PAYMENT_METHODS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <input placeholder="Note (optional)" value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })} />
            <button type="submit">Add Expense</button>
          </form>
        </div>
      )}

      {/* Item Search / History */}
      {view === 'search' && (
        <div className="card">
          <div className="card-label">WHEN DID I LAST BUY THIS?</div>
          <div className="search-row">
            <input placeholder="Type item name (e.g. Soap, Shampoo)"
              value={searchItem} onChange={e => setSearchItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkLastBought()} />
            <button onClick={checkLastBought}>Search</button>
          </div>
          {lastBought ? (
            <div className="last-bought-card">
              <div className="lb-item">📦 {lastBought.itemName}</div>
              <div className="lb-amount">{formatINR(lastBought.amount)}</div>
              <div className="lb-date">📅 Last bought: {lastBought.date}</div>
              <div className="lb-days">
                {Math.floor((Date.now() - new Date(lastBought.date)) / (1000*60*60*24))} days ago
              </div>
              <div className="lb-pay">{paymentIcon[lastBought.paymentMethod]} {lastBought.paymentMethod}</div>
              {lastBought.note && <div className="lb-note">📝 {lastBought.note}</div>}
            </div>
          ) : searchItem && lastBought === null ? (
            <p className="empty-msg">Never bought "{searchItem}" before.</p>
          ) : null}
        </div>
      )}

      {/* Monthly Summary */}
      {view === 'monthly' && summary && (
        <>
          <div className="stats-summary">
            <div className="stat-box">
              <div className="stat-val">{formatINR(summary.total)}</div>
              <div className="stat-lbl">This Month Total</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{summary.count}</div>
              <div className="stat-lbl">Transactions</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{formatINR(Math.round(summary.total / 30))}</div>
              <div className="stat-lbl">Daily Average</div>
            </div>
          </div>
          <div className="charts-row">
            <div className="card chart-card">
              <div className="card-label">BY CATEGORY</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CAT_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {pieData.sort((a,b) => b.value - a.value).map(d => (
                  <div key={d.name} className="legend-item">
                    <span className="legend-dot" style={{ background: CAT_COLORS[d.name] }} />
                    <span>{d.name}</span>
                    <span className="legend-val">{formatINR(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card chart-card">
              <div className="card-label">BY PAYMENT METHOD</div>
              <div className="payment-breakdown">
                {paymentData.sort((a,b) => b.value - a.value).map(d => (
                  <div key={d.name} className="payment-row">
                    <span>{paymentIcon[d.name]} {d.name}</span>
                    <div className="payment-bar-wrap">
                      <div className="payment-bar"
                        style={{ width: `${(d.value / summary.total) * 100}%` }} />
                    </div>
                    <span className="payment-amount">{formatINR(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Expense List */}
      {view === 'list' && (
        <>
          <div className="expense-filters card">
            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label>From</label>
                <input type="date" value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
              </div>
              <div className="form-group">
                <label>To</label>
                <input type="date" value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">All</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              {expenses.length} EXPENSES · TOTAL {formatINR(total)}
            </div>
            {expenses.length === 0 ? (
              <p className="empty-msg">No expenses in this range.</p>
            ) : (
              <div className="expense-list">
                {expenses.map(exp => (
                  <div key={exp._id} className="expense-item">
                    <div className="exp-cat-dot" style={{ background: CAT_COLORS[exp.category] }} />
                    <div className="exp-body">
                      <div className="exp-name">{exp.itemName}</div>
                      <div className="exp-meta">
                        <span className="exp-cat">{exp.category}</span>
                        <span className="exp-pay">{paymentIcon[exp.paymentMethod]} {exp.paymentMethod}</span>
                        <span className="exp-date">{exp.date} {exp.time}</span>
                      </div>
                      {exp.note && <div className="exp-note">{exp.note}</div>}
                    </div>
                    <div className="exp-amount">{formatINR(exp.amount)}</div>
                    <button className="btn-delete" onClick={() => deleteExpense(exp._id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
