const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  photo: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  dob: { type: String, default: '' },
  dobApprox: { type: Boolean, default: false },
  isSpecial: { type: Boolean, default: false },
  relationshipType: {
    type: String,
    enum: ['love','crush','attracted','impressed','friend','family','colleague','classmate','teacher','acquaintance','roommate','other'],
    default: 'acquaintance'
  },
  bondStatus: {
    type: String,
    enum: ['close','good','drifting','distant','not-talking','complicated','rekindled','lost-touch','ended'],
    default: 'good'
  },
  bondHistory: [{
    status: String,
    note: String,
    date: { type: Date, default: Date.now }
  }],
  whereMet: { type: String, default: '' },
  metDate: { type: String, default: '' },
  howWeMet: { type: String, default: '' },
  mobile: { type: String, default: '' },
  instagram: { type: String, default: '' },
  heightFeel: { type: String, enum: ['very-short','short','average','tall','very-tall',''], default: '' },
  bodyType: { type: String, enum: ['slim','lean','athletic','average','curvy','heavyset',''], default: '' },
  hairLength: { type: String, enum: ['bald','very-short','short','medium','long','very-long',''], default: '' },
  characterTags: [{ type: String }],
  privateNotes: { type: String, default: '' },
  lastContacted: { type: Date, default: null },
  contactFrequencyDays: { type: Number, default: 30 },
  gallery: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Person', PersonSchema);
