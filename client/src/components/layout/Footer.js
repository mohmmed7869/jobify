import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMail, FiPhone, FiFacebook, FiTwitter, 
  FiLinkedin, FiInstagram, FiCpu, FiExternalLink, FiHeart
} from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-themed-bg-sec text-themed-text relative overflow-hidden border-t border-primary-100/10" dir="rtl">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-accent rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 md:gap-16 mb-16 md:mb-20">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6 md:mb-8 group">
              <img src="/logo.png" alt="Jobify Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain group-hover:scale-105 transition-transform duration-300" />
            </Link>
            <p className="text-themed-text-sec font-medium leading-relaxed mb-6 md:mb-8 text-sm md:text-base max-w-md">
              الجيل الثالث من منصات التوظيف الذكية، نستخدم أقوى تقنيات الذكاء الاصطناعي لربط العقول المبدعة بأفضل بيئات العمل العالمية.
            </p>
            <div className="flex gap-3 md:gap-4">
              <SocialIcon icon={<FiFacebook />} href="#" />
              <SocialIcon icon={<FiTwitter />} href="#" social="twitter" />
              <SocialIcon icon={<FiLinkedin />} href="#" social="linkedin" />
              <SocialIcon icon={<FiInstagram />} href="#" social="instagram" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="sm:col-span-1">
            <h3 className="text-base md:text-lg font-black mb-6 md:mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full shadow-glow"></span> روابط سريعة
            </h3>
            <ul className="space-y-3 md:space-y-4">
              <FooterLink to="/jobs">تصفح الوظائف</FooterLink>
              <FooterLink to="/feed">خلاصة النشاط</FooterLink>
              <FooterLink to="/social">المجتمع المهني</FooterLink>
              <FooterLink to="/ai-coach">المساعد الذكي</FooterLink>
              <FooterLink to="/resume-builder">باني السيرة الذاتية</FooterLink>
            </ul>
          </div>

          {/* Support */}
          <div className="sm:col-span-1">
            <h3 className="text-base md:text-lg font-black mb-6 md:mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent rounded-full shadow-glow"></span> الدعم والمساعدة
            </h3>
            <ul className="space-y-3 md:space-y-4">
              <FooterLink to="/support">مركز المساعدة</FooterLink>
              <FooterLink to="/privacy">سياسة الخصوصية</FooterLink>
              <FooterLink to="/terms">شروط الاستخدام</FooterLink>
              <FooterLink to="/contact">اتصل بنا</FooterLink>
              <FooterLink to="/faq">الأسئلة الشائعة</FooterLink>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-base md:text-lg font-black mb-6 md:mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-success rounded-full shadow-glow"></span> تواصل مباشر
            </h3>
            <ul className="space-y-4 md:space-y-6">
              <li className="flex items-start gap-3 md:gap-4 group">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-primary-100/10 shrink-0">
                  <FiMail size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-black text-themed-text-sec opacity-80 uppercase tracking-widest mb-0.5 md:mb-1">البريد الإلكتروني</p>
                  <p className="text-themed-text font-bold text-sm md:text-base break-words">mohom77393@gmail.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3 md:gap-4 group">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-primary-100/10 shrink-0">
                  <FiPhone size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-black text-themed-text-sec opacity-80 uppercase tracking-widest mb-0.5 md:mb-1">رقم التواصل</p>
                  <p className="text-themed-text font-bold text-sm md:text-base break-words" dir="ltr">+967 783332292</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-primary-100/10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-right">
              <p className="text-themed-text-ter text-sm font-bold mb-2">
                © 2026 Jobify. جميع الحقوق محفوظة.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black text-themed-text-ter uppercase tracking-[0.2em]">
                <span>Developed with</span>
                <FiHeart className="text-error animate-pulse" />
                <span>by Mohammed Ali & Smart Solution Team</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 glass-premium rounded-2xl border border-primary-100/20 shimmer-sweep">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                <FiCpu size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">إصدار النظام</p>
                <p className="text-xs font-black text-themed-text">v3.1.0 (Mesh Gradient Engine)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} className="text-themed-text-ter hover:text-primary font-bold transition-all flex items-center gap-2 group">
      <FiExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all -mr-4 group-hover:mr-0" />
      {children}
    </Link>
  </li>
);

const SocialIcon = ({ icon, href }) => (
    <a 
    href={href} 
    className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-primary-200"
  >
    {icon}
  </a>
);

export default Footer;
