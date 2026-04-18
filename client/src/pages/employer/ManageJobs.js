import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBriefcase, FiUsers, FiEye, FiEdit2, FiTrash2, 
  FiMoreVertical, FiPlus, FiFilter, FiSearch,
  FiClock, FiTrendingUp, FiCheckCircle, FiActivity
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/jobs/my-jobs');
      setJobs(res.data.data);
    } catch (error) {
      toast.error('خطأ في تحميل الوظائف');
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) return;
    try {
      await axios.delete(`/api/jobs/${id}`);
      toast.success('تم حذف الوظيفة بنجاح');
      fetchMyJobs();
    } catch (error) {
      toast.error('فشل في حذف الوظيفة');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen luxury-aura pb-20 pt-8" dir="rtl">
      <div className="premium-container px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-black themed-text mb-2">إدارة وظائفك</h1>
            <p className="themed-text-sec font-bold flex items-center gap-2 opacity-80 text-sm md:text-base">
              <FiActivity className="text-primary-500" /> تتبع أداء وظائفك وقم بإدارتها بسهولة
            </p>
          </div>
          <Link 
            to="/employer/post-job" 
            className="btn-formal-primary py-3 md:py-4 px-6 md:px-8 flex items-center gap-2 text-base md:text-lg animate-slide-up shadow-glow w-full md:w-auto justify-center"
          >
            <FiPlus strokeWidth={3} /> نشر وظيفة جديدة
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="glass-premium p-4 md:p-6 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between border-primary-500/10">
          <div className="relative w-full md:w-96 group">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="البحث في وظائفك..."
              className="formal-input pr-12 rounded-xl md:rounded-2xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-primary-500/5 p-2 px-6 rounded-xl md:rounded-2xl border border-primary-500/10 flex items-center gap-4 w-full md:w-auto justify-center">
              <div className="text-center">
                <div className="text-xl font-black themed-text">{jobs.length}</div>
                <div className="text-[10px] font-black themed-text-ter uppercase tracking-widest">إجمالي الوظائف</div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {jobs.filter(job => job.title.toLowerCase().includes(searchTerm.toLowerCase())).map((job) => (
            <div key={job._id} className="glass-premium p-6 md:p-8 magnetic-lift group relative overflow-hidden border-primary-500/10 hover:border-primary-500/30">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-primary-500"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary-500/5 flex items-center justify-center text-primary-600 font-black text-xl md:text-2xl shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                    {job.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black themed-text mb-1 group-hover:text-primary-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold themed-text-ter">
                      <span className="flex items-center gap-1"><FiClock /> {new Date(job.createdAt).toLocaleDateString('ar-YE')}</span>
                      <span>•</span>
                      <span className={`uppercase tracking-tighter ${job.status === 'نشط' ? 'text-emerald-500' : 'themed-text-ter'}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-start">
                  <Link to={`/employer/jobs/${job._id}/edit`} className="p-2.5 md:p-3 text-themed-text-ter bg-primary-500/5 rounded-xl md:rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
                    <FiEdit2 size={18} />
                  </Link>
                  <button onClick={() => deleteJob(job._id)} className="p-2.5 md:p-3 text-themed-text-ter bg-primary-500/5 rounded-xl md:rounded-2xl hover:bg-rose-600 hover:text-white transition-all">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                <div className="p-3 md:p-4 bg-primary-500/5 rounded-xl md:rounded-2xl text-center border border-primary-500/10 group-hover:bg-white group-hover:shadow-glow-sm transition-all">
                  <div className="text-xl md:text-2xl font-black themed-text mb-1">{job.stats?.views || 0}</div>
                  <div className="text-[9px] md:text-[10px] font-black themed-text-ter uppercase flex items-center justify-center gap-1">
                    <FiEye /> مشاهدة
                  </div>
                </div>
                <div className="p-3 md:p-4 bg-primary-500/5 rounded-xl md:rounded-2xl text-center border border-primary-500/10 group-hover:bg-white group-hover:shadow-glow-sm transition-all">
                  <div className="text-xl md:text-2xl font-black text-primary-600 mb-1">{job.stats?.applications || 0}</div>
                  <div className="text-[9px] md:text-[10px] font-black themed-text-ter uppercase flex items-center justify-center gap-1">
                    <FiUsers /> متقدم
                  </div>
                </div>
                <div className="p-3 md:p-4 bg-primary-500/5 rounded-xl md:rounded-2xl text-center border border-primary-500/10 group-hover:bg-white group-hover:shadow-glow-sm transition-all">
                  <div className="text-xl md:text-2xl font-black text-emerald-600 mb-1">{job.stats?.shortlisted || 0}</div>
                  <div className="text-[9px] md:text-[10px] font-black themed-text-ter uppercase flex items-center justify-center gap-1">
                    <FiCheckCircle /> مقبول
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t themed-border">
                <Link 
                  to={`/employer/jobs/${job._id}/applications`} 
                  className="flex items-center gap-2 text-primary-600 font-black text-xs md:text-sm hover:gap-3 transition-all"
                >
                  عرض المتقدمين <FiTrendingUp />
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] md:text-[10px] font-black themed-text-ter uppercase tracking-tighter">تحليل الذكاء الاصطناعي:</span>
                  <div className="h-1.5 w-16 md:w-20 bg-primary-500/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiBriefcase className="themed-text-ter opacity-30 text-3xl md:text-4xl" />
            </div>
            <h3 className="text-xl md:text-2xl font-black themed-text mb-2">لا توجد وظائف بعد</h3>
            <p className="themed-text-sec font-bold mb-8 opacity-80 text-sm md:text-base">ابدأ بنشر أول وظيفة لك لجذب المتقدمين المبدعين</p>
            <Link to="/employer/post-job" className="btn-formal-primary px-8 md:px-10 py-3 md:py-4 text-base md:text-lg">
              انشر وظيفتك الأولى الآن
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageJobs;
