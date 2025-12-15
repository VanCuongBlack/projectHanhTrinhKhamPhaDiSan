import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { applyPartner } from '../api/partnerApi';
import { applyGuide } from '../api/guideApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { fadeInUp, staggerContainer } from '../lib/motion';

const ApplyPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('partner'); // partner | guide
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [partnerForm, setPartnerForm] = useState({
    ten_cong_ty: '',
    ma_so_thue: '',
    email_cong_ty: '',
    so_dien_thoai: '',
    dia_chi: '',
    mo_ta: '',
    giay_phep_kinh_doanh: null,
  });
  const [guideForm, setGuideForm] = useState({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    gioi_thieu: '',
    chuyen_mon: '',
    kinh_nghiem: '',
    anh_chan_dung: null,
    anh_cccd: null,
    anh_chung_chi: null,
  });

  const handlePartnerSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!partnerForm.ten_cong_ty || !partnerForm.ma_so_thue || !partnerForm.email_cong_ty) {
      toast.error('Nhập đủ tên công ty, MST, email');
      return;
    }
    if (!partnerForm.giay_phep_kinh_doanh) {
      toast.error('Cần tải lên giấy phép kinh doanh');
      return;
    }
    setSubmitting(true);
    setStatus('Đang gửi hồ sơ đối tác...');
    try {
      const fd = new FormData();
      Object.entries(partnerForm).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') fd.append(k, v);
      });
      await applyPartner(fd);
      toast.success('Đã gửi hồ sơ đối tác');
      setStatus('Hồ sơ đối tác đã gửi. Vui lòng chờ duyệt.');
      setPartnerForm({
        ten_cong_ty: '',
        ma_so_thue: '',
        email_cong_ty: '',
        so_dien_thoai: '',
        dia_chi: '',
        mo_ta: '',
        giay_phep_kinh_doanh: null,
      });
      navigate('/apply/status');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi hồ sơ đối tác');
      setStatus(null);
    }
    setSubmitting(false);
  };

  const handleGuideSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!guideForm.ho_ten || !guideForm.email || !guideForm.so_dien_thoai) {
      toast.error('Nhập đủ họ tên, email, số điện thoại');
      return;
    }
    if (!guideForm.gioi_thieu || !guideForm.chuyen_mon) {
      toast.error('Nhập đầy đủ giới thiệu và chuyên môn');
      return;
    }
    if (!guideForm.anh_chan_dung || !guideForm.anh_cccd || !guideForm.anh_chung_chi) {
      toast.error('Cần đủ 3 ảnh: chân dung, CCCD, chứng chỉ');
      return;
    }
    setSubmitting(true);
    setStatus('Đang gửi hồ sơ hướng dẫn viên...');
    try {
      const fd = new FormData();
      Object.entries(guideForm).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') return;
        if (k === 'kinh_nghiem') {
          fd.append(k, Number(v) || 0);
        } else {
          fd.append(k, v);
        }
      });
      await applyGuide(fd);
      toast.success('Đã gửi hồ sơ hướng dẫn viên');
      setStatus('Hồ sơ hướng dẫn viên đã gửi. Vui lòng chờ duyệt.');
      setGuideForm({
        ho_ten: '',
        email: '',
        so_dien_thoai: '',
        gioi_thieu: '',
        chuyen_mon: '',
        kinh_nghiem: '',
        anh_chan_dung: null,
        anh_cccd: null,
        anh_chung_chi: null,
      });
      navigate('/apply/status');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi hồ sơ hướng dẫn viên');
      setStatus(null);
    }
    setSubmitting(false);
  };

  const fileInput = (id, label, accept, onChange) => (
    <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
      {label}
      <input
        id={id}
        type="file"
        accept={accept}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        <motion.div {...fadeInUp(0)}>
          <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-slate-100 shadow-sm rounded-2xl px-5 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Đăng ký đối tác / hướng dẫn viên</p>
              <h1 className="text-3xl font-black text-[#111813] tracking-tight">Tham gia Hành trình di sản</h1>
              <p className="text-sm text-[#608a6e]">Kết nối với du khách, quản lý tour và nhận thanh toán minh bạch.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 bg-[#f5f8f6] rounded-full p-1">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-full text-sm font-bold ${role === 'partner' ? 'bg-white text-[#111813] shadow-sm' : 'text-[#608a6e]'}`}
                  onClick={() => setRole('partner')}
                >
                  Đối tác tour
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-full text-sm font-bold ${role === 'guide' ? 'bg-white text-[#111813] shadow-sm' : 'text-[#608a6e]'}`}
                  onClick={() => setRole('guide')}
                >
                  Hướng dẫn viên
                </button>
              </div>
              <Link
                to="/apply/status"
                className="flex h-10 items-center justify-center rounded-lg border border-[#dbe6df] bg-white px-4 text-sm font-semibold text-[#111813] hover:bg-slate-50"
              >
                Xem trạng thái hồ sơ
              </Link>
            </div>
          </Card>
        </motion.div>

        {status && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-[#0b3b23]">
            {status}
          </div>
        )}

        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" {...staggerContainer(0.05, 0.05)}>
          <motion.div {...fadeInUp(0.02)} className="lg:col-span-2">
            <Card className="p-6 md:p-8 rounded-xl bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#608a6e]">Bước 1/3</p>
                  <h3 className="text-lg font-bold text-[#111813] m-0">{role === 'partner' ? 'Thông tin đối tác' : 'Thông tin hướng dẫn viên'}</h3>
                </div>
                <span className="text-xs text-[#608a6e]">33% hoàn thành</span>
              </div>
              <div className="rounded-full bg-[#dbe6df] h-2 overflow-hidden">
                <div className="h-full bg-[#111813]" style={{ width: '33%' }} />
              </div>

              {role === 'partner' ? (
                <form className="flex flex-col gap-5" onSubmit={handlePartnerSubmit}>
                  <div className="grid md:grid-cols-2 gap-5">
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813]">
                      Tên công ty
                      <input
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Công ty du lịch ABC"
                        value={partnerForm.ten_cong_ty}
                        onChange={(e) => setPartnerForm((prev) => ({ ...prev, ten_cong_ty: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813]">
                      Mã số thuế
                      <input
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="MST"
                        value={partnerForm.ma_so_thue}
                        onChange={(e) => setPartnerForm((prev) => ({ ...prev, ma_so_thue: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813] md:col-span-2">
                      Email công ty
                      <input
                        type="email"
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="email@company.com"
                        value={partnerForm.email_cong_ty}
                        onChange={(e) => setPartnerForm((prev) => ({ ...prev, email_cong_ty: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813]">
                      Số điện thoại
                      <input
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="0912 xxx xxx"
                        value={partnerForm.so_dien_thoai}
                        onChange={(e) => setPartnerForm((prev) => ({ ...prev, so_dien_thoai: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813]">
                      Địa chỉ
                      <input
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Số nhà, đường, thành phố"
                        value={partnerForm.dia_chi}
                        onChange={(e) => setPartnerForm((prev) => ({ ...prev, dia_chi: e.target.value }))}
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                    Mô tả
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-[#d1d5db] bg-white px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Giới thiệu công ty, thế mạnh..."
                      value={partnerForm.mo_ta}
                      onChange={(e) => setPartnerForm((prev) => ({ ...prev, mo_ta: e.target.value }))}
                    />
                  </label>
                  {fileInput('biz-license', 'Giấy phép kinh doanh', '.pdf,.jpg,.jpeg,.png,.webp', (file) => setPartnerForm((prev) => ({ ...prev, giay_phep_kinh_doanh: file })))}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0f5f1]">
                    <Button type="submit" disabled={submitting} className="px-6">
                      {submitting ? 'Đang gửi...' : 'Gửi hồ sơ đối tác'}
                    </Button>
                  </div>
                </form>
              ) : (
                <form className="flex flex-col gap-5" onSubmit={handleGuideSubmit}>
                  <div className="grid md:grid-cols-2 gap-5">
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813]">
                      Họ và tên
                      <input
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Nguyễn Văn A"
                        value={guideForm.ho_ten}
                        onChange={(e) => setGuideForm((prev) => ({ ...prev, ho_ten: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813]">
                      Số điện thoại
                      <input
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="0912 xxx xxx"
                        value={guideForm.so_dien_thoai}
                        onChange={(e) => setGuideForm((prev) => ({ ...prev, so_dien_thoai: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813] md:col-span-2">
                      Email
                      <input
                        type="email"
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="email@example.com"
                        value={guideForm.email}
                        onChange={(e) => setGuideForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813]">
                      Chuyên môn
                      <input
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Lịch sử, ẩm thực, nhiếp ảnh..."
                        value={guideForm.chuyen_mon}
                        onChange={(e) => setGuideForm((prev) => ({ ...prev, chuyen_mon: e.target.value }))}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#111813]">
                      Kinh nghiệm (năm)
                      <input
                        className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Ví dụ: 3"
                        value={guideForm.kinh_nghiem}
                        onChange={(e) => setGuideForm((prev) => ({ ...prev, kinh_nghiem: e.target.value }))}
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                    Giới thiệu bản thân
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-[#d1d5db] bg-white px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Tôi am hiểu lịch sử vùng..., từng dẫn ... "
                      value={guideForm.gioi_thieu}
                      onChange={(e) => setGuideForm((prev) => ({ ...prev, gioi_thieu: e.target.value }))}
                    />
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {fileInput('avatar', 'Ảnh chân dung', '.jpg,.jpeg,.png,.webp', (file) => setGuideForm((prev) => ({ ...prev, anh_chan_dung: file })))}
                    {fileInput('cccd', 'Ảnh CCCD/Passport', '.jpg,.jpeg,.png,.webp', (file) => setGuideForm((prev) => ({ ...prev, anh_cccd: file })))}
                    {fileInput('cert', 'Chứng chỉ (nếu có)', '.jpg,.jpeg,.png,.webp', (file) => setGuideForm((prev) => ({ ...prev, anh_chung_chi: file })))}
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0f5f1]">
                    <Button type="submit" disabled={submitting} className="px-6">
                      {submitting ? 'Đang gửi...' : 'Gửi hồ sơ hướng dẫn viên'}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </motion.div>

          <motion.div {...fadeInUp(0.08)} className="flex flex-col gap-6">
            <Card className="bg-[#e7fcf0] rounded-xl p-6 border border-primary/20 sticky top-24">
              <h3 className="text-lg font-bold text-[#111813] mb-4">Quyền lợi khi tham gia</h3>
              <div className="flex flex-col gap-4 text-sm text-[#4d5a52]">
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary">monetization_on</span>
                  <div>
                    <p className="font-bold m-0 text-[#111813]">Thu nhập hấp dẫn</p>
                    <p className="m-0 text-xs text-[#608a6e]">Tiếp cận hàng triệu du khách và gia tăng thu nhập.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <div>
                    <p className="font-bold m-0 text-[#111813]">Lịch trình linh hoạt</p>
                    <p className="m-0 text-xs text-[#608a6e]">Chủ động nhận lịch phù hợp với bạn.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary">stars</span>
                  <div>
                    <p className="font-bold m-0 text-[#111813]">Xây dựng thương hiệu</p>
                    <p className="m-0 text-xs text-[#608a6e]">Tích lũy đánh giá 5 sao và trở thành Top guide.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                  <div>
                    <p className="font-bold m-0 text-[#111813]">Ví thanh toán tiện lợi</p>
                    <p className="m-0 text-xs text-[#608a6e]">Nhận thanh toán nhanh qua ví sau khi hoàn thành.</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-[#111813] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">verified_user</span>
                Quy trình xét duyệt
              </h3>
              <p className="text-sm text-[#608a6e] mb-3">
                Hồ sơ của bạn sẽ được đội ngũ Admin xét duyệt trong vòng <strong className="text-[#111813]">24-48 giờ</strong>.
              </p>
              <div className="flex items-center gap-2 p-3 bg-[#f5f8f6] rounded-lg text-sm text-[#4d5a52]">
                <span className="material-symbols-outlined text-slate-500">lock</span>
                Thông tin được bảo mật tuyệt đối.
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default ApplyPage;
