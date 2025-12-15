const pool = require('../config/db');

exports.listMySchedule = async (guideId) => {
    const [rows] = await pool.query(
        'SELECT * FROM GuideSchedule WHERE ma_guide = ? ORDER BY ngay ASC, gio_bat_dau ASC',
        [guideId]
    );
    return rows;
};

exports.hasOverlap = async (guideId, ngay, start, end) => {
    const [rows] = await pool.query(
        `SELECT 1 FROM GuideSchedule 
         WHERE ma_guide = ? AND ngay = ? 
           AND gio_bat_dau < ? AND gio_ket_thuc > ?
         LIMIT 1`,
        [guideId, ngay, end, start]
    );
    return rows.length > 0;
};

exports.createSlot = async (guideId, ngay, start, end, dia_diem = null, gia_tien = null, ghi_chu = null) => {
    const [result] = await pool.query(
        `INSERT INTO GuideSchedule (ma_guide, ngay, gio_bat_dau, gio_ket_thuc, trang_thai, dia_diem, gia_tien, ghi_chu)
         VALUES (?, ?, ?, ?, 'free', ?, ?, ?)`,
        [guideId, ngay, start, end, dia_diem || null, gia_tien || null, ghi_chu || null]
    );
    return result.insertId;
};

exports.markSlot = async (conn, slotId, status) => {
    const [res] = await conn.query(
        'UPDATE GuideSchedule SET trang_thai = ? WHERE id = ?',
        [status, slotId]
    );
    return res.affectedRows;
};

exports.findSlotForUpdate = async (conn, slotId) => {
    const [rows] = await conn.query(
        'SELECT * FROM GuideSchedule WHERE id = ? FOR UPDATE',
        [slotId]
    );
    return rows[0] || null;
};

exports.listAvailableByDate = async (ngay) => {
    const [rows] = await pool.query(
        `SELECT gs.*,
                DATE_FORMAT(gs.ngay, '%Y-%m-%d') AS ngay_iso,
                fg.ma_nguoi_dung, fg.trang_thai, fg.gioi_thieu, fg.rating_avg, fg.thanh_vien_tu_ngay,
                nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien
         FROM GuideSchedule gs
         JOIN FreelanceGuide fg ON gs.ma_guide = fg.ma_guide
         JOIN NguoiDung nd ON fg.ma_nguoi_dung = nd.ma_nguoi_dung
         WHERE gs.ngay = ? AND gs.trang_thai = 'free' AND fg.trang_thai = 'active'
         ORDER BY gs.gio_bat_dau ASC`,
        [ngay]
    );
    return rows;
};

exports.listAvailableUpcoming = async (fromDate = null, limit = 100) => {
    const start = fromDate || new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query(
        `SELECT gs.*,
                DATE_FORMAT(gs.ngay, '%Y-%m-%d') AS ngay_iso,
                fg.ma_nguoi_dung, fg.trang_thai, fg.gioi_thieu, fg.rating_avg, fg.thanh_vien_tu_ngay,
                nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien
         FROM GuideSchedule gs
         JOIN FreelanceGuide fg ON gs.ma_guide = fg.ma_guide
         JOIN NguoiDung nd ON fg.ma_nguoi_dung = nd.ma_nguoi_dung
         WHERE gs.ngay >= ? AND gs.trang_thai = 'free' AND fg.trang_thai = 'active'
         ORDER BY gs.ngay ASC, gs.gio_bat_dau ASC
         LIMIT ?`,
        [start, limit]
    );
    return rows;
};

exports.getSlotPublic = async (slotId) => {
    const [rows] = await pool.query(
        `SELECT gs.*, fg.ma_nguoi_dung, fg.trang_thai, fg.gioi_thieu, fg.rating_avg, fg.thanh_vien_tu_ngay,
                nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien
         FROM GuideSchedule gs
         JOIN FreelanceGuide fg ON gs.ma_guide = fg.ma_guide
         JOIN NguoiDung nd ON fg.ma_nguoi_dung = nd.ma_nguoi_dung
         WHERE gs.id = ?`,
        [slotId]
    );
    return rows[0] || null;
};
