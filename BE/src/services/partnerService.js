const partnerRepo = require('../repositories/partnerRepository');
const walletRepo = require('../repositories/walletRepository');

exports.register = async (userId, payload) => {
    const { ten_cong_ty, email, so_dien_thoai, dia_chi, ma_so_thue, commission_percent = 10 } = payload;
    if (!ten_cong_ty || !email || !ma_so_thue) {
        const err = new Error('Tên công ty, email và mã số thuế là bắt buộc.');
        err.status = 400;
        throw err;
    }
    if (commission_percent < 0 || commission_percent > 100) {
        const err = new Error('Chiết khấu phải trong khoảng 0% - 100%.');
        err.status = 400;
        throw err;
    }

    const existing = await partnerRepo.findByUserId(userId);
    if (existing) {
        const err = new Error('Bạn đã đăng ký đối tác hoặc đang chờ duyệt.');
        err.status = 400;
        throw err;
    }

    const id = await partnerRepo.create({
        ten_cong_ty,
        email,
        so_dien_thoai,
        dia_chi,
        ma_so_thue,
        ma_nguoi_dung: userId,
        commission_percent
    });
    return id;
};

exports.approve = async (partnerId, trang_thai) => {
    if (!['active', 'inactive'].includes(trang_thai)) {
        const err = new Error('Trạng thái không hợp lệ.');
        err.status = 400;
        throw err;
    }
    const affected = await partnerRepo.updateStatus(partnerId, trang_thai);
    if (!affected) {
        const err = new Error('Không tìm thấy partner.');
        err.status = 404;
        throw err;
    }
};

exports.getRevenue = async (userId) => {
    const partner = await partnerRepo.findByUserId(userId);
    if (!partner || partner.trang_thai !== 'active') {
        const err = new Error('Bạn chưa được duyệt đối tác.');
        err.status = 403;
        throw err;
    }
    return partnerRepo.listRevenue(partner.ma_partner);
};

exports.getWallet = async (userId) => {
    const wallet = await walletRepo.getWallet(userId);
    const transactions = await walletRepo.getHistory(userId);
    return {
        so_du: wallet?.so_du || 0,
        currency: wallet?.currency || 'VND',
        lich_su: transactions
    };
};
