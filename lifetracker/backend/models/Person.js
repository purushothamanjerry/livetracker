const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Basic info
  name: { type: String, required: true },
  photo: { type: String, default: '' }, // base64 or URL
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },

  // Relationship
  relationshipType: {
    type: String,
    enum: ['friend', 'classmate', 'teammate', 'colleague', 'crush', 'attracted', 'love', 'partner', 'family', 'teacher', 'mentor', 'roommate', 'unknown', 'other'],
    default: 'friend'
  },
  relationshipDynamic: {
    type: String,
    enum: ['mutual', 'one-side', 'boyfriend', 'girlfriend', 'ex', 'complicated', 'close-friend', 'best-friend', 'acquaintance', 'other'],
    default: 'mutual'
  },
  strength: {
    type: String,
    enum: ['close', 'good', 'neutral', 'distant', 'broken'],
    default: 'neutral'
  },

  // Physical description (feel-based, not exact)
  heightFeel: { type: String, enum: ['very-short', 'short', 'medium', 'tall', 'very-tall', ''], default: '' },
  weightFeel: { type: String, enum: ['very-slim', 'slim', 'medium', 'chubby', 'heavy', ''], default: '' },
  // For female
  hairType: { type: String, enum: ['short', 'medium', 'long', 'very-long', 'curly', 'wavy', ''], default: '' },
  beautyNote: { type: String, default: '' }, // e.g. "cute smile, dimples"

  // Character tags
  characterTags: [{ type: String }], // e.g. ['selfish', 'lovely', 'oversmart', 'kind']

  // Personality description
  personalityNote: { type: String, default: '' },

  // Important dates
  birthday: { type: String, default: '' }, // "MM-DD" for yearly reminder
  birthdayYear: { type: String, default: '' }, // optional full year
  anniversaryDate: { type: String, default: '' },
  metDate: { type: String, default: '' }, // when you first met

  // Contact tracking
  lastContacted: { type: Date, default: null },
  contactFrequencyDays: { type: Number, default: 30 }, // remind if not contacted in X days

  // Related people (link to other persons)
  relatedPeople: [{
    person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    relation: { type: String } // e.g. "best friend of", "sister of"
  }],

  // Status / current feeling about this person
  currentStatus: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Person', PersonSchema);
