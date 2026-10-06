const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/activityController');

const router = express.Router();

router.use(protect);
router.post('/activities', controller.create);
router.get('/activities', controller.list);
router.get('/activities/:id', controller.getById);
router.put('/activities/:id', controller.update);
router.patch('/activities/:id', controller.patch);
router.delete('/activities/:id', controller.remove);

module.exports = router;
