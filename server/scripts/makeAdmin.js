const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const User = require('../models/User');

async function main() {
  const email = process.argv[2];
  if (!email) {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/makeAdmin.js <email>');
    process.exit(1);
  }

  await connectDB();

  const result = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: 'admin' },
    { new: true }
  );

  if (!result) {
    // eslint-disable-next-line no-console
    console.error('User not found:', email);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('Updated user to admin:', { id: result._id.toString(), email: result.email, role: result.role });
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed:', err.message);
  process.exit(1);
});
