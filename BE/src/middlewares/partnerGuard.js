const partnerRepo = require('../repositories/partnerRepository');

module.exports = async function partnerGuard(req, res, next) {
    if (req.user?.vai_tro === 'admin') return next();
    try {
        const partner = await partnerRepo.findByUserId(req.user.ma_nguoi_dung);
        if (!partner || partner.trang_thai !== 'active') {
            return res.status(403).json({ message: 'Chỉ đối tác đã duyệt mới được tạo tour.' });
        }
        req.partner = partner;
        next();
    } catch (err) {
        console.error('Partner guard error:', err);
        res.status(500).json({ message: 'Lỗi xác thực đối tác.' });
    }
};
