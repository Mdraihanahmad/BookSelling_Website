const crypto = require('crypto');
const Razorpay = require('razorpay');

const Book = require('../models/Book');
const Order = require('../models/Order');
const User = require('../models/User');

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const looksLikePlaceholder = (v) => {
    if (!v) return true;
    const s = String(v).trim();
    return s === 'your_key_id' || s === 'your_key_secret' || s.startsWith('your_');
  };

  if (looksLikePlaceholder(keyId) || looksLikePlaceholder(keySecret)) {
    const err = new Error('Razorpay keys missing/placeholder. Set real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env');
    err.statusCode = 500;
    throw err;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * POST /api/payments/create-order
 * Body: { bookId }
 * Creates a Razorpay order and stores it in DB with status=created.
 */
async function createRazorpayOrder(req, res, next) {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const amountInPaise = Math.round(Number(book.price) * 100);

    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        bookId: String(book._id),
        userId: String(req.user._id),
      },
    });

    const order = await Order.create({
      userId: req.user._id,
      bookId: book._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      paymentStatus: 'created',
    });

    return res.json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      book: {
        id: book._id,
        title: book.title,
      },
    });
  } catch (err) {
    // Razorpay returns 401 when credentials are invalid.
    if (err && err.statusCode === 401) {
      err.statusCode = 500;
      err.message = 'Razorpay authentication failed. Check RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET in server/.env';
    }
    return next(err);
  }
}

/**
 * POST /api/payments/verify
 * Body: { bookId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * Verifies signature and grants book access to user.
 */
async function verifyRazorpayPayment(req, res, next) {
  try {
    const { bookId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: 'bookId, razorpayOrderId, razorpayPaymentId, razorpaySignature are required',
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server misconfigured: RAZORPAY_KEY_SECRET missing' });
    }

    // Signature verification: sha256(order_id|payment_id)
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expected !== razorpaySignature) {
      // Mark as failed if we have an order
      await Order.findOneAndUpdate(
        { razorpayOrderId, userId: req.user._id, bookId },
        { paymentStatus: 'failed' },
        { new: true }
      );
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const order = await Order.findOne({ razorpayOrderId, userId: req.user._id, bookId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.razorpayPaymentId = razorpayPaymentId;
    order.paymentStatus = 'success';
    await order.save();

    // Grant access: add to purchasedBooks (idempotent)
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { purchasedBooks: bookId } }
    );

    return res.json({ message: 'Payment verified', order });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
