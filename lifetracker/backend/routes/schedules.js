const router = require('express').Router();
const { Schedule } = require('../models/OtherModels');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Get schedules for a date range (default: today + next 7 days)
router.get('/', async (req, res) => {
  try {
    const { start, end, date } = req.query;
    let query = { user: req.session.userId };
    if (date) query.date = date;
    else if (start && end) query.date = { $gte: start, $lte: end };
    else {
      const today = new Date().toISOString().split('T')[0];
      query.date = { $gte: today };
    }
    const schedules = await Schedule.find(query).sort({ date: 1, time: 1 });
    res.json({ schedules });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const task = await Schedule.create({ user: req.session.userId, ...req.body });
    res.json({ task });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await Schedule.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { ...req.body, ...(req.body.completed ? { completedAt: new Date() } : {}) },
      { new: true }
    );
    res.json({ task });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Schedule.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
