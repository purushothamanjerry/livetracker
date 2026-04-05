const User = require('../models/User');

const requireAuth = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Authentication required' });
  next();
};

const requireOwner = async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  if (req.session.role !== 'owner') return res.status(403).json({ message: 'Owner access required' });
  next();
};

const requirePermission = (feature) => async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  if (req.session.role === 'owner') return next();
  try {
    const user = await User.findById(req.session.userId).select('permissions status');
    if (!user || user.status !== 'active') return res.status(403).json({ message: 'Access denied' });
    if (!user.permissions?.[feature]) return res.status(403).json({ message: `No access to ${feature}` });
    next();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { requireAuth, requireOwner, requirePermission };
