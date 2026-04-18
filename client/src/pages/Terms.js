import React from 'react';
import { FiShield, FiFileText, FiCheckCircle } from 'react-icons/fi';

const Terms = () => {
  return (
    <div className="min-h-screen mesh-bg py-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-10 md:p-16 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner">
                <FiFileText size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">شروط الاستخدام</h1>
                <p className="text-slate-500 font-bold">آخر تحديث: ١١ يناير ٢٠٢٦</p>
              </div>
            </div>

            <div className="space-y-10 text-slate-600 leading-relaxed font-medium">
              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <FiCheckCircle className="text-emerald-500" /> قبول الشروط
                </h2>
                <p>
                  باستخدامك لمنصة التوظيف الذكية، فإنك توافق على الالتزام بشروط الاستخدام هذه. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المنصة. نحن نسعى لتقديم أفضل تجربة توظيف مدعومة بالذكاء الاصطناعي.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <FiCheckCircle className="text-emerald-500" /> مسؤولية الحساب
                </h2>
                <p>
                  أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور. المنصة غير مسؤولة عن أي وصول غير مصرح به ناتج عن إهمال في حماية بيانات الدخول. يُحظر تماماً إنشاء حسابات بأسماء وهمية أو انتحال شخصية الآخرين.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <FiCheckCircle className="text-emerald-500" /> الاستخدام العادل للذكاء الاصطناعي
                </h2>
                <p>
                  تقوم المنصة باستخدام تقنيات متطورة لتحليل السير الذاتية والمطابقة الوظيفية. تلتزم المنصة بتقديم نتائج عادلة وغير منحازة، ومع ذلك، تظل القرارات النهائية للتوظيف بيد أصحاب العمل.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <FiCheckCircle className="text-emerald-500" /> المحتوى والملكية الفكرية
                </h2>
                <p>
                  جميع الحقوق المتعلقة بالعلامة التجارية والبرمجيات والخوارزميات المستخدمة هي ملكية حصرية للمهندس هشام المجمر وفريق التطوير. لا يجوز نسخ أو هندسة أي جزء من المنصة دون إذن خطي مسبق.
                </p>
              </section>
            </div>

            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Strategic Compliance Framework</p>
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
    </div>
  );
};

export default Terms;
