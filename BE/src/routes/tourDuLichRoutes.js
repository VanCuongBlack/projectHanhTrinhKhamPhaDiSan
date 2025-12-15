const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourDuLichController');
const tourBookingController = require('../controllers/tourBookingController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const partnerGuard = require('../middlewares/partnerGuard');
const multer = require('multer');
const path = require('path');

const tourStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/tours'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    const prefix = req.user?.ma_nguoi_dung ? `tour-${req.user.ma_nguoi_dung}` : 'tour';
    cb(null, `${prefix}-${unique}${ext}`);
  }
});
const tourFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|mp4|mov|avi/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  if (extOk) return cb(null, true);
  cb(new Error('Định dạng file không được hỗ trợ.'));
};
const tourUpload = multer({
  storage: tourStorage,
  fileFilter: tourFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
const handleTourUpload = (req, res, next) => {
  tourUpload.single('media')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

router.get('/', tourController.getAllTours);
router.post('/', authenticate, partnerGuard, tourController.createTour);
router.put('/:id', authenticate, authorizeAdmin, tourController.updateTour);
router.delete('/:id', authenticate, authorizeAdmin, tourController.deleteTour);
router.post('/:id/bookings', authenticate, tourBookingController.book);
router.post('/upload', authenticate, partnerGuard, handleTourUpload, tourController.uploadTourMedia);
router.get('/bookings/partner', authenticate, partnerGuard, tourBookingController.partnerStats);
router.get('/bookings/me', authenticate, tourBookingController.listMyTourBookings);

module.exports = router;
