const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getColleges, getCurrentCollege, updateCurrentCollege } = require('../controllers/authController');

router.get('/', getColleges);
router.get('/me', auth, roleCheck('admin'), getCurrentCollege);
router.put('/me', auth, roleCheck('admin'), updateCurrentCollege);

module.exports = router;
