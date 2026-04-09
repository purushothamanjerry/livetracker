// models/Link.js
const mongoose = require('mongoose');
const LinkSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  title:    { type: String, default:'' },
  url:      { type: String, required:true },
  category: { type: String, default:'Other' },
  note:     { type: String, default:'' },
  tags:     [{ type: String }],
  createdAt:{ type: Date, default: Date.now }
});
module.exports = mongoose.model('Link', LinkSchema);
