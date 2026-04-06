const User = require('../models/User');

const requireAuth = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Authentication required' });
  next();
};

// Checks both old isAdmin and new owner role
const requireOwner = async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  const isOwner = req.session.role === 'owner' || req.session.role === 'admin';
  if (!isOwner) {
    // Double-check DB in case session is stale
    try {
      const user = await User.findById(req.session.userId).select('role isAdmin');
      if (!user || (user.role !== 'owner' && user.role !== 'admin' && !user.isAdmin)) {
        return res.status(403).json({ message: 'Owner access required' });
      }
      // Update session
      req.session.role = 'owner';
    } catch (e) { return res.status(500).json({ message: e.message }); }
  }
  next();
};

const requirePermission = (feature) => async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  const role = req.session.role;
  if (role === 'owner' || role === 'admin') return next();
  try {
    const user = await User.findById(req.session.userId).select('permissions status isAdmin role');
    if (!user || user.status !== 'active') return res.status(403).json({ message: 'Access denied' });
    if (user.isAdmin || user.role === 'owner' || user.role === 'admin') return next();
    if (!user.permissions?.[feature]) return res.status(403).json({ message: `No access to ${feature}` });
    next();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { requireAuth, requireOwner, requirePermission };