const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  place: { type: String, default: '' },
  emotion: { type: String, default: 'joyful' },
  tags: [{ type: String }],
  isFavorite: { type: Boolean, default: false },
  peopleInvolved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  photos: [{ type: String }], // base64 or URLs
  coverPhoto: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Memory', MemorySchema);
