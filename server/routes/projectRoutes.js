const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/projectController');

const router = express.Router();

router.use(protect);
router.post('/projects', controller.create);
router.get('/projects', controller.list);
router.get('/projects/:id', controller.getById);
router.put('/projects/:id', controller.update);
router.patch('/projects/:id', controller.patch);
router.delete('/projects/:id', controller.remove);

module.exports = router;
