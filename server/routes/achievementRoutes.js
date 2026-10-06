const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/achievementController');

const router = express.Router();

router.use(protect);
router.post('/achievements', controller.create);
router.get('/achievements', controller.list);
router.get('/achievements/:id', controller.getById);
router.put('/achievements/:id', controller.update);
router.patch('/achievements/:id', controller.patch);
router.delete('/achievements/:id', controller.remove);

module.exports = router;
