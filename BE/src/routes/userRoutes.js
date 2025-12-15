const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads/avatars'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname) || '';
        const prefix = req.user?.ma_nguoi_dung ? `user-${req.user.ma_nguoi_dung}` : 'user';
        cb(null, `${prefix}-${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = file.mimetype && file.mimetype.startsWith('image/');
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp).'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const handleUpload = (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// Đăng ký user
router.post('/register', userController.register);
// Đăng nhập
router.post('/login', userController.login);
// Xác thực OTP để hoàn tất đăng ký
router.post('/verify-otp', userController.verifyOtp);
// Route logout
router.post('/logout', authenticate, userController.logout);
// Profile
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);
router.put('/me/password', authenticate, userController.changePassword);
router.post('/me/avatar', authenticate, handleUpload, userController.uploadAvatar);
router.get('/me/checkins', authenticate, userController.getCheckInHistory);
router.get('/me/vouchers', authenticate, userController.getUserVouchers);
router.get('/me/transactions', authenticate, userController.getWalletHistory);

module.exports = router;
