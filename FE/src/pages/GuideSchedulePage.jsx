import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getMyGuideStatus,
  listMyGuideSchedule,
  listMyGuideBookings,
  createGuideSlot,
} from '../api/guideApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { fadeInUp, staggerContainer } from '../lib/motion';

const todayISO = () => new Date().toISOString().slice(0, 10);

const GuideSchedulePage = () => {
  const [loading, setLoading] = useState(true);
  const [guideStatus, setGuideStatus] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [priceInput, setPriceInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [saving, setSaving] = useState(false);
  const slotDate = (slot) => slot?.ngay_iso || (typeof slot?.ngay === 'string' ? slot.ngay.slice(0, 10) : '');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [status, mySchedule, myBookings] = await Promise.all([
          getMyGuideStatus().catch(() => null),
          listMyGuideSchedule().catch(() => []),
          listMyGuideBookings().catch(() => []),
        ]);
        setGuideStatus(status);
        setSchedule(mySchedule || []);
        setBookings(myBookings || []);
        if (mySchedule?.length > 0) {
          setSelectedDate(mySchedule[0].ngay || todayISO());
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải lịch làm việc');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const scheduleByDate = useMemo(() => {
    const map = new Map();
    schedule.forEach((s) => {
      const key = s.ngay?.slice(0, 10);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return map;
  }, [schedule]);

  const bookingsByDate = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      const key = b.ngay?.slice(0, 10);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return map;
  }, [bookings]);

  const stats = useMemo(() => {
    const accepted = bookings.filter((b) => (b.trang_thai || '').includes('confirm') || (b.trang_thai || '').includes('completed'));
    const pending = bookings.filter((b) => (b.trang_thai || '').includes('pending') || (b.trang_thai || '').includes('chờ'));
    const totalIncome = bookings.reduce((sum, b) => sum + Number(b.gia_tien || 0), 0);
    const openDays = scheduleByDate.size;
    return {
      accepted: accepted.length,
      pending: pending.length,
      income: totalIncome,
      openDays,
    };
  }, [bookings, scheduleByDate.size]);

  const monthLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
    return formatter.format(currentMonth);
  }, [currentMonth]);

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = new Date(year, month, 1);
    const startWeekday = (start.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const dayNum = i - startWeekday + 1;
      let dateObj;
      let current = true;
      if (dayNum <= 0) {
        dateObj = new Date(year, month - 1, prevMonthDays + dayNum);
        current = false;
      } else if (dayNum > daysInMonth) {
        dateObj = new Date(year, month + 1, dayNum - daysInMonth);
        current = false;
      } else {
        dateObj = new Date(year, month, dayNum);
        current = true;
      }
      const iso = dateObj.toISOString().slice(0, 10);
      const dayBookings = bookingsByDate.get(iso) || [];
      const daySlots = scheduleByDate.get(iso) || [];
      const hasPending = dayBookings.some((b) => (b.trang_thai || '').includes('pending') || (b.trang_thai || '').includes('chờ'));
      const hasBooked = dayBookings.some((b) => (b.trang_thai || '').includes('confirm') || (b.trang_thai || '').includes('completed'));
      const status = hasPending ? 'pending' : hasBooked ? 'booked' : daySlots.length > 0 ? 'free' : 'none';
      cells.push({
        iso,
        label: dateObj.getDate(),
        current,
        status,
        price: daySlots[0]?.gia_tien,
      });
    }
    return cells;
  }, [bookingsByDate, currentMonth, scheduleByDate]);

  const selectedSlots = scheduleByDate.get(selectedDate) || [];
  const selectedBookings = bookingsByDate.get(selectedDate) || [];

  const handlePrevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };
  const handleNextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const handleSaveAvailability = async () => {
    if (!guideStatus?.guide) {
      toast.error('Bạn chưa là hướng dẫn viên.');
      return;
    }
    if (!selectedDate) return;
    setSaving(true);
    try {
      await createGuideSlot({
        ngay: selectedDate,
        gio_bat_dau: startTime || '08:00',
        gio_ket_thuc: endTime || '17:00',
        dia_diem: locationInput || 'Theo lịch',
        gia_tien: Number(priceInput || 0),
        ghi_chu: noteInput,
      });
      toast.success('Đã cập nhật ngày khả dụng');
      const fresh = await listMyGuideSchedule().catch(() => schedule);
      setSchedule(fresh || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu lịch');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="app-container">
        <Card>Đang tải lịch làm việc...</Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1240px] mx-auto flex flex-col gap-6">
        <section className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Hướng dẫn viên</p>
            <h1 className="text-3xl md:text-4xl font-black text-[#111813] tracking-tight mb-1">Quản lý lịch trình</h1>
            <p className="text-sm text-[#608a6e]">Cập nhật thời gian rảnh và quản lý yêu cầu đặt lịch.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              className="border border-slate-200 bg-white text-[#111813] hover:bg-slate-50 shadow-sm"
              onClick={() => toast.success('Đã xuất file (dummy)')}
            >
              <span className="material-symbols-outlined text-[18px]">download</span> Xuất lịch
            </Button>
            <Button
              type="button"
              className="bg-primary text-[#052e16] hover:-translate-y-0 shadow-md hover:shadow-lg"
              onClick={handleSaveAvailability}
              disabled={saving}
            >
              <span className="material-symbols-outlined text-[18px]">save</span> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </section>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" {...staggerContainer(0.05, 0.04)}>
          {[
            { title: 'Lịch đã nhận tháng này', value: stats.accepted, sub: 'tour', icon: 'calendar_today', chip: `+${stats.pending} chờ duyệt` },
            { title: 'Thu nhập dự kiến', value: `${stats.income.toLocaleString('vi-VN')} đ`, sub: '', icon: 'payments', chip: '+12%' },
            { title: 'Ngày trống khả dụng', value: stats.openDays, sub: 'ngày', icon: 'event_available', chip: 'Thiết lập nhanh' },
          ].map((item, idx) => (
            <motion.div key={item.title} {...fadeInUp(idx * 0.02)}>
              <Card className="p-5 rounded-xl border border-[#dbe6df] bg-white shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <span className="material-symbols-outlined text-[#111813]">{item.icon}</span>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-0">{item.chip}</Badge>
                </div>
                <p className="text-sm text-[#608a6e] m-0">{item.title}</p>
                <p className="text-3xl font-bold text-[#111813] m-0">
                  {item.value} {item.sub && <span className="text-lg font-medium text-[#608a6e]">{item.sub}</span>}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 bg-white rounded-xl border border-[#dbe6df] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#f0f5f1] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-[#111813] m-0 capitalize">{monthLabel}</h3>
                <div className="flex bg-[#f0f5f1] rounded-lg p-1">
                  <button className="p-1 rounded hover:bg-white shadow-sm" type="button" onClick={handlePrevMonth}>
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button className="p-1 rounded hover:bg-white shadow-sm" type="button" onClick={handleNextMonth}>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#608a6e]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-primary/50 border border-primary/50" /> Rảnh
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" /> Đã nhận
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200" /> Chờ duyệt
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-[480px] overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#f0f5f1]">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                      <th key={d} className="py-2 text-center text-xs font-medium text-[#608a6e] uppercase">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, weekIdx) => (
                    <tr key={weekIdx} className="h-24">
                      {monthDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day) => {
                        const isSelected = day.iso === selectedDate;
                        const baseClass = day.current ? 'text-[#111813]' : 'text-[#9aa7a0]';
                        const statusBg =
                          day.status === 'pending'
                            ? 'bg-amber-50'
                            : day.status === 'booked'
                              ? 'bg-blue-50'
                              : day.status === 'free'
                                ? 'bg-primary/10'
                                : '';
                        return (
                          <td
                            key={day.iso}
                            className={`border border-[#f0f5f1] align-top p-1 cursor-pointer hover:bg-slate-50 ${statusBg} ${isSelected ? 'ring-2 ring-primary/30' : ''}`}
                            onClick={() => setSelectedDate(day.iso)}
                          >
                            <span className={`text-sm font-semibold p-1 block ${baseClass}`}>{day.label}</span>
                            {day.status === 'free' && (
                              <div className="mt-1 mx-1 px-2 py-1 rounded bg-primary/20 text-xs text-[#0f1a12] border border-primary/30">
                                Rảnh {day.price ? `• ${Number(day.price).toLocaleString('vi-VN')}đ` : ''}
                              </div>
                            )}
                            {day.status === 'booked' && (
                              <div className="mt-1 mx-1 px-2 py-1 rounded bg-blue-100 text-xs text-blue-800">
                                Đã nhận
                              </div>
                            )}
                            {day.status === 'pending' && (
                              <div className="mt-1 mx-1 px-2 py-1 rounded bg-amber-100 text-xs text-amber-800">
                                Chờ duyệt
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-full xl:w-[360px] flex flex-col gap-6">
            <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3 border-b border-[#f0f5f1] pb-2">
                <h3 className="text-lg font-bold text-[#111813] m-0">Thiết lập ngày {selectedDate}</h3>
                <button
                  type="button"
                  className="text-[#608a6e] hover:text-primary bg-transparent border-none"
                  style={{ boxShadow: 'none', padding: 0 }}
                    onClick={() => {
                      setPriceInput('');
                      setNoteInput('');
                      setLocationInput('');
                      setStartTime('08:00');
                      setEndTime('17:00');
                    }}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-[#608a6e] mb-2 block">Giờ bắt đầu</label>
                      <input
                        type="time"
                        className="w-full bg-[#f0f5f1] border border-transparent rounded-lg px-3 h-10 text-sm text-[#111813] focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-[#608a6e] mb-2 block">Giờ kết thúc</label>
                      <input
                        type="time"
                        className="w-full bg-[#f0f5f1] border border-transparent rounded-lg px-3 h-10 text-sm text-[#111813] focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#608a6e] mb-2 block">Địa điểm</label>
                    <div className="flex items-center bg-[#f0f5f1] rounded-lg px-3 h-10 border border-transparent focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="material-symbols-outlined text-[#608a6e] text-sm">location_on</span>
                      <input
                        className="bg-transparent border-none w-full text-[#111813] font-medium focus:ring-0 text-sm"
                        placeholder="Nhập địa điểm đón / khu vực..."
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#608a6e] mb-2 block">Giá dịch vụ (VNĐ/ngày)</label>
                    <div className="flex items-center bg-[#f0f5f1] rounded-lg px-3 h-10 border border-transparent focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="material-symbols-outlined text-[#608a6e] text-sm">attach_money</span>
                    <input
                      className="bg-transparent border-none w-full text-[#111813] font-medium focus:ring-0 text-sm"
                      placeholder="Nhập giá..."
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-[#608a6e] mt-1">Giá mặc định: {selectedSlots[0]?.gia_tien?.toLocaleString('vi-VN') || '—'} đ</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#608a6e] mb-2 block">Ghi chú</label>
                  <textarea
                    className="w-full bg-[#f0f5f1] border-none rounded-lg p-3 text-sm text-[#111813] focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                    placeholder="Nhập ghi chú cho ngày này (VD: Chỉ rảnh buổi sáng)..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                  />
                </div>
                <Button type="button" className="w-full justify-center" onClick={handleSaveAvailability} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Cập nhật'}
                </Button>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm flex flex-col flex-1">
              <div className="p-4 border-b border-[#f0f5f1] flex justify-between items-center">
                <h3 className="font-bold text-[#111813] m-0">Yêu cầu chờ duyệt</h3>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {bookings.filter((b) => (b.trang_thai || '').includes('pending') || (b.trang_thai || '').includes('chờ')).length}
                </span>
              </div>
              <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
                {bookings
                  .filter((b) => (b.trang_thai || '').includes('pending') || (b.trang_thai || '').includes('chờ'))
                  .map((b) => (
                    <div key={b.id} className="border border-[#f0f5f1] rounded-xl p-3 hover:shadow-md transition-shadow bg-white">
                      <div className="flex gap-3 mb-2">
                        <div className="size-10 rounded-full bg-slate-200 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-sm text-[#111813] truncate">{b.ho_ten || 'Khách'}</h4>
                            <span className="text-xs text-[#608a6e]">{b.ngay}</span>
                          </div>
                          <p className="text-xs text-[#608a6e] truncate">{b.mo_ta || b.dia_diem || 'Yêu cầu tour'}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-[#111813] font-medium">
                            <span className="material-symbols-outlined text-sm text-primary">event</span>
                            {b.ngay} • {b.gio_bat_dau} - {b.gio_ket_thuc}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-[#052e16] transition-colors"
                          onClick={() => toast.success('Đã chấp nhận (giả lập)')}
                        >
                          Chấp nhận
                        </button>
                        <button
                          type="button"
                          className="flex-1 py-1.5 bg-slate-100 text-[#608a6e] text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                          onClick={() => toast.success('Đã từ chối (giả lập)')}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                {bookings.filter((b) => (b.trang_thai || '').includes('pending') || (b.trang_thai || '').includes('chờ')).length === 0 && (
                  <p className="text-sm text-[#608a6e] text-center">Không có yêu cầu chờ duyệt.</p>
                )}
              </div>
              <div className="p-3 border-t border-[#f0f5f1] text-center">
                <span className="text-sm text-primary font-bold">Xem tất cả</span>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm">
              <div className="p-4 border-b border-[#f0f5f1] flex justify-between items-center">
                <h3 className="font-bold text-[#111813] m-0">Lịch đã được đặt</h3>
                <span className="text-xs text-[#608a6e]">{bookings.length} booking</span>
              </div>
              <div className="max-h-[360px] overflow-auto divide-y divide-[#f0f5f1]">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#111813]">
                        <span className="material-symbols-outlined text-primary text-[18px]">event</span>
                        <span>{slotDate(b) || b.ngay}</span>
                        <span className="text-[#608a6e] text-xs">{`${b.gio_bat_dau || ''} - ${b.gio_ket_thuc || ''}`}</span>
                      </div>
                      <Badge className="bg-green-50 text-green-700 border-0">
                        {Number(b.so_nguoi || 1)} khách
                      </Badge>
                    </div>
                    <div className="text-sm text-[#111813] font-bold">{b.ho_ten || 'Khách'}</div>
                    <div className="text-xs text-[#608a6e] flex flex-wrap gap-3">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">mail</span>{b.email || '---'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">call</span>{b.so_dien_thoai || '---'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>{b.dia_diem || 'Theo lịch'}
                      </span>
                    </div>
                    <div className="text-xs text-[#608a6e]">
                      Tổng tiền: {Number(b.tong_tien || b.gia_tien || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                ))}
                {!loading && bookings.length === 0 && (
                  <p className="text-sm text-center text-[#608a6e] p-4">Chưa có booking nào.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default GuideSchedulePage;
