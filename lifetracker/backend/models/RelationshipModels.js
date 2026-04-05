const mongoose = require('mongoose');

// A memory - can mention multiple people
const MemorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  category: { type: String, default: 'General' }, // Happy, Sad, Funny, Lesson, etc.
  mentionedPeople: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  tags: [{ type: String }],
  mood: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// A note/log specific to a person - feelings, conversations, events
const PersonNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['conversation', 'feeling', 'event', 'thought', 'conflict', 'good-moment', 'other'],
    default: 'thought'
  },
  mentionedPeople: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  date: { type: String, required: true }, // "YYYY-MM-DD"
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Memory: mongoose.model('Memory', MemorySchema),
  PersonNote: mongoose.model('PersonNote', PersonNoteSchema)
};
