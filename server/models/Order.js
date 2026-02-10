const mongoose = require('mongoose');

/**
 * Order Schema
 * Stores Razorpay IDs and payment status per user & book.
 */
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['created', 'success', 'failed'],
      default: 'created',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
