import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, Link, useParams } from 'react-router-dom';
import { 
  FiUsers, FiFilter, FiSearch, FiCheck, FiX, 
  FiMail, FiPhone, FiDownload, FiEye, FiCpu,
  FiTrendingUp, FiCalendar, FiArrowLeft, FiArrowRight,
  FiMoreVertical, FiMessageSquare, FiVideo
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getFileUrl } from '../../utils/fileUrl';

const ViewApplications = () => {
  const { id: pathJobId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const jobId = pathJobId || queryParams.get('jobId');

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('matching_score');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [interviewData, setInterviewData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: ''
  });

  useEffect(() => {
    fetchApplications();
  }, [jobId, statusFilter, sortBy]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/applications/employer', {
        params: {
          jobId: jobId || undefined,
          status: statusFilter || undefined,
          sort: sortBy
        }
      });
      setApplications(res.data.data);
    } catch (error) {
      toast.error('خطأ في تحميل المتقدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      await axios.post(`/api/applications/${selectedApp}/schedule-video-interview`, interviewData);
      toast.success('تمت جدولة مقابلة الفيديو بنجاح');
      setShowScheduleModal(false);
      fetchApplications();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'فشل في جدولة المقابلة';
      toast.error(errorMsg);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/applications/${id}/status`, { status });
      toast.success(`تم تحديث الحالة إلى: ${status}`);
      fetchApplications();
    } catch (error) {
      toast.error('فشل في تحديث الحالة');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen luxury-aura pb-20 pt-8" dir="rtl">
      <div className="premium-container px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-black themed-text mb-2">طلبات التوظيف</h1>
            <p className="themed-text-sec font-bold flex items-center gap-2 opacity-80 text-sm md:text-base">
              <FiUsers className="text-primary-500" /> إدارة المتقدمين لوظائفك {jobId && 'المختارة'}
            </p>
          </div>
        </div>

        {/* Control Bar */}
        <div className="glass-premium p-4 md:p-6 mb-10 flex flex-col lg:flex-row gap-6 items-center justify-between border-primary-500/10">
          <div className="relative w-full lg:w-96 group">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="البحث باسم المتقدم..."
              className="formal-input pr-12 rounded-xl md:rounded-2xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <select 
              className="formal-input rounded-xl md:rounded-2xl appearance-none w-full sm:w-auto min-w-[150px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">جميع الحالات</option>
              <option value="جديد">جديد</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="مقابلة">مقابلة</option>
              <option value="مقبول">مقبول</option>
              <option value="مرفوض">مرفوض</option>
            </select>

            <select 
              className="formal-input rounded-xl md:rounded-2xl appearance-none w-full sm:w-auto min-w-[200px]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="matching_score">ترتيب حسب مطابقة AI</option>
              <option value="-createdAt">الأحدث أولاً</option>
            </select>
          </div>
        </div>

        {/* Applicants Grid */}
        <div className="grid grid-cols-1 gap-6 md:gap-8 animate-fade-in">
          {applications.filter(app => (app.applicant?.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((app) => (
            <div key={app._id} className="glass-premium p-0 overflow-hidden magnetic-lift group border-primary-500/10">
              <div className="flex flex-col lg:flex-row">
                {/* AI Score Section */}
                <div className="lg:w-48 bg-primary-500/5 p-6 md:p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-l themed-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl border-2 border-primary-500/20 bg-white flex items-center justify-center mb-3 group-hover:border-primary-500 group-hover:shadow-glow-sm transition-all duration-500 shadow-inner">
                      <span className="text-xl md:text-2xl font-black text-primary-600">
                        {app.aiAnalysis?.matchingScore || 0}%
                      </span>
                    </div>
                    <div className="text-[9px] md:text-[10px] font-black themed-text-ter uppercase tracking-widest flex items-center gap-1 justify-center opacity-80">
                      <FiCpu /> مطابقة AI
                    </div>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="flex-1 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-4 md:gap-6">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary-500/5 flex items-center justify-center text-primary-600 font-black text-xl md:text-2xl shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                        {app.applicant?.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-black themed-text mb-1">{app.applicant?.name}</h3>
                        <p className="text-primary-600 font-black text-xs md:text-sm mb-4">{app.job?.title}</p>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs font-bold themed-text-ter">
                          <span className="flex items-center gap-2"><FiMail className="text-primary-500" /> {app.applicant?.email}</span>
                          <span className="flex items-center gap-2"><FiPhone className="text-primary-500" /> {app.applicant?.profile?.phone || 'غير مسجل'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                      <span className={`px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm border ${
                        app.status === 'مقبول' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        app.status === 'مرفوض' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                        app.status === 'مقابلة' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-primary-500/10 text-primary-600 border-primary-500/20'
                      }`}>
                        {app.status}
                      </span>
                      <p className="text-[9px] md:text-[10px] font-black themed-text-ter opacity-60">تقدم في: {new Date(app.createdAt).toLocaleDateString('ar-YE')}</p>
                    </div>
                  </div>

                  {/* Skills Tag Cloud */}
                  {app.applicant?.jobseekerProfile?.skills && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {app.applicant.jobseekerProfile.skills.slice(0, 5).map(skill => (
                        <span key={skill} className="px-3 py-1 bg-primary-500/5 text-themed-text-ter border border-primary-500/10 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-tight">
                          {skill}
                        </span>
                      ))}
                      {app.applicant.jobseekerProfile.skills.length > 5 && (
                        <span className="text-[10px] font-black themed-text-ter opacity-50">+{app.applicant.jobseekerProfile.skills.length - 5} أكثر</span>
                      )}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="mt-8 pt-8 border-t themed-border flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateStatus(app._id, 'مقبول')}
                        className="p-2.5 md:p-3 text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 rounded-xl md:rounded-2xl hover:bg-emerald-500 hover:text-white transition-all"
                        title="قبول"
                      >
                        <FiCheck size={20} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedApp(app._id);
                          setShowScheduleModal(true);
                        }}
                        className="p-2.5 md:p-3 text-indigo-500 bg-indigo-500/5 border border-indigo-500/10 rounded-xl md:rounded-2xl hover:bg-indigo-500 hover:text-white transition-all"
                        title="جدولة مقابلة فيديو ذكية"
                      >
                        <FiCpu size={20} />
                      </button>
                      <button 
                        onClick={() => updateStatus(app._id, 'مقابلة')}
                        className="p-2.5 md:p-3 text-amber-500 bg-amber-500/5 border border-amber-500/10 rounded-xl md:rounded-2xl hover:bg-amber-500 hover:text-white transition-all"
                        title="دعوة لمقابلة"
                      >
                        <FiCalendar size={20} />
                      </button>
                      <button 
                        onClick={() => updateStatus(app._id, 'مرفوض')}
                        className="p-2.5 md:p-3 text-rose-500 bg-rose-500/5 border border-rose-500/10 rounded-xl md:rounded-2xl hover:bg-rose-600 hover:text-white transition-all"
                        title="رفض"
                      >
                        <FiX size={20} />
                      </button>
                      
                      <Link 
                        to={`/chat?userId=${app.applicant?._id}&userName=${app.applicant?.name}`}
                        className="p-2.5 md:p-3 text-primary-500 bg-primary-500/5 border border-primary-500/10 rounded-xl md:rounded-2xl hover:bg-primary-500 hover:text-white transition-all"
                        title="مراسلة المتقدم"
                      >
                        <FiMessageSquare size={20} />
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link 
                        to={`/employer/applications/${app._id}`}
                        className="p-2.5 px-5 md:px-6 border-2 border-primary-500/20 text-primary-600 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 hover:bg-primary-500/5 transition-all"
                      >
                        <FiEye /> التفاصيل
                      </Link>
                      {app.interview?.meetingLink && (
                        <a 
                          href={app.interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-formal-primary py-2.5 px-5 md:px-6 text-xs md:text-sm flex items-center gap-2 bg-indigo-600 border-indigo-600"
                        >
                          <FiVideo /> دخول المقابلة
                        </a>
                      )}
                      {app.resume?.path ? (
                        <a 
                          href={getFileUrl(app.resume.path)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-formal-primary py-2.5 px-5 md:px-6 text-xs md:text-sm flex items-center gap-2"
                        >
                          <FiDownload /> السيرة الذاتية
                        </a>
                      ) : (
                        <button 
                          disabled 
                          className="py-2.5 px-5 md:px-6 text-xs md:text-sm flex items-center gap-2 bg-slate-100 text-slate-400 rounded-xl md:rounded-2xl cursor-not-allowed border border-slate-200"
                        >
                          <FiDownload /> لا توجد سيرة
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {applications.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiUsers className="themed-text-ter opacity-30 text-3xl md:text-4xl" />
              </div>
              <h3 className="text-xl md:text-2xl font-black themed-text mb-2">لا توجد طلبات بعد</h3>
              <p className="themed-text-sec font-bold opacity-80 text-sm md:text-base">بمجرد تقدم الأشخاص لوظائفك، ستظهر طلباتهم هنا.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="glass-premium w-full max-w-md p-8 animate-scale-up border-primary-500/20 shadow-premium-xl">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-black themed-text">جدولة مقابلة ذكية</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-themed-text-ter hover:text-rose-500 transition-colors">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-black themed-text-sec mr-1 uppercase opacity-70">التاريخ</label>
                <input 
                  type="date" 
                  className="formal-input rounded-xl md:rounded-2xl"
                  value={interviewData.date}
                  onChange={(e) => setInterviewData({...interviewData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-black themed-text-sec mr-1 uppercase opacity-70">الوقت</label>
                <input 
                  type="time" 
                  className="formal-input rounded-xl md:rounded-2xl"
                  value={interviewData.time}
                  onChange={(e) => setInterviewData({...interviewData, time: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-black themed-text-sec mr-1 uppercase opacity-70">ملاحظات للمتقدم</label>
                <textarea 
                  className="formal-input rounded-xl md:rounded-2xl h-24 resize-none py-3"
                  placeholder="مثال: يرجى تجهيز عرض تقديمي..."
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({...interviewData, notes: e.target.value})}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={handleScheduleInterview}
                  className="btn-formal-primary flex-1 py-3 md:py-4 font-black shadow-glow text-sm md:text-base order-2 sm:order-1"
                >
                  تأكيد الجدولة
                </button>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="w-full sm:w-auto p-3 px-8 rounded-xl md:rounded-2xl border-2 border-primary-500/20 text-primary-600 font-black hover:bg-primary-500/5 transition-all text-sm md:text-base order-1 sm:order-2"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplications;
