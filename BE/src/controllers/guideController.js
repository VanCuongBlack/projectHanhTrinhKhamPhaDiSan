const guideService = require('../services/guideService');

// User gửi hồ sơ đăng ký guide
exports.apply = async (req, res) => {
    try {
        const files = req.files || {};
        const toRel = (file) => file?.path ? `/uploads/guides/${file.filename}` : null;
        const payload = {
            ...req.body,
            anh_chan_dung: toRel(files.anh_chan_dung?.[0]),
            anh_cccd: toRel(files.anh_cccd?.[0]),
            anh_chung_chi: toRel(files.anh_chung_chi?.[0]),
        };
        const id = await guideService.apply(req.user.ma_nguoi_dung, payload);
        res.status(201).json({ message: 'Đã gửi hồ sơ, vui lòng chờ duyệt.', application_id: id });
    } catch (err) {
        console.error('Guide apply error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// User xem trạng thái hồ sơ / guide
exports.getMyStatus = async (req, res) => {
    try {
        const data = await guideService.getMyStatus(req.user.ma_nguoi_dung);
        res.json(data);
    } catch (err) {
        console.error('Guide status error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Admin: duyệt / từ chối hồ sơ
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, ly_do } = req.body;
        if (status === 'approved') {
            await guideService.approveApplication(req.params.id);
        } else {
            await guideService.updateApplicationStatus(req.params.id, status, ly_do);
        }
        res.json({ message: 'Cập nhật hồ sơ thành công.' });
    } catch (err) {
        console.error('Guide app update error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Admin: danh sách hồ sơ
exports.listApplications = async (req, res) => {
    try {
        const data = await guideService.listApplications(req.query);
        // parse JSON trường tai_lieu_xac_thuc để FE dễ hiển thị link ảnh
        const mapped = {
            ...data,
            data: data.data.map((row) => ({
                ...row,
                tai_lieu_parsed: (() => {
                    try {
                        return row.tai_lieu_xac_thuc ? JSON.parse(row.tai_lieu_xac_thuc) : {};
                    } catch (_) {
                        return {};
                    }
                })()
            }))
        };
        res.json(mapped);
    } catch (err) {
        console.error('Guide app list error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

// Public: featured guides (random active)
exports.listFeatured = async (req, res) => {
    try {
        const data = await guideService.listFeatured(req.query.limit ? Number(req.query.limit) : 4);
        res.json(data);
    } catch (err) {
        console.error('Guide featured error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
