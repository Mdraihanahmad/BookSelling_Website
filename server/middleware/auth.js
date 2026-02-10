const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes with JWT.
 * Expects header: Authorization: Bearer <token>
 * Adds req.user with the authenticated user (without password).
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized: missing token' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET missing' });
    }

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized: user not found' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized: invalid token' });
  }
}

module.exports = auth;
