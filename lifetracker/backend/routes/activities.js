const router = require('express').Router();
const ActivityLog = require('../models/ActivityLog');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/current', async (req, res) => {
  try {
    const current = await ActivityLog.findOne({ user: req.session.userId, endTime: null }).sort({ startTime: -1 });
    res.json({ current });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/start', async (req, res) => {
  try {
    const { activity, category, note } = req.body;
    const now = new Date();
    const current = await ActivityLog.findOne({ user: req.session.userId, endTime: null });
    if (current) {
      current.endTime = now;
      current.durationMinutes = Math.round((now - current.startTime) / 60000);
      await current.save();
    }
    const newLog = new ActivityLog({ user: req.session.userId, activity, category: category || 'General', startTime: now, note: note || '' });
    await newLog.save();
    res.json({ message: 'Activity started', log: newLog, previous: current });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/interrupt', async (req, res) => {
  try {
    const { activity, startTime, endTime, note } = req.body;
    const current = await ActivityLog.findOne({ user: req.session.userId, endTime: null });
    if (!current) return res.status(404).json({ message: 'No active activity' });
    const start = new Date(startTime), end = new Date(endTime);
    current.interruptions.push({ activity, startTime: start, endTime: end, durationMinutes: Math.round((end - start) / 60000), note: note || '' });
    await current.save();
    res.json({ message: 'Interruption added', log: current });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { start, end, date } = req.query;
    let query = { user: req.session.userId };
    if (date) query.date = date;
    else if (start && end) query.date = { $gte: start, $lte: end };
    else query.date = new Date().toISOString().split('T')[0];
    const logs = await ActivityLog.find(query).sort({ startTime: 1 });
    res.json({ logs });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = { user: req.session.userId, endTime: { $ne: null } };
    if (start && end) query.date = { $gte: start, $lte: end };
    const logs = await ActivityLog.find(query);
    const summary = {};
    logs.forEach(log => {
      if (!summary[log.activity]) summary[log.activity] = { totalMinutes: 0, count: 0, category: log.category };
      summary[log.activity].totalMinutes += log.durationMinutes;
      summary[log.activity].count += 1;
    });
    res.json({ summary, totalLogs: logs.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const log = await ActivityLog.findOneAndUpdate({ _id: req.params.id, user: req.session.userId }, req.body, { new: true });
    if (!log) return res.status(404).json({ message: 'Not found' });
    res.json({ log });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await ActivityLog.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
