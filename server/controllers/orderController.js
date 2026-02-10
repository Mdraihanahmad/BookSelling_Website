const Order = require('../models/Order');

/**
 * GET /api/orders/my
 * User dashboard: list orders for current user.
 */
async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('bookId')
      .sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/orders
 * Admin: list all orders.
 */
async function getAllOrders(req, res, next) {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email role')
      .populate('bookId')
      .sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMyOrders,
  getAllOrders,
};
