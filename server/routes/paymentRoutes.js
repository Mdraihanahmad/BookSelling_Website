const express = require('express');

const auth = require('../middleware/auth');
const dbRequired = require('../middleware/dbRequired');

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-order', dbRequired, auth, createRazorpayOrder);
router.post('/verify', dbRequired, auth, verifyRazorpayPayment);

module.exports = router;
