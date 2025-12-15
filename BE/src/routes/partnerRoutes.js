const express = require('express');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const partnerController = require('../controllers/partnerController');
const partnerApplicationController = require('../controllers/partnerApplicationController');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const partnerStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/partners'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    const prefix = req.user?.ma_nguoi_dung ? `partner-${req.user.ma_nguoi_dung}` : 'partner';
    cb(null, `${prefix}-${file.fieldname}-${unique}${ext}`);
  }
});
const partnerFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  if (extOk) return cb(null, true);
  cb(new Error('Chỉ chấp nhận file ảnh/pdf.'));
};
const partnerUpload = multer({
  storage: partnerStorage,
  fileFilter: partnerFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});
const handlePartnerUpload = (req, res, next) => {
  partnerUpload.fields([{ name: 'giay_phep_kinh_doanh', maxCount: 1 }])(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

// Partner đăng ký, admin duyệt
router.post('/register', authenticate, partnerController.register);
router.patch('/:id/approve', authenticate, authorizeAdmin, partnerController.approve);

// Partner tạo tour
router.post('/tours', authenticate, partnerController.createTour);

// Doanh thu, ví
router.get('/revenue', authenticate, partnerController.getRevenue);
router.get('/wallet', authenticate, partnerController.getWallet);

// Partner application flow
router.post('/apply', authenticate, handlePartnerUpload, partnerApplicationController.apply);
router.get('/me', authenticate, partnerApplicationController.getMyStatus);
router.get('/applications', authenticate, authorizeAdmin, partnerApplicationController.listApplications);
router.patch('/applications/:id', authenticate, authorizeAdmin, partnerApplicationController.updateApplicationStatus);

module.exports = router;
