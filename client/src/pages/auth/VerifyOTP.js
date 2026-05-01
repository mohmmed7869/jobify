import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiShield, FiRefreshCw, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(true);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp } = useAuth();

  // الحصول على البريد من state أو params
  const email = location.state?.email || new URLSearchParams(location.search).get('email') || '';
  const isFromRegister = location.state?.fromRegister || false;

  // إعادة التوجيه إذا لم يكن هناك بريد
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  // مؤقت العداد
  useEffect(() => {
    if (!timerActive || timer <= 0) {
      setTimerActive(false);
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // معالجة إدخال الأرقام
  const handleInput = useCallback((index, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned && value !== '') return;

    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // لصق عدة أرقام
      const pasted = cleaned.slice(0, 6);
      const filled = pasted.split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = filled[i] || '';
      }
      setOtp(newOtp);
      const lastIndex = Math.min(pasted.length, 5);
      inputRefs.current[lastIndex]?.focus();
    } else {
      newOtp[index] = cleaned;
      setOtp(newOtp);
      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  }, [otp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowRight' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = pasted.split('');
      while (newOtp.length < 6) newOtp.push('');
      setOtp(newOtp);
      const lastFilled = Math.min(pasted.length - 1, 5);
      inputRefs.current[lastFilled]?.focus();
    }
  }, []);

  const otpValue = otp.join('');
  const isComplete = otpValue.length === 6;

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!isComplete) {
      toast.error('يرجى إدخال كود التحقق كاملاً (6 أرقام)');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(email, otpValue);
    setLoading(false);

    if (result.success) {
      setVerified(true);
      toast.success('تم التحقق بنجاح! مرحباً بك 🎉', { duration: 3000 });
      let redirectPath = '/';
      const userRole = result.user?.role;
      if (userRole === 'jobseeker') {
        redirectPath = '/dashboard';
      } else if (userRole === 'employer' || userRole === 'company') {
        redirectPath = '/employer/dashboard';
      } else if (userRole === 'admin') {
        redirectPath = '/admin/dashboard';
      }
      setTimeout(() => navigate(redirectPath), 1500);
    } else {
      toast.error(result.message || 'كود التحقق غير صحيح');
      // مسح الأرقام والبدء من جديد
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    const result = await resendOtp(email);
    setResendLoading(false);

    if (result.success) {
      toast.success('تم إرسال كود جديد إلى بريدك الإلكتروني ✉️');
      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      setTimerActive(true);
      inputRefs.current[0]?.focus();
    } else {
      toast.error(result.message || 'فشل في إعادة الإرسال');
    }
  };

  // شاشة النجاح
  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent/10 p-4" dir="rtl">
        <div className="text-center">
          <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <FiCheckCircle className="text-emerald-500 text-6xl" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">تم التحقق بنجاح!</h2>
          <p className="text-slate-500 font-medium">جاري تحويلك للصفحة الرئيسية...</p>
          <div className="mt-6 w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}
      dir="rtl"
    >
      {/* خلفية زخرفية */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-400/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-white overflow-hidden">

          {/* ترويسة ملونة */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-4 w-24 h-24 border-2 border-white rounded-full" />
              <div className="absolute bottom-2 left-4 w-16 h-16 border-2 border-white rounded-full" />
            </div>
            <Link to="/" className="flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Jobify" className="w-14 h-14 object-contain drop-shadow-lg" />
            </Link>
            <div className="flex items-center justify-center gap-2 mb-3">
              <FiShield size={22} className="text-primary-200" />
              <h1 className="text-2xl font-black tracking-tight">التحقق من الهوية</h1>
            </div>
            <p className="text-primary-100 text-sm font-medium leading-relaxed">
              {isFromRegister ? 'مرحباً! قم بتفعيل حسابك الجديد' : 'أدخل كود التحقق لتسجيل الدخول'}
            </p>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="p-8">
            {/* معلومات البريد */}
            <div className="flex items-center gap-3 mb-7 p-4 bg-primary-50 rounded-2xl border border-primary-100">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <FiMail className="text-primary-600 text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-0.5">تم الإرسال إلى</p>
                <p className="text-sm font-black text-slate-800 truncate dir-ltr text-right">{email}</p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">

              {/* خانات OTP */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 text-center">
                  أدخل الكود المكون من 6 أرقام
                </label>
                <div className="flex gap-2.5 justify-center" dir="ltr">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleInput(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      onFocus={(e) => e.target.select()}
                      className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all duration-200 ${
                        digit
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-lg shadow-primary-200/50'
                          : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-primary-400 focus:bg-white focus:shadow-md'
                      }`}
                      style={{ caretColor: 'transparent' }}
                    />
                  ))}
                </div>

                {/* شريط التقدم */}
                <div className="flex gap-1.5 justify-center mt-4">
                  {otp.map((digit, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        digit ? 'w-6 bg-primary-500' : 'w-3 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* زر التحقق */}
              <button
                type="submit"
                disabled={!isComplete || loading}
                className={`w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all duration-300 ${
                  isComplete && !loading
                    ? 'bg-gradient-to-l from-primary-700 to-primary-500 hover:shadow-lg hover:shadow-primary-200 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <FiShield size={18} />
                    تأكيد الكود
                    <FiArrowRight size={16} className="rotate-180" />
                  </>
                )}
              </button>

              {/* إعادة الإرسال */}
              <div className="text-center pt-2">
                {timerActive ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-slate-400 font-bold">يمكنك طلب كود جديد بعد</p>
                    <div className="flex items-center gap-2 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                      <div className="relative w-7 h-7">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 28 28">
                          <circle cx="14" cy="14" r="12" fill="none" stroke="#e2e8f0" strokeWidth="2" />
                          <circle
                            cx="14" cy="14" r="12" fill="none"
                            stroke="#6366f1" strokeWidth="2"
                            strokeDasharray={`${(timer / 60) * 75.4} 75.4`}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s linear' }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-primary-600">
                          {timer}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-600">ثانية</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="flex items-center justify-center gap-2 mx-auto text-sm font-black text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-6 py-2.5 rounded-2xl transition-all disabled:opacity-50"
                  >
                    <FiRefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
                    {resendLoading ? 'جاري الإرسال...' : 'إرسال كود جديد'}
                  </button>
                )}
              </div>
            </form>

            {/* ملاحظة */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                إذا لم يصلك الكود، تحقق من مجلد{' '}
                <span className="font-black text-slate-600">البريد العشوائي (Spam)</span>
              </p>
              <Link to="/login" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-primary-600 transition-all">
                <FiArrowRight size={13} />
                العودة لتسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
