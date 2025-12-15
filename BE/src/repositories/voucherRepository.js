const pool = require('../config/db');

exports.findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM Voucher WHERE ma_voucher = ?', [id]);
    return rows[0] || null;
};

exports.create = async (payload) => {
    const { code, tieu_de, mo_ta, giam_phan_tram, giam_toi_da, ngay_bat_dau, ngay_ket_thuc, trang_thai = 'active', so_luong = 0 } = payload;
    const [result] = await pool.query(
        `INSERT INTO Voucher (code, tieu_de, mo_ta, giam_phan_tram, giam_toi_da, ngay_bat_dau, ngay_ket_thuc, trang_thai, so_luong)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, tieu_de, mo_ta || null, giam_phan_tram, giam_toi_da, ngay_bat_dau, ngay_ket_thuc, trang_thai, so_luong]
    );
    return result.insertId;
};

exports.assignToUser = async (voucherId, userId) => {
    const [res] = await pool.query(
        'INSERT IGNORE INTO VoucherUser (ma_voucher, ma_nguoi_dung) VALUES (?, ?)',
        [voucherId, userId]
    );
    return res.affectedRows > 0 || res.insertId > 0;
};

exports.assignToUsers = async (voucherId, userIds = [], conn = pool) => {
    if (!userIds || userIds.length === 0) return 0;
    const values = userIds.map(() => '(?, ?)').join(',');
    const params = userIds.flatMap((id) => [voucherId, id]);
    const [res] = await conn.query(`INSERT IGNORE INTO VoucherUser (ma_voucher, ma_nguoi_dung) VALUES ${values}`, params);
    return res.affectedRows || 0;
};

exports.assignToAllUsers = async (voucherId) => {
    await pool.query(
        `INSERT IGNORE INTO VoucherUser (ma_voucher, ma_nguoi_dung)
         SELECT ?, nd.ma_nguoi_dung FROM NguoiDung nd`,
        [voucherId]
    );
};

exports.getUserVoucher = async (userId, voucherIdOrCode) => {
    if (voucherIdOrCode === undefined || voucherIdOrCode === null) return null;
    const isNumeric = Number.isFinite(Number(voucherIdOrCode));
    const where = isNumeric ? 'v.ma_voucher = ?' : 'v.code = ?';
    const [rows] = await pool.query(
        `SELECT vu.id as voucher_user_id, vu.da_dung, v.*
         FROM VoucherUser vu
         JOIN Voucher v ON vu.ma_voucher = v.ma_voucher
         WHERE vu.ma_nguoi_dung = ? AND ${where}`,
        [userId, voucherIdOrCode]
    );
    return rows[0] || null;
};

exports.listUserVouchers = async (userId) => {
    const [rows] = await pool.query(
        `SELECT 
            vu.id,
            vu.da_dung,
            vu.ngay_nhan,
            v.ma_voucher,
            v.code,
            v.tieu_de,
            v.mo_ta,
            v.giam_phan_tram,
            v.giam_toi_da,
            v.ngay_bat_dau,
            v.ngay_ket_thuc,
            v.trang_thai
        FROM VoucherUser vu
        JOIN Voucher v ON vu.ma_voucher = v.ma_voucher
        WHERE vu.ma_nguoi_dung = ?
        ORDER BY v.ngay_ket_thuc DESC, vu.ngay_nhan DESC`,
        [userId]
    );
    return rows;
};

exports.markUsed = async (voucherUserId) => {
    await pool.query('UPDATE VoucherUser SET da_dung = 1 WHERE id = ?', [voucherUserId]);
};
