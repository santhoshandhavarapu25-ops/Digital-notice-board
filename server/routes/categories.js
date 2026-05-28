const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

router.get('/', auth, getCategories);
router.post('/', auth, roleCheck('admin'), createCategory);
router.put('/:id', auth, roleCheck('admin'), updateCategory);
router.delete('/:id', auth, roleCheck('admin'), deleteCategory);

module.exports = router;
