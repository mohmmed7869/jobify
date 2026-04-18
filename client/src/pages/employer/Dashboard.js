import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBriefcase, FiUsers, FiCalendar, FiTrendingUp, 
  FiPlus, FiArrowUpRight, FiEye,
  FiMessageSquare, FiActivity, FiZap, FiX, FiCheckCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await axios.get('/api/analytics/employer');
        const jobsRes = await axios.get('/api/jobs/my-jobs');
        setStats(statsRes.data.data);
        setRecentJobs(jobsRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchAISuggestions = async () => {
    if (!recentJobs || recentJobs.length === 0) {
      toast.error('لا توجد وظائف نشطة لتحسينها حالياً. يرجى نشر وظيفة أولاً.');
      return;
    }

    setLoadingAI(true);
    setShowAIModal(true);
    
    // إضافة مؤقت أمان لإغلاق شاشة التحميل في حالة الفشل الصامت
    const safetyTimeout = setTimeout(() => {
      setLoadingAI(false);
      // لا نغلق المودال تلقائياً للسماح للمستخدم برؤية رسالة الخطأ
    }, 15000);

    try {
      // الحصول على اقتراحات لأحدث وظيفة
      const latestJob = recentJobs[0];
      if (!latestJob) {
        throw new Error('لا توجد بيانات وظيفة متوفرة');
      }

      const jobId = latestJob._id || latestJob.id;
      if (!jobId) {
        throw new Error('معرف الوظيفة غير موجود');
      }
      
      console.log('Fetching AI suggestions for job:', jobId);
      
      const res = await axios.get(`/api/jobs/${jobId}/suggestions`);
      if (res.data.success) {
        setAiSuggestions({
          jobTitle: latestJob.title,
          ...res.data.data
        });
      }
    } catch (error) {
      console.error('AI Insights Error:', error.response || error);
      toast.error(error.response?.data?.message || 'فشل في تحميل رؤى الذكاء الاصطناعي الاستراتيجية');
      setShowAIModal(false);
    } finally {
      clearTimeout(safetyTimeout);
      setLoadingAI(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen luxury-aura pb-20 pt-8 relative overflow-hidden" dir="rtl">
      {/* Background Ornaments */}
      <div className="blur-circle w-[500px] h-[500px] bg-primary-500/10 -top-48 -right-48"></div>
      <div className="blur-circle w-[400px] h-[400px] bg-accent/10 bottom-0 -left-24"></div>

      <div className="premium-container relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 md:mb-16 gap-10 px-4 md:px-0">
          <div className="animate-slide-up w-full md:w-auto text-center md:text-right">
            <h1 className="text-4xl md:text-6xl font-black themed-text mb-3 tracking-tight">
              مرحباً، <span className="premium-gradient-text drop-shadow-sm">{user?.name}</span> 👋
            </h1>
            <p className="themed-text-sec font-black flex items-center justify-center md:justify-start gap-3 opacity-90 text-base md:text-xl">
              <FiActivity className="text-primary-600 shadow-glow-sm" /> 
              إليك نظرة سريعة على أداء توظيفك <span className="text-primary-600">الاستراتيجي</span> اليوم
            </p>
          </div>
          <Link 
            to="/employer/post-job" 
            className="btn-formal-primary py-4 md:py-6 px-10 md:px-14 flex items-center justify-center gap-3 text-lg md:text-2xl animate-slide-up shadow-glow-lg w-full md:w-auto luxury-border"
          >
            <FiPlus strokeWidth={4} /> نشر وظيفة جديدة
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-10 px-4 md:px-0">
          <StatCard 
            title="الوظائف النشطة" 
            value={stats?.jobStats?.find(s => s._id === 'نشط')?.count || 0} 
            icon={<FiBriefcase />} 
            color="blue"
            trend="+12%"
          />
          <StatCard 
            title="إجمالي المتقدمين" 
            value={stats?.totalStats?.totalApplications || 0} 
            icon={<FiUsers />} 
            color="emerald"
            trend="+25%"
          />
          <StatCard 
            title="إجمالي المشاهدات" 
            value={stats?.totalStats?.totalViews || 0} 
            icon={<FiEye />} 
            color="amber"
            trend="+5%"
          />
          <StatCard 
            title="المقابلات المجدولة" 
            value={0} 
            icon={<FiCalendar />} 
            color="violet"
            trend="0"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
          {/* Recent Jobs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-premium p-5 md:p-8 border-primary-200/20">
              <div className="flex flex-row items-center justify-between gap-4 mb-6 md:mb-8">
                <h2 className="text-lg md:text-2xl font-black themed-text flex items-center gap-2 md:gap-3">
                  <FiTrendingUp className="text-primary-500" /> الوظائف المنشورة
                </h2>
                <Link to="/employer/jobs" className="text-primary-600 font-bold hover:underline text-[10px] md:text-sm whitespace-nowrap">عرض الكل</Link>
              </div>

              {recentJobs.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {recentJobs.slice(0, 5).map(job => (
                    <div key={job._id} className="p-3 md:p-5 rounded-2xl bg-primary-500/5 border border-primary-500/10 flex flex-row items-center justify-between gap-3 md:gap-4 hover:bg-white hover:shadow-premium transition-all duration-300 group">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl shadow-sm flex items-center justify-center text-primary-600 font-black group-hover:scale-110 transition-transform text-base md:text-lg shrink-0">
                          {job.title.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black themed-text truncate text-xs md:text-base">{job.title}</h4>
                          <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[10px] themed-text-ter font-black uppercase tracking-wider">
                            <span className="flex items-center gap-1"><FiUsers className="text-primary-500" /> {job.stats.applications}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><FiEye className="text-primary-500" /> {job.stats.views}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <span className={`hidden sm:inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-tighter ${job.status === 'نشط' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-themed-bg-ter text-themed-text-ter border border-themed-border'}`}>
                          {job.status}
                        </span>
                        <Link to={`/employer/jobs/${job._id}/applications`} className="p-2 md:p-3 bg-white rounded-lg md:rounded-xl text-themed-text-ter hover:text-primary-600 shadow-sm hover:shadow-glow-sm transition-all">
                          <FiArrowUpRight size={16} className="md:w-5 md:h-5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="themed-text-sec font-bold text-sm">لا توجد وظائف منشورة حالياً.</p>
                  <Link to="/employer/post-job" className="text-primary-600 font-black mt-2 inline-block text-xs">انشر وظيفتك الأولى الآن</Link>
                </div>
              )}
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="glass-premium p-6 md:p-8 border-primary-200/20">
              <h3 className="text-lg md:text-xl font-black themed-text mb-6 md:mb-8">إجراءات سريعة</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <QuickAction icon={<FiPlus />} label="نشر وظيفة" to="/employer/post-job" />
                <QuickAction icon={<FiUsers />} label="المتقدمين" to="/employer/applications" />
                <QuickAction icon={<FiMessageSquare />} label="الرسائل" to="/chat" />
                <QuickAction icon={<FiCalendar />} label="المقابلة الذكية" to="/interview/video" />
              </div>
            </div>

            {/* AI Insights */}
            <div className="glass-premium p-6 md:p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-glow-lg relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-24 md:w-32 h-24 md:h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-lg md:text-xl font-black mb-4 flex items-center gap-2 relative z-10">
                <FiZap className="text-amber-400 animate-pulse" /> رؤى الذكاء الاصطناعي
              </h3>
              <p className="text-indigo-100 text-xs md:text-sm font-bold leading-relaxed mb-6 md:mb-8 relative z-10 opacity-90">
                حلل أداء وظائفك واحصل على توصيات ذكية لزيادة جودة المتقدمين بنسبة تصل إلى 40%.
              </p>
              <button 
                onClick={fetchAISuggestions}
                disabled={loadingAI}
                className="w-full py-3 md:py-4 bg-white text-indigo-600 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-indigo-50 shadow-xl transition-all relative z-10 magnetic-lift disabled:opacity-50"
              >
                {loadingAI ? 'جاري التحليل...' : 'تحسين الوظائف الحالية'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all">
          <div className="glass-card w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl animate-scale-up" dir="rtl">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 md:p-8 text-white relative">
              <button onClick={() => setShowAIModal(false)} className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors">
                <FiX size={24} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <FiZap className="text-amber-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black">توصيات الذكاء الاصطناعي</h3>
                  <p className="text-indigo-100 text-xs font-bold opacity-80">تحليل الوظيفة: {aiSuggestions?.jobTitle || 'جاري التحليل...'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {loadingAI ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-indigo-600 font-black animate-pulse">جاري تحليل البيانات الاستراتيجية...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-500" /> نقاط القوة الحالية
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiSuggestions?.analysis?.strengths?.map((s, i) => (
                        <div key={i} className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FiZap className="text-amber-500" /> اقتراحات التحسين
                    </h4>
                    <div className="space-y-3">
                      {aiSuggestions?.suggestions?.map((s, i) => (
                        <div key={i} className="p-5 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-bold border border-indigo-100 flex items-start gap-3">
                          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm text-[10px] font-black">{i+1}</div>
                          <p className="leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="text-xs font-black text-slate-900 mb-3">نصيحة خبير التوظيف الذكي:</h4>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                      "تعديل المسمى الوظيفي ليكون أكثر دقة واستخدام الكلمات المفتاحية في أول 200 كلمة من الوصف يزيد من معدل ظهور الوظيفة في نتائج البحث بنسبة 35%."
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setShowAIModal(false)}
                className="btn-formal-primary px-10 py-3 text-sm font-black"
              >
                فهمت، سأقوم بالتحديث
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color, trend }) => {
  const colors = {
    blue: 'bg-blue-600/10 text-blue-600 border-blue-500/20 shadow-glow-sm',
    emerald: 'bg-emerald-600/10 text-emerald-600 border-emerald-500/20 shadow-glow-sm',
    amber: 'bg-amber-600/10 text-amber-600 border-amber-500/20 shadow-glow-sm',
    violet: 'bg-violet-600/10 text-violet-600 border-violet-500/20 shadow-glow-sm',
  };

  return (
    <div className="premium-card p-8 md:p-12 magnetic-lift border-primary-100/10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
      <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
        <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[1.8rem] flex items-center justify-center text-2xl md:text-4xl border transition-transform duration-500 group-hover:rotate-12 ${colors[color]}`}>
          {icon}
        </div>
        {trend !== '0' && (
          <span className="text-[10px] md:text-xs font-black text-emerald-600 bg-emerald-500/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-emerald-500/20 tracking-[0.1em] shadow-sm">
            {trend}
          </span>
        )}
      </div>
      <h3 className="themed-text-ter font-black text-[10px] md:text-xs uppercase tracking-[0.3em] mb-3 opacity-70 relative z-10">{title}</h3>
      <p className="text-4xl md:text-6xl font-black premium-gradient-text tracking-tighter relative z-10 drop-shadow-sm">{value}</p>
    </div>
  );
};

const QuickAction = ({ icon, label, to }) => (
  <Link to={to} className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-5 bg-primary-500/5 rounded-xl md:rounded-[1.5rem] border border-primary-500/10 hover:bg-white hover:shadow-premium-lg hover:text-primary-600 transition-all group magnetic-lift">
    <div className="text-xl md:text-2xl text-themed-text-ter group-hover:text-primary-500 transition-colors">{icon}</div>
    <span className="text-[9px] md:text-[10px] font-black themed-text tracking-tight text-center">{label}</span>
  </Link>
);

export default EmployerDashboard;