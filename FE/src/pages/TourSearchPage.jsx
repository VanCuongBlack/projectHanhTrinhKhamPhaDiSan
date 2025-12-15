import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getTours } from '../api/contentApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fadeInUp, staggerContainer } from '../lib/motion';

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—';
  return `${Number(value).toLocaleString('vi-VN')}đ`;
};

const durationLabel = (tour) => {
  const n = Number(tour.so_ngay || 0);
  if (n === 0) return '1 Ngày';
  if (n === 1) return '1 Ngày';
  return `${n}N${Math.max(n - 1, 0)}Đ`;
};

const fallbackImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDCe9HEKzyqW_1PkOuddLOgR3mI5hh81qVVO4t5AMf8r1EYVwq_hXaWnszB7mj8ZqzqxBFz5eqPzG-U3aRHqIQ6QKnkhkl_mhKUpA3jg2O5HLG5wkEqqa98Q7Nd-70hYwUAexl6whVPiX80I7fkLgv34COtlcUhi8rpGQlRkdL9I4eWgXgUHzdn9HWRVdf6G7sfscgCb1m4XK1_s5KtkBvs2jxKODPGn7Ttpp9Xf5xmUCcGHhqo92q9ewVJXGFZLIcEk7lAW10ioeo',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuARlM5XpXwhGQP39VvNHvZOcSbbUcguUblcUdsPXqb_m6paOv8K6W0aH0BGMvsrJOaQ0WH5v9mtrg3H5TNxWf-h4YjCnumN8gNvfMuB41biz4AgmiHuUiJTREPo3NRYyRbDXcZpZLvbkgvpw3Pk2WCFwj5Jt7GmtmRRVQZs-1Ihfuwlzhaxgn5qsN4JZeuFagkscOQym3eF2yvsShrvLhANnIxy4tcDjtPAv1WFPKTy5cueJWBeCtR6cS00T5eTJOAoGYmLda-fkCc',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBgc2nLiMUt3skEoH6z0ymT0_sW29dL45GmROe2iesVXnreXnP8v9b3h0inqESaTlKw3jPTMdwFIWe-H5L2ndeUmjvOheo24dEvpc4qAyZ2UqhttRuFF169A1w1UVej_w_c6FIUK_vhIjNg9Jy_n52dvaosa1snaWtnqGSGde_VJ6k4jxHaHdr6ubCOdxV4kHU59zsZNSzyVjjqsqvbCZK3wkUvMIANQV-7IB_-CtUCf5SQDUSCUa8Sqz-v5_sS46WCUdMKjTdDlms',
];

const TourSearchPage = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    text: '',
    date: '',
    type: 'all',
    sort: 'popular',
    priceCap: 10000000,
    durations: new Set(['all']),
    minRating: 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getTours();
        setTours(res || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không tải được tour');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const kw = filters.text.trim().toLowerCase();
    return [...tours]
      .filter((t) => {
        if (kw && !`${t.tieu_de || ''} ${t.mo_ta || ''}`.toLowerCase().includes(kw)) return false;
        if (filters.type !== 'all' && !(t.loai_hinh || '').toLowerCase().includes(filters.type)) return false;
        if (filters.priceCap && Number(t.gia || 0) > filters.priceCap) return false;
        if (filters.minRating > 0) {
          const rating = Number(t.danh_gia_tb || t.rating || 4.8);
          if (rating < filters.minRating) return false;
        }
        const days = Number(t.so_ngay || 1);
        const durTag =
          days <= 1 ? 'day' : days <= 2 ? '2d1n' : days <= 5 ? '3to5' : '5plus';
        if (!filters.durations.has('all') && !filters.durations.has(durTag)) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sort === 'priceAsc') return Number(a.gia || 0) - Number(b.gia || 0);
        if (filters.sort === 'priceDesc') return Number(b.gia || 0) - Number(a.gia || 0);
        return Number(b.luot_dat || 0) - Number(a.luot_dat || 0);
      });
  }, [filters, tours]);

  const handleDurationToggle = (key) => {
    setFilters((prev) => {
      const next = new Set(prev.durations);
      if (key === 'all') {
        return { ...prev, durations: new Set(['all']) };
      }
      if (next.has('all')) next.delete('all');
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (next.size === 0) next.add('all');
      return { ...prev, durations: next };
    });
  };

  return (
    <PageShell className="bg-background-light min-h-screen">
      <div className="max-w-[1240px] mx-auto px-3 md:px-6 py-6 flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.08em]">Tìm kiếm & đặt tour</p>
          <h1 className="text-3xl md:text-5xl font-black text-[#111813] leading-tight">
            Khám phá vẻ đẹp <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400">bất tận</span> của Việt Nam
          </h1>
          <p className="text-[#608a6e]">Tìm tour di sản, văn hóa, nghỉ dưỡng và tích lũy điểm thưởng ngay hôm nay.</p>
        </section>

        <Card className="p-4 rounded-2xl border border-slate-100 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Điểm đến</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-400">location_on</span>
                <input
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-base font-medium placeholder:text-slate-400"
                  placeholder="Bạn muốn đi đâu? (VD: Hội An)"
                  value={filters.text}
                  onChange={(e) => setFilters((prev) => ({ ...prev, text: e.target.value }))}
                />
              </div>
            </div>
            <div className="md:col-span-3 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Khởi hành</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-400">calendar_today</span>
                <input
                  type="date"
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-base font-medium placeholder:text-slate-400"
                  value={filters.date}
                  onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="md:col-span-3 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Loại hình</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-400">category</span>
                <select
                  className="w-full h-12 pl-12 pr-10 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-base font-medium appearance-none cursor-pointer"
                  value={filters.type}
                  onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  <option value="di sản">Di sản</option>
                  <option value="văn hóa">Văn hóa</option>
                  <option value="mạo hiểm">Mạo hiểm</option>
                  <option value="nghỉ dưỡng">Nghỉ dưỡng</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="button" className="w-full h-12 px-4 bg-primary text-[#111813] font-bold shadow-md hover:-translate-y-0">
                <span className="material-symbols-outlined">search</span> Tìm kiếm
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-1/4 flex-shrink-0 space-y-6">
            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg m-0">Khoảng giá</h3>
                <button
                  type="button"
                  className="text-xs font-medium text-primary bg-transparent border-none"
                  style={{ boxShadow: 'none', padding: 0 }}
                  onClick={() => setFilters((prev) => ({ ...prev, priceCap: 10000000 }))}
                >
                  Đặt lại
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="range"
                  min="500000"
                  max="10000000"
                  step="500000"
                  value={filters.priceCap}
                  onChange={(e) => setFilters((prev) => ({ ...prev, priceCap: Number(e.target.value) }))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-sm font-medium text-slate-600">
                  <span>0đ</span>
                  <span>{formatCurrency(filters.priceCap)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div>
                <h3 className="font-bold text-lg mb-3">Thời lượng</h3>
                <div className="space-y-2">
                  {[
                    { key: 'day', label: 'Trong ngày' },
                    { key: '2d1n', label: '2 ngày 1 đêm' },
                    { key: '3to5', label: '3-5 ngày' },
                    { key: '5plus', label: 'Dài ngày (>5 ngày)' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded-md border-slate-300 text-primary focus:ring-primary"
                        checked={filters.durations.has('all') ? false : filters.durations.has(item.key)}
                        onChange={() => handleDurationToggle(item.key)}
                      />
                      <span className="text-slate-600 group-hover:text-primary">{item.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded-md border-slate-300 text-primary focus:ring-primary"
                      checked={filters.durations.has('all')}
                      onChange={() => handleDurationToggle('all')}
                    />
                    <span className="text-slate-600 group-hover:text-primary">Tất cả</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div>
                <h3 className="font-bold text-lg mb-3">Đánh giá</h3>
                <div className="space-y-2">
                  {[5, 4, 3].map((star) => (
                    <label key={star} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
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
                      name="rating"
                      className="h-5 w-5 border-slate-300 text-primary focus:ring-primary"
                      checked={filters.minRating === 0}
                      onChange={() => setFilters((prev) => ({ ...prev, minRating: 0 }))}
                    />
                    <span className="text-slate-600 text-sm">Bất kỳ</span>
                  </label>
                </div>
              </div>
            </Card>
          </aside>

          <div className="flex-1 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-slate-600 font-medium">
                Tìm thấy <span className="font-bold text-[#111813]">{filtered.length}</span> tour phù hợp
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Sắp xếp theo:</span>
                <select
                  className="bg-transparent border-none font-bold text-[#111813] focus:ring-0 cursor-pointer p-0 pr-6"
                  value={filters.sort}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                >
                  <option value="popular">Phổ biến</option>
                  <option value="priceAsc">Giá thấp đến cao</option>
                  <option value="priceDesc">Giá cao đến thấp</option>
                </select>
              </div>
            </div>

            {loading && <p className="text-sm text-slate-500">Đang tải tour...</p>}

            <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" {...staggerContainer(0.05, 0.04)}>
              {filtered.map((tour, idx) => {
                const img = tour.anh || fallbackImages[idx % fallbackImages.length];
                const rating = (tour.danh_gia_tb || tour.rating || 4.8).toFixed(1);
                const location = tour.dia_diem || tour.tinh || 'Việt Nam';
                return (
                  <motion.div key={tour.ma_tour || tour.id || idx} {...fadeInUp(idx * 0.02)}>
                    <Card className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col h-full">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            type="button"
                            className="size-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-red-500 transition-colors text-white"
                            style={{ boxShadow: 'none', border: 'none' }}
                          >
                            <span className="material-symbols-outlined text-[20px]">favorite_border</span>
                          </button>
                        </div>
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                          {idx === 0 && <span className="bg-primary text-[#111813] text-xs font-bold px-2 py-1 rounded shadow-sm">Best Seller</span>}
                        </div>
                        <div className="bg-center bg-cover h-full w-full group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: `url('${img}')` }} />
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-medium">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {location}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-1 text-amber-500 mb-1">
                          <span className="material-symbols-outlined text-[16px]">star</span>
                          <span className="text-xs font-bold text-slate-700 pt-0.5">{rating} (đánh giá)</span>
                        </div>
                        <h3 className="text-base font-bold text-[#111813] leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {tour.tieu_de || 'Tour du lịch'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {durationLabel(tour)}
                          </div>
                          {tour.dich_vu && (
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">restaurant</span>
                              {tour.dich_vu}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-primary">
                            <span className="material-symbols-outlined text-[16px]">loyalty</span>
                            +{Math.max(20, Math.floor(Number(tour.gia || 0) / 50000))} điểm
                          </div>
                        </div>
                        <div className="mt-auto pt-3 border-t border-slate-100 grid grid-cols-[1fr_auto] items-center gap-3">
                          <div className="flex flex-col">
                            {tour.gia_goc && <span className="text-xs text-slate-400 line-through">{formatCurrency(tour.gia_goc)}</span>}
                            <span className="text-lg font-black text-green-700">{formatCurrency(tour.gia)}</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="px-4 py-2 whitespace-nowrap"
                            onClick={() => navigate(`/tours/${tour.ma_tour || tour.id || ''}`)}
                          >
                            Đặt tour
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
              {!loading && filtered.length === 0 && (
                <p className="text-sm text-slate-500">Không tìm thấy tour phù hợp bộ lọc.</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default TourSearchPage;
