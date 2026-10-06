const path = require('path');
const multer = require('multer');

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();

    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return cb(new Error('Unsupported file type. Upload PDF, JPG, PNG, or WEBP files only.'));
    }

    return cb(null, true);
  },
});

module.exports = { upload };
