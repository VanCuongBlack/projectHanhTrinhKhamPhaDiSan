const communityRepo = require('../repositories/communityRepository');

exports.listPosts = async ({ page = 1, limit = 10, sort = 'recent', currentUserId = null }) => {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * safeLimit;
    const { posts, total } = await communityRepo.listPosts(currentUserId, safeLimit, offset, sort);
    return { page: safePage, limit: safeLimit, total, data: posts };
};

exports.createPost = async (payload) => {
    const { ma_nguoi_dung, tieu_de, noi_dung, anh, video, ma_dia_diem, hasMedia } = payload;
    const hasContent = Boolean((noi_dung || '').trim());
    const hasFile = Boolean(anh || video || hasMedia);
    if (!hasContent && !hasFile) {
        const err = new Error('Cần có nội dung hoặc media để đăng bài.');
        err.status = 400;
        throw err;
    }
    const id = await communityRepo.createPost({ ma_nguoi_dung, ma_dia_diem, tieu_de, noi_dung, anh, video });
    return id;
};

exports.getComments = async (postId) => communityRepo.getComments(postId);

exports.addComment = async (postId, userId, noi_dung) => {
    if (!noi_dung) {
        const err = new Error('Nội dung bình luận là bắt buộc.');
        err.status = 400;
        throw err;
    }
    return communityRepo.addComment(postId, userId, noi_dung);
};

exports.toggleLike = async (postId, userId) => {
    return communityRepo.toggleLike(postId, userId);
};

exports.deletePost = async (postId) => {
    const affected = await communityRepo.deletePost(postId);
    if (!affected) {
        const err = new Error('Không tìm thấy bài viết.');
        err.status = 404;
        throw err;
    }
    return true;
};
