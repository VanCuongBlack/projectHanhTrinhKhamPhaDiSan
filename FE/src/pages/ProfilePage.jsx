import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getProfile, changePassword, uploadAvatar } from '../api/userApi';
import { getMyCheckins, listMyVouchers } from '../api/communityApi';
import { listUserGuideBookings, addGuideReview } from '../api/guideApi';
import { listMyTourBookings } from '../api/contentApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { fadeInUp, staggerContainer } from '../lib/motion';
import { useAuthStore } from '../store/authStore';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [points, setPoints] = useState(0);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [tourBookings, setTourBookings] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [reviewTarget, setReviewTarget] = useState({ id: null, rating: 5, comment: '' });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const API_ROOT = API_BASE.replace(/\/api\/?$/, '');
  const avatarUrl =
    profile?.anh_dai_dien && !profile?.anh_dai_dien.includes('http')
      ? `${API_ROOT}${profile.anh_dai_dien.startsWith('/') ? '' : '/'}${profile.anh_dai_dien}`
      : profile?.anh_dai_dien || 'https://lh3.googleusercontent.com/a-/AOh14GjD';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const errors = [];
      const safe = async (fn, fallback) => {
        try {
          return await fn();
        } catch (err) {
          errors.push(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu');
          return fallback;
        }
      };
      const prof = await safe(() => getProfile(), null);
      const check = await safe(() => getMyCheckins(), null);
      const vouchersRes = await safe(() => listMyVouchers(), []);
      const tourBooked = await safe(() => listMyTourBookings(), []);
      const guideBooked = await safe(() => listUserGuideBookings(), []);

      setProfile(prof);
      setPoints(check?.points || 0);
      setCheckins(check?.checkins || []);
      setVouchers(vouchersRes || []);
      setTourBookings(tourBooked || []);
      setGuideBookings(guideBooked || []);

      if (errors.length) toast.error(errors[0]);
      setLoading(false);
    };
    load();
  }, []);

  const memberTier = useMemo(() => {
    if (points >= 2000) return 'Bạch Kim';
    if (points >= 1000) return 'Vàng';
    if (points >= 500) return 'Bạc';
    return 'Thành viên';
  }, [points]);

  const stats = [
    { title: 'Điểm thưởng', value: points.toLocaleString('vi-VN'), icon: 'stars' },
    { title: 'Check-in', value: checkins.length, icon: 'location_on' },
    { title: 'Voucher', value: vouchers.length, icon: 'redeem' },
    { title: 'Vai trò', value: profile?.vai_tro || user?.vai_tro || 'User', icon: 'verified_user' },
  ];

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-6">
        <motion.div {...fadeInUp(0)}>
          <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className="size-14 rounded-full bg-slate-200 bg-center bg-cover border-2 border-white shadow-sm"
                style={{ backgroundImage: `url('${avatarUrl}')` }}
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary m-0">Hồ sơ cá nhân</p>
                <h1 className="text-2xl font-black text-[#111813] m-0">{profile?.ho_ten || user?.ho_ten || user?.email}</h1>
                <p className="text-sm text-[#608a6e] m-0">{profile?.email || user?.email}</p>
              </div>
            </div>
            <Badge className="bg-green-50 text-green-700 border-0 px-3 py-2 text-sm font-bold">{memberTier}</Badge>
          </Card>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" {...staggerContainer(0.05, 0.05)}>
          {stats.map((s, idx) => (
            <motion.div key={s.title} {...fadeInUp(idx * 0.02)}>
              <Card className="p-5 rounded-xl border border-[#dbe6df] bg-white shadow-sm flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-[#608a6e]">
                  <span className="material-symbols-outlined text-primary">{s.icon}</span>
                  {s.title}
                </div>
                <p className="text-2xl font-bold text-[#111813] m-0">{s.value}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" {...staggerContainer(0.06, 0.05)}>
          <motion.div {...fadeInUp(0.02)} className="lg:col-span-2">
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#111813] m-0">Thông tin cá nhân</h3>
                <Badge variant="info">ID: {profile?.id || profile?.ma_user || '---'}</Badge>
              </div>
              {loading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-[#608a6e] m-0">Email</p>
                    <p className="text-sm font-semibold text-[#111813] m-0">{profile?.email || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-[#608a6e] m-0">Số điện thoại</p>
                    <p className="text-sm font-semibold text-[#111813] m-0">{profile?.so_dien_thoai || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-[#608a6e] m-0">Vai trò</p>
                    <p className="text-sm font-semibold text-[#111813] m-0">{profile?.vai_tro || user?.vai_tro || 'User'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-[#608a6e] m-0">Điểm tích lũy</p>
                    <p className="text-sm font-semibold text-[#111813] m-0">{points.toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div {...fadeInUp(0.04)} className="flex flex-col gap-4">
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-[#111813] m-0 mb-3">Ảnh đại diện</h3>
              <div className="flex items-center gap-3">
                <div
                  className="size-16 rounded-full bg-slate-200 bg-center bg-cover border border-[#dbe6df]"
                  style={{ backgroundImage: `url('${avatarUrl}')` }}
                />
                <label className="flex items-center gap-2 bg-primary text-black px-3 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-primary-hover transition-colors">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  {avatarUploading ? 'Đang tải...' : 'Tải ảnh'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAvatarUploading(true);
                      try {
                        const res = await uploadAvatar(file);
                        toast.success('Đã cập nhật avatar');
                        setProfile((prev) => ({ ...prev, anh_dai_dien: res?.url || res?.avatar || prev?.anh_dai_dien }));
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Không thể upload avatar');
                      }
                      setAvatarUploading(false);
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-[#608a6e] mt-2">Hỗ trợ JPG/PNG/WebP, tối đa 2MB.</p>
            </Card>

            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-[#111813] m-0 mb-3">Voucher của bạn</h3>
              <div className="flex flex-col gap-3">
                {vouchers.length === 0 && !loading && <p className="text-sm text-[#608a6e]">Chưa có voucher.</p>}
                {vouchers.slice(0, 3).map((v) => (
                  <div key={v.id || v.ma_voucher} className="rounded-lg border border-[#dbe6df] p-3 bg-slate-50">
                    <p className="text-sm font-bold text-[#111813] m-0">{v.tieu_de || v.code}</p>
                    <p className="text-xs text-[#608a6e] m-0">
                      {v.giam_phan_tram ? `${v.giam_phan_tram}% • tối đa ${Number(v.giam_toi_da || 0).toLocaleString('vi-VN')}đ` : v.mo_ta}
                    </p>
                    <p className="text-xs text-[#608a6e] m-0">
                      HSD: {v.ngay_bat_dau?.slice(0, 10)} - {v.ngay_ket_thuc?.slice(0, 10)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex-1">
              <h3 className="text-base font-bold text-[#111813] m-0 mb-3">Hạng thành viên</h3>
              <div className="rounded-lg bg-[#f5f8f6] border border-[#dbe6df] p-4">
                <p className="text-sm font-semibold text-[#111813] m-0">{memberTier}</p>
                <p className="text-xs text-[#608a6e] m-0">Tích lũy nhiều điểm hơn để lên hạng cao hơn</p>
              </div>
            </Card>

            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-[#111813] m-0 mb-3">Đổi mật khẩu</h3>
              <form
                className="flex flex-col gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
                    toast.error('Nhập đủ các trường');
                    return;
                  }
                  if (passwordForm.next !== passwordForm.confirm) {
                    toast.error('Mật khẩu nhập lại không khớp');
                    return;
                  }
                  setPasswordSubmitting(true);
                  try {
                    await changePassword({
                      mat_khau_cu: passwordForm.current,
                      mat_khau_moi: passwordForm.next,
                      confirm_mat_khau_moi: passwordForm.confirm,
                    });
                    toast.success('Đã đổi mật khẩu');
                    setPasswordForm({ current: '', next: '', confirm: '' });
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Không thể đổi mật khẩu');
                  }
                  setPasswordSubmitting(false);
                }}
              >
                <InputField
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
                />
                <InputField
                  label="Mật khẩu mới"
                  type="password"
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
                />
                <InputField
                  label="Nhập lại mật khẩu mới"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="bg-primary text-black font-bold rounded-lg px-4 py-2 disabled:opacity-60"
                >
                  {passwordSubmitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </Card>
          </motion.div>
        </motion.div>

        {checkins.length > 0 && (
          <motion.div {...fadeInUp(0.08)}>
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-[#111813] m-0">Lịch sử check-in</h3>
              <div className="divide-y divide-slate-100">
                {checkins.map((c) => (
                  <div key={c.id} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="m-0 font-semibold text-[#111813]">{c.ten_dia_diem}</p>
                      <p className="m-0 text-sm text-[#608a6e]">
                        #{c.ma_dia_diem} • {c.ten_tinh || ''} • {new Date(c.ngay_checkin).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <Badge className="bg-primary/15 text-primary border-0">+{c.points || 20} điểm</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" {...staggerContainer(0.04, 0.04)}>
          <motion.div {...fadeInUp(0.02)}>
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-[#111813] m-0">Tour đã đặt</h3>
              <div className="divide-y divide-slate-100">
                {tourBookings.map((b) => (
                  <div key={b.ma_dat_tour} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="m-0 font-semibold text-[#111813]">{b.tieu_de || `Tour #${b.ma_tour}`}</p>
                      <p className="m-0 text-xs text-[#608a6e]">
                        Ngày đặt: {b.created_at?.slice(0, 10) || '---'} • Số lượng: {b.so_luong || 1}
                      </p>
                    </div>
                    <Badge className="bg-primary/15 text-primary border-0">
                      {Number(b.so_tien_thuc_thu || b.tong_tien || 0).toLocaleString('vi-VN')} đ
                    </Badge>
                  </div>
                ))}
                {tourBookings.length === 0 && <p className="text-sm text-[#608a6e]">Chưa có tour đã đặt.</p>}
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeInUp(0.04)}>
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-[#111813] m-0">Hướng dẫn viên đã booking</h3>
              <div className="divide-y divide-slate-100">
                {guideBookings.map((g) => (
                  <div key={g.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="m-0 font-semibold text-[#111813]">{g.ho_ten || 'Hướng dẫn viên'}</p>
                      <Badge className="bg-blue-50 text-blue-700 border-0">{g.ngay}</Badge>
                    </div>
                    <p className="m-0 text-xs text-[#608a6e]">
                      {g.gio_bat_dau} - {g.gio_ket_thuc} • {g.dia_diem || 'Theo lịch'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#608a6e]">
                        Tổng: {Number(g.tong_tien || g.gia_tien || 0).toLocaleString('vi-VN')} đ
                      </span>
                      {!g.da_danh_gia && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs font-semibold text-[#0b3b23] bg-white border border-primary/60 hover:bg-primary hover:text-[#111813] px-3 py-1 rounded-lg shadow-sm"
                          onClick={() => setReviewTarget({ id: g.id, rating: 5, comment: '' })}
                        >
                          Đánh giá
                        </Button>
                      )}
                    </div>
                    {reviewTarget.id === g.id && (
                      <form
                        className="mt-2 space-y-2 bg-slate-50 border border-slate-100 rounded-lg p-3"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const rating = Number(reviewTarget.rating);
                          if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
                            toast.error('Điểm hợp lệ 1-5');
                            return;
                          }
                          try {
                            await addGuideReview(g.id, { rating, nhan_xet: reviewTarget.comment || '' });
                            toast.success('Đã gửi đánh giá');
                            setReviewTarget({ id: null, rating: 5, comment: '' });
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <label className="flex items-center gap-1 font-semibold text-[#111813]">
                            Sao:
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={reviewTarget.rating}
                              onChange={(e) => setReviewTarget((prev) => ({ ...prev, rating: e.target.value }))}
                              className="w-16 h-8 border border-slate-200 rounded px-2"
                            />
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                          placeholder="Nhận xét (tùy chọn)"
                          value={reviewTarget.comment}
                          onChange={(e) => setReviewTarget((prev) => ({ ...prev, comment: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-primary text-black font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Gửi đánh giá
                          </button>
                          <button
                            type="button"
                            className="bg-slate-200 text-[#111813] font-bold px-3 py-1.5 rounded-lg text-xs"
                            onClick={() => setReviewTarget({ id: null, rating: 5, comment: '' })}
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
                {guideBookings.length === 0 && <p className="text-sm text-[#608a6e]">Chưa có booking hướng dẫn viên.</p>}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default ProfilePage;
