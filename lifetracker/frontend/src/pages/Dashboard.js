import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { format, addDays } from 'date-fns';

const PRESETS = [
  { name:'Sleep',icon:'😴',cat:'Health'},{ name:'Wake Up / Freshen Up',icon:'🌅',cat:'Health'},
  { name:'Breakfast',icon:'🍳',cat:'Health'},{ name:'Lunch',icon:'🍱',cat:'Health'},
  { name:'Dinner',icon:'🍽️',cat:'Health'},{ name:'Study',icon:'📚',cat:'Productive'},
  { name:'Work',icon:'💼',cat:'Productive'},{ name:'Exercise',icon:'🏃',cat:'Health'},
  { name:'Travel',icon:'🚗',cat:'Personal'},{ name:'Break',icon:'☕',cat:'Leisure'},
  { name:'Entertainment',icon:'📱',cat:'Leisure'},{ name:'Chores',icon:'🧹',cat:'Personal'},
  { name:'Social',icon:'👥',cat:'Personal'},{ name:'Other',icon:'⚡',cat:'General'},
];
const CAT_COLOR   = {Health:'#10b981',Productive:'#60a5fa',Personal:'#f472b6',Leisure:'#fb923c',General:'#a78bfa'};
const PRIOR_COLOR = {high:'#ef4444',medium:'#eab308',low:'#10b981'};
const ai = n => PRESETS.find(a=>a.name===n)?.icon||'⚡';
const ts = d => { const diff=Math.round((Date.now()-new Date(d))/60000); const h=Math.floor(diff/60),m=diff%60; return h>0?`${h}h ${m}m`:`${m}m`; };
const inr = n => '₹'+Number(n).toLocaleString('en-IN');
const initials = n => (n||'').split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2);

export default function Dashboard() {
  const nav    = useNavigate();
  const today  = format(new Date(),'yyyy-MM-dd');
  const wkStart= format(new Date(new Date().setDate(new Date().getDate()-new Date().getDay()+1)),'yyyy-MM-dd');
  const next7  = format(addDays(new Date(),7),'yyyy-MM-dd');

  const [cur,setCur]       = useState(null);
  const [tasks,setTasks]   = useState([]);
  const [coming,setComing] = useState([]);
  const [bdays,setBdays]   = useState([]);
  const [reminders,setRems]= useState([]);
  const [expT,setExpT]     = useState(0);
  const [expW,setExpW]     = useState(0);
  const [wt,setWt]         = useState(null);
  const [logs,setLogs]     = useState([]);
  const [picker,setPicker] = useState(false);
  const [gapOpen,setGap]   = useState(false);
  const [custom,setCustom] = useState('');
  const [gap,setGapF]      = useState({activity:'',startTime:'',endTime:'',note:''});
  const [busy,setBusy]     = useState(false);
  const [wishPerson,setWish]= useState(null);

  const load = useCallback(async () => {
    const safe = p => p.catch(()=>({data:{}}));
    const [a,b,c,d,e,f,g,h,i] = await Promise.all([
      safe(api.get('/api/activities/current')),
      safe(api.get(`/api/schedules?date=${today}`)),
      safe(api.get('/api/people/birthdays/upcoming')),
      safe(api.get(`/api/expenses?date=${today}`)),
      safe(api.get(`/api/expenses?start=${wkStart}&end=${today}`)),
      safe(api.get('/api/health')),
      safe(api.get(`/api/activities?date=${today}`)),
      safe(api.get(`/api/schedules?start=${format(addDays(new Date(),1),'yyyy-MM-dd')}&end=${next7}`)),
      safe(api.get('/api/schedules/reminders/today')),
    ]);
    setCur(a.data.current);
    setTasks(b.data.schedules||[]);
    setBdays(c.data.upcoming||[]);
    setExpT(d.data.total||0);
    setExpW(e.data.total||0);
    setWt((f.data.entries||[]).find(x=>x.weight)?.weight||null);
    setLogs((g.data.logs||[]).slice(0,3));
    setComing(h.data.schedules||[]);
    setRems(i.data.reminders||[]);
  },[today,wkStart,next7]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{const t=setInterval(load,60000);return()=>clearInterval(t);},[load]);

  const startAct=async(name,cat)=>{
    setBusy(true);
    try{await api.post('/api/activities/start',{activity:name,category:cat});await load();setPicker(false);setCustom('');}
    catch(e){alert('Error starting activity');}
    setBusy(false);
  };

  const addGap=async()=>{
    try{await api.post('/api/activities/interrupt',gap);setGap(false);setGapF({activity:'',startTime:'',endTime:'',note:''});await load();}
    catch(e){alert('Error');}
  };

  const toggleTask=async t=>{await api.put(`/api/schedules/${t._id}`,{completed:!t.completed});await load();};

  const todayBd = bdays.filter(b=>b.daysUntil===0);
  const soonBd  = bdays.filter(b=>b.daysUntil>0&&b.daysUntil<=15);
  const done    = tasks.filter(t=>t.completed).length;

  return (
    <div className="db-wrap">

      {/* ─ LEFT ─ */}
      <div className="db-left">

        {/* TODAY BIRTHDAYS */}
        {todayBd.map(b=>(
          <div key={b.person._id} className="db-birthday-today" onClick={()=>nav('/relationships')}>
            <div className="db-bday-today-avatar">
              {b.person.photo?<img src={b.person.photo} alt={b.person.name}/>:initials(b.person.name)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:15,color:'var(--yellow)'}}>🎂 {b.person.name}'s Birthday is TODAY!</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>Tap to view profile and wish them</div>
            </div>
            <button className="db-wish-btn" onClick={e=>{e.stopPropagation();setWish(b.person);}}>🎉 Wish</button>
          </div>
        ))}

        {/* REMINDERS */}
        {reminders.length>0&&(
          <div className="card" style={{borderColor:'rgba(234,179,8,0.25)',background:'linear-gradient(135deg,var(--surface),rgba(234,179,8,0.04))'}}>
            <div className="card-label" style={{color:'var(--yellow)'}}>🔔 Reminders Today</div>
            {reminders.map(r=>(
              <div key={r._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:18}}>⏰</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{r.title}</div>
                  {r.reminderNote&&<div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{r.reminderNote}</div>}
                </div>
                {r.time&&<span style={{fontSize:11,color:'var(--cyan)',fontFamily:'var(--mono)'}}>{r.time}</span>}
              </div>
            ))}
          </div>
        )}

        {/* CURRENT ACTIVITY */}
        <div className="db-current-hero">
          <div className="db-hero-label"><span className="db-live-dot"/>NOW</div>
          {cur?(
            <div>
              <div className="db-hero-body">
                <div className="db-hero-icon">{ai(cur.activity)}</div>
                <div className="db-hero-info">
                  <div className="db-hero-name">{cur.activity}</div>
                  <div className="db-hero-time">Started {format(new Date(cur.startTime),'h:mm a')} · <strong>{ts(cur.startTime)}</strong></div>
                  {cur.category&&<span className="db-hero-cat" style={{background:CAT_COLOR[cur.category]+'22',color:CAT_COLOR[cur.category]}}>{cur.category}</span>}
                </div>
              </div>
              <div className="db-hero-actions">
                <button className="btn-switch" onClick={()=>setPicker(true)}>⇄ Switch</button>
                <button className="btn-interrupt" onClick={()=>setGap(true)}>+ Gap</button>
                <button className="btn-secondary" style={{fontSize:12}} onClick={()=>nav('/activities')}>Timeline →</button>
              </div>
            </div>
          ):(
            <div>
              <div className="db-hero-empty"><div className="db-hero-empty-icon">⏸</div><div>Nothing running</div></div>
              <div className="db-hero-actions"><button className="btn-switch" onClick={()=>setPicker(true)}>▶ Start Activity</button></div>
            </div>
          )}
        </div>

        {/* TODAY SO FAR */}
        {logs.length>0&&(
          <div className="db-recent-logs">
            <div className="db-section-title">Today so far</div>
            {logs.map(l=>(
              <div key={l._id} className="db-log-row">
                <span style={{fontSize:16}}>{ai(l.activity)}</span>
                <span className="db-log-name">{l.activity}</span>
                <span className="db-log-dur">{(()=>{const m=l.durationMinutes||0,h=Math.floor(m/60);return h>0?`${h}h ${m%60}m`:`${m}m`;})()}</span>
                <span className="db-log-time">{format(new Date(l.startTime),'h:mm a')}</span>
              </div>
            ))}
            <button className="db-view-all" onClick={()=>nav('/activities')}>View full timeline →</button>
          </div>
        )}

        {/* TODAY TASKS */}
        <div className="db-tasks-card">
          <div className="db-section-title">
            Today's Tasks
            <span className="db-task-count">{done}/{tasks.length}</span>
          </div>
          {tasks.length===0
            ?<div style={{color:'var(--text3)',fontSize:13,padding:'10px 0'}}>No tasks today. <button onClick={()=>nav('/schedule')} style={{background:'none',border:'none',color:'var(--cyan)',cursor:'pointer',fontSize:13}}>Add one →</button></div>
            :tasks.map(t=>(
              <div key={t._id} className={`db-task-row ${t.completed?'done':''}`}>
                <input type="checkbox" checked={t.completed} onChange={()=>toggleTask(t)} style={{width:15,height:15,margin:0,cursor:'pointer',accentColor:'var(--cyan)'}}/>
                <span className="db-task-name">{t.title}</span>
                {t.time&&<span className="db-task-time">⏰ {t.time}</span>}
                {t.reminder&&<span title="Has reminder" style={{fontSize:12}}>🔔</span>}
                <span style={{width:8,height:8,borderRadius:'50%',background:PRIOR_COLOR[t.priority]||'var(--text3)',flexShrink:0}}/>
              </div>
            ))
          }
        </div>
      </div>

      {/* ─ RIGHT ─ */}
      <div className="db-right">
        <div className="db-stats-grid">
          <div className="db-stat" style={{'--ac':'var(--cyan)'}}><div className="db-stat-label">Today Spend</div><div className="db-stat-value">{inr(expT)}</div></div>
          <div className="db-stat" style={{'--ac':'var(--purple)'}}><div className="db-stat-label">This Week</div><div className="db-stat-value">{inr(expW)}</div></div>
          {wt&&<div className="db-stat" style={{'--ac':'var(--green)'}}><div className="db-stat-label">Weight</div><div className="db-stat-value">{wt}kg</div></div>}
          <div className="db-stat" style={{'--ac':'var(--yellow)'}}><div className="db-stat-label">Tasks</div><div className="db-stat-value">{done}/{tasks.length}</div></div>
        </div>

        {soonBd.length>0&&(
          <div className="db-widget">
            <div className="db-widget-title">🎂 Upcoming Birthdays</div>
            {soonBd.slice(0,5).map(b=>(
              <div key={b.person._id} className="db-bd-row" style={{cursor:'pointer'}} onClick={()=>nav('/relationships')}>
                <div className="db-bd-avatar">
                  {b.person.photo?<img src={b.person.photo} alt={b.person.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>:initials(b.person.name)}
                </div>
                <div className="db-bd-info"><div className="db-bd-name">{b.person.name}</div><div className="db-bd-date">{b.date}</div></div>
                <div className="db-bd-days" style={{color:b.daysUntil<=3?'var(--red)':'var(--yellow)'}}>{b.daysUntil}d</div>
              </div>
            ))}
          </div>
        )}

        {coming.length>0&&(
          <div className="db-widget">
            <div className="db-widget-title">📅 Next 7 Days</div>
            {coming.slice(0,6).map(t=>(
              <div key={t._id} className="db-upcoming-row">
                <div className="db-upcoming-dot" style={{background:PRIOR_COLOR[t.priority]||'var(--text3)'}}/>
                <div className="db-upcoming-info">
                  <div className="db-upcoming-name">{t.title}{t.reminder&&<span style={{fontSize:10,marginLeft:4}}>🔔</span>}</div>
                  <div className="db-upcoming-date">{t.date}{t.time?` · ${t.time}`:''}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="db-widget">
          <div className="db-widget-title">Quick Access</div>
          <div className="db-quick-grid">
            {[['⏱','Activities','/activities'],['💰','Expenses','/expenses'],['👥','People','/relationships'],['💭','Memories','/memories'],['💪','Health','/health'],['🔗','Links','/links']].map(([ic,lb,to])=>(
              <button key={to} className="db-quick-btn" onClick={()=>nav(to)}>
                <span style={{fontSize:18}}>{ic}</span><span>{lb}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {picker&&(
        <div className="modal-overlay" onClick={()=>setPicker(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{cur?'⇄ Switch Activity':'▶ Start Activity'}</div>
            <div className="activity-grid">
              {PRESETS.map(a=>(
                <button key={a.name} className={`activity-btn ${cur?.activity===a.name?'active-btn':''}`}
                  onClick={()=>startAct(a.name,a.cat)} disabled={busy}>
                  <span className="act-icon">{a.icon}</span><span className="act-name">{a.name}</span>
                </button>
              ))}
            </div>
            <div className="custom-activity">
              <input placeholder="Custom activity..." value={custom} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>e.key==='Enter'&&custom&&startAct(custom,'General')}/>
              <button onClick={()=>custom&&startAct(custom,'General')} disabled={!custom||busy}>Start</button>
            </div>
            <button className="modal-close" onClick={()=>setPicker(false)}>Cancel</button>
          </div>
        </div>
      )}

      {gapOpen&&(
        <div className="modal-overlay" onClick={()=>setGap(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Add Gap / Interruption</div>
            <input placeholder="What did you do?" value={gap.activity} onChange={e=>setGapF({...gap,activity:e.target.value})}/>
            <label>Start Time</label>
            <input type="datetime-local" value={gap.startTime} onChange={e=>setGapF({...gap,startTime:e.target.value})}/>
            <label>End Time</label>
            <input type="datetime-local" value={gap.endTime} onChange={e=>setGapF({...gap,endTime:e.target.value})}/>
            <input placeholder="Note (optional)" value={gap.note} onChange={e=>setGapF({...gap,note:e.target.value})}/>
            <button onClick={addGap} disabled={!gap.activity||!gap.startTime||!gap.endTime}
              style={{background:'linear-gradient(135deg,var(--cyan),#0ea5e9)',color:'#000',border:'none',padding:'10px',borderRadius:'8px',cursor:'pointer',fontWeight:700,width:'100%',fontFamily:'var(--font)'}}>
              Add
            </button>
            <button className="modal-close" onClick={()=>setGap(false)}>Cancel</button>
          </div>
        </div>
      )}

      {wishPerson&&(
        <div className="modal-overlay" onClick={()=>setWish(null)}>
          <div className="modal" style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:60,marginBottom:10}}>🎂</div>
            <div className="modal-title">Happy Birthday, {wishPerson.name}! 🎉</div>
            <p style={{color:'var(--text2)',fontSize:13,margin:'10px 0 20px'}}>Today is their special day!</p>
            <button className="btn-switch" style={{width:'100%',marginBottom:8,justifyContent:'center'}} onClick={()=>{nav('/relationships');setWish(null);}}>View Profile</button>
            <button className="modal-close" onClick={()=>setWish(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}