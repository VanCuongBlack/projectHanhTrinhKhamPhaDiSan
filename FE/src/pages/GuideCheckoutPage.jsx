import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { bookGuideSlot } from '../api/guideApi';
import http from '../api/httpClient';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import Skeleton from '../components/ui/Skeleton';
import { fadeInUp, staggerContainer } from '../lib/motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');

const fallbackAvatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCntj2faa_8ERtpAPY9VXXaK1NHn1SXtM5xplIbfCq5wf3XIVvNRdlGniC6eWX0RhXBPLFntlKwhRsyLy3NmAWYvJPEyA4O70Gr-9JgjZfMMBKG1Ahf8x1q6HBwBcOovHuE8-T4gzRvmqV6kIzL2jxT0DhV0E8KV6GFIOPzpTOCbYC9Eox_axyAbvrg3HIVU3xoDmqPqBsahnH0Npng01mhLo19yWI__RBTtt1OeTjf__U1McK5_gju5aqcAXG1ALSSAdVnrB64RAU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDr4-1ddrf2HFZ6AdPRIuW6H0LKtwDMx-PO2piE6mxuSs8u54nULqxTWXuaijmbkce2SCXSbuK3kO1s5fL_mZqNM426gFqaVPi1EEEv2GTvBgSEfHKJrY6zHfmzCuA8DXEV_dAV6uyd9dfyAtsj2plw3M1_wbNlDJx0JcFi1mD1h2bR6w9_1PsGiSEud4-iEwPNRnz7eIMjx0cPzCgE2l-YwCfCTxJZWAse7oJMNqr_NXo7ZtAZrm5sEM2vttjl_L6D0KR70zisF3w',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBZJbfnudZ-R5xddWSU9lLT_eYENFU2DbLNdhYuBeyxdyPxR-gdddbMfNTWoEPwM-oJGMxc_inmGvjHoXQhFNMjwyLPAtY--nWqOeS2y7ogimNe9empbQca8kbDZVGNHfztAuUomuSkoZ7bkH023vgeLMMyyrmOoB_tD0CQjVBZKYocbG-XYky_aG7UT1LsMvZzyndYKCSNVRrfihpxhfjPMe1C1uEcbvxcfMv3tWsNPjxVh4N5Z4-gSN96ApFfLK59FGKYcKZVREs',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB7WwctJ_8dg1xt2Z002Wl5QzHA_QMy5ppmZ7CgN--BIunO3uJAsHegPQcZj7kHLA97HN5Sr0zDdt0PoTppom8LLMIzyhEXWW0sSrdLfo7kXiNepgmsgXidtO90by_IAMpQQvNNZMIDyXFLLoHZaVaNsAGgwF12Kf9nw1MkwfI_jvm_Bx0q_qlT64rNvRrAWl35t5ccJDfzFAKDiE6KX3wKymfg97Rc9ewTwk77P1q2BB-OZ51OEEWKYS4HSKwfztIcNb7HIVQw_kQ',
];

const GuideCheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateSlot = location.state?.slot || null;
  const [slot, setSlot] = useState(stateSlot);
  const [loading, setLoading] = useState(!stateSlot);
  const [paying, setPaying] = useState(false);
  const [form, setForm] = useState({ so_nguoi: 1, ma_voucher: '' });

  useEffect(() => {
    const fetchSlot = async () => {
      if (stateSlot) return;
      setLoading(true);
      try {
        const { data } = await http.get(`/guides/schedule/${id}`);
        setSlot(data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không tải được slot');
      } finally {
        setLoading(false);
      }
    };
    fetchSlot();
  }, [id, stateSlot]);

  const avatar = useMemo(() => {
    if (!slot?.anh_dai_dien) return fallbackAvatars[(Number(id) || 0) % fallbackAvatars.length];
    if (/^https?:\/\//.test(slot.anh_dai_dien)) return slot.anh_dai_dien;
    return `${API_ROOT}${slot.anh_dai_dien.startsWith('/') ? '' : '/'}${slot.anh_dai_dien}`;
  }, [slot, id]);

  const priceLabel = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ/giờ`;
  const ratingLabel = (s) => {
    const raw = s?.rating_avg ?? s?.rating ?? 4.8;
    const val = Number(raw);
    return Number.isFinite(val) ? val.toFixed(1) : '0.0';
  };

  const handlePay = async (event) => {
    event.preventDefault();
    if (!slot) return;
    setPaying(true);
    try {
      await bookGuideSlot({
        slot_id: slot.id,
        so_nguoi: Number(form.so_nguoi || 1),
        ma_voucher: form.ma_voucher || null,
      });
      toast.success('Thanh toán thành công');
      navigate('/guides/search');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
    }
    setPaying(false);
  };

  if (loading) {
    return (
      <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
        <Card>Đang tải thông tin hướng dẫn viên...</Card>
      </PageShell>
    );
  }
  if (!slot) {
    return (
      <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
        <Card>Không tìm thấy lịch hướng dẫn viên.</Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-6">
        <motion.div {...fadeInUp(0)}>
          <Card className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm p-0 bg-white">
            <div className="relative">
              <div className="h-[220px] bg-gradient-to-r from-green-50 via-white to-green-50" />
              <div className="absolute inset-0 flex flex-col md:flex-row md:items-end md:justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-full bg-center bg-cover border-4 border-white shadow-sm" style={{ backgroundImage: `url('${avatar}')` }} />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#608a6e] m-0">Hướng dẫn viên</p>
                    <h1 className="text-2xl font-black text-[#111813] m-0">{slot.ho_ten || 'Guide'}</h1>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge className="bg-amber-50 text-amber-700 border-0">⭐ {ratingLabel(slot)}</Badge>
                      {slot.dia_diem && <Badge className="bg-slate-100 text-[#111813] border-0">{slot.dia_diem}</Badge>}
                      {slot.ngon_ngu && <Badge className="bg-slate-100 text-[#111813] border-0">{slot.ngon_ngu}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#608a6e] m-0">Khung giờ</p>
                  <p className="text-xl font-black text-[#111813] m-0">
                    {slot.ngay} • {slot.gio_bat_dau} - {slot.gio_ket_thuc}
                  </p>
                  <p className="text-sm text-primary font-bold m-0">{priceLabel(slot.gia_tien)}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6" {...staggerContainer(0.05, 0.05)}>
          <motion.div {...fadeInUp(0.02)} className="space-y-4">
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-[#111813] m-0">Giới thiệu</h3>
              <p className="text-sm text-[#608a6e] m-0">{slot.gioi_thieu || 'Hướng dẫn viên địa phương sẵn sàng đồng hành cùng bạn.'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-lg bg-[#f5f8f6] p-3 text-sm text-[#111813]">
                  <p className="text-xs text-[#608a6e] m-0">Chuyên môn</p>
                  <strong>{slot.chuyen_mon || 'Địa phương'}</strong>
                </div>
                <div className="rounded-lg bg-[#f5f8f6] p-3 text-sm text-[#111813]">
                  <p className="text-xs text-[#608a6e] m-0">Kinh nghiệm</p>
                  <strong>{slot.kinh_nghiem || '—'} năm</strong>
                </div>
                <div className="rounded-lg bg-[#f5f8f6] p-3 text-sm text-[#111813]">
                  <p className="text-xs text-[#608a6e] m-0">Ngôn ngữ</p>
                  <strong>{slot.ngon_ngu || 'Tiếng Việt'}</strong>
                </div>
              </div>
            </Card>

            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-[#111813] m-0">Thông tin lịch</h3>
              <div className="flex flex-col gap-2 text-sm text-[#111813]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">event</span>
                  {slot.ngay} • {slot.gio_bat_dau} - {slot.gio_ket_thuc}
                </div>
                {slot.dia_diem && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                    {slot.dia_diem}
                  </div>
                )}
                {slot.thanh_vien_tu_ngay && (
                  <div className="flex items-center gap-2 text-[#608a6e]">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                    Hoạt động từ: {slot.thanh_vien_tu_ngay.slice(0, 10)}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeInUp(0.06)} className="space-y-4">
            <Card className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm sticky top-24 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#608a6e] m-0">Giá dịch vụ</p>
                  <p className="text-2xl font-black text-[#111813] m-0">{priceLabel(slot.gia_tien)}</p>
                  <p className="text-xs text-[#608a6e] m-0">Thanh toán qua ví</p>
                </div>
                <Badge className="bg-primary/15 text-primary border-0">Tích điểm</Badge>
              </div>
              <form className="flex flex-col gap-3" onSubmit={handlePay}>
                <InputField
                  label="Số người"
                  type="number"
                  min="1"
                  value={form.so_nguoi}
                  onChange={(e) => setForm((prev) => ({ ...prev, so_nguoi: e.target.value }))}
                />
                <InputField
                  label="Mã voucher"
                  value={form.ma_voucher}
                  onChange={(e) => setForm((prev) => ({ ...prev, ma_voucher: e.target.value }))}
                  placeholder="Nhập mã voucher (nếu có)"
                />
                <Button type="submit" disabled={paying} className="w-full justify-center">
                  {paying ? 'Đang thanh toán...' : 'Đặt lịch & thanh toán'}
                </Button>
              </form>
            </Card>

            <Card className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-[#111813] m-0 mb-2">Cam kết</h4>
              <ul className="text-sm text-[#608a6e] space-y-1 pl-5 list-disc m-0">
                <li>Hủy miễn phí trong 24h trước giờ bắt đầu.</li>
                <li>Hoàn tiền qua ví nếu guide hủy lịch.</li>
                <li>Hỗ trợ 24/7 trong suốt trải nghiệm.</li>
              </ul>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default GuideCheckoutPage;
