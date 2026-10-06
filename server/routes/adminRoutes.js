const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { health, listUsers, updateUserStatus, listAuditLogs } = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/health', health);
router.get('/users', listUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.get('/audit-logs', listAuditLogs);

module.exports = router;
