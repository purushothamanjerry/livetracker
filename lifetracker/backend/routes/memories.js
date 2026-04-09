const router = require('express').Router();
const Memory = require('../models/Memory');
const Person = require('../models/Person');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Helper: resolve @mentions in text to Person IDs
async function resolveMentions(text = '', userId) {
  const names = [...new Set(
    (text.match(/@([A-Za-z][A-Za-z0-9 ]{1,39})/g) || []).map(m => m.slice(1).trim())
  )];
  const ids = [];
  for (const name of names) {
    const person = await Person.findOne({ user: userId, name: new RegExp(`^${name}$`, 'i') });
    if (person) ids.push(person._id.toString());
  }
  return ids;
}

// GET all memories with filters
router.get('/', async (req, res) => {
  try {
    const { search, tag, emotion, person, year, favorite } = req.query;
    const query = { user: req.session.userId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { place: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    if (tag)      query.tags = tag;
    if (emotion)  query.emotion = emotion;
    if (favorite) query.isFavorite = true;
    if (person)   query.peopleInvolved = person;
    if (year) {
      query.date = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    const memories = await Memory.find(query)
      .populate('peopleInvolved', 'name photo relationshipType')
      .sort({ date: -1 });

    res.json(memories);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single memory
router.get('/:id', async (req, res) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, user: req.session.userId })
      .populate('peopleInvolved', 'name photo relationshipType dob');
    if (!memory) return res.status(404).json({ error: 'Not found' });
    res.json(memory);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET metadata (tags, years, emotions)
router.get('/meta/all', async (req, res) => {
  try {
    const userId = req.session.userId;
    const [tags, rawDates, emotions] = await Promise.all([
      Memory.distinct('tags', { user: userId }),
      Memory.find({ user: userId }, 'date').lean(),
      Memory.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
        { $group: { _id: '$emotion', count: { $sum: 1 } } }
      ])
    ]);
    const years = [...new Set(rawDates.map(m => new Date(m.date).getFullYear()))].sort((a, b) => b - a);
    res.json({ tags: tags.filter(Boolean).sort(), years, emotions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET memories for a person
router.get('/person/:personId', async (req, res) => {
  try {
    const memories = await Memory.find({
      user: req.session.userId,
      peopleInvolved: req.params.personId
    }).populate('peopleInvolved', 'name photo relationshipType').sort({ date: -1 });
    res.json(memories);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create memory
router.post('/', async (req, res) => {
  try {
    const { title, description, date, place, emotion, tags, isFavorite, peopleInvolved, photos } = req.body;

    const mentionIds = await resolveMentions(description || '', req.session.userId);
    let explicitIds = [];
    if (peopleInvolved) {
      try { explicitIds = Array.isArray(peopleInvolved) ? peopleInvolved : JSON.parse(peopleInvolved); }
      catch { explicitIds = []; }
    }
    const allPeople = [...new Set([...mentionIds, ...explicitIds])];

    const parsedTags = tags
      ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean))
      : [];

    const memory = await Memory.create({
      user: req.session.userId,
      title, description, place, emotion,
      date: new Date(date),
      tags: parsedTags,
      peopleInvolved: allPeople,
      photos: photos || [],
      isFavorite: isFavorite === true || isFavorite === 'true',
    });

    const populated = await memory.populate('peopleInvolved', 'name photo relationshipType');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update memory
router.put('/:id', async (req, res) => {
  try {
    const { title, description, date, place, emotion, tags, isFavorite, peopleInvolved, photos, coverPhoto } = req.body;
    const existing = await Memory.findOne({ _id: req.params.id, user: req.session.userId });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const update = { updatedAt: new Date() };
    if (title       !== undefined) update.title       = title;
    if (description !== undefined) update.description = description;
    if (date        !== undefined) update.date        = new Date(date);
    if (place       !== undefined) update.place       = place;
    if (emotion     !== undefined) update.emotion     = emotion;
    if (isFavorite  !== undefined) update.isFavorite  = isFavorite === true || isFavorite === 'true';
    if (coverPhoto  !== undefined) update.coverPhoto  = Number(coverPhoto);
    if (photos      !== undefined) update.photos      = photos;

    if (tags !== undefined) {
      update.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    if (description !== undefined || peopleInvolved !== undefined) {
      const mentionIds = description !== undefined ? await resolveMentions(description, req.session.userId) : [];
      let explicitIds = [];
      if (peopleInvolved) {
        try { explicitIds = Array.isArray(peopleInvolved) ? peopleInvolved : JSON.parse(peopleInvolved); }
        catch { explicitIds = []; }
      }
      update.peopleInvolved = [...new Set([...mentionIds, ...explicitIds])];
    }

    const memory = await Memory.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      update,
      { new: true }
    ).populate('peopleInvolved', 'name photo relationshipType');

    res.json(memory);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE memory
router.delete('/:id', async (req, res) => {
  try {
    await Memory.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;