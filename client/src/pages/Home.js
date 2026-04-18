import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiSearch, FiUsers, FiBriefcase, FiTrendingUp, 
  FiStar, FiArrowLeft, FiMessageCircle, FiFileText, FiCpu 
} from 'react-icons/fi';

const Home = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const features = [
    {
      icon: <FiCpu className="w-8 h-8" />,
      title: 'محرك مطابقة بالذكاء الاصطناعي',
      description: 'نظام متطور يقوم بتحليل مهاراتك ومطابقتها مع أفضل الوظائف المتاحة بدقة متناهية.'
    },
    {
      icon: <FiFileText className="w-8 h-8" />,
      title: 'باني السيرة الذاتية الذكي',
      description: 'أنشئ سيرة ذاتية احترافية في دقائق باستخدام قوالب عصرية ومعاينة حية.'
    },
    {
      icon: <FiMessageCircle className="w-8 h-8" />,
      title: 'المركز الاجتماعي',
      description: 'تواصل مع الخبراء والزملاء، شارك خبراتك، واحصل على نصائح مهنية قيمة.'
    },
    {
      icon: <FiTrendingUp className="w-8 h-8" />,
      title: 'تحليلات المسار المهني',
      description: 'تتبع تطور ملفك الشخصي واحصل على رؤى حول كيفية تحسين فرص توظيفك.'
    }
  ];

  return (
    <div className="min-h-screen luxury-aura relative overflow-x-hidden">
      {/* Background Ornaments */}
      <div className="blur-circle w-[500px] h-[500px] bg-primary-500/10 -top-48 -right-48"></div>
      <div className="blur-circle w-[400px] h-[400px] bg-accent/10 bottom-0 -left-24" style={{ animationDelay: '2s' }}></div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-12 md:pt-32 md:pb-24 overflow-hidden px-4 md:px-0">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-6 md:py-2.5 mb-6 md:mb-10 premium-glass-panel border border-primary-200/30 rounded-full shadow-glow-sm floating-element">
              <span className="flex h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-primary-500 animate-pulse shadow-glow"></span>
              <span className="text-primary-600 text-[8px] md:text-[10px] font-black tracking-[0.1em] md:tracking-[0.2em] uppercase">نظام التوظيف الذكي v3.5 - Digital Luxury</span>
            </div>
            <motion.h1 
              className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black mb-4 md:mb-8 leading-tight tracking-tighter themed-text"
              variants={itemVariants}
            >
              {t('home.hero_title')} <br className="hidden sm:block"/>
              <span className="premium-gradient-text drop-shadow-md">{t('home.hero_title_accent')}</span>
            </motion.h1>
            <motion.p 
              className="text-lg md:text-3xl mb-8 md:mb-14 themed-text-sec max-w-4xl mx-auto font-bold leading-relaxed opacity-90"
              variants={itemVariants}
            >
              {t('home.hero_subtitle')}
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-10 justify-center items-center px-4 md:px-0"
              variants={itemVariants}
            >
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="btn-formal-primary text-lg md:text-2xl px-10 md:px-20 py-4 md:py-6 w-full sm:w-auto magnetic-lift shadow-glow-lg luxury-border"
                  >
                    {t('home.start_journey')}
                  </Link>
                  <Link
                    to="/jobs"
                    className="btn-formal-secondary text-lg md:text-2xl px-10 md:px-20 py-4 md:py-6 w-full sm:w-auto magnetic-lift border-primary-200/50 glass-premium"
                  >
                    {t('home.browse_jobs')}
                  </Link>
                </>
              ) : (
                <Link
                  to={user.role === 'jobseeker' ? '/dashboard' : user.role === 'employer' ? '/employer/dashboard' : '/admin/dashboard'}
                  className="btn-formal-primary text-lg md:text-2xl px-10 md:px-20 py-4 md:py-6 w-full sm:w-auto magnetic-lift shadow-glow-lg luxury-border"
                >
                  {t('navbar.dashboard')}
                </Link>
              )}
            </motion.div>
            
            <motion.div 
              className="mt-16 md:mt-24 flex flex-col items-center"
              variants={itemVariants}
            >
              <p className="text-themed-text-ter text-[9px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] mb-4 md:mb-6 opacity-60">Engineered by Smart Solution Technology</p>
              <motion.div 
                className="premium-card px-8 py-5 md:px-12 md:py-8 flex items-center gap-5 md:gap-8 group cursor-pointer border-primary-200/20 max-w-[95vw] md:max-w-none"
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-gradient-to-br from-primary-600 to-accent flex items-center justify-center text-white shadow-glow-lg group-hover:rotate-12 transition-transform duration-500 shrink-0">
                  <FiCpu className="w-6 h-6 md:w-9 md:h-9" />
                </div>
                <div className="text-right min-w-0">
                  <div className="premium-gradient-text text-xl md:text-3xl tracking-tight truncate">Smart Solution Team</div>
                  <div className="text-primary-600 text-[10px] md:text-sm font-black tracking-wide opacity-80 truncate">mohom77393@gmail.com | صنعاء، اليمن</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-40 relative overflow-hidden">
        <div className="blur-circle w-[600px] h-[600px] bg-primary-500/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="premium-container relative z-10">
          <motion.div 
            className="text-center mb-20 md:mb-32 px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-themed-text mb-8 tracking-tighter">
              مميزات صممت <span className="premium-gradient-text">بذكاء فائق</span>
            </h2>
            <div className="w-24 md:w-32 h-2 bg-gradient-to-r from-primary-600 to-accent mx-auto rounded-full shadow-glow-primary"></div>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 px-4">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="premium-card p-8 md:p-10 group cursor-pointer shimmer-sweep luxury-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="w-14 h-14 md:w-20 md:h-20 bg-primary-500/10 text-primary-600 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:bg-primary-600 group-hover:text-white group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-sm border border-primary-500/20">
                  {React.cloneElement(feature.icon, { className: "w-8 h-8 md:w-10 md:h-10" })}
                </div>
                <h3 className="text-2xl md:text-3xl font-black themed-text mb-5 tracking-tight group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-themed-text-sec leading-relaxed font-bold text-sm md:text-base opacity-80">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 md:py-32 bg-themed-bg-sec text-themed-text overflow-hidden relative border-y border-primary-100/10">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-48 md:w-64 h-48 md:h-64 bg-primary-500 rounded-full blur-[80px] md:blur-[120px]"></div>
          <div className="absolute bottom-10 right-10 w-48 md:w-64 h-48 md:h-64 bg-accent rounded-full blur-[80px] md:blur-[120px]"></div>
        </div>
        
        <div className="premium-container relative z-10 px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-20">
            <div className="lg:w-1/2 text-center lg:text-right">
              <h2 className="text-3xl md:text-5xl font-black mb-6 md:mb-8 leading-tight text-themed-text">
                أكثر من مجرد منصة توظيف.. <br className="hidden md:block"/>
                <span className="text-primary-600">مجتمع مهني متكامل</span>
              </h2>
              <p className="text-lg md:text-xl text-themed-text-sec mb-8 md:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                انضم إلى آلاف المهنيين في المركز الاجتماعي الجديد. شارك مقالاتك، اطلب نصائح، وتفاعل مع خبراء في مجالك لتبني شبكة علاقات قوية تساعدك في مسيرتك.
              </p>
              <Link to="/social" className="btn-formal-primary inline-flex items-center gap-3 px-8 py-4 md:px-12 md:py-5 magnetic-lift shadow-glow mx-auto lg:mx-0">
                اكتشف المجتمع المهني <FiArrowLeft className="text-xl" />
              </Link>
            </div>
            <div className="lg:w-1/2 w-full max-w-lg lg:max-w-none">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-accent rounded-[2rem] md:rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative glass-premium p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-primary-200/20 shimmer-sweep">
                  <div className="space-y-4 md:space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-themed-bg-ter rounded-xl md:rounded-2xl border border-themed-border-light">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-themed-bg-sec ${i === 2 ? 'bg-primary-500' : ''}`}></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-16 md:w-24 bg-themed-text-ter rounded opacity-30"></div>
                          <div className="h-2 w-full bg-themed-bg-sec rounded opacity-50"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Builder CTA */}
      <section className="py-20 md:py-32 relative overflow-hidden px-4">
        <div className="premium-container relative z-10">
          <div className="glass-premium bg-gradient-to-br from-primary-600/95 to-accent-dark/95 p-8 md:p-16 lg:p-20 text-white flex flex-col lg:flex-row items-center gap-12 md:gap-16 overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border-none shimmer-sweep">
            <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-2xl md:blur-3xl"></div>
            <div className="lg:w-3/5 relative z-10 text-center lg:text-right">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 leading-tight">
                سيرتك الذاتية هي <br/><span className="text-white/80">هويتك المهنية</span>
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 md:mb-12 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
                استخدم باني السيرة الذاتية المدمج لإنشاء ملف احترافي يتوافق مع أنظمة الفرز الآلي (ATS) ويزيد من فرص وصولك للمقابلة الشخصية بنسبة 70%.
              </p>
              <Link to="/resume-builder" className="btn-formal bg-white text-primary-600 hover:bg-themed-bg-sec shadow-xl px-8 md:px-12 py-3 md:py-4 text-base md:text-lg magnetic-lift shimmer-sweep mx-auto lg:mx-0">
                ابدأ بناء سيرتك الآن
              </Link>
            </div>
            <div className="lg:w-2/5 w-full max-w-md lg:max-w-none relative z-10">
              <div className="glass-premium bg-white/10 border-white/20 p-6 md:p-8 shadow-2xl rotate-2 md:rotate-3 hover:rotate-0 transition-transform duration-500 rounded-2xl md:rounded-3xl">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="h-3 md:h-4 w-1/2 bg-white/20 rounded"></div>
                  <div className="h-1.5 md:h-2 w-full bg-white/10 rounded"></div>
                  <div className="h-1.5 md:h-2 w-full bg-white/10 rounded"></div>
                  <div className="h-1.5 md:h-2 w-3/4 bg-white/10 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Team */}
      <section className="py-20 md:py-40 relative overflow-hidden">
        <div className="blur-circle w-[500px] h-[500px] bg-accent/5 -bottom-24 -right-24"></div>
        <div className="premium-container px-4 relative z-10">
          <div className="text-center mb-24 md:mb-32">
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-black text-themed-text mb-8 tracking-tighter">
              نخبة <span className="text-primary-600 font-extrabold">فريق Smart Solution</span>
            </h2>
            <p className="text-themed-text-ter font-black text-lg md:text-2xl tracking-[0.2em] opacity-60 uppercase">The Architects of Innovation</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-12">
            <TeamMember name="المهندس محمد علي" role="رئيس فريق Smart Solution" isLead />
            <TeamMember name="المهندس مكين الشلفي" role="مهندس برمجيات" />
            <TeamMember name="المهندس هيثم نجاد" role="مهندس برمجيات" />
            <TeamMember name="المهندس محمد حنش" role="مهندس برمجيات" />
            <TeamMember name="المهندس محمد علي" role="مهندس برمجيات" />
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 bg-themed-bg border-t border-themed-border-light">
        <div className="premium-container text-center">
          <p className="text-themed-text-ter text-[10px] font-black uppercase tracking-[0.5em] mb-4">Developed by Smart Solution Engineering Team</p>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-themed-border-light"></div>
            <p className="text-themed-text font-black text-lg">بإشراف المهندس محمد علي & Smart Solution Team</p>
            <div className="h-px w-8 bg-themed-border-light"></div>
          </div>
          <p className="text-primary-600 font-black text-xs mt-4">mohom77393@gmail.com</p>
        </div>
      </footer>
    </div>
  );
};

const TeamMember = ({ name, role, isLead }) => (
  <motion.div 
    className={`p-10 rounded-[2.5rem] text-center transition-all duration-700 w-full overflow-hidden ${isLead ? 'bg-gradient-to-br from-primary-600 via-primary-700 to-accent-dark text-white shadow-glow-lg scale-110 z-10 luxury-border' : 'premium-card'}`}
    whileHover={{ y: -20, scale: isLead ? 1.15 : 1.08 }}
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: isLead ? 1.1 : 1 }}
    viewport={{ once: true }}
  >
    <div className={`w-24 h-24 mx-auto rounded-[1.5rem] flex items-center justify-center mb-8 text-4xl font-black shadow-inner rotate-3 group-hover:rotate-0 transition-transform duration-500 ${isLead ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-primary-500/10 text-primary-600'}`}>
      {name.split(' ').pop().charAt(0)}
    </div>
    <h3 className={`font-black text-lg md:text-xl mb-3 tracking-tight leading-tight break-words ${isLead ? 'text-white' : 'themed-text'}`}>{name}</h3>
    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLead ? 'text-white/80' : 'text-primary-600/70'}`}>{role}</p>
  </motion.div>
);

export default Home;
