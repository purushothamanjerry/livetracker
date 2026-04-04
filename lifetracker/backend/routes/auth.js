const router = require('express').Router();
const User = require('../models/User');

// Register - only allowed if admin or first user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, inviteCode } = req.body;

    // First user becomes admin automatically
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // For non-first users, require being logged in as admin or having invite
    if (!isFirstUser) {
      if (!req.session?.userId) {
        return res.status(403).json({ message: 'Registration requires admin permission' });
      }
      const requestingUser = await User.findById(req.session.userId);
      if (!requestingUser?.isAdmin) {
        return res.status(403).json({ message: 'Only admin can create new users' });
      }
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'Username or email already exists' });

    const user = new User({
      username,
      email,
      password,
      isAdmin: isFirstUser,
      invitedBy: req.session?.userId || null
    });
    await user.save();

    res.json({ message: 'User created', userId: user._id, isAdmin: user.isAdmin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.userId = user._id.toString();
    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin;

    res.json({
      message: 'Logged in',
      user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// Check session
router.get('/me', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await User.findById(req.session.userId).select('-password');
  if (!user) return res.status(401).json({ message: 'User not found' });
  res.json({ user });
});

module.exports = router;
