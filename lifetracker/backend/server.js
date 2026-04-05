require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => { if (!origin || allowedOrigins.includes(origin)) cb(null, true); else cb(new Error('Not allowed')); },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'plm_secret_key',
  resave: false, saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 24*60*60*1000, httpOnly: true, secure: true, sameSite: 'none' }
}));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/health',     require('./routes/health'));
app.use('/api/schedules',  require('./routes/schedules'));
app.use('/api/notes',      require('./routes/notes'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/people',     require('./routes/people'));
app.use('/api/expenses',   require('./routes/expenses'));
app.get('/api/health-check', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PLM running on port ${PORT}`));
