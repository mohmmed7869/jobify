import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, 
  FiShield, FiBriefcase, FiPhone, FiCamera, FiUpload,
  FiLinkedin, FiGithub, FiFacebook, FiChevronRight, FiChevronLeft,
  FiLayers
} from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const countries = [
  { code: 'YE', key: '+967', name: 'اليمن', flag: '🇾🇪' },
  { code: 'SA', key: '+966', name: 'السعودية', flag: '🇸🇦' },
  { code: 'AE', key: '+971', name: 'الإمارات', flag: '🇦🇪' },
  { code: 'EG', key: '+20', name: 'مصر', flag: '🇪🇬' },
  { code: 'JO', key: '+962', name: 'الأردن', flag: '🇯🇴' },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+967',
    password: '',
    confirmPassword: '',
    role: 'jobseeker',
    companyName: '',
    industry: '',
    size: '',
    address: '',
    description: ''
  });

  const [files, setFiles] = useState({
    avatar: null,
    idCardImage: null
  });

  const [previews, setPreviews] = useState({
    avatar: null,
    idCardImage: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      const file = selectedFiles[0];
      setFiles({ ...files, [name]: file });
      setPreviews({ ...previews, [name]: URL.createObjectURL(file) });
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        toast.error('يرجى إكمال البيانات الأساسية');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('كلمات المرور غير متطابقة');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من حجم الملفات قبل الرفع
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (files.avatar && files.avatar.size > MAX_FILE_SIZE) {
      toast.error('حجم الصورة الشخصية يجب أن يكون أقل من 5 ميجابايت');
      return;
    }
    if (files.idCardImage && files.idCardImage.size > MAX_FILE_SIZE) {
      toast.error('حجم صورة الهوية يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (files.avatar) data.append('avatar', files.avatar);
      if (files.idCardImage) data.append('idCardImage', files.idCardImage);

      const result = await register(data);
      
      if (result.success) {
        toast.success('تم إنشاء الحساب بنجاح. يرجى تفعيل بريدك الإلكتروني');
        navigate('/login');
      } else {
        toast.error(result.message || 'خطأ في إنشاء الحساب');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = (provider) => {
    const backendUrl = process.env.REACT_APP_API_URL || window.location.origin;
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen mesh-gradient-vibrant flex items-center justify-center py-6 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-primary-500/10 rounded-full blur-[60px] md:blur-[120px] -mr-24 md:-mr-64 -mt-24 md:-mt-64 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-accent/10 rounded-full blur-[60px] md:blur-[120px] -ml-24 md:-ml-64 -mb-24 md:-mb-64 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-2xl w-full relative z-10">
        <div className="text-center mb-6 md:mb-8 px-4">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary-600 rounded-2xl shadow-glow-lg mb-4 hover:scale-110 transition-transform duration-500 group">
            <span className="text-white font-black text-xl md:text-3xl group-hover:rotate-12 transition-transform">ت</span>
          </Link>
          <h2 className="text-2xl md:text-4xl font-black themed-text tracking-tight">إنشاء حساب جديد</h2>
          <p className="themed-text-sec font-bold mt-2 opacity-80 text-xs md:text-base">انضم إلى أكبر منصة توظيف ذكية في اليمن</p>
        </div>

        <div className="glass-premium magnetic-lift overflow-hidden border-none rounded-[1.5rem] md:rounded-[2.5rem] shadow-premium-xl transition-all duration-500 hover:shadow-glow-primary">
          {/* Progress Bar */}
          <div className="h-1 md:h-2 w-full bg-themed-bg-ter flex">
            <div 
              className="h-full bg-primary-600 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all duration-700 ease-out" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 md:space-y-6"
                >
                  <div className="text-center mb-4 md:mb-8">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">الخطوة الأولى</span>
                    <h3 className="text-lg md:text-2xl font-black themed-text mt-3 md:mt-4">المعلومات الأساسية</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">الاسم الكامل</label>
                      <div className="relative group">
                        <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                        <input 
                          type="text" name="name" required value={formData.name} onChange={handleChange}
                          className="formal-input pr-11 md:pr-12 rounded-xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14" placeholder="أدخل اسمك كما في الهوية" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">البريد الإلكتروني</label>
                      <div className="relative group">
                        <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                        <input 
                          type="email" name="email" required value={formData.email} onChange={handleChange}
                          className="formal-input pr-11 md:pr-12 rounded-xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14" placeholder="example@domain.com" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">كلمة المرور</label>
                        <div className="relative group">
                          <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                          <input 
                            type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange}
                            className="formal-input pr-11 md:pr-12 pl-11 md:pl-12 rounded-xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14" placeholder="••••••••" 
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-themed-text-ter hover:text-primary-500 transition-colors">
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">تأكيد كلمة المرور</label>
                        <div className="relative group">
                          <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                          <input 
                            type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                            className="formal-input pr-11 md:pr-12 rounded-xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14" placeholder="••••••••" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 md:pt-6">
                    <button type="button" onClick={nextStep} className="w-full btn-formal-primary shimmer-sweep py-3 md:py-4 text-sm md:text-lg h-11 md:h-14 flex items-center justify-center gap-2">
                      متابعة <FiChevronLeft className="text-lg md:text-xl" />
                    </button>
                  </div>

                  <div className="relative my-6 md:my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t themed-border opacity-50"></div></div>
                    <div className="relative flex justify-center text-[9px] md:text-xs uppercase"><span className="px-3 md:px-4 bg-themed-bg themed-text-ter font-bold tracking-widest">أو التسجيل عبر</span></div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 md:gap-3">
                    <SocialBtn icon={<FaGoogle className="text-[#EA4335]" />} onClick={() => socialLogin('google')} />
                    <SocialBtn icon={<FiLinkedin className="text-[#0A66C2]" />} onClick={() => socialLogin('linkedin')} />
                    <SocialBtn icon={<FiGithub className="themed-text" />} onClick={() => socialLogin('github')} />
                    <SocialBtn icon={<FiFacebook className="text-[#1877F2]" />} onClick={() => socialLogin('facebook')} />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-5 md:space-y-6"
                >
                  <div className="text-center mb-4 md:mb-8">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">الخطوة الثانية</span>
                    <h3 className="text-lg md:text-2xl font-black themed-text mt-3 md:mt-4">تفاصيل الحساب</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">نوع الحساب</label>
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <button 
                          type="button" onClick={() => setFormData({...formData, role: 'jobseeker'})}
                          className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 group ${formData.role === 'jobseeker' ? 'border-primary-500 bg-primary-500/10 text-primary-600 shadow-glow-sm' : 'border-themed-border text-themed-text-ter hover:border-primary-300 hover:bg-primary-500/5'}`}
                        >
                          <div className={`p-2 md:p-3 rounded-xl transition-all ${formData.role === 'jobseeker' ? 'bg-primary-500 text-white' : 'bg-themed-bg-ter text-themed-text-ter group-hover:bg-primary-100'}`}>
                            <FiUser className="text-lg md:text-2xl" />
                          </div>
                          <span className="font-black text-[10px] md:text-sm">باحث عن عمل</span>
                        </button>
                        <button 
                          type="button" onClick={() => setFormData({...formData, role: 'employer'})}
                          className={`p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 group ${formData.role === 'employer' ? 'border-primary-500 bg-primary-500/10 text-primary-600 shadow-glow-sm' : 'border-themed-border text-themed-text-ter hover:border-primary-300 hover:bg-primary-500/5'}`}
                        >
                          <div className={`p-2 md:p-3 rounded-xl transition-all ${formData.role === 'employer' ? 'bg-primary-500 text-white' : 'bg-themed-bg-ter text-themed-text-ter group-hover:bg-primary-100'}`}>
                            <FiBriefcase className="text-lg md:text-2xl" />
                          </div>
                          <span className="font-black text-[10px] md:text-sm">صاحب عمل</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">رقم الهاتف</label>
                      <div className="flex gap-2">
                        <div className="relative group min-w-[80px] md:min-w-[100px]">
                          <select 
                            name="countryCode" 
                            value={formData.countryCode} 
                            onChange={handleChange}
                            className="formal-input pr-1 rounded-xl focus:ring-primary-500/30 text-[10px] md:text-xs font-bold bg-themed-bg-ter border-themed-border appearance-none cursor-pointer text-center h-11 md:h-14"
                          >
                            {countries.map(c => (
                              <option key={c.code} value={c.key}>{c.flag} {c.key}</option>
                            ))}
                          </select>
                        </div>
                        <div className="relative group flex-1">
                          <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                          <input 
                            type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                            className="formal-input pr-11 md:pr-12 text-left rounded-xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14" placeholder="7XXXXXXXX" dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {formData.role === 'employer' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">اسم الشركة</label>
                          <div className="relative group">
                            <FiBriefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                            <input 
                              type="text" name="companyName" required={formData.role === 'employer'} value={formData.companyName} onChange={handleChange}
                              className="formal-input pr-11 md:pr-12 rounded-xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14" placeholder="اسم شركتك أو مؤسستك" 
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] md:text-xs font-black themed-text-sec mr-1 uppercase opacity-70">مجال العمل</label>
                          <div className="relative group">
                            <FiLayers className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                            <input 
                              type="text" name="industry" value={formData.industry} onChange={handleChange} 
                              className="formal-input pr-11 md:pr-12 rounded-xl focus:ring-primary-500/30 text-sm md:text-base h-11 md:h-14" placeholder="مثلاً: تكنولوجيا المعلومات" 
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6">
                    <button type="button" onClick={prevStep} className="w-full sm:flex-1 btn-formal-tertiary py-3 md:py-4 text-sm md:text-lg h-11 md:h-14 flex items-center justify-center gap-2">
                      <FiChevronRight className="text-lg md:text-xl" /> السابق
                    </button>
                    <button type="button" onClick={nextStep} className="w-full sm:flex-[2] btn-formal-primary shimmer-sweep py-3 md:py-4 text-sm md:text-lg h-11 md:h-14 flex items-center justify-center gap-2">
                      متابعة <FiChevronLeft className="text-lg md:text-xl" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-5 md:space-y-6"
                >
                  <div className="text-center mb-4 md:mb-8">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">الخطوة الأخيرة</span>
                    <h3 className="text-lg md:text-2xl font-black themed-text mt-3 md:mt-4">التوثيق والهوية</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3 md:space-y-4 text-center">
                      <label className="text-[10px] md:text-xs font-black themed-text-sec uppercase tracking-widest block opacity-70">الصورة الشخصية</label>
                      <div className="relative inline-block group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[2.5rem] bg-themed-bg-ter border-4 border-white/50 shadow-premium-lg overflow-hidden mx-auto flex items-center justify-center group-hover:border-primary-400 transition-all duration-500">
                          {previews.avatar ? (
                            <img src={previews.avatar} alt="Avatar" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500" />
                          ) : (
                            <FiUser size={32} className="text-themed-text-ter md:hidden" />
                          )}
                          {!previews.avatar && <FiUser size={40} className="text-themed-text-ter hidden md:block" />}
                        </div>
                        <label className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-primary-600 text-white rounded-lg md:rounded-xl shadow-glow-lg flex items-center justify-center cursor-pointer hover:bg-primary-700 hover:scale-110 transition-all border-2 border-white">
                          <FiCamera className="text-sm md:text-base" />
                          <input type="file" name="avatar" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                      </div>
                      <p className="text-[9px] md:text-[10px] themed-text-ter font-bold">يفضل صورة احترافية بخلفية سادة</p>
                    </div>

                    <div className="space-y-3 md:space-y-4 text-center">
                      <label className="text-[10px] md:text-xs font-black themed-text-sec uppercase tracking-widest block opacity-70">بطاقة الهوية (اختياري)</label>
                      <div className="relative group">
                        <div className={`w-full h-24 md:h-32 rounded-2xl md:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 ${previews.idCardImage ? 'border-primary-500 bg-primary-500/10' : 'border-themed-border bg-themed-bg-ter group-hover:border-primary-400'}`}>
                          {previews.idCardImage ? (
                            <img src={previews.idCardImage} alt="ID" className="h-full w-full object-cover rounded-2xl md:rounded-3xl" />
                          ) : (
                            <>
                              <FiUpload className="text-themed-text-ter mb-1 md:mb-2 text-xl md:text-2xl" />
                              <span className="text-[9px] md:text-[10px] font-black text-themed-text-ter">اسحب أو اضغط للرفع</span>
                            </>
                          )}
                          <input type="file" name="idCardImage" className="hidden" id="id-card-input" onChange={handleFileChange} accept="image/*" />
                        </div>
                        <label htmlFor="id-card-input" className="absolute inset-0 cursor-pointer"></label>
                      </div>
                      <p className="text-[9px] md:text-[10px] themed-text-ter font-bold">تساعد في توثيق حسابك وزيادة الثقة</p>
                    </div>
                  </div>

                  <div className="bg-primary-500/5 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-primary-500/10">
                    <div className="flex items-start gap-3 md:gap-4">
                      <input type="checkbox" required className="mt-1 w-4 h-4 md:w-5 md:h-5 text-primary-600 rounded md:rounded-lg focus:ring-primary-500 bg-themed-bg-ter border-themed-border" />
                      <p className="text-[10px] md:text-xs font-bold themed-text-sec leading-relaxed">
                        أوافق على <Link className="text-primary-600 font-black hover:underline underline-offset-4">شروط الاستخدام</Link> و <Link className="text-primary-600 font-black hover:underline underline-offset-4">سياسة الخصوصية</Link> وأؤكد صحة البيانات المدخلة.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6">
                    <button type="button" onClick={prevStep} className="w-full sm:flex-1 btn-formal-tertiary py-3 md:py-4 text-sm md:text-lg h-11 md:h-14 flex items-center justify-center gap-2">
                      السابق
                    </button>
                    <button type="submit" disabled={loading} className="w-full sm:flex-[2] btn-formal-primary shimmer-sweep py-3 md:py-4 text-sm md:text-lg h-11 md:h-14 flex items-center justify-center gap-2">
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>جاري...</span>
                        </div>
                      ) : (
                        <>إنشاء الحساب <FiShield className="text-lg md:text-xl" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        <p className="text-center mt-6 md:mt-8 themed-text-sec font-bold text-[11px] md:text-sm">
          لديك حساب بالفعل؟ <Link to="/login" className="text-primary-600 font-black hover:underline underline-offset-8 transition-all">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
};

const SocialBtn = ({ icon, onClick }) => (
  <button 
    type="button" onClick={onClick}
    className="flex items-center justify-center p-4 rounded-2xl bg-themed-bg-ter border border-themed-border hover:border-primary-400 hover:bg-primary-500/10 hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-glow-sm group"
  >
    <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{icon}</span>
  </button>
);

export default Register;