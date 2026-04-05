const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  itemName: { type: String, required: true }, // e.g. "Soap", "Auto ride"
  amount: { type: Number, required: true }, // in INR
  category: {
    type: String,
    enum: ['Food', 'Travel', 'Personal Care', 'Health', 'Education', 'Entertainment', 'Shopping', 'Utilities', 'Rent', 'Investment', 'Other'],
    default: 'Other'
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Other'],
    default: 'UPI'
  },
  note: { type: String, default: '' },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  time: { type: String, default: '' }, // "HH:MM"

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
