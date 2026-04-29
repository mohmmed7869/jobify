import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiBriefcase, FiUsers, FiEye, FiPlus,
  FiArrowUpRight, FiZap, FiX, FiCheck,
  FiMessageSquare, FiVideo, FiSettings,
  FiChevronRight, FiAlertCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]         = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading]     = useState(true);

  // AI Modal state
  const [showAI, setShowAI]       = useState(false);
  const [aiData, setAiData]       = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          axios.get('/api/analytics/employer'),
          axios.get('/api/jobs/my-jobs'),
        ]);
        setStats(statsRes.data.data);
        setRecentJobs(jobsRes.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchAI = async () => {
    if (!recentJobs.length) {
      toast.error('انشر وظيفة أولاً لتفعيل هذه الميزة');
      return;
    }
    setShowAI(true);
    setAiLoading(true);
    const timeout = setTimeout(() => setAiLoading(false), 15000);
    try {
      const job = recentJobs[0];
      const res = await axios.get(`/api/jobs/${job._id || job.id}/suggestions`);
      if (res.data.success) {
        setAiData({ jobTitle: job.title, ...res.data.data });
      }
    } catch (e) {
      toast.error('تعذّر تحميل اقتراحات الذكاء الاصطناعي');
      setShowAI(false);
    } finally {
      clearTimeout(timeout);
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">جاري التحميل...</p>
      </div>
    );
  }

  const totalApps  = stats?.totalStats?.totalApplications || 0;
  const activeJobs = stats?.jobStats?.find(s => s._id === 'نشط')?.count || 0;
  const totalViews = stats?.totalStats?.totalViews || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-16" dir="rtl">

      {/* ══ رأس الصفحة ══════════════════════════════════ */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                أهلاً، {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {totalApps > 0
                  ? `لديك ${totalApps} متقدم على وظائفك`
                  : 'انشر أول وظيفة لبدء التوظيف'}
              </p>
            </div>
            <Link
              to="/employer/post-job"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-primary-200 text-sm"
            >
              <FiPlus size={16} /> نشر وظيفة جديدة
            </Link>
          </div>
        </div>
      </div>

      {/* ══ المحتوى الرئيسي ══════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── الإحصائيات ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'وظائف نشطة',    value: activeJobs,  icon: <FiBriefcase size={18} />, color: 'text-blue-600 bg-blue-50' },
            { label: 'إجمالي المتقدمين', value: totalApps, icon: <FiUsers size={18} />,    color: 'text-emerald-600 bg-emerald-50' },
            { label: 'مشاهدات الوظائف', value: totalViews, icon: <FiEye size={18} />,     color: 'text-amber-600 bg-amber-50' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── بطاقة AI لتحسين الوظائف ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <FiZap className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="font-bold text-base">✨ حسّن وظائفك بالذكاء الاصطناعي</p>
              <p className="text-slate-400 text-xs mt-0.5">احصل على اقتراحات فورية لجذب مرشحين أفضل</p>
            </div>
          </div>
          <button
            onClick={fetchAI}
            disabled={aiLoading}
            className="shrink-0 bg-white text-slate-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {aiLoading ? 'جاري التحليل...' : 'حلّل وظائفي الآن'}
          </button>
        </div>

        {/* ── الإجراءات السريعة ── */}
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-3">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <FiPlus size={20} />,         label: 'انشر وظيفة',    to: '/employer/post-job',         color: 'text-primary-600 bg-primary-50 border-primary-200' },
              { icon: <FiUsers size={20} />,         label: 'المتقدمون',     to: '/employer/applications',     color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { icon: <FiMessageSquare size={20} />, label: 'الرسائل',       to: '/chat',                      color: 'text-blue-600 bg-blue-50 border-blue-200' },
              { icon: <FiVideo size={20} />,         label: 'مقابلة فيديو',  to: '/interview/video',           color: 'text-violet-600 bg-violet-50 border-violet-200' },
            ].map((a, i) => (
              <Link
                key={i}
                to={a.to}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border bg-white hover:shadow-md transition-all text-center ${a.color}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${a.color}`}>
                  {a.icon}
                </div>
                <span className="text-xs font-semibold text-slate-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── الوظائف المنشورة ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">وظائفك المنشورة</h2>
            <Link to="/employer/jobs" className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
              عرض الكل <FiChevronRight size={14} />
            </Link>
          </div>

          {recentJobs.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              {recentJobs.slice(0, 5).map((job, i) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  {/* أيقونة */}
                  <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 font-bold flex items-center justify-center text-sm shrink-0">
                    {job.title.charAt(0)}
                  </div>

                  {/* التفاصيل */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{job.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><FiUsers size={10} /> {job.stats?.applications || 0} متقدم</span>
                      <span className="flex items-center gap-1"><FiEye size={10} /> {job.stats?.views || 0} مشاهدة</span>
                    </p>
                  </div>

                  {/* الحالة */}
                  <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-lg border ${
                    job.status === 'نشط'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {job.status}
                  </span>

                  {/* رابط */}
                  <Link
                    to={`/employer/jobs/${job._id}/applications`}
                    className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <FiArrowUpRight size={16} />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-12 text-center">
              <FiBriefcase className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-slate-500 font-medium mb-4">لم تنشر أي وظيفة بعد</p>
              <Link
                to="/employer/post-job"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                <FiPlus size={15} /> انشر وظيفتك الأولى
              </Link>
            </div>
          )}
        </section>

        {/* ── نصيحة سريعة ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <FiAlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-amber-800">نصيحة لزيادة عدد المتقدمين</p>
            <p className="text-xs text-amber-700 mt-1">
              الوظائف التي تحتوي على وصف واضح وراتب محدد تجذب 3x متقدمين أكثر.
              <Link to="/employer/post-job" className="underline font-bold mr-1">أضف وظيفة الآن</Link>
            </p>
          </div>
        </div>

      </div>

      {/* ══ AI Modal ══════════════════════════════════════ */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
              dir="rtl"
            >
              {/* رأس المودال */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                    <FiZap className="text-yellow-400" size={18} />
                  </div>
                  <div>
                    <p className="font-bold">اقتراحات الذكاء الاصطناعي</p>
                    {aiData?.jobTitle && (
                      <p className="text-slate-400 text-xs">{aiData.jobTitle}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowAI(false)} className="text-slate-400 hover:text-white transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              {/* المحتوى */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">جاري التحليل...</p>
                  </div>
                ) : aiData ? (
                  <div className="space-y-5">
                    {/* نقاط القوة */}
                    {aiData.analysis?.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <FiCheck className="text-green-500" size={12} /> نقاط القوة الحالية
                        </p>
                        <div className="space-y-2">
                          {aiData.analysis.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl border border-green-100">
                              <span className="text-green-500 mt-0.5">✓</span> {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* اقتراحات التحسين */}
                    {aiData.suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <FiZap className="text-amber-500" size={12} /> اقتراحات التحسين
                        </p>
                        <div className="space-y-2">
                          {aiData.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="w-5 h-5 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 border shrink-0">
                                {i + 1}
                              </span>
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* أسفل المودال */}
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowAI(false)}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  موافق، سأطبّق ذلك
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployerDashboard;