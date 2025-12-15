const pool = require('../config/db');

exports.findByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM PendingUsers WHERE email = ?', [email]);
    return rows[0] || null;
};

exports.upsert = async (payload) => {
    const { email, mat_khau, ho_ten, so_dien_thoai, otp, otp_expiry } = payload;
    await pool.query(
        `INSERT INTO PendingUsers (email, mat_khau, ho_ten, so_dien_thoai, otp, otp_expiry)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE mat_khau = VALUES(mat_khau), ho_ten = VALUES(ho_ten), so_dien_thoai = VALUES(so_dien_thoai), otp = VALUES(otp), otp_expiry = VALUES(otp_expiry)`,
        [email, mat_khau, ho_ten, so_dien_thoai, otp, otp_expiry]
    );
};

exports.deleteByEmail = async (email) => {
    await pool.query('DELETE FROM PendingUsers WHERE email = ?', [email]);
};
