const express = require('express');

const { register, login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/ping', (req, res) => {
	res.json({ ok: true, service: 'sellb-auth' });
});

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);

module.exports = router;
