const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['owner', 'guest'], default: 'guest' },
  status: { type: String, enum: ['pending', 'active', 'blocked', 'rejected'], default: 'pending' },
  requestMessage: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  approvedAt:  { type: Date },
  blockedAt:   { type: Date },
  blockedReason: { type: String, default: '' },
  permissions: {
    activities:    { type: Boolean, default: true  },
    health:        { type: Boolean, default: true  },
    expenses:      { type: Boolean, default: true  },
    notes:         { type: Boolean, default: true  },
    schedule:      { type: Boolean, default: true  },
    relationships: { type: Boolean, default: false },
    memories:      { type: Boolean, default: false },
  },
  avatarColor: { type: String, default: '#22d3ee' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);
