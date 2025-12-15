const guideScheduleService = require('../services/guideScheduleService');

// Guide tạo slot rảnh
exports.createSlot = async (req, res) => {
    try {
        const result = await guideScheduleService.createSlot(req.user.ma_nguoi_dung, req.body);
        res.status(201).json({ message: 'Tạo lịch thành công', ...result });
    } catch (err) {
        console.error('Guide create slot error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Guide xem lịch của mình
exports.listMySchedule = async (req, res) => {
    try {
        const rows = await guideScheduleService.listMySchedule(req.user.ma_nguoi_dung);
        res.json(rows);
    } catch (err) {
        console.error('Guide list schedule error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// User tìm slot free theo ngày
exports.searchAvailable = async (req, res) => {
    try {
        const rows = await guideScheduleService.searchAvailable(req.query.ngay);
        res.json(rows);
    } catch (err) {
        console.error('Guide search schedule error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Public slot detail
exports.getSlot = async (req, res) => {
    try {
        const slot = await guideScheduleService.getSlotPublic(req.params.id);
        res.json(slot);
    } catch (err) {
        console.error('Guide slot detail error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// User đặt slot
exports.book = async (req, res) => {
    try {
        const result = await guideScheduleService.bookGuide(req.user.ma_nguoi_dung, req.body);
        res.status(201).json({ message: 'Đặt lịch thành công', ...result });
    } catch (err) {
        console.error('Guide booking error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Guide xem danh sách khách đã book
exports.listMyBookings = async (req, res) => {
    try {
        const rows = await guideScheduleService.listGuideBookings(req.user.ma_nguoi_dung);
        res.json(rows);
    } catch (err) {
        console.error('Guide list bookings error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// User xem booking của mình
exports.listUserBookings = async (req, res) => {
    try {
        const rows = await guideScheduleService.listUserBookings(req.user.ma_nguoi_dung);
        res.json(rows);
    } catch (err) {
        console.error('User guide bookings error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
