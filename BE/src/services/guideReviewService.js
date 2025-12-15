const guideReviewRepo = require('../repositories/guideReviewRepository');
const bookingRepo = require('../repositories/guideBookingRepository');
const guideRepo = require('../repositories/guideRepository');

exports.addReview = async (userId, bookingId, payload) => {
    const { rating, nhan_xet } = payload;
    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        const err = new Error('Rating phải từ 1 đến 5.');
        err.status = 400;
        throw err;
    }
    const bookings = await bookingRepo.listMyBookings(userId);
    const booking = bookings.find((b) => b.id === Number(bookingId));
    if (!booking) {
        const err = new Error('Booking không thuộc bạn.');
        err.status = 403;
        throw err;
    }
    // không cho nhiều review trên 1 booking
    const existingBookingReview = await guideReviewRepo.findByBookingId(bookingId);
    if (existingBookingReview) {
        const err = new Error('Booking này đã được đánh giá.');
        err.status = 400;
        throw err;
    }
    // chỉ cho review khi đã completed hoặc confirmed (tùy policy)
    if (booking.trang_thai !== 'completed' && booking.trang_thai !== 'confirmed') {
        const err = new Error('Chỉ review sau khi hoàn thành booking.');
        err.status = 400;
        throw err;
    }
    const insertId = await guideReviewRepo.createReview({
        ma_guide: booking.ma_guide,
        ma_nguoi_dung: userId,
        ma_booking: bookingId,
        rating: Number(rating),
        nhan_xet: nhan_xet || null
    });
    return insertId;
};

exports.listByGuide = async (guideId, query) => {
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
    return guideReviewRepo.listByGuide(guideId, limit, offset);
};
