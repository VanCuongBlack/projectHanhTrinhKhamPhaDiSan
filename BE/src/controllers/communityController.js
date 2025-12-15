const communityService = require('../services/communityService');

const mapPostRow = (row) => ({
    ma_bai_viet: row.ma_bai_viet,
    tieu_de: row.tieu_de,
    noi_dung: row.noi_dung,
    anh: row.anh,
    video: row.video,
    ngay_dang: row.ngay_dang,
    ma_dia_diem: row.ma_dia_diem,
    tac_gia: {
        ma_nguoi_dung: row.ma_nguoi_dung,
        ho_ten: row.ho_ten,
        anh_dai_dien: row.anh_dai_dien
    },
    like_count: row.like_count || 0,
    comment_count: row.comment_count || 0,
    is_liked: row.is_liked ? Boolean(row.is_liked) : false
});

// Lấy danh sách bài viết cộng đồng (pagination + hot feed)
exports.getAllPosts = async (req, res) => {
    const sort = req.query.sort === 'hot' || req.query.hot === 'true' ? 'hot' : 'recent';
    try {
        const result = await communityService.listPosts({
            page: req.query.page,
            limit: req.query.limit,
            sort,
            currentUserId: req.user?.ma_nguoi_dung || null
        });
        res.json({
            ...result,
            data: result.data.map(mapPostRow)
        });
    } catch (error) {
        console.error('Error fetching community posts:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể tải danh sách bài viết.' });
    }
};

// Đăng bài viết mới
exports.createPost = async (req, res) => {
    try {
        let media = {};
        let hasMedia = false;
        if (req.file) {
            const relPath = `/uploads/community/${req.file.filename}`;
            hasMedia = true;
            if (req.file.mimetype?.startsWith('video/')) {
                media.video = relPath;
            } else {
                media.anh = relPath;
            }
        }

        const id = await communityService.createPost({
            ma_nguoi_dung: req.user.ma_nguoi_dung,
            ...req.body,
            ...media,
            hasMedia
        });
        const post = await communityService.listPosts({
            page: 1,
            limit: 1,
            currentUserId: req.user.ma_nguoi_dung
        });
        const created = post.data.find((p) => p.ma_bai_viet === id) || { ma_bai_viet: id, ...media };
        res.status(201).json(created);
    } catch (error) {
        console.error('Error creating community post:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể đăng bài viết.' });
    }
};

// Lấy danh sách bình luận cho bài viết
exports.getCommentsByPost = async (req, res) => {
    const { postId } = req.params;
    try {
        const comments = await communityService.getComments(postId);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách bình luận.' });
    }
};

// Thêm bình luận mới
exports.addComment = async (req, res) => {
    const { postId } = req.params;
    const { noi_dung } = req.body;

    try {
        const id = await communityService.addComment(postId, req.user.ma_nguoi_dung, noi_dung);
        const comments = await communityService.getComments(postId);
        const comment = comments.find((c) => c.ma_binh_luan === id) || { ma_binh_luan: id, noi_dung };
        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể thêm bình luận.' });
    }
};

// Like / Unlike
exports.toggleLike = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.ma_nguoi_dung;

    try {
        const liked = await communityService.toggleLike(postId, userId);
        res.json({ liked, message: liked ? 'Đã thích bài viết.' : 'Đã bỏ thích.' });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ message: 'Không thể xử lý like.' });
    }
};

// Admin xóa bài viết vi phạm
exports.deletePost = async (req, res) => {
    const { postId } = req.params;
    try {
        await communityService.deletePost(postId);
        res.json({ message: 'Đã xóa bài viết.' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Không thể xóa bài viết.' });
    }
};
