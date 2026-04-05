const router = require('express').Router();
const Person = require('../models/Person');
const { Memory, PersonNote } = require('../models/RelationshipModels');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// ---- PEOPLE ----

// Get all people
router.get('/', async (req, res) => {
  try {
    const people = await Person.find({ user: req.session.userId })
      .sort({ name: 1 });
    res.json({ people });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single person with notes
router.get('/:id', async (req, res) => {
  try {
    const person = await Person.findOne({ _id: req.params.id, user: req.session.userId })
      .populate('relatedPeople.person', 'name photo relationshipType');
    if (!person) return res.status(404).json({ message: 'Not found' });

    const notes = await PersonNote.find({ person: req.params.id, user: req.session.userId })
      .populate('mentionedPeople', 'name photo')
      .sort({ date: -1 });

    const memories = await Memory.find({
      mentionedPeople: req.params.id,
      user: req.session.userId
    }).sort({ date: -1 });

    res.json({ person, notes, memories });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create person
router.post('/', async (req, res) => {
  try {
    const person = await Person.create({ user: req.session.userId, ...req.body });
    res.json({ person });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update person
router.put('/:id', async (req, res) => {
  try {
    const person = await Person.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json({ person });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete person
router.delete('/:id', async (req, res) => {
  try {
    await Person.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    await PersonNote.deleteMany({ person: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ---- PERSON NOTES ----

// Add note to person
router.post('/:id/notes', async (req, res) => {
  try {
    const note = await PersonNote.create({
      user: req.session.userId,
      person: req.params.id,
      ...req.body
    });
    // Update last contacted
    await Person.findByIdAndUpdate(req.params.id, { lastContacted: new Date() });
    const populated = await note.populate('mentionedPeople', 'name photo');
    res.json({ note: populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete note
router.delete('/notes/:noteId', async (req, res) => {
  try {
    await PersonNote.findOneAndDelete({ _id: req.params.noteId, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ---- MEMORIES ----

// Get all memories
router.get('/memories/all', async (req, res) => {
  try {
    const memories = await Memory.find({ user: req.session.userId })
      .populate('mentionedPeople', 'name photo')
      .sort({ date: -1 });
    res.json({ memories });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add memory
router.post('/memories/add', async (req, res) => {
  try {
    const memory = await Memory.create({ user: req.session.userId, ...req.body });
    const populated = await memory.populate('mentionedPeople', 'name photo');
    res.json({ memory: populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete memory
router.delete('/memories/:id', async (req, res) => {
  try {
    await Memory.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get upcoming birthdays (next 30 days)
router.get('/birthdays/upcoming', async (req, res) => {
  try {
    const people = await Person.find({ user: req.session.userId, birthday: { $ne: '' } });
    const today = new Date();
    const upcoming = [];

    people.forEach(p => {
      if (!p.birthday) return;
      const [month, day] = p.birthday.split('-').map(Number);
      const thisYear = new Date(today.getFullYear(), month - 1, day);
      const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
      const target = thisYear >= today ? thisYear : nextYear;
      const daysUntil = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 30) {
        upcoming.push({ person: p, daysUntil, date: target.toISOString().split('T')[0] });
      }
    });

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    res.json({ upcoming });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
