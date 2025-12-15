import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fadeInUp, staggerContainer } from '../lib/motion';
import { getMyPartnerStatus } from '../api/partnerApi';
import { getMyGuideStatus } from '../api/guideApi';

const statusStyles = {
  pending: { label: 'Đang duyệt', chip: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  approved: { label: 'Đã duyệt', chip: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  rejected: { label: 'Từ chối', chip: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  none: { label: 'Chưa gửi', chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' },
};

const StepItem = ({ active, label, time }) => (
  <div className="flex items-center gap-3">
    <div className={`size-3 rounded-full ${active ? 'bg-primary' : 'bg-[#dbe6df]'}`} />
    <div className="flex flex-col">
      <span className={`text-sm font-semibold ${active ? 'text-[#111813]' : 'text-[#9aa8a0]'}`}>{label}</span>
      {time && <span className="text-xs text-[#9aa8a0]">{time}</span>}
    </div>
  </div>
);

const ApplicationCard = ({ title, description, application, entity, ctaLink }) => {
  const statusKey = application?.trang_thai || (entity ? 'approved' : 'none');
  const status = statusStyles[statusKey] || statusStyles.none;
  const createdAt = application?.ngay_dang_ky?.slice?.(0, 10);

  return (
    <Card className="p-6 md:p-7 rounded-xl border border-[#dbe6df] shadow-sm bg-white flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#608a6e]">{description}</p>
          <h3 className="text-lg font-bold text-[#111813] m-0">{title}</h3>
        </div>
        <Badge className={`${status.chip} border-0`}>{status.label}</Badge>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-[#f0f5f1] bg-[#f8fbf9] p-4">
        <StepItem active={!!application || !!entity} label="Đã gửi hồ sơ" time={createdAt} />
        <StepItem active={statusKey === 'pending' || statusKey === 'approved' || statusKey === 'rejected'} label="Đang xét duyệt" />
        <div className="flex items-center gap-2">
          <div className={`size-3 rounded-full ${status.dot}`} />
          <span className="text-sm font-semibold text-[#111813]">Kết quả</span>
          <span className="text-xs text-[#608a6e]">
            {statusKey === 'approved' && 'Hồ sơ đã được duyệt'}
            {statusKey === 'rejected' && 'Hồ sơ bị từ chối'}
            {statusKey === 'pending' && 'Đang chờ xét duyệt'}
            {statusKey === 'none' && 'Chưa có hồ sơ'}
          </span>
        </div>
        {statusKey === 'rejected' && (
          <p className="text-xs text-[#9aa8a0] m-0">Bạn có thể gửi lại hồ sơ với thông tin đầy đủ hơn.</p>
        )}
      </div>

      {entity && (
        <div className="rounded-lg border border-[#f0f5f1] bg-white p-3">
          <p className="text-sm font-bold text-[#111813] m-0">{entity.ten_cong_ty || entity.ho_ten || 'Hồ sơ đã duyệt'}</p>
          <p className="text-xs text-[#608a6e] m-0">
            Thành viên từ: {entity.thanh_vien_tu_ngay?.slice?.(0, 10) || entity.ngay_tao?.slice?.(0, 10) || '—'}
          </p>
        </div>
      )}

      {statusKey === 'none' && (
        <div className="flex items-center justify-between gap-3 bg-[#f5f8f6] border border-dashed border-[#dbe6df] rounded-lg p-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#111813] m-0">Chưa có hồ sơ</p>
            <p className="text-xs text-[#608a6e] m-0">Gửi hồ sơ để bắt đầu hợp tác cùng Di Sản Việt.</p>
          </div>
          <Link to={ctaLink}>
            <Button type="button" size="sm" className="px-3">
              Gửi hồ sơ
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};

const ApplicationStatusPage = () => {
  const [loading, setLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState({ application: null, partner: null });
  const [guideStatus, setGuideStatus] = useState({ application: null, guide: null });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const errors = [];
      try {
        const res = await getMyPartnerStatus();
        setPartnerStatus(res || {});
      } catch (err) {
        errors.push(err.response?.data?.message || err.message);
      }
      try {
        const res = await getMyGuideStatus();
        setGuideStatus(res || {});
      } catch (err) {
        errors.push(err.response?.data?.message || err.message);
      }
      if (errors.length) toast.error(errors[0]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        <motion.div {...fadeInUp(0)}>
          <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-[#dbe6df] shadow-sm rounded-2xl px-5 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Trạng thái hồ sơ</p>
              <h1 className="text-2xl font-bold text-[#111813] m-0">Theo dõi tiến độ xét duyệt</h1>
              <p className="text-sm text-[#608a6e] m-0">Đối tác & hướng dẫn viên freelance.</p>
            </div>
            <Link to="/apply">
              <Button type="button" variant="ghost" className="bg-white text-[#111813] border border-[#dbe6df] hover:bg-slate-50">
                Gửi hồ sơ mới
              </Button>
            </Link>
          </Card>
        </motion.div>

        {loading ? (
          <Card className="p-6 rounded-xl border border-[#dbe6df] shadow-sm bg-white">
            <p className="text-sm text-[#608a6e]">Đang tải trạng thái hồ sơ...</p>
          </Card>
        ) : (
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-5" {...staggerContainer(0.04, 0.05)}>
            <motion.div {...fadeInUp(0.02)}>
              <ApplicationCard
                title="Hồ sơ Đối tác"
                description="Kênh dành cho doanh nghiệp/đối tác"
                application={partnerStatus.application}
                entity={partnerStatus.partner}
                ctaLink="/apply"
              />
            </motion.div>
            <motion.div {...fadeInUp(0.04)}>
              <ApplicationCard
                title="Hồ sơ Hướng dẫn viên"
                description="Kênh dành cho guide freelance"
                application={guideStatus.application}
                entity={guideStatus.guide}
                ctaLink="/apply"
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
};

export default ApplicationStatusPage;
