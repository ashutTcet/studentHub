const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/certificateController');

const router = express.Router();

router.use(protect);
router.post('/certificates', controller.create);
router.get('/certificates', controller.list);
router.get('/certificates/:id', controller.getById);
router.put('/certificates/:id', controller.update);
router.patch('/certificates/:id', controller.patch);
router.delete('/certificates/:id', controller.remove);

module.exports = router;
