import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiBriefcase, FiMapPin, FiDollarSign, FiType, 
  FiFileText, FiList, FiPlus, FiX, FiCheck, 
  FiCpu, FiTarget, FiArrowLeft, FiArrowRight,
  FiActivity, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PostJob = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'دوام كامل',
    category: '',
    experienceLevel: 'متوسط',
    location: { city: '', country: 'اليمن', remote: false },
    salary: { min: '', max: '', currency: 'USD', negotiable: false },
    requirements: { skills: [], education: '', experience: '' },
    responsibilities: [''],
    benefits: [''],
    aiSettings: {
      enableAutoScreening: true,
      screeningCriteria: { requiredSkills: [], minimumExperience: 0 }
    }
  });

  useEffect(() => {
    if (isEdit) {
      const fetchJob = async () => {
        try {
          const res = await axios.get(`/api/jobs/${id}`);
          const job = res.data.data;
          // تكييف البيانات المستلمة مع هيكل النموذج
          setFormData({
            title: job.title || '',
            description: job.description || '',
            jobType: job.jobType || 'دوام كامل',
            category: job.category || '',
            experienceLevel: job.experienceLevel || 'متوسط',
            location: {
              city: job.location?.city || '',
              country: job.location?.country || 'اليمن',
              remote: job.location?.remote || false
            },
            salary: {
              min: job.salary?.min || '',
              max: job.salary?.max || '',
              currency: job.salary?.currency || 'USD',
              negotiable: job.salary?.negotiable || false
            },
            requirements: {
              skills: job.requirements?.skills || [],
              education: job.requirements?.education || '',
              experience: job.requirements?.experience || ''
            },
            responsibilities: job.responsibilities?.length > 0 ? job.responsibilities : [''],
            benefits: job.benefits?.length > 0 ? job.benefits : [''],
            aiSettings: {
              enableAutoScreening: job.aiSettings?.enableAutoScreening ?? true,
              screeningCriteria: {
                requiredSkills: job.aiSettings?.screeningCriteria?.requiredSkills || [],
                minimumExperience: job.aiSettings?.screeningCriteria?.minimumExperience || 0
              }
            }
          });
        } catch (error) {
          toast.error('خطأ في تحميل بيانات الوظيفة');
          navigate('/employer/jobs');
        } finally {
          setFetching(false);
        }
      };
      fetchJob();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
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

  const handleListChange = (index, value, type) => {
    const newList = [...formData[type]];
    newList[index] = value;
    setFormData(prev => ({ ...prev, [type]: newList }));
  };

  const addListItem = (type) => {
    setFormData(prev => ({ ...prev, [type]: [...prev[type], ''] }));
  };

  const removeListItem = (index, type) => {
    const newList = formData[type].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [type]: newList }));
  };

  const [skillInput, setSkillInput] = useState('');
  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.requirements.skills.includes(skillInput.trim())) {
        setFormData(prev => ({
          ...prev,
          requirements: {
            ...prev.requirements,
            skills: [...prev.requirements.skills, skillInput.trim()]
          }
        }));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        skills: prev.requirements.skills.filter(s => s !== skill)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/api/jobs/${id}`, formData);
        toast.success('تم تحديث الوظيفة بنجاح');
      } else {
        await axios.post('/api/jobs', formData);
        toast.success('تم نشر الوظيفة بنجاح');
      }
      navigate('/employer/jobs');
    } catch (error) {
      toast.error(error.response?.data?.message || `خطأ في ${isEdit ? 'تحديث' : 'نشر'} الوظيفة`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 md:space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-black themed-text-sec mr-1 flex items-center gap-2 uppercase opacity-70">
                  <FiType className="text-primary-500" /> عنوان الوظيفة
                </label>
                <input
                  required
                  name="title"
                  className="formal-input rounded-xl md:rounded-2xl"
                  placeholder="مثلاً: مطور برمجيات خبير"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-black themed-text-sec mr-1 flex items-center gap-2 uppercase opacity-70">
                  <FiList className="text-primary-500" /> التصنيف
                </label>
                <input
                  required
                  name="category"
                  className="formal-input rounded-xl md:rounded-2xl"
                  placeholder="مثلاً: تكنولوجيا المعلومات"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-black themed-text-sec mr-1 uppercase opacity-70">نوع الدوام</label>
                <select name="jobType" className="formal-input rounded-xl md:rounded-2xl appearance-none" value={formData.jobType} onChange={handleChange}>
                  <option>دوام كامل</option>
                  <option>دوام جزئي</option>
                  <option>عقد</option>
                  <option>تدريب</option>
                  <option>عمل حر</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-black themed-text-sec mr-1 uppercase opacity-70">مستوى الخبرة</label>
                <select name="experienceLevel" className="formal-input rounded-xl md:rounded-2xl appearance-none" value={formData.experienceLevel} onChange={handleChange}>
                  <option>مبتدئ</option>
                  <option>متوسط</option>
                  <option>خبير</option>
                  <option>مدير</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-black themed-text-sec mr-1 flex items-center gap-2 uppercase opacity-70">
                <FiFileText className="text-primary-500" /> وصف الوظيفة
              </label>
              <textarea
                required
                name="description"
                rows="5"
                className="formal-input rounded-xl md:rounded-3xl py-4"
                placeholder="اشرح تفاصيل الوظيفة والمهام المطلوبة..."
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 md:space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-black themed-text-sec mr-1 flex items-center gap-2 uppercase opacity-70">
                  <FiMapPin className="text-primary-500" /> المدينة
                </label>
                <input
                  name="location.city"
                  className="formal-input rounded-xl md:rounded-2xl"
                  placeholder="صنعاء، عدن..."
                  value={formData.location.city}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-black themed-text-sec mr-1 uppercase opacity-70">العمل عن بعد؟</label>
                <div className="flex items-center gap-4 p-4 glass-premium rounded-xl md:rounded-2xl bg-primary-500/5 border-primary-500/10">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary-600 rounded-lg focus:ring-primary-500/30 cursor-pointer"
                    checked={formData.location.remote}
                    onChange={(e) => setFormData(prev => ({
                      ...prev, 
                      location: { ...prev.location, remote: e.target.checked }
                    }))}
                  />
                  <span className="text-xs md:text-sm font-bold themed-text-sec opacity-80">نعم، هذه الوظيفة يمكن القيام بها عن بعد</span>
                </div>
              </div>
            </div>
            <div className="glass-premium p-6 rounded-2xl md:rounded-3xl bg-primary-500/5 border-primary-500/10">
              <label className="text-xs md:text-sm font-black themed-text-sec mb-4 block flex items-center gap-2 uppercase opacity-70">
                <FiDollarSign className="text-primary-500" /> الراتب المتوقع (شهرياً)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <input
                  type="number"
                  placeholder="الحد الأدنى"
                  className="formal-input rounded-xl md:rounded-2xl"
                  name="salary.min"
                  value={formData.salary.min}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  placeholder="الحد الأعلى"
                  className="formal-input rounded-xl md:rounded-2xl"
                  name="salary.max"
                  value={formData.salary.max}
                  onChange={handleChange}
                />
                <select name="salary.currency" className="formal-input rounded-xl md:rounded-2xl appearance-none" value={formData.salary.currency} onChange={handleChange}>
                  <option value="USD">دولار (USD)</option>
                  <option value="YER">ريال يمني (YER)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 md:space-y-8 animate-fade-in">
            <div className="space-y-4">
              <label className="text-xs md:text-sm font-black themed-text-sec mr-1 flex items-center gap-2 uppercase opacity-70">
                <FiZap className="text-primary-500" /> المهارات المطلوبة (اضغط Enter للإضافة)
              </label>
              <input
                type="text"
                className="formal-input rounded-xl md:rounded-2xl"
                placeholder="مثلاً: React, Node.js, Python..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={addSkill}
              />
              <div className="flex flex-wrap gap-2 mt-4">
                {formData.requirements.skills.map(skill => (
                  <span key={skill} className="px-4 py-2 bg-primary-500/10 text-primary-600 rounded-xl font-black text-[10px] md:text-xs flex items-center gap-2 border border-primary-500/20 animate-scale-up group">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-rose-500 transition-colors"><FiX /></button>
                  </span>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-xs md:text-sm font-black themed-text-sec mr-1 uppercase opacity-70">المسؤوليات</label>
              <div className="space-y-3">
                {formData.responsibilities.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className="formal-input rounded-xl md:rounded-2xl"
                      value={item}
                      onChange={(e) => handleListChange(index, e.target.value, 'responsibilities')}
                      placeholder={`المسؤولية رقم ${index + 1}`}
                    />
                    <button type="button" onClick={() => removeListItem(index, 'responsibilities')} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"><FiX /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addListItem('responsibilities')} className="text-primary-600 font-black text-xs md:text-sm flex items-center gap-2 mt-2 hover:gap-3 transition-all">
                <FiPlus /> إضافة مسؤولية أخرى
              </button>
            </div>

            <div className="glass-premium p-6 md:p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-glow-lg rounded-3xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                    <FiCpu className="text-white text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black">إعدادات الفرز الذكي AI</h3>
                    <p className="text-indigo-100 text-[10px] md:text-xs font-bold opacity-80">دع الذكاء الاصطناعي يحلل المتقدمين نيابة عنك</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-1.5 rounded-full px-4 border border-white/20 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">مفعل تلقائياً</span>
                </div>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4">
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 rounded-lg border-white/30 bg-white/10 text-white focus:ring-white/50 cursor-pointer mt-1" 
                    checked={formData.aiSettings.enableAutoScreening}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      aiSettings: { ...prev.aiSettings, enableAutoScreening: e.target.checked }
                    }))}
                  />
                  <div>
                    <div className="font-black text-sm md:text-base">تفعيل الفرز الآلي الذكي</div>
                    <div className="text-[10px] md:text-xs text-indigo-100 font-bold opacity-80 leading-relaxed">سيتم تصنيف المتقدمين بناءً على مطابقة مهاراتهم وخبراتهم تلقائياً باستخدام خوارزميات التعلم العميق.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen luxury-aura pb-20 pt-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex items-center gap-2 md:gap-3 ${step >= i ? 'text-primary-600' : 'themed-text-ter opacity-50'}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center font-black transition-all duration-500 text-sm md:text-base ${
                  step === i ? 'bg-primary-600 text-white shadow-glow rotate-6 scale-110' : 
                  step > i ? 'bg-emerald-500 text-white' : 'bg-primary-500/5 border border-primary-500/10'
                }`}>
                  {step > i ? <FiCheck /> : i}
                </div>
                <span className="text-[10px] md:text-xs font-black hidden sm:block uppercase tracking-wider">
                  {i === 1 ? 'المعلومات الأساسية' : i === 2 ? 'الموقع والراتب' : 'المتطلبات والفرز الذكي'}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-primary-500/5 rounded-full overflow-hidden border border-primary-500/10 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-primary-600 to-accent transition-all duration-700 ease-out shadow-glow-sm rounded-full"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-premium p-8 md:p-16 relative overflow-hidden border-primary-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="mb-10 md:mb-12 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-500/5 rounded-3xl flex items-center justify-center text-primary-600 text-2xl md:text-3xl shadow-inner border border-primary-500/10">
                {step === 1 ? <FiBriefcase /> : step === 2 ? <FiMapPin /> : <FiTarget />}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-4xl font-black themed-text mb-2">
                  {step === 1 ? (isEdit ? 'تعديل الوظيفة' : 'نشر وظيفة جديدة') : step === 2 ? 'الموقع وتفاصيل الراتب' : 'المتطلبات واللمسات الأخيرة'}
                </h1>
                <p className="themed-text-sec font-bold opacity-80 text-sm md:text-base">املأ البيانات بدقة لجذب أفضل الكفاءات الاستراتيجية</p>
              </div>
            </div>

            {renderStep()}

            <div className="mt-12 md:mt-16 pt-8 border-t themed-border flex flex-col sm:flex-row justify-between items-center gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="w-full sm:w-auto p-4 px-8 rounded-2xl border-2 border-primary-500/20 text-primary-600 font-black flex items-center justify-center gap-2 hover:bg-primary-500/5 transition-all text-sm md:text-base"
                >
                  <FiArrowRight /> السابق
                </button>
              ) : (
                <div />
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  className="w-full sm:w-auto btn-formal-primary px-12 py-4 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  التالي <FiArrowLeft />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto btn-formal-primary px-16 py-4 flex items-center justify-center gap-3 text-base md:text-lg shimmer-sweep shadow-glow"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>{isEdit ? 'جاري التحديث...' : 'جاري النشر...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEdit ? 'تحديث الوظيفة' : 'نشر الوظيفة الآن'}</span>
                      <FiCheck strokeWidth={3} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
