const mongoose = require('mongoose');

// Each ActivityLog is one continuous block of a single activity
const ActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: String, required: true }, // e.g. "Sleep", "Study", "Travel"
  category: { type: String, default: 'General' }, // Sleep, Productive, Personal, Health, Leisure
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null }, // null means currently active
  durationMinutes: { type: Number, default: 0 },
  note: { type: String, default: '' },
  // For interruptions: sub-activities within this block
  interruptions: [{
    activity: String,
    startTime: Date,
    endTime: Date,
    durationMinutes: Number,
    note: String
  }],
  date: { type: String }, // "YYYY-MM-DD" for easy querying
  createdAt: { type: Date, default: Date.now }
});

// Auto-compute durationMinutes before save
ActivityLogSchema.pre('save', function(next) {
  if (this.endTime) {
    this.durationMinutes = Math.round((this.endTime - this.startTime) / 60000);
  }
  if (this.startTime) {
    this.date = this.startTime.toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
