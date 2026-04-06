const router = require('express').Router();
const User = require('../models/User');

// ── Request Access (register) ─────────────────────────────────────
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
      permissions: { activities:true, health:true, expenses:true, notes:true, schedule:true, relationships:isOwner, memories:isOwner }
    });
    await user.save();
    if (isOwner) res.json({ message: 'Owner account created! You can now login.', isOwner: true });
    else res.json({ message: 'Access request sent! Please wait for approval.', isPending: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Auto-fix legacy accounts (old isAdmin field from previous version)
    let needsSave = false;
    if ((user.isAdmin === true || user.role === 'admin') && user.role !== 'owner') {
      user.role = 'owner'; needsSave = true;
    }
    if (!user.status) { user.status = 'active'; needsSave = true; }
    if (user.role === 'owner' && user.status !== 'active') { user.status = 'active'; needsSave = true; }
    if (!user.permissions || !user.permissions.activities) {
      user.permissions = { activities:true, health:true, expenses:true, notes:true, schedule:true, relationships:true, memories:true };
      needsSave = true;
    }
    if (needsSave) await user.save();

    if (user.status === 'pending')  return res.status(403).json({ message: 'Your account is pending approval.', status: 'pending' });
    if (user.status === 'blocked')  return res.status(403).json({ message: 'Your access has been blocked.', status: 'blocked' });
    if (user.status === 'rejected') return res.status(403).json({ message: 'Your access request was rejected.', status: 'rejected' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.userId   = user._id.toString();
    req.session.username = user.username;
    req.session.role     = user.role;

    res.json({ message: 'Logged in', user: { id: user._id, username: user.username, email: user.email, role: user.role, permissions: user.permissions, avatarColor: user.avatarColor } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Force owner (emergency lockout fix) ──────────────────────────
// POST /api/auth/force-owner  { email, secret }
router.post('/force-owner', async (req, res) => {
  const { email, secret } = req.body;
  if (secret !== (process.env.FORCE_SECRET || 'plm_force_2024')) return res.status(403).json({ message: 'Invalid secret' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = 'owner'; user.status = 'active';
    user.permissions = { activities:true, health:true, expenses:true, notes:true, schedule:true, relationships:true, memories:true };
    await user.save();
    res.json({ message: `${email} is now owner!` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Logout ────────────────────────────────────────────────────────
router.post('/logout', (req, res) => { req.session.destroy(); res.json({ message: 'Logged out' }); });

// ── Check session ─────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await User.findById(req.session.userId).select('-password');
  if (!user) return res.status(401).json({ message: 'User not found' });
  // Auto-fix on session check too
  if ((user.isAdmin === true || user.role === 'admin') && user.role !== 'owner') {
    user.role = 'owner'; user.status = 'active'; await user.save();
  }
  res.json({ user });
});

// ── Change password ───────────────────────────────────────────────
router.post('/change-password', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const { currentPassword, newPassword, targetUserId } = req.body;
    const me = await User.findById(req.session.userId);
    let target;
    if (targetUserId && me.role === 'owner') { target = await User.findById(targetUserId); }
    else {
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