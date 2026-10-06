const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, getConsolidatedProfile, getVerifiedProfile } = require('../controllers/profileController');

const router = express.Router();

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/profile/consolidated', getConsolidatedProfile);
router.get('/profile/verified', getVerifiedProfile);

module.exports = router;
