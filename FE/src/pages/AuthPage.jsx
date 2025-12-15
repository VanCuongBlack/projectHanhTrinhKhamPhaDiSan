import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, verifyOtp, loginUser } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import './AuthPage.css';

const HERO_REGISTER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBRwTcdAPrRNjKB_TjlUxLVaASgkf2cGBrVpEKe3NOwBwgaFh6Az08yI2IZp-EkfGIrgaHixuZAGgCzgMQkeitVc5dl4LgPTcrgyPKwBqaGCPdpgaSxzBqnO4o-lOPxxPecUfveJ3hi30w39iSMsfGgbkVMPRrjDdjbzigA24UkuAU8biMD_rWp00rQ1x3ofdHtA1uuTVUVzATGQwZx5jppOwcPjqN-x53PEPORXau8-VxBrEvU8tk4jycvOdTr5hHOhe2CpmXWo1g';
const HERO_LOGIN =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDylqjbRqdMj-glSrh2f4Dz-z91FQRkaROqv4nstilcQ178KD0ptiz7PadJAzOq-0orp8LyTp_dPXQaf5F-FqJe100HZ8V7APXwIqQozriimtACNh-Pnxqf4DfCr7ZQOypkAe-tIKvk-WHp6MQo57RBdV1CLJgwBkhQZl_4AomlTOnS1t4Nfd_IcH6_Rvlf4D1PSE7UR0gpcFdfw4XFiEfWd9WwLNySpCeCv0VP8Iq9UY-QdWywZVLnCAQd23nYDrO8RIWHoRTZO3U';

const initialRegister = {
  email: '',
  so_dien_thoai: '',
  mat_khau: '',
  ho_ten: '',
  confirm_mat_khau: ''
};
const initialOtp = { email: '', otp: '' };
const initialLogin = { email: '', mat_khau: '' };

const AuthPage = ({ mode = 'register' }) => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [otpForm, setOtpForm] = useState(initialOtp);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [status, setStatus] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (otpSent && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [otpSent]);

  const focusBlock = otpSent ? 'otp' : mode;

  const handleRegisterChange = (field) => (event) => {
    const { value } = event.target;
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!registerForm.so_dien_thoai.trim()) {
      setStatus({ type: 'error', text: 'Vui lòng nhập số điện thoại.' });
      return;
    }

    if (registerForm.mat_khau.length < 8) {
      setStatus({ type: 'error', text: 'Mật khẩu cần ít nhất 8 ký tự.' });
      return;
    }

    if (registerForm.mat_khau !== registerForm.confirm_mat_khau) {
      setStatus({ type: 'error', text: 'Mật khẩu và xác nhận chưa trùng khớp.' });
      return;
    }

    setStatus({ type: 'info', text: 'Đang gửi OTP...' });
    const payload = {
      ...registerForm,
      email: registerForm.email.trim(),
      ho_ten: registerForm.ho_ten.trim(),
      so_dien_thoai: registerForm.so_dien_thoai.trim()
    };

    try {
      const res = await registerUser(payload);
      setStatus({ type: 'success', text: res.message || 'Đã gửi OTP.' });
      setOtpForm((prev) => ({ ...prev, email: payload.email }));
      setOtpDigits(['', '', '', '', '', '']);
      setOtpSent(true);
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.response?.data?.message || 'Không thể đăng ký.'
      });
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    const email = (otpForm.email || registerForm.email || '').trim();
    const otpValue = otpDigits.join('').trim() || otpForm.otp.trim();
    if (!email || !otpValue) {
      setStatus({ type: 'error', text: 'Vui lòng nhập email và OTP.' });
      return;
    }
    const payload = { email, otp: otpValue };
    setStatus({ type: 'info', text: 'Đang xác thực...' });
    try {
      const res = await verifyOtp(payload);
      setStatus({ type: 'success', text: res.message || 'OTP hợp lệ.' });
      setRegisterForm(initialRegister);
      setOtpForm(initialOtp);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpSent(false);
      setLoginForm((prev) => ({ ...prev, email }));
      navigate('/login');
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.response?.data?.message || 'OTP không hợp lệ.'
      });
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus({ type: 'info', text: 'Đang đăng nhập...' });
    try {
      const data = await loginUser(loginForm);
      setAuth(data.user, data.token);
      setStatus({ type: 'success', text: data.message || 'Đăng nhập thành công.' });
      const role = data.user?.vai_tro;
      const redirect = role === 'admin' ? '/admin' : '/';
      navigate(redirect, { replace: true });
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.response?.data?.message || 'Đăng nhập thất bại.'
      });
    }
  };

  const otpEmail = useMemo(() => otpForm.email || registerForm.email, [otpForm.email, registerForm.email]);

  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setOtpForm((prev) => ({ ...prev, otp: updated.join('') }));
    if (digit && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const renderOtpCard = () => (
    <main className="flex-1 relative flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-light dark:to-background-dark" />
      </div>
      <div className="relative z-10 w-full max-w-[520px] bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-[#e0e8e2] dark:border-[#2a4032] overflow-hidden">
        <div className="flex flex-col p-8 md:p-10 gap-6">
          <div className="flex flex-col gap-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
              <span className="material-symbols-outlined text-primary text-3xl">mark_email_read</span>
            </div>
            <h1 className="text-[#111813] dark:text-white tracking-tight text-[28px] md:text-[32px] font-bold leading-tight">
              Xác thực tài khoản
            </h1>
            <p className="text-[#608a6e] dark:text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              Chúng tôi đã gửi mã xác thực 6 chữ số đến email
              <span className="font-semibold text-[#111813] dark:text-gray-200"> {otpEmail}</span>. Vui lòng kiểm tra hộp thư của bạn.
            </p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
            <div className="flex justify-center py-2">
              <fieldset className="flex gap-2 sm:gap-4" id="otp-input-group">
                {otpDigits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    aria-label={`Digit ${idx + 1}`}
                    className="flex h-12 w-10 sm:h-14 sm:w-12 text-center bg-background-light dark:bg-background-dark rounded-lg border border-[#e0e8e2] dark:border-[#2a4032] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-xl font-bold leading-normal transition-all text-[#111813] dark:text-white placeholder:text-gray-300"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  />
                ))}
              </fieldset>
            </div>
            <div className="flex items-center gap-1 text-sm justify-center">
              <span className="text-[#608a6e] dark:text-gray-400">Bạn chưa nhận được mã?</span>
              <button
                type="button"
                className="text-primary font-bold hover:underline"
                onClick={() => setOtpSent(false)}
              >
                Gửi lại
              </button>
            </div>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-primary hover:bg-[#0bc94a] transition-colors shadow-lg shadow-primary/20 text-[#111813] text-base font-bold leading-normal tracking-[0.015em]"
            >
              Xác nhận
            </button>
          </form>
        </div>
        <div className="h-1.5 w-full bg-background-light dark:bg-[#2a4032]">
          <div className="h-full w-2/3 bg-primary rounded-r-full" />
        </div>
      </div>
    </main>
  );

  const renderRegister = () => (
    <main className="flex flex-1 flex-col lg:flex-row py-8 lg:py-12">
      <div
        className="relative hidden lg:flex w-full lg:w-1/2 flex-col justify-between bg-cover bg-center bg-no-repeat p-10 xl:p-16"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url(${HERO_REGISTER})` }}
      >
        <div className="flex flex-col gap-4 max-w-lg">
          <div className="inline-flex h-10 w-fit items-center justify-center rounded-full bg-white/20 px-4 backdrop-blur-md border border-white/10">
            <span className="text-white text-sm font-bold">Khám phá vẻ đẹp Việt Nam</span>
          </div>
        </div>
        <div className="flex flex-col gap-6 text-white">
          <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-[-0.033em]">
            Kết nối với thiên nhiên và văn hóa bản địa.
          </h1>
          <p className="text-lg text-white/90 font-medium">
            Tham gia cộng đồng hơn 50.000 người yêu du lịch và bắt đầu hành trình của bạn ngay hôm nay.
          </p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white dark:bg-background-dark p-6 py-12 md:p-16 overflow-y-auto">
        <div className="w-full max-w-[520px] flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-left">
            <h1 className="text-[#111813] dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em]">
              Đăng ký tài khoản
            </h1>
            <p className="text-text-light text-base font-normal">
              Nhập thông tin chi tiết để tạo tài khoản của bạn.
            </p>
          </div>
          <form className="flex flex-col gap-5" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[#111813] dark:text-white text-sm font-semibold leading-normal">Họ và tên</span>
                <div className="relative">
                  <input
                    className="form-input flex w-full rounded-lg text-[#111813] dark:text-white dark:bg-[#1c2e22] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6df] dark:border-[#2a382e] h-12 placeholder:text-text-light px-4 text-base transition-all"
                    placeholder="Nguyễn Văn A"
                    type="text"
                    value={registerForm.ho_ten}
                    onChange={handleRegisterChange('ho_ten')}
                  />
                  <div className="absolute right-4 top-3 text-text-light">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[#111813] dark:text-white text-sm font-semibold leading-normal">Email</span>
                <div className="relative">
                  <input
                    className="form-input flex w-full rounded-lg text-[#111813] dark:text-white dark:bg-[#1c2e22] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6df] dark:border-[#2a382e] h-12 placeholder:text-text-light px-4 text-base transition-all"
                    placeholder="example@email.com"
                    type="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange('email')}
                    required
                  />
                  <div className="absolute right-4 top-3 text-text-light">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[#111813] dark:text-white text-sm font-semibold leading-normal">Số điện thoại</span>
                <div className="relative">
                  <input
                    className="form-input flex w-full rounded-lg text-[#111813] dark:text-white dark:bg-[#1c2e22] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6df] dark:border-[#2a382e] h-12 placeholder:text-text-light px-4 text-base transition-all"
                    placeholder="0912 xxx xxx"
                    type="tel"
                    value={registerForm.so_dien_thoai}
                    onChange={handleRegisterChange('so_dien_thoai')}
                    required
                  />
                  <div className="absolute right-4 top-3 text-text-light">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </div>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[#111813] dark:text-white text-sm font-semibold leading-normal">Mật khẩu</span>
                <div className="relative group">
                  <input
                    className="form-input flex w-full rounded-lg text-[#111813] dark:text-white dark:bg-[#1c2e22] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6df] dark:border-[#2a382e] h-12 placeholder:text-text-light px-4 pr-10 text-base transition-all"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                      value={registerForm.mat_khau}
                      onChange={handleRegisterChange('mat_khau')}
                      required
                    />
                    <button
                      className="password-toggle-ghost"
                      type="button"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[#111813] dark:text-white text-sm font-semibold leading-normal">Xác nhận mật khẩu</span>
                <div className="relative group">
                  <input
                    className="form-input flex w-full rounded-lg text-[#111813] dark:text-white dark:bg-[#1c2e22] focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6df] dark:border-[#2a382e] h-12 placeholder:text-text-light px-4 pr-10 text-base transition-all"
                    placeholder="••••••••"
                    type={showConfirmPassword ? 'text' : 'password'}
                      value={registerForm.confirm_mat_khau}
                      onChange={handleRegisterChange('confirm_mat_khau')}
                      required
                    />
                    <button
                      className="password-toggle-ghost"
                      type="button"
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-2">
              <div className="relative flex items-center">
                <input className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-[#dbe6df] dark:border-[#2a382e] bg-white dark:bg-[#1c2e22] checked:border-primary checked:bg-primary transition-all" id="terms" type="checkbox" />
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                </span>
              </div>
              <label className="cursor-pointer text-sm text-[#111813] dark:text-white/80 leading-snug" htmlFor="terms">
                Tôi đồng ý với <span className="font-bold underline">Điều khoản dịch vụ</span> và <span className="font-bold underline">Chính sách bảo mật</span>.
              </label>
            </div>

            <button
              type="submit"
              className="auth-btn auth-gradient-btn w-full mt-2"
            >
              Đăng ký & nhận OTP
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 pt-2">
            <p className="text-text-light text-sm font-medium">Đã có tài khoản?</p>
            <Link className="text-primary hover:text-primary/80 hover:underline font-bold text-sm transition-colors" to="/login">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </main>
  );

  const renderLogin = () => (
    <main className="flex-1 flex justify-center items-center py-8 px-4 lg:px-0">
      <div className="flex flex-col max-w-[1200px] w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-stretch bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-[#e6ebe7] dark:border-[#2a3c30]">
          <div className="w-full lg:w-1/2 relative min-h-[300px] lg:min-h-[600px] bg-gray-100 flex-shrink-0">
            <div
              className="absolute inset-0 bg-center bg-no-repeat bg-cover"
              style={{ backgroundImage: `url(${HERO_LOGIN})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8 lg:p-12">
              <h3 className="text-white text-3xl font-bold mb-2">Khám phá vẻ đẹp bất tận</h3>
              <p className="text-gray-200 text-base">Cùng nhau gìn giữ và lan tỏa giá trị di sản văn hóa Việt Nam.</p>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-12 xl:p-16">
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-[#111813] dark:text-white text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
                Chào mừng trở lại
              </h1>
              <p className="text-[#608a6e] dark:text-gray-400 text-base font-normal">
                Đăng nhập để tiếp tục hành trình của bạn.
              </p>
            </div>
            <form className="flex flex-col gap-5 w-full max-w-[480px]" onSubmit={handleLogin}>
              <label className="flex flex-col w-full gap-2">
                <span className="text-[#111813] dark:text-gray-200 text-sm font-medium leading-normal">Email</span>
                <div className="relative flex items-center">
                  <input
                    className="form-input flex w-full rounded-lg text-[#111813] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6df] dark:border-[#3e5646] bg-white dark:bg-[#25382b] focus:border-primary h-12 pl-4 pr-10 text-base transition-all"
                    placeholder="vidu@email.com"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <div className="absolute right-4 text-[#608a6e] dark:text-gray-400 pointer-events-none flex items-center">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                </div>
              </label>

              <label className="flex flex-col w-full gap-2">
                <span className="text-[#111813] dark:text-gray-200 text-sm font-medium leading-normal">Mật khẩu</span>
                <div className="relative flex items-center">
                  <input
                    className="form-input flex w-full rounded-lg text-[#111813] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6df] dark:border-[#3e5646] bg-white dark:bg-[#25382b] focus:border-primary h-12 pl-4 pr-10 text-base transition-all"
                    placeholder="Nhập mật khẩu"
                    type="password"
                    value={loginForm.mat_khau}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, mat_khau: e.target.value }))}
                    required
                  />
                  <div className="absolute right-0 top-0 bottom-0 px-4 text-[#608a6e] dark:text-gray-400 flex items-center">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                </div>
              </label>

              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600" type="checkbox" />
                  <span className="text-sm text-[#608a6e] dark:text-gray-400 group-hover:text-[#111813] dark:group-hover:text-white transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <span className="text-sm font-medium text-primary">Quên mật khẩu?</span>
              </div>

            <button
              type="submit"
              className="auth-btn auth-gradient-btn w-full mt-2"
            >
              Đăng nhập
            </button>

              <div className="flex justify-center gap-1 mt-4">
                <p className="text-[#608a6e] dark:text-gray-400 text-sm font-medium">Chưa có tài khoản?</p>
                <Link className="text-primary hover:text-green-600 dark:hover:text-green-400 text-sm font-bold transition-colors" to="/register">
                  Đăng ký ngay
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );

  if (focusBlock === 'otp') {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen text-[#111813] dark:text-white">
        {renderOtpCard()}
        {status && (
          <div className={`mx-auto max-w-xl px-4 pb-6 ${status.type === 'error' ? 'text-red-600' : status.type === 'success' ? 'text-emerald-600' : 'text-sky-700'}`}>
            {status.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-[#111813] dark:text-white">
      {focusBlock === 'register' ? renderRegister() : renderLogin()}
      {status && (
        <div className={`mx-auto max-w-xl px-4 pb-6 ${status.type === 'error' ? 'text-red-600' : status.type === 'success' ? 'text-emerald-600' : 'text-sky-700'}`}>
          {status.text}
        </div>
      )}
    </div>
  );
};

export default AuthPage;
