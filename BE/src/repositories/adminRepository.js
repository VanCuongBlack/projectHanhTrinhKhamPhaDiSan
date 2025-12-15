const pool = require('../config/db');

exports.listUsers = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT ma_nguoi_dung, ho_ten, email, so_dien_thoai, vai_tro, trang_thai, ngay_tao, anh_dai_dien
         FROM NguoiDung
         ORDER BY ngay_tao DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM NguoiDung');
    return { rows, total };
};

exports.setUserStatus = async (id, status) => {
    const [result] = await pool.query(
        'UPDATE NguoiDung SET trang_thai = ? WHERE ma_nguoi_dung = ?',
        [status, id]
    );
    return result.affectedRows;
};

exports.deleteUser = async (id) => {
    const [result] = await pool.query('DELETE FROM NguoiDung WHERE ma_nguoi_dung = ?', [id]);
    return result.affectedRows;
};

exports.listPartners = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT p.*, nd.ho_ten, nd.email AS user_email
         FROM Partner p
         LEFT JOIN NguoiDung nd ON p.ma_nguoi_dung = nd.ma_nguoi_dung
         ORDER BY p.ma_partner DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM Partner');
    return { rows, total };
};

exports.listTours = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT t.*, p.ten_cong_ty
         FROM Tour t
         LEFT JOIN Partner p ON t.ma_partner = p.ma_partner
         ORDER BY t.ma_tour DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM Tour');
    return { rows, total };
};

exports.listGuides = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT g.*, nd.ho_ten, nd.email, nd.so_dien_thoai
         FROM FreelanceGuide g
         JOIN NguoiDung nd ON g.ma_nguoi_dung = nd.ma_nguoi_dung
         ORDER BY g.ma_guide DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM FreelanceGuide');
    return { rows, total };
};

exports.listDiaDiem = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT dd.*, tt.ten_tinh, ld.ten_loai
         FROM DiaDiem dd
         LEFT JOIN TinhThanh tt ON dd.ma_tinh = tt.ma_tinh
         LEFT JOIN LoaiDiaDiem ld ON dd.ma_loai = ld.ma_loai
         ORDER BY dd.ma_dia_diem DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM DiaDiem');
    return { rows, total };
};

exports.listDacSan = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT ds.*, tt.ten_tinh
         FROM DacSan ds
         LEFT JOIN TinhThanh tt ON ds.ma_tinh = tt.ma_tinh
         ORDER BY ds.ma_dac_san DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM DacSan');
    return { rows, total };
};

exports.listLeHoi = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT lh.*, tt.ten_tinh
         FROM LeHoi lh
         LEFT JOIN TinhThanh tt ON lh.ma_tinh = tt.ma_tinh
         ORDER BY lh.ma_le_hoi DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM LeHoi');
    return { rows, total };
};

exports.listVouchers = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT v.*, COUNT(vu.ma_nguoi_dung) AS so_user_so_huu
         FROM Voucher v
         LEFT JOIN VoucherUser vu ON v.ma_voucher = vu.ma_voucher
         GROUP BY v.ma_voucher
         ORDER BY v.ma_voucher DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM Voucher');
    return { rows, total };
};

exports.listWalletTransactions = async (limit, offset) => {
    const [rows] = await pool.query(
        `SELECT ls.*, nd.email, nd.ho_ten
         FROM LichSuVi ls
         JOIN NguoiDung nd ON ls.ma_nguoi_dung = nd.ma_nguoi_dung
         ORDER BY ls.thoi_gian DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM LichSuVi');
    return { rows, total };
};
