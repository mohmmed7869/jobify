import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBriefcase, FiMapPin, FiClock, FiCheckCircle, 
  FiXCircle, FiActivity, FiArrowRight, FiEye, FiCalendar,
  FiTrendingUp, FiCpu, FiMessageCircle, FiMessageSquare, FiVideo,
  FiFilter, FiSearch, FiRefreshCcw, FiPieChart
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getFileUrl } from '../../utils/fileUrl';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get('/api/applications/my');
        setApplications(res.data.data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' ? true : app.status === filter;
    const matchesSearch = app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.job?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mb-4"
        />
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">جاري استرجاع طلباتك...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'مقبول': return 'bg-emerald-500';
      case 'مرفوض': return 'bg-rose-500';
      case 'مقابلة': return 'bg-amber-500';
      default: return 'bg-primary-500';
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'مقبول': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'مرفوض': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'مقابلة': return 'bg-amber-100 text-amber-600 border-amber-200';
      default: return 'bg-blue-100 text-blue-600 border-blue-200';
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen mesh-bg pb-20 pt-12" 
      dir="rtl"
    >
      <div className="premium-container px-4 md:px-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 md:mb-12 gap-6 md:gap-8 text-center md:text-right">
          <motion.div variants={itemVariants} className="max-w-2xl w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 border border-primary-100 mx-auto md:mr-0">
              <FiPieChart /> سجل الطلبات والمسار المهني
            </div>
            <h1 className="text-3xl md:text-5xl font-black themed-text mb-3 md:mb-4 tracking-tight leading-tight">إدارة <span className="text-premium-gradient">طلبات التوظيف</span></h1>
            <p className="themed-text-sec font-bold text-sm md:text-lg leading-relaxed opacity-80">
              تتبع جميع طلباتك في مكان واحد، وتفاعل مع أصحاب العمل، وحضر لمقابلاتك القادمة بكل ثقة.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex w-full md:w-auto">
            <Link to="/jobs" className="w-full md:w-auto btn-premium-primary py-3.5 md:py-4 px-8 md:px-10 flex items-center justify-center gap-3 shadow-glow group text-sm md:text-base">
              استكشاف وظائف جديدة 
              <FiArrowRight className="rotate-180 group-hover:translate-x-[-5px] transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-10 md:mb-12">
          {[
            { label: 'إجمالي الطلبات', count: applications.length, icon: <FiBriefcase />, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'قيد المراجعة', count: applications.filter(a => a.status === 'قيد المراجعة').length, icon: <FiClock />, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'المقابلات', count: applications.filter(a => a.status === 'مقابلة').length, icon: <FiVideo />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { label: 'تم القبول', count: applications.filter(a => a.status === 'مقبول').length, icon: <FiCheckCircle />, color: 'text-emerald-500', bg: 'bg-emerald-50' }
          ].map((s, i) => (
            <motion.div key={i} variants={itemVariants} className="glass-premium p-4 md:p-6 flex items-center gap-3 md:gap-5 border-none shadow-premium group cursor-default magnetic-lift">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${s.bg} flex items-center justify-center text-lg md:text-xl shadow-sm ${s.color} group-hover:scale-110 transition-transform shrink-0`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xl md:text-2xl font-black themed-text leading-none">{s.count}</h4>
                <p className="text-[9px] md:text-xs font-bold themed-text-ter mt-1 truncate uppercase tracking-tighter md:tracking-normal">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters & Search */}
        <motion.div variants={itemVariants} className="glass-card p-4 mb-10 flex flex-col md:flex-row items-center gap-6 border-none shadow-sm bg-white/40">
          <div className="flex flex-wrap gap-2 flex-1">
            {['all', 'جديد', 'قيد المراجعة', 'مقابلة', 'مقبول', 'مرفوض'].map(f => (
              <motion.button
                key={f}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all duration-300 border ${
                  filter === f 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-glow' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-primary-200'
                }`}
              >
                {f === 'all' ? 'الكل' : f}
              </motion.button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="البحث في الطلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white/50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            />
          </div>
        </motion.div>

        {/* Applications List */}
        <motion.div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredApplications.map((app) => (
              <motion.div 
                layout
                key={app._id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -5, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)" }}
                className="glass-card p-8 md:p-10 hover-card group relative overflow-hidden border-none shadow-premium"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-2 h-full ${getStatusColor(app.status)} transition-all group-hover:w-3`}></div>
                
                <div className="flex flex-col lg:flex-row justify-between gap-6 md:gap-10">
                  <div className="flex-1">
                    <div className="flex items-center md:items-start gap-4 md:gap-6 mb-6 md:mb-8 text-right">
                      <motion.div 
                        whileHover={{ rotate: 5 }}
                        className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-xl md:rounded-[2rem] border border-slate-50 flex items-center justify-center text-primary-600 font-black text-xl md:text-3xl shadow-premium-sm group-hover:shadow-glow transition-all duration-500 shrink-0 overflow-hidden"
                      >
                        {app.job?.companyLogo || app.job?.company?.profile?.avatar || app.job?.company?.employerProfile?.companyLogo ? (
                          <img 
                            src={getFileUrl(app.job?.companyLogo || app.job?.company?.employerProfile?.companyLogo || app.job?.company?.profile?.avatar)} 
                            alt={app.job?.companyName} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className="w-full h-full items-center justify-center bg-primary-50" style={{ display: (app.job?.companyLogo || app.job?.company?.profile?.avatar || app.job?.company?.employerProfile?.companyLogo) ? 'none' : 'flex' }}>
                          {app.job?.companyName?.charAt(0)}
                        </div>
                      </motion.div>
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-2xl font-black themed-text group-hover:text-primary-600 transition-colors mb-1 md:mb-2 truncate">
                          {app.job?.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <span className="px-2 py-0.5 bg-slate-100 themed-text-sec rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-wider">{app.job?.companyName}</span>
                          <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          <span className="themed-text-ter font-bold text-[10px] md:text-xs flex items-center gap-1"><FiMapPin /> {app.job?.location?.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:gap-8 text-[9px] md:text-xs font-black themed-text-ter mb-6 md:mb-8 border-y themed-border py-4 md:py-6">
                      <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 bg-themed-bg-ter rounded-lg md:rounded-xl"><FiBriefcase className="text-primary-500" /> {app.job?.jobType}</div>
                      <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 bg-themed-bg-ter rounded-lg md:rounded-xl"><FiClock className="text-primary-500" /> {new Date(app.createdAt).toLocaleDateString('ar-YE')}</div>
                    </div>

                    {app.aiAnalysis && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-3 md:gap-4 bg-primary-500/5 p-4 md:p-5 rounded-xl md:rounded-2xl border border-primary-500/10 mb-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-right">
                            <div className="p-1.5 bg-primary-600 text-white rounded-lg shadow-glow-sm">
                              <FiCpu size={12} className="md:w-[14px] md:h-[14px]" />
                            </div>
                            <span className="text-[10px] md:text-xs font-black text-primary-900">تحليل المطابقة الذكي</span>
                          </div>
                          <span className="text-primary-600 font-black text-base md:text-lg">{app.aiAnalysis.matchingScore}%</span>
                        </div>
                        <div className="h-1 md:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${app.aiAnalysis.matchingScore}%` }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="h-full bg-primary-600 shadow-glow"
                          ></motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* تفاصيل المقابلة للمتقدم */}
                    {app.interview?.scheduled && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-amber-50 border border-amber-200 p-5 rounded-2xl md:rounded-3xl mt-4 relative overflow-hidden group/interview"
                      >
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-amber-500/5 rounded-full blur-xl group-hover/interview:scale-150 transition-transform"></div>
                        <h4 className="text-[11px] md:text-xs font-black text-amber-700 flex items-center gap-2 mb-4 uppercase tracking-widest">
                          <FiVideo className="animate-pulse" /> تفاصيل المقابلة القادمة
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-amber-100">
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-sm">
                              <FiCalendar size={14} />
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-amber-900/40 uppercase">التاريخ</p>
                              <p className="text-xs font-black text-amber-900">{new Date(app.interview.date).toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-amber-100">
                            <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-sm">
                              <FiClock size={14} />
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-amber-900/40 uppercase">الوقت</p>
                              <p className="text-xs font-black text-amber-900">{app.interview.time}</p>
                            </div>
                          </div>
                        </div>

                        {app.interview.notes && (
                          <div className="mt-4 p-4 bg-amber-100/50 rounded-xl border border-dashed border-amber-200">
                            <p className="text-[9px] font-black text-amber-800 uppercase mb-2 flex items-center gap-1.5">
                              <FiMessageCircle size={10} /> ملاحظات صاحب العمل:
                            </p>
                            <p className="text-[11px] font-bold text-amber-900 italic leading-relaxed">
                              "{app.interview.notes}"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between items-end gap-6 md:gap-10 lg:w-64">
                    <div className="flex flex-col items-end gap-2 md:gap-3 w-full">
                      <span className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-wider border w-full text-center shadow-sm ${getStatusBadgeStyles(app.status)}`}>
                        {app.status}
                      </span>
                      {app.status === 'مقابلة' && (
                        <motion.div 
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-full py-1.5 bg-amber-500/10 text-amber-600 text-[8px] md:text-[10px] font-black text-center rounded-lg"
                        >
                          تنبيه: مقابلة قريبة!
                        </motion.div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:gap-3 w-full">
                      {(app.status === 'مقابلة' || app.interview?.meetingLink) ? (
                        <Link 
                          to={app.interview?.meetingLink || `/smart-interview/${app._id}?job=${encodeURIComponent(app.job?.title || '')}`}
                          className="btn-premium-primary py-3 md:py-4 px-4 md:px-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 bg-indigo-600 border-indigo-600 shadow-indigo-200"
                        >
                          <FiVideo /> دخول المقابلة
                        </Link>
                      ) : (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-3 md:py-4 px-4 md:px-6 bg-slate-900 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-primary-600 transition-all shadow-xl"
                        >
                          <FiMessageSquare /> المراسلة
                        </motion.button>
                      )}
                      
                      <Link 
                        to={`/jobs/${app.job?._id}`}
                        className="w-full py-3 md:py-4 px-4 md:px-6 bg-white border themed-border themed-text rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-slate-50 transition-all"
                      >
                        التفاصيل <FiEye />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredApplications.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 glass-card border-none bg-white/40"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                <FiBriefcase className="text-slate-200 text-4xl" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">لا توجد سجلات مطابقة</h3>
              <p className="text-slate-500 font-bold mb-10 max-w-sm mx-auto leading-relaxed">لم نجد أي طلبات بهذا التصنيف. ربما حان الوقت للتقديم على وظائف جديدة؟</p>
              <Link to="/jobs" className="btn-premium-primary px-12 py-5 shadow-glow">
                بدء البحث الذكي الآن
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MyApplications;
