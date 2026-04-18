import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(`/api/auth/resetpassword/${token}`, {
        password: formData.password
      });
      
      if (response.data.success) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ في تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient-vibrant flex items-center justify-center py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary-500/10 rounded-full blur-[80px] md:blur-[120px] -mr-32 md:-mr-64 -mt-32 md:-mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-accent/10 rounded-full blur-[80px] md:blur-[120px] -ml-32 md:-ml-64 -mb-32 md:-mb-64"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="glass-premium magnetic-lift overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border-none shadow-premium-xl">
          <div className="p-8 md:p-12">
            <div className="text-center mb-8 md:mb-10">
              <Link to="/" className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-primary-600 rounded-2xl md:rounded-[2rem] shadow-glow-lg mb-6 hover:scale-110 transition-transform duration-500">
                <span className="text-white font-black text-3xl md:text-4xl">ت</span>
              </Link>
              <h2 className="text-3xl md:text-4xl font-black themed-text tracking-tight mb-3">
                تعيين <span className="text-primary-600">كلمة مرور جديدة</span>
              </h2>
              <p className="themed-text-sec font-bold opacity-80 text-sm md:text-base px-2">
                قم بإنشاء كلمة مرور قوية لحماية حسابك الاستراتيجي
              </p>
            </div>
            
            <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="space-y-1">
                  <label htmlFor="password" name="password" className="block text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative group">
                    <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="formal-input pr-12 pl-12 rounded-xl md:rounded-2xl focus:ring-primary-500/30 text-sm md:text-base"
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

                <div className="space-y-1">
                  <label htmlFor="confirmPassword" name="confirmPassword" className="block text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative group">
                    <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="formal-input pr-12 pl-12 rounded-xl md:rounded-2xl focus:ring-primary-500/30 text-sm md:text-base"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pl-4 flex items-center text-themed-text-ter hover:text-primary-500 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-primary-500/5 p-4 rounded-2xl flex items-start gap-3 border border-primary-500/10">
                <FiShield className="text-primary-600 mt-1 shrink-0" />
                <p className="text-[10px] font-bold themed-text-sec leading-relaxed opacity-80">
                  تأكد من أن كلمة المرور تحتوي على أحرف كبيرة وصغيرة وأرقام لضمان أعلى مستوى من الأمان لحسابك.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-formal-primary shimmer-sweep py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2 shadow-glow-sm"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>جاري التحديث...</span>
                  </div>
                ) : (
                  <><span>تحديث كلمة المرور</span> <FiArrowRight className="rotate-180 text-xl" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
