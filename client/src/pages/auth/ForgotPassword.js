import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/forgotpassword', { email });
      if (response.data.success) {
        setSent(true);
        toast.success('تم إرسال رابط إعادة تعيين كلمة المرور');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ في إرسال البريد الإلكتروني');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen mesh-gradient-vibrant flex items-center justify-center py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
        <div className="max-w-md w-full relative z-10">
          <div className="glass-premium magnetic-lift overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border-none shadow-premium-xl text-center p-8 md:p-12">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-glow-sm">
              <FiCheckCircle className="text-3xl md:text-4xl" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black themed-text mb-4">تفقد بريدك الإلكتروني</h2>
            <p className="themed-text-sec font-bold mb-8 text-sm md:text-base">
              لقد أرسلنا تعليمات استعادة كلمة المرور إلى:<br/>
              <span className="text-primary-600 font-black">{email}</span>
            </p>
            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full btn-formal-primary py-3 md:py-4 flex items-center justify-center gap-2 text-base md:text-lg"
              >
                العودة لتسجيل الدخول
              </Link>
              <button
                onClick={() => setSent(false)}
                className="w-full py-2 text-themed-text-ter font-black hover:text-primary-600 transition-colors text-xs md:text-sm"
              >
                لم يصلك البريد؟ إرسال مرة أخرى
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-gradient-vibrant flex items-center justify-center py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary-500/10 rounded-full blur-[80px] md:blur-[120px] -ml-32 md:-ml-64 -mt-32 md:-mt-64"></div>
      <div className="absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-accent/10 rounded-full blur-[80px] md:blur-[120px] -mr-32 md:-mr-64 -mb-32 md:-mb-64"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="glass-premium magnetic-lift overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border-none shadow-premium-xl">
          <div className="p-8 md:p-12">
            <div className="text-center mb-8 md:mb-10">
              <Link to="/" className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-primary-600 rounded-2xl md:rounded-[2rem] shadow-glow-lg mb-6 hover:scale-110 transition-transform duration-500">
                <span className="text-white font-black text-3xl md:text-4xl">ت</span>
              </Link>
              <h2 className="text-3xl md:text-4xl font-black themed-text tracking-tight mb-3">
                استعادة <span className="text-primary-600">كلمة المرور</span>
              </h2>
              <p className="themed-text-sec font-bold opacity-80 text-sm md:text-base px-2">
                لا تقلق، سنساعدك على العودة إلى حسابك في ثوانٍ
              </p>
            </div>
            
            <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
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
                    className="formal-input pr-12 rounded-xl md:rounded-2xl focus:ring-primary-500/30 text-sm md:text-base"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-formal-primary shimmer-sweep py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2 shadow-glow-sm"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>جاري الإرسال...</span>
                  </div>
                ) : (
                  <><span>إرسال تعليمات الاستعادة</span> <FiArrowRight className="rotate-180 text-xl" /></>
                )}
              </button>
            </form>
          </div>
          
          <div className="px-6 md:px-8 py-5 md:py-6 bg-primary-500/5 border-t themed-border text-center">
            <p className="themed-text-sec font-bold text-xs md:text-sm">
              تذكرت كلمة المرور؟{' '}
              <Link
                to="/login"
                className="text-primary-600 font-black hover:text-primary-700 transition-all relative group inline-block"
              >
                تسجيل الدخول
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
