const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const leHoiController = require('../controllers/leHoiController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

const festivalStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/festivals'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    cb(null, `lehoi-${unique}${ext}`);
  }
});

const festivalUpload = multer({
  storage: festivalStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Chỉ chấp nhận file ảnh'));
  }
});

const handleFestivalUpload = (req, res, next) => {
  festivalUpload.single('anh_file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

router.get('/', leHoiController.getAllLeHoi);
router.get('/search', leHoiController.searchLeHoiByProvince);
router.post('/', authenticate, authorizeAdmin, handleFestivalUpload, leHoiController.createLeHoi);
router.put('/:id', authenticate, authorizeAdmin, handleFestivalUpload, leHoiController.updateLeHoi);
router.delete('/:id', authenticate, authorizeAdmin, leHoiController.deleteLeHoi);

module.exports = router;
