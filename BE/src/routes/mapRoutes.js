const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const { authenticate } = require('../middlewares/authMiddleware');

// Tính distance/duration theo tuyến (cần token để tránh abuse)
router.post('/distance', authenticate, mapController.getDistance);
// Geocode
router.get('/geocode/search', authenticate, mapController.search);
router.get('/geocode/reverse', authenticate, mapController.reverse);

module.exports = router;
