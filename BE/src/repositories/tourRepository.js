const pool = require('../config/db');

const mapRow = (row) => ({
    ma_tour: row.ma_tour,
    tieu_de: row.tieu_de,
    so_ngay: row.so_ngay,
    so_dem: row.so_dem,
    loai_hinh: row.loai_hinh,
    don_vi_thoi_luong: row.don_vi_thoi_luong,
    dia_diem: row.dia_diem,
    gia: row.don_gia,
    gia_tre_em: row.gia_tre_em,
    mo_ta: row.mo_ta,
    ma_partner: row.ma_partner,
    anh: row.anh,
    ngay_khoi_hanh: row.ngay_khoi_hanh,
    lich_trinh: row.lich_trinh,
    media: row.media
});

exports.findAll = async () => {
    const [rows] = await pool.query(
        `SELECT ma_tour, tieu_de, so_ngay, so_dem, loai_hinh, don_vi_thoi_luong, dia_diem,
                don_gia, gia_tre_em, mo_ta, ma_partner, anh, ngay_khoi_hanh, lich_trinh, media
         FROM Tour
         ORDER BY ma_tour DESC`
    );
    return rows.map(mapRow);
};

exports.findById = async (id) => {
    const [rows] = await pool.query(
        `SELECT ma_tour, tieu_de, so_ngay, so_dem, loai_hinh, don_vi_thoi_luong, dia_diem,
                don_gia, gia_tre_em, mo_ta, ma_partner, anh, ngay_khoi_hanh, lich_trinh, media
         FROM Tour WHERE ma_tour = ?`,
        [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
};

exports.create = async (payload) => {
    const {
        tieu_de, so_ngay, so_dem, gia, mo_ta, anh, ma_partner, ngay_khoi_hanh,
        loai_hinh, don_vi_thoi_luong, dia_diem, gia_tre_em, lich_trinh, media
    } = payload;
    const [result] = await pool.query(
        `INSERT INTO Tour (tieu_de, so_ngay, so_dem, loai_hinh, don_vi_thoi_luong, dia_diem,
                           don_gia, gia_tre_em, mo_ta, ma_partner, anh, ngay_khoi_hanh, lich_trinh, media)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tieu_de,
            so_ngay ?? 0,
            so_dem ?? 0,
            loai_hinh || null,
            don_vi_thoi_luong || null,
            dia_diem || null,
            gia ?? 0,
            gia_tre_em ?? null,
            mo_ta || null,
            ma_partner ?? null,
            anh || null,
            ngay_khoi_hanh || null,
            lich_trinh || null,
            media || null
        ]
    );
    return result.insertId;
};

exports.update = async (id, payload) => {
    const setClauses = [];
    const values = [];
    const map = {
        tieu_de: 'tieu_de',
        gia: 'don_gia',
        anh: 'anh',
        loai_hinh: 'loai_hinh',
        don_vi_thoi_luong: 'don_vi_thoi_luong',
        dia_diem: 'dia_diem',
        gia_tre_em: 'gia_tre_em',
        ngay_khoi_hanh: 'ngay_khoi_hanh',
        lich_trinh: 'lich_trinh',
        media: 'media'
    };

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined) {
            const column = map[key] || key;
            setClauses.push(`${column} = ?`);
            values.push(value);
        }
    });

    if (!setClauses.length) return 0;

    values.push(id);
    const [result] = await pool.query(
        `UPDATE Tour SET ${setClauses.join(', ')} WHERE ma_tour = ?`,
        values
    );
    return result.affectedRows;
};

exports.remove = async (id) => {
    const [result] = await pool.query('DELETE FROM Tour WHERE ma_tour = ?', [id]);
    return result.affectedRows;
};
