const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadFile, getFile, deleteFile } = require('../controllers/fileController');

const router = express.Router();

router.use(protect);
router.post('/files', uploadLimiter, upload.single('file'), uploadFile);
router.get('/files/:id', getFile);
router.delete('/files/:id', deleteFile);

module.exports = router;
