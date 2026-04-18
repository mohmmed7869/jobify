import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowRight } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>

      <div className="max-w-2xl w-full glass-card p-12 md:p-20 text-center relative overflow-hidden animate-scale-up">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-slate-50 rounded-[2.5rem] mb-10 shadow-inner group transition-transform hover:rotate-12 duration-500">
            <span className="text-8xl font-black text-slate-200 group-hover:text-primary-100 transition-colors">404</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            عذراً، لقد ضللت <br/>
            <span className="text-premium-gradient">طريقك المهني!</span>
          </h1>
          
          <p className="text-slate-500 font-bold text-lg mb-12 max-w-md mx-auto leading-relaxed">
            الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى مسار آخر. دعنا نساعدك في العودة للمسار الصحيح.
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
              className="btn-premium-outline px-10 py-4 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              العودة للخلف
              <FiArrowRight className="text-xl rotate-180" />
            </button>
          </div>

          <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Developed by Strategic Engineering Team</p>
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-slate-200"></div>
              <p className="text-slate-900 font-black text-xs">بإشراف المهندس هشام المجمر - فريق Smart Solution</p>
            <p className="text-primary-600 font-bold text-[10px] mt-1">hshamalmjmr53@gmail.com</p>
              <div className="h-px w-8 bg-slate-200"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;