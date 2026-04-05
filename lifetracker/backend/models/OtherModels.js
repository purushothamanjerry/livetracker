const mongoose = require('mongoose');

const HealthEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  weight: { type: Number },
  height: { type: Number },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const ScheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const DailyNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  mood: { type: String, enum: ['great', 'good', 'okay', 'bad', 'terrible'], default: 'okay' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  HealthEntry: mongoose.model('HealthEntry', HealthEntrySchema),
  Schedule: mongoose.model('Schedule', ScheduleSchema),
  DailyNote: mongoose.model('DailyNote', DailyNoteSchema)
};
