const mongoose = require('mongoose');

/**
 * Connect to MongoDB using Mongoose.
 * Reads connection string from process.env.MONGO_URI
 */
async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in environment variables');
  }

  mongoose.set('strictQuery', true);
  // Fail fast if DB is unavailable (prevents 10s request buffering timeouts)
  mongoose.set('bufferCommands', false);
  mongoose.set('bufferTimeoutMS', 0);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
  // Note: mongoose.connection.host is available after connect
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
