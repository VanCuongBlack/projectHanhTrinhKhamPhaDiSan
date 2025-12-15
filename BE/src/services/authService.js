const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const userRepo = require('../repositories/userRepository');
const pendingRepo = require('../repositories/pendingUserRepository');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{8,15}$/;

const createMailTransporter = () =>
    nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

exports.registerRequest = async ({ ho_ten, email, so_dien_thoai, mat_khau, confirm_mat_khau }) => {
    if (!ho_ten || !email || !so_dien_thoai || !mat_khau || !confirm_mat_khau) {
        const err = new Error('Họ tên, email, số điện thoại, mật khẩu và xác nhận mật khẩu là bắt buộc.');
        err.status = 400;
        throw err;
    }
    if (!emailRegex.test(email)) {
        const err = new Error('Email không hợp lệ.');
        err.status = 400;
        throw err;
    }
    if (!phoneRegex.test(so_dien_thoai)) {
        const err = new Error('Số điện thoại không hợp lệ.');
        err.status = 400;
        throw err;
    }
    if (mat_khau.length < 8) {
        const err = new Error('Mật khẩu cần ít nhất 8 ký tự.');
        err.status = 400;
        throw err;
    }
    if (mat_khau !== confirm_mat_khau) {
        const err = new Error('Mật khẩu và xác nhận chưa trùng khớp.');
        err.status = 400;
        throw err;
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
        const err = new Error('Email đã tồn tại.');
        err.status = 409;
        throw err;
    }

    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(mat_khau, 10);

    await pendingRepo.upsert({
        email,
        mat_khau: hashedPassword,
        ho_ten,
        so_dien_thoai,
        otp,
        otp_expiry: otpExpiry
    });

    const transporter = createMailTransporter();
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Xác thực OTP',
        text: `Mã OTP của bạn là: ${otp}`
    });

    return true;
};

exports.verifyOtp = async ({ email, otp }) => {
    if (!email || !otp) {
        const err = new Error('Email và OTP là bắt buộc.');
        err.status = 400;
        throw err;
    }

    const pending = await pendingRepo.findByEmail(email);
    if (!pending) {
        const err = new Error('Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.');
        err.status = 400;
        throw err;
    }
    if (pending.otp !== otp) {
        const err = new Error('OTP không hợp lệ.');
        err.status = 400;
        throw err;
    }
    if (new Date() > new Date(pending.otp_expiry)) {
        const err = new Error('OTP đã hết hạn.');
        err.status = 400;
        throw err;
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
        await pendingRepo.deleteByEmail(email);
        const err = new Error('Email đã được đăng ký.');
        err.status = 409;
        throw err;
    }

    const userId = await userRepo.create({
        ho_ten: pending.ho_ten,
        email: pending.email,
        password_hash: pending.mat_khau,
        so_dien_thoai: pending.so_dien_thoai,
        vai_tro: 'user',
        trang_thai: 'active'
    });

    await pendingRepo.deleteByEmail(email);
    return userId;
};

exports.login = async ({ email, mat_khau }) => {
    if (!email || !mat_khau) {
        const err = new Error('Email và mật khẩu là bắt buộc.');
        err.status = 400;
        throw err;
    }
    if (!emailRegex.test(email)) {
        const err = new Error('Email không hợp lệ.');
        err.status = 400;
        throw err;
    }

    const user = await userRepo.findByEmail(email);
    if (!user) {
        const err = new Error('Email hoặc mật khẩu không đúng.');
        err.status = 401;
        throw err;
    }
    if (user.trang_thai && user.trang_thai !== 'active') {
        const err = new Error('Tài khoản đang tạm khóa. Vui lòng liên hệ hỗ trợ.');
        err.status = 403;
        throw err;
    }
    const isMatch = await bcrypt.compare(mat_khau, user.password_hash);
    if (!isMatch) {
        const err = new Error('Email hoặc mật khẩu không đúng.');
        err.status = 401;
        throw err;
    }

    if (!process.env.JWT_SECRET) {
        const err = new Error('JWT_SECRET chưa được cấu hình.');
        err.status = 500;
        throw err;
    }

    const token = jwt.sign(
        { ma_nguoi_dung: user.ma_nguoi_dung, email: user.email, vai_tro: user.vai_tro },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    return { token, user };
};

exports.logout = async (token) => {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
        const err = new Error('Invalid token');
        err.status = 400;
        throw err;
    }
    const expiresAt = new Date(decoded.exp * 1000);
    await userRepo.insertRevokedToken(token, expiresAt);
};
