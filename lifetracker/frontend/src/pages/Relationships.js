import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';

const RELATION_TYPES = ['friend','classmate','teammate','colleague','crush','attracted','love','partner','family','teacher','mentor','roommate','unknown','other'];
const DYNAMICS = ['mutual','one-side','boyfriend','girlfriend','ex','complicated','close-friend','best-friend','acquaintance','other'];
const STRENGTHS = [
  { key: 'close', label: 'Close', emoji: '💚' },
  { key: 'good', label: 'Good', emoji: '💛' },
  { key: 'neutral', label: 'Neutral', emoji: '⚪' },
  { key: 'distant', label: 'Distant', emoji: '🔵' },
  { key: 'broken', label: 'Broken', emoji: '🔴' },
];
const HEIGHT_FEELS = ['very-short','short','medium','tall','very-tall'];
const WEIGHT_FEELS = ['very-slim','slim','medium','chubby','heavy'];
const HAIR_TYPES = ['short','medium','long','very-long','curly','wavy'];
const CHARACTER_TAGS = ['kind','selfish','lovely','oversmart','funny','serious','caring','rude','shy','confident','loyal','creative','lazy','hardworking','sensitive','bold','quiet','talkative','honest','fake','jealous','supportive','mysterious','cheerful','dramatic'];
const NOTE_TYPES = ['conversation','feeling','event','thought','conflict','good-moment','other'];

const strengthColor = { close:'#4ade80', good:'#fbbf24', neutral:'#94a3b8', distant:'#60a5fa', broken:'#f87171' };
const strengthEmoji = { close:'💚', good:'💛', neutral:'⚪', distant:'🔵', broken:'🔴' };

export default function Relationships() {
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list'); // list | profile | add | memories
  const [allMemories, setAllMemories] = useState([]);
  const [noteForm, setNoteForm] = useState({ content: '', type: 'thought', mentionedPeople: [], date: format(new Date(), 'yyyy-MM-dd') });
  const [memoryForm, setMemoryForm] = useState({ title: '', content: '', date: format(new Date(), 'yyyy-MM-dd'), category: 'Happy', mentionedPeople: [], tags: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [filterStrength, setFilterStrength] = useState('');
  const [filterType, setFilterType] = useState('');

  const emptyForm = {
    name: '', gender: 'male', photo: '',
    relationshipType: 'friend', relationshipDynamic: 'mutual', strength: 'neutral',
    heightFeel: '', weightFeel: '', hairType: '', beautyNote: '',
    characterTags: [], personalityNote: '', birthday: '',
    birthdayYear: '', metDate: '', contactFrequencyDays: 30, currentStatus: ''
  };
  const [personForm, setPersonForm] = useState(emptyForm);
  const [editMode, setEditMode] = useState(false);

  const fetchPeople = async () => {
    const res = await api.get('/api/people');
    setPeople(res.data.people);
  };

  const fetchPerson = async (id) => {
    const res = await api.get(`/api/people/${id}`);
    setSelected(res.data);
  };

  const fetchMemories = async () => {
    const res = await api.get('/api/people/memories/all');
    setAllMemories(res.data.memories);
  };

  useEffect(() => { fetchPeople(); }, []);

  const openProfile = async (person) => {
    await fetchPerson(person._id);
    setView('profile');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPersonForm({ ...personForm, photo: reader.result });
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag) => {
    const tags = personForm.characterTags.includes(tag)
      ? personForm.characterTags.filter(t => t !== tag)
      : [...personForm.characterTags, tag];
    setPersonForm({ ...personForm, characterTags: tags });
  };

  const savePerson = async (e) => {
    e.preventDefault();
    if (editMode && selected) {
      await api.put(`/api/people/${selected.person._id}`, personForm);
    } else {
      await api.post('/api/people', personForm);
    }
    setPersonForm(emptyForm);
    setView('list');
    setEditMode(false);
    fetchPeople();
  };

  const deletePerson = async (id) => {
    if (!window.confirm('Delete this person?')) return;
    await api.delete(`/api/people/${id}`);
    setView('list');
    fetchPeople();
  };

  const addNote = async (e) => {
    e.preventDefault();
    await api.post(`/api/people/${selected.person._id}/notes`, noteForm);
    setNoteForm({ content: '', type: 'thought', mentionedPeople: [], date: format(new Date(), 'yyyy-MM-dd') });
    setShowNoteForm(false);
    fetchPerson(selected.person._id);
  };

  const addMemory = async (e) => {
    e.preventDefault();
    const tags = memoryForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    await api.post('/api/people/memories/add', { ...memoryForm, tags });
    setShowMemoryForm(false);
    if (view === 'memories') fetchMemories();
    else fetchPerson(selected.person._id);
  };

  const deleteMemory = async (id) => {
    await api.delete(`/api/people/memories/${id}`);
    if (view === 'memories') fetchMemories();
    else fetchPerson(selected.person._id);
  };

  const filteredPeople = people.filter(p =>
    (!filterStrength || p.strength === filterStrength) &&
    (!filterType || p.relationshipType === filterType)
  );

  // ---- VIEWS ----

  if (view === 'add' || (view === 'edit')) {
    return (
      <div className="relationships-page">
        <button className="back-btn" onClick={() => { setView(editMode ? 'profile' : 'list'); setEditMode(false); }}>← Back</button>
        <div className="card">
          <div className="card-label">{editMode ? 'EDIT PERSON' : 'ADD NEW PERSON'}</div>
          <form onSubmit={savePerson} className="person-form">

            {/* Photo */}
            <div className="photo-upload">
              {personForm.photo
                ? <img src={personForm.photo} alt="profile" className="person-photo-lg" />
                : <div className="photo-placeholder">👤</div>}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} id="photo-input" style={{ display:'none' }} />
              <label htmlFor="photo-input" className="btn-interrupt" style={{ cursor:'pointer' }}>
                {personForm.photo ? '📷 Change Photo' : '📷 Add Photo'}
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input required placeholder="Name" value={personForm.name}
                  onChange={e => setPersonForm({ ...personForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={personForm.gender} onChange={e => setPersonForm({ ...personForm, gender: e.target.value })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Relationship Type</label>
                <select value={personForm.relationshipType} onChange={e => setPersonForm({ ...personForm, relationshipType: e.target.value })}>
                  {RELATION_TYPES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Dynamic / Status</label>
                <select value={personForm.relationshipDynamic} onChange={e => setPersonForm({ ...personForm, relationshipDynamic: e.target.value })}>
                  {DYNAMICS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <label>Relationship Strength</label>
            <div className="strength-picker">
              {STRENGTHS.map(s => (
                <button key={s.key} type="button"
                  className={`strength-btn ${personForm.strength === s.key ? 'active' : ''}`}
                  onClick={() => setPersonForm({ ...personForm, strength: s.key })}
                  style={personForm.strength === s.key ? { borderColor: strengthColor[s.key], color: strengthColor[s.key] } : {}}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>

            {/* Physical */}
            <div className="section-divider">Physical Feel</div>
            <div className="form-row">
              <div className="form-group">
                <label>Height Feel</label>
                <select value={personForm.heightFeel} onChange={e => setPersonForm({ ...personForm, heightFeel: e.target.value })}>
                  <option value="">Not set</option>
                  {HEIGHT_FEELS.map(h => <option key={h} value={h}>{h.replace('-', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Weight Feel</label>
                <select value={personForm.weightFeel} onChange={e => setPersonForm({ ...personForm, weightFeel: e.target.value })}>
                  <option value="">Not set</option>
                  {WEIGHT_FEELS.map(w => <option key={w} value={w}>{w.replace('-', ' ')}</option>)}
                </select>
              </div>
              {personForm.gender === 'female' && (
                <div className="form-group">
                  <label>Hair Type</label>
                  <select value={personForm.hairType} onChange={e => setPersonForm({ ...personForm, hairType: e.target.value })}>
                    <option value="">Not set</option>
                    {HAIR_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              )}
            </div>
            {personForm.gender === 'female' && (
              <div>
                <label>Beauty / Appearance Note</label>
                <input placeholder="e.g. cute smile, dimples, long hair" value={personForm.beautyNote}
                  onChange={e => setPersonForm({ ...personForm, beautyNote: e.target.value })} />
              </div>
            )}

            {/* Character Tags */}
            <div className="section-divider">Character Tags</div>
            <div className="tags-grid">
              {CHARACTER_TAGS.map(tag => (
                <button key={tag} type="button"
                  className={`tag-toggle ${personForm.characterTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>

            {/* Personality */}
            <div className="section-divider">Personality & Notes</div>
            <textarea placeholder="Describe their personality in your words..."
              value={personForm.personalityNote}
              onChange={e => setPersonForm({ ...personForm, personalityNote: e.target.value })} rows={3} />

            <textarea placeholder="Current status / how things are between you two..."
              value={personForm.currentStatus}
              onChange={e => setPersonForm({ ...personForm, currentStatus: e.target.value })} rows={2} />

            {/* Dates */}
            <div className="section-divider">Important Dates</div>
            <div className="form-row">
              <div className="form-group">
                <label>Birthday (MM-DD)</label>
                <input placeholder="e.g. 06-12" value={personForm.birthday}
                  onChange={e => setPersonForm({ ...personForm, birthday: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Birth Year (optional)</label>
                <input placeholder="e.g. 2001" value={personForm.birthdayYear}
                  onChange={e => setPersonForm({ ...personForm, birthdayYear: e.target.value })} />
              </div>
              <div className="form-group">
                <label>When You Met</label>
                <input type="date" value={personForm.metDate}
                  onChange={e => setPersonForm({ ...personForm, metDate: e.target.value })} />
              </div>
            </div>

            <button type="submit">{editMode ? 'Save Changes' : 'Add Person'}</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'profile' && selected) {
    const { person, notes, memories } = selected;
    const daysSinceContact = person.lastContacted
      ? Math.floor((Date.now() - new Date(person.lastContacted)) / (1000*60*60*24))
      : null;

    return (
      <div className="relationships-page">
        <button className="back-btn" onClick={() => setView('list')}>← Back</button>

        <div className="card person-profile">
          <div className="profile-header">
            {person.photo
              ? <img src={person.photo} alt={person.name} className="person-photo-lg" />
              : <div className="photo-placeholder-lg">{person.name[0]?.toUpperCase()}</div>}
            <div className="profile-info">
              <h2 className="profile-name">{person.name}</h2>
              <div className="profile-badges">
                <span className="badge-type">{person.relationshipType}</span>
                <span className="badge-dynamic">{person.relationshipDynamic}</span>
                <span className="strength-badge" style={{ color: strengthColor[person.strength] }}>
                  {strengthEmoji[person.strength]} {person.strength}
                </span>
              </div>
              {person.birthday && (
                <div className="profile-meta">🎂 Birthday: {person.birthday}{person.birthdayYear ? `/${person.birthdayYear}` : ''}</div>
              )}
              {daysSinceContact !== null && (
                <div className={`profile-meta ${daysSinceContact > person.contactFrequencyDays ? 'warn' : ''}`}>
                  💬 Last noted: {daysSinceContact === 0 ? 'Today' : `${daysSinceContact} days ago`}
                  {daysSinceContact > person.contactFrequencyDays && ' ⚠️ Time to reach out!'}
                </div>
              )}
              {person.metDate && <div className="profile-meta">📅 Met: {person.metDate}</div>}
            </div>
            <div className="profile-actions">
              <button className="btn-interrupt" onClick={() => {
                setPersonForm({ ...person, characterTags: person.characterTags || [] });
                setEditMode(true);
                setView('edit');
              }}>✏️ Edit</button>
              <button className="btn-delete" onClick={() => deletePerson(person._id)}>🗑️</button>
            </div>
          </div>

          {/* Physical */}
          {(person.heightFeel || person.weightFeel || person.hairType) && (
            <div className="physical-tags">
              {person.heightFeel && <span className="ptag">📏 {person.heightFeel.replace('-',' ')}</span>}
              {person.weightFeel && <span className="ptag">⚖️ {person.weightFeel.replace('-',' ')}</span>}
              {person.hairType && <span className="ptag">💇 {person.hairType} hair</span>}
              {person.beautyNote && <span className="ptag">✨ {person.beautyNote}</span>}
            </div>
          )}

          {/* Character Tags */}
          {person.characterTags?.length > 0 && (
            <div className="char-tags">
              {person.characterTags.map(tag => <span key={tag} className="char-tag">#{tag}</span>)}
            </div>
          )}

          {person.personalityNote && (
            <div className="personality-note">
              <div className="card-label">PERSONALITY</div>
              <p>{person.personalityNote}</p>
            </div>
          )}

          {person.currentStatus && (
            <div className="personality-note">
              <div className="card-label">CURRENT STATUS</div>
              <p>{person.currentStatus}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card">
          <div className="section-header">
            <div className="card-label">NOTES & CONVERSATIONS</div>
            <button className="btn-add small" onClick={() => setShowNoteForm(!showNoteForm)}>+ Add Note</button>
          </div>
          {showNoteForm && (
            <form onSubmit={addNote} className="note-quick-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={noteForm.type} onChange={e => setNoteForm({ ...noteForm, type: e.target.value })}>
                    {NOTE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={noteForm.date}
                    onChange={e => setNoteForm({ ...noteForm, date: e.target.value })} />
                </div>
              </div>
              <textarea required placeholder="Write your note, feelings, or what happened..."
                value={noteForm.content}
                onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} rows={3} />
              <div className="mention-select">
                <label>Mention others (optional)</label>
                <div className="mention-list">
                  {people.filter(p => p._id !== person._id).map(p => (
                    <label key={p._id} className="mention-item">
                      <input type="checkbox"
                        checked={noteForm.mentionedPeople.includes(p._id)}
                        onChange={e => {
                          const list = e.target.checked
                            ? [...noteForm.mentionedPeople, p._id]
                            : noteForm.mentionedPeople.filter(id => id !== p._id);
                          setNoteForm({ ...noteForm, mentionedPeople: list });
                        }} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit">Save Note</button>
            </form>
          )}
          <div className="notes-list">
            {notes?.length === 0 && <p className="empty-msg">No notes yet.</p>}
            {notes?.map(note => (
              <div key={note._id} className={`person-note-card note-type-${note.type}`}>
                <div className="note-header">
                  <span className="note-type-badge">{note.type}</span>
                  <span className="note-date">{note.date}</span>
                </div>
                <p>{note.content}</p>
                {note.mentionedPeople?.length > 0 && (
                  <div className="mentioned">
                    👥 {note.mentionedPeople.map(p => p.name).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Memories */}
        <div className="card">
          <div className="section-header">
            <div className="card-label">MEMORIES WITH {person.name.toUpperCase()}</div>
            <button className="btn-add small" onClick={() => {
              setMemoryForm({ ...memoryForm, mentionedPeople: [person._id] });
              setShowMemoryForm(!showMemoryForm);
            }}>+ Add Memory</button>
          </div>
          {showMemoryForm && (
            <form onSubmit={addMemory} className="note-quick-form">
              <input required placeholder="Memory title" value={memoryForm.title}
                onChange={e => setMemoryForm({ ...memoryForm, title: e.target.value })} />
              <textarea required placeholder="Describe the memory..."
                value={memoryForm.content}
                onChange={e => setMemoryForm({ ...memoryForm, content: e.target.value })} rows={3} />
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={memoryForm.date}
                    onChange={e => setMemoryForm({ ...memoryForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={memoryForm.category}
                    onChange={e => setMemoryForm({ ...memoryForm, category: e.target.value })}>
                    {['Happy','Sad','Funny','Lesson','Awkward','Special','Regret','Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <input placeholder="Tags (comma separated)" value={memoryForm.tags}
                onChange={e => setMemoryForm({ ...memoryForm, tags: e.target.value })} />
              <button type="submit">Save Memory</button>
            </form>
          )}
          <div className="memories-list">
            {memories?.length === 0 && <p className="empty-msg">No memories yet.</p>}
            {memories?.map(mem => (
              <div key={mem._id} className="memory-card">
                <div className="memory-header">
                  <span className="memory-title">{mem.title}</span>
                  <span className="memory-cat">{mem.category}</span>
                  <span className="memory-date">{mem.date}</span>
                  <button className="btn-delete" onClick={() => deleteMemory(mem._id)}>✕</button>
                </div>
                <p className="memory-content">{mem.content}</p>
                {mem.mentionedPeople?.length > 1 && (
                  <div className="mentioned">👥 {mem.mentionedPeople.map(p => p.name).join(', ')}</div>
                )}
                {mem.tags?.length > 0 && (
                  <div className="note-tags">{mem.tags.map(t => <span key={t} className="tag">#{t}</span>)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'memories') {
    return (
      <div className="relationships-page">
        <button className="back-btn" onClick={() => setView('list')}>← Back</button>
        <div className="card">
          <div className="section-header">
            <div className="card-label">ALL MEMORIES</div>
            <button className="btn-add small" onClick={() => setShowMemoryForm(!showMemoryForm)}>+ Add Memory</button>
          </div>
          {showMemoryForm && (
            <form onSubmit={addMemory} className="note-quick-form">
              <input required placeholder="Memory title" value={memoryForm.title}
                onChange={e => setMemoryForm({ ...memoryForm, title: e.target.value })} />
              <textarea required placeholder="Describe the memory..."
                value={memoryForm.content} rows={3}
                onChange={e => setMemoryForm({ ...memoryForm, content: e.target.value })} />
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={memoryForm.date}
                    onChange={e => setMemoryForm({ ...memoryForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={memoryForm.category}
                    onChange={e => setMemoryForm({ ...memoryForm, category: e.target.value })}>
                    {['Happy','Sad','Funny','Lesson','Awkward','Special','Regret','Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mention-select">
                <label>Mention people</label>
                <div className="mention-list">
                  {people.map(p => (
                    <label key={p._id} className="mention-item">
                      <input type="checkbox"
                        checked={memoryForm.mentionedPeople.includes(p._id)}
                        onChange={e => {
                          const list = e.target.checked
                            ? [...memoryForm.mentionedPeople, p._id]
                            : memoryForm.mentionedPeople.filter(id => id !== p._id);
                          setMemoryForm({ ...memoryForm, mentionedPeople: list });
                        }} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <input placeholder="Tags (comma separated)" value={memoryForm.tags}
                onChange={e => setMemoryForm({ ...memoryForm, tags: e.target.value })} />
              <button type="submit">Save Memory</button>
            </form>
          )}
          <div className="memories-list">
            {allMemories.map(mem => (
              <div key={mem._id} className="memory-card">
                <div className="memory-header">
                  <span className="memory-title">{mem.title}</span>
                  <span className="memory-cat">{mem.category}</span>
                  <span className="memory-date">{mem.date}</span>
                  <button className="btn-delete" onClick={() => deleteMemory(mem._id)}>✕</button>
                </div>
                <p className="memory-content">{mem.content}</p>
                {mem.mentionedPeople?.length > 0 && (
                  <div className="mentioned">👥 {mem.mentionedPeople.map(p => p.name).join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="relationships-page">
      <div className="rel-header">
        <div className="view-tabs">
          <button className="range-tab active">👥 People</button>
          <button className="range-tab" onClick={() => { fetchMemories(); setView('memories'); }}>💭 All Memories</button>
        </div>
        <button className="btn-add" onClick={() => { setPersonForm(emptyForm); setEditMode(false); setView('add'); }}>+ Add Person</button>
      </div>

      {/* Filters */}
      <div className="rel-filters">
        <select value={filterStrength} onChange={e => setFilterStrength(e.target.value)}>
          <option value="">All Strengths</option>
          {STRENGTHS.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {RELATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filteredPeople.length === 0 ? (
        <div className="card"><p className="empty-msg">No people added yet. Add someone!</p></div>
      ) : (
        <div className="people-grid">
          {filteredPeople.map(person => {
            const daysSince = person.lastContacted
              ? Math.floor((Date.now() - new Date(person.lastContacted)) / (1000*60*60*24))
              : null;
            const needsContact = daysSince !== null && daysSince > (person.contactFrequencyDays || 30);
            return (
              <div key={person._id} className="person-card" onClick={() => openProfile(person)}>
                <div className="person-card-photo">
                  {person.photo
                    ? <img src={person.photo} alt={person.name} />
                    : <div className="person-avatar">{person.name[0]?.toUpperCase()}</div>}
                  <span className="strength-dot" style={{ background: strengthColor[person.strength] }} />
                </div>
                <div className="person-card-info">
                  <div className="person-card-name">{person.name}</div>
                  <div className="person-card-type">{person.relationshipType} · {person.relationshipDynamic}</div>
                  {person.characterTags?.slice(0,3).map(t => (
                    <span key={t} className="mini-tag">#{t}</span>
                  ))}
                  {needsContact && <div className="contact-warn">⚠️ {daysSince}d no note</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
