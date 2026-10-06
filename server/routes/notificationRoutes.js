const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { cacheJson } = require('../middleware/cache');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);
router.get(
  '/notifications',
  cacheJson({
    ttlSeconds: 20,
    keyBuilder: (req) => `studenthub:notifications:${req.user._id}:${req.originalUrl}`,
  }),
  listNotifications
);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);

module.exports = router;
