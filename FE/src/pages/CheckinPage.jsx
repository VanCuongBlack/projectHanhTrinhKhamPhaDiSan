import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { checkinAtPlace, listPlaces, getMyCheckins } from '../api/communityApi';
import { getRouteDistance } from '../api/mapApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { fadeInUp, staggerContainer } from '../lib/motion';

import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ định vị'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

const FALLBACK_PLACE = 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');

const CheckinPage = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [coords, setCoords] = useState(null);
  const [selected, setSelected] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [myPoints, setMyPoints] = useState(0);
  const [myCheckins, setMyCheckins] = useState([]);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [placesPage, setPlacesPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await listPlaces({ limit: 200, page: 1 });
        setPlaces(res.data || res || []);
        const summary = await getMyCheckins().catch(() => null);
        setMyPoints(summary?.points || 0);
        setMyCheckins(summary?.checkins || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không tải được địa điểm');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const memberTier = useMemo(() => {
    if (myPoints >= 2000) return 'Bạch Kim';
    if (myPoints >= 1000) return 'Vàng';
    if (myPoints >= 500) return 'Bạc';
    return 'Thành viên';
  }, [myPoints]);
  const nextTierTarget = myPoints >= 2000 ? 0 : myPoints >= 1000 ? 2000 : myPoints >= 500 ? 1000 : 500;
  const progress = nextTierTarget === 0 ? 100 : Math.min(100, Math.round((myPoints / nextTierTarget) * 100));
  const needMore = Math.max(nextTierTarget - myPoints, 0);

  const haversine = (from, to) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(to[1] - from[1]);
    const dLng = toRad(to[0] - from[0]);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from[1])) * Math.cos(toRad(to[1])) * Math.sin(dLng / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const tryGetLocation = async () => {
    try {
      const c = await getLocation();
      setCoords(c);
      toast.success('Đã lấy định vị');
      setLocationError(null);
      return c;
    } catch (err) {
      toast.error('Không lấy được định vị, vui lòng bật GPS');
      setLocationError('Không lấy được vị trí. Hãy bật GPS/cho phép trình duyệt.');
      return null;
    }
  };

  const loadRoute = async (place) => {
    const toLat = Number(place?.toado_lat);
    const toLng = Number(place?.toado_lng);
    if (!Number.isFinite(toLat) || !Number.isFinite(toLng)) {
      setRouteInfo(null);
      return;
    }

    let currentCoords = coords;
    if (!currentCoords) {
      currentCoords = await tryGetLocation();
      if (!currentCoords) {
        setRouteInfo(null);
        return;
      }
      setCoords(currentCoords);
    }

    setRouteLoading(true);
    try {
      const from = [currentCoords.lng, currentCoords.lat];
      const to = [toLng, toLat];
      const res = await getRouteDistance({ from, to });
      const distance = Number(res?.distance);
      const duration = Number(res?.duration);
      if (!Number.isFinite(distance) || distance <= 0) {
        throw new Error('Route distance invalid');
      }
      setRouteInfo({
        distance,
        duration: Number.isFinite(duration) ? duration : null,
        geometry: res.geometry || { type: 'LineString', coordinates: [from, to] },
      });
    } catch (err) {
      const dist = haversine([currentCoords.lng, currentCoords.lat], [toLng, toLat]);
      setRouteInfo({
        distance: Number.isFinite(dist) ? dist : null,
        duration: null,
        geometry: {
          type: 'LineString',
          coordinates: [
            [currentCoords.lng, currentCoords.lat],
            [toLng, toLat],
          ],
        },
        approx: true,
      });
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (coords && selected?.toado_lat && selected?.toado_lng) {
      loadRoute(selected);
    }
  }, [coords, selected]);

  const handleSelectPlace = async (place) => {
    setSelected(place);
    if (!coords) {
      const c = await tryGetLocation();
      if (!c) return;
    }
    loadRoute(place);
  };

  const handleCheckin = async (place) => {
    if (checking) return;
    setChecking(true);
    try {
      const payload = coords ? { lat: coords.lat, lng: coords.lng } : {};
      const res = await checkinAtPlace(place.ma_dia_diem, payload);
      toast.success('Check-in thành công');
      setSelected({ ...place, result: res });
      loadRoute(place);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể check-in');
    }
    setChecking(false);
  };

  const filteredPlaces = useMemo(() => places, [places]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredPlaces.length / pageSize)), [filteredPlaces.length, pageSize]);
  const paginatedPlaces = useMemo(() => {
    const start = (placesPage - 1) * pageSize;
    return filteredPlaces.slice(start, start + pageSize);
  }, [filteredPlaces, placesPage]);

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-marker user-marker',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.2);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 16],
      }),
    []
  );

  const placeIcon = useMemo(
    () =>
      L.divIcon({
        className: 'custom-marker place-marker',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#0df259;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.2);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 16],
      }),
    []
  );

  const buildFileUrl = (rel) => {
    if (!rel) return FALLBACK_PLACE;
    const normalized = rel.replace(/\\/g, '/');
    if (/^https?:\/\//.test(normalized)) return normalized;
    return `${API_ROOT}/${normalized.startsWith('/') ? normalized.slice(1) : normalized}`;
  };

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
        <motion.div {...fadeInUp(0)}>
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-2 text-[#111813] shadow-lg rounded-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0b3b23]">Check-in di sản</p>
                <h1 className="text-3xl md:text-4xl font-black leading-tight">Nhận điểm thưởng & voucher</h1>
                <p className="text-sm text-[#0b3b23]/80">Mỗi địa điểm chỉ được check-in một lần trong bán kính hợp lệ 3km.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={tryGetLocation} className="bg-white text-primary shadow-md hover:-translate-y-0.5">
                    <span className="material-symbols-outlined">my_location</span>
                    Lấy định vị
                  </Button>
                  {coords && (
                    <Badge className="bg-white/20 text-[#0b3b23] border border-white/30">
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 text-sm lg:w-auto">
                <div className="rounded-xl bg-white/20 px-3 py-2 font-semibold shadow-inner">Điểm hiện có: {myPoints}</div>
                <div className="rounded-xl bg-white/20 px-3 py-2 font-semibold shadow-inner">Đã check-in: {myCheckins.length}</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div className="grid gap-4 md:grid-cols-3" {...staggerContainer(0.06, 0.05)}>
          {[
            { title: 'Hạng thành viên', value: memberTier, icon: 'workspace_premium' },
            { title: 'Điểm thưởng', value: myPoints.toLocaleString('vi-VN'), icon: 'stars' },
            { title: 'Ngày trống khả dụng', value: `${Math.max(0, 8 - myCheckins.length)} ngày`, icon: 'event_available' },
          ].map((s, idx) => (
            <motion.div key={s.title} {...fadeInUp(idx * 0.02)}>
              <Card className="flex flex-col gap-1 rounded-xl p-4 border border-[#dbe6df] bg-white shadow-sm">
                <div className="flex items-center gap-2 text-sm text-[#608a6e]">
                  <span className="material-symbols-outlined text-primary">{s.icon}</span>
                  {s.title}
                </div>
                <p className="text-2xl font-bold text-[#111813] m-0">{s.value}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="bg-white rounded-2xl border border-[#dbe6df] p-6 shadow-sm">
          <div className="flex justify-between items-end mb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-lg m-0">Tiến độ tới hạng tiếp theo</h3>
              <p className="text-sm text-[#608a6e]">
                Cần thêm <span className="text-primary font-bold">{needMore} điểm</span> để lên hạng cao hơn
              </p>
            </div>
            <span className="text-2xl font-black text-[#111813]">{progress}%</span>
          </div>
          <div className="w-full bg-[#dbe6df] rounded-full h-3">
            <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                className="group relative overflow-hidden rounded-xl bg-primary p-6 text-left transition-transform hover:-translate-y-1 hover:shadow-lg"
                onClick={tryGetLocation}
              >
                <div className="relative z-10 flex flex-col gap-2">
                  <span className="material-symbols-outlined text-4xl text-[#111813]">my_location</span>
                  <h3 className="text-xl font-bold text-[#111813]">Check-in bằng GPS</h3>
                  <p className="text-sm font-medium text-[#111813]/80">Tự động xác nhận vị trí của bạn</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-white/10 skew-x-12 translate-x-12 group-hover:translate-x-8 transition-transform" />
              </button>
              <button
                type="button"
                className="group relative overflow-hidden rounded-xl bg-white border-2 border-dashed border-primary/50 hover:border-primary p-6 text-left transition-all hover:shadow-lg"
                onClick={() => toast.success('Quét QR (giả lập)')}
              >
                <div className="relative z-10 flex flex-col gap-2">
                  <span className="material-symbols-outlined text-4xl text-primary">qr_code_scanner</span>
                  <h3 className="text-xl font-bold text-[#111813]">Quét mã QR</h3>
                  <p className="text-sm font-medium text-[#608a6e]">Quét mã tại điểm tham quan</p>
                </div>
              </button>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-[#dbe6df] bg-white">
              <div className="p-4 border-b border-[#f0f5f1] flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#111813] m-0">Bản đồ di sản</h3>
                <div className="flex items-center gap-3 text-xs text-[#608a6e]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-primary/70 border border-primary/60" /> Địa điểm
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-sky-500 border border-sky-400" /> Vị trí bạn
                  </span>
                </div>
              </div>
              <div className="overflow-hidden">
                <MapContainer
                  center={[selected?.toado_lat || 16.0471, selected?.toado_lng || 108.206]}
                  zoom={selected ? 13 : 5}
                  className="h-[360px] w-full"
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {selected?.toado_lat && selected?.toado_lng && (
                    <Marker position={[selected.toado_lat, selected.toado_lng]} icon={placeIcon}>
                      <Popup>{selected.ten_dia_diem}</Popup>
                    </Marker>
                  )}
                  {coords && (
                    <Marker position={[coords.lat, coords.lng]} icon={userIcon}>
                      <Popup>Vị trí của bạn</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
              <div className="p-4 text-sm text-[#608a6e] space-y-1">
                {routeLoading && <p>Đang tính quãng đường...</p>}
                {!coords && <p>Chưa có vị trí của bạn. Nhấn “Lấy định vị” để tính khoảng cách.</p>}
                {locationError && <p className="text-red-600">{locationError}</p>}
                {routeInfo && (
                  <p className="text-[#111813] font-semibold">
                    Khoảng cách: {Number.isFinite(routeInfo.distance) ? (routeInfo.distance / 1000).toFixed(1) : '?'} km
                    {routeInfo.duration ? ` • ~${Math.round(routeInfo.duration / 60)} phút` : ''}
                    {routeInfo.approx ? ' (ước tính)' : ''}
                    {routeInfo.distance && routeInfo.distance <= 3000 ? ' • Trong bán kính check-in' : ''}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-xl font-bold m-0">Địa điểm quanh đây</h3>
                <div className="flex items-center gap-2">
                  {showAllPlaces && (
                    <Button variant="ghost" size="sm" className="text-sm text-[#608a6e]" onClick={() => setShowAllPlaces(false)}>
                      Thu gọn
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm text-primary"
                    onClick={() => {
                      setShowAllPlaces(true);
                      setPlacesPage(1);
                    }}
                  >
                    Xem tất cả
                  </Button>
                </div>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-32 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(showAllPlaces ? paginatedPlaces : filteredPlaces.slice(0, 4)).map((p) => (
                    <div key={p.ma_dia_diem || p.id} className="group bg-white rounded-xl border border-[#dbe6df] overflow-hidden hover:shadow-md transition-all flex flex-col">
                      <div className="h-40 overflow-hidden relative">
                        <div className="absolute top-3 right-3 bg-primary text-[#111813] text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                          +{p.points_award || 50} Điểm
                        </div>
                        <div
                          className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-500"
                          style={{ backgroundImage: `url('${buildFileUrl(p.anh_url || p.anh || p.hinh_anh)}')` }}
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-1 gap-2">
                        <h4 className="font-bold text-lg m-0 group-hover:text-primary transition-colors">{p.ten_dia_diem}</h4>
                        <div className="flex items-center gap-2 text-[#608a6e] text-sm">
                          <span className="material-symbols-outlined text-[16px]">near_me</span>
                          <span>{p.ten_tinh || '—'}</span>
                          {p.ten_loai && (
                            <>
                              <span>•</span>
                              <span>{p.ten_loai}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-auto grid grid-cols-2 gap-2">
                          <Button type="button" variant="ghost" size="sm" className="w-full justify-center" onClick={() => handleSelectPlace(p)}>
                            Xem bản đồ
                          </Button>
                          <Button type="button" size="sm" className="w-full justify-center" disabled={checking} onClick={() => handleCheckin(p)}>
                            {checking ? 'Đang check...' : 'Check-in ngay'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredPlaces.length === 0 && <p className="text-sm text-[#608a6e]">Chưa có địa điểm.</p>}
                </div>
              )}
              {showAllPlaces && filteredPlaces.length > pageSize && (
                <div className="flex items-center justify-between mt-4 text-sm text-[#608a6e]">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={placesPage === 1}
                    onClick={() => setPlacesPage((p) => Math.max(1, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <span>
                    Trang {placesPage}/{totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={placesPage >= totalPages}
                    onClick={() => setPlacesPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Trang sau
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 static">
            <div className="static bg-white rounded-2xl border border-[#dbe6df] p-6 h-fit shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2 m-0">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Lịch sử check-in
                </h3>
                <span className="text-xs font-medium text-[#608a6e]">Xem tất cả</span>
              </div>
              <div className="flex flex-col gap-6 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#dbe6df]" />
                {myCheckins.slice(0, 6).map((c, idx) => (
                  <div key={c.id || idx} className="flex gap-4 relative">
                    <div className="relative z-10 size-10 rounded-full bg-green-100 border-4 border-white flex items-center justify-center shrink-0 text-primary">
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm">{c.ten_dia_diem}</p>
                        <span className="text-primary font-bold text-xs">+{c.points || 20}đ</span>
                      </div>
                      <p className="text-xs text-[#608a6e] mt-1">
                        {c.ten_tinh || ''} • {new Date(c.ngay_checkin).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
                {myCheckins.length === 0 && <p className="text-sm text-[#608a6e]">Chưa có lịch sử check-in.</p>}
              </div>
              <button
                type="button"
                className="w-full mt-6 py-2 text-sm font-medium text-[#608a6e] border border-dashed border-[#dbe6df] rounded-lg hover:border-primary hover:text-primary transition-colors"
              >
                Xem toàn bộ lịch sử
              </button>
            </div>

            <div className="static relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-800 to-green-950 p-6 text-white shadow-md">
              <div className="relative z-10">
                <div className="size-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-2xl icon-filled">redeem</span>
                </div>
                <h4 className="font-bold text-lg mb-2">Đổi điểm lấy quà</h4>
                <p className="text-sm text-gray-200 mb-4 leading-relaxed">Sử dụng điểm tích lũy của bạn để đổi vé tham quan miễn phí hoặc voucher giảm giá.</p>
                <Button type="button" className="bg-primary text-[#111813] hover:bg-white">
                  Vào cửa hàng quà tặng
                </Button>
              </div>
              <div className="absolute -bottom-10 -right-10 size-40 bg-primary/20 rounded-full blur-2xl" />
              <div className="absolute top-10 right-10 size-20 bg-primary/10 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default CheckinPage;
