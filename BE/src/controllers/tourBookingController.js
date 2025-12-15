const tourBookingService = require('../services/tourBookingService');

exports.book = async (req, res) => {
    try {
        const payload = { ...req.body, ma_tour: req.params.id };
        const result = await tourBookingService.bookTour(req.user.ma_nguoi_dung, payload);
        res.status(201).json({ message: 'Đặt tour thành công', ...result });
    } catch (err) {
        console.error('Book tour error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Partner xem thống kê lượt đặt của mình
exports.partnerStats = async (req, res) => {
    try {
        const partnerId = req.partner?.ma_partner;
        if (!partnerId) return res.status(403).json({ message: 'Chỉ đối tác đã duyệt.' });
        const stats = await tourBookingService.countByPartner(partnerId);
        res.json({ partnerId, ...stats });
    } catch (err) {
        console.error('Partner booking stats error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// User xem tour đã đặt
exports.listMyTourBookings = async (req, res) => {
    try {
        const rows = await tourBookingService.listByUser(req.user.ma_nguoi_dung);
        res.json(rows);
    } catch (err) {
        console.error('List my tour bookings error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
