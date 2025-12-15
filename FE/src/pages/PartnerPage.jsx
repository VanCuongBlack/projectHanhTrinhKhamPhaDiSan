import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createTour, deleteTour, getTours, uploadTourMedia, getPartnerBookingStats } from '../api/contentApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fadeInUp, staggerContainer } from '../lib/motion';

const defaultForm = {
  tieu_de: '',
  loai_hinh: 'Du lịch di sản',
  so_ngay: '3',
  don_vi_thoi_luong: 'Ngày',
  dia_diem: '',
  mo_ta: '',
  gia: '',
  gia_tre_em: '',
  anh: '',
  ngay_khoi_hanh: '',
};

const buildAbsoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const host = apiBase.replace(/\/api$/, '');
  return `${host}${url}`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0';
  return Number(value).toLocaleString('vi-VN');
};

const PartnerPage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [media, setMedia] = useState([]);
  const [itinerary, setItinerary] = useState([{ title: 'Khởi hành & tham quan', time: '08:00' }]);
  const [bookingStats, setBookingStats] = useState({ total: 0, pending: 0, partnerId: null });

  const stats = useMemo(() => {
    const partnerTours = bookingStats.partnerId ? tours.filter((t) => String(t.ma_partner) === String(bookingStats.partnerId)) : tours;
    const total = partnerTours.length;
    const active = partnerTours.length; // chưa có trạng thái chạy, tạm tính toàn bộ tour của đối tác
    const bookings = bookingStats.total || 0;
    const revenue = tours.reduce((sum, t) => sum + Number(t.gia || 0), 0);
    return { total, active, bookings, revenue };
  }, [bookingStats.partnerId, bookingStats.total, tours]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTours();
        setTours(res || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không tải được danh sách tour');
      } finally {
        setLoading(false);
      }
    };
    load();
    getPartnerBookingStats()
      .then((res) => {
        setBookingStats({
          total: res?.total || 0,
          pending: res?.byStatus?.pending || 0,
          partnerId: res?.partnerId || null,
        });
      })
      .catch(() => {});
  }, []);

  const handleSelectMedia = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const uploaded = await Promise.all(
      files.map(async (file) => {
        try {
          const res = await uploadTourMedia(file);
          const fullUrl = buildAbsoluteUrl(res.url || res.path);
          return { name: file.name, url: fullUrl };
        } catch (err) {
          toast.error(`Upload thất bại: ${file.name}`);
          return null;
        }
      })
    );
    const valid = uploaded.filter(Boolean);
    setMedia((prev) => [...prev, ...valid]);
    if (!form.anh && valid[0]) {
      setForm((prev) => ({ ...prev, anh: valid[0].url }));
    }
  };

  const handleRemoveMedia = (index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
    if (index === 0 && media[0] && form.anh === media[0].url) {
      setForm((prev) => ({ ...prev, anh: media[1]?.url || '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!form.tieu_de || !form.gia) {
      toast.error('Vui lòng nhập tên tour và giá');
      return;
    }
    setSubmitting(true);
    try {
      const coverUrl = (() => {
        const candidate = form.anh || media[0]?.url || '';
        return candidate?.startsWith('blob:') ? '' : candidate;
      })();

      const payload = {
        tieu_de: form.tieu_de,
        so_ngay: Number(form.so_ngay || 0),
        so_dem: 0,
        gia: Number(form.gia || 0),
        gia_tre_em: form.gia_tre_em ? Number(form.gia_tre_em || 0) : null,
        loai_hinh: form.loai_hinh,
        don_vi_thoi_luong: form.don_vi_thoi_luong,
        dia_diem: form.dia_diem,
        mo_ta: form.mo_ta,
        // Không lưu blob: URL, chỉ gửi URL thực (nếu đã có); ngược lại để trống và BE có thể gán ảnh mặc định.
        anh: coverUrl,
        ngay_khoi_hanh: form.ngay_khoi_hanh,
        lich_trinh: itinerary,
        media: media.map((m) => ({ name: m.name, url: m.url })),
      };
      await createTour(payload);
      toast.success('Đã tạo tour mới');
      setForm(defaultForm);
      setMedia([]);
      const res = await getTours().catch(() => tours);
      setTours(res || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo tour');
    } finally {
      setSubmitting(false);
    }
  };

  const recentTours = tours.slice(0, 3);

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1220px] mx-auto flex flex-col gap-6">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Đối tác</p>
            <h1 className="text-3xl md:text-4xl font-black text-[#111813] tracking-tight">Quản lý & Tạo Tour</h1>
            <p className="text-sm text-[#5f6f65]">Theo dõi hiệu suất và cập nhật sản phẩm du lịch của bạn.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              className="border border-slate-200 bg-white text-[#111813] hover:bg-slate-50 shadow-sm"
              onClick={() => toast.success('Tính năng nhập Excel sẽ được bổ sung')}
            >
              <span className="material-symbols-outlined text-[20px]">file_upload</span> Nhập Excel
            </Button>
            <Button
              type="button"
              className="bg-[#111813] text-white hover:-translate-y-0 shadow-md hover:shadow-lg"
              onClick={() => {
                const formEl = document.getElementById('create-tour-form');
                formEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <span className="material-symbols-outlined text-[20px]">add</span> Tạo tour mới
            </Button>
          </div>
        </section>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" {...staggerContainer(0.06, 0.05)}>
          {[
            { title: 'Tổng số tour', value: stats.total, icon: 'inventory_2', accent: 'text-[#111813]' },
            { title: 'Tour đang chạy', value: stats.active, icon: 'play_circle', accent: 'text-primary' },
            { title: 'Tổng lượt đặt', value: stats.bookings, icon: 'confirmation_number', accent: 'text-blue-500' },
            { title: 'Doanh thu ước tính', value: `${formatNumber(stats.revenue)} đ`, icon: 'monetization_on', accent: 'text-amber-500' },
          ].map((item, idx) => (
            <motion.div key={item.title} {...fadeInUp(idx * 0.02)}>
              <Card className="flex flex-col gap-1 rounded-xl p-5 border border-[#dbe6df] bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#6c7a70] m-0">{item.title}</p>
                  <span className={`material-symbols-outlined ${item.accent}`}>{item.icon}</span>
                </div>
                <p className="text-3xl font-bold text-[#111813] m-0">{item.value}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <section className="flex flex-col gap-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex gap-6 text-sm font-bold">
              <span className="border-b-2 border-primary text-[#111813] pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add_circle</span> Tạo tour mới
              </span>
              <span className="text-[#6c7a70] pb-3">Danh sách tour</span>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="create-tour-form">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card className="bg-white border border-[#dbe6df] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#111813] flex items-center gap-2 m-0">
                    <span className="size-8 rounded-full bg-green-50 text-primary flex items-center justify-center text-sm font-bold">1</span>
                    Thông tin cơ bản
                  </h3>
                </div>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-[#111813]">Tên tour</label>
                    <input
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Ví dụ: Khám phá Cố đô Huế 3N2Đ"
                      value={form.tieu_de}
                      onChange={(e) => setForm((prev) => ({ ...prev, tieu_de: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#111813]">Loại hình</label>
                    <select
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary"
                      value={form.loai_hinh}
                      onChange={(e) => setForm((prev) => ({ ...prev, loai_hinh: e.target.value }))}
                    >
                      <option>Du lịch di sản</option>
                      <option>Ẩm thực & văn hóa</option>
                      <option>Du lịch mạo hiểm</option>
                      <option>Nghỉ dưỡng</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#111813]">Thời lượng</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        className="w-24 h-11 px-3 rounded-lg border border-slate-200 text-center focus:ring-2 focus:ring-primary focus:border-primary"
                        value={form.so_ngay}
                        onChange={(e) => setForm((prev) => ({ ...prev, so_ngay: e.target.value }))}
                      />
                      <select
                        className="h-11 px-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary"
                        value={form.don_vi_thoi_luong}
                        onChange={(e) => setForm((prev) => ({ ...prev, don_vi_thoi_luong: e.target.value }))}
                      >
                        <option>Ngày</option>
                        <option>Giờ</option>
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-[#111813]">Địa điểm khởi hành</label>
                    <div className="relative">
                      <input
                        className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Nhập địa điểm..."
                        value={form.dia_diem}
                        onChange={(e) => setForm((prev) => ({ ...prev, dia_diem: e.target.value }))}
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-[#111813]">Mô tả chi tiết</label>
                    <textarea
                      rows={4}
                      className="w-full p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Mô tả những điểm nổi bật của tour..."
                      value={form.mo_ta}
                      onChange={(e) => setForm((prev) => ({ ...prev, mo_ta: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={submitting} className="px-6">
                      {submitting ? 'Đang tạo...' : 'Lưu thông tin cơ bản'}
                    </Button>
                  </div>
                </form>
              </Card>

              <Card className="bg-white border border-[#dbe6df] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#111813] flex items-center gap-2 m-0">
                    <span className="size-8 rounded-full bg-green-50 text-primary flex items-center justify-center text-sm font-bold">2</span>
                    Hình ảnh & Video
                  </h3>
                </div>
                <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-green-50/40 transition cursor-pointer">
                  <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                  </div>
                  <p className="text-sm font-semibold text-[#111813] text-center">Kéo thả hình hoặc chọn để tải lên</p>
                  <span className="text-xs text-slate-500">Hỗ trợ JPG, PNG, MP4. Tối đa 50MB.</span>
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleSelectMedia} />
                </label>
                {media.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                    {media.map((item, idx) => (
                      <div key={item.url} className="relative rounded-lg overflow-hidden bg-slate-100 group">
                        {item.url.endsWith('.mp4') ? (
                          <video src={item.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          style={{ boxShadow: 'none' }}
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="bg-white border border-[#dbe6df] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#111813] flex items-center gap-2 m-0">
                    <span className="size-8 rounded-full bg-green-50 text-primary flex items-center justify-center text-sm font-bold">3</span>
                    Lịch trình chi tiết
                  </h3>
                  <button
                    type="button"
                    onClick={() => setItinerary((prev) => [...prev, { title: 'Hoạt động mới', time: '09:00' }])}
                    className="text-sm font-bold text-primary flex items-center gap-1 bg-transparent border-none"
                    style={{ boxShadow: 'none', padding: 0 }}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span> Thêm ngày
                  </button>
                </div>
                <div className="flex flex-col gap-4 relative">
                  <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-slate-200" />
                  {itinerary.map((item, idx) => (
                    <div key={`${item.title}-${idx}`} className="relative z-10 flex gap-4">
                      <div className={`size-10 rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm ${idx === 0 ? 'bg-primary text-white' : 'bg-white border-2 border-primary text-primary'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between items-start gap-2">
                          <input
                            className="bg-transparent text-base font-bold text-[#111813] border-none p-0 focus:ring-0 w-full"
                            value={item.title}
                            onChange={(e) =>
                              setItinerary((prev) => prev.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it)))
                            }
                          />
                          {itinerary.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setItinerary((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-red-500 bg-transparent border-none"
                              style={{ boxShadow: 'none', padding: 0 }}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                        <div className="flex gap-3 items-start mt-2">
                          <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">{item.time}</span>
                          <input
                            className="flex-1 text-sm text-[#4f5f55] bg-transparent border-none p-0 focus:ring-0"
                            value={item.desc || 'Mô tả hoạt động'}
                            onChange={(e) =>
                              setItinerary((prev) => prev.map((it, i) => (i === idx ? { ...it, desc: e.target.value } : it)))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
              <Card className="bg-white border border-[#dbe6df] rounded-xl p-6 shadow-sm sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  <h3 className="text-lg font-bold text-[#111813] m-0">Giá & Chính sách</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#111813] mb-1 block">Giá người lớn (VND)</label>
                    <div className="relative">
                      <input
                        className="w-full h-11 pl-4 pr-10 text-right font-mono font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary"
                        value={form.gia}
                        onChange={(e) => setForm((prev) => ({ ...prev, gia: e.target.value }))}
                        placeholder="1.500.000"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₫</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#111813] mb-1 block">Giá trẻ em (VND)</label>
                    <div className="relative">
                      <input
                        className="w-full h-11 pl-4 pr-10 text-right font-mono font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary"
                        value={form.gia_tre_em}
                        onChange={(e) => setForm((prev) => ({ ...prev, gia_tre_em: e.target.value }))}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₫</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#111813] mb-1 block">Ngày khởi hành</label>
                    <input
                      type="date"
                      className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary"
                      value={form.ngay_khoi_hanh}
                      onChange={(e) => setForm((prev) => ({ ...prev, ngay_khoi_hanh: e.target.value }))}
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
                    <Button type="button" onClick={handleSubmit} disabled={submitting} className="w-full justify-center">
                      {submitting ? 'Đang đăng...' : 'Đăng tour'}
                    </Button>
                    <Button
                      type="button"
                      variant="soft"
                      className="w-full justify-center bg-slate-100 text-[#111813]"
                      onClick={() => toast.success('Đã lưu nháp tại trình duyệt')}
                    >
                      Lưu bản nháp
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-[#dbe6df] rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Tour vừa cập nhật</h4>
                <div className="flex flex-col gap-3">
                  {recentTours.map((tour) => (
                    <div key={tour.ma_tour} className="flex gap-3 items-center p-2 rounded-lg hover:bg-slate-50 transition">
                      <div
                        className="size-10 rounded bg-slate-200 bg-center bg-cover"
                        style={{ backgroundImage: `url('${tour.anh || media[0]?.url || ''}')` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111813] truncate">{tour.tieu_de}</p>
                        <p className="text-xs text-slate-500">#{tour.ma_tour}</p>
                      </div>
                      <span className="size-2 rounded-full bg-green-500" />
                    </div>
                  ))}
                  {recentTours.length === 0 && <p className="text-sm text-slate-500">Chưa có tour nào.</p>}
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#111813] m-0">Danh sách Tour hiện có</h3>
            </div>
            <div className="overflow-x-auto rounded-lg border border-[#dbe6df] bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Tên Tour</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Trạng thái</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Giá</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Ngày khởi hành</th>
                    <th className="px-5 py-3 text-xs font-bold text-right text-slate-600 uppercase tracking-wide">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tours.map((tour) => (
                    <tr key={tour.ma_tour} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-10 rounded bg-slate-200 bg-center bg-cover shrink-0"
                            style={{ backgroundImage: `url('${tour.anh || media[0]?.url || ''}')` }}
                          />
                          <div>
                            <p className="text-sm font-bold text-[#111813] m-0">{tour.tieu_de || 'Tour mới'}</p>
                            <p className="text-xs text-slate-500 m-0">#{tour.ma_tour}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge className="bg-green-100 text-green-700 border-0">
                          {tour.trang_thai || 'Đang chạy'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#4f5f55]">{formatNumber(tour.gia)} đ</td>
                      <td className="px-5 py-3 text-sm text-[#4f5f55]">{tour.ngay_khoi_hanh || tour.ngay_tao || '--'}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="text-slate-500 hover:text-primary bg-transparent border-none"
                            style={{ boxShadow: 'none', padding: 0 }}
                            onClick={() => toast.success('Chức năng chỉnh sửa sẽ sớm bổ sung')}
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            type="button"
                            className="text-slate-500 hover:text-red-500 bg-transparent border-none"
                            style={{ boxShadow: 'none', padding: 0 }}
                            onClick={async () => {
                              if (!window.confirm('Xóa tour này?')) return;
                              try {
                                await deleteTour(tour.ma_tour);
                                setTours((prev) => prev.filter((t) => t.ma_tour !== tour.ma_tour));
                                toast.success('Đã xóa tour');
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Không xóa được tour');
                              }
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && tours.length === 0 && (
                    <tr>
                      <td className="px-5 py-4 text-sm text-slate-500" colSpan={5}>
                        Chưa có tour nào. Hãy tạo tour đầu tiên của bạn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default PartnerPage;
