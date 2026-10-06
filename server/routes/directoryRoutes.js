const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  listStudentDirectory,
  getStudentConsolidatedProfile,
  getStudentVerifiedProfile,
} = require('../controllers/directoryController');

const router = express.Router();

router.use(protect, authorize('faculty', 'admin'));
router.get('/students/directory', listStudentDirectory);
router.get('/students/:studentId/consolidated', getStudentConsolidatedProfile);
router.get('/students/:studentId/verified', getStudentVerifiedProfile);

module.exports = router;
