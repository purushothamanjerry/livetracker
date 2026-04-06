// migrate.js
// Run: node migrate.js
// This migrates people + memories from local MongoDB to Atlas

const mongoose = require('mongoose');

// ── CONFIG ────────────────────────────────────────────────────────
const LOCAL_URI  = 'mongodb://localhost:27017/life-manager';
const ATLAS_URI  = 'YOUR_ATLAS_CONNECTION_STRING'; // ← paste your Atlas URI here
const OWNER_EMAIL = 'purushothamanjerry@gmail.com';
// ─────────────────────────────────────────────────────────────────

const localConn = mongoose.createConnection(LOCAL_URI);
const atlasConn = mongoose.createConnection(ATLAS_URI);

// ── Schemas (minimal - just need to read/write) ───────────────────
const PersonSchema = new mongoose.Schema({}, { strict: false });
const MemorySchema = new mongoose.Schema({}, { strict: false });
const UserSchema   = new mongoose.Schema({ email: String }, { strict: false });

async function migrate() {
  console.log('\n🚀 Starting migration...\n');

  try {
    await Promise.all([
      new Promise(r => localConn.once('connected', r)),
      new Promise(r => atlasConn.once('connected', r)),
    ]);
    console.log('✅ Connected to both databases\n');

    // Get models
    const LocalPerson  = localConn.model('Person',  PersonSchema, 'people');
    const LocalMemory  = localConn.model('Memory',  MemorySchema, 'memories');
    const AtlasPerson  = atlasConn.model('Person',  PersonSchema, 'people');
    const AtlasMemory  = atlasConn.model('Memory',  MemorySchema, 'memories');
    const AtlasUser    = atlasConn.model('User',    UserSchema,   'users');

    // Find your owner account in Atlas
    const owner = await AtlasUser.findOne({ email: OWNER_EMAIL });
    if (!owner) {
      console.error('❌ Owner account not found in Atlas!');
      console.error(`   Make sure you are logged in as ${OWNER_EMAIL} on the live site first.`);
      process.exit(1);
    }
    const ownerId = owner._id;
    console.log(`✅ Found owner: ${OWNER_EMAIL} (${ownerId})\n`);

    // ── Migrate People ────────────────────────────────────────────
    const localPeople = await LocalPerson.find({}).lean();
    console.log(`📦 Found ${localPeople.length} people in local DB`);

    // Build ID mapping (local _id → new Atlas _id)
    const personIdMap = {};
    let peopleInserted = 0;
    let peopleSkipped  = 0;

    for (const person of localPeople) {
      // Check if already exists by name
      const existing = await AtlasPerson.findOne({ user: ownerId, name: person.name });
      if (existing) {
        personIdMap[person._id.toString()] = existing._id.toString();
        peopleSkipped++;
        continue;
      }

      // Clean and transform the person document
      const newPerson = {
        user: ownerId,
        name: person.name || 'Unknown',
        photo: '', // skip photos
        gender: person.gender || 'male',
        dob: person.dateOfBirth
          ? new Date(person.dateOfBirth).toISOString().split('T')[0]
          : '',
        dobApprox: false,
        isSpecial: person.isSpecial || false,
        relationshipType: mapRelType(person.relationshipType),
        bondStatus: mapBondStatus(person.currentStatus),
        bondHistory: (person.statusHistory || []).map(s => ({
          status: mapBondStatus(s.status),
          note: s.note || '',
          date: s.changedAt || new Date()
        })),
        whereMet: person.firstMeetingPlace || '',
        metDate: person.firstMeetingDate
          ? new Date(person.firstMeetingDate).toISOString().split('T')[0]
          : '',
        howWeMet: person.howWeMet || '',
        mobile: person.mobileNumber || '',
        instagram: person.instagramId || '',
        heightFeel: mapHeight(person.height),
        bodyType: mapBodyType(person.bodyType),
        hairLength: mapHairLength(person.hairLength),
        characterTags: person.characterTraits || [],
        privateNotes: person.notes || '',
        lastContacted: person.lastConversationDate || null,
        contactFrequencyDays: 30,
        gallery: [],
        createdAt: person.createdAt || new Date(),
        updatedAt: person.updatedAt || new Date(),
      };

      const inserted = await AtlasPerson.create(newPerson);
      personIdMap[person._id.toString()] = inserted._id.toString();
      peopleInserted++;
      process.stdout.write(`  ✓ ${person.name}\n`);
    }

    console.log(`\n✅ People: ${peopleInserted} inserted, ${peopleSkipped} already existed\n`);

    // ── Migrate Memories ──────────────────────────────────────────
    const localMemories = await LocalMemory.find({}).lean();
    console.log(`📦 Found ${localMemories.length} memories in local DB`);

    let memoriesInserted = 0;
    let memoriesSkipped  = 0;

    for (const mem of localMemories) {
      const existing = await AtlasMemory.findOne({ user: ownerId, title: mem.title });
      if (existing) { memoriesSkipped++; continue; }

      // Map peopleInvolved IDs
      const mappedPeople = (mem.peopleInvolved || [])
        .map(id => personIdMap[id?.toString()])
        .filter(Boolean);

      const newMemory = {
        user: ownerId,
        title: mem.title || 'Untitled Memory',
        content: mem.description || '',
        date: mem.date
          ? new Date(mem.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        category: mapEmotion(mem.emotion),
        mentionedPeople: mappedPeople,
        tags: mem.tags || [],
        mood: mem.emotion || '',
        createdAt: mem.createdAt || new Date(),
      };

      await AtlasMemory.create(newMemory);
      memoriesInserted++;
      process.stdout.write(`  ✓ ${mem.title || 'Untitled'}\n`);
    }

    console.log(`\n✅ Memories: ${memoriesInserted} inserted, ${memoriesSkipped} already existed\n`);
    console.log('🎉 Migration complete!\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
  } finally {
    await localConn.close();
    await atlasConn.close();
    process.exit(0);
  }
}

// ── Field mappers ─────────────────────────────────────────────────

function mapRelType(t) {
  const map = {
    'love': 'love', 'crush': 'crush', 'attracted': 'attracted',
    'impressed': 'impressed', 'friend': 'friend', 'family': 'family',
    'colleague': 'colleague', 'classmate': 'classmate', 'teacher': 'teacher',
    'acquaintance': 'acquaintance', 'roommate': 'roommate',
    'one-time': 'other', 'other': 'other'
  };
  return map[t?.toLowerCase()] || 'acquaintance';
}

function mapBondStatus(s) {
  const map = {
    'close': 'close', 'good': 'good', 'drifting': 'drifting',
    'distant': 'distant', 'not-talking': 'not-talking',
    'complicated': 'complicated', 'rekindled': 'rekindled',
    'lost-touch': 'lost-touch', 'ended': 'ended',
    'lost touch': 'lost-touch', 'not talking': 'not-talking',
  };
  return map[s?.toLowerCase()] || 'good';
}

function mapHeight(h) {
  const map = {
    'very short': 'very-short', 'short': 'short', 'average': 'average',
    'Average': 'average', 'tall': 'tall', 'very tall': 'very-tall',
    'Very Tall': 'very-tall', 'Short': 'short', 'Tall': 'tall'
  };
  return map[h] || '';
}

function mapBodyType(b) {
  const map = {
    'slim': 'slim', 'Slim': 'slim', 'lean': 'lean', 'athletic': 'athletic',
    'average': 'average', 'Average': 'average', 'curvy': 'curvy',
    'heavyset': 'heavyset', 'Heavyset': 'heavyset', 'Heavyset': 'heavyset',
    'chubby': 'heavyset', 'fat': 'heavyset'
  };
  return map[b] || '';
}

function mapHairLength(h) {
  const map = {
    'bald': 'bald', 'very short': 'very-short', 'short': 'short',
    'medium': 'medium', 'long': 'long', 'very long': 'very-long',
    'Very Long': 'very-long', 'Long': 'long', 'Short': 'short',
    'Medium': 'medium'
  };
  return map[h] || '';
}

function mapEmotion(e) {
  const map = {
    'happy': 'Happy', 'sad': 'Sad', 'funny': 'Funny',
    'nostalgic': 'Special', 'angry': 'Other', 'excited': 'Happy',
    'mixed': 'Other', 'bittersweet': 'Special'
  };
  return map[e?.toLowerCase()] || 'Other';
}

migrate();
