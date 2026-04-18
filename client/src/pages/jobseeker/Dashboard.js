import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPaperPlane, FaEye, FaRegBookmark, 
  FaUserEdit, FaFileAlt, FaArrowLeft,
  FaCheckCircle, FaShareAlt,
  FaLightbulb, FaRocket, FaMagic,
  FaComments
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${user?._id}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success('تم نسخ رابط ملفك الشخصي لمشاركته!');
  };

  const [stats, setStats] = useState({
    applications: 0,
    views: 0,
    saved: 0,
    matches: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileStrength, setProfileStrength] = useState(0);

  useEffect(() => {
    const calculateStrength = () => {
      let strength = 0;
      if (user?.profile?.bio) strength += 10;
      if (user?.profile?.avatar) strength += 10;
      if (user?.jobseekerProfile?.skills?.length > 0) strength += 20;
      if (user?.jobseekerProfile?.experience?.length > 0) strength += 20;
      if (user?.jobseekerProfile?.education?.length > 0) strength += 20;
      if (user?.jobseekerProfile?.resume) strength += 20;
      setProfileStrength(strength);
    };

    const fetchData = async () => {
      try {
        calculateStrength();
        const [statsRes, appsRes, recsRes] = await Promise.all([
          axios.get('/api/analytics/jobseeker'),
          axios.get('/api/applications/my'),
          axios.get('/api/ai/recommendations?limit=3')
        ]);

        if (statsRes.data.success) {
          const s = statsRes.data.data;
          setStats({
            applications: s.applicationStats.reduce((sum, item) => sum + item.count, 0),
            views: s.profileViews || 0,
            saved: user?.savedJobs?.length || 0,
            matches: s.bestApplications?.length || 0
          });
        }

        if (appsRes.data.success) {
          setRecentApplications(appsRes.data.data.slice(0, 5));
        }

        if (recsRes.data.success) {
          setRecommendations(recsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      interview: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      accepted: 'bg-green-500/10 text-green-600 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-600 border-red-500/20'
    };
    const labels = {
      pending: 'قيد المراجعة',
      interview: 'مقابلة',
      accepted: 'مقبول',
      rejected: 'مرفوض'
    };
    return (
      <span className={`px-4 py-1.5 rounded-xl text-xs font-black border backdrop-blur-sm ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full mb-4"
        />
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-slate-600 font-black tracking-widest uppercase text-xs"
        >
          جاري تحميل ذكائك الاصطناعي...
        </motion.p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen luxury-aura pb-20 overflow-x-hidden relative"
    >
      <div className="blur-circle w-[500px] h-[500px] bg-primary-500/10 -top-48 -right-48"></div>
      <div className="blur-circle w-[400px] h-[400px] bg-accent/10 bottom-0 -left-24"></div>

      {/* Premium Hero Header */}
      <div className="relative pt-8 md:pt-12 pb-12 md:pb-24 px-4 overflow-hidden border-b border-primary-500/10">
        <div className="absolute top-0 left-0 w-full h-full bg-primary-500/5 -z-10"></div>
        
        <div className="premium-container flex flex-col md:flex-row justify-between items-center gap-10 md:gap-16 relative z-10">
          <motion.div variants={itemVariants} className="text-center md:text-right w-full md:w-auto">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary-500/10 text-primary-600 rounded-full text-[10px] md:text-xs font-black mb-6 md:mb-8 cursor-default tracking-[0.2em] uppercase border border-primary-500/20 shadow-glow-sm floating-element"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse shadow-glow"></span>
              نظام التوظيف الذكي الفائق v3.5 - Luxury Edition
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black themed-text mb-6 tracking-tight leading-tight flex flex-wrap items-center gap-2 justify-center md:justify-start">
              أهلاً، <span className="premium-gradient-text drop-shadow-sm break-words">{user?.name}</span> <span>👋</span>
            </h1>
            <p className="themed-text-sec text-base md:text-2xl font-bold max-w-2xl mx-auto md:mx-0 opacity-90 leading-relaxed">
              اكتشف محرك المطابقة الذكي <span className="premium-gradient-text text-glow">{stats.matches}</span> وظيفة جديدة تناسب خبراتك الاستراتيجية اليوم.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 md:gap-8 w-full md:w-auto">
            <motion.button 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShareProfile}
              className="flex items-center justify-center gap-3 premium-glass-panel px-8 md:px-12 py-4 md:py-6 border-primary-500/20 text-primary-600 rounded-2xl md:rounded-3xl font-black text-sm md:text-lg w-full sm:w-auto transition-all shadow-premium"
            >
              <FaShareAlt /> <span>مشاركة الملف</span>
            </motion.button>
            <Link to="/profile" className="w-full sm:w-auto">
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="btn-formal-primary flex items-center justify-center gap-3 px-8 md:px-12 py-4 md:py-6 shadow-glow-lg w-full text-sm md:text-lg luxury-border"
              >
                <FaUserEdit /> <span className="font-black">الملف الاحترافي</span>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="premium-container -mt-8 md:-mt-12 relative z-10 px-4 md:px-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mb-16 md:mb-24">
          {[
            { label: 'طلبات التوظيف', value: stats.applications, icon: <FaPaperPlane />, color: 'from-blue-600 to-cyan-500' },
            { label: 'مشاهدات الملف', value: stats.views, icon: <FaEye />, color: 'from-emerald-600 to-green-500' },
            { label: 'وظائف محفوظة', value: stats.saved, icon: <FaRegBookmark />, color: 'from-indigo-600 to-purple-500' },
            { label: 'مطابقات ذكية', value: stats.matches, icon: <FaCheckCircle />, color: 'from-orange-600 to-amber-500' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              whileHover={{ y: -15, scale: 1.05 }}
              className="premium-card p-6 md:p-10 magnetic-lift text-center flex flex-col items-center group cursor-pointer relative overflow-hidden border-primary-500/10 hover:shadow-glow-primary"
            >
              <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-primary-500/5 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16 group-hover:bg-primary-500/10 transition-colors"></div>
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[1.8rem] bg-gradient-to-br ${stat.color} text-white flex items-center justify-center mb-6 md:mb-8 text-2xl md:text-4xl shadow-glow-sm relative z-10`}
              >
                {stat.icon}
              </motion.div>
              <h3 className="text-3xl md:text-5xl font-black premium-gradient-text mb-2 relative z-10 drop-shadow-sm">{stat.value}</h3>
              <p className="themed-text-ter text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] relative z-10 opacity-80">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Top Matches Section */}
        <motion.div variants={itemVariants} className="mb-16 md:mb-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 md:mb-14">
            <h2 className="text-2xl md:text-4xl font-black themed-text flex items-center gap-4 md:gap-6">
              <span className="p-4 md:p-5 bg-orange-500/10 text-orange-600 rounded-2xl md:rounded-3xl border border-orange-500/20 shadow-glow-sm floating-element"><FaMagic className="text-xl md:text-3xl" /></span>
              المطابقة الذكية الفائقة
            </h2>
            <Link to="/jobs" className="text-primary-600 font-black text-[11px] md:text-sm uppercase tracking-[0.2em] hover:scale-105 transition-transform px-6 py-3 premium-glass-panel rounded-xl border border-primary-500/20 shadow-sm">عرض جميع الوظائف الاستراتيجية</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {recommendations.length > 0 ? recommendations.map((job, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -12, scale: 1.02 }}
                className="premium-card p-8 md:p-10 group relative overflow-hidden border-primary-500/10 hover:shadow-glow-primary luxury-border"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary-500/5 group-hover:bg-orange-500/10 transition-all">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${job.matchingScore}%` }}
                    transition={{ duration: 2, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                  ></motion.div>
                </div>
                
                <div className="flex justify-between items-start mb-8 gap-6">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xl md:text-2xl themed-text group-hover:premium-gradient-text transition-all mb-2 truncate tracking-tight">{job.title}</h4>
                    <p className="text-sm md:text-base themed-text-sec font-black truncate opacity-80">{job.companyName} • {job.location?.city}</p>
                  </div>
                  <div className="bg-orange-500/10 text-orange-600 w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center border border-orange-500/20 shadow-sm shrink-0 floating-element">
                    <span className="text-xl md:text-2xl font-black leading-none">{job.matchingScore}%</span>
                    <span className="text-[7px] md:text-[8px] font-black uppercase mt-1.5 tracking-tighter">AI Score</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2.5 mb-10">
                  {job.requirements?.skills?.slice(0, 3).map(s => (
                    <span key={s} className="px-3.5 py-1.5 bg-primary-500/5 text-primary-600 border border-primary-500/10 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-tight">
                      {s}
                    </span>
                  ))}
                </div>
                
                <Link to={`/jobs/${job._id}`} className="w-full py-4 md:py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl md:rounded-3xl text-center block text-[11px] md:text-sm font-black uppercase tracking-[0.2em] hover:from-orange-600 hover:to-orange-500 hover:shadow-glow-lg transition-all duration-500">
                  التقدم الذكي الفوري
                </Link>
              </motion.div>
            )) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-20 md:py-32 text-center premium-card border-primary-500/10">
                <FaMagic className="mx-auto text-primary-600 opacity-20 text-5xl md:text-7xl mb-6 animate-pulse" />
                <p className="premium-gradient-text font-black text-lg md:text-2xl px-8 opacity-80">نحن نبحث عن أفضل الفرص الاستراتيجية التي تليق بمستواك...</p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 md:space-y-10">
            {/* AI Profile Strength */}
            <motion.div variants={itemVariants} className="glass-card p-6 md:p-10 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-48 md:w-64 h-48 md:h-64 bg-primary-500/5 rounded-full blur-2xl md:blur-3xl group-hover:bg-primary-500/10 transition-colors"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 md:mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 md:p-4 bg-primary-50 text-primary-600 rounded-xl md:rounded-2xl shadow-sm">
                    <FaRocket className="text-lg md:text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900">مستوى جاهزيتك المهنية</h2>
                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">AI Career Readiness Index</p>
                  </div>
                </div>
                <div className="text-right w-full sm:w-auto">
                  <span className="text-3xl md:text-4xl font-black text-primary-600">{profileStrength}%</span>
                  <p className="text-[10px] md:text-xs font-black text-green-500 uppercase tracking-tighter mt-1">مستوى الاكتمال</p>
                </div>
              </div>
              
              <div className="relative h-4 md:h-6 bg-slate-100 rounded-full overflow-hidden mb-8 md:mb-10 border border-slate-200/50 p-0.5 md:p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${profileStrength}%` }} 
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent rounded-full relative shadow-[0_0_20px_rgba(14,165,233,0.4)]"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:15px_15px] md:bg-[length:20px_20px] animate-shimmer"></div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <Link to="/profile" className="flex items-center gap-4 md:gap-5 p-4 md:p-6 rounded-xl md:rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-premium-lg hover:border-primary-200 transition-all group/item">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white text-green-600 flex items-center justify-center shadow-sm group-hover/item:bg-green-600 group-hover/item:text-white transition-all">
                    <FaFileAlt size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-sm md:text-base">تحديث السيرة الذاتية</h4>
                    <p className="text-[9px] md:text-xs text-slate-400 font-bold mt-1">زيادة دقة المطابقة بنسبة 25%</p>
                  </div>
                </Link>
                <Link to="/resume-builder" className="flex items-center gap-4 md:gap-5 p-4 md:p-6 rounded-xl md:rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-premium-lg hover:border-accent-200 transition-all group/item">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white text-accent flex items-center justify-center shadow-sm group-hover/item:bg-accent group-hover/item:text-white transition-all">
                    <FaMagic size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-sm md:text-base">باني السيرة الذكي</h4>
                    <p className="text-[9px] md:text-xs text-slate-400 font-bold mt-1">قوالب احترافية متوافقة مع ATS</p>
                  </div>
                </Link>
                <Link to="/interview/video" className="flex items-center gap-4 md:gap-5 p-4 md:p-6 rounded-xl md:rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-premium-lg hover:border-indigo-200 transition-all group/item sm:col-span-2">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-sm group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                    <FaRocket size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-sm md:text-base">المقابلة الذكية</h4>
                    <p className="text-[9px] md:text-xs text-slate-400 font-bold mt-1">غرفة مقابلات الفيديو المتقدمة</p>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Applications Table */}
            <motion.div variants={itemVariants} className="glass-card overflow-hidden border-none shadow-premium-lg group">
              <div className="p-6 md:p-10 bg-white/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-primary-600"></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-1">تتبع طلبات التوظيف</h2>
                  <p className="text-[9px] md:text-xs text-slate-400 font-black uppercase tracking-widest">Recent Activity Stream</p>
                </div>
                <Link to="/my-applications" className="w-full sm:w-auto">
                  <motion.div 
                    whileHover={{ x: -5 }}
                    className="flex items-center justify-center sm:justify-end gap-2 text-primary-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest group-hover:text-accent transition-colors"
                  >
                    عرض جميع الطلبات <FaArrowLeft size={10} />
                  </motion.div>
                </Link>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-right min-w-[500px]">
                  <thead className="bg-slate-50/50 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-6 md:px-10 py-4 md:py-5">الوظيفة والشركة</th>
                      <th className="px-6 md:px-10 py-4 md:py-5 text-center">حالة الطلب</th>
                      <th className="px-6 md:px-10 py-4 md:py-5">تاريخ التقديم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence>
                      {recentApplications.map((app, idx) => (
                        <motion.tr 
                          key={app._id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 + 0.5 }}
                          className="hover:bg-primary-500/5 transition-colors group/row cursor-pointer"
                          onClick={() => navigate(`/jobs/${app.job?._id}`)}
                        >
                          <td className="px-6 md:px-10 py-6 md:py-8">
                            <div>
                              <h4 className="font-black text-slate-900 group-hover/row:text-primary-600 transition-colors text-base md:text-lg mb-1 truncate max-w-[150px] md:max-w-xs">{app.job?.title || 'عنوان الوظيفة'}</h4>
                              <p className="text-[10px] md:text-xs text-slate-500 font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/row:bg-primary-500"></span>
                                {app.job?.companyName || 'اسم الشركة'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-6 md:py-8 text-center">
                            {getStatusBadge(app.status)}
                          </td>
                          <td className="px-6 md:px-10 py-6 md:py-8 text-xs md:text-sm text-slate-400 font-bold font-mono">
                            {new Date(app.createdAt).toLocaleDateString('ar-YE')}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8 md:space-y-10">
            {/* AI Insights & Coaching */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ scale: 1.02 }}
              className="glass-card p-8 md:p-10 border-none bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white shadow-glow relative overflow-hidden group"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -left-20 -bottom-20 w-48 md:w-64 h-48 md:h-64 bg-primary-500 rounded-full blur-3xl"
              ></motion.div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="p-2.5 md:p-3 bg-white/10 rounded-xl md:rounded-2xl backdrop-blur-md">
                    <FaLightbulb className="text-yellow-400 text-lg md:text-xl" />
                  </div>
                  <h2 className="text-lg md:text-xl font-black">مدربك الذكي</h2>
                </div>
                
                <div className="space-y-6 md:space-y-8">
                  <div className="p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-[1.5rem] border border-white/10 backdrop-blur-sm relative group/msg">
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-primary-600 to-accent text-[7px] md:text-[8px] font-black px-2.5 py-1 md:px-3 md:py-1.5 rounded-full uppercase shadow-lg">تحليل فوري</div>
                    <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium mb-4">
                      "إضافة مهارة <span className="text-primary-400 font-black">Cloud Architecture</span> إلى ملفك قد يزيد من احتمالية دعوتك للمقابلات بنسبة 40%."
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gradient-to-br from-primary-600 to-accent flex items-center justify-center font-black text-[9px] md:text-[10px]">AI</div>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Suggestion</span>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        className="text-primary-400 hover:text-white transition-colors"
                      >
                        <FaArrowLeft size={10} />
                      </motion.button>
                    </div>
                  </div>
                  
                  <Link to="/ai-coach">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-premium-primary w-full py-4 md:py-5 bg-white text-indigo-900 border-none hover:bg-slate-50 shadow-xl font-black text-[9px] md:text-xs uppercase tracking-[0.2em]"
                    >
                      تحدث مع مساعدك الشخصي
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Smart Networking */}
            <motion.div variants={itemVariants} className="glass-card p-8 md:p-10 border-none bg-gradient-to-br from-primary-600 to-accent text-white relative overflow-hidden shadow-premium">
              <div className="absolute -right-10 -bottom-10 w-40 md:w-48 h-40 md:h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className="p-2.5 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
                    <FaComments className="text-white text-lg md:text-xl" />
                  </div>
                  <h3 className="font-black text-lg md:text-xl">المجتمع المهني</h3>
                </div>
                <p className="text-xs md:text-sm text-white/90 mb-6 md:mb-8 font-medium leading-relaxed">
                  هناك <span className="font-black underline decoration-2 underline-offset-4">8 مناقشات</span> جديدة تجري الآن في مجالك المهني. انضم ووسع شبكتك!
                </p>
                <Link to="/social">
                  <motion.button 
                    whileHover={{ y: -5 }}
                    className="w-full py-4 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    دخول المركز الاجتماعي
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JobSeekerDashboard;

