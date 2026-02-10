const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const REQUIRE_DB = (process.env.REQUIRE_DB || 'false').toLowerCase() === 'true';

async function bootstrap() {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });

  try {
    await connectDB();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection failed:', err.message);
    if (REQUIRE_DB) {
      process.exit(1);
    }
  }
}

bootstrap();
