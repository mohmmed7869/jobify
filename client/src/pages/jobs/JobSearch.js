import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiMapPin, FiBriefcase, 
  FiChevronDown, FiActivity, FiTrendingUp,
  FiGrid, FiList, FiAlertCircle, FiX
} from 'react-icons/fi';
import JobCard from '../../components/feed/JobCard';

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    category: '',
    jobType: '',
    location: '',
    experienceLevel: '',
    minSalary: '',
    maxSalary: ''
  });
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
        sort: sortBy,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      const response = await axios.get(`/api/jobs?${queryParams}`);
      setJobs(response.data.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, sortBy]);

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
      experienceLevel: '',
      minSalary: '',
      maxSalary: ''
    });
    setSearchTerm('');
    setShowFiltersMobile(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* رأس الصفحة للبحث */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">ابحث عن وظيفتك القادمة</h1>
          <p className="text-slate-400 text-sm mb-6">آلاف الفرص الوظيفية بانتظارك، ابحث بالكلمات المفتاحية أو المسمى الوظيفي.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="مثال: مطور ويب، مهندس مدني، مبيعات..."
                className="w-full bg-white text-slate-900 border-none rounded-xl pr-12 pl-4 py-4 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFiltersMobile(true)}
              className="sm:hidden bg-slate-800 text-white flex items-center justify-center gap-2 py-4 rounded-xl font-bold border border-slate-700"
            >
              <FiFilter /> تصفية
            </button>
            <button className="hidden sm:flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold transition-colors">
              بحث
            </button>
          </div>

          {/* الكلمات الشائعة */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 ml-2">شائع:</span>
            {['تطوير برمجيات', 'تسويق', 'إدارة مشاريع', 'تصميم'].map(tag => (
              <button 
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* الفلاتر (جانبية في الشاشات الكبيرة، Modal في الجوال) */}
          <div className={`lg:w-1/4 ${showFiltersMobile ? 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4' : 'hidden lg:block'}`}>
            <div className={`bg-white rounded-t-3xl sm:rounded-3xl w-full max-h-[90vh] overflow-y-auto sm:h-auto border border-slate-100 shadow-sm ${showFiltersMobile ? 'p-6 pb-safe' : 'p-6'}`}>
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FiFilter className="text-primary-600" /> تصفية النتائج
                </h3>
                <div className="flex items-center gap-3">
                  <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-primary-600 font-semibold underline">مسح</button>
                  {showFiltersMobile && (
                    <button onClick={() => setShowFiltersMobile(false)} className="lg:hidden text-slate-400 bg-slate-100 p-1.5 rounded-lg">
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* المجال الوظيفي */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">المجال الوظيفي</label>
                  <div className="relative">
                    <FiBriefcase className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                    >
                      <option value="">الكل</option>
                      <option value="تكنولوجيا المعلومات">تكنولوجيا المعلومات</option>
                      <option value="الهندسة">الهندسة</option>
                      <option value="التسويق">التسويق</option>
                      <option value="الإدارة">الإدارة</option>
                    </select>
                    <FiChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* نوع الدوام */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">نوع الدوام</label>
                  <div className="flex flex-wrap gap-2">
                    {['دوام كامل', 'دوام جزئي', 'عقد', 'عمل حر'].map(type => (
                      <label key={type} className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${filters.jobType === type ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <input 
                          type="radio" 
                          name="jobType"
                          value={type}
                          checked={filters.jobType === type}
                          onChange={handleFilterChange}
                          className="hidden" 
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                {/* زر تطبيق في الجوال */}
                {showFiltersMobile && (
                  <button 
                    onClick={() => setShowFiltersMobile(false)}
                    className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl mt-4"
                  >
                    عرض النتائج
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* قائمة الوظائف */}
          <div className="lg:w-3/4 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                {loading ? 'جاري البحث...' : `وجدنا ${jobs.length} وظيفة`}
              </h2>
              
              {/* خيارات العرض والترتيب */}
              <div className="flex items-center gap-2">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3 py-2 outline-none"
                >
                  <option value="newest">الأحدث</option>
                  <option value="relevant">الأكثر صلة</option>
                </select>
                <div className="hidden sm:flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-slate-100 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <FiList />
                  </button>
                  <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-slate-100 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <FiGrid />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
                        <div className="flex-1 space-y-3 pt-1">
                          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                          <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobs.length > 0 ? (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
                  {jobs.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <FiSearch size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">لا توجد نتائج مطابقة</h3>
                  <p className="text-sm text-slate-500 mb-6">لم نجد وظائف تطابق بحثك. جرب كلمات أخرى أو قم بمسح الفلاتر.</p>
                  <button 
                    onClick={clearFilters}
                    className="bg-primary-50 text-primary-600 font-bold px-6 py-2.5 rounded-xl hover:bg-primary-100 transition-colors"
                  >
                    مسح كل الفلاتر
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
