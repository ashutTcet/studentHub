const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/competitionController');

const router = express.Router();

router.use(protect);
router.post('/competitions', controller.create);
router.get('/competitions', controller.list);
router.get('/competitions/:id', controller.getById);
router.put('/competitions/:id', controller.update);
router.patch('/competitions/:id', controller.patch);
router.delete('/competitions/:id', controller.remove);

module.exports = router;
