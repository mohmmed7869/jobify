import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  FiBriefcase, FiFileText, FiMessageCircle,
  FiArrowLeft, FiCheck, FiStar, FiUsers, FiTrendingUp, FiZap, FiCpu
} from 'react-icons/fi';

// ─── المكون الرئيسي ──────────────────────────────────────
const Home = () => {
  const { user } = useAuth();

  const dashboardLink = user
    ? user.role === 'jobseeker' ? '/dashboard'
    : user.role === 'employer'  ? '/employer/dashboard'
    : '/admin/dashboard'
    : null;

  // ─── محتوى ديناميكي بناءً على الدور ─────────────────────
  const isEmployer = user?.role === 'employer';

  const FEATURES = isEmployer ? [
    {
      icon: <FiCpu size={24} />,
      title: 'فرز المتقدمين بذكاء',
      desc: 'نظام متطور يحلل السير الذاتية ويعطيك أفضل المرشحين بناءً على متطلباتك.',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      icon: <FiBriefcase size={24} />,
      title: 'إدارة شاملة للوظائف',
      desc: 'لوحة تحكم احترافية لمتابعة إعلاناتك الوظيفية وتتبع المتقدمين بسهولة.',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      icon: <FiMessageCircle size={24} />,
      title: 'مقابلات فيديو مدمجة',
      desc: 'لا حاجة لبرامج خارجية، أجرِ المقابلات مع المرشحين مباشرة من منصتنا.',
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      icon: <FiTrendingUp size={24} />,
      title: 'تحليلات التوظيف',
      desc: 'احصل على إحصائيات دقيقة حول تفاعل الكفاءات مع إعلاناتك الوظيفية.',
      color: 'bg-violet-50 text-violet-600 border-violet-200',
    },
  ] : [
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

  const STEPS = isEmployer ? [
    { num: 1, title: 'انشر وظيفتك',       desc: 'في أقل من 5 دقائق، ودعنا نبحث عن الكفاءات.' },
    { num: 2, title: 'راجع المتقدمين',    desc: 'مع تقرير وتقييم AI لكل مرشح لتسهيل القرار.'  },
    { num: 3, title: 'أجرِ المقابلة',     desc: 'عبر نظام الفيديو المدمج في المنصة مباشرة.' },
  ] : [
    { num: 1, title: 'أنشئ ملفك',          desc: 'سجّل وأضف مهاراتك وخبراتك بخطوات بسيطة.' },
    { num: 2, title: 'اكتشف الوظائف',      desc: 'الذكاء الاصطناعي سيقترح لك أفضل الفرص تلقائياً.' },
    { num: 3, title: 'قدّم وانتظر ردّنا',  desc: 'تابع حالة طلباتك وتطورها من مكان واحد.'  },
  ];

  const STATS = [
    { value: '+5,000', label: 'باحث عن عمل' },
    { value: '+800',   label: 'شركة موظِّفة'  },
    { value: '+12,000', label: 'وظيفة نُشرت'  },
    { value: '92%',    label: 'معدل رضا المستخدمين' },
  ];

  const TEAM = [
    { name: 'محمد علي',  role: 'قائد الفريق', isLead: true },
    { name: 'مكين الشلفي', role: 'مهندس برمجيات' },
    { name: 'هيثم نجاد',  role: 'مهندس برمجيات' },
    { name: 'محمد حنش',  role: 'مهندس برمجيات' },
    { name: 'محمد علي',  role: 'مهندس برمجيات' },
  ];

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">

      {/* ══ Hero ═══════════════════════════════════════════ */}
      <section className="relative bg-white overflow-hidden border-b border-slate-100">
        {/* خلفية زخرفية فاتحة */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-100 rounded-full blur-[100px] opacity-60" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[100px] opacity-60" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
          {/* شارة */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 px-4 py-1.5 rounded-full text-xs font-semibold text-primary-700 mb-8"
          >
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            منصة التوظيف الذكية
          </motion.div>

          {/* العنوان */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6"
          >
            {isEmployer ? 'وظّف أفضل الكفاءات' : 'ابدأ مسيرتك المهنية'}
            <br />
            <span className="text-primary-600">{isEmployer ? 'بذكاء وسرعة' : 'بخطوة واحدة'}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            {isEmployer 
              ? 'انشر وظائفك، أدر المتقدمين، ودع الذكاء الاصطناعي يختار لك أفضل المرشحين لاحتياجات شركتك.'
              : 'منصة توظيف عربية مدعومة بالذكاء الاصطناعي. نساعدك في العثور على الوظيفة المناسبة وبناء مستقبلك.'}
          </motion.p>

          {/* أزرار الإجراء */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <Link
              to={user ? dashboardLink : "/register"}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-10 py-5 rounded-2xl text-lg transition-colors shadow-xl shadow-primary-200 flex items-center gap-3"
            >
              🚀 {user ? 'الذهاب للوحة التحكم' : 'ابدأ رحلتك الآن'}
            </Link>
          </motion.div>

          {/* أرقام صغيرة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {STATS.map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ المميزات ══════════════════════════════════════ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">ما الذي يميزنا؟</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              بنينا أدوات متطورة لتسهيل حياة {isEmployer ? 'الشركات' : 'الباحثين عن عمل'}.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((feat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${feat.color}`}>
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ كيف تعمل المنصة ══════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              كيف تعمل المنصة؟
            </h2>
            <p className="text-slate-500">
              3 خطوات بسيطة فقط للبدء
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 relative">
            <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            {STEPS.map((step, i) => (
              <div key={i} className="flex-1 relative z-10 bg-white sm:bg-transparent">
                <div className="w-16 h-16 bg-primary-50 border-4 border-white text-primary-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-sm">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-slate-900 text-center mb-2">{step.title}</h3>
                <p className="text-slate-500 text-center text-sm leading-relaxed px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ فريق العمل ════════════════════════════════════ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">تطوير</h2>
          <p className="text-primary-600 font-bold mb-10 tracking-widest text-sm">Smart Solution Team</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {TEAM.map((member, i) => (
              <div key={i} className={`bg-white px-6 py-4 rounded-2xl border border-slate-200 flex flex-col items-center ${member.isLead ? 'shadow-md border-primary-200 ring-1 ring-primary-100' : 'shadow-sm'}`}>
                {member.isLead && <FiStar className="text-amber-400 mb-2" fill="currentColor" />}
                <span className="font-bold text-slate-800">{member.name}</span>
                <span className="text-xs text-slate-500 mt-1">{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
