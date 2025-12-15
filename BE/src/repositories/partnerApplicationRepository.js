const pool = require('../config/db');

exports.findByUserId = async (userId) => {
    const [rows] = await pool.query(
        'SELECT * FROM PartnerApplication WHERE ma_nguoi_dung = ? LIMIT 1',
        [userId]
    );
    return rows[0] || null;
};

exports.findById = async (id) => {
    const [rows] = await pool.query(
        'SELECT * FROM PartnerApplication WHERE id = ? LIMIT 1',
        [id]
    );
    return rows[0] || null;
};

exports.create = async (payload) => {
    const {
        ma_nguoi_dung,
        ten_cong_ty,
        ma_so_thue,
        email_cong_ty,
        so_dien_thoai,
        dia_chi,
        giay_phep_kinh_doanh,
        mo_ta,
    } = payload;
    const [res] = await pool.query(
        `INSERT INTO PartnerApplication (ma_nguoi_dung, ten_cong_ty, ma_so_thue, email_cong_ty, so_dien_thoai, dia_chi, giay_phep_kinh_doanh, mo_ta, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [ma_nguoi_dung, ten_cong_ty, ma_so_thue, email_cong_ty, so_dien_thoai || null, dia_chi || null, giay_phep_kinh_doanh || null, mo_ta || null]
    );
    return res.insertId;
};

exports.updateStatus = async (id, status) => {
    const [res] = await pool.query(
        'UPDATE PartnerApplication SET trang_thai = ? WHERE id = ?',
        [status, id]
    );
    return res.affectedRows;
};

exports.list = async (limit, offset, status = null) => {
    const where = status ? 'WHERE pa.trang_thai = ?' : '';
    const params = status ? [status, limit, offset] : [limit, offset];
    const [rows] = await pool.query(
        `SELECT pa.*, nd.ho_ten, nd.email, nd.so_dien_thoai
         FROM PartnerApplication pa
         JOIN NguoiDung nd ON pa.ma_nguoi_dung = nd.ma_nguoi_dung
         ${where}
         ORDER BY pa.ngay_dang_ky DESC
         LIMIT ? OFFSET ?`,
        params
    );
    const countWhere = status ? 'WHERE trang_thai = ?' : '';
    const countParams = status ? [status] : [];
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM PartnerApplication ${countWhere}`, countParams);
    return { rows, total };
};
