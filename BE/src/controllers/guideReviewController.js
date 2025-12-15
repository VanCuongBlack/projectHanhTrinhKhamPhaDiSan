const guideReviewService = require('../services/guideReviewService');

exports.addReview = async (req, res) => {
    try {
        const id = await guideReviewService.addReview(req.user.ma_nguoi_dung, Number(req.params.bookingId), req.body);
        res.status(201).json({ message: 'Đánh giá thành công', review_id: id });
    } catch (err) {
        console.error('Add guide review error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

exports.listByGuide = async (req, res) => {
    try {
        const data = await guideReviewService.listByGuide(Number(req.params.guideId), req.query);
        res.json(data);
    } catch (err) {
        console.error('List guide reviews error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
