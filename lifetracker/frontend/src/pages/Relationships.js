import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { format, differenceInDays, differenceInYears, differenceInMonths } from 'date-fns';

// ── Constants ─────────────────────────────────────────────────────
const REL_TYPES = [
  { key:'love',         emoji:'❤️',  label:'Love',         sub:'Romantic partner',   color:'#e8637a', bg:'rgba(232,99,122,0.12)'  },
  { key:'crush',        emoji:'🌸',  label:'Crush',        sub:'Have feelings for',  color:'#f472b6', bg:'rgba(244,114,182,0.12)' },
  { key:'attracted',    emoji:'✨',  label:'Attracted To', sub:'Physically drawn to',color:'#fb923c', bg:'rgba(251,146,60,0.12)'  },
  { key:'impressed',    emoji:'🌟',  label:'Impressed By', sub:'Deeply admire',      color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
  { key:'friend',       emoji:'👫',  label:'Friend',       sub:'Close friend',       color:'#60a5fa', bg:'rgba(96,165,250,0.12)'  },
  { key:'family',       emoji:'👨‍👩‍👧', label:'Family',       sub:'Family member',     color:'#4ade80', bg:'rgba(74,222,128,0.12)'  },
  { key:'colleague',    emoji:'💼',  label:'Colleague',    sub:'Work relationship',  color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
  { key:'classmate',    emoji:'🎒',  label:'Classmate',    sub:'School / college',   color:'#22d3ee', bg:'rgba(34,211,238,0.12)'  },
  { key:'teacher',      emoji:'👨‍🏫', label:'Teacher',      sub:'Mentor / educator', color:'#34d399', bg:'rgba(52,211,153,0.12)'  },
  { key:'acquaintance', emoji:'🤝',  label:'Acquaintance', sub:'Know casually',      color:'#94a3b8', bg:'rgba(148,163,184,0.12)' },
  { key:'roommate',     emoji:'🏠',  label:'Roommate',     sub:'Live together',      color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
  { key:'other',        emoji:'👤',  label:'Other',        sub:'',                   color:'#64748b', bg:'rgba(100,116,139,0.12)' },
];

const BOND_STATUSES = [
  { key:'close',       emoji:'💚', label:'Close',        sub:'Talk regularly',          color:'#4ade80' },
  { key:'good',        emoji:'🙂', label:'Good',         sub:'Occasional contact',      color:'#fbbf24' },
  { key:'drifting',    emoji:'🌊', label:'Drifting',     sub:'Slowly losing touch',     color:'#fb923c' },
  { key:'distant',     emoji:'🔵', label:'Distant',      sub:'Rarely talk anymore',     color:'#60a5fa' },
  { key:'not-talking', emoji:'🚫', label:'Not Talking',  sub:'Not speaking now',        color:'#f87171' },
  { key:'complicated', emoji:'🌀', label:'Complicated',  sub:"It's complicated",        color:'#a78bfa' },
  { key:'rekindled',   emoji:'🔥', label:'Rekindled',    sub:'Recently reconnected',    color:'#f97316' },
  { key:'lost-touch',  emoji:'👻', label:'Lost Touch',   sub:'Completely lost touch',   color:'#ec4899' },
  { key:'ended',       emoji:'📵', label:'Ended',        sub:'Relationship ended',      color:'#64748b' },
];

const HEIGHT_OPTIONS = ['very-short','short','average','tall','very-tall'];
const BODY_OPTIONS   = ['slim','lean','athletic','average','curvy','heavyset'];
const HAIR_OPTIONS   = ['bald','very-short','short','medium','long','very-long'];
const CHARACTER_TAGS = ['kind','selfish','lovely','oversmart','funny','serious','caring','rude','shy','confident','loyal','creative','lazy','hardworking','sensitive','bold','quiet','talkative','honest','fake','jealous','supportive','mysterious','cheerful','dramatic','humble','proud','generous','introvert','extrovert'];

function getRelMeta(key) { return REL_TYPES.find(r=>r.key===key) || REL_TYPES[REL_TYPES.length-1]; }
function getBondMeta(key) { return BOND_STATUSES.find(b=>b.key===key) || BOND_STATUSES[1]; }
function getAge(dob) { if(!dob) return null; return differenceInYears(new Date(), new Date(dob)); }
function getKnownFor(d) {
  if(!d) return null;
  const y=differenceInYears(new Date(),new Date(d)), m=differenceInMonths(new Date(),new Date(d))%12;
  return y>0?`${y}y ${m}m`:`${m}m`;
}
function getDaysSince(d) { return d?differenceInDays(new Date(),new Date(d)):null; }
function getInitials(n) { return n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2); }
function contactLabel(d) {
  if(d===null||d===undefined) return null;
  if(d===0) return 'Today'; if(d===1) return 'Yesterday';
  if(d<7) return `${d}d ago`; if(d<30) return `${Math.floor(d/7)}w ago`;
  if(d<365) return `${Math.floor(d/30)}mo ago`; return `${Math.floor(d/365)}y ago`;
}
function getBirthdayInfo(dob) {
  if(!dob) return null;
  const today=new Date(), parts=dob.split('-');
  if(parts.length<3) return null;
  const m=parseInt(parts[1])-1, day=parseInt(parts[2]);
  const thisYear=new Date(today.getFullYear(),m,day);
  const target=thisYear>=today?thisYear:new Date(today.getFullYear()+1,m,day);
  const days=differenceInDays(target,today);
  return { days, label:`${target.toLocaleString('default',{month:'short'})} ${day}`, isToday:days===0 };
}

// ── Multi Step Form ───────────────────────────────────────────────
const EMPTY = {
  name:'', gender:'male', photo:'', dob:'', dobApprox:false,
  relationshipType:'acquaintance', bondStatus:'good', bondNote:'',
  whereMet:'', metDate:'', howWeMet:'',
  mobile:'', instagram:'',
  heightFeel:'', bodyType:'', hairLength:'',
  characterTags:[], privateNotes:'', isSpecial:false,
};

function MultiStepForm({ initial, onSave, onCancel, isEdit }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial || EMPTY);
  const fileRef = React.useRef();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleTag = tag => set('characterTags', form.characterTags.includes(tag)?form.characterTags.filter(t=>t!==tag):[...form.characterTags,tag]);
  const handlePhoto = e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>set('photo',r.result); r.readAsDataURL(f); };
  const age = getAge(form.dob);

  return (
    <div className="msf-overlay" onClick={onCancel}>
      <div className="msf-modal" onClick={e=>e.stopPropagation()}>
        <div className="msf-header">
          <h2 style={{fontSize:18,fontWeight:700}}>{isEdit?'Edit Profile':'Add Person'}</h2>
          <button className="msf-close" onClick={onCancel}>✕</button>
        </div>
        {/* Steps */}
        <div className="msf-steps">
          {[1,2,3,4,5].map(s=>(
            <React.Fragment key={s}>
              <div className={`msf-step-dot ${step===s?'current':step>s?'done':''}`}>{step>s?'✓':s}</div>
              {s<5&&<div className={`msf-step-line ${step>s?'done':''}`}/>}
            </React.Fragment>
          ))}
          <span className="msf-step-title">{['IDENTITY','BOND','CONTACT','CHARACTER','DONE'][step-1]}</span>
        </div>

        <div className="msf-body">
          {/* STEP 1 */}
          {step===1 && (
            <div>
              <div className="msf-photo-area" onClick={()=>fileRef.current.click()}>
                {form.photo
                  ? <img src={form.photo} alt="" className="msf-photo-preview"/>
                  : <div className="msf-photo-placeholder">📷<br/><span style={{fontSize:12,color:'var(--muted)'}}>Click to upload</span></div>}
                {age&&<span className="msf-age-badge">Age: {age}</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}}/>
              <label className="msf-label">FULL NAME *</label>
              <input className="msf-input" placeholder="Full name" value={form.name} onChange={e=>set('name',e.target.value)} required/>
              <div className="msf-row">
                <div className="msf-col">
                  <label className="msf-label">GENDER</label>
                  <select className="msf-input" value={form.gender} onChange={e=>set('gender',e.target.value)}>
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
                <div className="msf-col">
                  <label className="msf-label">DATE OF BIRTH</label>
                  <input className="msf-input" type="date" value={form.dob} onChange={e=>set('dob',e.target.value)}/>
                  {age!==null&&<div className="msf-age-note">→ Age: {age}</div>}
                </div>
              </div>
              <label className="msf-label">HOW DO YOU SEE THEM?</label>
              <div className="msf-type-grid">
                {REL_TYPES.map(r=>(
                  <button key={r.key} type="button"
                    className={`msf-type-btn ${form.relationshipType===r.key?'active':''}`}
                    style={form.relationshipType===r.key?{borderColor:r.color,background:r.bg}:{}}
                    onClick={()=>set('relationshipType',r.key)}>
                    <span style={{fontSize:20}}>{r.emoji}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{r.label}</span>
                    {r.sub&&<span style={{fontSize:10,color:'var(--muted)'}}>{r.sub}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div>
              <label className="msf-label">BOND STATUS</label>
              <div className="msf-bond-grid">
                {BOND_STATUSES.map(b=>(
                  <button key={b.key} type="button"
                    className={`msf-bond-btn ${form.bondStatus===b.key?'active':''}`}
                    style={form.bondStatus===b.key?{borderColor:b.color,background:b.color+'22'}:{}}
                    onClick={()=>set('bondStatus',b.key)}>
                    <span style={{fontSize:22}}>{b.emoji}</span>
                    <span style={{fontSize:13,fontWeight:600}}>{b.label}</span>
                    <span style={{fontSize:11,color:'var(--muted)'}}>{b.sub}</span>
                  </button>
                ))}
              </div>
              <label className="msf-label">NOTE ABOUT STATUS</label>
              <input className="msf-input" placeholder="Why did it change? (optional)" value={form.bondNote||''} onChange={e=>set('bondNote',e.target.value)}/>
              <div className="msf-row">
                <div className="msf-col">
                  <label className="msf-label">WHERE YOU MET</label>
                  <input className="msf-input" placeholder="College, Work, Online..." value={form.whereMet} onChange={e=>set('whereMet',e.target.value)}/>
                </div>
                <div className="msf-col">
                  <label className="msf-label">DATE FIRST MET</label>
                  <input className="msf-input" type="date" value={form.metDate} onChange={e=>set('metDate',e.target.value)}/>
                </div>
              </div>
              <label className="msf-label">STORY OF HOW YOU MET</label>
              <textarea className="msf-input" placeholder="How did you first meet?" value={form.howWeMet} onChange={e=>set('howWeMet',e.target.value)} rows={3} style={{resize:'vertical'}}/>
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div>
              <p style={{color:'var(--muted)',fontSize:13,marginBottom:16}}>Add their contact info.</p>
              <div className="msf-row">
                <div className="msf-col">
                  <label className="msf-label">📱 MOBILE NUMBER</label>
                  <input className="msf-input" placeholder="Mobile number" value={form.mobile} onChange={e=>set('mobile',e.target.value)}/>
                </div>
                <div className="msf-col">
                  <label className="msf-label">📸 INSTAGRAM</label>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{color:'var(--muted)',fontSize:16}}>@</span>
                    <input className="msf-input" style={{marginBottom:0}} placeholder="username" value={form.instagram} onChange={e=>set('instagram',e.target.value)}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step===4 && (
            <div>
              <div className="msf-app-section">
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:'var(--muted)',marginBottom:12,textTransform:'uppercase'}}>💎 APPEARANCE</div>
                {[
                  {label:'📏 HEIGHT', key:'heightFeel', opts:HEIGHT_OPTIONS},
                  {label:'🏃 BODY TYPE', key:'bodyType', opts:BODY_OPTIONS},
                  {label:'💇 HAIR LENGTH', key:'hairLength', opts:HAIR_OPTIONS},
                ].map(({label,key,opts})=>(
                  <div key={key} style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase'}}>{label}</div>
                    <div className="msf-chip-row">
                      {opts.map(o=>(
                        <button key={o} type="button"
                          className={`msf-chip ${form[key]===o?'active':''}`}
                          onClick={()=>set(key,form[key]===o?'':o)}>
                          {o.replace(/-/g,' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:'var(--muted)',margin:'16px 0 10px',textTransform:'uppercase'}}>✨ CHARACTER TAGS</div>
              <div className="msf-tags-grid">
                {CHARACTER_TAGS.map(tag=>(
                  <button key={tag} type="button"
                    className={`msf-tag-btn ${form.characterTags.includes(tag)?'active':''}`}
                    onClick={()=>toggleTag(tag)}>{tag}</button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step===5 && (
            <div>
              <button type="button" className={`msf-special-btn ${form.isSpecial?'active':''}`} onClick={()=>set('isSpecial',!form.isSpecial)}>
                <span style={{fontSize:20}}>⭐</span>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>Mark as Special</div>
                  <div style={{fontSize:12,color:'var(--muted)'}}>Shows in the Special strip on the People page</div>
                </div>
              </button>
              <label className="msf-label" style={{marginTop:16}}>🔒 PRIVATE NOTES</label>
              <textarea className="msf-input" placeholder="Your private thoughts about this person..." value={form.privateNotes} onChange={e=>set('privateNotes',e.target.value)} rows={4} style={{resize:'vertical'}}/>
              <div className="msf-summary">
                {[['Name',form.name],['Type',getRelMeta(form.relationshipType).emoji+' '+form.relationshipType],['Status',getBondMeta(form.bondStatus).emoji+' '+form.bondStatus],['Mobile',form.mobile],['Instagram',form.instagram?'@'+form.instagram:'']].filter(([,v])=>v).map(([k,v])=>(
                  <div key={k} className="msf-summary-row">
                    <span style={{color:'var(--muted)',fontSize:13}}>{k}</span>
                    <span style={{fontSize:13,fontWeight:500}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="msf-footer">
          {step>1?<button className="msf-back-btn" onClick={()=>setStep(s=>s-1)}>← Back</button>:<div/>}
          {step<5
            ?<button className="msf-next-btn" onClick={()=>setStep(s=>s+1)} disabled={step===1&&!form.name}>Continue →</button>
            :<button className="msf-save-btn" onClick={()=>onSave(form)}>✓ Save Changes</button>}
        </div>
      </div>
    </div>
  );
}

// ── Profile View ──────────────────────────────────────────────────
function PersonProfile({ data, people, onBack, onEdit, onDelete, onRefresh }) {
  const { person, notes, memories } = data;
  const [tab, setTab] = useState('overview');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ content:'', type:'thought', date:format(new Date(),'yyyy-MM-dd'), mentionedPeople:[] });
  const [showMemForm, setShowMemForm] = useState(false);
  const [memForm, setMemForm] = useState({ title:'', content:'', date:format(new Date(),'yyyy-MM-dd'), category:'Happy', mentionedPeople:[], tags:'' });
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState(person.bondStatus);
  const [statusNote, setStatusNote] = useState('');

  const rel = getRelMeta(person.relationshipType);
  const bond = getBondMeta(person.bondStatus);
  const age = getAge(person.dob);
  const knownFor = getKnownFor(person.metDate);
  const daysSince = getDaysSince(person.lastContacted);
  const bday = getBirthdayInfo(person.dob);

  const addNote = async e => {
    e.preventDefault();
    await api.post(`/api/people/${person._id}/notes`, noteForm);
    setNoteForm({ content:'', type:'thought', date:format(new Date(),'yyyy-MM-dd'), mentionedPeople:[] });
    setShowNoteForm(false); onRefresh(person._id);
  };

  const addMemory = async e => {
    e.preventDefault();
    const tags = memForm.tags.split(',').map(t=>t.trim()).filter(Boolean);
    await api.post('/api/people/memories/add', { ...memForm, tags, mentionedPeople:[person._id,...memForm.mentionedPeople] });
    setShowMemForm(false); onRefresh(person._id);
  };

  const updateStatus = async () => {
    await api.put(`/api/people/${person._id}`, { bondStatus: newStatus, bondNote: statusNote });
    setShowStatusForm(false); onRefresh(person._id);
  };

  const deleteNote = async id => { await api.delete(`/api/people/notes/${id}`); onRefresh(person._id); };
  const deleteMem = async id => { await api.delete(`/api/people/memories/${id}`); onRefresh(person._id); };

  return (
    <div className="pp-page">
      <button className="pp-back" onClick={onBack}>← Back to People</button>

      {/* Hero */}
      <div className="pp-hero" style={{ borderColor: rel.color+'33' }}>
        <div className="pp-hero-left">
          <div className="pp-avatar-wrap">
            {person.photo
              ? <img src={person.photo} alt={person.name} className="pp-avatar"/>
              : <div className="pp-avatar-ph" style={{background:rel.bg,color:rel.color}}>{getInitials(person.name)}</div>}
            <div className="pp-avatar-ring" style={{borderColor:rel.color}}/>
            {bday?.isToday && <div className="pp-bday-badge">🎂</div>}
          </div>
          <div className="pp-hero-info">
            <div className="pp-hero-top">
              <h2 className="pp-name">{person.name}</h2>
              <button className={`pp-fav-btn ${person.isSpecial?'active':''}`}
                onClick={async()=>{ await api.put(`/api/people/${person._id}`,{isSpecial:!person.isSpecial}); onRefresh(person._id); }}>⭐</button>
            </div>
            <div className="pp-badges">
              <span className="pp-badge" style={{background:rel.bg,color:rel.color}}>{rel.emoji} {rel.label}</span>
              <span className="pp-status-badge" style={{color:bond.color,borderColor:bond.color+'44',background:bond.color+'11'}}>{bond.emoji} {bond.label}</span>
              <span className="pp-badge pp-badge-dim">{person.gender}</span>
            </div>
            <div className="pp-meta-row">
              {age&&<span className="pp-meta-chip">🎂 Age {age} · {bday?.label}</span>}
              {bday&&!bday.isToday&&bday.days<=30&&<span className="pp-meta-chip pp-bday-chip">🎉 Birthday in {bday.days} days!</span>}
              {knownFor&&<span className="pp-meta-chip">⏳ Known {knownFor}</span>}
            </div>
            <div className="pp-hero-actions">
              <button className="btn-switch" style={{fontSize:13,padding:'8px 16px'}} onClick={()=>setShowNoteForm(true)}>+ Log Note</button>
              <button className="btn-interrupt" onClick={()=>setShowStatusForm(true)}>↻ Update Status</button>
              <button className="btn-interrupt" onClick={()=>onEdit(person)}>✏️ Edit</button>
              <button className="btn-delete" style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)'}} onClick={()=>onDelete(person._id)}>🗑</button>
            </div>
          </div>
        </div>
        <div className="pp-quick-stats">
          <div className="pp-qstat"><div className="pp-qstat-val">{notes?.length||0}</div><div className="pp-qstat-label">NOTES</div></div>
          <div className="pp-qstat" style={{color:daysSince>30?'#f87171':'#fbbf24'}}>
            <div className="pp-qstat-val">{daysSince!==null?`${daysSince}d`:'—'}</div>
            <div className="pp-qstat-label">SINCE LAST NOTE</div>
          </div>
          {knownFor&&<div className="pp-qstat"><div className="pp-qstat-val" style={{fontSize:20}}>{knownFor}</div><div className="pp-qstat-label">KNOWN FOR</div></div>}
        </div>
      </div>

      {/* Update Status Modal */}
      {showStatusForm && (
        <div className="modal-overlay" onClick={()=>setShowStatusForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Update Bond Status</div>
            <div className="msf-bond-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
              {BOND_STATUSES.map(b=>(
                <button key={b.key} type="button"
                  className={`msf-bond-btn ${newStatus===b.key?'active':''}`}
                  style={newStatus===b.key?{borderColor:b.color,background:b.color+'22'}:{}}
                  onClick={()=>setNewStatus(b.key)}>
                  <span>{b.emoji}</span><span style={{fontSize:12,fontWeight:600}}>{b.label}</span>
                </button>
              ))}
            </div>
            <input className="msf-input" placeholder="Note (optional)" value={statusNote} onChange={e=>setStatusNote(e.target.value)} style={{marginTop:12}}/>
            <button onClick={updateStatus} style={{width:'100%',marginTop:8,background:'var(--accent)',color:'#000',border:'none',padding:'10px',borderRadius:8,fontWeight:600,cursor:'pointer'}}>Save Status</button>
            <button className="modal-close" onClick={()=>setShowStatusForm(false)} style={{marginTop:8}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="pp-tabs">
        {[{key:'overview',label:'Overview'},{key:'notes',label:`Notes (${notes?.length||0})`},{key:'memories',label:`Memories (${memories?.length||0})`},{key:'status',label:'Status History'}].map(t=>(
          <button key={t.key} className={`pp-tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="pp-content">
        {/* OVERVIEW TAB */}
        {tab==='overview' && (
          <div className="pp-two-col">
            <div className="pp-col-main">
              <div className="pp-card">
                <div className="pp-card-title">ABOUT</div>
                {person.howWeMet&&<div className="pp-field"><div className="pp-field-label">HOW WE MET</div><div className="pp-field-val">{person.howWeMet}</div></div>}
                {person.whereMet&&person.metDate&&<div className="pp-field"><div className="pp-field-label">FIRST MET AT</div><div className="pp-field-val">{person.whereMet} · {person.metDate}</div></div>}
                {person.privateNotes&&<div className="pp-field"><div className="pp-field-label">PRIVATE NOTES</div><div className="pp-field-val" style={{fontStyle:'italic'}}>{person.privateNotes}</div></div>}
              </div>
              {(person.heightFeel||person.bodyType||person.hairLength)&&(
                <div className="pp-card">
                  <div className="pp-card-title">💎 APPEARANCE</div>
                  <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                    {person.heightFeel&&<div><div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>📏 HEIGHT</div><div style={{fontSize:14,fontWeight:600,textTransform:'capitalize'}}>{person.heightFeel.replace('-',' ')}</div></div>}
                    {person.bodyType&&<div><div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>🏃 BODY TYPE</div><div style={{fontSize:14,fontWeight:600,textTransform:'capitalize'}}>{person.bodyType}</div></div>}
                    {person.hairLength&&<div><div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>💇 HAIR</div><div style={{fontSize:14,fontWeight:600,textTransform:'capitalize'}}>{person.hairLength.replace('-',' ')}</div></div>}
                  </div>
                </div>
              )}
              {person.characterTags?.length>0&&(
                <div className="pp-card">
                  <div className="pp-card-title">CHARACTER</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {person.characterTags.map(t=>(
                      <span key={t} style={{padding:'4px 12px',borderRadius:20,background:'rgba(167,139,250,0.15)',color:'#a78bfa',fontSize:12,fontWeight:600}}>#{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="pp-col-side">
              <div className="pp-card">
                <div className="pp-card-title">CURRENT STATUS</div>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px',background:'var(--surface2)',borderRadius:10}}>
                  <span style={{fontSize:28}}>{bond.emoji}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:bond.color}}>{bond.label}</div>
                    <div style={{fontSize:11,color:'var(--muted)'}}>as of {format(new Date(),'MMM d, yyyy')}</div>
                  </div>
                </div>
                <button className="btn-interrupt" style={{width:'100%',marginTop:10}} onClick={()=>setShowStatusForm(true)}>↻ Update Status</button>
              </div>
              {daysSince!==null&&(
                <div className="pp-card" style={{textAlign:'center'}}>
                  <div className="pp-card-title">LAST NOTE</div>
                  <div style={{fontSize:42,fontWeight:700,color:daysSince>30?'#f87171':'#fbbf24',fontFamily:'var(--mono)'}}>{daysSince}d</div>
                  <div style={{fontSize:12,color:'var(--muted)'}}>{contactLabel(daysSince)}</div>
                </div>
              )}
              {(person.mobile||person.instagram)&&(
                <div className="pp-card">
                  <div className="pp-card-title">CONTACT</div>
                  {person.mobile&&<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,fontSize:14}}>📱 {person.mobile}</div>}
                  {person.instagram&&<div style={{display:'flex',alignItems:'center',gap:10,fontSize:14}}>📸 @{person.instagram}</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {tab==='notes' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div className="card-label">NOTES & CONVERSATIONS</div>
              <button className="btn-add small" onClick={()=>setShowNoteForm(!showNoteForm)}>+ Add Note</button>
            </div>
            {showNoteForm&&(
              <form onSubmit={addNote} className="card" style={{marginBottom:16}}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select value={noteForm.type} onChange={e=>setNoteForm({...noteForm,type:e.target.value})}>
                      {['conversation','feeling','event','thought','conflict','good-moment','other'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Date</label><input type="date" value={noteForm.date} onChange={e=>setNoteForm({...noteForm,date:e.target.value})}/></div>
                </div>
                <textarea required placeholder="Write your note, feelings, or what happened..." value={noteForm.content} onChange={e=>setNoteForm({...noteForm,content:e.target.value})} rows={3}/>
                <label style={{fontSize:12,color:'var(--muted)',marginBottom:6,display:'block'}}>Mention others</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
                  {people.filter(p=>p._id!==person._id).map(p=>(
                    <label key={p._id} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
                      <input type="checkbox" style={{width:'auto',margin:0}} checked={noteForm.mentionedPeople.includes(p._id)}
                        onChange={e=>{const l=e.target.checked?[...noteForm.mentionedPeople,p._id]:noteForm.mentionedPeople.filter(id=>id!==p._id); setNoteForm({...noteForm,mentionedPeople:l});}}/>
                      {p.name}
                    </label>
                  ))}
                </div>
                <button type="submit">Save Note</button>
              </form>
            )}
            {notes?.length===0&&<p className="empty-msg">No notes yet. Add one!</p>}
            {notes?.map(note=>(
              <div key={note._id} className="person-note-card" style={{borderLeftColor:{conversation:'#60a5fa',feeling:'#f472b6','good-moment':'#4ade80',conflict:'#f87171'}[note.type]||'var(--border)'}}>
                <div className="note-header">
                  <span className="note-type-badge">{note.type}</span>
                  <span className="note-date">{note.date}</span>
                  <button className="btn-delete" onClick={()=>deleteNote(note._id)}>✕</button>
                </div>
                <p style={{fontSize:14,lineHeight:1.7,marginTop:6}}>{note.content}</p>
                {note.mentionedPeople?.length>0&&<div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>👥 {note.mentionedPeople.map(p=>p.name).join(', ')}</div>}
              </div>
            ))}
          </div>
        )}

        {/* MEMORIES TAB */}
        {tab==='memories' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div className="card-label">MEMORIES WITH {person.name.toUpperCase()}</div>
              <button className="btn-add small" onClick={()=>setShowMemForm(!showMemForm)}>+ Add Memory</button>
            </div>
            {showMemForm&&(
              <form onSubmit={addMemory} className="card" style={{marginBottom:16}}>
                <input required placeholder="Memory title" value={memForm.title} onChange={e=>setMemForm({...memForm,title:e.target.value})}/>
                <textarea required placeholder="Describe the memory..." value={memForm.content} onChange={e=>setMemForm({...memForm,content:e.target.value})} rows={3}/>
                <div className="form-row">
                  <div className="form-group"><label>Date</label><input type="date" value={memForm.date} onChange={e=>setMemForm({...memForm,date:e.target.value})}/></div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={memForm.category} onChange={e=>setMemForm({...memForm,category:e.target.value})}>
                      {['Happy','Sad','Funny','Lesson','Awkward','Special','Regret','Other'].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <input placeholder="Tags (comma separated)" value={memForm.tags} onChange={e=>setMemForm({...memForm,tags:e.target.value})}/>
                <button type="submit">Save Memory</button>
              </form>
            )}
            {memories?.length===0&&<p className="empty-msg">No memories yet.</p>}
            {memories?.map(mem=>(
              <div key={mem._id} className="memory-card">
                <div className="memory-header">
                  <span className="memory-title">{mem.title}</span>
                  <span className="memory-cat">{mem.category}</span>
                  <span className="memory-date">{mem.date}</span>
                  <button className="btn-delete" onClick={()=>deleteMem(mem._id)}>✕</button>
                </div>
                <p className="memory-content">{mem.content}</p>
                {mem.tags?.length>0&&<div className="note-tags">{mem.tags.map(t=><span key={t} className="tag">#{t}</span>)}</div>}
              </div>
            ))}
          </div>
        )}

        {/* STATUS HISTORY TAB */}
        {tab==='status' && (
          <div>
            <div className="card-label" style={{marginBottom:16}}>STATUS HISTORY</div>
            {person.bondHistory?.length===0&&<p className="empty-msg">No status history yet.</p>}
            {[...(person.bondHistory||[])].reverse().map((h,i)=>{
              const b = getBondMeta(h.status);
              return (
                <div key={i} className="card" style={{marginBottom:10,borderLeft:`3px solid ${b.color}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:h.note?6:0}}>
                    <span style={{fontSize:20}}>{b.emoji}</span>
                    <span style={{fontWeight:600,color:b.color}}>{b.label}</span>
                    {i===0&&<span style={{fontSize:10,background:'rgba(78,201,176,0.15)',color:'#4ec9b0',padding:'2px 8px',borderRadius:6,fontWeight:700}}>CURRENT</span>}
                    <span style={{marginLeft:'auto',fontSize:12,color:'var(--muted)',fontFamily:'var(--mono)'}}>{h.date?format(new Date(h.date),'MMM d, yyyy'):''}</span>
                  </div>
                  {h.note&&<p style={{fontSize:13,color:'var(--muted)',fontStyle:'italic',margin:0}}>{h.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Relationships Page ───────────────────────────────────────
export default function Relationships() {
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list'); // list | profile
  const [showForm, setShowForm] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const fetchPeople = async () => { const res = await api.get('/api/people'); setPeople(res.data.people); };
  const fetchPerson = async id => { const res = await api.get(`/api/people/${id}`); setSelected(res.data); };
  useEffect(() => { fetchPeople(); }, []);

  const handleSave = async form => {
    if (editPerson) await api.put(`/api/people/${editPerson._id}`, form);
    else await api.post('/api/people', form);
    setShowForm(false); setEditPerson(null); fetchPeople();
    if (selected) fetchPerson(selected.person._id);
  };

  const handleEdit = person => { setEditPerson(person); setShowForm(true); setView('list'); };
  const handleDelete = async id => {
    if (!window.confirm('Delete this person?')) return;
    await api.delete(`/api/people/${id}`);
    setView('list'); setSelected(null); fetchPeople();
  };

  const openProfile = async person => { await fetchPerson(person._id); setView('profile'); };

  const specialPeople = people.filter(p=>p.isSpecial);
  const needsContact = people.filter(p=>{ const d=getDaysSince(p.lastContacted); return d!==null&&d>30; });

  const FILTER_TABS = [
    {key:'all',label:'Everyone',emoji:'◎'},
    ...REL_TYPES.filter(r=>people.some(p=>p.relationshipType===r.key)).map(r=>({key:r.key,label:r.label,emoji:r.emoji}))
  ];

  const filtered = people.filter(p=>(filterType==='all'||p.relationshipType===filterType)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())));

  if (view==='profile' && selected) {
    return <PersonProfile data={selected} people={people} onBack={()=>setView('list')} onEdit={handleEdit} onDelete={handleDelete} onRefresh={fetchPerson}/>;
  }

  return (
    <div className="relationships-page">
      {/* Special strip */}
      {specialPeople.length>0&&(
        <div className="special-strip">
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:'#e8637a',textTransform:'uppercase',whiteSpace:'nowrap'}}>⭐ Special</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {specialPeople.map(p=>{
              const m=getRelMeta(p.relationshipType);
              return (
                <button key={p._id} className="special-pill" style={{'--sc':m.color,'--sb':m.bg}} onClick={()=>openProfile(p)}>
                  <div className="special-pill-avatar">
                    {p.photo?<img src={p.photo} alt={p.name}/>:<span style={{color:m.color,fontSize:11,fontWeight:700}}>{getInitials(p.name)}</span>}
                  </div>
                  <span style={{fontSize:13,fontWeight:600}}>{p.name}</span>
                  <span>⭐</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rel-header">
        <div>
          <h2 style={{marginBottom:4}}>Relationships</h2>
          <p style={{color:'var(--muted)',fontSize:13}}>{people.length} people in your life</p>
        </div>
        <button className="btn-add" onClick={()=>{setEditPerson(null);setShowForm(true);}}>+ Add Person</button>
      </div>

      {/* Overdue banner */}
      {needsContact.length>0&&(
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 18px',borderRadius:8,background:'rgba(212,168,83,0.07)',border:'1px solid rgba(212,168,83,0.2)',fontSize:14,marginBottom:20}}>
          🔔 Reach out to <strong style={{color:'#fbbf24'}}>{needsContact.slice(0,2).map(p=>p.name).join(', ')}{needsContact.length>2?` +${needsContact.length-2} more`:''}</strong>
        </div>
      )}

      {/* Filter tabs */}
      <div className="rel-filter-bar">
        <div className="filter-scroll">
          {FILTER_TABS.map(f=>(
            <button key={f.key} className={`fchip ${filterType===f.key?'active':''}`} onClick={()=>setFilterType(f.key)}>
              {f.emoji} {f.label}
              {f.key!=='all'&&<span className="fchip-count">{people.filter(p=>p.relationshipType===f.key).length}</span>}
            </button>
          ))}
        </div>
        <div className="rel-search">
          <span>🔍</span>
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{border:'none',background:'transparent',outline:'none',color:'var(--text)',padding:'8px 0',width:160}}/>
        </div>
      </div>

      {/* People grid */}
      {filtered.length===0?(
        <div className="card"><p className="empty-msg">{search||filterType!=='all'?'No matches':'No people added yet. Add someone!'}</p></div>
      ):(
        <div className="people-grid">
          {filtered.map((p,i)=>{
            const m=getRelMeta(p.relationshipType);
            const days=getDaysSince(p.lastContacted);
            const over=days!==null&&days>30;
            const lbl=contactLabel(days);
            return (
              <div key={p._id} className={`person-card`} style={{'--pc':m.color,animationDelay:`${i*0.04}s`,cursor:'pointer'}} onClick={()=>openProfile(p)}>
                {p.isSpecial&&<div style={{position:'absolute',top:8,left:8,fontSize:12}}>⭐</div>}
                <div className="person-card-photo">
                  {p.photo?<img src={p.photo} alt={p.name} style={{width:60,height:60,borderRadius:'50%',objectFit:'cover',border:`3px solid ${m.color}33`}}/>
                    :<div className="person-avatar" style={{background:m.bg,color:m.color}}>{getInitials(p.name)}</div>}
                  <span className="strength-dot" style={{background:getBondMeta(p.bondStatus).color}}/>
                  {over&&<div style={{position:'absolute',inset:-4,borderRadius:'50%',border:'2px solid #f87171',animation:'pulse 2s infinite'}}/>}
                </div>
                <div className="person-card-info">
                  <div className="person-card-name">{p.name}</div>
                  {getAge(p.dob)&&<div style={{fontSize:11,color:'var(--muted)'}}>{getAge(p.dob)} yrs</div>}
                  <div style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:m.bg,color:m.color,marginTop:4,display:'inline-block'}}>{m.emoji} {m.label}</div>
                  {p.characterTags?.slice(0,2).map(t=><span key={t} className="mini-tag">#{t}</span>)}
                </div>
                <div className="person-card-footer">
                  {lbl?<span style={{color:over?'#f87171':'#4ade80',fontSize:11}}>{over?'⚠ ':''}{lbl}</span>:<span style={{color:'var(--muted)',fontSize:11}}>Never noted</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm&&(
        <MultiStepForm
          initial={editPerson||undefined}
          isEdit={!!editPerson}
          onSave={handleSave}
          onCancel={()=>{setShowForm(false);setEditPerson(null);}}
        />
      )}
    </div>
  );
}
