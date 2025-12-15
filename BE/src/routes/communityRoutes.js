const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads/community'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname) || '';
        const prefix = req.user?.ma_nguoi_dung ? `user-${req.user.ma_nguoi_dung}` : 'user';
        cb(null, `${prefix}-${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    if (!extOk) {
        return cb(new Error('Chỉ chấp nhận ảnh hoặc video.'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const handleMedia = (req, res, next) => {
    upload.single('media')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// Bài viết cộng đồng
router.get('/posts', communityController.getAllPosts);
router.post('/posts', authenticate, handleMedia, communityController.createPost);
router.delete('/posts/:postId', authenticate, authorizeAdmin, communityController.deletePost);

// Bình luận
router.get('/posts/:postId/comments', communityController.getCommentsByPost);
router.post('/posts/:postId/comments', authenticate, communityController.addComment);

// Like
router.post('/posts/:postId/like', authenticate, communityController.toggleLike);

module.exports = router;
