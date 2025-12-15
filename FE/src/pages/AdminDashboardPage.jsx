import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  createPlace,
  deletePlace,
  createVoucher,
  assignVoucherBulk,
  listGuidesAdmin,
  listGuideApplications,
  listPartnersAdmin,
  listPlacesAdmin,
  listPlaceTypes,
  listProvinces,
  listUsers,
  listVouchers,
  lockUser,
  unlockUser,
  updateGuideApplication,
  listWithdrawRequests,
  reviewWithdrawRequest,
  updatePlace,
} from '../api/adminApi';
import {
  listPartnerApplications,
  updatePartnerApplication,
} from '../api/partnerApi';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { fadeInUp, staggerContainer } from '../lib/motion';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';

const avatarColor = (text = '') => {
  const palette = ['#E8F5E9', '#E3F2FD', '#FFF3E0', '#F3E5F5', '#E0F7FA'];
  const idx = text.charCodeAt(0) % palette.length || 0;
  return palette[idx];
};

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [guides, setGuides] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [processing, setProcessing] = useState({});
  const [appTab, setAppTab] = useState('partner');
  const [appLoading, setAppLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [places, setPlaces] = useState([]);
  const [placeTypes, setPlaceTypes] = useState([]);
  const [placeForm, setPlaceForm] = useState({
    ten_dia_diem: '',
    ma_tinh: '',
    mo_ta: '',
    dia_chi: '',
    toado_lat: '',
    toado_lng: '',
    ma_loai: '',
    anh: '',
    anh_file: null,
  });
  const [editingPlace, setEditingPlace] = useState(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placePage, setPlacePage] = useState(1);
  const [placeTotal, setPlaceTotal] = useState(0);
  const PLACE_LIMIT = 10;
  const placeFormRef = useRef(null);
  const USER_LIMIT = 10;
  const PARTNER_LIMIT = 10;
  const GUIDE_LIMIT = 10;
  const [userList, setUserList] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [partnerList, setPartnerList] = useState([]);
  const [partnerPage, setPartnerPage] = useState(1);
  const [partnerTotal, setPartnerTotal] = useState(0);
  const [guideList, setGuideList] = useState([]);
  const [guidePage, setGuidePage] = useState(1);
  const [guideTotal, setGuideTotal] = useState(0);
  const [adminTab, setAdminTab] = useState('users');
  const [vouchers, setVouchers] = useState([]);
  const [voucherPage, setVoucherPage] = useState(1);
  const [voucherTotal, setVoucherTotal] = useState(0);
  const VOUCHER_LIMIT = 10;
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    tieu_de: '',
    mo_ta: '',
    giam_phan_tram: 10,
    giam_toi_da: 100000,
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
    apply_all: true,
  });

  const loadPartnerApps = async (showSpinner = true) => {
    if (showSpinner) setAppLoading(true);
    try {
      const res = await listPartnerApplications({ status: 'pending', limit: 20, page: 1 });
      setPartners(res?.data || res || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được hồ sơ đối tác');
    }
    if (showSpinner) setAppLoading(false);
  };

  const loadGuideApps = async (showSpinner = true) => {
    if (showSpinner) setAppLoading(true);
    try {
      const res = await listGuideApplications({ status: 'pending', limit: 20, page: 1 });
      setGuides(res?.data || res || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được hồ sơ hướng dẫn viên');
    }
    if (showSpinner) setAppLoading(false);
  };

  const loadProvinces = async () => {
    try {
      const res = await listProvinces({ limit: 100, page: 1 });
      setProvinces(res?.data || res || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách tỉnh/thành');
    }
  };

  const loadPlaceTypes = async () => {
    try {
      const res = await listPlaceTypes();
      setPlaceTypes(res?.data || res || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được loại địa điểm');
    }
  };

  const loadPlaces = async (page = placePage, showSpinner = true) => {
    if (showSpinner) setPlaceLoading(true);
    try {
      const res = await listPlacesAdmin({ limit: PLACE_LIMIT, page });
      const data = res?.data || res || [];
      setPlaces(data);
      setPlacePage(res?.page || page || 1);
      setPlaceTotal(res?.total || data.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được di sản');
    }
    if (showSpinner) setPlaceLoading(false);
  };

  const loadUsersAdmin = async (page = userPage) => {
    try {
      const res = await listUsers({ limit: USER_LIMIT, page });
      const data = res?.data || res || [];
      setUserList(data);
      setUserPage(res?.page || page || 1);
      setUserTotal(res?.total || data.length || 0);
      setUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được người dùng');
    }
  };

  const loadPartnersAdmin = async (page = partnerPage) => {
    try {
      const res = await listPartnersAdmin({ limit: PARTNER_LIMIT, page });
      const data = res?.data || res || [];
      setPartnerList(data);
      setPartnerPage(res?.page || page || 1);
      setPartnerTotal(res?.total || data.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được đối tác');
    }
  };

  const loadGuidesAdmin = async (page = guidePage) => {
    try {
      const res = await listGuidesAdmin({ limit: GUIDE_LIMIT, page });
      const data = res?.data || res || [];
      setGuideList(data);
      setGuidePage(res?.page || page || 1);
      setGuideTotal(res?.total || data.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được hướng dẫn viên');
    }
  };

  const loadVouchers = async (page = voucherPage, showSpinner = true) => {
    if (showSpinner) setVoucherLoading(true);
    try {
      const res = await listVouchers({ limit: VOUCHER_LIMIT, page });
      const data = res?.data || res || [];
      setVouchers(data);
      setVoucherPage(res?.page || page || 1);
      setVoucherTotal(res?.total || data.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được voucher');
    }
    if (showSpinner) setVoucherLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const errors = [];
      const safe = async (fn, fallback) => {
        try {
          return await fn();
        } catch (err) {
          errors.push(err.response?.data?.message || err.message || 'Lỗi tải dữ liệu');
          return fallback;
        }
      };

      const [userRes, partnerRes, guideRes, withdrawRes, provincesRes, placesRes, placeTypesRes, vouchersRes] = await Promise.all([
        safe(() => listUsers({ limit: USER_LIMIT, page: 1 }), []),
        safe(() => listPartnersAdmin({ limit: PARTNER_LIMIT, page: 1 }), []),
        safe(() => listGuidesAdmin({ limit: GUIDE_LIMIT, page: 1 }), []),
        safe(() => listWithdrawRequests({ status: 'pending', limit: 10, page: 1 }), []),
        safe(() => listProvinces({ limit: 100, page: 1 }), []),
        safe(() => listPlacesAdmin({ limit: PLACE_LIMIT, page: 1 }), []),
        safe(() => listPlaceTypes(), []),
        safe(() => listVouchers({ limit: VOUCHER_LIMIT, page: 1 }), []),
      ]);

      const userData = userRes?.data || userRes || [];
      setUsers(userData);
      setUserList(userData);
      setUserPage(userRes?.page || 1);
      setUserTotal(userRes?.total || userData.length || 0);
      const partnerData = partnerRes?.data || partnerRes || [];
      setPartnerList(partnerData);
      setPartnerPage(partnerRes?.page || 1);
      setPartnerTotal(partnerRes?.total || partnerData.length || 0);
      const guideData = guideRes?.data || guideRes || [];
      setGuideList(guideData);
      setGuidePage(guideRes?.page || 1);
      setGuideTotal(guideRes?.total || guideData.length || 0);
      setWithdraws(withdrawRes?.data || withdrawRes || []);
      setProvinces(provincesRes?.data || provincesRes || []);
      const placeData = placesRes?.data || placesRes || [];
      setPlaces(placeData);
      setPlacePage(placesRes?.page || 1);
      setPlaceTotal(placesRes?.total || placeData.length || 0);
      setPlaceTypes(placeTypesRes?.data || placeTypesRes || []);
      const voucherData = vouchersRes?.data || vouchersRes || [];
      setVouchers(voucherData);
      setVoucherPage(vouchersRes?.page || 1);
      setVoucherTotal(vouchersRes?.total || voucherData.length || 0);

      await Promise.all([
        loadPartnerApps(false),
        loadGuideApps(false),
      ]);

      if (errors.length) toast.error(errors[0]);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalUsers = users?.total || users?.length || 0;
    const pendingApps = (partners?.length || 0) + (guides?.length || 0);
    const pendingWithdraw = withdraws?.length || 0;
    const activePartners = partners?.filter((p) => (p.trang_thai || '').includes('approved')).length || 0;
    return [
      { title: 'Người dùng', value: totalUsers, icon: 'group', chip: '+12%' },
      { title: 'Hồ sơ chờ duyệt', value: pendingApps, icon: 'pending_actions', chip: 'Cần xử lý' },
      { title: 'Rút tiền chờ', value: pendingWithdraw, icon: 'account_balance_wallet', chip: 'Ưu tiên' },
      { title: 'Đối tác đang hoạt động', value: activePartners, icon: 'storefront', chip: '+5%' },
    ];
  }, [guides?.length, partners, users?.length, withdraws?.length]);

  const voucherStats = useMemo(() => {
    const total = voucherTotal || vouchers.length || 0;
    const active = vouchers.filter((v) => (v.trang_thai || '').toLowerCase().includes('active')).length;
    const used = vouchers.reduce((acc, v) => acc + (v.da_dung || v.used_count || 0), 0);
    return { total, active, used };
  }, [voucherTotal, vouchers]);

  const handlePartner = async (id, action) => {
    setProcessing((prev) => ({ ...prev, [`partner-${id}`]: true }));
    try {
      await updatePartnerApplication(id, { status: action });
      setPartners((prev) => prev.filter((p) => p.id !== id && p.ma_doi_tac !== id));
      toast.success(action === 'approved' ? 'Đã duyệt đối tác' : 'Đã từ chối đối tác');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được');
    }
    setProcessing((prev) => ({ ...prev, [`partner-${id}`]: false }));
  };

  const handleGuide = async (id, action) => {
    setProcessing((prev) => ({ ...prev, [`guide-${id}`]: true }));
    try {
      await updateGuideApplication(id, { status: action });
      setGuides((prev) => prev.filter((g) => g.id !== id && g.ma_guide !== id && g.ma_ho_so !== id));
      toast.success(action === 'approved' ? 'Đã duyệt hướng dẫn viên' : 'Đã từ chối hồ sơ');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được');
    }
    setProcessing((prev) => ({ ...prev, [`guide-${id}`]: false }));
  };

  const handleToggleUser = async (id, status) => {
    setProcessing((prev) => ({ ...prev, [`user-${id}`]: true }));
    try {
      if (status === 'banned') await lockUser(id);
      else await unlockUser(id);
      await loadUsersAdmin(userPage);
      toast.success(status === 'banned' ? 'Đã khóa user' : 'Đã mở khóa user');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không cập nhật được user');
    }
    setProcessing((prev) => ({ ...prev, [`user-${id}`]: false }));
  };

  const handleWithdraw = async (id, action) => {
    setProcessing((prev) => ({ ...prev, [`withdraw-${id}`]: true }));
    try {
      await reviewWithdrawRequest(id, { action });
      setWithdraws((prev) => prev.filter((w) => w.id !== id));
      toast.success(action === 'approve' ? 'Đã duyệt rút tiền' : 'Đã từ chối rút tiền');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được yêu cầu');
    }
    setProcessing((prev) => ({ ...prev, [`withdraw-${id}`]: false }));
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!voucherForm.code?.trim() || !voucherForm.tieu_de?.trim()) {
      toast.error('Nhập mã voucher và tên chương trình');
      return;
    }
    if (!voucherForm.apply_all && selectedUserIds.length === 0) {
      toast.error('Chọn ít nhất 1 user để áp dụng voucher');
      return;
    }
    setVoucherLoading(true);
    try {
      const createRes = await createVoucher({
        code: voucherForm.code.trim(),
        tieu_de: voucherForm.tieu_de.trim(),
        mo_ta: voucherForm.mo_ta || '',
        giam_phan_tram: Number(voucherForm.giam_phan_tram || 0),
        giam_toi_da: Number(voucherForm.giam_toi_da || 0),
        ngay_bat_dau: voucherForm.ngay_bat_dau || null,
        ngay_ket_thuc: voucherForm.ngay_ket_thuc || null,
        apply_all: voucherForm.apply_all,
      });
      const voucherId = createRes?.voucher?.ma_voucher || createRes?.ma_voucher || createRes?.id;
      if (!voucherForm.apply_all && voucherId) {
        await assignVoucherBulk(voucherId, { apply_all: false, user_ids: selectedUserIds });
      }
      toast.success('Đã tạo voucher');
      setVoucherForm({
        code: '',
        tieu_de: '',
        mo_ta: '',
        giam_phan_tram: 10,
        giam_toi_da: 100000,
        ngay_bat_dau: '',
        ngay_ket_thuc: '',
        apply_all: true,
      });
      setSelectedUserIds([]);
      await loadVouchers(1, false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tạo được voucher');
    }
    setVoucherLoading(false);
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  };

  const handlePlaceSubmit = async (e) => {
    e.preventDefault();
    if (!placeForm.ten_dia_diem?.trim() || !placeForm.ma_tinh || !placeForm.dia_chi?.trim()) {
      toast.error('Vui lòng nhập đầy đủ: tên di sản, tỉnh/thành, địa chỉ');
      return;
    }
    setPlaceLoading(true);
    try {
      const useFormData = placeForm.anh_file;
      let payload;
      if (useFormData) {
        const fd = new FormData();
        Object.entries(placeForm).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') {
            if (k === 'anh_file') {
              fd.append('anh_file', v);
            } else {
              fd.append(k, v);
            }
          }
        });
        payload = fd;
      } else {
        payload = {
          ten_dia_diem: placeForm.ten_dia_diem,
          ma_tinh: placeForm.ma_tinh,
          mo_ta: placeForm.mo_ta || null,
          dia_chi: placeForm.dia_chi || null,
          toado_lat: placeForm.toado_lat || null,
          toado_lng: placeForm.toado_lng || null,
          ma_loai: placeForm.ma_loai || null,
          anh: placeForm.anh || null,
        };
      }

      if (editingPlace) {
        await updatePlace(editingPlace, payload);
        toast.success('Đã cập nhật di sản');
      } else {
        await createPlace(payload);
        toast.success('Đã thêm di sản');
      }
      await loadPlaces(false);
      setPlaceForm({
        ten_dia_diem: '',
        ma_tinh: '',
        mo_ta: '',
        dia_chi: '',
        toado_lat: '',
        toado_lng: '',
        ma_loai: '',
        anh: '',
        anh_file: null,
      });
      setEditingPlace(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được di sản');
    }
    setPlaceLoading(false);
  };

  const handleEditPlace = (place) => {
    const placeId = place.id || place.ma_dia_diem;
    setEditingPlace(placeId);
    setPlaceForm({
      ten_dia_diem: place.ten_dia_diem || place.ten || '',
      ma_tinh: place.ma_tinh || '',
      mo_ta: place.mo_ta || '',
      dia_chi: place.dia_chi || '',
      toado_lat: place.toado_lat || '',
      toado_lng: place.toado_lng || '',
      ma_loai: place.ma_loai || '',
      anh: place.anh || '',
      anh_file: null,
    });
    if (placeFormRef?.current) {
      placeFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeletePlace = async (id) => {
    if (!window.confirm('Xóa di sản này?')) return;
    setPlaceLoading(true);
    try {
      await deletePlace(id);
      setPlaces((prev) => prev.filter((p) => (p.id || p.ma_dia_diem) !== id));
      toast.success('Đã xóa di sản');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xóa được di sản');
    }
    setPlaceLoading(false);
  };

  return (
    <PageShell className="bg-background-light min-h-screen px-3 md:px-6 py-6">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <motion.div {...fadeInUp(0)}>
          <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-[#dbe6df] shadow-sm rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">dashboard</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#608a6e] m-0">Admin Portal</p>
                <h1 className="text-2xl font-bold m-0 text-[#111813]">Dashboard quản trị</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                className="border border-slate-200 bg-white text-[#111813] hover:bg-slate-50"
                onClick={() => toast.success('Tải xuống CSV (giả lập)')}
              >
                <span className="material-symbols-outlined text-[18px]">download</span>Tải báo cáo
              </Button>
              <Button
                type="button"
                className="bg-[#111813] text-white hover:-translate-y-0 shadow-md"
                onClick={() => toast.success('Đã lưu cấu hình (giả lập)')}
              >
                <span className="material-symbols-outlined text-[18px]">save</span>Lưu thay đổi
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" {...staggerContainer(0.05, 0.05)}>
          {stats.map((s, idx) => (
            <motion.div key={s.title} {...fadeInUp(idx * 0.02)}>
              <Card className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-[#dbe6df] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-slate-100 text-[#111813] rounded-lg">
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-0">{s.chip}</Badge>
                </div>
                <p className="text-sm text-[#608a6e]">{s.title}</p>
                <p className="text-2xl font-bold text-[#111813]">{s.value}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" {...staggerContainer(0.06, 0.05)}>
          <motion.div {...fadeInUp(0.05)} className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-[#dbe6df] shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between p-5 border-b border-[#f0f5f1] gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#111813] m-0">Hồ sơ chờ duyệt</h3>
                <p className="text-sm text-[#608a6e] m-0">Đối tác và hướng dẫn viên mới</p>
              </div>
              <Badge variant="info">{(partners.length || 0) + (guides.length || 0)} hồ sơ</Badge>
            </div>
            <Tabs
              value={appTab}
              onValueChange={(val) => {
                setAppTab(val);
                if (val === 'partner') loadPartnerApps();
                else loadGuideApps();
              }}
            >
              <TabsList className="relative flex border-b border-[#f0f5f1] px-5 gap-6">
                <TabsTrigger tabKey="partner">{`Đối tác (${partners.length})`}</TabsTrigger>
                <TabsTrigger tabKey="guide">{`Hướng dẫn viên (${guides.length})`}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="divide-y divide-[#f0f5f1]">
              {appLoading && <p className="text-sm text-[#608a6e] px-4 py-3">Đang tải hồ sơ...</p>}

              {appTab === 'partner' &&
                partners.map((p) => {
                  const id = p.id || p.ma_doi_tac;
                  return (
                    <div key={id} className="flex items-center gap-4 p-4 hover:bg-[#f8faf9] transition-colors">
                      <div
                        className="size-12 rounded-lg flex items-center justify-center text-primary font-bold border border-[#e8f0eb]"
                        style={{ background: avatarColor(p.ten_cong_ty || '') }}
                      >
                        {p.ten_cong_ty?.slice(0, 2)?.toUpperCase() || 'DT'}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#111813] truncate m-0">{p.ten_cong_ty || 'Đối tác mới'}</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {p.nganh_nghe || p.mo_ta ? (p.nganh_nghe || 'Đối tác') : 'Đối tác'}
                          </span>
                        </div>
                        <p className="text-xs text-[#608a6e] m-0">
                          <span className="material-symbols-outlined text-[16px] align-middle mr-1 text-[#9aa8a0]">calendar_today</span>
                          Đăng ký: {p.ngay_dang_ky?.slice(0, 10) || '—'}
                        </p>
                        <p className="text-xs text-[#608a6e] m-0">MST: {p.ma_so_thue || '—'} • Email: {p.email_cong_ty || p.email || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="size-9 rounded-full bg-green-50 text-green-700 flex items-center justify-center border border-green-100"
                          onClick={() => handlePartner(id, 'approved')}
                          disabled={processing[`partner-${id}`]}
                          aria-label="Duyệt đối tác"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                        <button
                          type="button"
                          className="size-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100"
                          onClick={() => handlePartner(id, 'rejected')}
                          disabled={processing[`partner-${id}`]}
                          aria-label="Từ chối đối tác"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                        <button
                          type="button"
                          className="size-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200"
                          onClick={() => toast('Xem chi tiết (sẽ bổ sung)')}
                          aria-label="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

              {appTab === 'guide' &&
                guides.map((g) => {
                  const id = g.id || g.ma_guide || g.ma_ho_so;
                  return (
                    <div key={id} className="flex items-center gap-4 p-4 hover:bg-[#f8faf9] transition-colors">
                      <div
                        className="size-12 rounded-full flex items-center justify-center text-primary font-bold border border-[#e8f0eb]"
                        style={{ background: avatarColor(g.ho_ten || '') }}
                      >
                        {g.ho_ten?.slice(0, 1)?.toUpperCase() || 'G'}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#111813] truncate m-0">{g.ho_ten || 'Guide mới'}</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                            {g.chuyen_mon || 'Freelance'}
                          </span>
                        </div>
                        <p className="text-xs text-[#608a6e] m-0">
                          <span className="material-symbols-outlined text-[16px] align-middle mr-1 text-[#9aa8a0]">calendar_today</span>
                          Đăng ký: {g.ngay_dang_ky?.slice(0, 10) || '—'}
                        </p>
                        <p className="text-xs text-[#608a6e] m-0 line-clamp-2">{g.gioi_thieu || 'Chưa có giới thiệu'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="size-9 rounded-full bg-green-50 text-green-700 flex items-center justify-center border border-green-100"
                          onClick={() => handleGuide(id, 'approved')}
                          disabled={processing[`guide-${id}`]}
                          aria-label="Duyệt hướng dẫn viên"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                        <button
                          type="button"
                          className="size-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100"
                          onClick={() => handleGuide(id, 'rejected')}
                          disabled={processing[`guide-${id}`]}
                          aria-label="Từ chối hướng dẫn viên"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                        <button
                          type="button"
                          className="size-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200"
                          onClick={() => toast('Xem chi tiết (sẽ bổ sung)')}
                          aria-label="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

              {!loading && appTab === 'partner' && partners.length === 0 && (
                <p className="text-sm text-[#608a6e] px-4 py-3">Không có hồ sơ đối tác chờ duyệt.</p>
              )}
              {!loading && appTab === 'guide' && guides.length === 0 && (
                <p className="text-sm text-[#608a6e] px-4 py-3">Không có hồ sơ hướng dẫn viên chờ duyệt.</p>
              )}
            </div>
          </motion.div>

          <motion.div {...fadeInUp(0.08)} className="flex flex-col gap-6">
            <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm p-5">
              <h3 className="text-base font-bold text-[#111813] mb-4">Quản lý nội dung nhanh</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#f0f5f1] hover:border-primary/50 hover:bg-[#f0f5f1] transition-all text-left"
                  onClick={() => placeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ boxShadow: 'none' }}
                >
                  <div className="bg-primary/20 p-2 rounded-lg text-green-800">
                    <span className="material-symbols-outlined">add_location_alt</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111813] m-0">Thêm Di sản mới</p>
                    <p className="text-xs text-[#608a6e] m-0">Tạo địa điểm du lịch</p>
                  </div>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#f0f5f1] hover:border-primary/50 hover:bg-[#f0f5f1] transition-all text-left"
                  onClick={() => toast.success('Đi tới thêm Đặc sản (giả lập)')}
                  style={{ boxShadow: 'none' }}
                >
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-700">
                    <span className="material-symbols-outlined">ramen_dining</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111813] m-0">Thêm Đặc sản</p>
                    <p className="text-xs text-[#608a6e] m-0">Món ăn, làng nghề</p>
                  </div>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#f0f5f1] hover:border-primary/50 hover:bg-[#f0f5f1] transition-all text-left"
                  onClick={() => toast.success('Đi tới quản lý Lễ hội (giả lập)')}
                  style={{ boxShadow: 'none' }}
                >
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                    <span className="material-symbols-outlined">festival</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111813] m-0">Quản lý Lễ hội</p>
                    <p className="text-xs text-[#608a6e] m-0">Sự kiện văn hóa</p>
                  </div>
                </button>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#111813] m-0">Duyệt rút tiền (Guide/Partner)</h3>
                  <p className="text-sm text-[#608a6e] m-0">Xử lý các yêu cầu rút từ đối tác và hướng dẫn viên</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{withdraws.length} yêu cầu</Badge>
                  <Button type="button" variant="ghost" size="sm" onClick={() => listWithdrawRequests().then((res) => setWithdraws(res?.data || res || [])).catch(() => toast.error('Không tải được'))}>
                    Tải lại
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {withdraws.map((w) => {
                  const role = w.vai_tro || w.role || w.type || w.service_type || 'user';
                  return (
                    <div key={w.id} className="flex items-start justify-between border border-[#f0f5f1] rounded-lg p-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-bold text-[#111813] m-0 truncate">{w.user_name || w.email || 'Người dùng'}</p>
                        <p className="text-xs text-[#608a6e] m-0">
                          Số tiền: {Number(w.so_tien || 0).toLocaleString('vi-VN')} đ • Vai trò: <span className="capitalize">{role}</span>
                        </p>
                        {w.noi_dung && <p className="text-xs text-[#608a6e] m-0 line-clamp-2">Ghi chú: {w.noi_dung}</p>}
                        {w.created_at && <p className="text-xs text-[#9aa8a0] m-0">Gửi: {w.created_at?.slice(0, 16)}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="bg-green-50 text-green-700"
                          onClick={() => handleWithdraw(w.id, 'approve')}
                          disabled={processing[`withdraw-${w.id}`]}
                        >
                          Duyệt
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="bg-red-50 text-red-700"
                          onClick={() => handleWithdraw(w.id, 'reject')}
                          disabled={processing[`withdraw-${w.id}`]}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {!loading && withdraws.length === 0 && <p className="text-sm text-[#608a6e]">Không có yêu cầu rút tiền.</p>}
              </div>
            </Card>

            <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm p-5">
              <h3 className="text-base font-bold text-[#111813] mb-4">Hoạt động gần đây</h3>
              <div className="flex flex-col gap-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#f0f5f1]">
                {[
                  { icon: 'person_add', color: 'bg-blue-100 text-blue-600', text: 'Thành viên mới vừa đăng ký', time: '5 phút trước' },
                  { icon: 'confirmation_number', color: 'bg-green-100 text-green-600', text: 'Booking mới được xác nhận', time: '25 phút trước' },
                  { icon: 'pin_drop', color: 'bg-orange-100 text-orange-600', text: 'Có check-in mới ở Hoàng Thành Huế', time: '1 giờ trước' },
                  { icon: 'account_balance_wallet', color: 'bg-purple-100 text-purple-600', text: 'Yêu cầu rút tiền 2.000.000đ', time: '3 giờ trước' },
                ].map((item, idx) => (
                  <div key={item.text} className="flex gap-3 relative z-0">
                    <div className={`size-8 rounded-full ${item.color} flex items-center justify-center shrink-0 border-4 border-white z-10`}>
                      <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm text-[#111813] m-0">{item.text}</p>
                      <span className="text-xs text-[#608a6e] mt-0.5">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <div className="px-4 py-3 text-center text-sm text-[#608a6e] bg-[#f8fbf9] border-t border-[#f0f5f1] rounded-b-xl">
            <button
              type="button"
              className="text-[#4b7f5f] font-semibold hover:text-primary bg-transparent border-none"
              onClick={() => {
                appTab === 'partner' ? loadPartnerApps() : loadGuideApps();
              }}
            >
              Tải thêm hồ sơ...
            </button>
          </div>
        </motion.div>

        <motion.div {...fadeInUp(0.13)}>
          <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#111813] m-0">Quản lý User / Partner / Guide</h3>
                <p className="text-sm text-[#608a6e] m-0">Xem nhanh danh sách đang hoạt động</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-slate-100 text-text">User: {userTotal}</Badge>
                <Badge className="bg-green-50 text-green-700">Partner: {partnerTotal}</Badge>
                <Badge className="bg-purple-50 text-purple-700">Guide: {guideTotal}</Badge>
              </div>
            </div>
            <Tabs value={adminTab} onValueChange={setAdminTab}>
              <TabsList className="relative flex border-b border-[#f0f5f1] px-1 gap-4">
                <TabsTrigger tabKey="users">{`User (${userTotal})`}</TabsTrigger>
                <TabsTrigger tabKey="partners">{`Partner (${partnerTotal})`}</TabsTrigger>
                <TabsTrigger tabKey="guides">{`Guide (${guideTotal})`}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (adminTab === 'users') loadUsersAdmin(1);
                  if (adminTab === 'partners') loadPartnersAdmin(1);
                  if (adminTab === 'guides') loadGuidesAdmin(1);
                }}
              >
                Tải lại
              </Button>
              <span className="text-sm text-[#608a6e]">
                Trang {adminTab === 'users' ? userPage : adminTab === 'partners' ? partnerPage : guidePage}
                /{Math.max(1, Math.ceil(((adminTab === 'users' ? userTotal : adminTab === 'partners' ? partnerTotal : guideTotal) || 0) /
                  (adminTab === 'users' ? USER_LIMIT : adminTab === 'partners' ? PARTNER_LIMIT : GUIDE_LIMIT)))}
              </span>
            </div>
            <div className="max-h-[360px] overflow-auto divide-y divide-[#f0f5f1]">
              {adminTab === 'users' &&
                (userList.length ? userList : []).map((u) => (
                  <div key={u.ma_nguoi_dung || u.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111813] m-0 truncate">{u.ho_ten || u.email}</p>
                      <p className="text-xs text-[#608a6e] m-0 truncate">{u.email}</p>
                      <Badge className="bg-slate-100 text-text">{u.vai_tro}</Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleUser(u.ma_nguoi_dung || u.id, u.trang_thai === 'banned' ? 'active' : 'banned')}
                      disabled={processing[`user-${u.ma_nguoi_dung || u.id}`]}
                      className={u.trang_thai === 'banned' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                    >
                      {u.trang_thai === 'banned' ? 'Mở khóa' : 'Khóa'}
                    </Button>
                  </div>
                ))}
              {adminTab === 'partners' &&
                (partnerList.length ? partnerList : []).map((p) => (
                  <div key={p.ma_partner || p.id} className="py-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#111813] m-0 truncate">{p.ten_cong_ty || p.ho_ten || 'Đối tác'}</p>
                      <Badge className="bg-green-50 text-green-700">{p.trang_thai || 'active'}</Badge>
                    </div>
                    <p className="text-xs text-[#608a6e] m-0 truncate">{p.email_cong_ty || p.email}</p>
                    <p className="text-xs text-[#608a6e] m-0">MST: {p.ma_so_thue || '—'}</p>
                  </div>
                ))}
              {adminTab === 'guides' &&
                (guideList.length ? guideList : []).map((g) => (
                  <div key={g.ma_guide || g.id} className="py-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#111813] m-0 truncate">{g.ho_ten || 'Guide'}</p>
                      <Badge className="bg-purple-50 text-purple-700">{g.trang_thai || 'active'}</Badge>
                    </div>
                    <p className="text-xs text-[#608a6e] m-0 truncate">{g.email}</p>
                    <p className="text-xs text-[#608a6e] m-0">Chuyên môn: {g.chuyen_mon || '—'}</p>
                  </div>
                ))}
              {adminTab === 'users' && userList.length === 0 && <p className="text-sm text-[#608a6e] py-3">Không có dữ liệu.</p>}
              {adminTab === 'partners' && partnerList.length === 0 && <p className="text-sm text-[#608a6e] py-3">Không có dữ liệu.</p>}
              {adminTab === 'guides' && guideList.length === 0 && <p className="text-sm text-[#608a6e] py-3">Không có dữ liệu.</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  (adminTab === 'users' && userPage <= 1) ||
                  (adminTab === 'partners' && partnerPage <= 1) ||
                  (adminTab === 'guides' && guidePage <= 1)
                }
                onClick={() => {
                  if (adminTab === 'users') loadUsersAdmin(userPage - 1);
                  if (adminTab === 'partners') loadPartnersAdmin(partnerPage - 1);
                  if (adminTab === 'guides') loadGuidesAdmin(guidePage - 1);
                }}
              >
                ← Trước
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  (adminTab === 'users' && userPage >= Math.ceil((userTotal || 0) / USER_LIMIT)) ||
                  (adminTab === 'partners' && partnerPage >= Math.ceil((partnerTotal || 0) / PARTNER_LIMIT)) ||
                  (adminTab === 'guides' && guidePage >= Math.ceil((guideTotal || 0) / GUIDE_LIMIT))
                }
                onClick={() => {
                  if (adminTab === 'users') loadUsersAdmin(userPage + 1);
                  if (adminTab === 'partners') loadPartnersAdmin(partnerPage + 1);
                  if (adminTab === 'guides') loadGuidesAdmin(guidePage + 1);
                }}
              >
                Sau →
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div {...fadeInUp(0.14)}>
          <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#111813] m-0">Quản lý Voucher</h3>
                <p className="text-sm text-[#608a6e] m-0">Tạo mã khuyến mãi và xem danh sách hiện có</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Badge className="bg-slate-100 text-text">Tổng: {voucherStats.total}</Badge>
                <Badge className="bg-green-50 text-green-700">Đang hoạt động: {voucherStats.active}</Badge>
                <Badge className="bg-orange-50 text-orange-700">Đã dùng: {voucherStats.used}</Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-slate-50 border-slate-100 shadow-sm p-4 space-y-3">
                <h4 className="text-sm font-semibold text-[#111813] m-0">Tạo voucher mới</h4>
                <form className="grid gap-3" onSubmit={handleCreateVoucher}>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-[#111813]">
                    Tên chương trình
                    <input
                      className="rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="VD: Khuyến mãi hè 2025"
                      value={voucherForm.tieu_de}
                      onChange={(e) => setVoucherForm({ ...voucherForm, tieu_de: e.target.value })}
                      required
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#111813]">
                      Mã voucher
                      <input
                        className="rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="SUMMER25"
                        value={voucherForm.code}
                        onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                        required
                      />
                    </label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <label className="flex flex-col gap-1 text-sm font-semibold text-[#111813]">
                        Giảm (%)
                        <input
                          type="number"
                          className="rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={voucherForm.giam_phan_tram}
                          min={0}
                          max={100}
                          onChange={(e) => setVoucherForm({ ...voucherForm, giam_phan_tram: e.target.value })}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-semibold text-[#111813]">
                        Tối đa (đ)
                        <input
                          type="number"
                          className="rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={voucherForm.giam_toi_da}
                          min={0}
                          onChange={(e) => setVoucherForm({ ...voucherForm, giam_toi_da: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#111813]">
                      Ngày bắt đầu
                      <input
                        type="date"
                        className="rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={voucherForm.ngay_bat_dau}
                        onChange={(e) => setVoucherForm({ ...voucherForm, ngay_bat_dau: e.target.value })}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-[#111813]">
                      Ngày kết thúc
                      <input
                        type="date"
                        className="rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={voucherForm.ngay_ket_thuc}
                        onChange={(e) => setVoucherForm({ ...voucherForm, ngay_ket_thuc: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#111813]">
                    <input
                      type="checkbox"
                      checked={voucherForm.apply_all}
                      onChange={(e) => setVoucherForm({ ...voucherForm, apply_all: e.target.checked })}
                    />
                    Áp dụng cho tất cả khách hàng
                  </label>
                  {!voucherForm.apply_all && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[#111813] m-0">Chọn user áp dụng</p>
                      <div className="max-h-40 overflow-auto border border-[#e8f0eb] rounded-lg divide-y divide-[#f0f5f1] bg-white">
                        {userList.map((u) => {
                          const id = u.ma_nguoi_dung || u.id;
                          return (
                            <label key={id} className="flex items-center gap-2 px-3 py-2 text-sm text-[#111813]">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(id)}
                                onChange={() => toggleSelectUser(id)}
                              />
                              <div className="min-w-0">
                                <p className="m-0 truncate">{u.ho_ten || u.email}</p>
                                <span className="text-xs text-[#608a6e]">{u.email}</span>
                              </div>
                            </label>
                          );
                        })}
                        {userList.length === 0 && (
                          <p className="text-xs text-[#608a6e] px-3 py-2 m-0">Không có user để chọn</p>
                        )}
                      </div>
                      <p className="text-xs text-[#608a6e] m-0">Đang chọn {selectedUserIds.length} user.</p>
                    </div>
                  )}
                  <label className="flex flex-col gap-1 text-sm font-semibold text-[#111813]">
                    Mô tả (tuỳ chọn)
                    <textarea
                      rows={2}
                      className="rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Mô tả ngắn"
                      value={voucherForm.mo_ta}
                      onChange={(e) => setVoucherForm({ ...voucherForm, mo_ta: e.target.value })}
                    />
                  </label>
                  <Button type="submit" className="justify-center" disabled={voucherLoading}>
                    Tạo voucher
                  </Button>
                </form>
              </Card>

              <Card className="border-slate-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#111813] m-0">Danh sách voucher</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => loadVouchers(1)}
                    disabled={voucherLoading}
                  >
                    Tải lại
                  </Button>
                </div>
                <div className="divide-y divide-[#f0f5f1] max-h-[360px] overflow-auto pr-2">
                  {voucherLoading && <p className="text-sm text-[#608a6e] py-2">Đang tải...</p>}
                  {!voucherLoading && vouchers.length === 0 && <p className="text-sm text-[#608a6e] py-2">Chưa có voucher.</p>}
                  {!voucherLoading &&
                    vouchers.map((v) => (
                      <div key={v.ma_voucher || v.id || v.code} className="py-3 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="info">#{v.ma_voucher || v.id || '—'}</Badge>
                          <strong className="text-[#111813]">{v.code || v.ma_voucher}</strong>
                          {(v.trang_thai || v.status) && (
                            <Badge className="bg-green-50 text-green-700 border-0">
                              {v.trang_thai || v.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#111813] m-0">{v.tieu_de || v.ten_chuong_trinh || 'Chương trình'}</p>
                        <p className="text-xs text-[#608a6e] m-0">
                          Giảm: {v.giam_phan_tram ? `-${v.giam_phan_tram}%` : ''}{v.giam_toi_da ? ` • tối đa ${Number(v.giam_toi_da).toLocaleString('vi-VN')}đ` : ''}
                        </p>
                        {(v.ngay_bat_dau || v.ngay_ket_thuc) && (
                          <p className="text-xs text-[#608a6e] m-0">
                            HSD: {v.ngay_bat_dau?.slice(0, 10) || '—'} - {v.ngay_ket_thuc?.slice(0, 10) || '—'}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
                <div className="flex items-center justify-between text-sm text-[#608a6e]">
                  <span>
                    Tổng {voucherTotal || 0} voucher • Trang {voucherPage}/{Math.max(1, Math.ceil((voucherTotal || 0) / VOUCHER_LIMIT))}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => loadVouchers(Math.max(1, voucherPage - 1))}
                      disabled={voucherPage <= 1 || voucherLoading}
                    >
                      ← Trước
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => loadVouchers(voucherPage + 1)}
                      disabled={voucherPage >= Math.ceil((voucherTotal || 0) / VOUCHER_LIMIT) || voucherLoading}
                    >
                      Sau →
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </motion.div>

        <motion.div {...fadeInUp(0.12)} ref={placeFormRef}>
          <Card className="bg-white rounded-xl border border-[#dbe6df] shadow-sm p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#111813] m-0">Quản lý Di sản</h3>
                <p className="text-sm text-[#608a6e] m-0">Thêm mới, chỉnh sửa hoặc xóa địa điểm du lịch</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">
                  {places.length || 0} mục (Trang {placePage}/{Math.max(1, Math.ceil((placeTotal || 0) / PLACE_LIMIT))})
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    loadPlaces(1);
                    loadProvinces();
                    loadPlaceTypes();
                  }}
                >
                  Tải lại
                </Button>
              </div>
            </div>

            <form className="grid gap-3 md:grid-cols-3" onSubmit={handlePlaceSubmit}>
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                Tên di sản
                <input
                  className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ví dụ: Phố cổ Hội An"
                  value={placeForm.ten_dia_diem}
                  onChange={(e) => setPlaceForm({ ...placeForm, ten_dia_diem: e.target.value })}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                Tỉnh / Thành
                <select
                  className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={placeForm.ma_tinh}
                  onChange={(e) => setPlaceForm({ ...placeForm, ma_tinh: e.target.value })}
                  required
                >
                  <option value="">-- Chọn --</option>
                  {provinces.map((p) => (
                    <option key={p.ma_tinh || p.id} value={p.ma_tinh || p.id}>
                      {p.ten_tinh || p.ten || p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                Loại địa điểm
                <select
                  className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={placeForm.ma_loai}
                  onChange={(e) => setPlaceForm({ ...placeForm, ma_loai: e.target.value })}
                >
                  <option value="">-- Chọn --</option>
                  {placeTypes.map((t) => (
                    <option key={t.ma_loai || t.id} value={t.ma_loai || t.id}>
                      {t.ten_loai || t.ten}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813] md:col-span-2">
                Địa chỉ
                <input
                  className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Số nhà, đường, phường/xã..."
                  value={placeForm.dia_chi}
                  onChange={(e) => setPlaceForm({ ...placeForm, dia_chi: e.target.value })}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3 md:col-span-3">
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                  Tọa độ (lat)
                  <input
                    className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="10.7769"
                    value={placeForm.toado_lat}
                    onChange={(e) => setPlaceForm({ ...placeForm, toado_lat: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                  Tọa độ (lng)
                  <input
                    className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="106.6953"
                    value={placeForm.toado_lng}
                    onChange={(e) => setPlaceForm({ ...placeForm, toado_lng: e.target.value })}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                Ảnh (URL)
                <input
                  className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://..."
                  value={placeForm.anh}
                  onChange={(e) => setPlaceForm({ ...placeForm, anh: e.target.value })}
                  disabled={!!placeForm.anh_file}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813]">
                Hoặc upload ảnh
                <input
                  type="file"
                  accept="image/*"
                  className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                  onChange={(e) => setPlaceForm({ ...placeForm, anh_file: e.target.files?.[0] || null, anh: '' })}
                />
                {placeForm.anh_file && <span className="text-xs text-[#608a6e]">Đã chọn: {placeForm.anh_file.name}</span>}
              </label>
              <div className="flex items-end md:justify-end">
                <Button type="submit" className="w-full justify-center md:w-auto" disabled={placeLoading}>
                  {editingPlace ? 'Cập nhật' : 'Thêm di sản'}
                </Button>
              </div>
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#111813] md:col-span-3">
                Mô tả (tuỳ chọn)
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-[#dbe6df] px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Thông tin ngắn gọn về di sản"
                  value={placeForm.mo_ta}
                  onChange={(e) => setPlaceForm({ ...placeForm, mo_ta: e.target.value })}
                />
              </label>
              {editingPlace && (
                <div className="md:col-span-3 text-xs text-[#608a6e]">
                  Đang chỉnh sửa di sản #{editingPlace}. Nhấn "Cập nhật" để lưu hoặc xoá để bỏ.
                </div>
              )}
            </form>

            <div className="divide-y divide-[#f0f5f1]">
              {placeLoading && <p className="text-sm text-[#608a6e] py-2">Đang xử lý...</p>}
              {!placeLoading &&
                places.map((p) => {
                  const id = p.id || p.ma_dia_diem || p.maDiaDiem;
                  const provinceName =
                    p.ten_tinh ||
                    provinces.find((prov) => (prov.ma_tinh || prov.id) === (p.ma_tinh || p.maTinh))?.ten_tinh ||
                    '—';
                  const typeName =
                    p.ten_loai ||
                    placeTypes.find((t) => (t.ma_loai || t.id) === (p.ma_loai || p.maLoai))?.ten_loai ||
                    '';
                  return (
                    <div key={id || p.ten_dia_diem} className="flex items-start gap-3 py-3">
                      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold border border-[#e8f0eb]">
                        {(p.ten_dia_diem || p.ten || 'DS').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-bold text-[#111813] m-0 truncate">{p.ten_dia_diem || p.ten || 'Di sản'}</p>
                        <p className="text-xs text-[#608a6e] m-0">Tỉnh: {provinceName}</p>
                        {typeName && <p className="text-xs text-[#608a6e] m-0">Loại: {typeName}</p>}
                        {p.mo_ta && <p className="text-xs text-[#608a6e] m-0 line-clamp-2">{p.mo_ta}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleEditPlace(p)}>
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="bg-red-50 text-red-700"
                          onClick={() => handleDeletePlace(id)}
                          disabled={placeLoading}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  );
                })}
              {!placeLoading && places.length === 0 && (
                <p className="text-sm text-[#608a6e] py-2">Chưa có di sản nào. Thêm mới để hiển thị tại đây.</p>
              )}
              <div className="flex items-center justify-between pt-3 text-sm text-[#608a6e]">
                <span>
                  Tổng {placeTotal || 0} mục • Trang {placePage}/{Math.max(1, Math.ceil((placeTotal || 0) / PLACE_LIMIT))}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => loadPlaces(Math.max(1, placePage - 1))}
                    disabled={placePage <= 1 || placeLoading}
                  >
                    ← Trước
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => loadPlaces(placePage + 1)}
                    disabled={placePage >= Math.ceil((placeTotal || 0) / PLACE_LIMIT) || placeLoading}
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default AdminDashboardPage;
