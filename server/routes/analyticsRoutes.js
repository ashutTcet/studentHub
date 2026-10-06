const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getPlatformAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/analytics/platform', getPlatformAnalytics);

module.exports = router;
