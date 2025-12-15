const authService = require('../services/authService');
const userService = require('../services/userService');

// Đăng ký người dùng mới với OTP (lưu tạm vào PendingUsers)
exports.register = async (req, res) => {
    try {
        await authService.registerRequest(req.body);
        res.status(201).json({ message: 'OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và xác thực.' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Đăng nhập người dùng
exports.login = async (req, res) => {
    try {
        const { token, user } = await authService.login(req.body);
        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                ma_nguoi_dung: user.ma_nguoi_dung,
                email: user.email,
                ho_ten: user.ho_ten,
                so_dien_thoai: user.so_dien_thoai,
                vai_tro: user.vai_tro,
                anh_dai_dien: user.anh_dai_dien
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Chức năng logout
exports.logout = async (req, res) => {
    const token = req.headers['authorization'];
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(400).json({ message: 'Token is required or invalid format' });
    }
    const actualToken = token.split(' ')[1];
    try {
        await authService.logout(actualToken);
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Server error' });
    }
};

// Xác thực OTP và lưu thông tin người dùng vào DB
exports.verifyOtp = async (req, res) => {
    try {
        await authService.verifyOtp(req.body);
        res.json({ message: 'Xác thực OTP thành công! Tài khoản của bạn đã được kích hoạt.' });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Lấy thông tin profile người dùng
exports.getProfile = async (req, res) => {
    try {
        const profile = await userService.getProfile(req.user.ma_nguoi_dung);
        res.json(profile);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Cập nhật thông tin profile (trừ email, mật khẩu)
exports.updateProfile = async (req, res) => {
    try {
        const user = await userService.updateProfile(req.user.ma_nguoi_dung, req.body);
        res.json({ message: 'Cập nhật hồ sơ thành công.', user });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        await userService.changePassword(req.user.ma_nguoi_dung, req.body);
        res.json({ message: 'Đổi mật khẩu thành công.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Cập nhật ảnh đại diện sau khi upload
exports.uploadAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có file được tải lên.' });
    }

    const relativePath = `/uploads/avatars/${req.file.filename}`;

    try {
        await userService.updateAvatar(req.user.ma_nguoi_dung, relativePath);
        res.json({ message: 'Cập nhật ảnh đại diện thành công.', anh_dai_dien: relativePath });
    } catch (err) {
        console.error('Upload avatar error:', err);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

// Lịch sử điểm check-in
exports.getCheckInHistory = async (req, res) => {
    try {
        const rows = await userService.getCheckInHistory(req.user.ma_nguoi_dung);
        res.json(rows);
    } catch (err) {
        console.error('Get check-in history error:', err);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

// Danh sách voucher của người dùng
exports.getUserVouchers = async (req, res) => {
    try {
        const rows = await userService.getUserVouchers(req.user.ma_nguoi_dung);
        res.json(rows);
    } catch (err) {
        console.error('Get vouchers error:', err);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

// Lịch sử giao dịch ví
exports.getWalletHistory = async (req, res) => {
    try {
        const data = await userService.getWalletHistory(req.user.ma_nguoi_dung);
        res.json(data);
    } catch (err) {
        console.error('Get wallet history error:', err);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};
