const guideRepo = require('../repositories/guideRepository');

const validateApplication = (payload) => {
    const { gioi_thieu, chuyen_mon, tai_lieu_xac_thuc, kinh_nghiem, anh_chan_dung, anh_cccd, anh_chung_chi } = payload;
    if (!gioi_thieu || !chuyen_mon) {
        const err = new Error('Thiếu thông tin: giới thiệu và chuyên môn là bắt buộc.');
        err.status = 400;
        throw err;
    }
    if (!anh_chan_dung || !anh_cccd || !anh_chung_chi) {
        const err = new Error('Vui lòng tải lên ảnh chân dung, ảnh CCCD và ảnh chứng chỉ.');
        err.status = 400;
        throw err;
    }
    if (kinh_nghiem !== undefined && Number(kinh_nghiem) < 0) {
        const err = new Error('Kinh nghiệm không hợp lệ.');
        err.status = 400;
        throw err;
    }
};

exports.apply = async (userId, payload) => {
    validateApplication(payload);

    const existingGuide = await guideRepo.findGuideByUserId(userId);
    if (existingGuide) {
        const err = new Error('Bạn đã là hướng dẫn viên.');
        err.status = 400;
        throw err;
    }

    const existingApp = await guideRepo.findApplicationByUserId(userId);
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

    const id = await guideRepo.createApplication({
        ma_nguoi_dung: userId,
        gioi_thieu: payload.gioi_thieu,
        chuyen_mon: payload.chuyen_mon,
        tai_lieu_xac_thuc: JSON.stringify({
            anh_chan_dung: payload.anh_chan_dung,
            anh_cccd: payload.anh_cccd,
            anh_chung_chi: payload.anh_chung_chi,
            tai_lieu_khac: payload.tai_lieu_xac_thuc || null
        }),
        kinh_nghiem: payload.kinh_nghiem ?? 0
    });
    return id;
};

exports.getMyStatus = async (userId) => {
    const app = await guideRepo.findApplicationByUserId(userId);
    const guide = await guideRepo.findGuideByUserId(userId);
    return { application: app, guide };
};

exports.listApplications = async (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const status = query.status || null;
    const { rows, total } = await guideRepo.listApplications(limit, offset, status);
    return { page, limit, total, data: rows };
};

exports.listFeatured = async (limit = 4) => {
    return guideRepo.listActiveGuides(limit);
};

exports.updateApplicationStatus = async (id, status, ly_do) => {
    if (!['approved', 'rejected'].includes(status)) {
        const err = new Error('Trạng thái không hợp lệ.');
        err.status = 400;
        throw err;
    }
    const affected = await guideRepo.updateApplicationStatus(id, status, ly_do || '');
    if (!affected) {
        const err = new Error('Không tìm thấy hồ sơ.');
        err.status = 404;
        throw err;
    }
};

exports.approveApplication = async (id) => {
    const app = await guideRepo.findApplicationById(id);
    if (!app) {
        const err = new Error('Không tìm thấy hồ sơ.');
        err.status = 404;
        throw err;
    }
    if (app.trang_thai === 'approved') {
        return { guide_id: app.ma_nguoi_dung };
    }
    const existingGuide = await guideRepo.findGuideByUserId(app.ma_nguoi_dung);
    if (!existingGuide) {
        await guideRepo.createGuideFromApplication(app);
    }
    // cập nhật avatar từ hồ sơ nếu có
    try {
        if (app.tai_lieu_xac_thuc) {
            const parsed = JSON.parse(app.tai_lieu_xac_thuc);
            const avatar = parsed?.anh_chan_dung;
            if (avatar) {
                await guideRepo.updateUserAvatar(app.ma_nguoi_dung, avatar);
            }
        }
    } catch (_) {
        // ignore parse errors
    }
    await guideRepo.updateApplicationStatus(id, 'approved');
    return { guide_id: app.ma_nguoi_dung };
};
