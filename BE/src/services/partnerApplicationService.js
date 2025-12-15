const partnerAppRepo = require('../repositories/partnerApplicationRepository');
const partnerRepo = require('../repositories/partnerRepository');

const validatePayload = (payload) => {
    const { ten_cong_ty, ma_so_thue, email_cong_ty, giay_phep_kinh_doanh } = payload;
    if (!ten_cong_ty || !ma_so_thue || !email_cong_ty || !giay_phep_kinh_doanh) {
        const err = new Error('Thiếu thông tin: tên công ty, mã số thuế, email và giấy phép kinh doanh là bắt buộc.');
        err.status = 400;
        throw err;
    }
};

exports.apply = async (userId, payload) => {
    validatePayload(payload);
    const existingPartner = await partnerRepo.findByUserId(userId);
    if (existingPartner) {
        const err = new Error('Bạn đã là đối tác hoặc đang chờ duyệt.');
        err.status = 400;
        throw err;
    }
    const existingApp = await partnerAppRepo.findByUserId(userId);
    if (existingApp && existingApp.trang_thai === 'pending') {
        const err = new Error('Bạn đã gửi hồ sơ và đang chờ duyệt.');
        err.status = 400;
        throw err;
    }
    if (existingApp && existingApp.trang_thai === 'approved') {
        const err = new Error('Hồ sơ đã được duyệt.');
        err.status = 400;
        throw err;
    }
    const id = await partnerAppRepo.create({
        ...payload,
        ma_nguoi_dung: userId,
    });
    return id;
};

exports.getMyStatus = async (userId) => {
    const app = await partnerAppRepo.findByUserId(userId);
    const partner = await partnerRepo.findByUserId(userId);
    return { application: app, partner };
};

exports.listApplications = async (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const status = query.status || null;
    const { rows, total } = await partnerAppRepo.list(limit, offset, status);
    return { page, limit, total, data: rows };
};

exports.updateApplicationStatus = async (id, status) => {
    if (!['approved', 'rejected'].includes(status)) {
        const err = new Error('Trạng thái không hợp lệ.');
        err.status = 400;
        throw err;
    }
    const affected = await partnerAppRepo.updateStatus(id, status);
    if (!affected) {
        const err = new Error('Không tìm thấy hồ sơ.');
        err.status = 404;
        throw err;
    }
};

exports.approveApplication = async (id) => {
    const app = await partnerAppRepo.findById(id);
    if (!app) {
        const err = new Error('Không tìm thấy hồ sơ.');
        err.status = 404;
        throw err;
    }
    if (app.trang_thai === 'approved') {
        return { partner_id: app.ma_nguoi_dung };
    }
    const existing = await partnerRepo.findByUserId(app.ma_nguoi_dung);
    if (!existing) {
        await partnerRepo.create({
            ten_cong_ty: app.ten_cong_ty,
            email: app.email_cong_ty,
            so_dien_thoai: app.so_dien_thoai,
            dia_chi: app.dia_chi,
            ma_so_thue: app.ma_so_thue,
            ma_nguoi_dung: app.ma_nguoi_dung,
            commission_percent: 10,
        });
    } else if (existing.trang_thai !== 'active') {
        await partnerRepo.updateStatus(existing.ma_partner, 'active');
    }
    await partnerAppRepo.updateStatus(id, 'approved');
    return { partner_id: app.ma_nguoi_dung };
};
