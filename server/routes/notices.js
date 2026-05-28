const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const {
  getNotices, getFeed, getNotice, createNotice,
  updateNotice, deleteNotice, togglePin, getArchived, getStats
} = require('../controllers/noticeController');

router.get('/stats', auth, getStats);
router.get('/archived', auth, getArchived);
router.get('/feed', auth, getFeed);
router.get('/', auth, getNotices);
router.get('/:id', auth, getNotice);
router.post('/', auth, roleCheck('admin', 'faculty'), upload.array('attachments', 5), createNotice);
router.put('/:id', auth, roleCheck('admin', 'faculty'), upload.array('attachments', 5), updateNotice);
router.delete('/:id', auth, roleCheck('admin', 'faculty'), deleteNotice);
router.post('/:id/pin', auth, roleCheck('admin'), togglePin);

module.exports = router;
