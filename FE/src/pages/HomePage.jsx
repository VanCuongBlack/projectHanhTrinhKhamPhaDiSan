import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getTours, getDiaDiem } from '../api/contentApi';
import { getFeaturedGuides } from '../api/guideApi';
import { getMyCheckins } from '../api/communityApi';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import './HomePage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');

const FALLBACKS = {
  hero:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuClE3lCV54XSE34RsQqsn1hj85IiZaa-jfSFsjH3ObbuVVrxvEt3O6UMtFkSXH5-TGiGBKPUGYoUPjap6SV_9DW7jOsv-_cRV9F1CbeAENvgsv6PqXjJLbBVwk1sssC-zC4ojZz93BQ5Go6kt7vfoGIE_N1cL6g3nwZ_7qr6eZXe6cyjj-yIGNj4birASrCZY8AKBCqSq-j8G5ksdhHoonEHXhYW1xfBDbik_T4-dej98VG2hrS3IQYfvjcxJR1Mcpg_nnq119Q_GY',
  tour: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=1200&q=80',
  place: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
  guide: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
};

const buildFileUrl = (rel, fallback) => {
  if (!rel) return fallback;
  const normalized = rel.replace(/\\/g, '/');
  if (/^https?:\/\//.test(normalized)) return normalized;
  return `${API_ROOT}/${normalized.startsWith('/') ? normalized.slice(1) : normalized}`;
};

const pickImage = (item, fallback) =>
  item?.anh_url ||
  item?.anh ||
  item?.hinh_anh ||
  item?.thumbnail ||
  item?.anh_dia_diem ||
  item?.image ||
  item?.url_image ||
  fallback;

const formatMoney = (value) =>
  Number.isFinite(Number(value)) ? `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ` : 'Liên hệ';

const HomePage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [tours, setTours] = useState([]);
  const [places, setPlaces] = useState([]);
  const [guides, setGuides] = useState([]);
  const [points, setPoints] = useState({ total: null, checkins: 0 });
  const [searchForm, setSearchForm] = useState({ keyword: '', date: '', type: 'all' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tourRes, placeRes, guideRes, checkinRes] = await Promise.all([
          getTours().catch(() => []),
          getDiaDiem().catch(() => []),
          getFeaturedGuides().catch(() => []),
          token ? getMyCheckins().catch(() => null) : Promise.resolve(null)
        ]);
        setTours(tourRes || []);
        setPlaces(placeRes || []);
        setGuides(guideRes || []);
        if (checkinRes) {
          setPoints({ total: checkinRes.points ?? null, checkins: checkinRes.checkins?.length || 0 });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải dữ liệu trang chủ.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const featuredTours = useMemo(() => {
    const source = tours || [];
    const filtered = searchForm.keyword
      ? source.filter((t) =>
          [t.tieu_de, t.mo_ta].some((f) => f?.toLowerCase().includes(searchForm.keyword.toLowerCase()))
        )
      : source;
    return filtered.slice(0, 3);
  }, [tours, searchForm.keyword]);

  const popularPlaces = useMemo(() => (places || []).slice(0, 4), [places]);
  const topGuides = useMemo(() => (guides || []).slice(0, 4), [guides]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchForm.keyword.trim()) {
      toast.success(`Lọc kết quả cho "${searchForm.keyword}"`);
    } else {
      toast('Nhập từ khóa để tìm tour/guide');
    }
  };

  const stats = [
    { label: 'Tours', value: tours.length },
    { label: 'Điểm đến', value: places.length },
    { label: 'Guide khả dụng', value: guides.length },
    { label: 'Check-in', value: points.checkins || 0 }
  ];

  return (
    <div className="home-modern bg-background-light text-text-main dark:bg-background-dark dark:text-white">
      <section className="relative w-full overflow-hidden">
        <div className="hero-backdrop">
          <img src={FALLBACKS.hero} alt="Hero landscape" className="hero-img" />
          <div className="hero-overlay" />
          <div className="hero-blur" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1440px] px-4 lg:px-20 py-10 md:py-14">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-md border border-white/30 w-fit">
              <span className="material-symbols-outlined text-sm">flag</span>
              Trải nghiệm văn hóa đích thực
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-lg">
                Khám phá vẻ đẹp bất tận của di sản Việt Nam
              </h1>
              <p className="text-base md:text-lg font-medium text-white/90">
                Kết nối với hướng dẫn viên địa phương, đặt tour độc quyền và tích lũy điểm thưởng trên mỗi hành trình.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md border border-white/25">
                <span className="material-symbols-outlined text-amber-300 icon-filled text-[18px]">stars</span>
                {points.total != null ? `${points.total} điểm` : 'Chưa đăng nhập'}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md border border-white/25">
                <span className="material-symbols-outlined text-emerald-200">verified</span>
                Ví TravelPay an toàn
              </div>
            </div>
            <form className="home-search" onSubmit={handleSearch}>
              <div className="search-field">
                <span className="material-symbols-outlined text-text-secondary">location_on</span>
                <input
                  className="w-full bg-transparent text-sm font-medium outline-none"
                  placeholder="Bạn muốn đi đâu? (Huế, Hội An...)"
                  value={searchForm.keyword}
                  onChange={(e) => setSearchForm((prev) => ({ ...prev, keyword: e.target.value }))}
                />
              </div>
              <div className="divider" />
              <div className="search-field">
                <span className="material-symbols-outlined text-text-secondary">calendar_month</span>
                <input
                  className="w-full bg-transparent text-sm font-medium outline-none"
                  type="date"
                  value={searchForm.date}
                  onChange={(e) => setSearchForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="divider" />
              <div className="search-field">
                <span className="material-symbols-outlined text-text-secondary">category</span>
                <select
                  className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                  value={searchForm.type}
                  onChange={(e) => setSearchForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="all">Tất cả dịch vụ</option>
                  <option value="tour">Tour trọn gói</option>
                  <option value="guide">Thuê hướng dẫn viên</option>
                </select>
              </div>
              <button type="submit" className="search-btn">
                <span className="material-symbols-outlined">search</span>
                <span>Tìm kiếm</span>
              </button>
            </form>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 max-w-4xl">
              {stats.map((item) => (
                <div key={item.label} className="stat-card">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <strong className="text-2xl font-bold text-text-main dark:text-white">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto px-4 lg:px-20 py-12 flex flex-col gap-16">
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-text-main dark:text-white tracking-tight">Tour nổi bật</h2>
              <p className="text-sm text-text-secondary">Những hành trình được yêu thích nhất</p>
            </div>
            <Link to="/tours/search" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              Xem tất cả <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTours.length === 0 && !loading && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-text-secondary shadow-sm">
                Chưa có tour để hiển thị.
              </div>
            )}
            {(featuredTours.length ? featuredTours : tours.slice(0, 3)).map((tour) => (
              <div
                key={tour.ma_tour}
                className="group flex flex-col bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-white/5"
              >
                <div className="relative h-56 overflow-hidden">
                  <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-bold text-text-main dark:text-white flex items-center gap-1">
                    <span className="material-symbols-outlined text-orange-500 icon-filled text-sm">local_fire_department</span>
                    Bestseller
                  </div>
                  <button
                    type="button"
                    className="absolute top-3 right-3 z-10 size-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors group/heart"
                  >
                    <span className="material-symbols-outlined text-white text-lg group-hover/heart:text-red-500 transition-colors">favorite</span>
                  </button>
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${buildFileUrl(pickImage(tour, FALLBACKS.tour), FALLBACKS.tour)})` }}
                  />
                </div>
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <h3 className="text-text-main dark:text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {tour.tieu_de}
                      </h3>
                      <div className="flex items-center gap-1 text-text-secondary text-xs mt-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {tour.so_ngay || 1} ngày • {tour.so_dem || 0} đêm
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-text-secondary text-xs">Giá từ</span>
                      <span className="text-primary font-bold text-lg">{formatMoney(tour.gia)}</span>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-background-light dark:bg-white/10 px-4 py-2 text-text-main dark:text-white text-sm font-bold hover:bg-primary hover:text-text-main transition-colors"
                      onClick={() => navigate(`/tours/${tour.ma_tour}`)}
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-text-main dark:text-white tracking-tight">Điểm đến phổ biến</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 h-[400px] md:h-[320px]">
            {popularPlaces.length === 0 && !loading && (
              <div className="col-span-4 rounded-xl border border-gray-100 bg-white p-6 text-sm text-text-secondary shadow-sm">
                Chưa có địa điểm nổi bật.
              </div>
            )}
            {popularPlaces.slice(0, 4).map((place, idx) => (
              <div
                key={place.ma_dia_diem || idx}
                className={`relative group rounded-xl overflow-hidden cursor-pointer ${idx === 0 ? 'col-span-2 row-span-2 md:row-span-1 md:col-span-2' : 'col-span-1'}`}
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors z-10" />
                <div className="absolute bottom-0 left-0 p-4 z-20">
                  <h3 className="text-white text-lg md:text-xl font-bold">{place.ten_dia_diem || 'Địa điểm'}</h3>
                  <p className="text-gray-200 text-xs">{place.ten_tinh || 'Việt Nam'}</p>
                </div>
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${buildFileUrl(pickImage(place, FALLBACKS.place), FALLBACKS.place)})` }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-background-light dark:bg-white/5 rounded-2xl p-6 md:p-10 border border-[#dbe6df] dark:border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary icon-filled">verified</span>
                <span className="uppercase text-xs font-bold text-primary tracking-wider">Local Experts</span>
              </div>
              <h2 className="text-text-main dark:text-white text-2xl font-bold tracking-tight">Hướng dẫn viên tiêu biểu</h2>
              <p className="text-text-secondary text-sm mt-1 max-w-lg">Đặt lịch trực tiếp với những người kể chuyện địa phương am hiểu nhất.</p>
            </div>
            <Link
              to="/guides/search"
              className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-text-main dark:text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Tìm Hướng dẫn viên
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topGuides.length === 0 && !loading && (
              <div className="col-span-4 rounded-xl border border-gray-100 bg-white p-6 text-sm text-text-secondary shadow-sm">
                Chưa có lịch guide khả dụng.
              </div>
            )}
            {topGuides.map((guide, idx) => {
              const guideKey = guide.id || guide.ma_guide || guide.ma_nguoi_dung || `guide-${idx}`;
              return (
              <div
                key={guideKey}
                className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3 relative border border-gray-100 dark:border-white/5"
              >
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold">
                    <span className="material-symbols-outlined text-[14px] icon-filled">star</span>
                    {Number.isFinite(Number(guide.rating_avg)) ? Number(guide.rating_avg).toFixed(1) : '0.0'}
                  </div>
                <div className="size-24 rounded-full overflow-hidden border-2 border-primary p-1">
                  <div
                    className="w-full h-full rounded-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${buildFileUrl(guide.anh_dai_dien, FALLBACKS.guide)})`
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-text-main dark:text-white font-bold text-lg">{guide.ho_ten || 'Hướng dẫn viên'}</h4>
                  <p className="text-primary text-xs font-bold uppercase tracking-wide">{guide.dia_diem || 'Lịch linh hoạt'}</p>
                </div>
                <div className="w-full pt-3 border-t border-gray-100 dark:border-white/10 mt-auto flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{formatMoney(guide.gia_tien)}</span>
                  <Button
                    type="button"
                    size="sm"
                    className="px-4 py-2 text-white shadow-sm"
                    onClick={() => navigate(`/guides/checkout/${guide.id || guide.ma_guide || guide.ma_nguoi_dung || ''}`, { state: { slot: guide } })}
                  >
                    Đặt guide
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-surface-dark rounded-2xl p-8 md:p-12 text-white overflow-hidden relative">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-sm tracking-wider uppercase">
              <span className="material-symbols-outlined icon-filled">loyalty</span>
              Chương trình Tích điểm
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">Check-in Địa điểm &amp; Nhận quà Di sản</h2>
            <p className="text-gray-300 text-lg">
              Mỗi địa điểm bạn ghé thăm đều mang lại điểm thưởng. Đổi điểm lấy voucher, quà lưu niệm hoặc vé tham quan miễn phí.
            </p>
            <div className="flex gap-4 pt-4 flex-wrap">
              <Link
                to="/checkin"
                className="bg-primary text-text-main hover:bg-primary-hover px-6 py-3 rounded-lg font-bold text-sm transition-colors"
              >
                Tham gia ngay
              </Link>
              <Link
                to="/wallet"
                className="bg-white/10 text-white hover:bg-white/20 px-6 py-3 rounded-lg font-bold text-sm transition-colors border border-white/10"
              >
                Ví & voucher
              </Link>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/5 flex flex-col gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">qr_code_scanner</span>
              <h4 className="font-bold text-lg">Quét QR Check-in</h4>
              <p className="text-sm text-gray-300">Quét mã tại điểm di sản để xác nhận lượt ghé thăm.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/5 flex flex-col gap-3 mt-8">
              <span className="material-symbols-outlined text-primary text-3xl">account_balance_wallet</span>
              <h4 className="font-bold text-lg">Ví Điện Tử</h4>
              <p className="text-sm text-gray-300">Thanh toán an toàn, tích điểm tự động vào ví.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
