const partnerService = require('../services/partnerService');
const tourService = require('../services/tourService');

// Partner đăng ký, chờ duyệt
exports.register = async (req, res) => {
    try {
        const id = await partnerService.register(req.user.ma_nguoi_dung, req.body);
        res.status(201).json({
            message: 'Đăng ký đối tác thành công, vui lòng chờ admin duyệt.',
            ma_partner: id
        });
    } catch (err) {
        console.error('Register partner error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Admin duyệt / từ chối partner
exports.approve = async (req, res) => {
    try {
        await partnerService.approve(req.params.id, req.body.trang_thai);
        res.json({ message: 'Cập nhật trạng thái đối tác thành công.' });
    } catch (err) {
        console.error('Approve partner error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Partner tạo tour
exports.createTour = async (req, res) => {
    const userId = req.user.ma_nguoi_dung;
    try {
        const partnerRepo = require('../repositories/partnerRepository');
        const partner = await partnerRepo.findByUserId(userId);
        if (!partner || partner.trang_thai !== 'active') {
            return res.status(403).json({ message: 'Bạn chưa được duyệt đối tác.' });
        }
        const tour = await tourService.createTour({
            tieu_de: req.body.ten_tour || req.body.tieu_de,
            so_ngay: req.body.so_ngay,
            so_dem: req.body.so_dem,
            gia: req.body.don_gia || req.body.gia,
            mo_ta: req.body.mo_ta,
            anh: req.body.anh,
            ma_partner: partner.ma_partner
        });
        res.status(201).json(tour);
    } catch (err) {
        console.error('Create tour error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Doanh thu partner: tổng hợp từ PartnerCommission
exports.getRevenue = async (req, res) => {
    try {
        const data = await partnerService.getRevenue(req.user.ma_nguoi_dung);
        res.json(data);
    } catch (err) {
        console.error('Get revenue error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Ví partner + rút tiền (reuse YeuCauRutTien & LichSuVi)
exports.getWallet = async (req, res) => {
    try {
        const data = await partnerService.getWallet(req.user.ma_nguoi_dung);
        res.json(data);
    } catch (err) {
        console.error('Get partner wallet error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
