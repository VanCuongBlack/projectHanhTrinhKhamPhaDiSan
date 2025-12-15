const pool = require('../config/db');

// Danh sách miền
exports.getMien = async (_req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Mien');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching Mien:', err);
        res.status(500).json({ message: 'Không thể tải danh sách miền.' });
    }
};

// Danh sách tỉnh thành theo miền (hoặc tất cả nếu không truyền)
exports.getTinhThanh = async (req, res) => {
    const { mien } = req.query;
    try {
        let query = 'SELECT * FROM TinhThanh';
        const params = [];
        if (mien) {
            query += ' WHERE ma_mien = ?';
            params.push(mien);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching TinhThanh:', err);
        res.status(500).json({ message: 'Không thể tải danh sách tỉnh thành.' });
    }
};

// Danh sách loại địa điểm
exports.getLoaiDiaDiem = async (_req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM LoaiDiaDiem');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching LoaiDiaDiem:', err);
        res.status(500).json({ message: 'Không thể tải danh sách loại địa điểm.' });
    }
};
