import React from 'react';
import { FiShield, FiLock, FiEye, FiServer } from 'react-icons/fi';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-themed-bg py-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="formal-card p-10 md:p-16 relative overflow-hidden animate-fade-in border-primary-100/50 hover:translate-y-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner">
                <FiShield size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-themed-text tracking-tight">سياسة الخصوصية</h1>
                <p className="text-themed-text-ter font-bold">آخر تحديث: ١١ يناير ٢٠٢٦</p>
              </div>
            </div>

            <div className="space-y-10 text-themed-text-sec leading-relaxed font-medium">
              <section>
                <h2 className="text-2xl font-black text-themed-text mb-4 flex items-center gap-3">
                  <FiServer className="text-primary-500" /> جمع البيانات وحمايتها
                </h2>
                <p>
                  نحن نجمع البيانات الضرورية فقط لتحسين تجربة التوظيف الخاصة بك، بما في ذلك معلومات الملف الشخصي، السيرة الذاتية، وسجلات النشاط. يتم تشفير جميع البيانات باستخدام أقوى معايير التشفير العالمية (AES-256) وتخزينها في خوادم آمنة.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-themed-text mb-4 flex items-center gap-3">
                  <FiLock className="text-primary-500" /> استخدام الذكاء الاصطناعي والخصوصية
                </h2>
                <p>
                  يتم معالجة بياناتك من خلال خوارزمياتنا الذكية فقط لأغراض المطابقة الوظيفية. نحن نلتزم بعدم بيع بياناتك لأي أطراف ثالثة. يتم استخدام البيانات المجمعة لتحسين دقة خوارزميات AI الخاصة بالمنصة دون الكشف عن هويتك.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black text-themed-text mb-4 flex items-center gap-3">
                  <FiEye className="text-primary-500" /> شفافية الوصول
                </h2>
                <p>
                  يمكنك في أي وقت طلب نسخة من بياناتك المخزنة لدينا أو طلب حذف حسابك نهائياً من أنظمتنا. نحن نؤمن بأن خصوصيتك هي ملكك الخاص ونحن مجرد مؤتمنين عليها.
                </p>
              </section>

              <section className="bg-primary-900 p-8 rounded-[2rem] text-themed-on-primary border-none shadow-glow">
                <h2 className="text-xl font-black mb-4 flex items-center gap-3">
                   ضمان الأمان الاستراتيجي
                </h2>
                <p className="text-themed-on-primary/70 text-sm">
                  تم تطوير أنظمة الحماية في هذه المنصة وفقاً لأحدث المعايير الدولية للأمن السيبراني، لضمان رحلة توظيف آمنة وموثوقة لجميع مستخدمينا في اليمن والعالم.
                </p>
              </section>
            </div>

            <div className="mt-16 pt-10 border-t border-primary-100 flex flex-col items-center">
              <p className="text-[10px] font-black text-themed-text-ter uppercase tracking-[0.3em] mb-4">Strategic Data Protection Policy</p>
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-primary-200"></div>
                <p className="text-themed-text font-black text-xs">بإشراف المهندس هشام المجمر - فريق Smart Solution</p>
              </div>
              <p className="text-primary-600 font-bold text-[10px] mt-1">hshamalmjmr53@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
