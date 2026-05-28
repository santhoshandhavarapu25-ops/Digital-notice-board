const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');

router.get('/public', getDepartments);
router.get('/', auth, getDepartments);
router.post('/', auth, roleCheck('admin'), createDepartment);
router.put('/:id', auth, roleCheck('admin'), updateDepartment);
router.delete('/:id', auth, roleCheck('admin'), deleteDepartment);

module.exports = router;
