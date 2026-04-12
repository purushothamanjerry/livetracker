const router = require('express').Router();
const Person = require('../models/Person');
const { Memory, PersonNote } = require('../models/RelationshipModels');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Get all people
router.get('/', async (req, res) => {
  try {
    const people = await Person.find({ user: req.session.userId }).sort({ name: 1 });
    res.json({ people });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single person with notes + memories
router.get('/:id', async (req, res) => {
  try {
    const person = await Person.findOne({ _id: req.params.id, user: req.session.userId });
    if (!person) return res.status(404).json({ message: 'Not found' });
    const notes = await PersonNote.find({ person: req.params.id, user: req.session.userId })
      .populate('mentionedPeople', 'name photo').sort({ date: -1 });
    const memories = await Memory.find({ mentionedPeople: req.params.id, user: req.session.userId })
      .populate('mentionedPeople', 'name photo').sort({ date: -1 });
    res.json({ person, notes, memories });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create person
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, user: req.session.userId };
    if (data.bondStatus) {
      data.bondHistory = [{ status: data.bondStatus, note: 'Initial status', date: new Date() }];
    }
    const person = await Person.create(data);
    res.json({ person });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update person
router.put('/:id', async (req, res) => {
  try {
    const existing = await Person.findOne({ _id: req.params.id, user: req.session.userId });
    if (!existing) return res.status(404).json({ message: 'Not found' });
    // Track bond status changes
    if (req.body.bondStatus && req.body.bondStatus !== existing.bondStatus) {
      req.body.bondHistory = [...(existing.bondHistory || []), {
        status: req.body.bondStatus,
        note: req.body.bondNote || '',
        date: new Date()
      }];
    }
    delete req.body.bondNote;
    const person = await Person.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json({ person });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await Person.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    await PersonNote.deleteMany({ person: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add note/conversation
router.post('/:id/notes', async (req, res) => {
  try {
    const note = await PersonNote.create({ user: req.session.userId, person: req.params.id, ...req.body });
    await Person.findByIdAndUpdate(req.params.id, { lastContacted: new Date() });
    const populated = await note.populate('mentionedPeople', 'name photo');
    res.json({ note: populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/notes/:noteId', async (req, res) => {
  try {
    await PersonNote.findOneAndDelete({ _id: req.params.noteId, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Memories
router.get('/memories/all', async (req, res) => {
  try {
    const memories = await Memory.find({ user: req.session.userId })
      .populate('mentionedPeople', 'name photo').sort({ date: -1 });
    res.json({ memories });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/memories/add', async (req, res) => {
  try {
    const memory = await Memory.create({ user: req.session.userId, ...req.body });
    const populated = await memory.populate('mentionedPeople', 'name photo');
    res.json({ memory: populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/memories/:id', async (req, res) => {
  try {
    await Memory.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Upcoming birthdays
router.get('/birthdays/upcoming', async (req, res) => {
  try {
    const people = await Person.find({ user: req.session.userId, dob: { $ne: '' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // 🔥 FIX

    const upcoming = [];

    people.forEach(p => {
      if (!p.dob) return;

      const dobParts = p.dob.split('-');
      if (dobParts.length < 2) return;

      const month = parseInt(dobParts[1]) - 1;
      const day = parseInt(dobParts[2]);

      const thisYear = new Date(today.getFullYear(), month, day);
      const nextYear = new Date(today.getFullYear() + 1, month, day);

      thisYear.setHours(0,0,0,0);  // 🔥 FIX
      nextYear.setHours(0,0,0,0);  // 🔥 FIX

      const target = thisYear >= today ? thisYear : nextYear;

      const daysUntil = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 30) {
        upcoming.push({
          person: p,
          daysUntil,
          date: target.toISOString().split('T')[0]
        });
      }
    });

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({ upcoming });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
