import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiTarget, FiCpu, FiZap, FiCheckCircle, FiAlertCircle, 
  FiPlus, FiTrendingUp, FiSearch, FiBriefcase, FiActivity,
  FiAward, FiBook, FiClock, FiStar, FiFilter, FiX, FiCheck, FiEdit2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const JobRequirements = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [improvingId, setImprovingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editForm, setEditForm] = useState({
    skills: [],
    experience: '',
    education: '',
    newSkill: ''
  });

  const [aiSuggestions, setAiSuggestions] = useState({
    topSkills: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'Machine Learning'],
    experienceTrends: 'مستوى الخبرة المطلوب في تزايد بنسبة 15% في قطاع التكنولوجيا هذا الربع.',
    recommendedCertificates: ['AWS Certified Developer', 'PMP', 'Google Cloud Architect']
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const openEditModal = (job) => {
    setSelectedJob(job);
    setEditForm({
      skills: job.requirements?.skills || [],
      experience: job.requirements?.experience || '',
      education: job.requirements?.education || '',
      newSkill: ''
    });
    setShowEditModal(true);
  };

  const handleAddSkill = () => {
    if (editForm.newSkill.trim() && !editForm.skills.includes(editForm.newSkill.trim())) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, editForm.newSkill.trim()],
        newSkill: ''
      });
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(s => s !== skillToRemove)
    });
  };

  const saveManualRequirements = async () => {
    try {
      setLoading(true);
      const updatedData = {
        ...selectedJob,
        requirements: {
          ...selectedJob.requirements,
          skills: editForm.skills,
          experience: editForm.experience,
          education: editForm.education
        }
      };

      await axios.put(`/api/jobs/${selectedJob._id}`, updatedData);
      toast.success('تم تحديث المتطلبات بنجاح');
      setShowEditModal(false);
      fetchJobs();
    } catch (error) {
      toast.error('خطأ في حفظ المتطلبات');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/jobs/my-jobs');
      setJobs(res.data.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات الاستراتيجية');
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async (job) => {
    try {
      setImprovingId(job._id);
      setSelectedJob(job);
      const res = await axios.post('/api/ai/improve-job-requirements', { jobId: job._id });
      setCurrentSuggestions(res.data.data);
      setShowModal(true);
    } catch (error) {
      console.error('Improvement Error Details:', error.response || error);
      const errorMsg = error.response?.data?.message || 'فشل في تحليل المتطلبات';
      toast.error(errorMsg);
    } finally {
      setImprovingId(null);
    }
  };

  const applyImprovements = async () => {
    try {
      setLoading(true);
      const updatedData = {
        ...selectedJob,
        description: currentSuggestions.descriptionImprovement || selectedJob.description,
        requirements: {
          ...selectedJob.requirements,
          skills: [...new Set([...(selectedJob.requirements?.skills || []), ...(currentSuggestions.recommendedSkills || [])])],
          experience: currentSuggestions.suggestedExperience || selectedJob.requirements?.experience,
          education: currentSuggestions.suggestedEducation || selectedJob.requirements?.education
        }
      };

      await axios.put(`/api/jobs/${selectedJob._id}`, updatedData);
      toast.success('تم تطبيق التحسينات الاستراتيجية بنجاح');
      setShowModal(false);
      fetchJobs();
    } catch (error) {
      toast.error('خطأ في حفظ التعديلات');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompleteness = (job) => {
    let score = 0;
    if (job.requirements?.skills?.length > 0) score += 40;
    if (job.requirements?.experience) score += 20;
    if (job.requirements?.education) score += 20;
    if (job.responsibilities?.length > 0) score += 20;
    return score;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const score = calculateCompleteness(job);
    if (activeTab === 'complete') return matchesSearch && score === 100;
    if (activeTab === 'pending') return matchesSearch && score < 100;
    return matchesSearch;
  });

  if (loading && jobs.length === 0) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen luxury-aura pb-20 pt-8 px-4 md:px-6" dir="rtl">
      <div className="premium-container">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div className="animate-slide-up">
            <h1 className="text-3xl md:text-5xl font-black themed-text mb-3 leading-tight">
              المتطلبات <span className="text-primary-600">الاستراتيجية</span>
            </h1>
            <p className="themed-text-sec font-bold flex items-center gap-2 opacity-80 text-sm md:text-lg">
              <FiTarget className="text-primary-500 animate-pulse" /> تحليل وتحسين معايير التوظيف الذكية لمنشأتك
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="glass-premium p-3 px-6 rounded-2xl flex items-center gap-4 border-primary-500/10">
              <div className="text-center">
                <div className="text-2xl font-black text-primary-600">{jobs.length}</div>
                <div className="text-[10px] font-black themed-text-ter uppercase tracking-widest">إجمالي الوظائف</div>
              </div>
            </div>
            <div className="glass-premium p-3 px-6 rounded-2xl flex items-center gap-4 border-primary-500/10">
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-500">
                  {jobs.filter(j => calculateCompleteness(j) === 100).length}
                </div>
                <div className="text-[10px] font-black themed-text-ter uppercase tracking-widest">مكتملة المعايير</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            
            <div className="glass-premium p-4 md:p-6 flex flex-col md:flex-row gap-6 items-center justify-between border-primary-500/10 rounded-3xl">
              <div className="relative w-full md:w-80 group">
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="البحث في الوظائف..."
                  className="formal-input pr-12 rounded-2xl bg-white/5 border-none focus:ring-2 ring-primary-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex bg-primary-500/5 p-1.5 rounded-2xl border border-primary-500/10 w-full md:w-auto">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'all' ? 'bg-white shadow-glow text-primary-600' : 'themed-text-ter hover:themed-text'}`}
                >
                  الكل
                </button>
                <button 
                  onClick={() => setActiveTab('complete')}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'complete' ? 'bg-white shadow-glow text-emerald-600' : 'themed-text-ter hover:themed-text'}`}
                >
                  المكتملة
                </button>
                <button 
                  onClick={() => setActiveTab('pending')}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'pending' ? 'bg-white shadow-glow text-rose-500' : 'themed-text-ter hover:themed-text'}`}
                >
                  بحاجة لتحسين
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {filteredJobs.map((job) => {
                const completeness = calculateCompleteness(job);
                return (
                  <div key={job._id} className="glass-premium p-6 md:p-8 magnetic-lift group border-primary-500/5 hover:border-primary-500/20 rounded-[2.5rem] relative overflow-hidden transition-all duration-500">
                    <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary-500 to-indigo-600 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                      <div className="flex gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/10 to-indigo-600/10 flex items-center justify-center text-primary-600 font-black text-2xl group-hover:scale-110 transition-transform">
                          {job.title.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-black themed-text mb-2 group-hover:text-primary-600 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 items-center">
                            <span className="flex items-center gap-1.5 text-xs font-bold themed-text-ter bg-white/5 px-3 py-1 rounded-full border border-white/10">
                              <FiBriefcase className="text-primary-500" /> {job.category || 'غير مصنف'}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full ${completeness === 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                              {completeness === 100 ? 'معايير مكتملة' : 'معايير قيد التطوير'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-[10px] font-black themed-text-ter uppercase tracking-widest">مؤشر الدقة الاستراتيجية</div>
                        <div className="flex items-center gap-4">
                          <div className="h-2.5 w-32 md:w-48 bg-primary-500/5 rounded-full overflow-hidden border border-primary-500/10 shadow-inner">
                            <div 
                              className={`h-full transition-all duration-1000 ease-out rounded-full ${completeness === 100 ? 'bg-emerald-500' : 'bg-primary-500 shadow-glow'}`}
                              style={{ width: `${completeness}%` }}
                            ></div>
                          </div>
                          <span className="text-xl font-black text-primary-600">{completeness}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3 p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white group-hover:shadow-glow-sm transition-all duration-500">
                        <div className="flex items-center gap-2 text-xs font-black themed-text opacity-70 mb-2">
                          <FiZap className="text-amber-500" /> المهارات التقنية
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements?.skills?.length > 0 ? (
                            job.requirements.skills.map(skill => (
                              <span key={skill} className="px-3 py-1 bg-primary-500/5 text-primary-600 rounded-lg text-[10px] font-black border border-primary-500/10">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500 italic">لم يتم تحديد مهارات</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white group-hover:shadow-glow-sm transition-all duration-500">
                        <div className="flex items-center gap-2 text-xs font-black themed-text opacity-70 mb-2">
                          <FiClock className="text-blue-500" /> الخبرة المطلوبة
                        </div>
                        <div className="text-sm font-black themed-text">
                          {job.requirements?.experience || <span className="text-rose-500 italic">غير محددة</span>}
                        </div>
                      </div>

                      <div className="space-y-3 p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white group-hover:shadow-glow-sm transition-all duration-500">
                        <div className="flex items-center gap-2 text-xs font-black themed-text opacity-70 mb-2">
                          <FiBook className="text-indigo-500" /> المؤهل العلمي
                        </div>
                        <div className="text-sm font-black themed-text">
                          {job.requirements?.education || <span className="text-rose-500 italic">غير محدد</span>}
                        </div>
                      </div>
                    </div>

                    {completeness < 100 ? (
                      <div className="mt-8 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-rose-500 font-bold text-xs">
                          <FiAlertCircle /> يوصى بتحسين متطلبات الوظيفة لزيادة دقة تحليل AI للمتقدمين
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => openEditModal(job)}
                            className="text-xs font-black themed-text hover:text-primary-600 flex items-center gap-2"
                          >
                            <FiPlus /> إضافة يدوياً
                          </button>
                          <button 
                            onClick={() => handleImprove(job)}
                            disabled={improvingId === job._id}
                            className="text-xs font-black text-rose-600 hover:underline flex items-center gap-2"
                          >
                            {improvingId === job._id ? <LoadingSpinner size="sm" /> : 'تحسين بالذكاء الاصطناعي'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => openEditModal(job)}
                        className="mt-8 text-xs font-black themed-text-ter hover:text-primary-600 flex items-center gap-2 transition-colors"
                      >
                        <FiEdit2 className="text-primary-500" /> تعديل المتطلبات الحالية
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="glass-premium p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-glow-lg rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                  <FiCpu className="text-white text-3xl animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black">رؤى استراتيجية AI</h3>
                  <div className="flex items-center gap-2 bg-white/10 p-1 rounded-full px-3 border border-white/20 backdrop-blur-md mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest">محلل البيانات نشط</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-5 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <h4 className="text-xs font-black mb-3 flex items-center gap-2 text-indigo-100 uppercase">
                    <FiTrendingUp /> اتجاهات السوق الحالية
                  </h4>
                  <p className="text-sm font-bold leading-relaxed">
                    {aiSuggestions.experienceTrends}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black flex items-center gap-2 text-indigo-100 uppercase">
                    <FiAward /> المهارات الأكثر طلباً
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.topSkills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-white/10 rounded-xl text-[10px] font-black border border-white/20 hover:bg-white hover:text-indigo-600 transition-colors cursor-default">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Manual Requirements Modal */}
      {showEditModal && selectedJob && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="glass-premium w-full max-w-xl rounded-[3rem] p-8 md:p-10 relative animate-scale-up border-primary-500/20 shadow-glow-lg">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-8 left-8 p-3 hover:bg-rose-500/10 rounded-2xl text-rose-500 transition-colors"
            >
              <FiX size={24} />
            </button>

            <h2 className="text-2xl font-black themed-text mb-8">إضافة متطلبات وظيفية</h2>

            <div className="space-y-6">
              {/* Skills Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black themed-text-ter uppercase">المهارات المطلوبة</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="formal-input flex-1 rounded-xl"
                    placeholder="مثلاً: SQL, UI/UX..."
                    value={editForm.newSkill}
                    onChange={(e) => setEditForm({...editForm, newSkill: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <button onClick={handleAddSkill} className="p-3 bg-primary-500 text-white rounded-xl"><FiPlus /></button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {editForm.skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-primary-500/10 text-primary-600 rounded-lg text-xs font-black flex items-center gap-2">
                      {skill}
                      <FiX className="cursor-pointer hover:text-rose-500" onClick={() => handleRemoveSkill(skill)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black themed-text-ter uppercase">سنوات الخبرة</label>
                  <input 
                    type="text"
                    className="formal-input rounded-xl"
                    placeholder="مثلاً: 3-5 سنوات"
                    value={editForm.experience}
                    onChange={(e) => setEditForm({...editForm, experience: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black themed-text-ter uppercase">التعليم</label>
                  <input 
                    type="text"
                    className="formal-input rounded-xl"
                    placeholder="مثلاً: بكالوريوس هندسة"
                    value={editForm.education}
                    onChange={(e) => setEditForm({...editForm, education: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={saveManualRequirements}
                  disabled={loading}
                  className="w-full btn-formal-primary py-4 rounded-2xl flex items-center justify-center gap-3 shadow-glow"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <><FiCheck strokeWidth={3} /> حفظ المتطلبات الوظيفية</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Suggestions Modal */}
      {showModal && currentSuggestions && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="glass-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-8 md:p-12 relative animate-scale-up border-primary-500/20 shadow-glow-lg">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-8 left-8 p-3 hover:bg-rose-500/10 rounded-2xl text-rose-500 transition-colors"
            >
              <FiX size={24} />
            </button>

            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-600">
                <FiCpu size={32} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black themed-text">تحليل التحسين الذكي</h2>
                <p className="themed-text-ter font-bold text-sm">مقترحات استراتيجية بناءً على معايير السوق</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FiTrendingUp /> لماذا هذه التغييرات؟
                </h4>
                <p className="text-sm font-bold themed-text leading-relaxed">
                  {currentSuggestions.whyTheseChanges}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black themed-text-ter uppercase">المهارات الموصى بإضافتها</label>
                  <div className="flex flex-wrap gap-2">
                    {currentSuggestions.recommendedSkills.map(skill => (
                      <span key={skill} className="px-3 py-2 bg-primary-500/10 text-primary-600 rounded-xl text-xs font-black border border-primary-500/20">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black themed-text-ter uppercase">الخبرة المقترحة</label>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm font-black themed-text">
                    {currentSuggestions.suggestedExperience}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black themed-text-ter uppercase">تحسين الوصف الوظيفي</label>
                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 text-sm font-bold themed-text leading-relaxed italic opacity-80">
                  "{currentSuggestions.descriptionImprovement}"
                </div>
              </div>

              <div className="pt-6 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={applyImprovements}
                  disabled={loading}
                  className="flex-1 btn-formal-primary py-4 rounded-2xl flex items-center justify-center gap-3 shadow-glow"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <><FiCheck strokeWidth={3} /> تطبيق التحسينات الآن</>}
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 rounded-2xl bg-themed-bg-ter themed-text font-black text-sm hover:bg-themed-bg-sec transition-all border border-primary-500/10"
                >
                  تجاهل المقترحات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRequirements;
