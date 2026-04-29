import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  FiSearch, FiBriefcase, FiFileText, FiMessageCircle,
  FiArrowLeft, FiCheck, FiStar, FiUsers, FiTrendingUp, FiZap
} from 'react-icons/fi';

// ─── ثوابت ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: <FiZap size={24} />,
    title: 'ذكاء اصطناعي يعمل لحسابك',
    desc: 'يحلل ملفك ويطابقه مع الوظائف المناسبة تلقائياً، وينبهك فور وجود فرصة جيدة.',
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    icon: <FiFileText size={24} />,
    title: 'سيرة ذاتية احترافية في دقائق',
    desc: 'قوالب مصممة للظهور في قمة نتائج أنظمة الفلترة الآلية (ATS).',
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    icon: <FiMessageCircle size={24} />,
    title: 'مجتمع مهني نشط',
    desc: 'تواصل مع محترفين في مجالك، اطرح أسئلتك، وشارك خبراتك.',
    color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    icon: <FiBriefcase size={24} />,
    title: 'مقابلات فيديو مدمجة',
    desc: 'أجرِ مقابلتك مباشرة من المنصة، بدون برامج إضافية.',
    color: 'bg-violet-50 text-violet-600 border-violet-200',
  },
];

const STATS = [
  { value: '+5,000', label: 'باحث عن عمل' },
  { value: '+800',   label: 'شركة موظِّفة'  },
  { value: '+12,000', label: 'وظيفة نُشرت'  },
  { value: '92%',    label: 'معدل رضا المستخدمين' },
];

const STEPS_JOBSEEKER = [
  { num: 1, title: 'أنشئ ملفك',          desc: 'سجّل وأضف مهاراتك وخبراتك.' },
  { num: 2, title: 'اكتشف الوظائف',      desc: 'الذكاء الاصطناعي يقترح أفضل الفرص لك.' },
  { num: 3, title: 'قدّم وانتظر ردّنا',  desc: 'تابع حالة طلباتك من مكان واحد.'  },
];

const STEPS_EMPLOYER = [
  { num: 1, title: 'انشر وظيفتك',       desc: 'في أقل من 5 دقائق.' },
  { num: 2, title: 'راجع المتقدمين',    desc: 'مع تقرير AI لكل مرشح.'  },
  { num: 3, title: 'أجرِ المقابلة',     desc: 'فيديو مباشر من المنصة.' },
];

const TEAM = [
  { name: 'محمد علي',  role: 'قائد الفريق', isLead: true },
  { name: 'مكين الشلفي', role: 'مهندس برمجيات' },
  { name: 'هيثم نجاد',  role: 'مهندس برمجيات' },
  { name: 'محمد حنش',  role: 'مهندس برمجيات' },
  { name: 'محمد علي',  role: 'مهندس برمجيات' },
];

// ─── المكون الرئيسي ──────────────────────────────────────
const Home = () => {
  const { user } = useAuth();

  const dashboardLink = user
    ? user.role === 'jobseeker' ? '/dashboard'
    : user.role === 'employer'  ? '/employer/dashboard'
    : '/admin/dashboard'
    : null;

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ══ Hero ═══════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-b from-slate-950 to-slate-900 text-white overflow-hidden">
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
          {/* شارة */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold text-white/80 mb-8"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            منصة التوظيف الذكية — مجانية تماماً
          </motion.div>

          {/* العنوان */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
          >
            ابدأ مسيرتك المهنية
            <br />
            <span className="text-primary-400">بخطوة واحدة</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            منصة توظيف عربية مدعومة بالذكاء الاصطناعي. نساعدك تجد الوظيفة المناسبة أو توجد الموظف المثالي.
          </motion.p>

          {/* أزرار الإجراء */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {user ? (
              <Link
                to={dashboardLink}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg"
              >
                الذهاب للوحة التحكم →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg"
                >
                  ابدأ مجاناً الآن 🚀
                </Link>
                <Link
                  to="/jobs"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors"
                >
                  تصفح الوظائف
                </Link>
              </>
            )}
          </motion.div>

          {/* أرقام صغيرة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/10 pt-10"
          >
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ كيف تعمل المنصة ════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">كيف تعمل المنصة؟</h2>
            <p className="text-slate-500">3 خطوات فقط تفصلك عن هدفك</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* باحث عن عمل */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center">
                  <FiSearch size={16} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">للباحث عن عمل</h3>
              </div>
              <div className="space-y-4">
                {STEPS_JOBSEEKER.map(s => (
                  <div key={s.num} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {s.num}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{s.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="mt-6 w-full block text-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                ابدأ رحلتك الوظيفية →
              </Link>
            </div>

            {/* صاحب العمل */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-slate-800 text-white rounded-xl flex items-center justify-center">
                  <FiBriefcase size={16} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">لصاحب العمل</h3>
              </div>
              <div className="space-y-4">
                {STEPS_EMPLOYER.map(s => (
                  <div key={s.num} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {s.num}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{s.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="mt-6 w-full block text-center bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                ابدأ التوظيف الآن →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ المميزات ════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">لماذا Jobify؟</h2>
            <p className="text-slate-500">كل ما تحتاجه في مكان واحد</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${f.color}`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA - سيرة ذاتية ════════════════════════════════ */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">سيرتك الذاتية هي بطاقة دخولك</h2>
          <p className="text-primary-100 mb-8 text-base leading-relaxed">
            أنشئ سيرة ذاتية احترافية تناسب أنظمة الفلترة الآلية وتزيد فرصك للوصول للمقابلة.
          </p>
          <Link
            to="/resume-builder"
            className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-8 py-3.5 rounded-2xl hover:bg-primary-50 transition-colors shadow-lg"
          >
            <FiFileText size={18} /> ابنِ سيرتك الآن مجاناً
          </Link>
        </div>
      </section>

      {/* ══ فريق العمل ══════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">فريق التطوير</h2>
          <p className="text-slate-500 mb-12">Smart Solution Engineering Team</p>

          <div className="flex flex-wrap justify-center gap-5">
            {TEAM.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col items-center p-5 rounded-2xl border w-36 transition-all hover:-translate-y-1 ${
                  m.isLead
                    ? 'bg-primary-600 border-primary-500 text-white shadow-lg'
                    : 'bg-white border-slate-100 text-slate-700 shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-3 ${
                  m.isLead ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-600'
                }`}>
                  {m.name.charAt(0)}
                </div>
                <p className="font-bold text-sm leading-tight text-center">{m.name}</p>
                <p className={`text-xs mt-1 text-center ${m.isLead ? 'text-primary-100' : 'text-slate-400'}`}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Footer ══════════════════════════════════════════ */}
      <footer className="bg-slate-900 text-slate-400 py-10 text-center">
        <p className="text-sm font-semibold text-slate-300 mb-1">Jobify — منصة التوظيف الذكية</p>
        <p className="text-xs">Developed by Smart Solution Team • mohom77393@gmail.com</p>
      </footer>
    </div>
  );
};

export default Home;
