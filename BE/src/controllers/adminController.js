const adminService = require('../services/adminService');

// Người dùng
exports.listUsers = async (req, res) => {
    try {
        const data = await adminService.listUsers(req.query);
        res.json(data);
    } catch (error) {
        console.error('List users error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách người dùng.' });
    }
};

exports.lockUser = async (req, res) => {
    try {
        await adminService.lockUser(req.params.id);
        res.json({ message: 'Đã khóa người dùng.' });
    } catch (error) {
        console.error('Lock user error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể khóa người dùng.' });
    }
};

exports.unlockUser = async (req, res) => {
    try {
        await adminService.unlockUser(req.params.id);
        res.json({ message: 'Đã mở khóa người dùng.' });
    } catch (error) {
        console.error('Unlock user error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể mở khóa người dùng.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id);
        res.json({ message: 'Đã xóa người dùng.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể xóa người dùng.' });
    }
};

// Đối tác
exports.listPartners = async (req, res) => {
    try {
        const data = await adminService.listPartners(req.query);
        res.json(data);
    } catch (error) {
        console.error('List partners error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách đối tác.' });
    }
};

// Tour
exports.listTours = async (req, res) => {
    try {
        const data = await adminService.listTours(req.query);
        res.json(data);
    } catch (error) {
        console.error('List tours error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách tour.' });
    }
};

// Guide
exports.listGuides = async (req, res) => {
    try {
        const data = await adminService.listGuides(req.query);
        res.json(data);
    } catch (error) {
        console.error('List guides error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách guide.' });
    }
};

// Lễ hội / đặc sản / địa điểm
exports.listDiaDiem = async (req, res) => {
    try {
        const data = await adminService.listDiaDiem(req.query);
        res.json(data);
    } catch (error) {
        console.error('List dia diem error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách địa điểm.' });
    }
};

exports.listDacSan = async (req, res) => {
    try {
        const data = await adminService.listDacSan(req.query);
        res.json(data);
    } catch (error) {
        console.error('List dac san error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách đặc sản.' });
    }
};

exports.listLeHoi = async (req, res) => {
    try {
        const data = await adminService.listLeHoi(req.query);
        res.json(data);
    } catch (error) {
        console.error('List le hoi error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách lễ hội.' });
    }
};

// Voucher
exports.listVouchers = async (req, res) => {
    try {
        const data = await adminService.listVouchers(req.query);
        res.json(data);
    } catch (error) {
        console.error('List vouchers error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách voucher.' });
    }
};

// Giao dịch ví
exports.listWalletTransactions = async (req, res) => {
    try {
        const data = await adminService.listWalletTransactions(req.query);
        res.json(data);
    } catch (error) {
        console.error('List wallet transactions error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải lịch sử giao dịch ví.' });
    }
};
