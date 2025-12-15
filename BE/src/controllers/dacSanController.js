const pool = require('../config/db');

// Lấy toàn bộ đặc sản, hỗ trợ lọc theo tỉnh
exports.getAllDacSan = async (req, res) => {
    const { ma_tinh } = req.query;
    try {
        let query = `
            SELECT ds.*, tt.ten_tinh
            FROM DacSan ds
            LEFT JOIN TinhThanh tt ON ds.ma_tinh = tt.ma_tinh
        `;
        const params = [];
        if (ma_tinh) {
            query += ' WHERE ds.ma_tinh = ?';
            params.push(ma_tinh);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching DacSan:', error);
        res.status(500).json({ message: 'Không thể tải danh sách đặc sản.' });
    }
};

exports.searchDacSanByProvince = async (req, res) => {
    const { ten_tinh } = req.query;
    if (!ten_tinh) {
        return res.status(400).json({ message: 'thiếu tham số ten_tinh' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT ds.*, tt.ten_tinh
             FROM DacSan ds
             LEFT JOIN TinhThanh tt ON ds.ma_tinh = tt.ma_tinh
             WHERE tt.ten_tinh LIKE ?`,
            [`%${ten_tinh}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error searching DacSan:', error);
        res.status(500).json({ message: 'Không thể tìm kiếm đặc sản.' });
    }
};

// Thêm đặc sản
exports.createDacSan = async (req, res) => {
    const { ma_tinh, ten_dac_san, mo_ta, anh } = req.body;

    if (!ma_tinh || !ten_dac_san) {
        return res.status(400).json({ message: 'ma_tinh và ten_dac_san là bắt buộc.' });
    }

    const imagePath = req.file ? `/uploads/specialties/${req.file.filename}` : (anh || null);

    try {
        const [result] = await pool.query(
            `INSERT INTO DacSan (ma_tinh, ten_dac_san, mo_ta, anh)
             VALUES (?, ?, ?, ?)`,
            [ma_tinh, ten_dac_san, mo_ta || null, imagePath]
        );
        const [rows] = await pool.query('SELECT * FROM DacSan WHERE ma_dac_san = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating DacSan:', error);
        res.status(500).json({ message: 'Không thể tạo đặc sản.' });
    }
};

// Cập nhật đặc sản
exports.updateDacSan = async (req, res) => {
    const { id } = req.params;
    const { ma_tinh, ten_dac_san, mo_ta, anh } = req.body;

    const fields = { ma_tinh, ten_dac_san, mo_ta, anh };
    const setClauses = [];
    const values = [];

    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
            setClauses.push(`${key} = ?`);
            values.push(value);
        }
    });

    if (req.file) {
        setClauses.push('anh = ?');
        values.push(`/uploads/specialties/${req.file.filename}`);
    }

    if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật.' });
    }

    values.push(id);

    try {
        const [result] = await pool.query(
            `UPDATE DacSan SET ${setClauses.join(', ')} WHERE ma_dac_san = ?`,
            values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đặc sản.' });
        }
        const [rows] = await pool.query('SELECT * FROM DacSan WHERE ma_dac_san = ?', [id]);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating DacSan:', error);
        res.status(500).json({ message: 'Không thể cập nhật đặc sản.' });
    }
};

// Xóa đặc sản
exports.deleteDacSan = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM DacSan WHERE ma_dac_san = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đặc sản.' });
        }
        res.json({ message: 'Đã xóa đặc sản thành công.' });
    } catch (error) {
        console.error('Error deleting DacSan:', error);
        res.status(500).json({ message: 'Không thể xóa đặc sản.' });
    }
};
