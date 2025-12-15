import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { searchGuideSlots } from '../api/guideApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { fadeInUp, staggerContainer } from '../lib/motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');
const todayISO = () => new Date().toISOString().slice(0, 10);

const fallbackAvatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCntj2faa_8ERtpAPY9VXXaK1NHn1SXtM5xplIbfCq5wf3XIVvNRdlGniC6eWX0RhXBPLFntlKwhRsyLy3NmAWYvJPEyA4O70Gr-9JgjZfMMBKG1Ahf8x1q6HBwBcOovHuE8-T4gzRvmqV6kIzL2jxT0DhV0E8KV6GFIOPzpTOCbYC9Eox_axyAbvrg3HIVU3xoDmqPqBsahnH0Npng01mhLo19yWI__RBTtt1OeTjf__U1McK5_gju5aqcAXG1ALSSAdVnrB64RAU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDr4-1ddrf2HFZ6AdPRIuW6H0LKtwDMx-PO2piE6mxuSs8u54nULqxTWXuaijmbkce2SCXSbuK3kO1s5fL_mZqNM426gFqaVPi1EEEv2GTvBgSEfHKJrY6zHfmzCuA8DXEV_dAV6uyd9dfyAtsj2plw3M1_wbNlDJx0JcFi1mD1h2bR6w9_1PsGiSEud4-iEwPNRnz7eIMjx0cPzCgE2l-YwCfCTxJZWAse7oJMNqr_NXo7ZtAZrm5sEM2vttjl_L6D0KR70zisF3w',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBZJbfnudZ-R5xddWSU9lLT_eYENFU2DbLNdhYuBeyxdyPxR-gdddbMfNTWoEPwM-oJGMxc_inmGvjHoXQhFNMjwyLPAtY--nWqOeS2y7ogimNe9empbQca8kbDZVGNHfztAuUomuSkoZ7bkH023vgeLMMyyrmOoB_tD0CQjVBZKYocbG-XYky_aG7UT1LsMvZzyndYKCSNVRrfihpxhfjPMe1C1uEcbvxcfMv3tWsNPjxVh4N5Z4-gSN96ApFfLK59FGKYcKZVREs',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB7WwctJ_8dg1xt2Z002Wl5QzHA_QMy5ppmZ7CgN--BIunO3uJAsHegPQcZj7kHLA97HN5Sr0zDdt0PoTppom8LLMIzyhEXWW0sSrdLfo7kXiNepgmsgXidtO90by_IAMpQQvNNZMIDyXFLLoHZaVaNsAGgwF12Kf9nw1MkwfI_jvm_Bx0q_qlT64rNvRrAWl35t5ccJDfzFAKDiE6KX3wKymfg97Rc9ewTwk77P1q2BB-OZ51OEEWKYS4HSKwfztIcNb7HIVQw_kQ',
];

const buildFileUrl = (rel, fallback) => {
  if (!rel) return fallback;
  if (/^https?:\/\//.test(rel)) return rel;
  return `${API_ROOT}${rel.startsWith('/') ? '' : '/'}${rel}`;
};

const GuideSearchPage = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [filters, setFilters] = useState({
    keyword: '',
    location: 'all',
    language: 'all',
    expertise: 'all',
    sort: 'popular',
    priceCap: 3000000, // mặc định không lọc bớt ở mức 2tr
    minRating: 0,
  });

  const loadSlots = async (ngay) => {
    setLoading(true);
    try {
      const res = await searchGuideSlots(ngay);
      setSlots(res || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được lịch hướng dẫn viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots(date);
  }, [date]);

  const locations = useMemo(() => {
    const set = new Set();
    slots.forEach((s) => s.dia_diem && set.add(s.dia_diem));
    return Array.from(set);
  }, [slots]);

  const languages = useMemo(() => {
    const set = new Set();
    slots.forEach((s) => s.ngon_ngu && set.add(s.ngon_ngu));
    return Array.from(set);
  }, [slots]);

  const filtered = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return [...slots]
      .filter((s) => {
        if (kw && !`${s.ho_ten || ''} ${s.gioi_thieu || ''} ${s.dia_diem || ''}`.toLowerCase().includes(kw)) return false;
        if (filters.location !== 'all' && s.dia_diem !== filters.location) return false;
        if (filters.language !== 'all' && s.ngon_ngu !== filters.language) return false;
        if (filters.expertise !== 'all' && !(s.chuyen_mon || '').toLowerCase().includes(filters.expertise)) return false;
        if (filters.priceCap && Number(s.gia_tien || 0) > filters.priceCap) return false;
        const rating = Number(s.rating_avg || s.rating || 0);
        if (filters.minRating > 0 && rating < filters.minRating) return false;
        const slotDate = s.ngay_iso || (typeof s.ngay === 'string' ? s.ngay.slice(0, 10) : '');
        if (date && slotDate !== date) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sort === 'priceAsc') return Number(a.gia_tien || 0) - Number(b.gia_tien || 0);
        if (filters.sort === 'priceDesc') return Number(b.gia_tien || 0) - Number(a.gia_tien || 0);
        const ratingA = Number(a.rating_avg || a.rating || 0);
        const ratingB = Number(b.rating_avg || b.rating || 0);
        return ratingB - ratingA;
      });
  }, [filters, slots]);

  const ratingLabel = (slot) => {
    const raw = slot.rating_avg ?? slot.rating ?? 4.8;
    const val = Number(raw);
    return Number.isFinite(val) ? val.toFixed(1) : '0.0';
  };
  const slotDate = (slot) => slot.ngay_iso || (typeof slot.ngay === 'string' ? slot.ngay.slice(0, 10) : '');
  const priceLabel = (slot) => `${Number(slot.gia_tien || 0).toLocaleString('vi-VN')} đ/giờ`;
  const languageLabel = (slot) => slot.ngon_ngu || 'Tiếng Việt';
  const expertiseLabel = (slot) => slot.chuyen_mon || 'Địa phương';
  const locationLabel = (slot) => slot.dia_diem || 'Việt Nam';
  const timeLabel = (slot) =>
    slot.gio_bat_dau && slot.gio_ket_thuc ? `${slot.gio_bat_dau} - ${slot.gio_ket_thuc}` : 'Linh hoạt';

  return (
    <PageShell className="bg-background-light min-h-screen">
      <div className="max-w-[1240px] mx-auto px-3 md:px-6 py-6 flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.08em]">Hướng dẫn viên</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#111813] tracking-tight">
            Tìm Hướng dẫn viên <span className="text-primary">địa phương</span>
          </h1>
          <p className="text-[#608a6e]">Kết nối với chuyên gia am hiểu văn hóa, lịch sử và ẩm thực Việt Nam.</p>
        </section>

        <Card className="p-4 rounded-2xl border border-slate-100 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-center">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <select
                className="w-full h-12 pl-10 pr-10 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary"
                value={filters.location}
                onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
              >
                <option value="all">Tất cả địa điểm</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary">
                <span className="material-symbols-outlined">translate</span>
              </div>
              <select
                className="w-full h-12 pl-10 pr-10 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary"
                value={filters.language}
                onChange={(e) => setFilters((prev) => ({ ...prev, language: e.target.value }))}
              >
                <option value="all">Tất cả ngôn ngữ</option>
                {languages.map((lng) => (
                  <option key={lng} value={lng}>{lng}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <input
                type="date"
                className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary"
                placeholder="Tìm theo tên, chuyên môn..."
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              />
              <Button
                type="button"
                className="px-4 h-12 bg-primary text-black shadow-md hover:-translate-y-0"
                onClick={() => loadSlots(date)}
              >
                <span className="material-symbols-outlined">search</span>
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-1/4 flex-shrink-0 space-y-5">
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg m-0">Khoảng giá</h3>
                <button
                  type="button"
                  className="text-xs font-medium text-primary bg-transparent border-none"
                  style={{ boxShadow: 'none', padding: 0 }}
                  onClick={() => setFilters((prev) => ({ ...prev, priceCap: 2000000 }))}
                >
                  Đặt lại
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="range"
                  min="100000"
                  max="3000000"
                  step="50000"
                  value={filters.priceCap}
                  onChange={(e) => setFilters((prev) => ({ ...prev, priceCap: Number(e.target.value) }))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-sm font-medium text-slate-600">
                  <span>0đ</span>
                  <span>{Number(filters.priceCap).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Đánh giá</h3>
                <div className="space-y-2">
                  {[5, 4, 3].map((star) => (
                    <label key={star} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="guide-rating"
                        className="h-5 w-5 border-slate-300 text-primary focus:ring-primary"
                        checked={filters.minRating === star}
                        onChange={() => setFilters((prev) => ({ ...prev, minRating: star }))}
                      />
                      <div className="flex items-center text-amber-500 text-[18px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`material-symbols-outlined ${i < star ? 'text-amber-500' : 'text-slate-300'}`}>star</span>
                        ))}
                        <span className="text-slate-600 text-sm ml-2">Từ {star} sao</span>
                      </div>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="guide-rating"
                      className="h-5 w-5 border-slate-300 text-primary focus:ring-primary"
                      checked={filters.minRating === 0}
                      onChange={() => setFilters((prev) => ({ ...prev, minRating: 0 }))}
                    />
                    <span className="text-slate-600 text-sm">Bất kỳ</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div>
                <h3 className="font-bold text-lg mb-2">Chuyên môn</h3>
                <div className="flex flex-wrap gap-2">
                  {['ẩm thực', 'lịch sử', 'nhiếp ảnh', 'mạo hiểm', 'địa phương'].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filters.expertise === tag ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary'}`}
                      onClick={() => setFilters((prev) => ({ ...prev, expertise: filters.expertise === tag ? 'all' : tag }))}
                      style={{ boxShadow: 'none' }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </aside>

          <div className="flex-1 flex flex-col gap-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-xl font-bold text-[#111813] m-0">
                Đề xuất hàng đầu <span className="text-sm font-normal text-[#608a6e] ml-2">({filtered.length} kết quả)</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 hidden sm:inline">Sắp xếp:</span>
                <select
                  className="bg-transparent border-none text-sm font-bold text-[#111813] focus:ring-0 cursor-pointer"
                  value={filters.sort}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                >
                  <option value="popular">Phổ biến</option>
                  <option value="priceAsc">Giá thấp đến cao</option>
                  <option value="priceDesc">Giá cao đến thấp</option>
                </select>
              </div>
            </div>

            {loading && <p className="text-sm text-slate-500">Đang tải hướng dẫn viên...</p>}

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" {...staggerContainer(0.05, 0.04)}>
              {filtered.map((slot, idx) => {
                const avatar = buildFileUrl(slot.anh_dai_dien, fallbackAvatars[idx % fallbackAvatars.length]);
                return (
                  <motion.div key={slot.id || idx} {...fadeInUp(idx * 0.02)}>
                    <Card className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full">
                      <div className="relative h-64 overflow-hidden">
                        <div className="absolute top-3 left-3 z-10">
                          <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                            <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                            Verified
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 z-10">
                          <button className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-1.5 rounded-full transition-colors" style={{ boxShadow: 'none', border: 'none' }}>
                            <span className="material-symbols-outlined text-[20px]">favorite_border</span>
                          </button>
                        </div>
                        <img src={avatar} alt={slot.ho_ten || 'Guide'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                            <span className="material-symbols-outlined icon-filled text-[18px]">star</span>
                            {ratingLabel(slot)} <span className="text-white/80 font-normal text-xs">(đánh giá)</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-[#111813] group-hover:text-primary transition-colors">{slot.ho_ten || 'Hướng dẫn viên'}</h3>
                            <p className="text-xs text-[#608a6e] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">location_on</span> {locationLabel(slot)}
                            </p>
                          </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-primary">{priceLabel(slot)}</div>
                        <div className="text-xs text-slate-400">/giờ</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#608a6e] mb-2">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      <span>{slotDate(slot) || 'Lịch sắp tới'}</span>
                      <span className="mx-1">•</span>
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      <span>{timeLabel(slot)}</span>
                    </div>
                    <p className="text-sm text-[#4f5f55] line-clamp-2 mb-4">
                      {slot.gioi_thieu || 'Hướng dẫn viên địa phương sẵn sàng đồng hành cùng bạn.'}
                    </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">{languageLabel(slot)}</span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">{expertiseLabel(slot)}</span>
                        </div>
                        <div className="mt-auto space-y-3">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              className="flex-1 bg-primary text-black font-bold py-2.5 rounded-lg text-sm hover:bg-[#0be050] transition-colors"
                              onClick={() => navigate(`/guides/checkout/${slot.id || slot.ma_slot || ''}`, { state: { slot } })}
                            >
                              Đặt lịch
                            </Button>
                            <button
                              type="button"
                              className="bg-slate-100 text-[#111813] font-bold py-2.5 px-3 rounded-lg hover:bg-slate-200 transition-colors"
                              style={{ boxShadow: 'none', border: 'none' }}
                              onClick={() => toast.success('Đã mở chat (giả lập)')}
                            >
                              <span className="material-symbols-outlined text-[20px]">chat</span>
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-xs text-[#608a6e] font-medium">
                            <span className="material-symbols-outlined text-primary text-[16px] icon-filled">monetization_on</span>
                            Tích lũy {Math.max(30, Math.floor(Number(slot.gia_tien || 0) / 10000))} điểm
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
              {!loading && filtered.length === 0 && <p className="text-sm text-slate-500">Không tìm thấy hướng dẫn viên phù hợp.</p>}
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default GuideSearchPage;
