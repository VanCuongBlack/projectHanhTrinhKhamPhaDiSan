const voucherRepo = require('../repositories/voucherRepository');

const validateVoucherPayload = (payload) => {
    const { code, tieu_de, giam_phan_tram, giam_toi_da, ngay_bat_dau, ngay_ket_thuc } = payload;
    if (!code) return 'Mã voucher là bắt buộc.';
    if (!tieu_de) return 'Tiêu đề là bắt buộc.';
    if (giam_phan_tram === undefined || Number(giam_phan_tram) <= 0 || Number(giam_phan_tram) > 100) {
        return 'Giảm phần trăm phải trong khoảng 0 - 100.';
    }
    if (giam_toi_da === undefined || Number(giam_toi_da) < 0) {
        return 'Giảm tối đa phải >= 0.';
    }
    if (!ngay_bat_dau || !ngay_ket_thuc) {
        return 'Thiếu ngày bắt đầu/kết thúc.';
    }
    return null;
};

exports.createVoucher = async (payload) => {
    const errMsg = validateVoucherPayload(payload);
    if (errMsg) {
        const err = new Error(errMsg);
        err.status = 400;
        throw err;
    }
    const id = await voucherRepo.create(payload);
    return voucherRepo.findById(id);
};

exports.assignVoucherToUser = async (voucherId, userId) => {
    const voucher = await voucherRepo.findById(voucherId);
    if (!voucher) {
        const err = new Error('Không tìm thấy voucher.');
        err.status = 404;
        throw err;
    }
    await voucherRepo.assignToUser(voucherId, userId);
    return true;
};

exports.assignVoucherBulk = async (voucherId, { apply_all = false, user_ids = [] }) => {
    const voucher = await voucherRepo.findById(voucherId);
    if (!voucher) {
        const err = new Error('Không tìm thấy voucher.');
        err.status = 404;
        throw err;
    }
    if (apply_all) {
        await voucherRepo.assignToAllUsers(voucherId);
        return { applied: 'all' };
    }
    const ids = (user_ids || []).filter((id) => !!id).map((id) => Number(id));
    if (!ids.length) {
        const err = new Error('Danh sách người dùng trống.');
        err.status = 400;
        throw err;
    }
    await voucherRepo.assignToUsers(voucherId, ids);
    return { applied: ids.length };
};

exports.listMyVouchers = async (userId) => {
    return voucherRepo.listUserVouchers(userId);
};

exports.applyVoucher = async (userId, { ma_voucher, tong_tien }) => {
    if (!ma_voucher || !tong_tien || Number(tong_tien) <= 0) {
        const err = new Error('Thiếu mã voucher hoặc tổng tiền không hợp lệ.');
        err.status = 400;
        throw err;
    }
    const voucher = await voucherRepo.getUserVoucher(userId, ma_voucher);
    if (!voucher) {
        const err = new Error('Voucher không thuộc người dùng hoặc không tồn tại.');
        err.status = 404;
        throw err;
    }
    if (voucher.da_dung) {
        const err = new Error('Voucher đã được sử dụng.');
        err.status = 400;
        throw err;
    }
    if (voucher.trang_thai !== 'active') {
        const err = new Error('Voucher không còn hiệu lực.');
        err.status = 400;
        throw err;
    }
    const now = new Date();
    if (voucher.ngay_bat_dau && now < new Date(voucher.ngay_bat_dau)) {
        const err = new Error('Voucher chưa đến thời gian sử dụng.');
        err.status = 400;
        throw err;
    }
    if (voucher.ngay_ket_thuc && now > new Date(voucher.ngay_ket_thuc)) {
        const err = new Error('Voucher đã hết hạn.');
        err.status = 400;
        throw err;
    }

    const giam = Math.min(
        Number(tong_tien) * Number(voucher.giam_phan_tram) / 100,
        Number(voucher.giam_toi_da)
    );
    const thanh_toan = Math.max(0, Number(tong_tien) - giam);

    return {
        so_tien_giam: giam,
        so_tien_thanh_toan: thanh_toan,
        voucher_user_id: voucher.voucher_user_id
    };
};
