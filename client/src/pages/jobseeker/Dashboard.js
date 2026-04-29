import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiMapPin, FiStar, FiEye, FiBookmark,
  FiFileText, FiChevronRight, FiUser
} from 'react-icons/fi';

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

  const [recommendations, setRecs]  = useState([]);
  const [stats, setStats]           = useState({ applications: 0, views: 0, saved: 0, matches: 0 });
  const [loading, setLoading]       = useState(true);

  const { pct: profilePct, next: nextStep } = calcStrength(user);

  // ─── جلب البيانات ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [recsRes, statsRes] = await Promise.all([
          axios.get('/api/ai/recommendations?limit=3'),
          axios.get('/api/analytics/jobseeker').catch(() => null)
        ]);
        
        if (recsRes.data.success) setRecs(recsRes.data.data || []);
        
        if (statsRes?.data?.success) {
          const s = statsRes.data.data;
          setStats({
            applications: s.applicationStats?.reduce((sum, i) => sum + i.count, 0) || 0,
            views:        s.profileViews || 0,
            saved:        user?.savedJobs?.length || 0,
            matches:      s.bestApplications?.length || 0,
          });
        }
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
    <div className="min-h-screen bg-slate-50 pb-24" dir="rtl">
      {/* ══ رأس الصفحة ══════════════════════════════════ */}
      <div className="bg-white border-b border-slate-100 mb-8">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                أهلاً، {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                مرحباً بك في لوحة تحكمك المبسطة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ المحتوى الرئيسي ══════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 space-y-6">

        {/* الإحصائيات (التحليل) */}
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

        {/* 1. الوظائف المناسبة لك */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              🎯 وظائف مناسبة لك
            </h2>
            <Link to="/jobs" className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
              عرض الكل <FiChevronRight size={14} />
            </Link>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((job, i) => (
                <div
                  key={job._id || i}
                  className="bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:border-primary-200 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex flex-col items-center justify-center border border-primary-200">
                      <span className="text-sm font-bold text-primary-700 leading-none">{job.matchingScore}%</span>
                      <span className="text-[9px] text-primary-500 mt-0.5">تطابق</span>
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
                    </div>

                    <Link
                      to={`/jobs/${job._id}`}
                      className="shrink-0 text-sm font-semibold bg-white text-primary-600 border border-primary-200 hover:bg-primary-600 hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-sm"
                    >
                      قدّم الآن
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-10 text-center">
              <FiStar className="mx-auto text-slate-300 mb-2" size={28} />
              <p className="text-slate-500 font-medium text-sm">أكمل ملفك الشخصي لنعثر لك على أفضل الوظائف</p>
            </div>
          )}
        </section>

        {/* 2. حالة سيرتك الذاتية */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-5">
            📄 حالة سيرتك الذاتية
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700">
                  قوة ملفك الحالي
                </span>
                <span className="text-sm font-bold text-primary-600">{profilePct}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profilePct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    profilePct === 100 ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                />
              </div>
              {nextStep && (
                <p className="text-xs text-slate-500 mt-3">
                  الخطوة التالية الموصى بها: <strong>{nextStep.label}</strong>
                </p>
              )}
            </div>

            <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
              <Link
                to="/resume-builder"
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
              >
                ✨ اجعل سيرتك أكثر احترافية
              </Link>
              <Link
                to={nextStep?.path || '/profile'}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold px-6 py-3 rounded-xl transition-colors"
              >
                <FiUser size={16} /> أكمل ملفك الشخصي
              </Link>
            </div>
          </div>
        </section>

        {/* 3. المساعد الذكي */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
          {/* خلفية زخرفية */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
              🤖 المساعد الذكي
            </h2>
            <p className="text-primary-100 text-sm mb-5 leading-relaxed">
              كيف أستطيع مساعدتك اليوم؟ اختر الإجراء الذي تريده وسأقوم به في ثوانٍ.
            </p>
            
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link to="/jobs" className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 text-center transition-colors text-sm font-semibold">
                ✨ ابحث عن وظيفة
              </Link>
              <Link to="/resume-builder" className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 text-center transition-colors text-sm font-semibold">
                ✨ حسّن سيرتي
              </Link>
              <Link to="/ai-coach" className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 text-center transition-colors text-sm font-semibold">
                ✨ أنشئ Cover Letter
              </Link>
              <Link to="/ai-coach" className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 text-center transition-colors text-sm font-semibold">
                ✨ جهّزني للمقابلة
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default JobSeekerDashboard;
