const mongoose = require('mongoose');

// Health tracking
const HealthEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  weight: { type: Number }, // kg
  height: { type: Number }, // cm - rarely changes
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Schedule / Tasks
const ScheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  time: { type: String }, // "HH:MM" optional
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Daily Notes / Journal
const DailyNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  content: { type: String, required: true },
  tags: [{ type: String }], // e.g. ["productive", "tired", "happy"]
  mood: { type: String, enum: ['great', 'good', 'okay', 'bad', 'terrible'], default: 'okay' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  HealthEntry: mongoose.model('HealthEntry', HealthEntrySchema),
  Schedule: mongoose.model('Schedule', ScheduleSchema),
  DailyNote: mongoose.model('DailyNote', DailyNoteSchema)
};
