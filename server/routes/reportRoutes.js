const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { downloadStudentReport } = require('../controllers/reportController');

const router = express.Router();

router.use(protect);
router.get('/reports/me', downloadStudentReport);
router.get('/reports/student/:studentId', authorize('faculty', 'admin'), downloadStudentReport);

module.exports = router;
