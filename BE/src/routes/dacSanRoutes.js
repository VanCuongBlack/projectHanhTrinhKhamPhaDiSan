const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const dacSanController = require('../controllers/dacSanController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

const specialtyStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/specialties'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    cb(null, `dacsan-${unique}${ext}`);
  }
});

const specialtyUpload = multer({
  storage: specialtyStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Chỉ chấp nhận file ảnh'));
  }
});

const handleSpecialtyUpload = (req, res, next) => {
  specialtyUpload.single('anh_file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

router.get('/', dacSanController.getAllDacSan);
router.get('/search', dacSanController.searchDacSanByProvince);
router.post('/', authenticate, authorizeAdmin, handleSpecialtyUpload, dacSanController.createDacSan);
router.put('/:id', authenticate, authorizeAdmin, handleSpecialtyUpload, dacSanController.updateDacSan);
router.delete('/:id', authenticate, authorizeAdmin, dacSanController.deleteDacSan);

module.exports = router;
