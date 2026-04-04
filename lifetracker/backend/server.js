require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const healthRoutes = require('./routes/health');
const scheduleRoutes = require('./routes/schedules');
const noteRoutes = require('./routes/notes');
const userRoutes = require('./routes/users');

const app = express();

// Trust proxy (required for Render)
app.set('trust proxy', 1);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// CORS - must be before session
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Session - 24 hour session, cross-site safe
app.use(session({
  secret: process.env.SESSION_SECRET || 'lifetracker_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: true,       // always true (Render uses HTTPS)
    sameSite: 'none'    // required for cross-site cookies
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health-check', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
