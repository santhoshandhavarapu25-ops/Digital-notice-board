const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getSubscriptions, subscribe, unsubscribe } = require('../controllers/subscriptionController');

router.get('/', auth, getSubscriptions);
router.post('/:categoryId', auth, subscribe);
router.delete('/:categoryId', auth, unsubscribe);

module.exports = router;
