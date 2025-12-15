exports.checkIn = async (req, res) => {
    try {
        const result = await require('../services/checkinService').checkIn(req.user.ma_nguoi_dung, req.body.ma_dia_diem, req.body);
        res.status(201).json({
            message: 'Check-in thành công.',
            ...result
        });
    } catch (err) {
        console.error('Check-in error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

exports.getMySummary = async (req, res) => {
    try {
        const data = await require('../services/checkinService').getSummary(req.user.ma_nguoi_dung);
        res.json(data);
    } catch (err) {
        console.error('Check-in summary error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

exports.getConfig = async (_req, res) => {
    try {
        const data = await require('../services/checkinService').getConfig();
        res.json(data);
    } catch (err) {
        console.error('Check-in config error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};

exports.updateConfig = async (req, res) => {
    try {
        const data = await require('../services/checkinService').updateConfig(req.body);
        res.json({ message: 'Cập nhật mốc điểm thành công.', ...data });
    } catch (err) {
        console.error('Check-in update config error:', err);
        res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
    }
};
