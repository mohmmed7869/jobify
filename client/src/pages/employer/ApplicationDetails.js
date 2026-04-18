import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiBook, 
  FiAward, FiDownload, FiCheckCircle, FiXCircle, FiCpu, 
  FiTrendingUp, FiMessageSquare, FiVideo, FiCalendar, FiClock, FiArrowRight,
  FiChevronLeft, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getFileUrl } from '../../utils/fileUrl';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [interviewData, setInterviewData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: ''
  });

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/applications/${id}`);
      setApplication(res.data.data);
    } catch (error) {
      toast.error('خطأ في تحميل تفاصيل الطلب');
      navigate('/employer/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      await axios.post(`/api/applications/${id}/schedule-video-interview`, interviewData);
      toast.success('تمت جدولة مقابلة الفيديو بنجاح');
      setShowScheduleModal(false);
      fetchApplicationDetails();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'فشل في جدولة المقابلة';
      toast.error(errorMsg);
    }
  };

  const updateStatus = async (status) => {
    try {
      await axios.put(`/api/applications/${id}/status`, { status });
      toast.success(`تم تحديث الحالة إلى: ${status}`);
      fetchApplicationDetails();
    } catch (error) {
      toast.error('فشل في تحديث الحالة');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!application) return null;

  const { applicant, job, aiAnalysis } = application;

  return (
    <div className="min-h-screen luxury-aura pb-20 pt-8 px-4 md:px-6" dir="rtl">
      <div className="premium-container">
        
        {/* Navigation & Actions Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="animate-slide-up">
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-black mb-4 transition-all group text-sm"
            >
              <FiChevronLeft className="rotate-180 group-hover:-translate-x-1 transition-transform" /> العودة للطلبات
            </button>
            <h1 className="text-3xl md:text-4xl font-black themed-text leading-tight">
              ملف <span className="text-primary-600">{applicant?.name}</span>
            </h1>
            <p className="themed-text-sec font-bold opacity-80 mt-1">متقدم لوظيفة: {job?.title}</p>
          </div>

          <div className="flex flex-wrap gap-3 animate-slide-up">
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="btn-formal-primary px-6 py-3 bg-indigo-600 border-indigo-600 shadow-indigo-100 flex items-center gap-2"
            >
              <FiCalendar /> جدولة مقابلة فيديو
            </button>
            <button 
              onClick={() => updateStatus('مقبول')}
              className="btn-formal-primary px-6 py-3 bg-emerald-600 border-emerald-600 shadow-emerald-100 flex items-center gap-2"
            >
              <FiCheckCircle /> قبول مبدئي
            </button>
            <button 
              onClick={() => updateStatus('مرفوض')}
              className="px-6 py-3 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-black text-sm hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              <FiXCircle /> رفض الطلب
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Sidebar */}
          <div className="lg:col-span-1 space-y-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="glass-premium p-8 rounded-[2.5rem] border-primary-500/10 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
              
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary-500/10 to-indigo-600/10 rounded-[2rem] md:rounded-[3rem] mx-auto flex items-center justify-center text-primary-600 text-4xl md:text-5xl font-black mb-6 border-2 border-white shadow-inner group-hover:scale-105 transition-transform duration-500">
                {applicant?.name?.charAt(0)}
              </div>
              
              <h2 className="text-xl md:text-2xl font-black themed-text mb-2">{applicant?.name}</h2>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 border border-primary-100`}>
                {application.status}
              </span>

              <div className="mt-8 space-y-4 text-right">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <FiMail className="text-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black themed-text-ter uppercase">البريد الإلكتروني</p>
                    <p className="themed-text font-bold text-sm truncate">{applicant?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <FiPhone className="text-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black themed-text-ter uppercase">رقم الهاتف</p>
                    <p className="themed-text font-bold text-sm">{applicant?.profile?.phone || 'غير مسجل'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <FiMapPin className="text-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black themed-text-ter uppercase">الموقع</p>
                    <p className="themed-text font-bold text-sm">{applicant?.profile?.location?.city || 'غير محدد'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-3">
                <Link to={`/chat?userId=${applicant?._id}`} className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col items-center gap-2 hover:bg-primary-600 transition-all">
                  <FiMessageSquare size={20} />
                  <span className="text-[10px] font-black">مراسلة</span>
                </Link>
                <button className="p-4 bg-indigo-600 text-white rounded-2xl flex flex-col items-center gap-2 hover:bg-indigo-700 transition-all">
                  <FiVideo size={20} />
                  <span className="text-[10px] font-black">مقابلة AI</span>
                </button>
              </div>
            </div>

            {/* Resume Card */}
            <div className="glass-premium p-8 rounded-[2.5rem] border-emerald-500/10 bg-emerald-500/5 relative overflow-hidden">
              <h3 className="text-lg font-black themed-text mb-6 flex items-center gap-3">
                <FiFileText className="text-emerald-600" /> السيرة الذاتية
              </h3>
              {applicant?.jobseekerProfile?.resume ? (
                <a 
                  href={getFileUrl(applicant.jobseekerProfile.resume)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all border border-emerald-100"
                >
                  <FiDownload /> تحميل السيرة (PDF)
                </a>
              ) : (
                <div className="text-center py-4 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold text-xs italic">لا توجد سيرة مرفقة</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Content */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            
            {/* AI Analysis Section */}
            <div className="glass-premium p-8 md:p-10 rounded-[2.5rem] border-primary-500/20 bg-slate-900 text-white relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6 text-right">
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-glow animate-pulse">
                    <FiCpu size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white mb-1">تحليل المطابقة الذكي</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Smart Matching Insights</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-black text-primary-400 tracking-tighter">
                      {aiAnalysis?.matchingScore || 0}%
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">درجة التوافق</div>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <h4 className="text-xs font-black text-primary-400 uppercase mb-4 flex items-center gap-2">
                    <FiTrendingUp /> نقاط القوة
                  </h4>
                  <ul className="space-y-3">
                    {(aiAnalysis?.strengths || ['خبرة تقنية قوية', 'مهارات تواصل ممتازة', 'خلفية تعليمية مطابقة']).map((s, i) => (
                      <li key={i} className="text-sm font-bold text-slate-200 flex items-start gap-3">
                        <FiCheckCircle className="text-emerald-400 mt-1 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <h4 className="text-xs font-black text-rose-400 uppercase mb-4 flex items-center gap-2">
                    <FiXCircle className="text-rose-400" /> فجوات المهارات
                  </h4>
                  <ul className="space-y-3">
                    {(aiAnalysis?.improvements || ['يحتاج لتعزيز مهارات القيادة', 'ينقصه بعض الشهادات الاحترافية']).map((im, i) => (
                      <li key={i} className="text-sm font-bold text-slate-200 flex items-start gap-3">
                        <FiXCircle className="text-rose-400 mt-1 shrink-0" /> {im}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* تفاصيل المقابلة المجدولة لصاحب العمل */}
            {application.interview?.scheduled && (
              <div className="glass-premium p-8 md:p-10 rounded-[2.5rem] border-amber-500/20 bg-amber-500/5 relative overflow-hidden animate-slide-up">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4 text-right">
                    <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-glow">
                      <FiVideo size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black themed-text mb-1">المقابلة المجدولة</h3>
                      <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest">Scheduled Video Interview</p>
                    </div>
                  </div>
                  <a 
                    href={application.interview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-formal-primary py-3 px-6 bg-indigo-600 border-indigo-600 text-xs flex items-center gap-2"
                  >
                    <FiVideo /> دخول المقابلة الآن
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-5 bg-white/60 rounded-3xl border border-amber-100 flex items-center gap-4">
                    <FiCalendar className="text-amber-500" size={20} />
                    <div className="text-right">
                      <p className="text-[10px] font-black themed-text-ter uppercase">التاريخ</p>
                      <p className="themed-text font-bold text-sm">
                        {new Date(application.interview.date).toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 bg-white/60 rounded-3xl border border-amber-100 flex items-center gap-4">
                    <FiClock className="text-amber-500" size={20} />
                    <div className="text-right">
                      <p className="text-[10px] font-black themed-text-ter uppercase">الوقت</p>
                      <p className="themed-text font-bold text-sm">{application.interview.time}</p>
                    </div>
                  </div>
                </div>

                {application.interview.notes && (
                  <div className="p-6 bg-white/40 rounded-[2rem] border border-dashed border-amber-200">
                    <p className="text-[10px] font-black themed-text-ter uppercase mb-3 flex items-center gap-2">
                      <FiMessageSquare className="text-amber-500" /> ملاحظاتك للمتقدم:
                    </p>
                    <p className="themed-text text-sm font-bold italic">"{application.interview.notes}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Profile Content Tabs (Skills, Experience, Education) */}
            <div className="glass-premium p-8 md:p-10 rounded-[2.5rem] border-primary-500/10">
              <div className="space-y-12 text-right">
                
                {/* Skills */}
                <section>
                  <h3 className="text-xl font-black themed-text mb-6 flex items-center gap-3">
                    <FiAward className="text-primary-500" /> المهارات والكفاءات
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {applicant?.jobseekerProfile?.skills?.map(skill => (
                      <span key={skill} className="px-5 py-2.5 bg-primary-500/5 text-primary-600 border border-primary-500/10 rounded-2xl text-xs font-black uppercase shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Experience */}
                <section>
                  <h3 className="text-xl font-black themed-text mb-8 flex items-center gap-3">
                    <FiBriefcase className="text-primary-500" /> الخبرة العملية
                  </h3>
                  <div className="space-y-8 relative pr-8">
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary-500/10 rounded-full"></div>
                    {applicant?.jobseekerProfile?.experience?.length > 0 ? applicant.jobseekerProfile.experience.map((exp, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -right-[36px] top-0 w-4 h-4 bg-primary-500 rounded-full border-4 border-white shadow-glow"></div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-black themed-text">{exp.title}</h4>
                          <p className="text-primary-600 font-bold text-sm">{exp.company}</p>
                          <p className="text-themed-text-ter text-xs font-black flex items-center gap-2">
                            <FiCalendar /> {exp.startDate ? new Date(exp.startDate).toLocaleDateString('ar-YE') : ''} - {exp.current ? 'الآن' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('ar-YE') : '')}
                          </p>
                          <p className="text-themed-text-sec text-sm leading-relaxed mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                            {exp.description}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-slate-400 italic">لا توجد خبرات مسجلة</p>
                    )}
                  </div>
                </section>

                {/* Education */}
                <section>
                  <h3 className="text-xl font-black themed-text mb-8 flex items-center gap-3">
                    <FiBook className="text-primary-500" /> التعليم والمؤهلات
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {applicant?.jobseekerProfile?.education?.map((edu, i) => (
                      <div key={i} className="p-6 bg-primary-500/5 rounded-[2rem] border border-primary-500/10 relative overflow-hidden group hover:bg-white hover:shadow-glow-sm transition-all duration-500">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-primary-500 opacity-20"></div>
                        <h4 className="text-base font-black themed-text mb-1">{edu.degree}</h4>
                        <p className="text-primary-600 font-bold text-xs mb-3">{edu.school}</p>
                        <p className="text-themed-text-ter text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <FiCalendar /> {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'الآن'}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="glass-premium w-full max-w-md p-8 animate-scale-up border-primary-500/20 shadow-premium-xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black themed-text">جدولة مقابلة ذكية</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-themed-text-ter hover:text-rose-500 transition-colors">
                <FiXCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-black themed-text-sec mr-1 uppercase opacity-70 text-right">التاريخ</label>
                <input 
                  type="date" 
                  className="formal-input rounded-2xl w-full text-right"
                  value={interviewData.date}
                  onChange={(e) => setInterviewData({...interviewData, date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-black themed-text-sec mr-1 uppercase opacity-70 text-right">الوقت</label>
                <input 
                  type="time" 
                  className="formal-input rounded-2xl w-full text-right"
                  value={interviewData.time}
                  onChange={(e) => setInterviewData({...interviewData, time: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-black themed-text-sec mr-1 uppercase opacity-70 text-right">ملاحظات للمتقدم</label>
                <textarea 
                  rows="3"
                  className="formal-input rounded-2xl w-full text-right"
                  placeholder="مثال: يرجى تجهيز عرض تقديمي..."
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({...interviewData, notes: e.target.value})}
                ></textarea>
              </div>

              <button 
                onClick={handleScheduleInterview}
                className="w-full py-5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-black shadow-glow hover:shadow-glow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                <FiVideo /> تأكيد الجدولة الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FiAlertCircle = ({ className }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default ApplicationDetails;
