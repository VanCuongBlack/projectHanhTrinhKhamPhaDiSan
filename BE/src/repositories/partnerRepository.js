const pool = require('../config/db');

exports.findByUserId = async (userId) => {
    const [rows] = await pool.query(
        'SELECT * FROM Partner WHERE ma_nguoi_dung = ?',
        [userId]
    );
    return rows[0] || null;
};

exports.create = async (payload) => {
    const { ten_cong_ty, email, so_dien_thoai, dia_chi, ma_so_thue, ma_nguoi_dung, commission_percent } = payload;
    const [result] = await pool.query(
        `INSERT INTO Partner (ten_cong_ty, email, so_dien_thoai, dia_chi, ma_so_thue, ma_nguoi_dung, commission_percent, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [ten_cong_ty, email, so_dien_thoai || null, dia_chi || null, ma_so_thue, ma_nguoi_dung, commission_percent]
    );
    return result.insertId;
};

exports.updateStatus = async (id, trang_thai) => {
    const [result] = await pool.query(
        'UPDATE Partner SET trang_thai = ? WHERE ma_partner = ?',
        [trang_thai, id]
    );
    return result.affectedRows;
};

exports.listRevenue = async (partnerId) => {
    const [summary] = await pool.query(
        `SELECT 
            SUM(so_tien) AS tong_hoa_hong,
            COUNT(*) AS so_giao_dich,
            MIN(ngay_thuc_hien) AS tu_ngay,
            MAX(ngay_thuc_hien) AS den_ngay
         FROM PartnerCommission
         WHERE ma_partner = ?`,
        [partnerId]
    );

    const [details] = await pool.query(
        `SELECT pc.*, dt.ma_tour, dt.tong_tien, dt.so_tien_thuc_thu, dt.trang_thai
         FROM PartnerCommission pc
         JOIN DatTour dt ON pc.ma_dat_tour = dt.ma_dat_tour
         WHERE pc.ma_partner = ?
         ORDER BY pc.ngay_thuc_hien DESC`,
        [partnerId]
    );

    return { summary: summary[0] || {}, details };
};

exports.findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM Partner WHERE ma_partner = ?', [id]);
    return rows[0] || null;
};
