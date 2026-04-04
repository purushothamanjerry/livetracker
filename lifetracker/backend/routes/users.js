const router = require('express').Router();
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

// Admin: list all users
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: 1 });
    res.json({ users });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: delete a user
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.session.userId) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
