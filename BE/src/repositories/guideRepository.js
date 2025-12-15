const pool = require('../config/db');

exports.findApplicationByUserId = async (userId) => {
    const [rows] = await pool.query(
        'SELECT * FROM GuideApplication WHERE ma_nguoi_dung = ? LIMIT 1',
        [userId]
    );
    return rows[0] || null;
};

exports.createApplication = async ({ ma_nguoi_dung, gioi_thieu, chuyen_mon, tai_lieu_xac_thuc, kinh_nghiem }) => {
    const [result] = await pool.query(
        `INSERT INTO GuideApplication (ma_nguoi_dung, gioi_thieu, chuyen_mon, tai_lieu_xac_thuc, kinh_nghiem, trang_thai)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [ma_nguoi_dung, gioi_thieu, chuyen_mon, tai_lieu_xac_thuc, kinh_nghiem ?? 0]
    );
    return result.insertId;
};

exports.listApplications = async (limit, offset, status = null) => {
    const where = status ? 'WHERE ga.trang_thai = ?' : '';
    const params = status ? [status, limit, offset] : [limit, offset];
    const [rows] = await pool.query(
        `SELECT ga.*, nd.ho_ten, nd.email, nd.so_dien_thoai
         FROM GuideApplication ga
         JOIN NguoiDung nd ON ga.ma_nguoi_dung = nd.ma_nguoi_dung
         ${where}
         ORDER BY ga.ngay_dang_ky DESC
         LIMIT ? OFFSET ?`,
        params
    );
    const countWhere = status ? 'WHERE trang_thai = ?' : '';
    const countParams = status ? [status] : [];
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM GuideApplication ${countWhere}`, countParams);
    return { rows, total };
};

exports.updateApplicationStatus = async (id, status, ly_do = null) => {
    const [result] = await pool.query(
        `UPDATE GuideApplication SET trang_thai = ?, ngay_dang_ky = ngay_dang_ky WHERE id = ?`,
        [status, id]
    );
    return result.affectedRows;
};

exports.findGuideByUserId = async (userId) => {
    const [rows] = await pool.query(
        `SELECT fg.*, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien
         FROM FreelanceGuide fg
         JOIN NguoiDung nd ON fg.ma_nguoi_dung = nd.ma_nguoi_dung
         WHERE fg.ma_nguoi_dung = ?
         LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
};

exports.listActiveGuides = async (limit = 4) => {
    const [rows] = await pool.query(
        `SELECT fg.*, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien
         FROM FreelanceGuide fg
         JOIN NguoiDung nd ON fg.ma_nguoi_dung = nd.ma_nguoi_dung
         WHERE fg.trang_thai = 'active'
         ORDER BY RAND()
         LIMIT ?`,
        [limit]
    );
    return rows;
};

exports.createGuideFromApplication = async ({ ma_nguoi_dung, gioi_thieu, chuyen_mon, kinh_nghiem }) => {
    const [result] = await pool.query(
        `INSERT INTO FreelanceGuide (ma_nguoi_dung, gioi_thieu, rating_avg, trang_thai, thanh_vien_tu_ngay)
         VALUES (?, ?, 0, 'active', NOW())`,
        [ma_nguoi_dung, `${chuyen_mon ? `[${chuyen_mon}] ` : ''}${gioi_thieu || ''}`]
    );
    return result.insertId;
};

exports.findApplicationById = async (id) => {
    const [rows] = await pool.query(
        `SELECT * FROM GuideApplication WHERE id = ? LIMIT 1`,
        [id]
    );
    return rows[0] || null;
};

exports.updateUserAvatar = async (userId, avatarPath) => {
    await pool.query(
        'UPDATE NguoiDung SET anh_dai_dien = ? WHERE ma_nguoi_dung = ?',
        [avatarPath, userId]
    );
};
