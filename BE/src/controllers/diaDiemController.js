const pool = require('../config/db');

// Lấy toàn bộ danh sách địa điểm du lịch, hỗ trợ lọc theo tỉnh
exports.getAllDiaDiem = async (req, res) => {
    const { ma_tinh } = req.query;
    try {
        let query = `
            SELECT dd.*, tt.ten_tinh, ld.ten_loai
            FROM DiaDiem dd
            LEFT JOIN TinhThanh tt ON dd.ma_tinh = tt.ma_tinh
            LEFT JOIN LoaiDiaDiem ld ON dd.ma_loai = ld.ma_loai
        `;
        const params = [];
        if (ma_tinh) {
            query += ' WHERE dd.ma_tinh = ?';
            params.push(ma_tinh);
        }
        const [rows] = await pool.query(query, params);
        const host = `${req.protocol}://${req.get('host')}`;
        const normalized = rows.map((row) => {
            const imagePath = row.anh;
            const fullUrl = imagePath
                ? (imagePath.startsWith('http') ? imagePath : `${host}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`)
                : null;
            return { ...row, anh_url: fullUrl };
        });
        res.json(normalized);
    } catch (error) {
        console.error('Error fetching DiaDiem:', error);
        res.status(500).json({ message: 'Không thể tải danh sách địa điểm.' });
    }
};

// Tìm kiếm theo tên tỉnh
exports.searchDiaDiemByProvince = async (req, res) => {
    const { ten_tinh } = req.query;
    if (!ten_tinh) {
        return res.status(400).json({ message: 'thiếu tham số ten_tinh' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT dd.*, tt.ten_tinh
             FROM DiaDiem dd
             LEFT JOIN TinhThanh tt ON dd.ma_tinh = tt.ma_tinh
             WHERE tt.ten_tinh LIKE ?`,
            [`%${ten_tinh}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error searching DiaDiem:', error);
        res.status(500).json({ message: 'Không thể tìm kiếm địa điểm.' });
    }
};

// Thêm địa điểm mới
exports.createDiaDiem = async (req, res) => {
    const {
        ma_tinh,
        ten_dia_diem,
        mo_ta,
        dia_chi,
        toado_lat,
        toado_lng,
        anh,
        ma_loai
    } = req.body;

    if (!ma_tinh || !ten_dia_diem) {
        return res.status(400).json({ message: 'ma_tinh và ten_dia_diem là bắt buộc.' });
    }

    const imagePath = req.file ? `/uploads/places/${req.file.filename}` : (anh || null);

    try {
        const [result] = await pool.query(
            `INSERT INTO DiaDiem (ma_tinh, ten_dia_diem, mo_ta, dia_chi, toado_lat, toado_lng, anh, ma_loai)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ma_tinh,
                ten_dia_diem,
                mo_ta || null,
                dia_chi || null,
                toado_lat ?? null,
                toado_lng ?? null,
                imagePath,
                ma_loai ?? null
            ]
        );

        const [newDiaDiem] = await pool.query('SELECT * FROM DiaDiem WHERE ma_dia_diem = ?', [result.insertId]);
        res.status(201).json(newDiaDiem[0]);
    } catch (error) {
        console.error('Error creating DiaDiem:', error);
        res.status(500).json({ message: 'Không thể tạo địa điểm mới.' });
    }
};

// Cập nhật địa điểm
exports.updateDiaDiem = async (req, res) => {
    const { id } = req.params;
    const {
        ma_tinh,
        ten_dia_diem,
        mo_ta,
        dia_chi,
        toado_lat,
        toado_lng,
        anh,
        ma_loai
    } = req.body;

    const fields = {
        ma_tinh,
        ten_dia_diem,
        mo_ta,
        dia_chi,
        toado_lat,
        toado_lng,
        anh,
        ma_loai
    };

    if (req.file) {
        fields.anh = `/uploads/places/${req.file.filename}`;
    }

    const setClauses = [];
    const values = [];

    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
            setClauses.push(`${key} = ?`);
            values.push(value);
        }
    });

    if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật.' });
    }

    values.push(id);

    try {
        const [result] = await pool.query(
            `UPDATE DiaDiem SET ${setClauses.join(', ')} WHERE ma_dia_diem = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy địa điểm.' });
        }

        const [updatedDiaDiem] = await pool.query('SELECT * FROM DiaDiem WHERE ma_dia_diem = ?', [id]);
        res.json(updatedDiaDiem[0]);
    } catch (error) {
        console.error('Error updating DiaDiem:', error);
        res.status(500).json({ message: 'Không thể cập nhật địa điểm.' });
    }
};

// Xóa địa điểm
exports.deleteDiaDiem = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM DiaDiem WHERE ma_dia_diem = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy địa điểm.' });
        }

        res.json({ message: 'Đã xóa địa điểm thành công.' });
    } catch (error) {
        console.error('Error deleting DiaDiem:', error);
        res.status(500).json({ message: 'Không thể xóa địa điểm.' });
    }
};
