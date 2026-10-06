const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  listAcademicRecords,
  getAcademicRecordById,
  createAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord,
} = require('../controllers/academicRecordController');

const router = express.Router();

router.use(protect);

router.get('/academic-records', listAcademicRecords);
router.post('/academic-records', createAcademicRecord);
router.get('/academic-records/:id', getAcademicRecordById);
router.put('/academic-records/:id', updateAcademicRecord);
router.delete('/academic-records/:id', deleteAcademicRecord);

module.exports = router;
