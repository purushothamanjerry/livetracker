import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import api from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';

const EMOTIONS = [
  { value:'joyful',      emoji:'😄', label:'Joyful',      color:'#fbbf24' },
  { value:'grateful',    emoji:'🙏', label:'Grateful',    color:'#4ec9b0' },
  { value:'nostalgic',   emoji:'🌅', label:'Nostalgic',   color:'#a78bfa' },
  { value:'peaceful',    emoji:'🌿', label:'Peaceful',    color:'#6ee7b7' },
  { value:'excited',     emoji:'⚡', label:'Excited',     color:'#fb923c' },
  { value:'bittersweet', emoji:'🌧', label:'Bittersweet', color:'#818cf8' },
  { value:'sad',         emoji:'💧', label:'Sad',         color:'#60a5fa' },
  { value:'proud',       emoji:'🏆', label:'Proud',       color:'#d4a853' },
  { value:'loved',       emoji:'❤️', label:'Loved',       color:'#e8637a' },
  { value:'funny',       emoji:'😂', label:'Funny',       color:'#f472b6' },
  { value:'inspiring',   emoji:'✨', label:'Inspiring',   color:'#c4b5fd' },
  { value:'mixed',       emoji:'🌀', label:'Mixed',       color:'#9ca3af' },
];
const EMOTION_MAP = Object.fromEntries(EMOTIONS.map(e => [e.value, e]));

function getInitials(n = '') { return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }

// ── Memory Form ───────────────────────────────────────────────────
function MemoryForm({ memory, people, onSave, onCancel }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(memory?.title || '');
  const [description, setDescription] = useState(memory?.description || '');
  const [date, setDate] = useState(memory?.date ? new Date(memory.date).toISOString().split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
  const [place, setPlace] = useState(memory?.place || '');
  const [emotion, setEmotion] = useState(memory?.emotion || 'joyful');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(memory?.tags || []);
  const [selPeople, setSelPeople] = useState(memory?.peopleInvolved?.map(p => p._id || p) || []);
  const [isFavorite, setFavorite] = useState(memory?.isFavorite || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTagInput('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); setStep(1); return; }
    if (!date) { setError('Date is required'); setStep(1); return; }
    setSaving(true); setError('');
    try {
      const payload = { title, description, date, place, emotion, tags, isFavorite, peopleInvolved: selPeople };
      if (memory) await api.put(`/api/memories/${memory._id}`, payload);
      else        await api.post('/api/memories', payload);
      onSave();
    } catch (e) { setError(e.response?.data?.error || 'Something went wrong'); }
    finally { setSaving(false); }
  };

  const modal = (
    <div className="mform-overlay">
      <div className="mform-modal">
        <div className="mform-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>◈</span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{memory ? 'Edit Memory' : 'Capture a Memory'}</h2>
              <div className="mform-steps">
                {['Details', 'People & Tags', 'Finish'].map((s, i) => (
                  <React.Fragment key={s}>
                    <button className={`mfstep ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}
                      onClick={() => step > i + 1 && setStep(i + 1)}>{step > i + 1 ? '✓' : i + 1}</button>
                    {i < 2 && <div className={`mfstep-line ${step > i + 1 ? 'done' : ''}`} />}
                    <span className={`mfstep-txt ${step === i + 1 ? 'show' : ''}`}>{s}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <button className="mform-close" onClick={onCancel}>✕</button>
        </div>

        {error && <div className="mform-error">{error}</div>}

        {step === 1 && (
          <div className="mform-body">
            <div>
              <label>Memory Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give this memory a title..." />
            </div>
            <div>
              <label>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label>Place / Location</label>
              <input value={place} onChange={e => setPlace(e.target.value)} placeholder="Where did this happen?" />
            </div>
            <div>
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe the memory... Use @name to mention people"
                rows={4} className="mform-textarea" />
            </div>
            <div>
              <label>How did it feel?</label>
              <div className="emotion-grid">
                {EMOTIONS.map(em => (
                  <button key={em.value} type="button"
                    className={`emo-btn ${emotion === em.value ? 'active' : ''}`}
                    style={emotion === em.value ? { borderColor: em.color, background: em.color + '22' } : {}}
                    onClick={() => setEmotion(em.value)}>
                    <span className="emo-icon">{em.emoji}</span>
                    <span className="emo-label" style={emotion === em.value ? { color: em.color } : {}}>{em.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mform-body">
            <div>
              <label>People Involved</label>
              <div className="people-picker">
                {people.map(p => (
                  <button key={p._id} type="button"
                    className={`person-picker-btn ${selPeople.includes(p._id) ? 'active' : ''}`}
                    style={selPeople.includes(p._id) ? { borderColor: 'var(--cyan)', background: 'var(--cyan-dim)' } : {}}
                    onClick={() => setSelPeople(prev => prev.includes(p._id) ? prev.filter(x => x !== p._id) : [...prev, p._id])}>
                    <div className="ppb-avatar">
                      {p.photo ? <img src={p.photo} alt={p.name} /> : <div style={{ background: 'var(--surface3)', color: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 10, fontWeight: 700 }}>{getInitials(p.name)}</div>}
                    </div>
                    <span className="ppb-name">{p.name}</span>
                    {selPeople.includes(p._id) && <span className="ppb-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label>Tags</label>
              <div className="editor-tags-row" style={{ marginBottom: 8 }}>
                {tags.map(t => (
                  <span key={t} className="editor-tag" style={{ '--ea': 'var(--purple)' }}>
                    #{t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))}>✕</button>
                  </span>
                ))}
                <input className="editor-tag-input" placeholder="Add tag..." value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }} />
              </div>
              <button type="button" onClick={addTag} className="btn-secondary" style={{ fontSize: 12 }}>+ Add Tag</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ margin: 0 }}>Mark as Favorite</label>
              <input type="checkbox" checked={isFavorite} onChange={e => setFavorite(e.target.checked)}
                style={{ width: 18, height: 18, margin: 0, cursor: 'pointer', accentColor: 'var(--yellow)' }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mform-body">
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Summary</div>
              {[
                ['Title', title],
                ['Date', date],
                ['Place', place],
                ['Feeling', EMOTION_MAP[emotion]?.emoji + ' ' + EMOTION_MAP[emotion]?.label],
                ['People', selPeople.length > 0 ? `${selPeople.length} people` : 'None'],
                ['Tags', tags.length > 0 ? tags.map(t => '#' + t).join(', ') : 'None'],
              ].map(([k, v]) => v && (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text3)' }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mform-footer">
          {step > 1
            ? <button className="msf-back-btn" onClick={() => setStep(s => s - 1)}>← Back</button>
            : <button className="msf-back-btn" onClick={onCancel}>Cancel</button>}
          {step < 3
            ? <button className="msf-next-btn" onClick={() => setStep(s => s + 1)} disabled={!title || !date}>Continue →</button>
            : <button className="msf-save-btn" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : '✓ Save Memory'}
              </button>}
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(modal, document.body);
}

// ── Memory Card ───────────────────────────────────────────────────
function MemoryCard({ memory, onEdit, onDelete, onFav, onTagClick, onPersonFilter }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const em = EMOTION_MAP[memory.emotion] || EMOTION_MAP.joyful;

  return (
    <div className="mem-card" style={{ '--ec': em.color }}>
      {/* Cover or no-cover */}
      {memory.photos?.length > 0 ? (
        <div className="mem-card-cover">
          <img src={memory.photos[memory.coverPhoto || 0]} alt={memory.title} />
          <div className="mem-card-cover-gradient" />
          {memory.isFavorite && <span className="mem-card-fav">⭐</span>}
          <div className="mem-card-emotion-badge" style={{ background: em.color + '33', border: `1px solid ${em.color}66` }}>{em.emoji}</div>
        </div>
      ) : (
        <div className="mem-card-no-cover" style={{ background: em.color + '14' }}>
          {memory.isFavorite && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 14 }}>⭐</span>}
          <span className="mem-card-no-cover-icon">{em.emoji}</span>
        </div>
      )}

      <div className="mem-card-body">
        <div className="mem-card-date-row">
          <span className="mem-card-date">{format(new Date(memory.date), 'MMM d, yyyy')}</span>
          {memory.place && <span className="mem-card-place">📍 {memory.place}</span>}
        </div>
        <div className="mem-card-title">{memory.title}</div>
        {memory.description && (
          <div className="mem-card-desc">{memory.description.slice(0, 120)}{memory.description.length > 120 ? '...' : ''}</div>
        )}
        {memory.peopleInvolved?.length > 0 && (
          <div className="mem-card-people">
            {memory.peopleInvolved.slice(0, 4).map(p => (
              <button key={p._id} className="mem-person-chip"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'var(--surface2)' }}
                onClick={e => { e.stopPropagation(); onPersonFilter && onPersonFilter(p._id); }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  {p.photo ? <img src={p.photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ background: 'var(--surface3)', color: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 8, fontWeight: 700 }}>{getInitials(p.name)}</div>}
                </div>
                {p.name}
              </button>
            ))}
            {memory.peopleInvolved.length > 4 && <span className="mem-people-more">+{memory.peopleInvolved.length - 4}</span>}
          </div>
        )}
        {memory.tags?.length > 0 && (
          <div className="mem-card-tags">
            {memory.tags.slice(0, 3).map(t => (
              <button key={t} className="mem-card-tag mem-tag-btn"
                style={{ '--ec': em.color }} onClick={e => { e.stopPropagation(); onTagClick && onTagClick(t); }}>
                #{t}
              </button>
            ))}
            {memory.tags.length > 3 && <span className="mem-tag-more">+{memory.tags.length - 3}</span>}
          </div>
        )}
      </div>

      <div className="mem-card-footer">
        <span className="mem-card-ago">{formatDistanceToNow(new Date(memory.date), { addSuffix: true })}</span>
        <div className="mem-card-actions">
          <button className="mca-btn" onClick={e => { e.stopPropagation(); onFav(memory); }} title="Favorite">
            {memory.isFavorite ? '⭐' : '☆'}
          </button>
          <button className="mca-btn" onClick={e => { e.stopPropagation(); onEdit(memory); }} title="Edit">✏️</button>
          {confirmDelete
            ? <button className="mca-btn mca-confirm" onClick={e => { e.stopPropagation(); onDelete(memory._id); }}>Confirm</button>
            : <button className="mca-btn mca-del" onClick={e => { e.stopPropagation(); setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }} title="Delete">🗑</button>}
        </div>
      </div>
    </div>
  );
}

// ── Main Memories Page ────────────────────────────────────────────
export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [people, setPeople] = useState([]);
  const [meta, setMeta] = useState({ tags: [], years: [], emotions: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMem, setEditMem] = useState(null);
  const [search, setSearch] = useState('');
  const [dSearch, setDSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeEmo, setActiveEmo] = useState('');
  const [activeYear, setActiveYear] = useState('');
  const [showFavOnly, setShowFavOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dSearch)     params.set('search', dSearch);
      if (activeTag)   params.set('tag', activeTag);
      if (activeEmo)   params.set('emotion', activeEmo);
      if (activeYear)  params.set('year', activeYear);
      if (showFavOnly) params.set('favorite', 'true');

      const [mr, pr, metaR] = await Promise.all([
        api.get(`/api/memories?${params}`),
        api.get('/api/people'),
        api.get('/api/memories/meta/all'),
      ]);
      setMemories(mr.data);
      setPeople(pr.data.people || []);
      setMeta(metaR.data || { tags: [], years: [], emotions: [] });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [dSearch, activeTag, activeEmo, activeYear, showFavOnly]);

  useEffect(() => { load(); }, [load]);

  const handleSave   = () => { setShowForm(false); setEditMem(null); load(); };
  const handleEdit   = m  => { setEditMem(m); setShowForm(true); };
  const handleDelete = async id => { await api.delete(`/api/memories/${id}`); load(); };
  const handleFav    = async m  => {
    await api.put(`/api/memories/${m._id}`, { isFavorite: !m.isFavorite });
    load();
  };

  const hasFilter = dSearch || activeTag || activeEmo || activeYear || showFavOnly;
  const favCount = memories.filter(m => m.isFavorite).length;

  return (
    <div className="memories-page">
      {/* Header */}
      <div className="mem-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Memories</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'}{hasFilter ? ' found' : ' captured'}
          </p>
        </div>
        <div className="mem-header-actions">
          <button className="btn-add" onClick={() => { setEditMem(null); setShowForm(true); }}>+ Capture Memory</button>
        </div>
      </div>

      {/* Controls */}
      <div className="mem-controls">
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14 }}>🔍</span>
          <input style={{ paddingLeft: 36, marginBottom: 0 }} placeholder="Search memories..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="mem-select" value={activeYear} onChange={e => setActiveYear(e.target.value)}>
          <option value="">All years</option>
          {meta.years?.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="mem-select" value={activeEmo} onChange={e => setActiveEmo(e.target.value)}>
          <option value="">All emotions</option>
          {EMOTIONS.map(em => <option key={em.value} value={em.value}>{em.emoji} {em.label}</option>)}
        </select>
        <button className={`btn-secondary ${showFavOnly ? 'active-fav' : ''}`}
          style={showFavOnly ? { borderColor: 'var(--yellow)', color: 'var(--yellow)', background: 'var(--yellow-dim)' } : {}}
          onClick={() => setShowFavOnly(f => !f)}>
          ⭐{favCount > 0 ? ` (${favCount})` : ''}
        </button>
        {hasFilter && (
          <button className="btn-secondary" onClick={() => { setSearch(''); setActiveTag(''); setActiveEmo(''); setActiveYear(''); setShowFavOnly(false); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Tag pills */}
      {meta.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className={`tag-pill ${!activeTag ? 'active' : ''}`} onClick={() => setActiveTag('')}>All</button>
          {meta.tags.map(t => (
            <button key={t} className={`tag-pill ${activeTag === t ? 'active' : ''}`}
              onClick={() => setActiveTag(activeTag === t ? '' : t)}>#{t}</button>
          ))}
        </div>
      )}

      {/* Emotion filter */}
      <div className="emo-filter-row">
        {EMOTIONS.map(em => {
          const count = memories.filter(m => m.emotion === em.value).length;
          if (!count && activeEmo !== em.value) return null;
          return (
            <button key={em.value}
              className={`emo-filter-btn ${activeEmo === em.value ? 'active' : ''}`}
              style={activeEmo === em.value ? { borderColor: em.color, background: em.color + '18', color: em.color } : {}}
              onClick={() => setActiveEmo(activeEmo === em.value ? '' : em.value)}>
              {em.emoji} <span>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="mem-loading"><div style={{ width: 32, height: 32, border: '2px solid var(--border2)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
      ) : memories.length === 0 ? (
        <div className="mem-empty">
          <div className="mem-empty-icon">◈</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{hasFilter ? 'No memories match' : 'No memories yet'}</h3>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>{hasFilter ? 'Try removing some filters.' : 'Start capturing the moments that matter.'}</p>
          {!hasFilter && (
            <button className="btn-add" style={{ marginTop: 24 }} onClick={() => { setEditMem(null); setShowForm(true); }}>
              + Capture First Memory
            </button>
          )}
        </div>
      ) : (
        <div className="mem-grid">
          {memories.map(m => (
            <MemoryCard key={m._id} memory={m}
              onEdit={handleEdit} onDelete={handleDelete} onFav={handleFav}
              onTagClick={t => setActiveTag(activeTag === t ? '' : t)}
              onPersonFilter={() => {}} />
          ))}
        </div>
      )}

      {showForm && (
        <MemoryForm memory={editMem} people={people}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditMem(null); }} />
      )}
    </div>
  );
}