const express = require('express');
const router = express.Router();
const diaDiemController = require('../controllers/diaDiemController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const placeStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/places'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    cb(null, `place-${unique}${ext}`);
  }
});

const placeUpload = multer({
  storage: placeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Chỉ chấp nhận file ảnh'));
  }
});

const handlePlaceUpload = (req, res, next) => {
  placeUpload.single('anh_file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

// Lấy tất cả địa điểm
router.get('/', diaDiemController.getAllDiaDiem);
router.get('/search', diaDiemController.searchDiaDiemByProvince);
// Thêm địa điểm mới (cần xác thực + admin)
router.post('/', authenticate, authorizeAdmin, handlePlaceUpload, diaDiemController.createDiaDiem);
// Cập nhật địa điểm theo id
router.put('/:id', authenticate, authorizeAdmin, handlePlaceUpload, diaDiemController.updateDiaDiem);
// Xóa địa điểm theo id
router.delete('/:id', authenticate, authorizeAdmin, diaDiemController.deleteDiaDiem);

module.exports = router;
