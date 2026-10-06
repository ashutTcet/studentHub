const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getVerificationQueue,
  getVerificationRecordDetails,
  reviewVerificationRecord,
  getVerificationOverview,
} = require('../controllers/facultyController');

const router = express.Router();

router.use(protect, authorize('faculty', 'admin'));
router.get('/verification/overview', getVerificationOverview);
router.get('/verification/queue', getVerificationQueue);
router.get('/verification/:resourceType/:id', getVerificationRecordDetails);
router.patch('/verification/:resourceType/:id/review', reviewVerificationRecord);

module.exports = router;
