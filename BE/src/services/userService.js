const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/userRepository');
const voucherRepo = require('../repositories/voucherRepository');
const checkinRepo = require('../repositories/checkinRepository');
const walletRepo = require('../repositories/walletRepository');
const pool = require('../config/db');

const phoneRegex = /^[0-9]{8,15}$/;

exports.getProfile = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) {
        const err = new Error('Không tìm thấy người dùng.');
        err.status = 404;
        throw err;
    }

    const wallet = await walletRepo.getWallet(userId);

    return {
        ma_nguoi_dung: user.ma_nguoi_dung,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        vai_tro: user.vai_tro,
        anh_dai_dien: user.anh_dai_dien,
        trang_thai: user.trang_thai,
        ngay_tao: user.ngay_tao,
        vi: wallet || { so_du: 0, currency: 'VND' }
    };
};

exports.updateProfile = async (userId, payload) => {
    const updates = {};
    if (payload.ho_ten) updates.ho_ten = payload.ho_ten.trim();
    if (payload.so_dien_thoai) {
        if (!phoneRegex.test(payload.so_dien_thoai)) {
            const err = new Error('Số điện thoại không hợp lệ.');
            err.status = 400;
            throw err;
        }
        updates.so_dien_thoai = payload.so_dien_thoai;
    }
    const affected = await userRepo.updateProfile(userId, updates);
    if (!affected) {
        const err = new Error('Không có dữ liệu để cập nhật.');
        err.status = 400;
        throw err;
    }
    return exports.getProfile(userId);
};

exports.changePassword = async (userId, { mat_khau_cu, mat_khau_moi, confirm_mat_khau_moi }) => {
    if (!mat_khau_cu || !mat_khau_moi || !confirm_mat_khau_moi) {
        const err = new Error('Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận.');
        err.status = 400;
        throw err;
    }
    if (mat_khau_moi.length < 8) {
        const err = new Error('Mật khẩu mới cần ít nhất 8 ký tự.');
        err.status = 400;
        throw err;
    }
    if (mat_khau_moi !== confirm_mat_khau_moi) {
        const err = new Error('Mật khẩu mới và xác nhận không khớp.');
        err.status = 400;
        throw err;
    }

    const user = await userRepo.findById(userId);
    if (!user) {
        const err = new Error('Không tìm thấy người dùng.');
        err.status = 404;
        throw err;
    }
    const isMatch = await bcrypt.compare(mat_khau_cu, user.password_hash);
    if (!isMatch) {
        const err = new Error('Mật khẩu cũ không chính xác.');
        err.status = 400;
        throw err;
    }
    const hashed = await bcrypt.hash(mat_khau_moi, 10);
    await userRepo.updatePassword(userId, hashed);
    return true;
};

exports.updateAvatar = async (userId, relativePath) => {
    await userRepo.updateProfile(userId, { anh_dai_dien: relativePath });
    return relativePath;
};

exports.getCheckInHistory = async (userId) => {
    return checkinRepo.listCheckins(userId);
};

exports.getUserVouchers = async (userId) => {
    return voucherRepo.listUserVouchers(userId);
};

exports.getWalletHistory = async (userId) => {
    const wallet = await walletRepo.getWallet(userId);
    const transactions = await walletRepo.getHistory(userId);
    return {
        so_du: wallet?.so_du || 0,
        currency: wallet?.currency || 'VND',
        lich_su: transactions
    };
};
