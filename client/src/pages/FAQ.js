import React, { useState } from 'react';
import { FiPlus, FiMinus, FiHelpCircle, FiSearch } from 'react-icons/fi';

const FAQ = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      category: 'general',
      question: 'ما هي Jobify؟',
      answer: 'هي منصة متقدمة تستخدم الذكاء الاصطناعي لربط الباحثين عن عمل بالشركات، مع توفير أدوات ذكية مثل باني السيرة الذاتية والمقابلات الافتراضية.'
    },
    {
      id: 2,
      category: 'general',
      question: 'كيف يمكنني التسجيل في المنصة؟',
      answer: 'يمكنك التسجيل بسهولة عبر النقر على زر "انضم إلينا مجاناً" في القائمة العلوية واختيار نوع الحساب (باحث عن عمل أو صاحب عمل).'
    },
    {
      id: 3,
      category: 'jobseeker',
      question: 'كيف يعمل باني السيرة الذاتية الذكي؟',
      answer: 'يقوم النظام بتحليل مهاراتك وخبراتك واقتراح أفضل القوالب المتوافقة مع أنظمة الفرز الآلي (ATS) لزيادة فرص قبولك.'
    },
    {
      id: 4,
      category: 'jobseeker',
      question: 'هل يمكنني التقديم على أكثر من وظيفة؟',
      answer: 'نعم، يمكنك التقديم على أي عدد من الوظائف التي تناسب مؤهلاتك ومتابعة حالة طلباتك من لوحة التحكم.'
    },
    {
      id: 5,
      category: 'employer',
      question: 'كيف أضيف وظيفة جديدة؟',
      answer: 'بعد تسجيل الدخول كصاحب عمل، اذهب إلى لوحة التحكم واختر "إضافة وظيفة"، ثم املأ تفاصيل الوظيفة المطلوبة.'
    },
    {
      id: 6,
      category: 'employer',
      question: 'ما هي تقنية المقابلات الذكية؟',
      answer: 'هي خدمة تتيح إجراء مقابلات فيديو أولية يقوم فيها الذكاء الاصطناعي بتحليل إجابات المرشحين وتزويدك بتقرير مفصل.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    (activeTab === 'all' || faq.category === activeTab) &&
    (faq.question.includes(searchQuery) || faq.answer.includes(searchQuery))
  );

  return (
    <div className="pt-24 pb-12 min-h-screen mesh-bg relative overflow-hidden" dir="rtl">
      {/* Background Decorations */}
      <div className="blur-circle w-[400px] h-[400px] bg-primary-500/10 top-[-100px] left-[-100px]"></div>
      
      <div className="premium-container max-w-4xl relative z-10">
        <div className="text-center mb-16 animate-slide-down">
          <div className="w-20 h-20 bg-primary-500/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner">
            <FiHelpCircle size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black premium-gradient-text mb-6 tracking-tight">الأسئلة الشائعة</h1>
          <p className="text-themed-text-sec text-lg font-bold">كل ما تحتاج لمعرفته حول استخدام منصتنا الذكية</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12 max-w-2xl mx-auto group">
          <FiSearch className="absolute right-6 top-1/2 -translate-y-1/2 text-primary-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="ابحث عن سؤالك هنا..."
            className="premium-input pr-14 py-5 w-full text-lg shadow-premium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="الكل" />
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} label="عام" />
          <TabButton active={activeTab === 'jobseeker'} onClick={() => setActiveTab('jobseeker')} label="باحث عن عمل" />
          <TabButton active={activeTab === 'employer'} onClick={() => setActiveTab('employer')} label="صاحب عمل" />
        </div>

        {/* FAQ List */}
        <div className="space-y-4 animate-slide-up">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map(faq => (
              <FAQItem key={faq.id} faq={faq} />
            ))
          ) : (
            <div className="text-center py-20 premium-glass-panel rounded-[2rem]">
              <p className="text-themed-text-ter font-black">لم يتم العثور على نتائج لبحثك.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${
      active 
        ? 'bg-primary text-white shadow-glow-sm' 
        : 'bg-white/50 text-themed-text-ter hover:bg-white border border-primary-100/10'
    }`}
  >
    {label}
  </button>
);

const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`premium-glass-panel overflow-hidden transition-all duration-300 border ${
      isOpen ? 'border-primary-500/30 shadow-premium-lg' : 'border-primary-100/10 shadow-sm'
    } rounded-[1.5rem] md:rounded-[2rem]`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 md:p-8 flex justify-between items-center text-right"
      >
        <span className={`text-lg md:text-xl font-black transition-colors ${isOpen ? 'text-primary' : 'text-themed-text'}`}>
          {faq.question}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isOpen ? 'bg-primary text-white rotate-180' : 'bg-primary-50 text-primary'
        }`}>
          {isOpen ? <FiMinus /> : <FiPlus />}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-6 md:p-8 pt-0 text-themed-text-sec text-base md:text-lg font-medium leading-relaxed border-t border-primary-100/5 bg-primary-500/5">
          {faq.answer}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
