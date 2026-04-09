import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard     from './pages/Dashboard';
import Activities    from './pages/Activities';
import Analytics     from './pages/Analytics';
import Health        from './pages/Health';
import Scheduler     from './pages/Scheduler';
import Notes         from './pages/Notes';
import Admin         from './pages/Admin';
import Login         from './pages/Login';
import Expenses      from './pages/Expenses';
import Relationships from './pages/Relationships';
import Memories      from './pages/Memories';
import Links         from './pages/Links';
import Skills        from './pages/Skills';
import './App.css';
import './NewFeatures.css';
import './NewPages.css';

function PLMLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="26" height="26">
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <circle cx="16" cy="16" r="3" fill="currentColor"/>
      <line x1="16" y1="16" x2="16" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="16" x2="24" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <circle cx="16" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="27" cy="16" r="1.2" fill="currentColor" opacity="0.5"/>
      <circle cx="5" cy="16" r="1.2" fill="currentColor" opacity="0.5"/>
      <circle cx="16" cy="27" r="1.2" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

const NAV = [
  { to:'/',             label:'Dashboard',  icon:'🏠', always:true },
  { to:'/activities',   label:'Activities', icon:'⏱', always:true },
  { to:'/analytics',    label:'Analytics',  icon:'📊', always:true },
  { to:'/schedule',     label:'Schedule',   icon:'📅', perm:'schedule' },
  { to:'/health',       label:'Health',     icon:'💪', perm:'health' },
  { to:'/expenses',     label:'Expenses',   icon:'💰', perm:'expenses' },
  { to:'/relationships',label:'People',     icon:'👥', perm:'relationships' },
  { to:'/memories',     label:'Memories',   icon:'💭', perm:'memories' },
  { to:'/notes',        label:'Notes',      icon:'📝', perm:'notes' },
  { to:'/links',        label:'Links',      icon:'🔗', always:true },
  { to:'/skills',       label:'Skills',     icon:'🚀', always:true },
];

function Layout() {
  const { user, logout } = useAuth();
  const isOwner = user?.role==='owner'||user?.role==='admin'||user?.isAdmin===true;
  const perms   = user?.permissions||{};
  const visible = NAV.filter(n=>n.always||isOwner||perms[n.perm]);

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div style={{color:'var(--cyan)'}}><PLMLogo/></div>
          <div>
            <div className="logo-text">Personal Life</div>
            <div className="logo-sub">Manager</div>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{isOwner?'👑 Owner':'👤 Guest'}</div>
          </div>
        </div>
        <div className="nav-links">
          {visible.map(n=>(
            <NavLink key={n.to} to={n.to} end={n.to==='/'}
              className={({isActive})=>isActive?'nav-item active':'nav-item'}>
              <span>{n.icon}</span>{n.label}
            </NavLink>
          ))}
          {isOwner&&(
            <NavLink to="/admin" className={({isActive})=>isActive?'nav-item active':'nav-item'}>
              <span>⚙️</span>Users
            </NavLink>
          )}
        </div>
        <button className="logout-btn" onClick={logout}>↩ Logout</button>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/"              element={<Dashboard/>}/>
          <Route path="/activities"    element={<Activities/>}/>
          <Route path="/analytics"     element={<Analytics/>}/>
          <Route path="/schedule"      element={<PG perm="schedule"><Scheduler/></PG>}/>
          <Route path="/health"        element={<PG perm="health"><Health/></PG>}/>
          <Route path="/expenses"      element={<PG perm="expenses"><Expenses/></PG>}/>
          <Route path="/relationships" element={<PG perm="relationships"><Relationships/></PG>}/>
          <Route path="/memories"      element={<PG perm="memories"><Memories/></PG>}/>
          <Route path="/notes"         element={<PG perm="notes"><Notes/></PG>}/>
          <Route path="/links"         element={<Links/>}/>
          <Route path="/skills"        element={<Skills/>}/>
          <Route path="/admin"         element={<Admin/>}/>
        </Routes>
      </main>
    </div>
  );
}

function PG({perm,children}){
  const{user}=useAuth();
  const isOwner=user?.role==='owner'||user?.role==='admin'||user?.isAdmin===true;
  if(isOwner)return children;
  if(!user?.permissions?.[perm])return(
    <div style={{padding:32}}><div className="card" style={{textAlign:'center',padding:48}}>
      <div style={{fontSize:32,marginBottom:12}}>🔒</div>
      <p style={{color:'var(--text2)',fontSize:14}}>No access.<br/><span style={{color:'var(--text3)',fontSize:12}}>Contact owner.</span></p>
    </div></div>
  );
  return children;
}

function PR({children}){
  const{user,loading}=useAuth();
  if(loading)return<div className="full-loader"/>;
  if(!user)return<Navigate to="/login"/>;
  return children;
}

function LG(){
  const{user,loading}=useAuth();
  if(loading)return<div className="full-loader"/>;
  if(user)return<Navigate to="/"/>;
  return<Login/>;
}

export default function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LG/>}/>
          <Route path="/*"     element={<PR><Layout/></PR>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}