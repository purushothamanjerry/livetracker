import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { format, differenceInDays, differenceInYears, differenceInMonths } from 'date-fns';

// ---- CONSTANTS ----
const REL_TYPES = [
  { key: 'love', emoji: '❤️', label: 'Love', sub: 'Romantic partner' },
  { key: 'crush', emoji: '🌸', label: 'Crush', sub: 'Have feelings for' },
  { key: 'attracted', emoji: '✨', label: 'Attracted To', sub: 'Physically drawn to' },
  { key: 'impressed', emoji: '🌟', label: 'Impressed By', sub: 'Deeply admire' },
  { key: 'friend', emoji: '👫', label: 'Friend', sub: 'Close friend' },
  { key: 'family', emoji: '👨‍👩‍👧', label: 'Family', sub: 'Family member' },
  { key: 'colleague', emoji: '💼', label: 'Colleague', sub: 'Work relationship' },
  { key: 'classmate', emoji: '🎒', label: 'Classmate', sub: 'School / college' },
  { key: 'teacher', emoji: '👨‍🏫', label: 'Teacher', sub: 'Mentor / educator' },
  { key: 'acquaintance', emoji: '🤝', label: 'Acquaintance', sub: 'Know casually' },
  { key: 'roommate', emoji: '🏠', label: 'Roommate', sub: 'Live together' },
  { key: 'other', emoji: '👤', label: 'Other', sub: '' },
];

const BOND_STATUSES = [
  { key: 'close', emoji: '💚', label: 'Close', sub: 'Talk regularly' },
  { key: 'good', emoji: '🙂', label: 'Good', sub: 'Occasional contact' },
  { key: 'drifting', emoji: '🌊', label: 'Drifting', sub: 'Slowly losing touch' },
  { key: 'distant', emoji: '🔵', label: 'Distant', sub: 'Rarely talk anymore' },
  { key: 'not-talking', emoji: '🚫', label: 'Not Talking', sub: 'Not speaking now' },
  { key: 'complicated', emoji: '🌀', label: 'Complicated', sub: "It's complicated" },
  { key: 'rekindled', emoji: '🔥', label: 'Rekindled', sub: 'Recently reconnected' },
  { key: 'lost-touch', emoji: '👻', label: 'Lost Touch', sub: 'Completely lost touch' },
  { key: 'ended', emoji: '📵', label: 'Ended', sub: 'Relationship ended' },
];

const HEIGHT_OPTIONS = ['very-short','short','average','tall','very-tall'];
const BODY_OPTIONS = ['slim','lean','athletic','average','curvy','heavyset'];
const HAIR_OPTIONS = ['bald','very-short','short','medium','long','very-long'];
const CHARACTER_TAGS = ['kind','selfish','lovely','oversmart','funny','serious','caring','rude','shy','confident','loyal','creative','lazy','hardworking','sensitive','bold','quiet','talkative','honest','fake','jealous','supportive','mysterious','cheerful','dramatic','humble','proud','generous','introvert','extrovert'];

const BOND_COLOR = {
  close: '#4ade80', good: '#fbbf24', drifting: '#fb923c',
  distant: '#60a5fa', 'not-talking': '#f87171', complicated: '#a78bfa',
  rekindled: '#f97316', 'lost-touch': '#ec4899', ended: '#64748b'
};

const REL_COLOR = {
  love: '#f87171', crush: '#f472b6', attracted: '#fb923c',
  impressed: '#fbbf24', friend: '#4ade80', family: '#60a5fa',
  colleague: '#a78bfa', classmate: '#22d3ee', teacher: '#34d399',
  acquaintance: '#94a3b8', roommate: '#f59e0b', other: '#64748b'
};

function getAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  return differenceInYears(new Date(), birth);
}

function getKnownFor(metDate) {
  if (!metDate) return null;
  const met = new Date(metDate);
  const years = differenceInYears(new Date(), met);
  const months = differenceInMonths(new Date(), met) % 12;
  if (years > 0) return `${years}y ${months}m`;
  return `${months}m`;
}

function getDaysSince(date) {
  if (!date) return null;
  return differenceInDays(new Date(), new Date(date));
}

function getBirthdayInfo(dob) {
  if (!dob) return null;
  const today = new Date();
  const parts = dob.split('-');
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  const thisYear = new Date(today.getFullYear(), month, day);
  const target = thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, month, day);
  const days = differenceInDays(target, today);
  const monthName = target.toLocaleString('default', { month: 'short' });
  return { days, label: `${monthName} ${day}`, isToday: days === 0 };
}

// ---- MULTI-STEP FORM ----
const emptyForm = {
  name: '', gender: 'male', photo: '', dob: '', dobApprox: false,
  relationshipType: 'acquaintance', bondStatus: 'good', bondNote: '',
  whereMet: '', metDate: '', howWeMet: '',
  mobile: '', instagram: '',
  heightFeel: '', bodyType: '', hairLength: '',
  characterTags: [], privateNotes: '', isSpecial: false,
};

function MultiStepForm({ initial, onSave, onCancel, isEdit }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial || emptyForm);
  const fileRef = useRef();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleTag = (tag) => {
    const tags = form.characterTags.includes(tag)
      ? form.characterTags.filter(t => t !== tag)
      : [...form.characterTags, tag];
    set('characterTags', tags);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('photo', reader.result);
    reader.readAsDataURL(file);
  };

  const age = getAge(form.dob);

  const stepTitles = ['IDENTITY', 'BOND', 'CONTACT', 'CHARACTER', 'DONE'];

  return (
    <div className="msf-overlay" onClick={onCancel}>
      <div className="msf-modal" onClick={e => e.stopPropagation()}>
        <div className="msf-header">
          <h2>{isEdit ? 'Edit Profile' : 'Add Person'}</h2>
          <button className="msf-close" onClick={onCancel}>✕</button>
        </div>

        {/* Step indicators */}
        <div className="msf-steps">
          {[1,2,3,4,5].map(s => (
            <React.Fragment key={s}>
              <div className={`msf-step ${step === s ? 'current' : step > s ? 'done' : ''}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 5 && <div className={`msf-step-line ${step > s ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
          <span className="msf-step-label">{stepTitles[step-1]}</span>
        </div>

        <div className="msf-body">

          {/* STEP 1: Identity */}
          {step === 1 && (
            <div className="msf-step-content">
              {/* Photo */}
              <div className="msf-photo-area" onClick={() => fileRef.current.click()}>
                {form.photo
                  ? <img src={form.photo} alt="" className="msf-photo-preview" />
                  : <div className="msf-photo-placeholder">📷<br/><span>Click to upload</span></div>}
                {form.photo && <div className="msf-photo-label">Click to upload · auto crop to circle</div>}
                {age && <span className="msf-age-badge">Age: {age}</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }} />

              <label className="msf-label">FULL NAME *</label>
              <input className="msf-input" placeholder="Full name" value={form.name}
                onChange={e => set('name', e.target.value)} required />

              <div className="msf-row">
                <div className="msf-col">
                  <label className="msf-label">GENDER</label>
                  <select className="msf-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="msf-col">
                  <label className="msf-label">AGE / DATE OF BIRTH</label>
                  <div className="msf-dob-tabs">
                    <button type="button" className={!form.dobApprox ? 'active' : ''} onClick={() => set('dobApprox', false)}>🎂 DOB</button>
                    <button type="button" className={form.dobApprox ? 'active' : ''} onClick={() => set('dobApprox', true)}>~ Approx</button>
                  </div>
                  <input className="msf-input" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                  {age !== null && <div className="msf-age-note">→ Age: {age}</div>}
                </div>
              </div>

              <label className="msf-label">HOW DO YOU SEE THEM?</label>
              <div className="msf-type-grid">
                {REL_TYPES.map(r => (
                  <button key={r.key} type="button"
                    className={`msf-type-btn ${form.relationshipType === r.key ? 'active' : ''}`}
                    style={form.relationshipType === r.key ? { borderColor: REL_COLOR[r.key], background: REL_COLOR[r.key] + '22' } : {}}
                    onClick={() => set('relationshipType', r.key)}>
                    <span className="msf-type-emoji">{r.emoji}</span>
                    <span className="msf-type-label">{r.label}</span>
                    {r.sub && <span className="msf-type-sub">{r.sub}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Bond */}
          {step === 2 && (
            <div className="msf-step-content">
              <label className="msf-label">HOW WOULD YOU DESCRIBE THIS RIGHT NOW?</label>
              <div className="msf-bond-grid">
                {BOND_STATUSES.map(b => (
                  <button key={b.key} type="button"
                    className={`msf-bond-btn ${form.bondStatus === b.key ? 'active' : ''}`}
                    style={form.bondStatus === b.key ? { borderColor: BOND_COLOR[b.key], background: BOND_COLOR[b.key] + '22' } : {}}
                    onClick={() => set('bondStatus', b.key)}>
                    <span>{b.emoji}</span>
                    <span className="msf-bond-label">{b.label}</span>
                    <span className="msf-bond-sub">{b.sub}</span>
                  </button>
                ))}
              </div>

              <label className="msf-label">NOTE ABOUT STATUS CHANGE</label>
              <input className="msf-input" placeholder="Why did it change? (optional)"
                value={form.bondNote || ''} onChange={e => set('bondNote', e.target.value)} />

              <div className="msf-row">
                <div className="msf-col">
                  <label className="msf-label">WHERE YOU MET</label>
                  <input className="msf-input" placeholder="College, Work, Online..."
                    value={form.whereMet} onChange={e => set('whereMet', e.target.value)} />
                </div>
                <div className="msf-col">
                  <label className="msf-label">DATE FIRST MET</label>
                  <input className="msf-input" type="date" value={form.metDate}
                    onChange={e => set('metDate', e.target.value)} />
                </div>
              </div>

              <label className="msf-label">STORY OF HOW YOU MET</label>
              <textarea className="msf-input msf-textarea" placeholder="How did you first meet?"
                value={form.howWeMet} onChange={e => set('howWeMet', e.target.value)} rows={3} />
            </div>
          )}

          {/* STEP 3: Contact */}
          {step === 3 && (
            <div className="msf-step-content">
              <p className="msf-sub">Add their contact info.</p>
              <div className="msf-row">
                <div className="msf-col">
                  <label className="msf-label">📱 MOBILE NUMBER</label>
                  <input className="msf-input" placeholder="Mobile number"
                    value={form.mobile} onChange={e => set('mobile', e.target.value)} />
                </div>
                <div className="msf-col">
                  <label className="msf-label">📸 INSTAGRAM</label>
                  <div className="msf-insta-wrap">
                    <span className="msf-at">@</span>
                    <input className="msf-input msf-insta" placeholder="username"
                      value={form.instagram} onChange={e => set('instagram', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Character */}
          {step === 4 && (
            <div className="msf-step-content">
              <div className="msf-appearance-section">
                <div className="msf-app-title">💎 APPEARANCE</div>

                <div className="msf-app-label">📏 HEIGHT</div>
                <div className="msf-chip-row">
                  {HEIGHT_OPTIONS.map(h => (
                    <button key={h} type="button"
                      className={`msf-chip ${form.heightFeel === h ? 'active' : ''}`}
                      onClick={() => set('heightFeel', form.heightFeel === h ? '' : h)}>
                      {h.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                <div className="msf-app-label">🏃 BODY TYPE</div>
                <div className="msf-chip-row">
                  {BODY_OPTIONS.map(b => (
                    <button key={b} type="button"
                      className={`msf-chip ${form.bodyType === b ? 'active' : ''}`}
                      onClick={() => set('bodyType', form.bodyType === b ? '' : b)}>
                      {b}
                    </button>
                  ))}
                </div>

                <div className="msf-app-label">💇 HAIR LENGTH</div>
                <div className="msf-chip-row">
                  {HAIR_OPTIONS.map(h => (
                    <button key={h} type="button"
                      className={`msf-chip ${form.hairLength === h ? 'active' : ''}`}
                      onClick={() => set('hairLength', form.hairLength === h ? '' : h)}>
                      {h.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="msf-app-label" style={{ marginTop: 16 }}>✨ CHARACTER TAGS</div>
              <div className="msf-tags-grid">
                {CHARACTER_TAGS.map(tag => (
                  <button key={tag} type="button"
                    className={`msf-tag-btn ${form.characterTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Done */}
          {step === 5 && (
            <div className="msf-step-content">
              <button type="button"
                className={`msf-special-btn ${form.isSpecial ? 'active' : ''}`}
                onClick={() => set('isSpecial', !form.isSpecial)}>
                <span>⭐</span>
                <div>
                  <div className="msf-special-title">Mark as Special</div>
                  <div className="msf-special-sub">Shows in the Special strip on the Relationships page</div>
                </div>
              </button>

              <label className="msf-label">🔒 PRIVATE NOTES</label>
              <textarea className="msf-input msf-textarea" placeholder="Your private thoughts about this person..."
                value={form.privateNotes} onChange={e => set('privateNotes', e.target.value)} rows={4} />

              <div className="msf-summary">
                {[
                  ['Name', form.name],
                  ['Type', REL_TYPES.find(r => r.key === form.relationshipType)?.emoji + ' ' + form.relationshipType],
                  ['Status', BOND_STATUSES.find(b => b.key === form.bondStatus)?.emoji + ' ' + form.bondStatus],
                  ['Mobile', form.mobile],
                  ['Instagram', form.instagram ? '@' + form.instagram : ''],
                ].filter(([,v]) => v).map(([k, v]) => (
                  <div key={k} className="msf-summary-row">
                    <span className="msf-summary-key">{k}</span>
                    <span className="msf-summary-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="msf-footer">
          {step > 1
            ? <button className="msf-back" onClick={() => setStep(s => s - 1)}>← Back</button>
            : <div />}
          {step < 5
            ? <button className="msf-next" onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !form.name}>
                Continue →
              </button>
            : <button className="msf-save" onClick={() => onSave(form)}>
                ✓ Save Changes
              </button>}
        </div>
      </div>
    </div>
  );
}

export { MultiStepForm, REL_TYPES, BOND_STATUSES, BOND_COLOR, REL_COLOR, getAge, getKnownFor, getDaysSince, getBirthdayInfo, CHARACTER_TAGS };
