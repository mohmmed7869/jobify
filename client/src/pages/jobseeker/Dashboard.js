import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiStar, FiEye, FiBookmark, FiCheck,
  FiArrowLeft, FiArrowRight, FiFileText, FiZap,
  FiChevronRight, FiClock, FiMapPin, FiTrendingUp,
  FiUser, FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// ─── ثوابت ────────────────────────────────────────────
const STATUS_MAP = {
  pending:   { label: 'قيد المراجعة', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  interview: { label: 'مقابلة',        cls: 'bg-blue-50 text-blue-700 border-blue-200'   },
  accepted:  { label: 'مقبول ✓',       cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected:  { label: 'مرفوض',         cls: 'bg-red-50 text-red-700 border-red-200'       }
};

const getStatus = (s) => STATUS_MAP[s] || STATUS_MAP.pending;

// ─── حساب قوة الملف ────────────────────────────────────
function calcStrength(user) {
  const steps = [
    { done: !!user?.profile?.bio,                          label: 'نبذة شخصية',    path: '/profile' },
    { done: !!user?.profile?.avatar,                       label: 'صورة شخصية',    path: '/profile' },
    { done: (user?.jobseekerProfile?.skills?.length > 0),  label: 'مهاراتك',        path: '/profile#skills' },
    { done: (user?.jobseekerProfile?.experience?.length > 0), label: 'الخبرة',      path: '/profile#experience' },
    { done: (user?.jobseekerProfile?.education?.length > 0),  label: 'التعليم',     path: '/profile#education' },
    { done: !!user?.jobseekerProfile?.resume,              label: 'السيرة الذاتية', path: '/resume-builder' },
  ];
  const pct = Math.round((steps.filter(s => s.done).length / steps.length) * 100);
  const next = steps.find(s => !s.done);
  return { pct, next, steps };
}

// ─── المكون الرئيسي ─────────────────────────────────────
const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]           = useState({ applications: 0, views: 0, saved: 0, matches: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [recommendations, setRecs]  = useState([]);
  const [loading, setLoading]       = useState(true);

  const { pct: profilePct, next: nextStep } = calcStrength(user);

  // ─── جلب البيانات ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, appsRes, recsRes] = await Promise.all([
          axios.get('/api/analytics/jobseeker'),
          axios.get('/api/applications/my'),
          axios.get('/api/ai/recommendations?limit=3'),
        ]);

        if (statsRes.data.success) {
          const s = statsRes.data.data;
          setStats({
            applications: s.applicationStats?.reduce((sum, i) => sum + i.count, 0) || 0,
            views:        s.profileViews || 0,
            saved:        user?.savedJobs?.length || 0,
            matches:      s.bestApplications?.length || 0,
          });
        }
        if (appsRes.data.success) setRecentApps(appsRes.data.data.slice(0, 5));
        if (recsRes.data.success) setRecs(recsRes.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // ─── حالة التحميل ─────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">جاري التحميل...</p>
      </div>
    );
  }

  // ─── الواجهة ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-16" dir="rtl">
      {/* ══ رأس الصفحة ══════════════════════════════════ */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          
          {/* تحية + اسم */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                أهلاً، {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {stats.matches > 0
                  ? `لديك ${stats.matches} وظيفة مناسبة لك اليوم`
                  : 'أكمل ملفك لنعثر لك على أفضل الوظائف'}
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors"
            >
              <FiUser size={15} /> تعديل الملف الشخصي
            </Link>
          </div>

          {/* ══ شريط قوة الملف ══════════════════════════════ */}
          <div className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
            profilePct === 100 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700">
                  {profilePct === 100 ? '✅ ملفك مكتمل!' : `قوة ملفك: ${profilePct}%`}
                </span>
                <span className="text-xs text-slate-500">{profilePct}/100</span>
              </div>
              <div className="h-2 bg-white/80 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profilePct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    profilePct === 100 ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                />
              </div>
              {nextStep && (
                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                  <FiAlertCircle size={12} className="text-amber-500" />
                  الخطوة التالية: <strong>{nextStep.label}</strong>
                </p>
              )}
            </div>
            {nextStep && (
              <Link
                to={nextStep.path}
                className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                أكمل الآن
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ══ المحتوى الرئيسي ══════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── أزرار الإجراءات السريعة ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ✨ تحسين السيرة */}
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/resume-builder"
              className="flex items-center gap-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl p-5 transition-colors shadow-md shadow-primary-200"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <FiZap size={22} />
              </div>
              <div>
                <p className="font-bold text-base">✨ حسّن سيرتك الذاتية</p>
                <p className="text-primary-100 text-xs mt-0.5">يساعدك الذكاء الاصطناعي خلال ثوانٍ</p>
              </div>
              <FiArrowLeft className="mr-auto text-primary-200" size={18} />
            </Link>
          </motion.div>

          {/* 🔍 ابحث عن وظيفة */}
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/jobs"
              className="flex items-center gap-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 transition-colors shadow-sm"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-slate-600">
                <FiSearch size={22} />
              </div>
              <div>
                <p className="font-bold text-base">🔍 ابحث عن وظيفة</p>
                <p className="text-slate-400 text-xs mt-0.5">آلاف الفرص تنتظرك</p>
              </div>
              <FiArrowLeft className="mr-auto text-slate-300" size={18} />
            </Link>
          </motion.div>
        </div>

        {/* ── الإحصائيات الأربع ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'طلباتك',       value: stats.applications, icon: <FiFileText size={18} />,  color: 'text-blue-600 bg-blue-50'    },
            { label: 'مشاهدات ملفك', value: stats.views,        icon: <FiEye size={18} />,       color: 'text-emerald-600 bg-emerald-50' },
            { label: 'محفوظة',       value: stats.saved,        icon: <FiBookmark size={18} />,  color: 'text-violet-600 bg-violet-50' },
            { label: 'مطابقات',      value: stats.matches,      icon: <FiStar size={18} />,      color: 'text-orange-600 bg-orange-50' },
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

        {/* ── وظائف مقترحة لك ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FiTrendingUp className="text-primary-600" />
              وظائف مناسبة لك
            </h2>
            <Link to="/jobs" className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
              عرض الكل <FiChevronRight size={14} />
            </Link>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((job, i) => (
                <motion.div
                  key={job._id || i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-primary-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {/* نسبة المطابقة */}
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-50 flex flex-col items-center justify-center border border-primary-100">
                      <span className="text-sm font-bold text-primary-600 leading-none">{job.matchingScore}%</span>
                      <span className="text-[9px] text-primary-400 mt-0.5">تطابق</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate group-hover:text-primary-600 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
                        <span>{job.companyName}</span>
                        {job.location?.city && (
                          <span className="flex items-center gap-1 text-xs">
                            <FiMapPin size={10} /> {job.location.city}
                          </span>
                        )}
                      </p>
                      {/* مهارات */}
                      {job.requirements?.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.requirements.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/jobs/${job._id}`}
                      className="shrink-0 text-sm font-semibold text-primary-600 border border-primary-200 hover:bg-primary-600 hover:text-white px-3 py-1.5 rounded-xl transition-all"
                    >
                      قدّم الآن
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-12 text-center">
              <FiStar className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-slate-500 font-medium">أكمل ملفك الشخصي لنعثر لك على أفضل الوظائف</p>
              <Link
                to="/profile"
                className="inline-block mt-4 text-sm font-bold text-primary-600 border border-primary-200 px-5 py-2 rounded-xl hover:bg-primary-50 transition-colors"
              >
                أكمل ملفي الآن
              </Link>
            </div>
          )}
        </section>

        {/* ── آخر الطلبات ── */}
        {recentApps.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FiClock className="text-slate-400" />
                آخر طلباتك
              </h2>
              <Link to="/my-applications" className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
                عرض الكل <FiChevronRight size={14} />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <AnimatePresence>
                {recentApps.map((app, i) => {
                  const st = getStatus(app.status);
                  return (
                    <motion.div
                      key={app._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/jobs/${app.job?._id}`)}
                    >
                      {/* أيقونة الحرف الأول */}
                      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                        {(app.job?.title || '?').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{app.job?.title || 'عنوان الوظيفة'}</p>
                        <p className="text-xs text-slate-400 truncate">{app.job?.companyName || 'الشركة'}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-lg border ${st.cls}`}>
                        {st.label}
                      </span>
                      <FiArrowLeft className="text-slate-300 shrink-0" size={14} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* ── بطاقة المساعد الذكي ── */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <FiZap className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="font-bold">مساعدك الذكي</p>
              <p className="text-slate-400 text-xs">يساعدك في سيرتك وتحضير المقابلات</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            اسأله عن أي شيء: كيف تحسّن سيرتك؟ كيف تستعد للمقابلة؟ ما المهارات المطلوبة في سوق العمل؟
          </p>
          <Link
            to="/ai-coach"
            className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            تحدث معه الآن <FiArrowLeft size={14} />
          </Link>
        </section>

      </div>
    </div>
  );
};

export default JobSeekerDashboard;
