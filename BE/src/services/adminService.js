const adminRepo = require('../repositories/adminRepository');

const parsePagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

exports.listUsers = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listUsers(limit, offset);
    return { page, limit, total, data: rows };
};

exports.lockUser = async (id) => {
    const affected = await adminRepo.setUserStatus(id, 'banned');
    if (!affected) {
        const err = new Error('Không tìm thấy người dùng.');
        err.status = 404;
        throw err;
    }
};

exports.unlockUser = async (id) => {
    const affected = await adminRepo.setUserStatus(id, 'active');
    if (!affected) {
        const err = new Error('Không tìm thấy người dùng.');
        err.status = 404;
        throw err;
    }
};

exports.deleteUser = async (id) => {
    const affected = await adminRepo.deleteUser(id);
    if (!affected) {
        const err = new Error('Không tìm thấy người dùng.');
        err.status = 404;
        throw err;
    }
};

exports.listPartners = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listPartners(limit, offset);
    return { page, limit, total, data: rows };
};

exports.listTours = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listTours(limit, offset);
    return { page, limit, total, data: rows };
};

exports.listGuides = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listGuides(limit, offset);
    return { page, limit, total, data: rows };
};

exports.listDiaDiem = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listDiaDiem(limit, offset);
    return { page, limit, total, data: rows };
};

exports.listDacSan = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listDacSan(limit, offset);
    return { page, limit, total, data: rows };
};

exports.listLeHoi = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listLeHoi(limit, offset);
    return { page, limit, total, data: rows };
};

exports.listVouchers = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listVouchers(limit, offset);
    return { page, limit, total, data: rows };
};

exports.listWalletTransactions = async (query) => {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await adminRepo.listWalletTransactions(limit, offset);
    return { page, limit, total, data: rows };
};
