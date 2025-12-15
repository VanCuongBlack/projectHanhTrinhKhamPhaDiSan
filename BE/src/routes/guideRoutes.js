const express = require('express');
const router = express.Router();
const guideController = require('../controllers/guideController');
const guideScheduleController = require('../controllers/guideScheduleController');
const guideReviewController = require('../controllers/guideReviewController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const guideStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/guides'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    const prefix = req.user?.ma_nguoi_dung ? `guide-${req.user.ma_nguoi_dung}` : 'guide';
    cb(null, `${prefix}-${file.fieldname}-${unique}${ext}`);
  }
});

const guideFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = file.mimetype && file.mimetype.startsWith('image/');
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp).'));
};

const guideUpload = multer({
  storage: guideStorage,
  fileFilter: guideFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const handleGuideUploads = (req, res, next) => {
  guideUpload.fields([
    { name: 'anh_chan_dung', maxCount: 1 },
    { name: 'anh_cccd', maxCount: 1 },
    { name: 'anh_chung_chi', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// User apply & xem trạng thái
router.post('/apply', authenticate, handleGuideUploads, guideController.apply);
router.get('/me', authenticate, guideController.getMyStatus);
router.get('/featured', guideController.listFeatured);

// Guide schedule
router.post('/schedule', authenticate, guideScheduleController.createSlot);
router.get('/schedule/me', authenticate, guideScheduleController.listMySchedule);
router.get('/bookings/me', authenticate, guideScheduleController.listMyBookings);
router.get('/bookings/user', authenticate, guideScheduleController.listUserBookings);
router.post('/bookings/:bookingId/reviews', authenticate, guideReviewController.addReview);
router.get('/:guideId/reviews', guideReviewController.listByGuide);

// User search & book guide
router.get('/schedule/search', guideScheduleController.searchAvailable); // public search
router.get('/schedule/:id', authenticate, guideScheduleController.getSlot);
router.post('/bookings', authenticate, guideScheduleController.book);

// Admin duyệt hồ sơ guide
router.get('/applications', authenticate, authorizeAdmin, guideController.listApplications);
router.patch('/applications/:id', authenticate, authorizeAdmin, guideController.updateApplicationStatus);

module.exports = router;
