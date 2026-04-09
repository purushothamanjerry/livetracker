import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const CATEGORIES = ['All','Work','Study','Dev','Design','Finance','Health','Entertainment','Social','Other'];
const CAT_COLOR = {
  Work:'#60a5fa', Study:'#a78bfa', Dev:'#22d3ee', Design:'#f472b6',
  Finance:'#4ade80', Health:'#34d399', Entertainment:'#fb923c', Social:'#fbbf24',
  Other:'#94a3b8'
};

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.',''); } catch { return url; }
}

function getFavicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch { return null; }
}

export default function Links() {
  const [links, setLinks]       = useState([]);
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [form, setForm]         = useState({ title:'', url:'', category:'Other', note:'', tags:'' });
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    try { const r = await api.get('/api/links'); setLinks(r.data); } catch(e){ console.error(e); }
  };
  useEffect(()=>{ load(); },[]);

  const openForm = (link=null) => {
    setEditLink(link);
    setForm(link
      ? { title:link.title, url:link.url, category:link.category||'Other', note:link.note||'', tags:(link.tags||[]).join(', ') }
      : { title:'', url:'', category:'Other', note:'', tags:'' }
    );
    setShowForm(true);
  };

  const save = async(e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) };
      if (editLink) await api.put(`/api/links/${editLink._id}`, payload);
      else          await api.post('/api/links', payload);
      setShowForm(false); setEditLink(null); load();
    } catch(e){ alert('Error saving'); }
    finally { setSaving(false); }
  };

  const del = async(id) => {
    if(!window.confirm('Delete this link?')) return;
    await api.delete(`/api/links/${id}`); load();
  };

  const filtered = links.filter(l => {
    const matchCat = filter==='All' || l.category===filter;
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.url.toLowerCase().includes(search.toLowerCase()) ||
      l.note?.toLowerCase().includes(search.toLowerCase()) ||
      l.tags?.some(t=>t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const catCounts = {};
  links.forEach(l=>{ catCounts[l.category||'Other']=(catCounts[l.category||'Other']||0)+1; });

  return (
    <div className="links-page">
      <div className="page-header">
        <div>
          <div className="page-title">🔗 Saved Links</div>
          <div className="page-subtitle">{links.length} links saved — find anything instantly</div>
        </div>
        <button className="btn-add" onClick={()=>openForm()}>+ Save Link</button>
      </div>

      {/* Search */}
      <div className="links-search-wrap">
        <span style={{fontSize:16,color:'var(--text3)'}}>🔍</span>
        <input placeholder="Search links, notes, tags..." value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{border:'none',background:'transparent',flex:1,outline:'none',color:'var(--text)',fontFamily:'var(--font)',fontSize:14,marginBottom:0,padding:'0'}}/>
        {search && <button onClick={()=>setSearch('')} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:16}}>✕</button>}
      </div>

      {/* Category filter */}
      <div className="links-cats">
        {CATEGORIES.map(cat=>(
          <button key={cat} className={`links-cat-btn ${filter===cat?'active':''}`}
            style={filter===cat&&cat!=='All'?{borderColor:CAT_COLOR[cat],color:CAT_COLOR[cat],background:CAT_COLOR[cat]+'18'}:{}}
            onClick={()=>setFilter(cat)}>
            {cat}
            {cat!=='All'&&catCounts[cat]>0&&<span className="links-cat-count">{catCounts[cat]}</span>}
          </button>
        ))}
      </div>

      {/* Links grid */}
      {filtered.length===0 ? (
        <div className="empty-msg">
          <div style={{fontSize:40,marginBottom:12}}>🔗</div>
          {search||filter!=='All' ? 'No links match your search.' : 'No links saved yet. Save your first link!'}
        </div>
      ) : (
        <div className="links-grid">
          {filtered.map(link=>(
            <div key={link._id} className="link-card">
              <div className="link-card-header">
                <div className="link-favicon">
                  {getFavicon(link.url)
                    ? <img src={getFavicon(link.url)} alt="" onError={e=>e.target.style.display='none'}/>
                    : <span style={{fontSize:16}}>🌐</span>}
                </div>
                <div className="link-card-info">
                  <div className="link-title">{link.title||getDomain(link.url)}</div>
                  <div className="link-domain">{getDomain(link.url)}</div>
                </div>
                <div className="link-card-badge" style={{background:CAT_COLOR[link.category||'Other']+'22',color:CAT_COLOR[link.category||'Other']}}>
                  {link.category||'Other'}
                </div>
              </div>
              {link.note && <div className="link-note">{link.note}</div>}
              {link.tags?.length>0 && (
                <div className="link-tags">
                  {link.tags.map(t=><span key={t} className="link-tag">#{t}</span>)}
                </div>
              )}
              <div className="link-card-footer">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-open-btn">
                  Open ↗
                </a>
                <div className="link-actions">
                  <button onClick={()=>openForm(link)} className="btn-delete" style={{color:'var(--text3)'}}>✏️</button>
                  <button onClick={()=>del(link._id)} className="btn-delete">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editLink ? '✏️ Edit Link' : '🔗 Save New Link'}</div>
            <form onSubmit={save}>
              <label>URL *</label>
              <input required type="url" placeholder="https://..." value={form.url}
                onChange={e=>{
                  setForm({...form,url:e.target.value});
                  if(!form.title && e.target.value) {
                    try{ setForm(f=>({...f,title:new URL(e.target.value).hostname.replace('www.','')})); } catch{}
                  }
                }}/>
              <label>Title</label>
              <input placeholder="Name this link" value={form.title}
                onChange={e=>setForm({...form,title:e.target.value})}/>
              <label>Category</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
              </select>
              <label>Note (optional)</label>
              <textarea placeholder="Why did you save this? What is it for?" rows={2}
                value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
              <label>Tags (comma separated)</label>
              <input placeholder="react, tutorial, reference" value={form.tags}
                onChange={e=>setForm({...form,tags:e.target.value})}/>
              <button type="submit" disabled={saving}>{saving?'Saving...':'Save Link'}</button>
            </form>
            <button className="modal-close" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
