const router = require('express').Router();
const { DailyNote } = require('../models/OtherModels');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { start, end, date } = req.query;
    let query = { user: req.session.userId };
    if (date) query.date = date;
    else if (start && end) query.date = { $gte: start, $lte: end };
    const notes = await DailyNote.find(query).sort({ date: -1 });
    res.json({ notes });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { date, content, tags, mood } = req.body;
    let note = await DailyNote.findOne({ user: req.session.userId, date });
    if (note) {
      Object.assign(note, { content, tags, mood, updatedAt: new Date() });
      await note.save();
    } else {
      note = await DailyNote.create({ user: req.session.userId, date, content, tags, mood });
    }
    res.json({ note });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await DailyNote.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
