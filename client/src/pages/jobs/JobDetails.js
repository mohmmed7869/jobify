import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiCalendar, 
  FiGlobe, FiCheckCircle, FiInfo, FiChevronLeft, FiShare2, 
  FiHeart, FiSend, FiZap, FiAward, FiTarget, FiExternalLink,
  FiCpu, FiBarChart2, FiUsers, FiX, FiLayers, FiFileText,
  FiActivity, FiTrendingUp
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getFileUrl } from '../../utils/fileUrl';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyStep, setApplyStep] = useState(1);
  const [coverLetter, setCoverLetter] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`/api/jobs/${id}`);
        setJob(response.data.data);
        setAiInsights(response.data.aiInsights);
        
        if (user) {
          try {
            const applyCheck = await axios.get(`/api/applications/check/${id}`);
            setHasApplied(applyCheck.data.hasApplied);
            if (applyCheck.data.application) {
              setApplicationStatus(applyCheck.data.application.status);
            }
          } catch (e) {
            console.log("Apply check failed, might be unauthenticated for this route");
          }
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast.error('تعذر تحميل تفاصيل الوظيفة');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, user]);

  const handleApply = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error('يجب تسجيل الدخول للتقديم على الوظيفة');
      navigate('/login');
      return;
    }

    setIsApplying(true);
    try {
      await axios.post('/api/applications', {
        jobId: id,
        employer: job.employer?._id || job.company?._id,
        coverLetter
      });
      toast.success('تم إرسال طلبك بنجاح!');
      setHasApplied(true);
      setApplyStep(4); // الانتقال إلى شاشة التحليل الاستراتيجي
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء التقديم');
    } finally {
      setIsApplying(false);
    }
  };

  const nextStep = () => setApplyStep(prev => prev + 1);
  const prevStep = () => setApplyStep(prev => prev - 1);

  if (loading) return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <FiCpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600 text-3xl animate-pulse" />
      </div>
      <p className="mt-8 font-black text-slate-500 animate-pulse tracking-widest uppercase text-xs">جاري تحميل تفاصيل الوظيفة ومطابقتها...</p>
    </div>
  );
  
  if (!job) return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center p-4 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 max-w-md border-none shadow-premium-lg"
      >
        <FiTarget className="text-red-500 text-6xl mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">الوظيفة غير متاحة</h2>
        <p className="text-slate-500 font-bold mb-8">عذراً، يبدو أن هذه الوظيفة قد تم إغلاقها أو أنها لم تعد موجودة في نظامنا.</p>
        <Link to="/jobs" className="btn-premium-primary px-10 py-4 inline-block font-black">العودة لقائمة الوظائف</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen mesh-bg pb-20 relative" dir="rtl">
      {/* Dynamic Header Section */}
      <div className="relative pt-6 md:pt-10 pb-20 md:pb-32 overflow-hidden px-4 md:px-0">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/60 to-transparent z-0"></div>
        <div className="absolute -top-48 -right-48 w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-primary-500/5 rounded-full blur-3xl"></div>
        
        <div className="premium-container relative z-10">
          <Link to="/jobs" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-black mb-8 md:mb-12 transition-all group text-xs md:text-sm">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-all border border-slate-100">
              <FiChevronLeft className="rotate-180" />
            </div>
            تصفح كافة الوظائف المتاحة
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start justify-between">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start text-center md:text-right flex-1 w-full"
            >
              <div className="relative group shrink-0">
                <div className="absolute -inset-2 bg-gradient-to-br from-primary-600 to-accent rounded-[2rem] md:rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[1.8rem] md:rounded-[2.8rem] shadow-premium flex items-center justify-center text-primary-600 text-3xl md:text-6xl font-black border-4 border-white transform rotate-3 hover:rotate-0 transition-all duration-500 relative overflow-hidden">
                  {(job.companyLogo || job.company?.profile?.avatar || job.company?.employerProfile?.companyLogo) ? (
                    <img 
                      src={getFileUrl(job.companyLogo || job.company?.employerProfile?.companyLogo || job.company?.profile?.avatar)} 
                      alt={job.companyName} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <span className="relative z-10" style={{ display: (job.companyLogo || job.company?.profile?.avatar || job.company?.employerProfile?.companyLogo) ? 'none' : 'flex' }}>
                    {job.companyName?.charAt(0)}
                  </span>
                  <div className="absolute -bottom-1 -left-1 md:-bottom-2 md:-left-2 w-7 h-7 md:w-10 md:h-10 bg-emerald-500 rounded-full border-2 md:border-4 border-white flex items-center justify-center shadow-lg">
                    <FiCheckCircle className="text-white text-[10px] md:text-sm" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 md:space-y-6 flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <h1 className="text-2xl md:text-6xl font-black themed-text tracking-tight leading-tight">
                    {job.title}
                  </h1>
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-8 themed-text-sec font-bold text-xs md:text-base">
                  <span className="flex items-center gap-1.5 md:gap-2 text-primary-600 bg-primary-50/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-primary-100/50">
                    <FiBriefcase className="text-primary-500" /> {job.companyName}
                  </span>
                  <span className="flex items-center gap-1.5 md:gap-2">
                    <FiMapPin className="text-slate-400" /> {job.location?.city}, {job.location?.country}
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5 md:gap-2">
                    <FiCalendar className="text-slate-400" /> {new Date(job.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
                  {job.urgent && (
                    <span className="px-3 md:px-5 py-1.5 md:py-2 bg-red-500 text-white text-[8px] md:text-[10px] font-black rounded-full shadow-glow animate-pulse uppercase tracking-widest">
                      عاجل جداً
                    </span>
                  )}
                  <span className="px-3 md:px-5 py-1.5 md:py-2 bg-slate-900 text-white text-[8px] md:text-[10px] font-black rounded-full shadow-lg uppercase tracking-widest">
                    {job.jobType}
                  </span>
                  <span className="px-3 md:px-5 py-1.5 md:py-2 bg-white themed-text text-[8px] md:text-[10px] font-black rounded-full shadow-sm border themed-border uppercase tracking-widest">
                    {job.experienceLevel}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full lg:w-auto mt-8 lg:mt-0"
            >
              <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSaved(!isSaved)}
                  className={`flex-1 sm:flex-none p-3.5 md:p-5 rounded-xl md:rounded-[1.5rem] bg-white border-2 transition-all shadow-sm group ${isSaved ? 'border-primary-200 text-primary-600' : 'themed-border text-slate-400'}`}
                >
                  <FiHeart size={18} className={`md:w-5 md:h-5 ${isSaved ? 'fill-current' : ''}`} />
                </motion.button>
                
                {user && user.id !== (job.employer?._id || job.company?._id || job.employer || job.company) && (
                  <Link 
                    to={`/chat?userId=${job.employer?._id || job.company?._id || job.employer || job.company}&userName=${job.companyName}`}
                    className="flex-1 sm:flex-none p-3.5 md:p-5 rounded-xl md:rounded-[1.5rem] bg-white border-2 themed-border text-slate-400 hover:text-primary-600 hover:border-primary-100 transition-all shadow-sm flex items-center justify-center"
                  >
                    <FiSend size={18} className="md:w-5 md:h-5" />
                  </Link>
                )}

                <button className="flex-1 sm:flex-none p-3.5 md:p-5 rounded-xl md:rounded-[1.5rem] bg-white border-2 themed-border text-slate-400 hover:text-primary-600 hover:border-primary-100 transition-all shadow-sm flex items-center justify-center">
                  <FiShare2 size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
              
              {hasApplied ? (
                <div className="flex-1 bg-emerald-50 text-emerald-600 px-6 md:px-12 py-3.5 md:py-5 rounded-xl md:rounded-[1.5rem] font-black border-2 border-emerald-100 flex flex-col items-center justify-center gap-1 shadow-sm text-sm md:text-base">
                  <div className="flex items-center gap-2 md:gap-3">
                    <FiCheckCircle size={18} className="md:w-5 md:h-5" /> تم التقديم
                  </div>
                  {applicationStatus && (
                    <span className="text-[10px] md:text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full mt-1">
                      الحالة: {applicationStatus}
                    </span>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setShowApplyModal(true)}
                  className="flex-1 btn-premium-primary px-8 md:px-14 py-3.5 md:py-5 text-base md:text-xl font-black shadow-glow flex items-center justify-center gap-3 md:gap-4 group"
                >
                  قدم الآن <FiSend className="rotate-180 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="premium-container -mt-16 relative z-20">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area */}
          <div className="lg:w-2/3 space-y-12">
            <motion.div 
              layout
              className={`glass-premium p-0 border-none shadow-premium-lg overflow-hidden transition-all duration-500 ${showAIInsights ? 'bg-slate-900 ring-4 ring-primary-500/20' : 'bg-slate-900'}`}
            >
              <div className="p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary-600/20 to-accent/20 opacity-50"></div>
                <div className="relative z-10 flex items-center gap-4 md:gap-6 w-full md:w-auto text-right">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-glow-primary animate-pulse shrink-0">
                    <FiCpu size={24} className="text-white md:hidden" />
                    <FiCpu size={32} className="text-white hidden md:block" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-xl font-black text-white mb-1 tracking-tight truncate">تحليل المطابقة الذكي (AI)</h3>
                    <p className="text-slate-400 text-[10px] md:text-sm font-bold truncate">بناءً على خوارزميات توافق المهارات</p>
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  <div className="text-center">
                    <div className="text-2xl md:text-4xl font-black text-primary-400 tracking-tighter">
                      {aiInsights ? `${aiInsights.matchingScore}%` : '---'}
                    </div>
                    <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">نسبة التوافق</div>
                  </div>
                  <div className="h-10 md:h-14 w-px bg-slate-800 hidden sm:block"></div>
                  <button 
                    onClick={() => setShowAIInsights(!showAIInsights)}
                    disabled={!aiInsights}
                    className={`flex-1 md:flex-none bg-white/10 hover:bg-white/20 px-4 md:px-8 py-2.5 md:py-4 rounded-xl text-[9px] md:text-xs font-black text-white transition-all border border-white/10 flex items-center justify-center gap-2 ${!aiInsights ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>{showAIInsights ? 'إغلاق' : 'عرض التفاصيل'}</span>
                    <FiZap size={14} className={showAIInsights ? 'text-primary-400' : ''} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showAIInsights && aiInsights && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-slate-800/50 p-6 lg:p-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] lg:text-sm font-black text-primary-400 uppercase tracking-widest flex items-center gap-2">
                          <FiCheckCircle /> مهارات مطابقة في ملفك
                        </h4>
                        <ul className="space-y-3">
                          {aiInsights.matchingDetails?.matchedSkills?.length > 0 ? (
                            aiInsights.matchingDetails.matchedSkills.map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-slate-300 text-xs lg:text-sm font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                {item}
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-500 text-xs">لا توجد مهارات مطابقة مباشرة</li>
                          )}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] lg:text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                          <FiInfo /> مهارات مفقودة يُنصح بها
                        </h4>
                        <ul className="space-y-3">
                          {aiInsights.matchingDetails?.missingSkills?.length > 0 ? (
                            aiInsights.matchingDetails.missingSkills.map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-slate-300 text-xs lg:text-sm font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                                {item}
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-500 text-xs">لقد استوفيت كافة المهارات المطلوبة!</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="glass-card p-6 sm:p-8 lg:p-12 shadow-premium border-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-primary-600 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-4 mb-6 lg:mb-10">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shrink-0">
                  <FiLayers className="text-xl lg:text-2xl" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">الوصف الوظيفي</h2>
              </div>
              <div className="text-slate-600 font-medium leading-[1.8] lg:leading-[2.2] text-base lg:text-lg whitespace-pre-line">
                {job.description}
              </div>
            </div>

            <div className="glass-card p-12 shadow-premium border-none">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                  <FiAward size={24} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">المتطلبات والكفاءات الاستراتيجية</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="flex items-center gap-3 font-black text-slate-800 text-lg">
                    <FiTarget className="text-primary-500" /> المهارات التقنية المطلوبة:
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {job.requirements?.skills?.map((skill, index) => (
                      <motion.span 
                        key={index} 
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="px-6 py-3 bg-white text-slate-700 rounded-2xl text-sm font-black border-2 border-slate-50 shadow-sm hover:border-primary-200 hover:text-primary-600 transition-all cursor-default"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-slate-100/50">
                    <h3 className="flex items-center gap-3 font-black text-slate-800 mb-6 text-lg">
                      <FiInfo className="text-primary-500" /> تفاصيل إضافية:
                    </h3>
                    <ul className="space-y-5">
                      <li className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                        <span className="text-slate-500 font-bold">المستوى التعليمي:</span>
                        <span className="text-slate-900 font-black">{job.requirements?.education || 'غير محدد'}</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">سنوات الخبرة:</span>
                        <span className="text-slate-900 font-black">{job.experienceLevel}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:w-1/3 space-y-10">
            <div className="glass-card p-10 border-none shadow-premium-lg sticky top-24 overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-primary-600 to-accent"></div>
              <h3 className="text-2xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-100">بطاقة المعلومات</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-primary-50/30 rounded-[2rem] border border-primary-100/50 group hover:bg-primary-50 transition-colors">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                    <FiDollarSign size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">الميزانية المرصودة</p>
                    <p className="text-xl font-black text-slate-900">{job.salary?.min} - {job.salary?.max} {job.salary?.currency || '$'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 group hover:bg-white hover:shadow-md transition-all">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:text-primary-500 transition-colors">
                    <FiBarChart2 size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إحصائيات التقدم</p>
                    <p className="text-xl font-black text-slate-900">{job.applicationCount || 24} متقدم استراتيجي</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 group hover:bg-white hover:shadow-md transition-all">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:text-primary-500 transition-colors">
                    <FiUsers size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">مستوى التنافس</p>
                    <p className="text-xl font-black text-slate-900">متوسط (Match-based)</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8">نشر وتوصية بالفرصة</p>
                <div className="flex justify-center gap-4">
                  {['linkedin', 'twitter', 'facebook', 'whatsapp'].map(social => (
                    <motion.button 
                      key={social} 
                      whileHover={{ y: -5, scale: 1.1 }}
                      className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-white hover:shadow-premium transition-all border border-slate-100 flex items-center justify-center"
                    >
                      <FiExternalLink />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card p-10 shadow-premium border-none bg-gradient-to-br from-white to-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900 mb-6">حول المؤسسة</h3>
              <div className="space-y-6">
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  {job.companyDescription || job.company?.employerProfile?.companyDescription || 'تعتبر هذه المؤسسة من الشركات الرائدة في مجالها، وتهدف دائماً لاستقطاب أفضل العقول المبدعة لتطوير حلول مبتكرة تسهم في تشكيل المستقبل الرقمي.'}
                </p>
                <button className="w-full btn-premium-outline py-5 font-black flex items-center justify-center gap-3 text-xs uppercase tracking-widest">
                  زيارة الملف المؤسسي الكامل <FiGlobe />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Apply Bar for Mobile */}
      {!hasApplied && (
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 z-[100] md:hidden">
          <button 
            onClick={() => setShowApplyModal(true)}
            className="w-full btn-premium-primary py-4 font-black shadow-glow flex items-center justify-center gap-3"
          >
            قدم الآن <FiSend className="rotate-180" />
          </button>
        </div>
      )}

      {/* Interactive Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplyModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-glow">
                    <FiSend className="rotate-180" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">تقديم طلب استراتيجي</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">خطوة {applyStep} من 4</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowApplyModal(false)}
                  className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-100">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(applyStep / 4) * 100}%` }}
                  className="h-full bg-primary-600 shadow-glow"
                ></motion.div>
              </div>

              <div className="p-10">
                <AnimatePresence mode="wait">
                  {applyStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="bg-primary-50 rounded-3xl p-8 border-2 border-primary-100">
                        <h4 className="font-black text-primary-700 text-lg mb-4 flex items-center gap-3">
                          <FiFileText /> مراجعة الملف الشخصي
                        </h4>
                        <p className="text-primary-600/80 text-sm font-medium leading-relaxed mb-6">
                          سيتم إرسال ملفك الشخصي المحدث ونتائج تحليل الذكاء الاصطناعي إلى جهة العمل مباشرة. تأكد من أن مهاراتك تطابق متطلبات الوظيفة.
                        </p>
                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-primary-100">
                          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                            <FiCheckCircle size={24} />
                          </div>
                          <div>
                            <p className="text-slate-900 font-black text-sm">{user?.name || 'اسم المستخدم'}</p>
                            <p className="text-slate-500 text-xs font-bold">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={nextStep}
                          className="btn-premium-primary px-12 py-4 font-black flex items-center gap-3"
                        >
                          تأكيد البيانات والمتابعة <FiZap />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {applyStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">رسالة التقديم (اختياري)</label>
                        <textarea 
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="لماذا أنت المرشح الأنسب لهذه الفرصة الاستراتيجية؟"
                          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 focus:ring-0 rounded-[2rem] p-6 min-h-[200px] text-slate-900 font-medium placeholder-slate-300 transition-all"
                        ></textarea>
                      </div>
                      
                      <div className="flex items-center justify-between pt-6">
                        <button 
                          onClick={prevStep}
                          className="text-slate-400 font-black text-xs hover:text-slate-600 transition-all"
                        >
                          العودة للخطوة السابقة
                        </button>
                        <button 
                          onClick={handleApply}
                          disabled={isApplying}
                          className="btn-premium-primary px-14 py-4 font-black flex items-center gap-3 shadow-glow"
                        >
                          {isApplying ? 'جاري إرسال الطلب...' : 'إرسال الطلب النهائي'} <FiSend className="rotate-180" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {applyStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-10 space-y-8"
                    >
                      <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-glow animate-bounce">
                        <FiCheckCircle size={48} />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black text-slate-900">تم إرسال طلبك بنجاح!</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                          لقد قمنا بإرسال ملفك وخبراتك لجهة العمل. يمكنك متابعة حالة طلبك من خلال لوحة التحكم الخاصة بك.
                        </p>
                      </div>
                      <div className="pt-6">
                        <button 
                          onClick={() => setApplyStep(4)}
                          className="w-full btn-premium-primary py-4 font-black flex items-center justify-center gap-3 shadow-glow"
                        >
                          بدء التتبع والتحليل الاستراتيجي <FiActivity className="animate-pulse" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {applyStep === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 space-y-10"
                    >
                      <div className="relative mx-auto w-40 h-40">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-4 border-dashed border-primary-500/30 rounded-full"
                        ></motion.div>
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-4 border-2 border-primary-500/20 rounded-full"
                        ></motion.div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <FiCpu size={60} className="text-primary-600 animate-pulse" />
                            <motion.div 
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full shadow-glow"
                            ></motion.div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight animate-pulse">جاري تحليل البيانات الاستراتيجية...</h3>
                        <p className="text-slate-500 text-sm font-bold max-w-sm mx-auto leading-relaxed">
                          نظام الذكاء الاصطناعي يقوم الآن بمطابقة خبراتك مع متطلبات الوظيفة بدقة متناهية لتسريع عملية الرد.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
                        <button 
                          onClick={() => {
                            setShowApplyModal(false);
                            navigate('/my-applications');
                          }}
                          className="btn-premium-primary py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-glow"
                        >
                          تتبع حالة الطلب <FiTrendingUp />
                        </button>
                        <button 
                          onClick={() => setShowApplyModal(false)}
                          className="py-4 rounded-2xl bg-slate-50 themed-text font-black text-sm border border-slate-100 hover:bg-white hover:shadow-sm transition-all"
                        >
                          إغلاق والعودة للوظيفة
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobDetails;