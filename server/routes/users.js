const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getUsers, updateUserRole, updateProfile, updatePassword, deleteAccount } = require('../controllers/userController');

router.get('/', auth, roleCheck('admin'), getUsers);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, updatePassword);
router.delete('/me', auth, deleteAccount);
router.put('/:id/role', auth, roleCheck('admin'), updateUserRole);

module.exports = router;
