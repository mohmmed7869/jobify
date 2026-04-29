import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiMapPin, FiBriefcase, 
  FiChevronDown, FiActivity, FiTrendingUp,
  FiGrid, FiList, FiAlertCircle
} from 'react-icons/fi';
import JobCard from '../../components/feed/JobCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list or grid
  const [filters, setFilters] = useState({
    category: '',
    jobType: '',
    location: '',
    experienceLevel: '',
    minSalary: '',
    maxSalary: ''
  });
  const [showFilters, setShowFilters] = useState(false);

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
      opacity: 1
    }
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      const response = await axios.get(`/api/jobs?${queryParams}`);
      setJobs(response.data.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchJobs();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchJobs]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      jobType: '',
      location: '',
      experienceLevel: ''
    });
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen mesh-bg pb-20 pt-10" dir="rtl">
      <div className="premium-container">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-glow rotate-3">
              <FiBriefcase className="text-xl sm:text-2xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">مستكشف الفرص</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">البحث الذكي عن الوظائف</p>
            </div>
          </div>
          
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-sm self-end sm:self-auto">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 sm:p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FiList className="text-lg sm:text-xl" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 sm:p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FiGrid className="text-lg sm:text-xl" />
            </button>
          </div>
        </div>

        {/* Hero Search Section */}
        <div className="glass-card p-1 lg:p-2 mb-10 relative group shadow-premium-lg">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-accent rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-white/80 backdrop-blur-md rounded-[1.8rem] p-4 sm:p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              <div className="relative flex-1 group">
                <FiSearch className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-slate-400 text-lg sm:text-xl group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="ابحث عن المسمى الوظيفي، المهارة، أو الشركة..."
                  className="w-full bg-slate-50/50 border-2 border-slate-100 focus:border-primary-500 focus:ring-0 rounded-[1.2rem] sm:rounded-[1.5rem] pr-12 sm:pr-14 pl-4 sm:pl-6 py-4 sm:py-5 text-base sm:text-lg font-bold text-slate-900 placeholder-slate-400 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-3 px-6 sm:px-8 py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-xs sm:text-sm transition-all shadow-sm ${showFilters ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border-2 border-slate-100 hover:border-primary-500'}`}
                >
                  <FiFilter /> {showFilters ? 'إخفاء الفلاتر' : 'تصفية متقدمة'}
                </button>
                <button className="btn-premium-primary px-8 sm:px-10 py-4 sm:py-5 text-xs sm:text-sm font-black flex items-center justify-center gap-2">
                  <FiTrendingUp /> ابحث الآن
                </button>
              </div>
            </div>
            
            {/* Quick Stats Tags */}
            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">عمليات بحث شائعة:</span>
              {['تطوير البرمجيات', 'التسويق الرقمي', 'إدارة المشاريع', 'التصميم الجرافيكي'].map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSearchTerm(tag)}
                  className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-primary-600 hover:border-primary-200 hover:shadow-sm transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {(showFilters || window.innerWidth >= 1024) && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className={`lg:w-1/4 w-full fixed lg:relative bottom-0 left-0 right-0 z-50 lg:z-0 lg:block ${showFilters ? 'block' : 'hidden lg:block'}`}
              >
                {/* Backdrop for mobile */}
                <div 
                  className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm -z-10" 
                  onClick={() => setShowFilters(false)}
                ></div>

                <div className="glass-premium p-6 lg:p-8 sticky lg:top-24 border-none shadow-premium-xl rounded-t-[2.5rem] lg:rounded-[2rem] max-h-[85vh] overflow-y-auto lg:max-h-none">
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 lg:hidden"></div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg lg:text-xl font-black themed-text flex items-center gap-2">
                      <FiActivity className="text-primary shrink-0" />
                      خيارات التصفية
                    </h3>
                    <button onClick={clearFilters} className="text-primary text-[10px] sm:text-xs font-black hover:underline px-3 py-1.5 bg-primary-500/10 rounded-xl shrink-0">مسح الكل</button>
                  </div>

                  <div className="space-y-6 lg:space-y-8">
                    <div>
                      <label className="block text-[10px] font-black themed-text-ter uppercase tracking-[0.2em] mb-3">المجال الوظيفي</label>
                      <div className="relative group">
                        <FiBriefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary transition-colors" />
                        <select 
                          name="category"
                          value={filters.category}
                          onChange={handleFilterChange}
                          className="w-full bg-themed-bg-ter border themed-border focus:border-primary focus:ring-0 rounded-2xl pr-12 pl-4 py-3.5 font-bold themed-text appearance-none transition-all shadow-sm"
                        >
                          <option value="">كل المجالات</option>
                          <option value="تكنولوجيا المعلومات">تكنولوجيا المعلومات</option>
                          <option value="الهندسة">الهندسة</option>
                          <option value="التسويق">التسويق</option>
                          <option value="الإدارة">الإدارة</option>
                        </select>
                        <FiChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-themed-text-ter pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black themed-text-ter uppercase tracking-[0.2em] mb-3">نوع الدوام</label>
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        {['دوام كامل', 'دوام جزئي', 'عقد', 'عمل حر'].map(type => (
                          <label key={type} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer group ${filters.jobType === type ? 'border-primary bg-primary-500/5' : 'themed-border bg-themed-bg-ter hover:border-primary/30'}`}>
                            <span className={`font-black text-xs ${filters.jobType === type ? 'text-primary' : 'themed-text-sec'}`}>{type}</span>
                            <input 
                              type="radio" 
                              name="jobType"
                              value={type}
                              checked={filters.jobType === type}
                              onChange={handleFilterChange}
                              className="hidden" 
                            />
                            {filters.jobType === type && <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow"></div>}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black themed-text-ter uppercase tracking-[0.2em] mb-3 block">الراتب المتوقع</label>
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="number" 
                          name="minSalary"
                          placeholder="الأدنى"
                          value={filters.minSalary}
                          onChange={handleFilterChange}
                          className="premium-input py-3 text-xs"
                        />
                        <input 
                          type="number" 
                          name="maxSalary"
                          placeholder="الأقصى"
                          value={filters.maxSalary}
                          onChange={handleFilterChange}
                          className="premium-input py-3 text-xs"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden w-full btn-premium-primary py-4 rounded-2xl font-black text-sm shadow-glow"
                    >
                      تطبيق الفلاتر
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Job Listings */}
          <div className="lg:w-3/4 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-2 sm:px-4 gap-4">
              <div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1 text-center md:text-right">الذكاء الاصطناعي وجد</p>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 text-center md:text-right">
                  {loading ? (
                    <span className="flex items-center justify-center md:justify-start gap-3">
                      جاري البحث... <div className="w-2 h-2 rounded-full bg-primary-600 animate-ping"></div>
                    </span>
                  ) : (
                    <><span className="text-primary-600 underline decoration-primary-200 decoration-8 underline-offset-4">{jobs.length}</span> فرصة استراتيجية</>
                  )}
                </h2>
              </div>
              
              <div className="flex items-center justify-center md:justify-end gap-4">
                <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md border border-slate-100 rounded-xl px-3 sm:px-4 py-2 shadow-sm">
                  <FiActivity className="text-primary-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">ترتيب:</span>
                  <select className="bg-transparent border-none text-[10px] sm:text-xs font-black text-slate-700 focus:ring-0 cursor-pointer pr-6 sm:pr-8">
                    <option>الأكثر صلة</option>
                    <option>الأحدث نشراً</option>
                    <option>الأعلى راتباً</option>
                  </select>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card p-8 bg-white/50 animate-pulse border-none shadow-sm">
                      <div className="flex gap-6 mb-6">
                        <div className="w-20 h-20 bg-slate-200 rounded-3xl"></div>
                        <div className="flex-1 space-y-4 pt-2">
                          <div className="h-6 bg-slate-200 rounded-lg w-1/3"></div>
                          <div className="h-4 bg-slate-100 rounded-lg w-1/4"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-50 rounded-lg w-full"></div>
                        <div className="h-4 bg-slate-50 rounded-lg w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : jobs.length > 0 ? (
                <motion.div 
                  key="results"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}
                >
                  {jobs.map((job, index) => (
                    <motion.div 
                      key={job._id} 
                      variants={itemVariants}
                      layout
                    >
                      <JobCard job={job} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-20 text-center border-none shadow-premium-lg"
                >
                  <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner rotate-12">
                    <FiSearch className="text-slate-300 text-5xl" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">لم نجد ما يطابق تطلعاتك</h3>
                  <p className="text-slate-500 font-bold text-lg max-w-md mx-auto leading-relaxed">
                    الذكاء الاصطناعي لم يجد نتائج دقيقة، جرب البحث بكلمات أبسط أو وسع نطاق الفلاتر
                  </p>
                  <div className="mt-10">
                    <button 
                      onClick={clearFilters}
                      className="btn-premium-primary px-12 py-4 font-black text-sm shadow-glow"
                    >
                      تصفير كافة الفلاتر والبدء من جديد
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Newsletter CTA */}
            {!loading && jobs.length > 0 && (
              <div className="mt-12 glass-card bg-gradient-to-r from-primary-600 to-accent p-1 shadow-premium-lg">
                <div className="bg-white rounded-[1.8rem] p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="text-center lg:text-right">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">هل تريد وظائف مخصصة لبريدك؟</h3>
                    <p className="text-slate-500 font-bold">سنرسل لك أفضل الفرص التي تناسب مهاراتك أسبوعياً.</p>
                  </div>
                  <div className="flex w-full lg:w-auto gap-3">
                    <input type="email" placeholder="بريدك الإلكتروني" className="premium-input px-6 py-4 flex-1 lg:w-64" />
                    <button className="btn-premium-primary px-8">اشترك الآن</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
