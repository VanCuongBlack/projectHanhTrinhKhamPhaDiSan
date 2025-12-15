import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { getPosts, createPost, getComments, addComment, toggleLikePost } from '../api/communityApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fadeInUp, staggerContainer } from '../lib/motion';

const filters = ['Tất cả', 'Theo dõi', 'Phổ biến', 'Review Tour', 'Ảnh đẹp'];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');

const avatarFallback =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDFX3VePLpoGw2xiF8GVUz7E5Tvo8JjDjIqVtvDO-o0C9UXFJcjOxBmE_USQeFTblglg2QD0kJIs3ZB6gVekvZaNU6Jp41xQNAio9ba5VcE3mFoPnSX78V7HCmIzjDAz2LLhnvmXnhAyvW0xE7PpdHnsh2quLvH4wbi2lg7mWyIu0rYunXMfyS-M0E9hjzTpsrXYSkSKdCQPdbw_2LF_N2LQaYapNK4gzP4UCWPMcta9rpdDbaBafk20l8RJJnqlrvwbHx9TgVLFYE';

const heroImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBh-WtsaurHzV5IfYu8BxNf95Rll-ZnmZBWhsk9wWP02m_kI5KEt1q1kts1iiqP8FOUOtT8T30-X7bCZPq7qgCaYVEmYH7gOA3RRoIgwz9yZ96dXNQeG3RR_iZsBHVMGdg13N_I5cdLmWl-OCnEP4MADOsHA0C5qzF2noOwlGMpzYZnqgo8fTHRjlHP8rvi77330dg3-xeUVzRaBD76bDUUUQ6mlIHA_B5NjAy_sv2dHy_z3bUDe_Lav2mo3Emp1LYSmNd2EPFe4iM',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC843K4Vh9-zh2P_1xmh8k6o_YFf0dK_FEKfXMjiDJEgOtyoYYMAo1BpxWO7ddn1wpEIOEGSV38BfFUFgH7lk_jb4H5gdxj6bgPLG0JBBkwgWBmV1JjNL-YczoMGIEJuCpKHjXT9TRzFlIiCp76g1AUD8HLNtnYsJWlqHrcDsrLIkxdfZPiibZg-RmuEely8qkT1lb722gJN0tPzSt5Xx3T361_447iHKdK3zrgtIPs8qI1V1ab8rRujeeTPmwk5RCgwrL7CDm8UQc',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD-1vOrJ91cRN5pyV9pNy7_UfwH3MxSfkC13nJDGRH6zmxNNT6BwxSog6MFxr-Y9xrddzaa9e8UCRBk81GytJ5ggHqKOeUZSv7js8c13nYA_UXfPgws5uTyGnLvEj8MiksTdNqDeJG2egd06qNrdiSBE1XO4SjGdrXHIE4_tLC_S3f3bk2-MCkqjzEhpgi4Ac9xilNyQoNSjoTyXbbF6d2VxdeGrNsT_LrSVQNVqQjuWiL9J049lyEU1hVbRuUeDdnItuREGsfKWxU',
];

const CommunityPage = () => {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [visibleCount, setVisibleCount] = useState(6);

  const [postForm, setPostForm] = useState({ noi_dung: '', anh: '', video: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState(null);
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const statusTone = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
  };

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPosts();
      setPosts(data.data || data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải bài viết.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!token) {
      setStatus({ type: 'warning', text: 'Bạn cần đăng nhập để chia sẻ.' });
      return;
    }
    setStatus({ type: 'info', text: 'Đang đăng bài...' });
    try {
      let payload;
      if (selectedFile) {
        payload = new FormData();
        payload.append('tieu_de', postForm.noi_dung?.slice(0, 60) || 'Chia sẻ cộng đồng');
        payload.append('noi_dung', postForm.noi_dung);
        payload.append('media', selectedFile);
      } else {
        payload = {
          tieu_de: postForm.noi_dung?.slice(0, 60) || 'Chia sẻ cộng đồng',
          noi_dung: postForm.noi_dung,
          anh: postForm.anh || '',
          video: postForm.video || '',
        };
      }
      await createPost(payload);
      setStatus({ type: 'success', text: 'Đã đăng bài thành công.' });
      setPostForm({ noi_dung: '', anh: '', video: '' });
      setSelectedFile(null);
      setPreviewUrl('');
      loadPosts();
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Không thể đăng bài.' });
    }
  };

  const handleLoadComments = async (postId) => {
    if (comments[postId]) return;
    try {
      const data = await getComments(postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Không thể tải bình luận.' });
    }
  };

  const handleAddComment = async (postId, event) => {
    event.preventDefault();
    if (!token) {
      setStatus({ type: 'warning', text: 'Đăng nhập để bình luận.' });
      return;
    }
    const content = commentInputs[postId];
    if (!content) return;
    try {
      await addComment(postId, { noi_dung: content });
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      const updated = await getComments(postId);
      setComments((prev) => ({ ...prev, [postId]: updated }));
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Không thể thêm bình luận.' });
    }
  };

  const handleToggleLike = async (postId) => {
    if (!token) {
      setStatus({ type: 'warning', text: 'Đăng nhập để thả tim.' });
      return;
    }
    try {
      const res = await toggleLikePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.ma_bai_viet === postId
            ? {
                ...p,
                is_liked: res.liked,
                like_count: res.liked ? (p.like_count || 0) + 1 : Math.max((p.like_count || 1) - 1, 0),
              }
            : p
        )
      );
      setStatus({ type: 'success', text: res.message || (res.liked ? 'Đã thích' : 'Đã bỏ thích') });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Không thể like bài viết.' });
    }
  };

  const filteredPosts = useMemo(() => {
    const list = [...posts];
    switch (activeFilter) {
      case 'Ảnh đẹp':
        return list.filter((p) => p.anh);
      case 'Review Tour':
        return list.filter((p) => `${p.tieu_de || ''} ${p.noi_dung || ''}`.toLowerCase().includes('tour'));
      case 'Phổ biến':
        return list.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      default:
        return list;
    }
  }, [activeFilter, posts]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        setVisibleCount((prev) => Math.min(prev + 4, filteredPosts.length));
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [filteredPosts.length]);

  const sharePlaceholder = () => {
    setStatus({ type: 'info', text: 'Tính năng chia sẻ sẽ sớm có mặt.' });
  };

  const buildFileUrl = (rel) => {
    if (!rel) return null;
    if (/^https?:\/\//.test(rel)) return rel;
    return `${API_ROOT}${rel.startsWith('/') ? '' : '/'}${rel}`;
  };

  return (
    <PageShell className="bg-background-light min-h-screen">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6 px-3 md:px-6">
        <header className="flex flex-col gap-1 text-center md:text-left">
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.08em]">Cộng đồng</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#111813] tracking-[-0.03em]">Chia sẻ trải nghiệm di sản</h1>
          <p className="text-[#608a6e]">Lan tỏa hành trình, kết nối bạn bè, khám phá thêm điểm đến mới.</p>
          {status && (
            <div className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${statusTone[status.type] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              {status.text}
            </div>
          )}
        </header>

        <main className="flex flex-col gap-4 max-w-[1100px] mx-auto w-full">
          <div className="w-full rounded-[20px] bg-white border border-[#e8efe9] shadow-sm p-4 md:p-5">
            <form className="flex flex-col gap-3" onSubmit={handleCreatePost}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-center bg-cover" style={{ backgroundImage: `url('${avatarFallback}')` }} />
                <input
                  className="flex-1 h-12 rounded-full border border-[#e5e7eb] bg-[#f7fbf9] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={postForm.noi_dung}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, noi_dung: e.target.value }))}
                  placeholder="Chia sẻ trải nghiệm chuyến đi của bạn..."
                />
                <Button
                  type="submit"
                  className="h-12 px-5 bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] rounded-full shadow-sm shadow-primary/25 hover:shadow-md hover:-translate-y-0.5"
                >
                  Đăng bài
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-[#608a6e] flex-wrap gap-3 border-t border-dashed border-[#e5e7eb] pt-3">
                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-transparent cursor-pointer hover:bg-[#f5f8f6] transition">
                    <span className="material-symbols-outlined text-[20px]">image</span> Ảnh/Video
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSelectedFile(file);
                        const url = URL.createObjectURL(file);
                        setPreviewUrl(url);
                        setPostForm((prev) => ({ ...prev, anh: '', video: '' }));
                      }}
                    />
                  </label>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-transparent">
                    <span className="material-symbols-outlined text-[20px]">location_on</span> Check-in
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-transparent">
                    <span className="material-symbols-outlined text-[20px]">mood</span> Cảm xúc
                  </span>
                </div>
              </div>

              {(previewUrl || postForm.anh || postForm.video) && (
                <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fbf9] p-3">
                  {previewUrl && (!selectedFile || selectedFile.type.startsWith('image/')) && (
                    <img src={previewUrl} alt="Xem trước ảnh" className="w-full max-h-[360px] object-cover rounded-lg" />
                  )}
                  {previewUrl && selectedFile && selectedFile.type.startsWith('video/') && (
                    <video controls className="w-full max-h-[360px] rounded-lg">
                      <source src={previewUrl} />
                    </video>
                  )}
                  {!previewUrl && postForm.anh && (
                    <img src={postForm.anh} alt="Xem trước ảnh" className="w-full max-h-[360px] object-cover rounded-lg" />
                  )}
                  {!previewUrl && postForm.video && (
                    <video controls className="w-full max-h-[360px] rounded-lg">
                      <source src={postForm.video} />
                    </video>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="w-full flex gap-2 overflow-x-auto pb-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition ${
                  activeFilter === f
                    ? 'bg-[#111813] text-white shadow-sm'
                    : 'bg-white text-[#111813] border border-[#e0e9e3] hover:bg-[#f5f8f6]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading && <p className="text-sm text-[#608a6e]">Đang tải bài viết...</p>}
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <motion.div className="w-full grid grid-cols-1 gap-5 max-w-[1100px] mx-auto" {...staggerContainer(0.06, 0.05)}>
            {visiblePosts.map((post, idx) => {
              const hasImage = !!post.anh;
              const hasVideo = !!post.video;
              const cover = buildFileUrl(post.anh) || heroImages[idx % heroImages.length];
              const likeCount = post.like_count || 0;
              const commentCount = post.comment_count ?? (comments[post.ma_bai_viet]?.length || 0);
              return (
                <motion.article key={post.ma_bai_viet} className="h-full" {...fadeInUp(idx * 0.03)}>
                  <Card className="rounded-[18px] border border-[#e8efe9] shadow-sm overflow-hidden w-full">
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-center bg-cover ring-1 ring-[#e0e9e3]"
                          style={{ backgroundImage: `url('${avatarFallback}')` }}
                        />
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#111813] m-0">{post.ho_ten || post.tac_gia?.ho_ten || 'Thành viên'}</h3>
                            <Badge variant="info">#{post.ma_bai_viet}</Badge>
                          </div>
                          <p className="text-xs text-[#608a6e]">
                            {post.ma_dia_diem ? `Gắn với địa điểm #${post.ma_dia_diem}` : 'Cộng đồng di sản Việt'}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#608a6e]">more_horiz</span>
                    </div>

                    {cover && (
                      <div className="bg-gray-50">
                        <img
                          src={cover}
                          alt={post.tieu_de}
                          className={`w-full object-cover ${hasImage ? 'max-h-[320px]' : 'max-h-[260px]'} transition-transform duration-500 hover:scale-[1.01]`}
                        />
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-lg font-semibold text-[#111813] m-0">{post.tieu_de || 'Bài chia sẻ'}</h4>
                        <p className="text-sm text-[#608a6e] leading-relaxed">
                          {post.noi_dung || 'Chia sẻ hành trình của bạn với cộng đồng.'}
                        </p>
                      </div>
                      {hasVideo && (
                        <a
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                          href={buildFileUrl(post.video)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_circle</span>
                          Xem video đính kèm
                        </a>
                      )}
                      <div className="flex items-center justify-between text-sm text-[#4d6b56] border-t border-[#e0e9e3] border-b pb-3 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#e23d4f]" aria-hidden="true">
                            favorite
                          </span>
                          <span className="font-medium text-[#1f2d25]">{likeCount} người thích</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{commentCount} bình luận</span>
                          <span>{post.share_count || 0} chia sẻ</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 border-b border-[#e0e9e3] text-sm font-semibold text-[#1f2d25]">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post.ma_bai_viet)}
                          className="flex items-center justify-center gap-2 h-11 hover:bg-[#f5f8f6] transition bg-transparent shadow-none border-none px-0"
                          style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}
                        >
                          <span className={`material-symbols-rounded text-[20px] ${post.is_liked ? 'text-primary' : 'text-[#4d6b56]'}`} aria-hidden="true">
                            favorite
                          </span>
                          {post.is_liked ? 'Đã thích' : 'Thích'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadComments(post.ma_bai_viet)}
                          className="flex items-center justify-center gap-2 h-11 hover:bg-[#f5f8f6] transition bg-transparent shadow-none border-none px-0"
                          style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}
                        >
                          <span className="material-symbols-rounded text-[20px] text-[#4d6b56]" aria-hidden="true">
                            chat_bubble
                          </span>
                          Bình luận
                        </button>
                        <button
                          type="button"
                          onClick={sharePlaceholder}
                          className="flex items-center justify-center gap-2 h-11 hover:bg-[#f5f8f6] transition bg-transparent shadow-none border-none px-0"
                          style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}
                        >
                          <span className="material-symbols-rounded text-[20px] text-[#4d6b56]" aria-hidden="true">
                            ios_share
                          </span>
                          Chia sẻ
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(comments[post.ma_bai_viet] || []).map((comment) => (
                          <div key={comment.ma_binh_luan} className="rounded-lg bg-[#f5f8f6] px-3 py-2">
                            <p className="text-xs font-semibold text-[#111813] m-0">{comment.ho_ten || 'Khách'}</p>
                            <p className="text-sm text-[#608a6e] m-0">{comment.noi_dung}</p>
                          </div>
                        ))}
                      </div>

                      <form
                        className="flex flex-col gap-2"
                        onSubmit={(event) => handleAddComment(post.ma_bai_viet, event)}
                      >
                        <input
                          placeholder="Ý kiến của bạn..."
                          className="w-full rounded-lg border border-[#e0e9e3] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={commentInputs[post.ma_bai_viet] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.ma_bai_viet]: e.target.value }))
                          }
                        />
                        <Button type="submit" size="sm" className="self-start px-3 py-2 bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] shadow-primary/25">
                          Gửi
                        </Button>
                      </form>
                    </div>
                  </Card>
                </motion.article>
              );
            })}

            {!loading && visiblePosts.length === 0 && (
              <p className="text-sm text-[#608a6e]">Chưa có bài viết phù hợp bộ lọc này.</p>
            )}
          </motion.div>
        </main>
      </div>
    </PageShell>
  );
};

export default CommunityPage;
