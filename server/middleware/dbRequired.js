const mongoose = require('mongoose');

/**
 * Ensure MongoDB is connected for routes that require DB.
 * Returns 503 instead of hanging.
 */
function dbRequired(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
  }
  return next();
}

module.exports = dbRequired;
