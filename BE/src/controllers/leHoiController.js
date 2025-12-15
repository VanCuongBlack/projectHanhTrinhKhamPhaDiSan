const pool = require('../config/db');

// Lấy tất cả lễ hội, hỗ trợ lọc theo tỉnh
exports.getAllLeHoi = async (req, res) => {
    const { ma_tinh } = req.query;
    try {
        let query = `
            SELECT lh.*, tt.ten_tinh
            FROM LeHoi lh
            LEFT JOIN TinhThanh tt ON lh.ma_tinh = tt.ma_tinh
        `;
        const params = [];
        if (ma_tinh) {
            query += ' WHERE lh.ma_tinh = ?';
            params.push(ma_tinh);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching LeHoi:', error);
        res.status(500).json({ message: 'Không thể tải danh sách lễ hội.' });
    }
};

exports.searchLeHoiByProvince = async (req, res) => {
    const { ten_tinh } = req.query;
    if (!ten_tinh) {
        return res.status(400).json({ message: 'thiếu tham số ten_tinh' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT lh.*, tt.ten_tinh
             FROM LeHoi lh
             LEFT JOIN TinhThanh tt ON lh.ma_tinh = tt.ma_tinh
             WHERE tt.ten_tinh LIKE ?`,
            [`%${ten_tinh}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error searching LeHoi:', error);
        res.status(500).json({ message: 'Không thể tìm kiếm lễ hội.' });
    }
};

// Thêm lễ hội mới
exports.createLeHoi = async (req, res) => {
    const { ma_tinh, ten_le_hoi, thoi_gian, dia_diem, mo_ta, anh } = req.body;

    if (!ma_tinh || !ten_le_hoi) {
        return res.status(400).json({ message: 'ma_tinh và ten_le_hoi là bắt buộc.' });
    }

    const imagePath = req.file ? `/uploads/festivals/${req.file.filename}` : (anh || null);

    try {
        const [result] = await pool.query(
            `INSERT INTO LeHoi (ma_tinh, ten_le_hoi, thoi_gian, dia_diem, mo_ta, anh)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ma_tinh, ten_le_hoi, thoi_gian || null, dia_diem || null, mo_ta || null, imagePath]
        );
        const [rows] = await pool.query('SELECT * FROM LeHoi WHERE ma_le_hoi = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating LeHoi:', error);
        res.status(500).json({ message: 'Không thể tạo lễ hội.' });
    }
};

// Cập nhật lễ hội
exports.updateLeHoi = async (req, res) => {
    const { id } = req.params;
    const { ma_tinh, ten_le_hoi, thoi_gian, dia_diem, mo_ta, anh } = req.body;

    const fields = { ma_tinh, ten_le_hoi, thoi_gian, dia_diem, mo_ta, anh };
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
        values.push(`/uploads/festivals/${req.file.filename}`);
    }

    if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật.' });
    }

    values.push(id);

    try {
        const [result] = await pool.query(
            `UPDATE LeHoi SET ${setClauses.join(', ')} WHERE ma_le_hoi = ?`,
            values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lễ hội.' });
        }

        const [rows] = await pool.query('SELECT * FROM LeHoi WHERE ma_le_hoi = ?', [id]);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating LeHoi:', error);
        res.status(500).json({ message: 'Không thể cập nhật lễ hội.' });
    }
};

// Xóa lễ hội
exports.deleteLeHoi = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM LeHoi WHERE ma_le_hoi = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lễ hội.' });
        }
        res.json({ message: 'Đã xóa lễ hội thành công.' });
    } catch (error) {
        console.error('Error deleting LeHoi:', error);
        res.status(500).json({ message: 'Không thể xóa lễ hội.' });
    }
};
