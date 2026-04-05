const router = require('express').Router();
const Expense = require('../models/Expense');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Get expenses with filters
router.get('/', async (req, res) => {
  try {
    const { start, end, date, category } = req.query;
    let query = { user: req.session.userId };
    if (date) query.date = date;
    else if (start && end) query.date = { $gte: start, $lte: end };
    if (category) query.category = category;

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ expenses, total });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get last purchase of a specific item
router.get('/last-item', async (req, res) => {
  try {
    const { itemName } = req.query;
    const regex = new RegExp(itemName, 'i');
    const last = await Expense.findOne({
      user: req.session.userId,
      itemName: regex
    }).sort({ date: -1 });
    res.json({ last });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Monthly summary
router.get('/summary', async (req, res) => {
  try {
    const { year, month } = req.query;
    const start = `${year}-${month.padStart(2,'0')}-01`;
    const end = `${year}-${month.padStart(2,'0')}-31`;

    const expenses = await Expense.find({
      user: req.session.userId,
      date: { $gte: start, $lte: end }
    });

    // Group by category
    const byCategory = {};
    const byPayment = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      byPayment[e.paymentMethod] = (byPayment[e.paymentMethod] || 0) + e.amount;
    });

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ byCategory, byPayment, total, count: expenses.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add expense
router.post('/', async (req, res) => {
  try {
    const expense = await Expense.create({ user: req.session.userId, ...req.body });
    res.json({ expense });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      req.body, { new: true }
    );
    res.json({ expense });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
