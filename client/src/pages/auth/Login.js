import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiGithub, FiLinkedin, FiFacebook, FiArrowRight, FiShield } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // OTP States
  const [showOtpRequired, setShowOtpRequired] = useState(false);
  const [otpMail, setOtpMail] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);

  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      toast.success('تم تفعيل الحساب بنجاح. يمكنك الآن تسجيل الدخول');
    }
    if (params.get('error') === 'invalid_token') {
      toast.error('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }
  }, [location]);

  const handleSocialLogin = (provider) => {
    const backendUrl = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/');
      } else if (result.requiresOtp) {
        toast.success(result.message || 'يرجى تفعيل حسابك أولاً');
        setOtpMail(result.email || formData.email);
        setShowOtpRequired(true);
        setTimer(60);
        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(result.message || 'خطأ في تسجيل الدخول');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'فشل الاتصال بالخادم، يرجى التأكد من تشغيل backend';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('يرجى إدخال رمز التحقق بالكامل');
      return;
    }
    setLoading(true);
    const result = await verifyOtp(otpMail, otp);
    setLoading(false);
    if (result.success) {
      toast.success('تم التحقق وتسجيل الدخول بنجاح!');
      navigate('/');
    } else {
      toast.error(result.message || 'رمز التحقق غير صحيح');
    }
  };

  const handleResend = async () => {
    setLoading(true);
    const result = await resendOtp(otpMail);
    setLoading(false);
    if (result.success) {
      toast.success(result.message);
      setTimer(60);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      toast.error(result.message || 'فشل إعادة الإرسال');
    }
  };

  return (
    <div className="min-h-screen mesh-gradient-vibrant flex items-center justify-center py-6 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-primary-500/5 rounded-full blur-[60px] md:blur-[100px] -ml-24 md:-ml-64 -mt-24 md:-mt-64 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-accent/5 rounded-full blur-[60px] md:blur-[100px] -mr-24 md:-mr-64 -mb-24 md:-mb-64 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full relative z-10">
        <div className="glass-premium magnetic-lift overflow-hidden rounded-[2rem] md:rounded-[3rem] border-none shadow-premium-xl transition-all duration-500 hover:shadow-glow-primary">
          <div className="p-5 sm:p-8 md:p-12">
            <div className="text-center mb-6 md:mb-10">
              <Link to="/" className="inline-flex items-center justify-center mb-4 md:mb-6 hover:scale-110 transition-transform duration-500 group">
                <img src="/logo.png" alt="Jobify Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain group-hover:scale-105 transition-transform duration-300" />
              </Link>
              <h2 className="text-2xl md:text-4xl font-black themed-text tracking-tight mb-2 md:mb-3">
                {showOtpRequired ? 'تفعيل الحساب' : <>مرحباً بك <span className="text-primary-600">مجدداً</span></>}
              </h2>
              <p className="themed-text-sec font-bold opacity-80 text-xs md:text-base px-2">
                {showOtpRequired ? `أدخل الرمز المرسل إلى: ${otpMail}` : 'سجل دخولك للوصول إلى أفضل الفرص الوظيفية'}
              </p>
            </div>
            
            {!showOtpRequired ? (
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3 md:space-y-5">
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">
                    البريد الإلكتروني
                  </label>
                  <div className="relative group">
                    <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="formal-input px-12 rounded-xl md:rounded-2xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="password" name="password" className="block text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">
                    كلمة المرور
                  </label>
                  <div className="relative group">
                    <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="formal-input px-12 rounded-xl md:rounded-2xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pl-4 flex items-center text-themed-text-ter hover:text-primary-500 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="w-4 h-4 md:w-5 md:h-5 text-primary-600 border-themed-border bg-themed-bg-ter rounded md:rounded-lg focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="text-[10px] md:text-sm font-bold themed-text-sec cursor-pointer">
                    تذكرني
                  </label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-[10px] md:text-sm font-black text-primary-600 hover:text-primary-700 hover:underline transition-all"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-formal-primary shimmer-sweep py-3 md:py-4 text-sm md:text-lg h-11 md:h-14"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent"></div>
                    <span>جاري...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>تسجيل الدخول</span> <FiArrowRight className="rotate-180 text-lg md:text-xl" />
                  </div>
                )}
              </button>

              <div className="relative my-6 md:my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t themed-border opacity-50" />
                </div>
                <div className="relative flex justify-center text-[9px] md:text-xs font-black uppercase">
                  <span className="px-3 md:px-4 bg-themed-bg themed-text-ter tracking-widest">أو المتابعة باستخدام</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 md:gap-4">
                <SocialButton icon={<FcGoogle />} onClick={() => handleSocialLogin('google')} />
                <SocialButton icon={<FiLinkedin className="text-[#0A66C2]" />} onClick={() => handleSocialLogin('linkedin')} />
                <SocialButton icon={<FiGithub className="themed-text" />} onClick={() => handleSocialLogin('github')} />
                <SocialButton icon={<FiFacebook className="text-[#1877F2]" />} onClick={() => handleSocialLogin('facebook')} />
              </div>
            </form>
            ) : (
            <form className="space-y-6 md:space-y-8" onSubmit={handleVerify}>
              <div className="flex justify-center" dir="ltr">
                <input 
                  type="text" 
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="formal-input w-48 h-16 text-center text-3xl tracking-[0.5em] font-black rounded-2xl focus:ring-primary-500/50" 
                  placeholder="------"
                  autoFocus
                />
              </div>

              <div className="flex flex-col items-center gap-4 pt-4">
                <button type="submit" disabled={loading || otp.length !== 6} className="w-full btn-formal-primary shimmer-sweep py-4 text-lg h-14 flex items-center justify-center gap-2 rounded-2xl disabled:opacity-50">
                  {loading ? 'جاري التحقق...' : 'تأكيد الحساب'}
                </button>
                
                <button 
                  type="button" 
                  disabled={timer > 0 || loading} 
                  onClick={handleResend}
                  className="text-sm font-bold text-themed-text-ter hover:text-primary-600 disabled:opacity-50 transition-colors"
                >
                  {timer > 0 ? `إعادة الإرسال بعد ${timer} ثانية` : 'لم يصلك الرمز؟ أعد الإرسال'}
                </button>
              </div>
            </form>
            )}
          </div>
          
          {!showOtpRequired && (
          <div className="px-5 md:px-8 py-4 md:py-6 bg-primary-500/5 border-t themed-border text-center">
            <p className="themed-text-sec font-bold text-[11px] md:text-sm">
              ليس لديك حساب؟{' '}
              <Link
                to="/register"
                className="text-primary-600 font-black hover:text-primary-700 transition-all relative group inline-block"
              >
                أنشئ حساب جديد
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SocialButton = ({ icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-center p-4 rounded-2xl bg-themed-bg-ter border border-themed-border hover:border-primary-400 hover:bg-primary-500/10 hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-glow-sm group"
  >
    <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{icon}</span>
  </button>
);

export default Login;