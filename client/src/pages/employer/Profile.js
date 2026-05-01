import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaBuilding, FaGlobe, FaUsers, FaMapMarkerAlt, FaCalendarAlt,
  FaEnvelope, FaPhone, FaLink, FaEdit, FaSave, FaCamera,
  FaLinkedin, FaTwitter, FaFacebook, FaBriefcase, FaChartLine,
  FaMagic, FaCheckCircle
} from 'react-icons/fa';
import { FiAward, FiStar, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { getFileUrl } from '../../utils/fileUrl';

const EmployerProfile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(getFileUrl(user?.employerProfile?.companyLogo));
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    companyName: user?.employerProfile?.companyName || '',
    companySize: user?.employerProfile?.companySize || '',
    industry: user?.employerProfile?.industry || '',
    companyDescription: user?.employerProfile?.companyDescription || '',
    companyWebsite: user?.employerProfile?.companyWebsite || '',
    establishedYear: user?.employerProfile?.establishedYear || '',
    headquarters: user?.employerProfile?.headquarters || '',
    location: {
      city: user?.profile?.location?.city || '',
      country: user?.profile?.location?.country || ''
    },
    socialLinks: {
      linkedin: user?.profile?.socialLinks?.linkedin || '',
      twitter: user?.profile?.socialLinks?.twitter || '',
      facebook: user?.profile?.socialLinks?.facebook || ''
    }
  });

  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Sync formData when user changes in context
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        companyName: user.employerProfile?.companyName || '',
        companySize: user.employerProfile?.companySize || '',
        industry: user.employerProfile?.industry || '',
        companyDescription: user.employerProfile?.companyDescription || '',
        companyWebsite: user.employerProfile?.companyWebsite || '',
        establishedYear: user.employerProfile?.establishedYear || '',
        headquarters: user.employerProfile?.headquarters || '',
        location: {
          city: user.profile?.location?.city || '',
          country: user.profile?.location?.country || ''
        },
        socialLinks: {
          linkedin: user.profile?.socialLinks?.linkedin || '',
          twitter: user.profile?.socialLinks?.twitter || '',
          facebook: user.profile?.socialLinks?.facebook || ''
        }
      });
      if (user.employerProfile?.companyLogo) setLogoPreview(getFileUrl(user.employerProfile.companyLogo));
    }
  }, [user]);

  const calculateCompletion = () => {
    let score = 0;
    const total = 8;
    if (formData.companyName) score++;
    if (formData.industry) score++;
    if (formData.companyDescription) score++;
    if (formData.companyWebsite) score++;
    if (formData.headquarters) score++;
    if (user?.employerProfile?.companyLogo) score++;
    if (formData.phone) score++;
    if (formData.socialLinks.linkedin) score++;
    return Math.round((score / total) * 100);
  };

  const generateAiDescription = async () => {
    if (!formData.companyName || !formData.industry) {
      toast.error('يرجى إدخال اسم الشركة والمجال أولاً');
      return;
    }

    setGeneratingDesc(true);
    try {
      const res = await axios.post('/api/ai/generate-job-description', {
        jobTitle: "وصف الشركة",
        industry: formData.industry,
        companyInfo: formData.companyName,
        keySkills: "الرؤية، الأهداف، بيئة العمل"
      });
      
      if (res.data.success) {
        let aiDescription = res.data.data.description || '';
        
        // Post-processing: Remove conversational filler and quotes
        const unwantedPhrases = [
          /إليك وصف الشركة[:\s]*/g,
          /وصف الشركة[:\s]*/g,
          /بالتأكيد، تفضل الوصف[:\s]*/g,
          /هذا هو الوصف المقترح[:\s]*/g,
          /^"|"$/g
        ];
        
        unwantedPhrases.forEach(regex => {
          aiDescription = aiDescription.replace(regex, '');
        });

        // Ensure single paragraph and clean Markdown
        aiDescription = aiDescription.replace(/```(json)?/g, '').replace(/\n+/g, ' ').trim();

        setFormData(prev => ({ ...prev, companyDescription: aiDescription }));
        toast.success('تم إنشاء وصف الشركة بنجاح');
      }
    } catch (err) {
      toast.error('فشل في توليد الوصف بالذكاء الاصطناعي');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      
      // Basic Info
      form.append('name', formData.name);
      form.append('phone', formData.phone);
      form.append('location', JSON.stringify(formData.location));
      form.append('socialLinks', JSON.stringify(formData.socialLinks));
      
      // Employer Specific Info
      form.append('employerProfile', JSON.stringify({
        companyName: formData.companyName,
        companySize: formData.companySize,
        industry: formData.industry,
        companyDescription: formData.companyDescription,
        companyWebsite: formData.companyWebsite,
        establishedYear: formData.establishedYear,
        headquarters: formData.headquarters
      }));

      if (logo) {
        form.append('avatar', logo); // Using avatar field for company logo for consistency
      }

      const res = await axios.put('/api/users/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setUser(res.data.data);
        toast.success('تم تحديث ملف الشركة بنجاح');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  const renderTabButton = (id, label, icon) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-8 py-4 font-black text-xs uppercase tracking-widest transition-all relative overflow-hidden ${
        activeTab === id 
          ? 'text-primary-600' 
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon}
      <span>{label}</span>
      {activeTab === id && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-accent rounded-full animate-fade-in"></div>
      )}
    </button>
  );

  return (
    <div className="min-h-screen mesh-bg pb-20 pt-6 md:pt-10" dir="rtl">
      <div className="premium-container max-w-6xl px-4 md:px-6">
        <div className="glass-premium overflow-hidden border-none shadow-premium-xl rounded-[2rem] md:rounded-[3rem]">
          {/* Header/Cover Area */}
          <div className="h-24 md:h-48 bg-gradient-to-br from-primary-600 to-accent relative overflow-hidden">
            <div className="absolute top-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full -ml-24 md:-ml-32 -mt-24 md:-mt-32 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-full h-16 md:h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
            
            {/* Completion Meter */}
            <div className="absolute top-4 left-4 sm:left-10 right-4 sm:right-10 z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
                  <FiAward /> اكتمال ملف الشركة
                </span>
                <span className="text-xs font-black text-white">{calculateCompletion()}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-md border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateCompletion()}%` }}
                  className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
              </div>
            </div>
          </div>
          
          <div className="px-5 md:px-10 pb-6 md:pb-10">
            <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-12 md:-mt-20 mb-8 md:mb-10 gap-5 md:gap-8">
              <div className="relative group shrink-0">
                <div className="w-28 h-28 md:w-40 md:h-40 rounded-[1.8rem] md:rounded-[2.5rem] border-4 md:border-8 border-white bg-white shadow-premium overflow-hidden rotate-3 group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <FaBuilding className="text-3xl md:text-5xl" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 p-3 md:p-4 bg-primary-600 text-white rounded-xl md:rounded-2xl shadow-glow cursor-pointer hover:bg-primary-700 transition-all hover:scale-110 active:scale-95 z-10 border-2 md:border-4 border-white">
                  <FaCamera className="text-xs md:text-base" />
                  <input type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                </label>
              </div>
              
              <div className="flex-1 text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary-500/10 text-primary-600 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-2 md:mb-3 border border-primary-500/20 mx-auto md:mr-0">
                  <FaBriefcase className="w-3 h-3" />
                  حساب مؤسسة معتمد
                </div>
                <h1 className="text-xl md:text-4xl font-black themed-text tracking-tight mb-1 md:mb-2">
                  {formData.companyName || 'اسم الشركة'}
                </h1>
                <p className="themed-text-sec font-bold flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-xs md:text-base">
                  <span className="flex items-center gap-1.5"><FaEnvelope className="text-primary-500 shrink-0" /> <span className="truncate max-w-[120px] md:max-w-none">{user?.email}</span></span>
                  <span className="flex items-center gap-1.5"><FaGlobe className="text-primary-500 shrink-0" /> <span className="truncate max-w-[120px] md:max-w-none">{formData.companyWebsite || 'الموقع الإلكتروني'}</span></span>
                </p>
              </div>

              <div className="flex gap-4 w-full md:w-auto justify-center">
                <div className="glass-premium px-4 md:px-6 py-2 md:py-3 text-center flex-1 md:flex-none magnetic-lift border-primary-100/20">
                  <div className="text-lg md:text-2xl font-black text-primary-600">{user?.stats?.jobsPosted || 0}</div>
                  <div className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter">وظيفة منشورة</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b themed-border mb-6 md:mb-10 overflow-x-auto no-scrollbar scroll-smooth -mx-5 md:mx-0 px-5 md:px-0">
              {renderTabButton('company', 'الشركة', <FaBuilding className="text-sm md:text-lg shrink-0" />)}
              {renderTabButton('contact', 'التواصل', <FaPhone className="text-sm md:text-lg shrink-0" />)}
              {renderTabButton('social', 'المنصات', <FaChartLine className="text-sm md:text-lg shrink-0" />)}
            </div>

            {/* Content Container */}
            <form onSubmit={handleSubmit} className="animate-fade-in space-y-8 md:space-y-10">
              {activeTab === 'company' && (
                <div className="space-y-6 md:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mr-1">اسم الشركة الرسمي</label>
                      <div className="relative group">
                        <FaBuilding className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="premium-input pr-11 md:pr-12 text-sm md:text-base h-11 md:h-14"
                          placeholder="مثلاً: شركة التقنية الحديثة"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">المجال الصناعي</label>
                      <div className="relative group">
                        <FaBriefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                        <select
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          className="premium-input pr-12 appearance-none"
                        >
                          <option value="">اختر المجال</option>
                          <option value="IT">تكنولوجيا المعلومات</option>
                          <option value="Finance">المالية والمصرفية</option>
                          <option value="Healthcare">الرعاية الصحية</option>
                          <option value="Education">التعليم</option>
                          <option value="Construction">الإنشاءات</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">حجم الشركة</label>
                      <div className="relative group">
                        <FaUsers className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                        <select
                          name="companySize"
                          value={formData.companySize}
                          onChange={handleInputChange}
                          className="premium-input pr-12 appearance-none"
                        >
                          <option value="">اختر حجم الشركة</option>
                          <option value="1-10">1-10 موظفين</option>
                          <option value="11-50">11-50 موظف</option>
                          <option value="51-200">51-200 موظف</option>
                          <option value="201-500">201-500 موظف</option>
                          <option value="500+">أكثر من 500 موظف</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">سنة التأسيس</label>
                      <div className="relative group">
                        <FaCalendarAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          type="number"
                          name="establishedYear"
                          value={formData.establishedYear}
                          onChange={handleInputChange}
                          className="premium-input pr-12"
                          placeholder="2020"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mr-1">وصف الشركة (نبذة تعريفية)</label>
                      <button 
                        type="button" 
                        onClick={generateAiDescription}
                        disabled={generatingDesc}
                        className="text-[10px] font-black text-primary-600 flex items-center gap-1.5 px-3 py-1 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all border border-primary-100 shadow-sm"
                      >
                        {generatingDesc ? (
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            جاري التوليد...
                          </span>
                        ) : (
                          <>
                            <FaMagic className="text-primary-500" /> توليد بالذكاء الاصطناعي
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      name="companyDescription"
                      value={formData.companyDescription}
                      onChange={handleInputChange}
                      rows="5"
                      className="premium-input resize-none"
                      placeholder="تحدث عن رؤية شركتكم، أهدافكم، وبيئة العمل لديكم..."
                    ></textarea>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">الموقع الإلكتروني</label>
                      <div className="relative group">
                        <FaGlobe className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          type="url"
                          name="companyWebsite"
                          value={formData.companyWebsite}
                          onChange={handleInputChange}
                          className="premium-input pr-12"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">رقم التواصل</label>
                      <div className="relative group">
                        <FaPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="premium-input pr-12"
                          placeholder="+967 ..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">المقر الرئيسي</label>
                      <div className="relative group">
                        <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          type="text"
                          name="headquarters"
                          value={formData.headquarters}
                          onChange={handleInputChange}
                          className="premium-input pr-12"
                          placeholder="صنعاء - شارع الستين"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">المدينة / الدولة</label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="location.city"
                          value={formData.location.city}
                          onChange={handleInputChange}
                          className="premium-input"
                          placeholder="المدينة"
                        />
                        <input
                          type="text"
                          name="location.country"
                          value={formData.location.country}
                          onChange={handleInputChange}
                          className="premium-input"
                          placeholder="الدولة"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">رابط LinkedIn</label>
                      <div className="relative group">
                        <FaLinkedin className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0077b5]" />
                        <input
                          type="url"
                          name="socialLinks.linkedin"
                          value={formData.socialLinks.linkedin}
                          onChange={handleInputChange}
                          className="premium-input pr-12"
                          placeholder="https://linkedin.com/company/..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">رابط Twitter (X)</label>
                      <div className="relative group">
                        <FaTwitter className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1da1f2]" />
                        <input
                          type="url"
                          name="socialLinks.twitter"
                          value={formData.socialLinks.twitter}
                          onChange={handleInputChange}
                          className="premium-input pr-12"
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">رابط Facebook</label>
                      <div className="relative group">
                        <FaFacebook className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1877f2]" />
                        <input
                          type="url"
                          name="socialLinks.facebook"
                          value={formData.socialLinks.facebook}
                          onChange={handleInputChange}
                          className="premium-input pr-12"
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <div className="pt-6 md:pt-10 border-t themed-border flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto btn-premium-outline px-8 md:px-10 py-3 md:py-4 text-sm md:text-base order-2 sm:order-1"
              >
                إلغاء التعديلات
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto btn-premium-primary px-10 md:px-16 py-3.5 md:py-4 shadow-glow flex items-center justify-center gap-3 text-sm md:text-base order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 md:h-5 w-4 md:w-5 border-b-2 border-white"></div>
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="text-sm md:text-xl" />
                    <span>حفظ التغييرات الاستراتيجية</span>
                  </>
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerProfile;
