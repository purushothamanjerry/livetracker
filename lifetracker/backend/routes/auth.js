const router = require('express').Router();
const User = require('../models/User');

router.post('/request-access', async (req, res) => {
  try {
    const { username, email, password, requestMessage } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      if (existing.status === 'pending') return res.status(400).json({ message: 'Request already pending.' });
      if (existing.status === 'blocked') return res.status(403).json({ message: 'Your access has been blocked.' });
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const userCount = await User.countDocuments();
    const isOwner = userCount === 0;
    const user = new User({
      username, email, password,
      role: isOwner ? 'owner' : 'guest',
      status: isOwner ? 'active' : 'pending',
      requestMessage: requestMessage || '',
      permissions: {
        activities: true, health: true, expenses: true,
        notes: true, schedule: true,
        relationships: isOwner, memories: isOwner
      }
    });
    await user.save();
    if (isOwner) res.json({ message: 'Owner account created! You can now login.', isOwner: true });
    else res.json({ message: 'Access request sent! Please wait for approval.', isPending: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.status === 'pending') return res.status(403).json({ message: 'Your account is pending approval.', status: 'pending' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Your access has been blocked.', status: 'blocked' });
    if (user.status === 'rejected') return res.status(403).json({ message: 'Your access request was rejected.', status: 'rejected' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    req.session.role = user.role;
    res.json({ message: 'Logged in', user: { id: user._id, username: user.username, email: user.email, role: user.role, permissions: user.permissions, avatarColor: user.avatarColor } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/logout', (req, res) => { req.session.destroy(); res.json({ message: 'Logged out' }); });

router.get('/me', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await User.findById(req.session.userId).select('-password');
  if (!user) return res.status(401).json({ message: 'User not found' });
  res.json({ user });
});

router.post('/change-password', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const { currentPassword, newPassword, targetUserId } = req.body;
    const me = await User.findById(req.session.userId);
    let target;
    if (targetUserId && me.role === 'owner') {
      target = await User.findById(targetUserId);
    } else {
      target = me;
      const match = await me.comparePassword(currentPassword);
      if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
    }
    target.password = newPassword;
    await target.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
