import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const SKILL_LEVELS = [
  { key:'beginner',   label:'Beginner',   color:'#94a3b8', pct:10 },
  { key:'learning',   label:'Learning',   color:'#fb923c', pct:30 },
  { key:'intermediate',label:'Intermediate',color:'#fbbf24',pct:55},
  { key:'advanced',   label:'Advanced',   color:'#60a5fa', pct:80 },
  { key:'expert',     label:'Expert',     color:'#4ade80', pct:100},
];

const SKILL_CATS = ['All','Programming','Design','Language','Soft Skills','Tools','Domain','Other'];

export default function Skills() {
  const [tab,        setTab]        = useState('skills'); // skills | roadmap | goals
  const [skills,     setSkills]     = useState([]);
  const [goals,      setGoals]      = useState([]);
  const [roadmaps,   setRoadmaps]   = useState([]);
  const [catFilter,  setCatFilter]  = useState('All');
  const [showForm,   setShowForm]   = useState(false);
  const [showGoal,   setShowGoal]   = useState(false);
  const [showRoad,   setShowRoad]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [skillForm,  setSkillForm]  = useState({ name:'', category:'Programming', level:'beginner', target:'', note:'', progress:0 });
  const [goalForm,   setGoalForm]   = useState({ title:'', description:'', deadline:'', category:'', milestones:[] });
  const [roadForm,   setRoadForm]   = useState({ title:'', description:'', steps:[] });
  const [newStep,    setNewStep]    = useState('');
  const [newMile,    setNewMile]    = useState('');

  const load = async() => {
    try {
      const [sr,gr,rr] = await Promise.all([
        api.get('/api/skills'),
        api.get('/api/goals'),
        api.get('/api/roadmaps'),
      ]);
      setSkills(sr.data||[]);
      setGoals(gr.data||[]);
      setRoadmaps(rr.data||[]);
    } catch(e){ console.error(e); }
  };
  useEffect(()=>{ load(); },[]);

  const saveSkill = async(e) => {
    e.preventDefault();
    try {
      if(editItem) await api.put(`/api/skills/${editItem._id}`, skillForm);
      else         await api.post('/api/skills', skillForm);
      setShowForm(false); setEditItem(null); load();
    } catch(e){ alert('Error'); }
  };

  const saveGoal = async(e) => {
    e.preventDefault();
    try {
      if(editItem) await api.put(`/api/goals/${editItem._id}`, goalForm);
      else         await api.post('/api/goals', goalForm);
      setShowGoal(false); setEditItem(null); load();
    } catch(e){ alert('Error'); }
  };

  const saveRoad = async(e) => {
    e.preventDefault();
    try {
      if(editItem) await api.put(`/api/roadmaps/${editItem._id}`, roadForm);
      else         await api.post('/api/roadmaps', roadForm);
      setShowRoad(false); setEditItem(null); load();
    } catch(e){ alert('Error'); }
  };

  const toggleGoalMilestone = async(goal, idx) => {
    const milestones = goal.milestones.map((m,i) => i===idx ? {...m, done:!m.done} : m);
    await api.put(`/api/goals/${goal._id}`, {...goal, milestones});
    load();
  };

  const toggleRoadStep = async(road, idx) => {
    const steps = road.steps.map((s,i) => i===idx ? {...s, done:!s.done} : s);
    await api.put(`/api/roadmaps/${road._id}`, {...road, steps});
    load();
  };

  const delSkill   = async(id) => { await api.delete(`/api/skills/${id}`);   load(); };
  const delGoal    = async(id) => { await api.delete(`/api/goals/${id}`);    load(); };
  const delRoadmap = async(id) => { await api.delete(`/api/roadmaps/${id}`); load(); };

  const filteredSkills = catFilter==='All' ? skills : skills.filter(s=>s.category===catFilter);

  const getLevelInfo = (key) => SKILL_LEVELS.find(l=>l.key===key) || SKILL_LEVELS[0];

  // Compute stats
  const totalSkills = skills.length;
  const expertCount = skills.filter(s=>s.level==='expert').length;
  const activeGoals = goals.filter(g=>!g.completed).length;
  const doneGoals   = goals.filter(g=>g.completed).length;

  return (
    <div className="skills-page">
      <div className="page-header">
        <div>
          <div className="page-title">🚀 Skills & Progress</div>
          <div className="page-subtitle">Track your skills, goals and roadmap</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {tab==='skills'  && <button className="btn-add" onClick={()=>{ setEditItem(null); setSkillForm({name:'',category:'Programming',level:'beginner',target:'',note:'',progress:0}); setShowForm(true); }}>+ Add Skill</button>}
          {tab==='goals'   && <button className="btn-add" onClick={()=>{ setEditItem(null); setGoalForm({title:'',description:'',deadline:'',category:'',milestones:[]}); setShowGoal(true); }}>+ Add Goal</button>}
          {tab==='roadmap' && <button className="btn-add" onClick={()=>{ setEditItem(null); setRoadForm({title:'',description:'',steps:[]}); setShowRoad(true); }}>+ Add Roadmap</button>}
        </div>
      </div>

      {/* Stats bar */}
      <div className="skills-stats">
        <div className="sk-stat"><div className="sk-stat-val">{totalSkills}</div><div className="sk-stat-lbl">Skills</div></div>
        <div className="sk-stat"><div className="sk-stat-val" style={{color:'var(--green)'}}>{expertCount}</div><div className="sk-stat-lbl">Expert</div></div>
        <div className="sk-stat"><div className="sk-stat-val" style={{color:'var(--cyan)'}}>{activeGoals}</div><div className="sk-stat-lbl">Active Goals</div></div>
        <div className="sk-stat"><div className="sk-stat-val" style={{color:'var(--yellow)'}}>{doneGoals}</div><div className="sk-stat-lbl">Goals Done</div></div>
        <div className="sk-stat"><div className="sk-stat-val" style={{color:'var(--purple)'}}>{roadmaps.length}</div><div className="sk-stat-lbl">Roadmaps</div></div>
      </div>

      {/* Tabs */}
      <div className="skills-tabs">
        {[{key:'skills',label:'🧠 Skills'},{key:'goals',label:'🎯 Goals'},{key:'roadmap',label:'🗺 Roadmap'}].map(t=>(
          <button key={t.key} className={`skills-tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── SKILLS TAB ── */}
      {tab==='skills' && (
        <>
          <div className="skills-cat-filter">
            {SKILL_CATS.map(c=>(
              <button key={c} className={`links-cat-btn ${catFilter===c?'active':''}`}
                onClick={()=>setCatFilter(c)}>{c}</button>
            ))}
          </div>
          {filteredSkills.length===0 ? (
            <div className="empty-msg">No skills added yet.</div>
          ) : (
            <div className="skills-grid">
              {filteredSkills.map(skill=>{
                const lvl = getLevelInfo(skill.level);
                return (
                  <div key={skill._id} className="skill-card">
                    <div className="skill-card-top">
                      <div>
                        <div className="skill-name">{skill.name}</div>
                        <div className="skill-cat">{skill.category}</div>
                      </div>
                      <span className="skill-level-badge" style={{background:lvl.color+'22',color:lvl.color,border:`1px solid ${lvl.color}44`}}>
                        {lvl.label}
                      </span>
                    </div>
                    <div className="skill-bar-wrap">
                      <div className="skill-bar-track">
                        <div className="skill-bar-fill" style={{width:`${skill.progress||lvl.pct}%`,background:`linear-gradient(90deg, ${lvl.color}, ${lvl.color}aa)`}}/>
                      </div>
                      <span className="skill-bar-pct">{skill.progress||lvl.pct}%</span>
                    </div>
                    {skill.target && <div className="skill-target">🎯 Target: {skill.target}</div>}
                    {skill.note   && <div className="skill-note">{skill.note}</div>}
                    <div className="skill-actions">
                      <button className="btn-delete" style={{fontSize:12}} onClick={()=>{
                        setEditItem(skill);
                        setSkillForm({name:skill.name,category:skill.category,level:skill.level,target:skill.target||'',note:skill.note||'',progress:skill.progress||lvl.pct});
                        setShowForm(true);
                      }}>✏️</button>
                      <button className="btn-delete" onClick={()=>delSkill(skill._id)}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── GOALS TAB ── */}
      {tab==='goals' && (
        <div className="goals-list">
          {goals.length===0 ? <div className="empty-msg">No goals yet. Add your first goal!</div> : goals.map(goal=>{
            const done    = goal.milestones?.filter(m=>m.done).length||0;
            const total   = goal.milestones?.length||0;
            const pct     = total>0?Math.round(done/total*100):0;
            const overdue = goal.deadline && new Date(goal.deadline)<new Date() && !goal.completed;
            return (
              <div key={goal._id} className={`goal-card ${goal.completed?'completed':''} ${overdue?'overdue':''}`}>
                <div className="goal-card-header">
                  <div>
                    <div className="goal-title">{goal.title}</div>
                    {goal.description && <div className="goal-desc">{goal.description}</div>}
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                    {goal.deadline && (
                      <span className={`goal-deadline ${overdue?'overdue':''}`}>
                        📅 {goal.deadline}
                      </span>
                    )}
                    <button className="btn-delete" style={{fontSize:12}} onClick={()=>{
                      setEditItem(goal);
                      setGoalForm({title:goal.title,description:goal.description||'',deadline:goal.deadline||'',category:goal.category||'',milestones:goal.milestones||[]});
                      setShowGoal(true);
                    }}>✏️</button>
                    <button className="btn-delete" onClick={()=>delGoal(goal._id)}>🗑</button>
                  </div>
                </div>
                {total>0 && (
                  <div className="goal-progress">
                    <div className="goal-progress-bar">
                      <div style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,var(--cyan),var(--green))`,borderRadius:4,transition:'width 0.5s'}}/>
                    </div>
                    <span className="goal-pct">{pct}% · {done}/{total}</span>
                  </div>
                )}
                {goal.milestones?.length>0 && (
                  <div className="goal-milestones">
                    {goal.milestones.map((m,i)=>(
                      <div key={i} className={`milestone-row ${m.done?'done':''}`}>
                        <input type="checkbox" checked={m.done||false}
                          onChange={()=>toggleGoalMilestone(goal,i)}
                          style={{width:14,height:14,margin:0,cursor:'pointer',accentColor:'var(--green)'}}/>
                        <span>{m.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ROADMAP TAB ── */}
      {tab==='roadmap' && (
        <div className="roadmaps-list">
          {roadmaps.length===0 ? <div className="empty-msg">No roadmaps yet. Create your first roadmap!</div> : roadmaps.map(road=>{
            const done  = road.steps?.filter(s=>s.done).length||0;
            const total = road.steps?.length||0;
            const pct   = total>0?Math.round(done/total*100):0;
            return (
              <div key={road._id} className="road-card">
                <div className="road-card-header">
                  <div>
                    <div className="road-title">{road.title}</div>
                    {road.description && <div className="road-desc">{road.description}</div>}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn-delete" style={{fontSize:12}} onClick={()=>{
                      setEditItem(road);
                      setRoadForm({title:road.title,description:road.description||'',steps:road.steps||[]});
                      setShowRoad(true);
                    }}>✏️</button>
                    <button className="btn-delete" onClick={()=>delRoadmap(road._id)}>🗑</button>
                  </div>
                </div>
                {total>0 && (
                  <div className="road-progress">
                    <div className="road-progress-bar">
                      <div style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,var(--purple),var(--cyan))`,borderRadius:4,transition:'width 0.5s'}}/>
                    </div>
                    <span className="road-pct">{pct}% complete · {done}/{total} steps</span>
                  </div>
                )}
                <div className="road-steps">
                  {road.steps?.map((step,i)=>(
                    <div key={i} className={`road-step ${step.done?'done':''}`}>
                      <div className="road-step-num" style={{background:step.done?'var(--green)':'var(--surface3)',color:step.done?'#000':'var(--text3)'}}>{step.done?'✓':i+1}</div>
                      <div className="road-step-connector" style={{background:step.done?'var(--green)':'var(--border)'}}/>
                      <div className="road-step-content">
                        <div className="road-step-title" style={{textDecoration:step.done?'line-through':'none',color:step.done?'var(--text3)':'var(--text)'}}>{step.text}</div>
                        {step.note && <div className="road-step-note">{step.note}</div>}
                      </div>
                      <input type="checkbox" checked={step.done||false}
                        onChange={()=>toggleRoadStep(road,i)}
                        style={{width:14,height:14,margin:0,cursor:'pointer',accentColor:'var(--green)',flexShrink:0}}/>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SKILL FORM ── */}
      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editItem?'Edit Skill':'Add Skill'}</div>
            <form onSubmit={saveSkill}>
              <label>Skill Name *</label>
              <input required placeholder="e.g. React, Python, Figma" value={skillForm.name} onChange={e=>setSkillForm({...skillForm,name:e.target.value})}/>
              <label>Category</label>
              <select value={skillForm.category} onChange={e=>setSkillForm({...skillForm,category:e.target.value})}>
                {SKILL_CATS.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
              </select>
              <label>Current Level</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                {SKILL_LEVELS.map(l=>(
                  <button key={l.key} type="button"
                    className={skillForm.level===l.key?'btn-switch':'btn-secondary'}
                    style={skillForm.level===l.key?{background:l.color,color:'#000',border:`1px solid ${l.color}`,padding:'7px 14px',fontSize:12}:{padding:'7px 14px',fontSize:12}}
                    onClick={()=>setSkillForm({...skillForm,level:l.key,progress:l.pct})}>
                    {l.label}
                  </button>
                ))}
              </div>
              <label>Progress % ({skillForm.progress}%)</label>
              <input type="range" min="0" max="100" value={skillForm.progress}
                onChange={e=>setSkillForm({...skillForm,progress:Number(e.target.value)})}
                style={{marginBottom:12,width:'100%'}}/>
              <label>Target Level / Goal</label>
              <input placeholder="e.g. Build production apps" value={skillForm.target} onChange={e=>setSkillForm({...skillForm,target:e.target.value})}/>
              <label>Note</label>
              <textarea rows={2} placeholder="Resources, plan..." value={skillForm.note} onChange={e=>setSkillForm({...skillForm,note:e.target.value})}/>
              <button type="submit">Save Skill</button>
            </form>
            <button className="modal-close" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── GOAL FORM ── */}
      {showGoal && (
        <div className="modal-overlay" onClick={()=>setShowGoal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editItem?'Edit Goal':'Add Goal'}</div>
            <form onSubmit={saveGoal}>
              <label>Goal Title *</label>
              <input required placeholder="What do you want to achieve?" value={goalForm.title} onChange={e=>setGoalForm({...goalForm,title:e.target.value})}/>
              <label>Description</label>
              <textarea rows={2} placeholder="Why is this important?" value={goalForm.description} onChange={e=>setGoalForm({...goalForm,description:e.target.value})}/>
              <label>Deadline</label>
              <input type="date" value={goalForm.deadline} onChange={e=>setGoalForm({...goalForm,deadline:e.target.value})}/>
              <label>Milestones</label>
              <div style={{marginBottom:8}}>
                {goalForm.milestones.map((m,i)=>(
                  <div key={i} style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}>
                    <span style={{fontSize:12,color:'var(--text3)',minWidth:18}}>#{i+1}</span>
                    <input value={m.text} onChange={e=>{const ms=[...goalForm.milestones]; ms[i]={...m,text:e.target.value}; setGoalForm({...goalForm,milestones:ms});}} style={{flex:1,marginBottom:0}}/>
                    <button type="button" className="btn-delete" onClick={()=>setGoalForm({...goalForm,milestones:goalForm.milestones.filter((_,j)=>j!==i)})}>✕</button>
                  </div>
                ))}
                <div style={{display:'flex',gap:8}}>
                  <input placeholder="Add milestone..." value={newMile} onChange={e=>setNewMile(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&newMile.trim()){ e.preventDefault(); setGoalForm({...goalForm,milestones:[...goalForm.milestones,{text:newMile.trim(),done:false}]}); setNewMile(''); }}}
                    style={{flex:1,marginBottom:0}}/>
                  <button type="button" className="btn-add" style={{whiteSpace:'nowrap'}}
                    onClick={()=>{ if(newMile.trim()){ setGoalForm({...goalForm,milestones:[...goalForm.milestones,{text:newMile.trim(),done:false}]}); setNewMile(''); }}}>
                    + Add
                  </button>
                </div>
              </div>
              <button type="submit">Save Goal</button>
            </form>
            <button className="modal-close" onClick={()=>setShowGoal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── ROADMAP FORM ── */}
      {showRoad && (
        <div className="modal-overlay" onClick={()=>setShowRoad(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editItem?'Edit Roadmap':'Create Roadmap'}</div>
            <form onSubmit={saveRoad}>
              <label>Roadmap Title *</label>
              <input required placeholder="e.g. Become a Full Stack Developer" value={roadForm.title} onChange={e=>setRoadForm({...roadForm,title:e.target.value})}/>
              <label>Description</label>
              <textarea rows={2} placeholder="What is this roadmap for?" value={roadForm.description} onChange={e=>setRoadForm({...roadForm,description:e.target.value})}/>
              <label>Steps (in order)</label>
              <div style={{marginBottom:8}}>
                {roadForm.steps.map((s,i)=>(
                  <div key={i} style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}>
                    <span style={{fontSize:12,color:'var(--text3)',minWidth:18,fontFamily:'var(--mono)'}}>#{i+1}</span>
                    <input value={s.text} onChange={e=>{const ss=[...roadForm.steps]; ss[i]={...s,text:e.target.value}; setRoadForm({...roadForm,steps:ss});}} style={{flex:1,marginBottom:0}}/>
                    <button type="button" className="btn-delete" onClick={()=>setRoadForm({...roadForm,steps:roadForm.steps.filter((_,j)=>j!==i)})}>✕</button>
                  </div>
                ))}
                <div style={{display:'flex',gap:8}}>
                  <input placeholder="Add step..." value={newStep} onChange={e=>setNewStep(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&newStep.trim()){ e.preventDefault(); setRoadForm({...roadForm,steps:[...roadForm.steps,{text:newStep.trim(),done:false}]}); setNewStep(''); }}}
                    style={{flex:1,marginBottom:0}}/>
                  <button type="button" className="btn-add" style={{whiteSpace:'nowrap'}}
                    onClick={()=>{ if(newStep.trim()){ setRoadForm({...roadForm,steps:[...roadForm.steps,{text:newStep.trim(),done:false}]}); setNewStep(''); }}}>
                    + Add
                  </button>
                </div>
              </div>
              <button type="submit">Save Roadmap</button>
            </form>
            <button className="modal-close" onClick={()=>setShowRoad(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
