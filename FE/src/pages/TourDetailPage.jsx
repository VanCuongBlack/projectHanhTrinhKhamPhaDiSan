import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getTours } from '../api/contentApi';
import { bookTour } from '../api/tourBookingApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import Badge from '../components/ui/Badge';
import { fadeInUp, staggerContainer } from '../lib/motion';

const FALLBACK_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDCe9HEKzyqW_1PkOuddLOgR3mI5hh81qVVO4t5AMf8r1EYVwq_hXaWnszB7mj8ZqzqxBFz5eqPzG-U3aRHqIQ6QKnkhkl_mhKUpA3jg2O5HLG5wkEqqa98Q7Nd-70hYwUAexl6whVPiX80I7fkLgv34COtlcUhi8rpGQlRkdL9I4eWgXgUHzdn9HWRVdf6G7sfscgCb1m4XK1_s5KtkBvs2jxKODPGn7Ttpp9Xf5xmUCcGHhqo92q9ewVJXGFZLIcEk7lAW10ioeo';

const TourDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [form, setForm] = useState({ so_luong: 1, ma_voucher: '' });
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getTours();
        setTours(data || []);
      } catch (err) {
        toast.error('Không thể tải tour');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tour = useMemo(() => tours.find((t) => String(t.ma_tour) === id), [tours, id]);

  const rating = 4.8;
  const durationLabel = tour?.so_ngay ? `${tour.so_ngay}N${Math.max(Number(tour.so_ngay) - 1, 0)}Đ` : '1 Ngày';
  const cover = tour?.anh || FALLBACK_IMG;

  const handleBook = async (event) => {
    event.preventDefault();
    if (!tour) return;
    setPaying(true);
    try {
      await bookTour(tour.ma_tour, {
        so_luong: Number(form.so_luong || 1),
        ma_voucher: form.ma_voucher || null,
      });
      toast.success('Đặt tour thành công');
      navigate('/wallet');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
    }
    setPaying(false);
  };

  if (!tour && !loading) {
    return (
      <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
        <Card>Không tìm thấy tour #{id}</Card>
      </PageShell>
    );
  }

  const itinerary = [
    { day: 1, title: 'Đón khách & tham quan', detail: 'Check-in điểm nổi bật và trải nghiệm địa phương.' },
    { day: 2, title: 'Khám phá văn hóa', detail: 'Ẩm thực bản địa, giao lưu cộng đồng.' },
    { day: 3, title: 'Tổng kết & mua sắm', detail: 'Tặng voucher, chuẩn bị lên đường về.' },
  ];

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-6">
        <motion.div {...fadeInUp(0)}>
          <Card className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm p-0 bg-white">
            <div className="relative">
              <div className="h-[260px] md:h-[360px] bg-cover bg-center" style={{ backgroundImage: `url('${cover}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 text-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Tour #{tour?.ma_tour || id}</p>
                  <h1 className="text-2xl md:text-3xl font-black m-0">{tour?.tieu_de || 'Đang tải...'}</h1>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge className="bg-white/20 text-white border border-white/30">⭐ {rating}</Badge>
                    <Badge className="bg-white/20 text-white border border-white/30">{durationLabel}</Badge>
                    {tour?.so_nguoi_toi_da && <Badge className="bg-white/20 text-white border border-white/30">{tour.so_nguoi_toi_da} khách</Badge>}
                    {tour?.dia_diem && <Badge className="bg-white/20 text-white border border-white/30">{tour.dia_diem}</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/80 m-0">Giá từ</p>
                  <p className="text-3xl font-black m-0">{Number(tour?.gia || 0).toLocaleString('vi-VN')} đ</p>
                  <p className="text-xs text-white/70 m-0">Đã gồm thuế, chưa gồm voucher</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6" {...staggerContainer(0.05, 0.05)}>
          <motion.div {...fadeInUp(0.02)} className="space-y-4">
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-[#111813] m-0">Giới thiệu tour</h3>
              <p className="text-sm text-[#608a6e] m-0">{tour?.mo_ta || 'Trải nghiệm địa phương với hướng dẫn viên bản địa.'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-lg bg-[#f5f8f6] p-3 text-sm text-[#111813]">
                  <p className="text-xs text-[#608a6e] m-0">Thời lượng</p>
                  <strong>{durationLabel}</strong>
                </div>
                <div className="rounded-lg bg-[#f5f8f6] p-3 text-sm text-[#111813]">
                  <p className="text-xs text-[#608a6e] m-0">Giá</p>
                  <strong>{Number(tour?.gia || 0).toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="rounded-lg bg-[#f5f8f6] p-3 text-sm text-[#111813]">
                  <p className="text-xs text-[#608a6e] m-0">Địa điểm</p>
                  <strong>{tour?.dia_diem || 'Đang cập nhật'}</strong>
                </div>
              </div>
            </Card>

            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-[#111813] m-0">Lịch trình</h3>
              <div className="flex flex-col gap-3 relative">
                <div className="absolute left-4 top-2 bottom-2 w-[2px] bg-[#dbe6df]" />
                {itinerary.map((item) => (
                  <div key={item.day} className="flex gap-3 pl-6">
                    <div className="size-8 rounded-full bg-primary text-[#111813] font-bold flex items-center justify-center shrink-0">#{item.day}</div>
                    <div>
                      <p className="m-0 font-semibold text-[#111813]">{item.title}</p>
                      <p className="m-0 text-sm text-[#608a6e]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeInUp(0.06)} className="space-y-4">
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm sticky top-24 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#608a6e] m-0">Giá tour</p>
                  <p className="text-2xl font-black text-[#111813] m-0">{Number(tour?.gia || 0).toLocaleString('vi-VN')} đ</p>
                  <p className="text-xs text-[#608a6e] m-0">Thanh toán qua ví (bao gồm thuế)</p>
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-0">Ưu đãi + điểm</Badge>
              </div>
              <form className="flex flex-col gap-3" onSubmit={handleBook}>
                <InputField
                  label="Số lượng khách"
                  type="number"
                  min="1"
                  value={form.so_luong}
                  onChange={(e) => setForm((prev) => ({ ...prev, so_luong: e.target.value }))}
                />
                <InputField
                  label="Mã voucher"
                  value={form.ma_voucher}
                  onChange={(e) => setForm((prev) => ({ ...prev, ma_voucher: e.target.value }))}
                  placeholder="Nhập mã voucher (nếu có)"
                />
                <Button type="submit" disabled={paying} className="w-full justify-center">
                  {paying ? 'Đang thanh toán...' : 'Đặt tour & thanh toán'}
                </Button>
              </form>
            </Card>

            <Card className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-[#111813] m-0 mb-2">Cam kết</h4>
              <ul className="text-sm text-[#608a6e] space-y-1 pl-5 list-disc">
                <li>Hủy miễn phí trong 48h (nếu tour chưa khởi hành).</li>
                <li>Hoàn tiền qua ví nếu tour bị hủy bởi đối tác.</li>
                <li>Hỗ trợ 24/7 trong suốt hành trình.</li>
              </ul>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default TourDetailPage;
