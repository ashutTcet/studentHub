const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { cacheJson } = require('../middleware/cache');

const router = express.Router();

router.use(protect);
router.get(
	'/dashboard/summary',
	cacheJson({
		ttlSeconds: 45,
		keyBuilder: (req) => `studenthub:dashboard:${req.user._id}:${req.originalUrl}`,
	}),
	getDashboardSummary
);

module.exports = router;
