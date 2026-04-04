// routes/health.js
const router = require('express').Router();
const { HealthEntry } = require('../models/OtherModels');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const entries = await HealthEntry.find({ user: req.session.userId }).sort({ date: -1 }).limit(52);
    res.json({ entries });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { date, weight, height, notes } = req.body;
    let entry = await HealthEntry.findOne({ user: req.session.userId, date });
    if (entry) {
      Object.assign(entry, { weight, height, notes });
      await entry.save();
    } else {
      entry = await HealthEntry.create({ user: req.session.userId, date, weight, height, notes });
    }
    res.json({ entry });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
