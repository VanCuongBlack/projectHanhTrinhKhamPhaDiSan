import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { logoutUser } from '../api/authApi';
import { getMyPartnerStatus } from '../api/partnerApi';
import { getMyGuideStatus } from '../api/guideApi';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, token, clearAuth } = useAuthStore();
  const [message, setMessage] = useState(null);
  const [roleState, setRoleState] = useState({ partnerApproved: false, guideApproved: false });

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/community', label: 'Cộng đồng' },
    { to: '/wallet', label: 'Ví của tôi' },
    { to: '/checkin', label: 'Địa điểm - Checkin' },
    { to: '/tours/search', label: 'Tour du lịch' },
    { to: '/guides/search', label: 'Booking Hướng dẫn viên địa phương' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể đăng xuất.');
    } finally {
      clearAuth();
    }
  };

  useEffect(() => {
    if (!token) {
      setRoleState({ partnerApproved: false, guideApproved: false });
      return;
    }
    let mounted = true;
    const load = async () => {
      try {
        const [p, g] = await Promise.allSettled([getMyPartnerStatus(), getMyGuideStatus()]);
        if (!mounted) return;
        const partnerRes = p.status === 'fulfilled' ? p.value : {};
        const guideRes = g.status === 'fulfilled' ? g.value : {};
        const partnerApproved =
          !!partnerRes?.partner || partnerRes?.application?.trang_thai === 'approved';
        const guideApproved =
          !!guideRes?.guide || guideRes?.application?.trang_thai === 'approved';
        setRoleState({ partnerApproved, guideApproved });
      } catch {
        if (mounted) setRoleState({ partnerApproved: false, guideApproved: false });
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const dashboardLink = user?.vai_tro === 'admin'
    ? '/admin'
    : roleState.partnerApproved
      ? '/partners/apply'
      : roleState.guideApproved
        ? '/guides/schedule'
        : null;

  return (
    <div className="min-height-screen flex min-h-screen flex-col bg-background-light text-text-main dark:bg-background-dark dark:text-white">
      <header className="sticky top-0 z-50 w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-[#f0f5f1] dark:border-white/5">
        <div className="px-4 md:px-10 lg:px-20 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/20 text-primary-hover">
                <span className="material-symbols-outlined !text-3xl">travel_explore</span>
              </div>
              <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-tight hidden md:block">
                Di Sản Việt
              </h2>
            </div>

            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'text-primary'
                      : 'text-text-main dark:text-gray-200 hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 mr-2 bg-background-light dark:bg-white/5 rounded-full px-3 py-1 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-yellow-500 icon-filled text-[18px]">stars</span>
                <span className="text-xs font-bold text-text-main dark:text-white">
                  {user?.ho_ten ? user.ho_ten.split(' ')[0] : 'Khách'}
                </span>
              </Link>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-lg bg-background-light dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-text-main dark:text-white">search</span>
              </button>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-lg bg-background-light dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-text-main dark:text-white">notifications</span>
              </button>
              {dashboardLink && (
                <Link
                  to={dashboardLink}
                  className="flex h-10 items-center justify-center rounded-lg bg-[#111813] px-4 text-sm font-bold text-white shadow-lg shadow-black/10 hover:-translate-y-0.5 transition-all"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/apply"
                className="flex h-10 items-center justify-center rounded-lg border border-primary text-primary px-4 text-sm font-bold bg-white hover:bg-primary/10 transition-all"
              >
                Đăng ký đối tác/HDV
              </Link>
              <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
              {token ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-text-main text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                >
                  Đăng xuất
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex h-10 items-center justify-center rounded-lg bg-background-light dark:bg-white/5 px-4 text-sm font-semibold text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-white/10"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-text-main text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {message && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          {message}
        </div>
      )}

      <main className="flex-1 w-full">{children}</main>

      <footer className="bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 mt-10">
        <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-10 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/20 text-primary-hover">
                  <span className="material-symbols-outlined !text-xl">travel_explore</span>
                </div>
                <h2 className="text-text-main dark:text-white font-bold text-lg">Di Sản Việt</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Nền tảng kết nối du lịch di sản hàng đầu Việt Nam. Khơi dậy niềm tự hào dân tộc qua từng bước chân khám phá.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-text-main dark:text-white">Khám phá</h3>
              <div className="flex flex-col gap-2">
                <Link className="text-text-secondary hover:text-primary text-sm" to="/">Về chúng tôi</Link>
                <Link className="text-text-secondary hover:text-primary text-sm" to="/dashboard">Tour Di sản</Link>
                <Link className="text-text-secondary hover:text-primary text-sm" to="/guides">Hướng dẫn viên</Link>
                <Link className="text-text-secondary hover:text-primary text-sm" to="/community">Blog du lịch</Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-text-main dark:text-white">Hỗ trợ</h3>
              <div className="flex flex-col gap-2">
                <Link className="text-text-secondary hover:text-primary text-sm" to="/community">Trung tâm trợ giúp</Link>
                <span className="text-text-secondary text-sm">Chính sách bảo mật</span>
                <span className="text-text-secondary text-sm">Điều khoản sử dụng</span>
                <Link className="text-text-secondary hover:text-primary text-sm" to="/partners/apply">Đăng ký đối tác</Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-text-main dark:text-white">Đăng ký nhận tin</h3>
              <p className="text-text-secondary text-sm">Nhận ưu đãi và gợi ý du lịch mới nhất.</p>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-[#dbe6df] bg-background-light dark:bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:text-white"
                  placeholder="Email của bạn"
                />
                <button className="bg-primary hover:bg-primary-hover text-text-main rounded-lg px-3 py-2 font-bold text-sm">
                  Gửi
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-secondary text-xs">© {new Date().getFullYear()} Di Sản Việt. All rights reserved.</p>
            <div className="flex gap-4 text-text-secondary">
              <a className="hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">thumb_up</span></a>
              <a className="hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">photo_camera</span></a>
              <a className="hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">public</span></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
