const pool = require('../config/db');

exports.findPlace = async (ma_dia_diem) => {
    const [rows] = await pool.query(
        'SELECT ma_dia_diem, toado_lat, toado_lng FROM DiaDiem WHERE ma_dia_diem = ?',
        [ma_dia_diem]
    );
    return rows[0] || null;
};

exports.getPoints = async (conn, userId) => {
    const [rows] = await conn.query(
        'SELECT points FROM UserPoints WHERE ma_nguoi_dung = ? FOR UPDATE',
        [userId]
    );
    return rows[0] ? Number(rows[0].points) : 0;
};

exports.getPointsReadonly = async (userId) => {
    const [rows] = await pool.query(
        'SELECT points FROM UserPoints WHERE ma_nguoi_dung = ?',
        [userId]
    );
    return rows[0] ? Number(rows[0].points) : 0;
};

exports.setPoints = async (conn, userId, points) => {
    await conn.query(
        `INSERT INTO UserPoints (ma_nguoi_dung, points, last_update)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE points = VALUES(points), last_update = NOW()`,
        [userId, points]
    );
};

exports.insertCheckin = async (conn, userId, placeId) => {
    const [result] = await conn.query(
        'INSERT INTO CheckIn (ma_nguoi_dung, ma_dia_diem) VALUES (?, ?)',
        [userId, placeId]
    );
    return result.insertId;
};

exports.hasCheckinToday = async (conn, userId, placeId) => {
    const [rows] = await conn.query(
        `SELECT 1 FROM CheckIn 
         WHERE ma_nguoi_dung = ? 
           AND ma_dia_diem = ? 
           AND ngay_checkin_date = CURDATE()
         LIMIT 1`,
        [userId, placeId]
    );
    return rows.length > 0;
};

exports.hasCheckinEver = async (conn, userId, placeId) => {
    const [rows] = await conn.query(
        `SELECT 1 FROM CheckIn 
         WHERE ma_nguoi_dung = ? 
           AND ma_dia_diem = ? 
         LIMIT 1`,
        [userId, placeId]
    );
    return rows.length > 0;
};

exports.countToday = async (conn, userId) => {
    const [rows] = await conn.query(
        `SELECT COUNT(*) as total FROM CheckIn 
         WHERE ma_nguoi_dung = ? 
           AND ngay_checkin_date = CURDATE()`,
        [userId]
    );
    return rows[0]?.total ? Number(rows[0].total) : 0;
};

exports.listCheckins = async (userId) => {
    const [rows] = await pool.query(
        `SELECT 
            ci.id,
            ci.ngay_checkin,
            dd.ma_dia_diem,
            dd.ten_dia_diem,
            dd.dia_chi,
            dd.anh,
            dd.toado_lat,
            dd.toado_lng,
            tt.ten_tinh,
            ld.ten_loai
        FROM CheckIn ci
        JOIN DiaDiem dd ON ci.ma_dia_diem = dd.ma_dia_diem
        LEFT JOIN TinhThanh tt ON dd.ma_tinh = tt.ma_tinh
        LEFT JOIN LoaiDiaDiem ld ON dd.ma_loai = ld.ma_loai
        WHERE ci.ma_nguoi_dung = ?
        ORDER BY ci.ngay_checkin DESC`,
        [userId]
    );
    return rows;
};
