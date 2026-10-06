const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/internshipController');

const router = express.Router();

router.use(protect);
router.post('/internships', controller.create);
router.get('/internships', controller.list);
router.get('/internships/:id', controller.getById);
router.put('/internships/:id', controller.update);
router.patch('/internships/:id', controller.patch);
router.delete('/internships/:id', controller.remove);

module.exports = router;
