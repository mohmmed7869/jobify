import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "navbar": {
        "home": "Home",
        "jobs": "Jobs",
        "feed": "Feed",
        "dashboard": "Dashboard",
        "login": "Login",
        "join_us": "Join Us Free",
        "logout": "Logout",
        "profile": "Profile",
        "analytics": "Analytics",
        "manage_users": "Manage Users",
        "manage_jobs": "Manage Jobs"
      },
      "home": {
        "hero_title": "Your Smart Future",
        "hero_title_accent": "Career Gateway",
        "hero_subtitle": "A complete recruitment platform using AI technologies to connect creative minds with the best work environments.",
        "start_journey": "Start Your Journey Free",
        "browse_jobs": "Browse Jobs",
        "lead_developer": "Lead Developer & Engineer - Smart Solution Team"
      },
      "common": {
        "search": "Search",
        "filter": "Filter",
        "location": "Location",
        "apply": "Apply Now"
      }
    }
  },
  ar: {
    translation: {
      "navbar": {
        "home": "الرئيسية",
        "jobs": "الوظائف",
        "feed": "الخلاصة",
        "dashboard": "لوحة التحكم",
        "login": "تسجيل الدخول",
        "join_us": "انضم إلينا مجاناً",
        "logout": "تسجيل الخروج",
        "profile": "الملف الشخصي",
        "analytics": "التحليلات",
        "manage_users": "إدارة المستخدمين",
        "manage_jobs": "إدارة الوظائف"
      },
      "home": {
        "hero_title": "بوابة مستقبلك",
        "hero_title_accent": "المهني الذكية",
        "hero_subtitle": "منصة توظيف متكاملة تستخدم تقنيات الذكاء الاصطناعي لربط العقول المبدعة بأفضل بيئات العمل.",
        "start_journey": "ابدأ رحلتك مجاناً",
        "browse_jobs": "تصفح الفرص المتاحة",
        "lead_developer": "المطور والمهندس الرئيسي - Smart Solution Team"
      },
      "common": {
        "search": "بحث",
        "filter": "تصفية",
        "location": "الموقع",
        "apply": "قدم الآن"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
