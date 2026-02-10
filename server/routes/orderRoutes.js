const express = require('express');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const dbRequired = require('../middleware/dbRequired');

const { getMyOrders, getAllOrders } = require('../controllers/orderController');

const router = express.Router();

router.get('/my', dbRequired, auth, getMyOrders);
router.get('/', dbRequired, auth, admin, getAllOrders);

module.exports = router;
