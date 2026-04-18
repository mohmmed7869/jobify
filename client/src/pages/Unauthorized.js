import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiArrowRight, FiHome, FiLock } from 'react-icons/fi';

const Unauthorized = () => {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>

      <div className="max-w-2xl w-full glass-card p-12 md:p-20 text-center relative overflow-hidden animate-scale-up border-rose-100/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-rose-50 rounded-[2.5rem] mb-10 shadow-inner group transition-transform hover:rotate-12 duration-500 border border-rose-100">
            <FiLock className="text-6xl text-rose-500 group-hover:scale-110 transition-transform" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            دخول <span className="text-rose-600">غير مصرح به</span>
          </h1>
          
          <p className="text-slate-500 font-bold text-lg mb-12 max-w-md mx-auto leading-relaxed">
            عذراً، ليس لديك الصلاحيات الكافية للوصول إلى هذه المنطقة الاستراتيجية. يرجى التأكد من نوع حسابك أو التواصل مع الإدارة.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/"
              className="btn-premium-primary px-10 py-4 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              <FiHome className="text-xl" />
              العودة للرئيسية
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="btn-premium-outline px-10 py-4 flex items-center gap-3 w-full sm:w-auto justify-center border-slate-200"
            >
              العودة للخلف
              <FiArrowRight className="text-xl rotate-180" />
            </button>
          </div>

          <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">Security Protocol Enabled by Strategic Engineering Team</p>
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-slate-200"></div>
              <p className="text-slate-900 font-black text-xs">بإشراف المهندس محمد علي - فريق Smart Solution</p>
            <p className="text-primary-600 font-bold text-[10px] mt-1">mohom77393@gmail.com</p>
              <div className="h-px w-8 bg-slate-200"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
