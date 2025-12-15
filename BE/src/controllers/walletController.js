const pool = require('../config/db');
const walletService = require('../services/walletService');

// Nạp tiền ví qua VNPAY: tạo giao dịch pending + trả URL thanh toán
exports.requestTopUp = async (req, res) => {
    const userId = req.user.ma_nguoi_dung;
    const { so_tien, bankCode, noi_dung } = req.body;

    try {
        const result = await walletService.requestTopUp(req, userId, { so_tien, bankCode, noi_dung });
        res.status(201).json({
            message: 'Tạo giao dịch nạp tiền thành công. Chuyển hướng tới VNPAY để thanh toán.',
            giao_dich_id: result.txnId,
            paymentUrl: result.paymentUrl
        });
    } catch (err) {
        console.error('Request top-up error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Thanh toán dịch vụ bằng ví (trừ tiền ngay nếu đủ số dư)
exports.payWithWallet = async (req, res) => {
    try {
        const result = await walletService.payWithWallet(req.user.ma_nguoi_dung, req.body);
        res.json({
            message: 'Thanh toán thành công.',
            giao_dich_id: result.txId,
            so_du_con_lai: result.so_du_con_lai,
            so_tien_giam: result.discount,
            so_tien_thanh_toan: result.payable
        });
    } catch (err) {
        console.error('Pay with wallet error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Lịch sử giao dịch ví
exports.getHistory = async (req, res) => {
    try {
        const data = await walletService.getHistory(req.user.ma_nguoi_dung);
        res.json(data);
    } catch (err) {
        console.error('Get wallet history error:', err);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

// Rút tiền: chỉ partner hoặc guide, tạo yêu cầu chờ duyệt
exports.requestWithdraw = async (req, res) => {
    try {
        const result = await walletService.requestWithdraw(req.user.ma_nguoi_dung, req.user.vai_tro, req.body);
        res.status(201).json({
            message: 'Tạo yêu cầu rút tiền thành công, đang chờ duyệt.',
            yeu_cau_id: result.withdrawId,
            giao_dich_id: result.txId,
            so_du_con_lai: result.so_du_con_lai
        });
    } catch (err) {
        console.error('Request withdraw error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Admin: danh sách yêu cầu rút tiền
exports.listWithdrawRequests = async (req, res) => {
    try {
        const data = await walletService.listWithdrawRequests(req.query);
        res.json(data);
    } catch (err) {
        console.error('List withdraw requests error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Admin: duyệt / từ chối yêu cầu rút
exports.reviewWithdraw = async (req, res) => {
    try {
        const { status, ly_do } = req.body;
        const result = await walletService.reviewWithdraw(req.user.ma_nguoi_dung, req.params.id, status, ly_do);
        res.json({ message: 'Cập nhật yêu cầu rút thành công.', status: result.status });
    } catch (err) {
        console.error('Review withdraw error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Callback/return từ VNPAY để xác nhận giao dịch nạp tiền
exports.vnpayReturn = async (req, res) => {
    const buildRedirectUrl = (isSuccess, payload = {}) => {
        const rawUrl =
            (process.env.FRONTEND_WALLET_URL && process.env.FRONTEND_WALLET_URL.trim()) ||
            (process.env.FRONTEND_BASE_URL && `${process.env.FRONTEND_BASE_URL.replace(/\/$/, '')}/wallet`) ||
            'http://localhost:5173/wallet';
        const url = new URL(rawUrl);
        url.searchParams.set('status', isSuccess ? (payload.trang_thai || 'thanh_cong') : 'that_bai');
        if (payload.txnRef) url.searchParams.set('txn', payload.txnRef);
        if (payload.amount) url.searchParams.set('amount', payload.amount);
        if (!isSuccess && payload.message) url.searchParams.set('message', payload.message);
        return url.toString();
    };

    try {
        const result = await walletService.vnpayReturn(req.query);
        return res.redirect(buildRedirectUrl(true, result));
    } catch (err) {
        console.error('VNPAY return error:', err);
        return res.redirect(buildRedirectUrl(false, { message: err.message }));
    }
};
