const app = require('../server/app');
const connectDB = require('../server/config/db');

let dbPromise;

module.exports = async (req, res) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB().catch((err) => {
        dbPromise = undefined;
        throw err;
      });
    }
    await dbPromise;
    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('API handler error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ message: err?.message || 'Internal server error' }));
  }
};
