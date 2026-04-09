const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  name:     { type: String, required:true },
  category: { type: String, default:'Other' },
  level:    { type: String, enum:['beginner','learning','intermediate','advanced','expert'], default:'beginner' },
  progress: { type: Number, default:10, min:0, max:100 },
  target:   { type: String, default:'' },
  note:     { type: String, default:'' },
  createdAt:{ type: Date, default: Date.now }
});

const GoalSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  title:      { type: String, required:true },
  description:{ type: String, default:'' },
  deadline:   { type: String, default:'' },
  category:   { type: String, default:'' },
  completed:  { type: Boolean, default:false },
  milestones: [{ text: String, done: { type:Boolean, default:false } }],
  createdAt:  { type: Date, default: Date.now }
});

const RoadmapSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  title:      { type: String, required:true },
  description:{ type: String, default:'' },
  steps:      [{ text: String, note: String, done: { type:Boolean, default:false } }],
  createdAt:  { type: Date, default: Date.now }
});

module.exports = {
  Skill:   mongoose.model('Skill',   SkillSchema),
  Goal:    mongoose.model('Goal',    GoalSchema),
  Roadmap: mongoose.model('Roadmap', RoadmapSchema),
};
