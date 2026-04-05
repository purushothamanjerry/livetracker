import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';

const MOODS = [
  {key:'great',emoji:'😄',label:'Great'},{key:'good',emoji:'🙂',label:'Good'},
  {key:'okay',emoji:'😐',label:'Okay'},{key:'bad',emoji:'😕',label:'Bad'},{key:'terrible',emoji:'😞',label:'Terrible'}
];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ date:format(new Date(),'yyyy-MM-dd'), content:'', mood:'okay', tags:'' });
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchNotes = async () => { const res = await api.get('/api/notes'); setNotes(res.data.notes); };
  useEffect(()=>{ fetchNotes(); },[]);

  useEffect(()=>{
    const todayNote = notes.find(n=>n.date===format(new Date(),'yyyy-MM-dd'));
    if (todayNote) setForm({ date:todayNote.date, content:todayNote.content, mood:todayNote.mood||'okay', tags:todayNote.tags?.join(', ')||'' });
  },[notes]);

  const handleSave = async (e) => {
    e.preventDefault();
    const tags = form.tags.split(',').map(t=>t.trim()).filter(Boolean);
    await api.post('/api/notes',{...form,tags});
    setSaved(true); setTimeout(()=>setSaved(false),2000); fetchNotes();
  };

  const del = async (id) => { await api.delete(`/api/notes/${id}`); fetchNotes(); };

  const filtered = notes.filter(n=>!filter||n.tags?.some(t=>t.toLowerCase().includes(filter.toLowerCase()))||n.content.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="notes-page">
      <div className="card">
        <div className="card-label">TODAY'S JOURNAL</div>
        <form onSubmit={handleSave} className="note-form">
          <div className="form-row"><div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div></div>
          <div className="mood-picker">
            {MOODS.map(m=>(
              <button key={m.key} type="button" className={`mood-btn ${form.mood===m.key?'active':''}`} onClick={()=>setForm({...form,mood:m.key})}>
                <span>{m.emoji}</span><span>{m.label}</span>
              </button>
            ))}
          </div>
          <textarea placeholder="What happened today?..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={5} required/>
          <input placeholder="Tags: productive, tired, fun (comma separated)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
          <button type="submit">{saved?'✓ Saved!':'Save Note'}</button>
        </form>
      </div>
      <div className="notes-history">
        <div className="notes-search"><input placeholder="🔍 Search notes or tags..." value={filter} onChange={e=>setFilter(e.target.value)}/></div>
        {filtered.map(note=>(
          <div key={note._id} className="note-card card">
            <div className="note-header">
              <span className="note-date">{note.date}</span>
              <span className="note-mood">{MOODS.find(m=>m.key===note.mood)?.emoji}</span>
              <button className="btn-delete" onClick={()=>del(note._id)}>✕</button>
            </div>
            <p className="note-content">{note.content}</p>
            {note.tags?.length>0&&<div className="note-tags">{note.tags.map(tag=><span key={tag} className="tag">#{tag}</span>)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
