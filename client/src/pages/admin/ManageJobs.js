import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiSearch, FiFilter, FiBriefcase, FiTrash2, 
  FiCheckCircle, FiXCircle, FiEye, FiArrowLeft, FiArrowRight,
  FiMapPin, FiDollarSign, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const AdminManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/jobs', {
        params: {
          page,
          limit: 10,
          status: statusFilter,
          search: searchTerm
        }
      });
      setJobs(res.data.data);
      setTotalPages(Math.ceil(res.data.total / 10));
    } catch (error) {
      toast.error('خطأ في تحميل الوظائف');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) return;
    try {
      await axios.delete(`/api/admin/jobs/${jobId}`);
      toast.success('تم حذف الوظيفة بنجاح');
      fetchJobs();
    } catch (error) {
      toast.error('فشل في حذف الوظيفة');
    }
  };

  if (loading && page === 1) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen mesh-bg pb-20 pt-8" dir="rtl">
      <div className="premium-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-black text-slate-900 mb-2">إدارة الوظائف</h1>
            <p className="text-slate-500 font-bold flex items-center gap-2">
              <FiBriefcase className="text-primary-500" /> مراجعة وإدارة جميع الوظائف المنشورة
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 relative group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="البحث عن وظيفة..."
                className="premium-input pr-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="premium-input appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">جميع الحالات</option>
                <option value="نشط">نشط</option>
                <option value="مغلق">مغلق</option>
                <option value="مسودة">مسودة</option>
              </select>
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => { setPage(1); fetchJobs(); }} className="btn-premium-primary py-3">
              بحث وتصفية
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          {jobs.map((job) => (
            <div key={job._id} className="glass-card p-6 hover-card group">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-primary-600 font-black text-2xl shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                    {job.company?.name?.charAt(0) || 'و'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
                      <span className="flex items-center gap-1"><FiBriefcase size={14} /> {job.company?.name || 'شركة غير معروفة'}</span>
                      <span className="flex items-center gap-1">
                        <FiMapPin size={14} /> 
                        {job.location && typeof job.location === 'object' 
                          ? `${job.location.city || ''}${job.location.country ? `, ${job.location.country}` : ''}`
                          : (job.location || 'الموقع غير محدد')}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1">
                          <FiDollarSign size={14} /> 
                          {job.salary.min || 0} - {job.salary.max || 0} {job.salary.currency || 'USD'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    job.status === 'نشط' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {job.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link to={`/jobs/${job._id}`} className="p-3 text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
                      <FiEye size={20} />
                    </Link>
                    <button 
                      onClick={() => deleteJob(job._id)}
                      className="p-3 text-slate-400 bg-slate-50 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-4 glass-card disabled:opacity-50 hover:text-primary-600 transition-all"
            >
              <FiArrowRight />
            </button>
            <div className="glass-card px-8 py-4 font-black text-slate-900">
              {page} / {totalPages}
            </div>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-4 glass-card disabled:opacity-50 hover:text-primary-600 transition-all"
            >
              <FiArrowLeft />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManageJobs;
