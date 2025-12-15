const voucherService = require('../services/voucherService');

exports.createVoucher = async (req, res) => {
    try {
        const voucher = await voucherService.createVoucher(req.body);
        res.status(201).json({ message: 'Tạo voucher thành công.', voucher });
    } catch (err) {
        console.error('Create voucher error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

exports.assignVoucherToUser = async (req, res) => {
    const { voucherId } = req.params;
    const { ma_nguoi_dung } = req.body;

    if (!ma_nguoi_dung) {
        return res.status(400).json({ message: 'Thiếu mã người dùng.' });
    }

    try {
        await voucherService.assignVoucherToUser(voucherId, ma_nguoi_dung);
        res.json({ message: 'Gán voucher thành công.' });
    } catch (err) {
        console.error('Assign voucher error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Admin gán voucher cho tất cả hoặc danh sách user
exports.assignVoucherBulk = async (req, res) => {
    const { voucherId } = req.params;
    try {
        const result = await voucherService.assignVoucherBulk(voucherId, req.body);
        res.json({ message: 'Gán voucher thành công.', result });
    } catch (err) {
        console.error('Assign voucher bulk error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Kiểm tra và tính toán giảm giá cho user
exports.applyVoucher = async (req, res) => {
    try {
        const result = await voucherService.applyVoucher(req.user.ma_nguoi_dung, req.body);
        res.json({
            message: 'Voucher hợp lệ.',
            ...result
        });
    } catch (err) {
        console.error('Apply voucher error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// User: xem ví voucher
exports.listMyVouchers = async (req, res) => {
    try {
        const list = await voucherService.listMyVouchers(req.user.ma_nguoi_dung);
        res.json(list);
    } catch (err) {
        console.error('List my vouchers error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
