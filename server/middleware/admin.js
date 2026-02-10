/**
 * Admin-only middleware.
 * Requires auth middleware to have set req.user.
 */
function admin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin access required' });
  }

  return next();
}

module.exports = admin;
