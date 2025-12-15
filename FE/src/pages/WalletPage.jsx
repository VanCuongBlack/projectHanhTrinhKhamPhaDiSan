import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { requestTopUp, requestWithdraw, getWalletHistory } from '../api/walletApi';
import { getMyCheckins, listMyVouchers } from '../api/communityApi';
import { useAuthStore } from '../store/authStore';
import PageShell from '../components/ui/PageShell';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { fadeInUp, staggerContainer } from '../lib/motion';

const ACTIONS = {
  deposit: {
    title: 'Nạp tiền',
    subtitle: 'Thanh toán qua VNPAY, cập nhật số dư ngay khi trả về.',
    cta: 'Nạp qua VNPAY',
  },
  withdraw: {
    title: 'Rút tiền',
    subtitle: 'Chỉ dành cho đối tác / hướng dẫn viên đã duyệt.',
    cta: 'Tạo yêu cầu rút',
  },
};

const MEMBERSHIP = [
  { key: 'member', name: 'Explorer', min: 0, max: 499 },
  { key: 'silver', name: 'Silver', min: 500, max: 999 },
  { key: 'gold', name: 'Gold Member', min: 1000, max: 1999 },
  { key: 'platinum', name: 'Platinum', min: 2000, max: Infinity },
];

const statusStyles = {
  thanh_cong: { label: 'Hoàn tất', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  cho_duyet: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  that_bai: { label: 'Thất bại', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const txVisual = (type = '') => {
  const key = type.toLowerCase();
  if (key.includes('nạp') || key.includes('nap') || key.includes('topup')) {
    return { icon: 'add_card', cls: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' };
  }
  if (key.includes('rút') || key.includes('rut') || key.includes('withdraw')) {
    return { icon: 'payments', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
  }
  if (key.includes('check') || key.includes('loyalty') || key.includes('điểm')) {
    return { icon: 'loyalty', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
  }
  return { icon: 'account_balance_wallet', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' };
};

const formatMoney = (value = 0, currency = 'VND', showSign = false) => {
  const amt = Number(value || 0);
  const base = Math.abs(amt).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
  const sign = amt < 0 ? '-' : showSign && amt > 0 ? '+' : '';
  return `${sign}${base} ${currency}`;
};

const normalizeTxAmount = (tx) => {
  const amt = Number(tx?.so_tien || 0);
  const type = (tx?.loai_giao_dich || '').toLowerCase();
  if (type.includes('thanh_toan') || type.includes('rut')) return -Math.abs(amt);
  return Math.abs(amt);
};

const WalletPage = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [action, setAction] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [wallet, setWallet] = useState({ so_du: 0, currency: 'VND', lich_su: [] });
  const [points, setPoints] = useState({ total: 0, checkins: 0 });
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [voucherTab, setVoucherTab] = useState('exchange');

  // Không chặn phía client theo vai_tro; backend sẽ kiểm tra thực tế partner/guide active.
  const isPartnerGuide = useMemo(
    () => user?.vai_tro === 'partner' || user?.vai_tro === 'guide',
    [user?.vai_tro]
  );

  const membership = useMemo(() => {
    const total = Number(points.total || 0);
    const current = MEMBERSHIP.reduce((acc, tier) => (total >= tier.min ? tier : acc), MEMBERSHIP[0]);
    const next = MEMBERSHIP.find((tier) => tier.min > current.min) || null;
    const progress = next ? Math.min(100, ((total - current.min) / (next.min - current.min)) * 100) : 100;
    return {
      current,
      next,
      progress,
      remaining: next ? Math.max(0, next.min - total) : 0,
      total,
    };
  }, [points.total]);

  const txs = wallet.lich_su || [];

  const loadData = async () => {
    setLoading(true);
    const errors = [];
    const safe = async (fn, fallback) => {
      try {
        return await fn();
      } catch (err) {
        errors.push(err.response?.data?.message || err.message || 'Không thể tải dữ liệu');
        return fallback;
      }
    };

    const [walletRes, checkinRes, voucherRes] = await Promise.all([
      safe(() => getWalletHistory(), { so_du: 0, currency: 'VND', lich_su: [] }),
      safe(() => getMyCheckins(), null),
      safe(() => listMyVouchers(), []),
    ]);

    setWallet(walletRes || { so_du: 0, currency: 'VND', lich_su: [] });
    if (checkinRes) {
      setPoints({
        total: checkinRes.points ?? 0,
        checkins: checkinRes.checkins?.length || 0,
      });
    }
    setVouchers(voucherRes || []);

    if (errors.length) {
      toast.error(errors[0]);
    }
    setLoading(false);
  };

  // Khởi tạo dữ liệu + lắng nghe localStorage (cross-tab)
  useEffect(() => {
    loadData();

    const onStorage = (e) => {
      if (e.key === 'vnpay-result' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.status === 'thanh_cong') {
            const amt = Number(data.amount || 0);
            toast.success(`Nạp ví thành công${amt ? ` ${formatMoney(amt, wallet.currency, true)}` : ''}`);
            setBanner({ type: 'success', message: 'Thanh toán VNPAY thành công', amount: amt });
          } else {
            toast.error(data.message || 'Thanh toán VNPAY thất bại');
            setBanner({ type: 'error', message: data.message || 'Thanh toán VNPAY thất bại' });
          }
        } catch {
          // ignore parse errors
        }
        loadData();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Xử lý query khi được redirect từ VNPay về
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (!status) return;

    const amountParam = params.get('amount');
    const message = params.get('message');

    if (status === 'thanh_cong') {
      const amt = Number(amountParam || 0);
      toast.success(`Nạp ví thành công${amt ? ` ${formatMoney(amt, wallet.currency, true)}` : ''}`);
      setBanner({ type: 'success', message: 'Thanh toán VNPAY thành công', amount: amt });
    } else {
      toast.error(message || 'Thanh toán VNPAY thất bại');
      setBanner({ type: 'error', message: message || 'Thanh toán VNPAY thất bại' });
    }

    loadData();
    localStorage.setItem('vnpay-result', JSON.stringify({ status, amount: amountParam, message, ts: Date.now() }));
    navigate('/wallet', { replace: true });
    if (window.opener) window.close();
  }, [location.search]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestTopUp({ so_tien: amt, noi_dung: note });
      toast.success('Tạo giao dịch nạp thành công');
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể nạp tiền');
    }
    setSubmitting(false);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    if (!accountNumber || !bank) {
      toast.error('Vui lòng nhập số tài khoản và ngân hàng thụ hưởng');
      return;
    }
    setSubmitting(true);
    try {
      await requestWithdraw({
        so_tien: amt,
        noi_dung: note,
        so_tai_khoan: accountNumber,
        ngan_hang: bank,
        chu_tai_khoan: accountName,
      });
      toast.success('Tạo yêu cầu rút thành công');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể rút tiền');
    }
    setSubmitting(false);
  };

  const actionMeta = ACTIONS[action];

  const switchAction = (key) => {
    setAction(key);
    const anchor = document.getElementById('wallet-action-card');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const redeemableVouchers = vouchers.filter((v) => !v.da_dung);
  const currentCurrency = wallet.currency || 'VND';

  const voucherThumb = (v, fallback) => {
    if (v?.anh) return v.anh;
    return fallback;
  };

  const sampleImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCeijmTbqqBJFhIvdOGVMHwXDDs2yuftU74OE1j0wDmGqAszENQL-UnS76TkBSkVWGEx6fpssaHE38rmLQbKieHRpbnKjooVLqI3E0DT_vSJ8pAVEuaCfqHdYdl_BRrol4vwkw80khntn31t-9PD21rKBWyfy0VEehEZBNDQnw0oLQSEVSf9k6dJjsKYSo52kIn-wn7AQrQF7g-ptf1Poj_IfnGhxuF0XKy8PqdPBrowHN5MSScES-MSu-aM6RzAcWNNH4zWykOu6I',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBm4sFSflyw5CM8djLq5qsTm7LZrDbo1MPPI_x53D8O_ztej5_WctQzG3EPh5j_l9x5mu89t06MDJZ_wh_DOQJV1rmdiunlJ_kgGWXg2fM1puQpyhYXUqpuOEAJPZyJ16Mm39yszRqij1PwfzktVNTOcUCC3XoSTEUKLwslCHpgPVy1fIHOyDvO2ecknigUJuj2KoX6GLZpUWt02C5_xaL_mqyK6kC6jUCYXTG4maZE9I4l-if4HBGYGy7U8NZiiU6nBXf42Zu1ung',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDVi83qgbeFdWPgRBjI-Xwyrvc4qpxqnDctvvJV5MkOdxtyL7h0myGuRdGRf-knPYHRja-i80RcYN5ivX9Oa-NS5rwSACYEr_pdWxqR-fthx2OMdTAgb48xIJri9ic0ubpCMn8jFsr9IYaQBZgmSpcghazWUNdMw68Sn4_I9CUn5ls4TKXCaJAEIF3rN2Uk-P6z3j1BtPNAwIr66jVERO44DEkRjDALrg7c5UZLGWUW3bvLv8SfZZMuP-D-3IZFRMuych_2Ck7-JKY',
  ];

  return (
    <PageShell className="app-container flex flex-col gap-6">
      <motion.div {...fadeInUp(0)} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black text-[#111813] tracking-[-0.033em]">Ví &amp; Tích điểm</h1>
          <p className="text-base text-[#608a6e]">Quản lý tài chính và đổi quà từ những chuyến đi của bạn.</p>
        </div>
      </motion.div>

      {banner && (
        <motion.div {...fadeInUp(0.02)}>
          <Card
            className={`flex items-center justify-between border ${
              banner.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <div>
              <strong>{banner.type === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại'}</strong>
              <p className="m-0 text-sm">{banner.message}</p>
            </div>
            {banner.amount ? <span className="text-sm font-semibold">{formatMoney(banner.amount, currentCurrency, true)}</span> : null}
          </Card>
        </motion.div>
      )}

      <motion.div className="grid grid-cols-1 lg:grid-cols-12 gap-6" {...staggerContainer(0.05, 0.04)}>
        <motion.div {...fadeInUp(0.05)} className="lg:col-span-7 flex flex-col gap-6">
          <Card className="bg-white dark:bg-[#1a2e22] rounded-2xl p-6 md:p-8 shadow-sm border border-[#e8f0eb] dark:border-[#2a4030] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[#608a6e] uppercase tracking-[0.08em]">Số dư khả dụng</span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl md:text-5xl font-black text-[#111813] tracking-tight">
                      {formatMoney(wallet.so_du, wallet.currency)}
                    </h2>
                  </div>
                  <p className="text-sm text-[#608a6e]">Sẵn sàng thanh toán tour và đặt hướng dẫn viên.</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge className="bg-[#f0f5f1] text-[#111813] border border-[#e8f0eb]">
                      {user?.ho_ten || user?.email || 'Khách'}
                    </Badge>
                    <Badge className="bg-[#f0f5f1] text-[#111813] border border-[#e8f0eb]">{currentCurrency}</Badge>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary/25 hover:shadow-lg hover:-translate-y-0.5"
                  onClick={() => switchAction('deposit')}
                >
                  <span className="material-symbols-outlined text-[20px]">add_card</span>
                  Nạp tiền
                </button>
                <button
                  type="button"
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary/25 hover:shadow-lg hover:-translate-y-0.5"
                  onClick={() => switchAction('withdraw')}
                >
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                  Rút tiền
                </button>
              </div>
            </div>
          </Card>

          <Card id="wallet-action-card" className="space-y-4 bg-white dark:bg-[#1a2e22] border border-[#e8f0eb] dark:border-[#2a4030] rounded-2xl p-6 md:p-7 shadow-sm">
            <header className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#608a6e]">{actionMeta.title}</p>
                <h3 className="text-lg font-semibold text-[#111813] dark:text-white m-0">{actionMeta.subtitle}</h3>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#f0f5f1] dark:bg-[#2a4030] rounded-lg text-xs font-semibold text-[#608a6e]">
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Đang chọn: {actionMeta.title}
              </div>
            </header>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={action === 'deposit' ? handleTopUp : handleWithdraw}>
              <InputField
                className="sm:col-span-2"
                label="Số tiền"
                type="number"
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền, ví dụ 500000"
                inputClassName="h-12 rounded-xl bg-white dark:bg-[#25382b] border-[#dbe6df] dark:border-[#2a4030] text-[#111813] dark:text-white"
              />
              <InputField
                className="sm:col-span-2"
                label="Ghi chú"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nội dung giao dịch (tuỳ chọn)"
                inputClassName="h-12 rounded-xl bg-white dark:bg-[#25382b] border-[#dbe6df] dark:border-[#2a4030] text-[#111813] dark:text-white"
              />
              {action === 'withdraw' && (
                <>
                  <InputField
                    label="Ngân hàng thụ hưởng"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Ví dụ: Vietcombank"
                    inputClassName="h-12 rounded-xl bg-white dark:bg-[#25382b] border-[#dbe6df] dark:border-[#2a4030] text-[#111813] dark:text-white"
                  />
                  <InputField
                    label="Số tài khoản"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Nhập số tài khoản ngân hàng"
                    inputClassName="h-12 rounded-xl bg-white dark:bg-[#25382b] border-[#dbe6df] dark:border-[#2a4030] text-[#111813] dark:text-white"
                  />
                  <InputField
                    className="sm:col-span-2"
                    label="Tên chủ tài khoản (tuỳ chọn)"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Tên chủ tài khoản"
                    inputClassName="h-12 rounded-xl bg-white dark:bg-[#25382b] border-[#dbe6df] dark:border-[#2a4030] text-[#111813] dark:text-white"
                  />
                  <div className="sm:col-span-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Chỉ đối tác / hướng dẫn viên active mới rút tiền. Vai trò hiện tại: {user?.vai_tro || 'user'} (backend kiểm tra).
                  </div>
                </>
              )}
              <div className="sm:col-span-2 flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full justify-center h-12 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] shadow-primary/25"
                >
                  {submitting ? 'Đang xử lý...' : actionMeta.cta}
                </Button>
                {action === 'deposit' && (
                  <p className="text-xs text-[#608a6e] text-center">Thanh toán VNPay mở ngay trên tab hiện tại.</p>
                )}
                {action === 'withdraw' && !isPartnerGuide && (
                  <p className="text-xs text-amber-700 text-center">Tài khoản chưa phải đối tác / hướng dẫn viên sẽ được kiểm tra thủ công.</p>
                )}
              </div>
            </form>
          </Card>

          <Card className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-sm border border-[#e8f0eb] dark:border-[#2a4030] flex flex-col">
            <div className="p-6 border-b border-[#f0f5f1] dark:border-[#2a4030] flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-lg text-[#111813] dark:text-white m-0">Lịch sử giao dịch</h3>
                <p className="text-sm text-[#608a6e]">Cập nhật trực tiếp từ API ví.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#f0f5f1] text-[#111813] border border-[#e8f0eb]">Tổng {txs.length}</Badge>
                <button
                  type="button"
                  className="text-sm font-semibold bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] px-3 py-1.5 rounded-lg shadow-sm shadow-primary/25 hover:shadow-md hover:-translate-y-0.5 transition"
                  onClick={() => toast('Sẽ thêm bộ lọc / xem tất cả.')}
                >
                  Xem tất cả
                </button>
              </div>
            </div>
            {loading ? (
              <div className="p-6 text-sm text-[#608a6e]">Đang tải...</div>
            ) : txs.length === 0 ? (
              <div className="p-6 text-sm text-[#608a6e]">Chưa có giao dịch.</div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-[#608a6e] uppercase border-b border-[#f0f5f1] dark:border-[#2a4030]">
                      <th className="px-6 py-4 font-semibold w-12" />
                      <th className="px-6 py-4 font-semibold">Mô tả</th>
                      <th className="px-6 py-4 font-semibold text-right">Số tiền</th>
                      <th className="px-6 py-4 font-semibold text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {txs.map((tx) => {
                      const visual = txVisual(tx.loai_giao_dich);
                      const status = statusStyles[tx.trang_thai] || { label: tx.trang_thai || 'Khác', cls: 'bg-slate-100 text-slate-700' };
                      const adjAmount = normalizeTxAmount(tx);
                      return (
                        <tr
                          key={tx.id}
                          className="group hover:bg-[#f9fbf9] dark:hover:bg-[#22362a] transition-colors border-b border-[#f0f5f1] dark:border-[#2a4030] last:border-0"
                        >
                          <td className="pl-6 py-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${visual.cls}`}>
                              <span className="material-symbols-outlined text-[20px]">{visual.icon}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-[#111813] dark:text-white">{tx.loai_giao_dich || 'Giao dịch ví'}</span>
                              <span className="text-xs text-[#608a6e]">{tx.thoi_gian}</span>
                              {tx.noi_dung && <span className="text-xs text-[#608a6e]">{tx.noi_dung}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#111813] dark:text-white">
                            <span className={Number(adjAmount) < 0 ? 'text-red-600' : 'text-primary'}>
                              {formatMoney(adjAmount, currentCurrency, true)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div {...fadeInUp(0.07)} className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-[#111813] to-[#24342a] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Điểm tích lũy</p>
                  <h3 className="text-3xl font-black text-primary">
                    {membership.total}{' '}
                    <span className="text-base font-normal text-white">pts</span>
                  </h3>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 px-3 py-1 rounded-full text-xs font-bold text-black uppercase tracking-wider shadow-lg">
                  {membership.current.name}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-400">
                  <span>{membership.current.name}</span>
                  <span>{membership.next ? `${membership.next.name} (${membership.next.min} pts)` : 'Hạng cao nhất'}</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${membership.progress}%` }} />
                </div>
                <p className="text-xs text-gray-300 mt-2">
                  {membership.next
                    ? `Bạn cần thêm ${membership.remaining} điểm để thăng hạng ${membership.next.name}.`
                    : 'Bạn đã đạt hạng cao nhất.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                  <p className="text-xs text-gray-300 mb-1">Số check-in</p>
                  <p className="text-lg font-bold">{points.checkins}</p>
                </div>
                <div className="rounded-xl bg-white/10 border border-white/10 p-3">
                  <p className="text-xs text-gray-300 mb-1">Giao dịch ví</p>
                  <p className="text-lg font-bold">{txs.length}</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-sm border border-[#e8f0eb] dark:border-[#2a4030] flex flex-col min-h-[420px]">
            <div className="px-6 pt-6 pb-3 border-b border-[#f0f5f1] dark:border-[#2a4030]">
              <h3 className="font-bold text-lg text-[#111813] dark:text-white mb-4">Kho ưu đãi</h3>
              <div className="flex gap-3">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${
                    voucherTab === 'exchange'
                      ? 'bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] shadow-primary/25'
                      : 'bg-[#f0f5f1] text-[#111813] hover:shadow-sm'
                  }`}
                  onClick={() => setVoucherTab('exchange')}
                  type="button"
                >
                  Đổi quà
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition shadow-sm ${
                    voucherTab === 'mine'
                      ? 'bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] shadow-primary/25'
                      : 'bg-[#f0f5f1] text-[#111813] hover:shadow-sm'
                  }`}
                  onClick={() => setVoucherTab('mine')}
                  type="button"
                >
                  Voucher của tôi
                  <span className="ml-1 bg-white/70 text-[#0f172a] px-1.5 py-0.5 rounded text-[10px]">
                    {vouchers.length}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[600px]">
              {voucherTab === 'exchange' && redeemableVouchers.length === 0 && (
                <p className="text-sm text-[#608a6e]">Chưa có ưu đãi sẵn sàng đổi. Hãy tiếp tục check-in để nhận thêm điểm.</p>
              )}
              {voucherTab === 'exchange' &&
                redeemableVouchers.map((v, idx) => (
                  <div
                    key={v.id || v.ma_voucher}
                    className="flex bg-white dark:bg-[#22362a] border border-[#e8f0eb] dark:border-[#2a4030] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-24 bg-cover bg-center"
                      style={{ backgroundImage: `url('${voucherThumb(v, sampleImages[idx % sampleImages.length])}')` }}
                    />
                    <div className="flex-1 p-4 flex flex-col justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-[#111813] dark:text-white line-clamp-2">{v.tieu_de}</h4>
                        <p className="text-xs text-[#608a6e]">
                          HSD: {v.ngay_bat_dau?.slice(0, 10)} - {v.ngay_ket_thuc?.slice(0, 10)}
                        </p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-1 text-primary font-bold text-sm">
                          <span className="material-symbols-outlined text-[16px]">stars</span>
                          {v.required_points ? `${v.required_points} pts` : 'Dùng trực tiếp'}
                        </div>
                        <button
                          type="button"
                          className="bg-gradient-to-r from-primary to-primary-hover text-[#0f172a] text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-primary/25 hover:shadow-md hover:-translate-y-0.5 transition"
                          onClick={() => toast('Áp dụng voucher khi đặt tour / thanh toán ví.')}
                        >
                          Đổi ngay
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {voucherTab === 'mine' && vouchers.length === 0 && (
                <p className="text-sm text-[#608a6e]">Bạn chưa có voucher nào.</p>
              )}
              {voucherTab === 'mine' &&
                vouchers.map((v, idx) => (
                  <div
                    key={v.id || v.ma_voucher}
                    className="flex bg-white dark:bg-[#22362a] border border-[#e8f0eb] dark:border-[#2a4030] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-24 bg-cover bg-center"
                      style={{ backgroundImage: `url('${voucherThumb(v, sampleImages[idx % sampleImages.length])}')` }}
                    />
                    <div className="flex-1 p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-[#111813] dark:text-white">{v.tieu_de}</h4>
                          <p className="text-[11px] font-semibold text-primary uppercase">
                            Code: {v.code || v.ma_voucher}
                          </p>
                          <p className="text-xs text-[#608a6e]">
                            {v.giam_phan_tram}% • tối đa {Number(v.giam_toi_da || 0).toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            v.da_dung ? 'bg-slate-100 text-slate-600' : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {v.da_dung ? 'Đã dùng' : 'Chưa dùng'}
                        </span>
                      </div>
                      <p className="text-xs text-[#608a6e]">
                        HSD: {v.ngay_bat_dau?.slice(0, 10)} - {v.ngay_ket_thuc?.slice(0, 10)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageShell>
  );
};

export default WalletPage;
