const tourService = require('../services/tourService');
const partnerRepo = require('../repositories/partnerRepository');

// Lấy danh sách tour
exports.getAllTours = async (req, res) => {
    try {
        const tours = await tourService.listTours();
        res.json(tours);
    } catch (error) {
        console.error('Error fetching Tour:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách tour du lịch.' });
    }
};

// Thêm tour
exports.createTour = async (req, res) => {
    try {
        const payload = { ...req.body };
        // nếu user là partner (đã qua partnerGuard), luôn gán ma_partner
        if (req.partner?.ma_partner) {
            payload.ma_partner = req.partner.ma_partner;
        }
        // chuẩn hóa lich_trinh nếu FE gửi object/array
        if (payload.lich_trinh && typeof payload.lich_trinh !== 'string') {
            payload.lich_trinh = JSON.stringify(payload.lich_trinh);
        }
        if (payload.media && typeof payload.media !== 'string') {
            payload.media = JSON.stringify(payload.media);
        }
        const tour = await tourService.createTour(payload);
        res.status(201).json(tour);
    } catch (error) {
        console.error('Error creating Tour:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tạo tour du lịch.' });
    }
};

// Cập nhật tour
exports.updateTour = async (req, res) => {
    try {
        const tour = await tourService.updateTour(req.params.id, req.body);
        res.json(tour);
    } catch (error) {
        console.error('Error updating Tour:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể cập nhật tour.' });
    }
};

// Xóa tour
exports.deleteTour = async (req, res) => {
    try {
        await tourService.deleteTour(req.params.id);
        res.json({ message: 'Đã xóa tour du lịch thành công.' });
    } catch (error) {
        console.error('Error deleting Tour:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể xóa tour.' });
    }
};

// Upload media (ảnh/video) cho tour
exports.uploadTourMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file.' });
        }
        const url = `/uploads/tours/${req.file.filename}`;
        res.status(201).json({ url });
    } catch (error) {
        console.error('Upload tour media error:', error);
        res.status(500).json({ message: 'Không thể upload media.' });
    }
};
