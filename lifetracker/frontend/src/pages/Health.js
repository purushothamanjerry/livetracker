import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import { format } from 'date-fns';

export default function Health() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ date:format(new Date(),'yyyy-MM-dd'), weight:'', height:'', notes:'' });
  const [saved, setSaved] = useState(false);

  const fetchEntries = async () => { const res = await api.get('/api/health'); setEntries(res.data.entries.reverse()); };
  useEffect(() => { fetchEntries(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await api.post('/api/health', form);
    setSaved(true); setTimeout(()=>setSaved(false),2000); fetchEntries();
  };

  const latestHeight = entries.find(e=>e.height)?.height;
  const latestWeight = entries[entries.length-1]?.weight;
  const bmi = latestHeight && latestWeight ? (latestWeight/((latestHeight/100)**2)).toFixed(1) : null;
  const bmiCategory = bmi ? bmi<18.5?'Underweight':bmi<25?'Normal':bmi<30?'Overweight':'Obese' : null;
  const chartData = entries.filter(e=>e.weight).map(e=>({ date:e.date.slice(5), weight:e.weight }));

  return (
    <div className="health-page">
      <div className="card">
        <div className="card-label">LOG HEALTH DATA</div>
        <form onSubmit={handleSave} className="health-form">
          <div className="form-row">
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div className="form-group"><label>Weight (kg)</label><input type="number" step="0.1" placeholder="e.g. 70.5" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})}/></div>
            <div className="form-group"><label>Height (cm)</label><input type="number" placeholder="e.g. 170" value={form.height} onChange={e=>setForm({...form,height:e.target.value})}/></div>
          </div>
          <input placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          <button type="submit">{saved?'✓ Saved!':'Save Entry'}</button>
        </form>
      </div>
      {bmi && (
        <div className="bmi-card card">
          <div className="bmi-val">{bmi}</div>
          <div className="bmi-cat">{bmiCategory}</div>
          <div className="bmi-info">{latestWeight}kg · {latestHeight}cm</div>
        </div>
      )}
      {chartData.length > 1 && (
        <div className="card">
          <div className="card-label">WEIGHT TREND</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
              <XAxis dataKey="date"/><YAxis domain={['dataMin - 2','dataMax + 2']} unit="kg"/>
              <Tooltip formatter={v=>`${v}kg`}/>
              <Line type="monotone" dataKey="weight" stroke="#4ade80" strokeWidth={2} dot={{fill:'#4ade80'}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="card">
        <div className="card-label">HISTORY</div>
        <div className="health-history">
          {entries.map((entry,i)=>{
            const prev=entries[i+1]; const diff=prev?.weight&&entry.weight?(entry.weight-prev.weight).toFixed(1):null;
            return (
              <div key={entry._id} className="health-row">
                <span className="health-date">{entry.date}</span>
                <span className="health-weight">{entry.weight?`${entry.weight} kg`:'—'}</span>
                {diff&&<span className={`health-diff ${diff>0?'up':'down'}`}>{diff>0?`+${diff}`:diff}</span>}
                {entry.notes&&<span className="health-note">{entry.notes}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
