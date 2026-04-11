const router   = require('express').Router();
const Memory   = require('../models/Memory');
const Person   = require('../models/Person');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Helper: normalize memory doc to always have both old+new fields readable
function normalizeMemory(m) {
  const obj = m.toObject ? m.toObject() : m;
  // description = content or description
  obj.description = obj.description || obj.content || '';
  // emotion = emotion or mood or category
  obj.emotion = obj.emotion || obj.mood || obj.category || 'joyful';
  // peopleInvolved = peopleInvolved or mentionedPeople
  if ((!obj.peopleInvolved || obj.peopleInvolved.length === 0) && obj.mentionedPeople?.length > 0) {
    obj.peopleInvolved = obj.mentionedPeople;
  }
  return obj;
}

// Helper: resolve @mentions
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

// ── GET /meta/all — MUST be before /:id ──────────────────────────
router.get('/meta/all', async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get all memories for this user
    const allMems = await Memory.find({ user: userId }, 'tags date emotion mood category').lean();

    // Extract unique tags
    const tagSet = new Set();
    allMems.forEach(m => (m.tags || []).forEach(t => t && tagSet.add(t)));
    const tags = [...tagSet].sort();

    // Extract unique years
    const yearSet = new Set();
    allMems.forEach(m => {
      if (m.date) {
        try { yearSet.add(new Date(m.date).getFullYear()); } catch {}
      }
    });
    const years = [...yearSet].filter(y => !isNaN(y)).sort((a, b) => b - a);

    // Emotion distribution (use emotion or mood or category)
    const emoCounts = {};
    allMems.forEach(m => {
      const e = m.emotion || m.mood || m.category || 'joyful';
      emoCounts[e] = (emoCounts[e] || 0) + 1;
    });
    const emotions = Object.entries(emoCounts).map(([_id, count]) => ({ _id, count }));

    res.json({ tags, years, emotions });
  } catch (err) {
    console.error('memories meta error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /person/:personId ─────────────────────────────────────────
router.get('/person/:personId', async (req, res) => {
  try {
    const query = {
      user: req.session.userId,
      $or: [
        { peopleInvolved: req.params.personId },
        { mentionedPeople: req.params.personId }
      ]
    };
    const memories = await Memory.find(query)
      .populate('peopleInvolved mentionedPeople', 'name photo relationshipType')
      .sort({ date: -1 })
      .lean();
    res.json(memories.map(normalizeMemory));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET / — all memories with filters ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, tag, emotion, person, year, favorite } = req.query;
    const query = { user: req.session.userId };

    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content:     { $regex: search, $options: 'i' } },
        { place:       { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } }
      ];
    }
    if (tag)      query.tags = tag;
    if (emotion) {
      // match against all emotion-like fields
      query.$or = query.$or || [];
      query.$or.push(
        { emotion:  emotion },
        { mood:     emotion },
        { category: emotion }
      );
    }
    if (favorite) query.isFavorite = true;
    if (person)   query.$or = [...(query.$or||[]), { peopleInvolved: person }, { mentionedPeople: person }];
    if (year) {
      const y = parseInt(year);
      query.$or = [...(query.$or||[]),
        { date: { $gte: new Date(`${y}-01-01`), $lte: new Date(`${y}-12-31`) } },
        { date: { $regex: `^${y}` } }
      ];
      delete query.$or; // simpler: use date range
      try {
        query.date = { $gte: new Date(`${y}-01-01`), $lte: new Date(`${y}-12-31`) };
      } catch {}
    }

    const memories = await Memory.find(query)
      .populate('peopleInvolved mentionedPeople', 'name photo relationshipType')
      .sort({ createdAt: -1 })
      .lean();

    res.json(memories.map(normalizeMemory));
  } catch (err) {
    console.error('memories GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, user: req.session.userId })
      .populate('peopleInvolved mentionedPeople', 'name photo relationshipType')
      .lean();
    if (!memory) return res.status(404).json({ error: 'Not found' });
    res.json(normalizeMemory(memory));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST create ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, description, date, place, emotion, tags, isFavorite, peopleInvolved } = req.body;

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

    const memory = new Memory({
      user: req.session.userId,
      title,
      description: description || '',
      content:     description || '',  // also save as content for compatibility
      place: place || '',
      emotion: emotion || 'joyful',
      mood:    emotion || 'joyful',
      date: date ? new Date(date) : new Date(),
      tags: parsedTags,
      peopleInvolved: allPeople,
      mentionedPeople: allPeople,
      isFavorite: isFavorite === true || isFavorite === 'true',
    });
    await memory.save();

    const populated = await Memory.findById(memory._id)
      .populate('peopleInvolved mentionedPeople', 'name photo relationshipType')
      .lean();
    res.json(normalizeMemory(populated));
  } catch (err) {
    console.error('memories POST error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ── PUT update ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { title, description, date, place, emotion, tags, isFavorite, peopleInvolved } = req.body;
    const update = { updatedAt: new Date() };

    if (title       !== undefined) update.title       = title;
    if (description !== undefined) { update.description = description; update.content = description; }
    if (date        !== undefined) update.date        = new Date(date);
    if (place       !== undefined) update.place       = place;
    if (emotion     !== undefined) { update.emotion = emotion; update.mood = emotion; }
    if (isFavorite  !== undefined) update.isFavorite  = isFavorite === true || isFavorite === 'true';
    if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    if (description !== undefined || peopleInvolved !== undefined) {
      const mentionIds = description !== undefined ? await resolveMentions(description, req.session.userId) : [];
      let explicitIds = [];
      if (peopleInvolved) {
        try { explicitIds = Array.isArray(peopleInvolved) ? peopleInvolved : JSON.parse(peopleInvolved); }
        catch { explicitIds = []; }
      }
      const all = [...new Set([...mentionIds, ...explicitIds])];
      update.peopleInvolved  = all;
      update.mentionedPeople = all;
    }

    const memory = await Memory.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      update, { new: true }
    ).populate('peopleInvolved mentionedPeople', 'name photo relationshipType').lean();

    res.json(normalizeMemory(memory));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── DELETE ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Memory.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;