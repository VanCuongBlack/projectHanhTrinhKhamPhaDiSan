const express = require('express');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const checkinController = require('../controllers/checkinController');

const router = express.Router();

router.post('/', authenticate, checkinController.checkIn);
router.get('/me', authenticate, checkinController.getMySummary);
router.get('/config', authenticate, authorizeAdmin, checkinController.getConfig);
router.put('/config', authenticate, authorizeAdmin, checkinController.updateConfig);

module.exports = router;
