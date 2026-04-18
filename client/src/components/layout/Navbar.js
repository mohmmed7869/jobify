import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import NotificationDropdown from './NotificationDropdown';
import { 
  FiMenu, FiX, FiUser, FiLogOut, 
  FiMessageCircle, FiCpu, FiGrid, FiSearch, FiBriefcase,
  FiGlobe, FiLayers, FiVideo, FiTarget
} from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { t, i18n } = useTranslation();
  const { currentTheme, setCurrentTheme, themes } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'jobseeker':
      case 'individual': return '/dashboard';
      case 'employer':
      case 'company': return '/employer/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  const getProfileLink = () => {
    switch (user?.role) {
      case 'employer':
      case 'company': return '/employer/profile';
      default: return '/profile';
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
      isScrolled 
        ? 'py-2 md:py-3 glass-premium border-b border-primary-100/20 shadow-premium-xl' 
        : 'py-4 md:py-6 bg-transparent border-b border-transparent'
    }`} dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl md:rounded-2xl flex items-center justify-center shadow-glow-lg group-hover:rotate-12 transition-transform duration-500 border border-white/20">
                <span className="text-white font-black text-xl md:text-2xl">ت</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black text-themed-text tracking-tight leading-none">منصة التوظيف</span>
                <span className="text-[8px] md:text-[10px] text-primary-600 font-black tracking-widest uppercase mt-1">الجيل الثالث الذكي</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1 ml-8">
              <NavLink to="/feed" active={isActive('/feed')} label={t('navbar.feed')} />
              <NavLink to="/jobs" active={isActive('/jobs')} label={t('navbar.jobs')} />
              {user && <NavLink to={getDashboardLink()} active={location.pathname.includes('dashboard')} label={t('navbar.dashboard')} />}
            </div>

            <div className="flex items-center gap-2 px-4 border-r border-primary-100/20">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="w-10 h-10 flex items-center justify-center text-themed-text-ter hover:text-primary hover:bg-primary-500/10 rounded-xl transition-all"
                  title="Change Language"
                >
                  <FiGlobe size={20} />
                </button>
                {isLangMenuOpen && (
                  <div className="absolute top-full mt-3 left-0 w-40 glass-premium rounded-[1.5rem] border border-primary-100/20 py-2 z-50 animate-scale-in shimmer-sweep">
                    <button
                      onClick={() => { i18n.changeLanguage('ar'); setIsLangMenuOpen(false); }}
                      className={`w-full text-right px-5 py-3 text-sm font-black hover:bg-primary-500/5 ${i18n.language === 'ar' ? 'text-primary' : 'text-themed-text-sec'}`}
                    >
                      العربية
                    </button>
                    <button
                      onClick={() => { i18n.changeLanguage('en'); setIsLangMenuOpen(false); }}
                      className={`w-full text-right px-5 py-3 text-sm font-black hover:bg-primary-500/5 ${i18n.language === 'en' ? 'text-primary' : 'text-themed-text-sec'}`}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              {/* Theme Switcher Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  className="w-10 h-10 flex items-center justify-center text-themed-text-ter hover:text-primary hover:bg-primary-500/10 rounded-xl transition-all"
                  title="Change Theme"
                >
                  <FiLayers size={20} />
                </button>
                {isThemeMenuOpen && (
                  <div className="absolute top-full mt-3 left-0 w-56 glass-premium rounded-[1.5rem] border border-primary-100/20 py-2 z-50 animate-scale-in shimmer-sweep">
                    {themes.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => { setCurrentTheme(theme.id); setIsThemeMenuOpen(false); }}
                        className={`w-full text-right px-5 py-3 text-sm font-black hover:bg-primary-500/5 flex items-center justify-between ${currentTheme === theme.id ? 'text-primary' : 'text-themed-text-sec'}`}
                      >
                        <span>{theme.name}</span>
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.primary }}></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {user ? (
              <div className="flex items-center gap-4 border-r border-primary-100/20 pr-6 mr-4">
                <IconButton to="/chat" icon={<FiMessageCircle />} badge={3} />
                <NotificationDropdown socket={socket} />
                
                {/* Profile Dropdown */}
                <div className="relative mr-2">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-3 p-1.5 pr-4 bg-themed-bg-ter hover:bg-themed-bg-sec rounded-2xl transition-all border border-primary-100/20"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-themed-text">{user.name}</span>
                      <span className="text-[9px] text-themed-text-ter font-bold uppercase tracking-tighter">{user.role}</span>
                    </div>
                    <div className="w-10 h-10 bg-themed-bg rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary-100/20">
                      <FiUser size={20} />
                    </div>
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div className="absolute left-0 mt-3 w-64 glass-premium rounded-[2rem] border border-primary-100/20 py-3 z-50 animate-scale-in shimmer-sweep">
                      <div className="px-6 py-4 border-b border-primary-100/10 mb-2">
                        <p className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest mb-1">الحساب</p>
                        <p className="text-sm font-black text-themed-text truncate">{user.email}</p>
                      </div>
                      <DropdownLink to={getProfileLink()} icon={<FiUser />} label={t('navbar.profile')} onClick={() => setIsProfileMenuOpen(false)} />
                      <DropdownLink to="/interview/video" icon={<FiVideo />} label="المقابلة الذكية" onClick={() => setIsProfileMenuOpen(false)} />
                      {(user.role === 'jobseeker' || user.role === 'individual') && (
                        <>
                          <DropdownLink to="/my-applications" icon={<FiBriefcase />} label="طلباتي" onClick={() => setIsProfileMenuOpen(false)} />
                          <DropdownLink to="/resume-builder" icon={<FiCpu />} label="بناء السيرة الذاتية" onClick={() => setIsProfileMenuOpen(false)} />
                        </>
                      )}
                      {(user.role === 'employer' || user.role === 'company') && (
                        <>
                          <DropdownLink to="/employer/jobs" icon={<FiBriefcase />} label="إدارة الوظائف" onClick={() => setIsProfileMenuOpen(false)} />
                          <DropdownLink to="/employer/requirements" icon={<FiTarget />} label="المتطلبات الاستراتيجية" onClick={() => setIsProfileMenuOpen(false)} />
                        </>
                      )}
                      {user.role === 'admin' && (
                        <>
                          <DropdownLink to="/admin/users" icon={<FiUser />} label={t('navbar.manage_users')} onClick={() => setIsProfileMenuOpen(false)} />
                          <DropdownLink to="/admin/jobs" icon={<FiBriefcase />} label={t('navbar.manage_jobs')} onClick={() => setIsProfileMenuOpen(false)} />
                          <DropdownLink to="/admin/analytics" icon={<FiGrid />} label={t('navbar.analytics')} onClick={() => setIsProfileMenuOpen(false)} color="text-primary" />
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-6 py-4 text-sm font-black text-error hover:bg-error/5 transition-colors"
                      >
                        <FiLogOut size={18} />
                        {t('navbar.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 pr-4">
                <Link to="/login" className="text-sm font-black text-themed-text-sec hover:text-primary transition-colors">
                  {t('navbar.login')}
                </Link>
                <Link to="/register" className="btn-formal-primary py-2.5 px-8 text-sm shimmer-sweep">
                  {t('navbar.join_us')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <Link to="/chat" className="relative w-10 h-10 flex items-center justify-center text-themed-text bg-themed-bg-ter rounded-xl border border-primary-100/20 shadow-sm">
                <FiMessageCircle size={20} />
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white"></span>
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 flex items-center justify-center text-themed-text bg-themed-bg-ter rounded-xl hover:bg-themed-bg-sec transition-all border border-primary-100/20 shadow-sm"
            >
              {isMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`fixed inset-0 z-[80] md:hidden transition-all duration-500 ease-in-out ${
        isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
        
        {/* Menu Content */}
        <div className={`absolute left-0 right-0 top-0 bg-white/95 backdrop-blur-2xl shadow-2xl border-b border-primary-100/20 transition-transform duration-500 ease-in-out transform ${
          isMenuOpen ? 'translate-y-0' : '-translate-y-full'
        } pt-24 pb-10 px-6 max-h-[90vh] overflow-y-auto`}>
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => { i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar'); setIsMenuOpen(false); }}
                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 text-slate-900 font-black border border-slate-100 text-sm"
              >
                <FiGlobe className="text-primary" /> {i18n.language === 'ar' ? 'English' : 'العربية'}
              </button>
              <button 
                onClick={() => { setIsThemeMenuOpen(!isThemeMenuOpen); }}
                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 text-slate-900 font-black border border-slate-100 text-sm"
              >
                <FiLayers className="text-primary" /> {t('navbar.theme') || 'الثيمات'}
              </button>
            </div>

            {isThemeMenuOpen && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50 rounded-2xl mb-4 border border-slate-100 animate-slide-down">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => { setCurrentTheme(theme.id); setIsThemeMenuOpen(false); }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      currentTheme === theme.id ? 'bg-white border-primary-200 shadow-sm' : 'bg-transparent border-transparent text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase">{theme.name}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <MobileNavLink to="/feed" label={t('navbar.feed')} icon={<FiGrid />} onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink to="/jobs" label={t('navbar.jobs')} icon={<FiSearch />} onClick={() => setIsMenuOpen(false)} />
              
              {user ? (
                <>
                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">لوحة التحكم</p>
                    <div className="grid grid-cols-1 gap-2">
                      <MobileNavLink to={getDashboardLink()} label={t('navbar.dashboard')} icon={<FiGrid />} onClick={() => setIsMenuOpen(false)} />
                      <MobileNavLink to="/interview/video" label="المقابلة الذكية" icon={<FiVideo />} onClick={() => setIsMenuOpen(false)} />
                      <MobileNavLink to={getProfileLink()} label={t('navbar.profile')} icon={<FiUser />} onClick={() => setIsMenuOpen(false)} />
                      
                      {(user.role === 'jobseeker' || user.role === 'individual') && (
                        <>
                          <MobileNavLink to="/my-applications" label="طلباتي" icon={<FiBriefcase />} onClick={() => setIsMenuOpen(false)} />
                          <MobileNavLink to="/resume-builder" label="بناء السيرة الذاتية" icon={<FiCpu />} onClick={() => setIsMenuOpen(false)} />
                        </>
                      )}
                      
                      {(user.role === 'employer' || user.role === 'company') && (
                        <>
                          <MobileNavLink to="/employer/jobs" label="إدارة الوظائف" icon={<FiBriefcase />} onClick={() => setIsMenuOpen(false)} />
                          <MobileNavLink to="/employer/requirements" label="المتطلبات الاستراتيجية" icon={<FiTarget />} onClick={() => setIsMenuOpen(false)} />
                        </>
                      )}
                      
                      {user.role === 'admin' && (
                        <div className="mt-2 p-3 bg-primary-50 rounded-2xl space-y-1">
                          <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest mb-2 px-2">الإدارة</p>
                          <MobileNavLink to="/admin/users" label={t('navbar.manage_users')} icon={<FiUser />} onClick={() => setIsMenuOpen(false)} />
                          <MobileNavLink to="/admin/jobs" label={t('navbar.manage_jobs')} icon={<FiBriefcase />} onClick={() => setIsMenuOpen(false)} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-8">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-error/5 text-error font-black border border-error/10 shadow-sm active:scale-95 transition-all"
                    >
                      <FiLogOut size={20} /> {t('navbar.logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-6 flex flex-col gap-3">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-900 font-black text-center border border-slate-100">
                    {t('navbar.login')}
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn-formal-primary w-full py-4 text-center shimmer-sweep shadow-glow">
                    {t('navbar.join_us')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, active, label }) => (
  <Link
    to={to}
    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
      active 
        ? 'text-primary-600 bg-primary-50/50' 
        : 'text-slate-500 hover:text-primary-600 hover:bg-slate-50'
    }`}
  >
    {label}
  </Link>
);

const IconButton = ({ icon, badge, to }) => {
  const content = (
    <div className="relative w-11 h-11 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary-600 transition-all border border-slate-100">
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
          {badge}
        </span>
      )}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : <button>{content}</button>;
};

const DropdownLink = ({ to, icon, label, onClick, color = 'text-slate-700' }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 text-sm font-black transition-colors hover:bg-slate-50 ${color}`}
  >
    <span className="text-slate-400">{icon}</span>
    {label}
  </Link>
);

const MobileNavLink = ({ to, label, icon, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-2xl text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-all text-lg font-black"
  >
    <span className="text-slate-400">{icon}</span>
    {label}
  </Link>
);

export default Navbar;
