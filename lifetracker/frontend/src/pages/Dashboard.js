import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { format, differenceInDays, addDays } from 'date-fns';

const PRESETS = [
  { name:'Sleep',icon:'😴',category:'Health'},{ name:'Wake Up / Freshen Up',icon:'🌅',category:'Health'},
  { name:'Breakfast',icon:'🍳',category:'Health'},{ name:'Lunch',icon:'🍱',category:'Health'},
  { name:'Dinner',icon:'🍽️',category:'Health'},{ name:'Study',icon:'📚',category:'Productive'},
  { name:'Work',icon:'💼',category:'Productive'},{ name:'Exercise',icon:'🏃',category:'Health'},
  { name:'Travel',icon:'🚗',category:'Personal'},{ name:'Break',icon:'☕',category:'Leisure'},
  { name:'Entertainment',icon:'📱',category:'Leisure'},{ name:'Chores',icon:'🧹',category:'Personal'},
  { name:'Social',icon:'👥',category:'Personal'},{ name:'Other',icon:'⚡',category:'General'},
];

const CAT_COLOR = {Health:'#10b981',Productive:'#60a5fa',Personal:'#f472b6',Leisure:'#fb923c',General:'#a78bfa'};
const PRIORITY_COLOR = {high:'#ef4444',medium:'#eab308',low:'#10b981'};

function icon(n){ return PRESETS.find(a=>a.name===n)?.icon||'⚡'; }
function timeSince(d){
  const diff=Math.round((Date.now()-new Date(d))/60000);
  const h=Math.floor(diff/60),m=diff%60;
  return h>0?`${h}h ${m}m`:`${m}m`;
}
function fmtINR(n){ return '₹'+Number(n).toLocaleString('en-IN'); }

export default function Dashboard() {
  const navigate = useNavigate();
  const today    = format(new Date(),'yyyy-MM-dd');
  const weekStart= format(new Date(new Date().setDate(new Date().getDate()-new Date().getDay()+1)),'yyyy-MM-dd');
  const next7    = format(addDays(new Date(),7),'yyyy-MM-dd');

  const [current,      setCurrent]      = useState(null);
  const [schedules,    setSchedules]    = useState([]);
  const [upcoming,     setUpcoming]     = useState([]);  // next 7 days tasks
  const [birthdays,    setBirthdays]    = useState([]);
  const [todayExp,     setTodayExp]     = useState(0);
  const [weekExp,      setWeekExp]      = useState(0);
  const [weight,       setWeight]       = useState(null);
  const [recentLogs,   setRecentLogs]   = useState([]);
  const [showPicker,   setShowPicker]   = useState(false);
  const [showGap,      setShowGap]      = useState(false);
  const [custom,       setCustom]       = useState('');
  const [gap,          setGap]          = useState({activity:'',startTime:'',endTime:'',note:''});
  const [loading,      setLoading]      = useState(false);
  const [ticker,       setTicker]       = useState(0);

  const load = useCallback(async () => {
    try {
      const [cur,sched,bd,expT,expW,health,logs,sched7] = await Promise.all([
        api.get('/api/activities/current'),
        api.get(`/api/schedules?date=${today}`),
        api.get('/api/people/birthdays/upcoming'),
        api.get(`/api/expenses?date=${today}`),
        api.get(`/api/expenses?start=${weekStart}&end=${today}`),
        api.get('/api/health'),
        api.get(`/api/activities?date=${today}`),
        api.get(`/api/schedules?start=${format(addDays(new Date(),1),'yyyy-MM-dd')}&end=${next7}`),
      ]);
      setCurrent(cur.data.current);
      setSchedules(sched.data.schedules||[]);
      setUpcoming(sched7.data.schedules||[]);
      setBirthdays(bd.data.upcoming||[]);
      setTodayExp(expT.data.total||0);
      setWeekExp(expW.data.total||0);
      const entries=health.data.entries||[];
      const latest=entries.find(e=>e.weight);
      if(latest) setWeight(latest.weight);
      setRecentLogs((logs.data.logs||[]).slice(0,3));
    } catch(e){ console.error(e); }
  },[today,weekStart,next7]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ const t=setInterval(()=>setTicker(x=>x+1),30000); return()=>clearInterval(t); },[]);

  const startActivity = async(name,cat)=>{
    setLoading(true);
    try{ await api.post('/api/activities/start',{activity:name,category:cat}); await load(); setShowPicker(false); setCustom(''); }
    catch(e){ alert('Error'); }
    setLoading(false);
  };

  const addGap = async()=>{
    try{ await api.post('/api/activities/interrupt',gap); setShowGap(false); setGap({activity:'',startTime:'',endTime:'',note:''}); await load(); }
    catch(e){ alert('Error'); }
  };

  const toggleTask = async(t)=>{ await api.put(`/api/schedules/${t._id}`,{completed:!t.completed}); await load(); };

  const todayBd   = birthdays.filter(b=>b.daysUntil===0);
  const soonBd    = birthdays.filter(b=>b.daysUntil>0&&b.daysUntil<=15);
  const doneTasks = schedules.filter(t=>t.completed).length;
  const totalTasks= schedules.length;
  const pendingTasks= schedules.filter(t=>!t.completed);

  return (
    <div className="db-wrap">

      {/* ── LEFT COLUMN ─────────────────────────── */}
      <div className="db-left">

        {/* Birthdays */}
        {(todayBd.length>0||soonBd.length>0) && (
          <div className="db-birthday-bar">
            {todayBd.map(b=>(
              <span key={b.person._id} className="db-bd-item today">
                🎂 <strong>{b.person.name}</strong> — Birthday TODAY! 🎉
              </span>
            ))}
            {soonBd.map(b=>(
              <span key={b.person._id} className="db-bd-item">
                🎂 <strong>{b.person.name}</strong> — {b.daysUntil}d ({b.date})
              </span>
            ))}
          </div>
        )}

        {/* Current Activity Hero */}
        <div className="db-current-hero">
          <div className="db-hero-label">
            <span className="db-live-dot"/>
            NOW
          </div>
          {current ? (
            <div className="db-hero-body">
              <div className="db-hero-icon">{icon(current.activity)}</div>
              <div className="db-hero-info">
                <div className="db-hero-name">{current.activity}</div>
                <div className="db-hero-time">
                  Started {format(new Date(current.startTime),'h:mm a')} · <strong>{timeSince(current.startTime)}</strong>
                </div>
                {current.category && (
                  <span className="db-hero-cat" style={{background:CAT_COLOR[current.category]+'22',color:CAT_COLOR[current.category]}}>
                    {current.category}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="db-hero-empty">
              <div className="db-hero-empty-icon">⏸</div>
              <div>Nothing running</div>
            </div>
          )}
          <div className="db-hero-actions">
            <button className="btn-switch" onClick={()=>setShowPicker(true)}>
              {current ? '⇄ Switch' : '▶ Start'}
            </button>
            {current && (
              <button className="btn-interrupt" onClick={()=>setShowGap(true)}>+ Gap</button>
            )}
            <button className="btn-secondary" style={{fontSize:12}} onClick={()=>navigate('/activities')}>
              View Timeline →
            </button>
          </div>
        </div>

        {/* Recent activity log (today quick view) */}
        {recentLogs.length>0 && (
          <div className="db-recent-logs">
            <div className="db-section-title">Today so far</div>
            {recentLogs.map(l=>(
              <div key={l._id} className="db-log-row">
                <span style={{fontSize:16}}>{icon(l.activity)}</span>
                <span className="db-log-name">{l.activity}</span>
                <span className="db-log-dur">{(() => {
                  const m=l.durationMinutes||0; const h=Math.floor(m/60); return h>0?`${h}h ${m%60}m`:`${m}m`;
                })()}</span>
                <span className="db-log-time">{format(new Date(l.startTime),'h:mm a')}</span>
              </div>
            ))}
            <button className="db-view-all" onClick={()=>navigate('/activities')}>View full timeline →</button>
          </div>
        )}

        {/* Tasks today */}
        <div className="db-tasks-card">
          <div className="db-section-title">
            Today's Tasks
            <span className="db-task-count">{doneTasks}/{totalTasks}</span>
          </div>
          {schedules.length===0 ? (
            <div style={{color:'var(--text3)',fontSize:13,padding:'12px 0'}}>No tasks today.</div>
          ) : (
            schedules.map(task=>(
              <div key={task._id} className={`db-task-row ${task.completed?'done':''}`}>
                <input type="checkbox" checked={task.completed} onChange={()=>toggleTask(task)}
                  style={{width:15,height:15,margin:0,cursor:'pointer',accentColor:'var(--cyan)'}}/>
                <span className="db-task-name">{task.title}</span>
                {task.time && <span className="db-task-time">⏰ {task.time}</span>}
                <span style={{width:8,height:8,borderRadius:'50%',background:PRIORITY_COLOR[task.priority]||'var(--text3)',flexShrink:0}}/>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ── RIGHT COLUMN ─────────────────────────── */}
      <div className="db-right">

        {/* Quick Stats */}
        <div className="db-stats-grid">
          <div className="db-stat" style={{'--ac':'var(--cyan)'}}>
            <div className="db-stat-label">Today Spend</div>
            <div className="db-stat-value">{fmtINR(todayExp)}</div>
          </div>
          <div className="db-stat" style={{'--ac':'var(--purple)'}}>
            <div className="db-stat-label">This Week</div>
            <div className="db-stat-value">{fmtINR(weekExp)}</div>
          </div>
          {weight && (
            <div className="db-stat" style={{'--ac':'var(--green)'}}>
              <div className="db-stat-label">Weight</div>
              <div className="db-stat-value">{weight}kg</div>
            </div>
          )}
          <div className="db-stat" style={{'--ac':'var(--yellow)'}}>
            <div className="db-stat-label">Tasks</div>
            <div className="db-stat-value">{doneTasks}/{totalTasks}</div>
          </div>
        </div>

        {/* Upcoming birthdays 15 days */}
        {soonBd.length>0 && (
          <div className="db-widget">
            <div className="db-widget-title">🎂 Upcoming Birthdays</div>
            {soonBd.slice(0,5).map(b=>(
              <div key={b.person._id} className="db-bd-row">
                <div className="db-bd-avatar">
                  {b.person.photo
                    ? <img src={b.person.photo} alt={b.person.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                    : b.person.name[0].toUpperCase()}
                </div>
                <div className="db-bd-info">
                  <div className="db-bd-name">{b.person.name}</div>
                  <div className="db-bd-date">{b.date}</div>
                </div>
                <div className="db-bd-days" style={{color:b.daysUntil<=3?'var(--red)':'var(--yellow)'}}>
                  {b.daysUntil}d
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming 7 days schedule */}
        {upcoming.length>0 && (
          <div className="db-widget">
            <div className="db-widget-title">📅 Next 7 Days</div>
            {upcoming.slice(0,6).map(task=>(
              <div key={task._id} className="db-upcoming-row">
                <div className="db-upcoming-dot" style={{background:PRIORITY_COLOR[task.priority]}}/>
                <div className="db-upcoming-info">
                  <div className="db-upcoming-name">{task.title}</div>
                  <div className="db-upcoming-date">{task.date}{task.time?` · ${task.time}`:''}</div>
                </div>
              </div>
            ))}
            {upcoming.length>6 && <div style={{fontSize:11,color:'var(--text3)',padding:'4px 0'}}>+{upcoming.length-6} more</div>}
          </div>
        )}

        {/* Quick Nav */}
        <div className="db-widget">
          <div className="db-widget-title">Quick Access</div>
          <div className="db-quick-grid">
            {[
              {label:'Activities',icon:'⏱',to:'/activities'},
              {label:'Expenses',  icon:'💰',to:'/expenses'},
              {label:'People',    icon:'👥',to:'/relationships'},
              {label:'Memories',  icon:'💭',to:'/memories'},
              {label:'Health',    icon:'💪',to:'/health'},
              {label:'Links',     icon:'🔗',to:'/links'},
            ].map(q=>(
              <button key={q.to} className="db-quick-btn" onClick={()=>navigate(q.to)}>
                <span style={{fontSize:18}}>{q.icon}</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── MODALS ────────────────────────────────── */}
      {showPicker && (
        <div className="modal-overlay" onClick={()=>setShowPicker(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{current?'⇄ Switch Activity':'▶ Start Activity'}</div>
            <div className="activity-grid">
              {PRESETS.map(a=>(
                <button key={a.name} className={`activity-btn ${current?.activity===a.name?'active-btn':''}`}
                  onClick={()=>startActivity(a.name,a.category)} disabled={loading}>
                  <span className="act-icon">{a.icon}</span>
                  <span className="act-name">{a.name}</span>
                </button>
              ))}
            </div>
            <div className="custom-activity">
              <input placeholder="Custom activity..." value={custom}
                onChange={e=>setCustom(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&custom&&startActivity(custom,'General')}/>
              <button onClick={()=>custom&&startActivity(custom,'General')} disabled={!custom||loading}>Start</button>
            </div>
            <button className="modal-close" onClick={()=>setShowPicker(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showGap && (
        <div className="modal-overlay" onClick={()=>setShowGap(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Add Gap / Interruption</div>
            <p className="modal-sub">Add what happened between your current activity.</p>
            <input placeholder="What did you do?" value={gap.activity} onChange={e=>setGap({...gap,activity:e.target.value})}/>
            <label>Start Time</label>
            <input type="datetime-local" value={gap.startTime} onChange={e=>setGap({...gap,startTime:e.target.value})}/>
            <label>End Time</label>
            <input type="datetime-local" value={gap.endTime} onChange={e=>setGap({...gap,endTime:e.target.value})}/>
            <input placeholder="Note (optional)" value={gap.note} onChange={e=>setGap({...gap,note:e.target.value})}/>
            <button onClick={addGap} disabled={!gap.activity||!gap.startTime||!gap.endTime}
              style={{background:'linear-gradient(135deg,var(--cyan),#0ea5e9)',color:'#000',border:'none',padding:'10px',borderRadius:'8px',cursor:'pointer',fontWeight:700,width:'100%',fontFamily:'var(--font)'}}>
              Add Interruption
            </button>
            <button className="modal-close" onClick={()=>setShowGap(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}