const mongoose = require('mongoose');

// Flexible schema that handles both old format (content/category/mood/mentionedPeople)
// and new format (description/emotion/peopleInvolved)
const MemorySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  // Support both 'description' (new) and 'content' (old local app)
  description: { type: String, default: '' },
  content:     { type: String, default: '' },
  date:        { type: mongoose.Schema.Types.Mixed }, // string or Date
  place:       { type: String, default: '' },
  // Support both 'emotion' (new) and 'mood'/'category' (old)
  emotion:     { type: String, default: 'joyful' },
  mood:        { type: String, default: '' },
  category:    { type: String, default: '' },
  tags:        [{ type: String }],
  isFavorite:  { type: Boolean, default: false },
  // Support both 'peopleInvolved' (new) and 'mentionedPeople' (old)
  peopleInvolved:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  mentionedPeople: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  photos:      [{ type: String }],
  coverPhoto:  { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
}, { strict: false }); // strict:false allows old fields to pass through

module.exports = mongoose.model('Memory', MemorySchema);