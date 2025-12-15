const partnerAppService = require('../services/partnerApplicationService');

// User apply partner
exports.apply = async (req, res) => {
    try {
        const files = req.files || {};
        const toRel = (file) => file?.path ? `/uploads/partners/${file.filename}` : null;
        const payload = {
            ...req.body,
            giay_phep_kinh_doanh: toRel(files.giay_phep_kinh_doanh?.[0]),
        };
        const id = await partnerAppService.apply(req.user.ma_nguoi_dung, payload);
        res.status(201).json({ message: 'Đã gửi hồ sơ, vui lòng chờ duyệt.', application_id: id });
    } catch (err) {
        console.error('Partner apply error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

exports.getMyStatus = async (req, res) => {
    try {
        const data = await partnerAppService.getMyStatus(req.user.ma_nguoi_dung);
        res.json(data);
    } catch (err) {
        console.error('Partner status error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

exports.listApplications = async (req, res) => {
    try {
        const data = await partnerAppService.listApplications(req.query);
        res.json(data);
    } catch (err) {
        console.error('Partner app list error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (status === 'approved') {
            await partnerAppService.approveApplication(req.params.id);
        } else {
            await partnerAppService.updateApplicationStatus(req.params.id, status);
        }
        res.json({ message: 'Cập nhật hồ sơ thành công.' });
    } catch (err) {
        console.error('Partner app update error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
