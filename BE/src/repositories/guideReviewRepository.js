const pool = require('../config/db');

exports.findByBooking = async (bookingId, userId) => {
    const [rows] = await pool.query(
        'SELECT * FROM GuideReview WHERE ma_booking = ? AND ma_nguoi_dung = ? LIMIT 1',
        [bookingId, userId]
    );
    return rows[0] || null;
};

exports.findByBookingId = async (bookingId) => {
    const [rows] = await pool.query(
        'SELECT * FROM GuideReview WHERE ma_booking = ? LIMIT 1',
        [bookingId]
    );
    return rows[0] || null;
};

exports.createReview = async ({ ma_guide, ma_nguoi_dung, ma_booking, rating, nhan_xet }) => {
    const [res] = await pool.query(
        `INSERT INTO GuideReview (ma_guide, ma_nguoi_dung, ma_booking, rating, nhan_xet)
         VALUES (?, ?, ?, ?, ?)`,
        [ma_guide, ma_nguoi_dung, ma_booking, rating, nhan_xet || null]
    );
    return res.insertId;
};

exports.listByGuide = async (guideId, limit = 20, offset = 0) => {
    const [rows] = await pool.query(
        `SELECT gr.*, nd.ho_ten, nd.anh_dai_dien
         FROM GuideReview gr
         JOIN NguoiDung nd ON gr.ma_nguoi_dung = nd.ma_nguoi_dung
         WHERE gr.ma_guide = ?
         ORDER BY gr.ngay_danh_gia DESC
         LIMIT ? OFFSET ?`,
        [guideId, limit, offset]
    );
    return rows;
};
