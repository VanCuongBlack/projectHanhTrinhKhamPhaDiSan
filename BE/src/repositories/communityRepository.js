const pool = require('../config/db');

exports.listPosts = async (currentUserId, limit, offset, sort) => {
    const orderClause =
        sort === 'hot'
            ? 'ORDER BY like_count DESC, comment_count DESC, bv.ngay_dang DESC'
            : 'ORDER BY bv.ngay_dang DESC';

    const params = [];
    let likeJoin = '';
    if (currentUserId) {
        likeJoin = 'LEFT JOIN (SELECT ma_bai_viet, 1 AS is_liked FROM `Like` WHERE ma_nguoi_dung = ?) ul ON ul.ma_bai_viet = bv.ma_bai_viet';
        params.push(currentUserId);
    }

    params.push(limit, offset);

    const [posts] = await pool.query(
        `SELECT
            bv.ma_bai_viet,
            bv.tieu_de,
            bv.noi_dung,
            bv.anh,
            bv.video,
            bv.ngay_dang,
            bv.ma_dia_diem,
            nd.ma_nguoi_dung,
            nd.ho_ten,
            nd.anh_dai_dien,
            COALESCE(lk.like_count, 0) AS like_count,
            COALESCE(cm.comment_count, 0) AS comment_count,
            ${currentUserId ? 'COALESCE(ul.is_liked, 0)' : '0'} AS is_liked
         FROM BaiViet bv
         JOIN NguoiDung nd ON bv.ma_nguoi_dung = nd.ma_nguoi_dung
         LEFT JOIN (
             SELECT ma_bai_viet, COUNT(*) AS like_count FROM \`Like\` GROUP BY ma_bai_viet
         ) lk ON lk.ma_bai_viet = bv.ma_bai_viet
         LEFT JOIN (
             SELECT ma_bai_viet, COUNT(*) AS comment_count FROM BinhLuan GROUP BY ma_bai_viet
         ) cm ON cm.ma_bai_viet = bv.ma_bai_viet
         ${likeJoin}
         ${orderClause}
         LIMIT ? OFFSET ?`,
        params
    );

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM BaiViet');

    return { posts, total };
};

exports.createPost = async (payload) => {
    const { ma_nguoi_dung, ma_dia_diem, tieu_de, noi_dung, anh, video } = payload;
    const [result] = await pool.query(
        `INSERT INTO BaiViet (ma_nguoi_dung, ma_dia_diem, tieu_de, noi_dung, ngay_dang, anh, video)
         VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
        [ma_nguoi_dung, ma_dia_diem ?? null, tieu_de || null, noi_dung || null, anh || null, video || null]
    );
    return result.insertId;
};

exports.getComments = async (postId) => {
    const [comments] = await pool.query(
        `SELECT 
            bl.ma_binh_luan,
            bl.noi_dung,
            bl.ngay_binh_luan,
            nd.ma_nguoi_dung,
            nd.ho_ten,
            nd.anh_dai_dien
         FROM BinhLuan bl
         JOIN NguoiDung nd ON bl.ma_nguoi_dung = nd.ma_nguoi_dung
         WHERE bl.ma_bai_viet = ?
         ORDER BY bl.ngay_binh_luan ASC`,
        [postId]
    );
    return comments;
};

exports.addComment = async (postId, userId, noi_dung) => {
    const [result] = await pool.query(
        `INSERT INTO BinhLuan (ma_bai_viet, ma_nguoi_dung, noi_dung, ngay_binh_luan)
         VALUES (?, ?, ?, NOW())`,
        [postId, userId, noi_dung]
    );
    return result.insertId;
};

exports.toggleLike = async (postId, userId) => {
    const [existing] = await pool.query(
        'SELECT id FROM `Like` WHERE ma_bai_viet = ? AND ma_nguoi_dung = ?',
        [postId, userId]
    );

    if (existing.length > 0) {
        await pool.query('DELETE FROM `Like` WHERE id = ?', [existing[0].id]);
        return false;
    }

    await pool.query(
        'INSERT INTO `Like` (ma_bai_viet, ma_nguoi_dung) VALUES (?, ?)',
        [postId, userId]
    );
    return true;
};

exports.deletePost = async (postId) => {
    const [result] = await pool.query('DELETE FROM BaiViet WHERE ma_bai_viet = ?', [postId]);
    return result.affectedRows;
};
