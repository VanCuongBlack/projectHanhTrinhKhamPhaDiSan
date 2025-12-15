const pool = require('../config/db');

exports.findByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM NguoiDung WHERE email = ?', [email]);
    return rows[0] || null;
};

exports.findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM NguoiDung WHERE ma_nguoi_dung = ?', [id]);
    return rows[0] || null;
};

exports.create = async (payload) => {
    const { ho_ten, email, password_hash, so_dien_thoai, vai_tro = 'user', trang_thai = 'active', anh_dai_dien = null } = payload;
    const [result] = await pool.query(
        `INSERT INTO NguoiDung (ho_ten, email, password_hash, so_dien_thoai, vai_tro, trang_thai, ngay_tao, anh_dai_dien)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [ho_ten, email, password_hash, so_dien_thoai, vai_tro, trang_thai, anh_dai_dien]
    );
    return result.insertId;
};

exports.updateProfile = async (id, payload) => {
    const set = [];
    const vals = [];
    Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined) {
            set.push(`${k} = ?`);
            vals.push(v);
        }
    });
    if (!set.length) return 0;
    vals.push(id);
    const [result] = await pool.query(`UPDATE NguoiDung SET ${set.join(', ')} WHERE ma_nguoi_dung = ?`, vals);
    return result.affectedRows;
};

exports.updatePassword = async (id, password_hash) => {
    const [result] = await pool.query(
        'UPDATE NguoiDung SET password_hash = ? WHERE ma_nguoi_dung = ?',
        [password_hash, id]
    );
    return result.affectedRows;
};

exports.insertRevokedToken = async (token, expiresAt) => {
    await pool.query('INSERT INTO RevokedTokens (token, expires_at) VALUES (?, ?)', [token, expiresAt]);
};

exports.isTokenRevoked = async (token) => {
    const [rows] = await pool.query('SELECT 1 FROM RevokedTokens WHERE token = ? AND expires_at > NOW()', [token]);
    return rows.length > 0;
};
