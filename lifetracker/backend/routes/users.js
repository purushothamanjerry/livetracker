const router = require('express').Router();
const User = require('../models/User');
const { requireAuth, requireOwner } = require('../middleware/auth');

router.use(requireAuth, requireOwner);

router.get('/', async (req, res) => {
  try {
    const users = await User.find({ role: 'guest' }).select('-password').sort({ requestedAt: -1 });
    res.json({
      pending:  users.filter(u => u.status === 'pending'),
      active:   users.filter(u => u.status === 'active'),
      blocked:  users.filter(u => u.status === 'blocked'),
      rejected: users.filter(u => u.status === 'rejected'),
      total: users.length
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.status = 'active'; user.approvedAt = new Date();
    if (req.body.permissions) user.permissions = { ...user.permissions, ...req.body.permissions };
    await user.save();
    res.json({ message: `${user.username} approved!`, user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.status = 'rejected'; await user.save();
    res.json({ message: `${user.username} rejected` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.status = 'blocked'; user.blockedAt = new Date(); user.blockedReason = req.body.reason || '';
    await user.save();
    res.json({ message: `${user.username} blocked` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/unblock', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.status = 'active'; user.blockedAt = null; user.blockedReason = '';
    await user.save();
    res.json({ message: `${user.username} unblocked` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/permissions', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.permissions = { ...user.permissions, ...req.body };
    await user.save();
    res.json({ message: 'Permissions updated', permissions: user.permissions });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'owner') return res.status(400).json({ message: 'Cannot delete owner' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
