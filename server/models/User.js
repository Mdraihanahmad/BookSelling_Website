const mongoose = require('mongoose');

/**
 * User Schema
 * - password is stored as a bcrypt hash
 * - role controls admin access
 * - purchasedBooks holds the list of books the user can access
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // do not return password hash by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    purchasedBooks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
