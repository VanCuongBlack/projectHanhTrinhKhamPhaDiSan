const pool = require('../config/db');

exports.ensureWallet = async (conn, userId) => {
    await conn.query(
        'INSERT INTO ViNguoiDung (ma_nguoi_dung, so_du) VALUES (?, 0) ON DUPLICATE KEY UPDATE ma_nguoi_dung = ma_nguoi_dung',
        [userId]
    );
};

exports.getWallet = async (userId) => {
    const [rows] = await pool.query('SELECT so_du, currency FROM ViNguoiDung WHERE ma_nguoi_dung = ?', [userId]);
    return rows[0] || null;
};

exports.getHistory = async (userId) => {
    const [rows] = await pool.query(
        `SELECT id, so_tien, loai_giao_dich, noi_dung, thoi_gian, trang_thai
         FROM LichSuVi
         WHERE ma_nguoi_dung = ?
         ORDER BY thoi_gian DESC`,
        [userId]
    );
    return rows;
};

exports.insertTransaction = async (conn, payload) => {
    const {
        userId,
        so_tien,
        loai_giao_dich,
        noi_dung,
        trang_thai = 'thanh_cong',
        service_type = 'other',
        ref_type = null,
        ref_id = null,
        balance_after = null
    } = payload;
    const [result] = await conn.query(
        `INSERT INTO LichSuVi (ma_nguoi_dung, so_tien, loai_giao_dich, service_type, ref_type, ref_id, balance_after, noi_dung, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, so_tien, loai_giao_dich, service_type, ref_type, ref_id, balance_after, noi_dung, trang_thai]
    );
    return result.insertId;
};

exports.updateBalance = async (conn, userId, delta) => {
    await conn.query('UPDATE ViNguoiDung SET so_du = so_du + ? WHERE ma_nguoi_dung = ?', [delta, userId]);
};

exports.lockBalance = async (conn, userId) => {
    const [rows] = await conn.query(
        'SELECT so_du FROM ViNguoiDung WHERE ma_nguoi_dung = ? FOR UPDATE',
        [userId]
    );
    return rows[0] || { so_du: 0 };
};

exports.insertWithdrawRequest = async (conn, payload) => {
    const { userId, amount, phuong_thuc, tai_khoan_ngan_hang } = payload;
    const [result] = await conn.query(
        `INSERT INTO YeuCauRutTien (ma_nguoi_dung, so_tien, phuong_thuc, tai_khoan_ngan_hang, trang_thai)
         VALUES (?, ?, ?, ?, 'cho_duyet')`,
        [userId, amount, phuong_thuc || null, tai_khoan_ngan_hang || null]
    );
    return result.insertId;
};

exports.getWithdrawForUpdate = async (conn, id) => {
    const [rows] = await conn.query(
        'SELECT * FROM YeuCauRutTien WHERE ma_yeu_cau = ? FOR UPDATE',
        [id]
    );
    return rows[0] || null;
};

exports.updateWithdrawStatus = async (conn, id, status) => {
    const [result] = await conn.query(
        'UPDATE YeuCauRutTien SET trang_thai = ? WHERE ma_yeu_cau = ?',
        [status, id]
    );
    return result.affectedRows;
};

exports.listWithdrawRequests = async (limit, offset, status = null) => {
    const where = status ? 'WHERE yc.trang_thai = ?' : '';
    const params = status ? [status, limit, offset] : [limit, offset];
    const [rows] = await pool.query(
        `SELECT yc.*, nd.ho_ten, nd.email, nd.so_dien_thoai
         FROM YeuCauRutTien yc
         JOIN NguoiDung nd ON yc.ma_nguoi_dung = nd.ma_nguoi_dung
         ${where}
         ORDER BY yc.ngay_yeu_cau DESC
         LIMIT ? OFFSET ?`,
        params
    );
    const countWhere = status ? 'WHERE trang_thai = ?' : '';
    const countParams = status ? [status] : [];
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM YeuCauRutTien ${countWhere}`, countParams);
    return { rows, total };
};

exports.findTransactionByRef = async (conn, refType, refId) => {
    const [rows] = await conn.query(
        'SELECT * FROM LichSuVi WHERE ref_type = ? AND ref_id = ? ORDER BY thoi_gian DESC LIMIT 1',
        [refType, refId]
    );
    return rows[0] || null;
};

exports.updateTransactionStatus = async (conn, id, status, noteAppend = '') => {
    const [result] = await conn.query(
        `UPDATE LichSuVi
         SET trang_thai = ?, noi_dung = CONCAT(IFNULL(noi_dung,''), ?)
         WHERE id = ?`,
        [status, noteAppend ? ` | ${noteAppend}` : '', id]
    );
    return result.affectedRows;
};
