const express = require('express');
const regionController = require('../controllers/regionController');

const router = express.Router();

router.get('/mien', regionController.getMien);
router.get('/tinh-thanh', regionController.getTinhThanh);
router.get('/loai-dia-diem', regionController.getLoaiDiaDiem);

module.exports = router;
