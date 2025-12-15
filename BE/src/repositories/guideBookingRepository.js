const pool = require('../config/db');

exports.createBooking = async (conn, payload) => {
    const { ma_nguoi_dung, ma_guide, ngay, gio_bat_dau, gio_ket_thuc, so_nguoi, tong_tien } = payload;
    const [res] = await conn.query(
        `INSERT INTO GuideBooking (ma_nguoi_dung, ma_guide, ngay, gio_bat_dau, gio_ket_thuc, so_nguoi, tong_tien, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
        [ma_nguoi_dung, ma_guide, ngay, gio_bat_dau, gio_ket_thuc, so_nguoi || 1, tong_tien || 0]
    );
    return res.insertId;
};

exports.listMyBookings = async (userId) => {
    const [rows] = await pool.query(
        `SELECT gb.*, nd.ho_ten as guide_ten, gs.id as slot_id
         FROM GuideBooking gb
         JOIN FreelanceGuide fg ON gb.ma_guide = fg.ma_guide
         JOIN NguoiDung nd ON fg.ma_nguoi_dung = nd.ma_nguoi_dung
         LEFT JOIN GuideSchedule gs ON gs.ma_guide = gb.ma_guide AND gs.ngay = gb.ngay AND gs.gio_bat_dau = gb.gio_bat_dau
         WHERE gb.ma_nguoi_dung = ?
         ORDER BY gb.ngay DESC, gb.gio_bat_dau DESC`,
        [userId]
    );
    return rows;
};

exports.listByGuideId = async (guideId) => {
    const [rows] = await pool.query(
        `SELECT gb.*, nd.ho_ten, nd.email, nd.so_dien_thoai,
                gs.dia_diem, gs.gia_tien,
                CASE WHEN EXISTS (
                    SELECT 1 FROM GuideReview gr WHERE gr.ma_booking = gb.id AND gr.ma_nguoi_dung = gb.ma_nguoi_dung
                ) THEN 1 ELSE 0 END AS da_danh_gia
         FROM GuideBooking gb
         JOIN FreelanceGuide fg ON gb.ma_guide = fg.ma_guide
         JOIN NguoiDung nd ON gb.ma_nguoi_dung = nd.ma_nguoi_dung
         LEFT JOIN GuideSchedule gs ON gs.ma_guide = gb.ma_guide AND gs.ngay = gb.ngay AND gs.gio_bat_dau = gb.gio_bat_dau
         WHERE gb.ma_guide = ?
         ORDER BY gb.ngay DESC, gb.gio_bat_dau DESC`,
        [guideId]
    );
    return rows;
};
