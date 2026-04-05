const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: String, required: true },
  category: { type: String, default: 'General' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: 0 },
  note: { type: String, default: '' },
  interruptions: [{
    activity: String,
    startTime: Date,
    endTime: Date,
    durationMinutes: Number,
    note: String
  }],
  date: { type: String },
  createdAt: { type: Date, default: Date.now }
});

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
