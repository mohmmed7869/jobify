import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaBriefcase, FaGraduationCap, FaTools, 
  FaDownload, FaPrint, FaSave, FaPlus, FaTrash, FaPhone, FaMagic, FaCertificate
} from 'react-icons/fa';
import { 
  FiFileText, FiChevronRight, FiChevronLeft, FiX, FiMail, FiMapPin, FiCheck, FiZap, FiActivity,
  FiSearch, FiExternalLink, FiPlusCircle, FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const ResumeBuilder = () => {
  const { user, setUser } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    return localStorage.getItem('resumeTemplate') || 'modern';
  });
  
  const handleTemplateChange = (templateId) => {
    console.log('Changing template to:', templateId);
    setSelectedTemplate(templateId);
    localStorage.setItem('resumeTemplate', templateId);
  };

  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.profile?.phone || '',
      address: user?.profile?.location?.city || '',
      bio: user?.profile?.bio || '',
      jobTitle: user?.jobseekerProfile?.experience?.[0]?.title || ''
    },
    experience: user?.jobseekerProfile?.experience || [],
    education: user?.jobseekerProfile?.education || [],
    skills: user?.jobseekerProfile?.skills || [],
    languages: user?.jobseekerProfile?.languages || [],
    certifications: user?.jobseekerProfile?.certifications || []
  });

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [name]: value }
    }));
  };

  const handleListChange = (type, index, field, value) => {
    const newList = [...resumeData[type]];
    newList[index][field] = value;
    setResumeData(prev => ({ ...prev, [type]: newList }));
  };

  const addListItem = (type, emptyObj) => {
    setResumeData(prev => ({
      ...prev,
      [type]: [emptyObj, ...prev[type]]
    }));
  };

  const removeListItem = (type, index) => {
    setResumeData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    const loadingToast = toast.loading('جاري المزامنة مع الذكاء الاصطناعي...');
    try {
      // 1. تحديث الملف الشخصي العام (يستخدم FormData لأن الخلفية تستخدم multer)
      const profileFormData = new FormData();
      // التأكد من إرسال الاسم بشكل صحيح سواء كان في personalInfo أو user
      const finalName = resumeData.personalInfo.name || user?.name;
      
      if (!finalName) {
        throw new Error('الاسم مطلوب لتحديث الملف الشخصي');
      }

      profileFormData.append('name', finalName);
      profileFormData.append('phone', resumeData.personalInfo.phone || '');
      profileFormData.append('bio', resumeData.personalInfo.bio || '');
      profileFormData.append('location', JSON.stringify({
        city: resumeData.personalInfo.address || '',
        country: 'اليمن'
      }));

      await axios.put('/api/users/profile', profileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 2. تحديث بيانات الباحث عن عمل (JSON)
      // تنظيف التواريخ قبل الإرسال لتجنب أخطاء MongoDB Validation
      const isValidDate = (d) => d instanceof Date && !isNaN(d);
      
      const cleanExperience = resumeData.experience.map(exp => {
        const startDate = exp.startDate ? new Date(exp.startDate) : null;
        const endDate = exp.endDate ? new Date(exp.endDate) : null;
        return {
          ...exp,
          startDate: isValidDate(startDate) ? startDate : null,
          endDate: isValidDate(endDate) ? endDate : null
        };
      });

      const cleanEducation = resumeData.education.map(edu => {
        const yearVal = edu.startDate || edu.year || edu.endDate;
        const date = yearVal ? new Date(yearVal) : null;
        return {
          ...edu,
          startDate: isValidDate(date) ? date : null,
          endDate: isValidDate(date) ? date : null
        };
      });

      const cleanCertifications = resumeData.certifications.map(cert => {
        const issueDate = cert.issueDate ? new Date(cert.issueDate) : null;
        return {
          ...cert,
          issueDate: isValidDate(issueDate) ? issueDate : null
        };
      });

      const res = await axios.put('/api/users/jobseeker-profile', {
        skills: resumeData.skills,
        experience: cleanExperience,
        education: cleanEducation,
        languages: resumeData.languages,
        certifications: cleanCertifications
      });

      if (res.data.success) {
        setUser(res.data.data);
        toast.success('تم تحديث ملفك المهني بنجاح!', { id: loadingToast });
      }
    } catch (err) {
      console.error('Save Error Details:', err);
      const serverMessage = err.response?.data?.message;
      const clientMessage = err.message;
      toast.error(serverMessage || clientMessage || 'فشل في حفظ البيانات الاستراتيجية', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleAIOptimize = async () => {
    setLoading(true);
    const loadingToast = toast.loading('جاري تحليل وتحسين سيرتك الذاتية...');
    try {
      // تجهيز نص السيرة الذاتية للتحليل مع تحققات وقائية
      const skillsText = Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : '';
      const experienceText = Array.isArray(resumeData.experience) 
        ? resumeData.experience.map(e => `${e.title || ''} في ${e.company || ''}: ${e.description || ''}`).join(' | ')
        : '';

      const fullText = `
        الاسم: ${resumeData.personalInfo?.name || ''}
        المسمى: ${resumeData.personalInfo?.jobTitle || ''}
        النبذة: ${resumeData.personalInfo?.bio || ''}
        المهارات: ${skillsText}
        الخبرات: ${experienceText}
      `;

      const res = await axios.post('/api/ai/improve-resume', {
        resumeText: fullText,
        targetJob: resumeData.personalInfo?.jobTitle || ''
      });

      if (res.data.success) {
        const { suggestions, tips } = res.data.data;
        
        toast.success('تم الانتهاء من التحليل الذكي!', { id: loadingToast });
        
        console.log('AI Suggestions:', suggestions);
        
        // تنبيه المستخدم بأهم الاقتراحات بشكل متتالي
        if (suggestions && suggestions.length > 0) {
          suggestions.slice(0, 3).forEach((suggestion, index) => {
            setTimeout(() => {
              toast(suggestion, { 
                icon: '💡', 
                duration: 8000,
                style: {
                  borderRadius: '10px',
                  background: '#fff',
                  color: '#333',
                  border: '1px solid #e2e8f0'
                }
              });
            }, 1000 * (index + 1));
          });
        } else {
          toast('سيرتك الذاتية تبدو ممتازة! واصل العمل الجيد.', { icon: '👏' });
        }
      }
    } catch (err) {
      console.error('AI Optimize Error:', err);
      toast.error(err.response?.data?.message || 'فشل في التحسين الذكي حالياً. يرجى المحاولة لاحقاً', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBio = async () => {
    setLoading(true);
    const loadingToast = toast.loading('جاري صياغة ملخص مهني احترافي...');
    try {
      const skillsList = resumeData.skills && resumeData.skills.length > 0 
        ? resumeData.skills.slice(0, 5).join(', ') 
        : 'العمل الجماعي، التواصل الفعال، وحل المشكلات';

      const experienceCount = resumeData.experience?.length || 0;
      let expLevel = 'مبتدئ (Junior)';
      if (experienceCount >= 4) expLevel = 'خبير (Senior)';
      else if (experienceCount >= 2) expLevel = 'متوسط الخبرة (Mid-level)';
        
      const promptStr = `قم بإنشاء ملخص مهني احترافي (Summary) باللغة العربية لشخص بمستوى خبرة (${expLevel})، يستهدف وظيفة ${resumeData.personalInfo.jobTitle || 'متخصص'}، ويمتلك مهارات مثل: ${skillsList}. 

هام: أرسل نص الملخص المهني مباشرة وبشكل مجرد. لا تضف أي مقدمات أو شروحات أو عبارات مثل "إليك الملخص" أو "بالتأكيد". أريد فقط النص الذي سيتم نسخه ولصقه في قسم الملخص بالكامل.`;
      
      const res = await axios.post('/api/assistant/chat', {
        message: promptStr,
        context: { type: 'resume_bio' }
      });

      if (res.data.success) {
        let aiMessage = res.data.data.response || res.data.data.message || '';
        // تنظيف النص من علامات Markdown أو النصوص الزائدة أو الاقتباسات
        aiMessage = aiMessage.replace(/```(json)?/g, '').replace(/^"|"$/g, '').trim();
        
        setResumeData(prev => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, bio: aiMessage }
        }));
        toast.success('تم إنشاء الملخص بنجاح!', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل في إنشاء الملخص آلياً', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    // حفظ التغييرات أولاً لضمان أن الـ PDF يحتوي على أحدث البيانات
    await handleSave();
    const loadingToast = toast.loading('جاري تجهيز ملف PDF احترافي عبر الخادم...');
    
    try {
      const element = document.querySelector('.resume-paper');
      if (!element) {
        toast.error('تعذر العثور على السيرة الذاتية للتصدير', { id: loadingToast });
        return;
      }

      // محاولة التصدير عبر الخادم (Puppeteer) لضمان أعلى جودة وتوافق
      const response = await axios.post('/api/users/resume/export-pdf', 
        { htmlContent: element.innerHTML },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume_${user?.name?.replace(/\s+/g, '_') || 'jobify'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('تم تصدير السيرة الذاتية بنجاح عبر الخادم!', { id: loadingToast });
    } catch (err) {
      console.warn('Server-side PDF export failed, falling back to client-side:', err);
      toast.loading('تنبيه: فشل التصدير عبر الخادم، جاري المحاولة عبر المتصفح...', { id: loadingToast });

      // Fallback to html2pdf (client-side)
      try {
        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = html2pdfModule.default || html2pdfModule;
        const element = document.querySelector('.resume-paper');
        
        const opt = {
          margin:       [0.5, 0.5],
          filename:     `resume_${user?.name?.replace(/\s+/g, '_') || 'jobify'}_fallback.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(element).save();
        toast.success('تم التصدير بنجاح (نسخة احتياطية)!', { id: loadingToast });
      } catch (clientErr) {
        console.error('Client-side PDF fallback also failed:', clientErr);
        toast.error('عذراً، فشلت جميع طرق التصدير. يرجى المحاولة لاحقاً', { id: loadingToast });
      }
    }
  };

  const steps = [
    { id: 1, name: 'المعلومات الشخصية', icon: <FaUser />, color: 'bg-blue-600' },
    { id: 2, name: 'الخبرات المهنية', icon: <FaBriefcase />, color: 'bg-indigo-600' },
    { id: 3, name: 'المؤهلات العلمية', icon: <FaGraduationCap />, color: 'bg-emerald-600' },
    { id: 4, name: 'المهارات التقنية', icon: <FaTools />, color: 'bg-amber-600' },
    { id: 5, name: 'اللغات والشهادات', icon: <FaCertificate />, color: 'bg-rose-600' }
  ];

  return (
    <div className="min-h-screen mesh-bg pb-20 pt-6 md:pt-10" dir="rtl">
      <div className="premium-container px-4 md:px-6">
        {/* Header Branding */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 md:mb-12 gap-6 md:gap-8 no-print">
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-14 h-14 md:w-20 md:h-20 bg-primary-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-premium rotate-3 shrink-0"
            >
              <FiFileText className="text-2xl md:text-4xl" />
            </motion.div>
            <div className="text-center sm:text-right max-w-2xl">
              <h1 className="text-2xl md:text-5xl font-black themed-text tracking-tight mb-3 md:mb-4">
                <span className="text-primary-600">سيرتك الذاتية</span> هي هويتك المهنية
              </h1>
              <p className="text-themed-text-sec text-sm md:text-lg font-medium mb-6 leading-relaxed">
                استخدم باني السيرة الذاتية المدمج لإنشاء ملف احترافي يتوافق مع أنظمة الفرز الآلي (ATS) ويزيد من فرص وصولك للمقابلة الشخصية بنسبة <span className="text-primary-600 font-bold">70%</span>.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 md:gap-3">
                <span className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black themed-text-ter uppercase tracking-widest bg-themed-bg-sec border border-themed-border px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  نظام ATS متقدم
                </span>
                <span className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black text-primary-500 uppercase tracking-widest bg-primary-100/20 border border-primary-200/30 px-3 py-1 rounded-full">
                  <FiZap /> ذكاء اصطناعي
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-row justify-center gap-3 md:gap-4 w-full md:w-auto">
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAIOptimize} 
              disabled={loading}
              className="flex-1 md:flex-none bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-4 text-[9px] md:text-xs font-black shadow-premium rounded-xl md:rounded-2xl h-10 md:h-14"
            >
              <FaMagic className={loading ? 'animate-spin' : ''} /> <span>تدقيق AI</span>
            </motion.button>
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave} 
              disabled={loading}
              className="flex-1 md:flex-none btn-formal-secondary flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-4 text-[9px] md:text-xs font-black shadow-premium-lg h-10 md:h-14"
            >
              <FaSave className={loading ? 'animate-spin' : ''} /> <span>{loading ? 'جاري...' : 'حفظ'}</span>
            </motion.button>
            <motion.button 
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint} 
              className="flex-1 md:flex-none btn-formal-primary shadow-glow px-4 md:px-10 py-2.5 md:py-4 text-[9px] md:text-xs font-black flex items-center justify-center gap-2 h-10 md:h-14"
            >
              <FaDownload /> <span>تصدير PDF</span>
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
          {/* Form Side */}
          <div className="xl:w-1/2 space-y-6 md:space-y-8 no-print">
            {/* Step Navigation */}
            <div className="glass-modern p-2 md:p-4 flex justify-between items-center relative overflow-x-auto no-scrollbar border-none shadow-premium rounded-2xl md:rounded-3xl gap-2 md:gap-0">
              <div className="absolute bottom-0 right-0 w-full h-1 bg-themed-bg-ter">
                <motion.div 
                  className="h-full bg-primary-600 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
                  animate={{ width: `${(activeStep / steps.length) * 100}%` }}
                ></motion.div>
              </div>
              {steps.map(step => (
                <button 
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex flex-col items-center gap-1.5 md:gap-3 px-2 md:px-4 py-2 md:py-3 transition-all relative shrink-0 ${activeStep === step.id ? 'scale-105 md:scale-110' : 'opacity-40 hover:opacity-100'}`}
                >
                  <div className={`w-9 h-9 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center text-sm md:text-xl transition-all shadow-lg ${activeStep === step.id ? `${step.color} text-white shadow-premium` : 'bg-themed-bg-sec text-themed-text-ter'}`}>
                    {step.id < activeStep ? <FiCheck /> : step.icon}
                  </div>
                  <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest ${activeStep === step.id ? 'themed-text' : 'themed-text-ter'}`}>{step.name}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="formal-card mesh-gradient p-6 sm:p-10 md:p-12 shadow-premium-xl border-primary-100/30 min-h-[500px] sm:min-h-[600px] rounded-[1.8rem] sm:rounded-[2.5rem]"
              >
                {activeStep === 1 && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <FaUser />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-themed-text">المعلومات الأساسية</h2>
                        <p className="text-themed-text-ter text-xs font-bold uppercase tracking-widest">بيانات التواصل والهوية المهنية</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">الاسم الكامل</label>
                        <input type="text" name="name" value={resumeData.personalInfo.name} onChange={handlePersonalInfoChange} className="formal-input py-4 text-lg font-black" placeholder="أدخل اسمك الكامل" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">العنوان المهني</label>
                        <input type="text" name="jobTitle" value={resumeData.personalInfo.jobTitle} onChange={handlePersonalInfoChange} className="formal-input py-4 text-lg font-black" placeholder="مثلاً: خبير تطوير واجهات" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">البريد الإلكتروني</label>
                        <input type="email" name="email" value={resumeData.personalInfo.email} onChange={handlePersonalInfoChange} className="formal-input py-4" placeholder="name@domain.com" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">رقم التواصل</label>
                        <input type="text" name="phone" value={resumeData.personalInfo.phone} onChange={handlePersonalInfoChange} className="formal-input py-4" placeholder="+967 ..." />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">الموقع الجغرافي</label>
                        <input type="text" name="address" value={resumeData.personalInfo.address} onChange={handlePersonalInfoChange} className="formal-input py-4" placeholder="المدينة، الدولة" />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">الملخص الاستراتيجي</label>
                          <button 
                            onClick={handleGenerateBio}
                            disabled={loading}
                            className="text-primary-600 text-[10px] font-black flex items-center gap-1 hover:underline"
                          >
                            <FaMagic /> توليد بواسطة الذكاء الاصطناعي
                          </button>
                        </div>
                        <textarea name="bio" value={resumeData.personalInfo.bio} onChange={handlePersonalInfoChange} rows="6" className="formal-input resize-none py-4 leading-relaxed font-medium" placeholder="لخص مسيرتك وإنجازاتك في سطور قوية..." />
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <FaBriefcase />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-themed-text">الخبرات العملية</h2>
                          <p className="text-themed-text-ter text-xs font-bold uppercase tracking-widest">سجلك الوظيفي وإنجازاتك السابقة</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => addListItem('experience', { title: '', company: '', startDate: '', endDate: '', description: '' })}
                        className="bg-primary-50 text-primary-600 p-3 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                      >
                        <FiPlusCircle size={24} />
                      </button>
                    </div>
                    
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {resumeData.experience.map((exp, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={idx} 
                          className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 relative group hover:bg-white hover:shadow-premium-sm transition-all"
                        >
                          <button 
                            onClick={() => removeListItem('experience', idx)}
                            className="absolute top-6 left-6 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <FiTrash2 size={20} />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-themed-text-ter uppercase">المسمى الوظيفي</label>
                              <input type="text" placeholder="مثلاً: مطور برمجيات" className="formal-input py-2 text-sm" value={exp.title} onChange={(e) => handleListChange('experience', idx, 'title', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-themed-text-ter uppercase">جهة العمل</label>
                              <input type="text" placeholder="اسم الشركة" className="formal-input py-2 text-sm" value={exp.company} onChange={(e) => handleListChange('experience', idx, 'company', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-themed-text-ter uppercase">الفترة</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="من" className="formal-input py-2 text-sm" value={exp.startDate} onChange={(e) => handleListChange('experience', idx, 'startDate', e.target.value)} />
                                <input type="text" placeholder="إلى" className="formal-input py-2 text-sm" value={exp.endDate} onChange={(e) => handleListChange('experience', idx, 'endDate', e.target.value)} />
                              </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[9px] font-black text-themed-text-ter uppercase">المهام والإنجازات</label>
                              <textarea placeholder="ماذا حققت في هذا الدور؟" className="formal-input py-3 text-sm h-32 resize-none leading-relaxed" value={exp.description} onChange={(e) => handleListChange('experience', idx, 'description', e.target.value)} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <FaGraduationCap />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-themed-text">المؤهلات التعليمية</h2>
                          <p className="text-themed-text-ter text-xs font-bold uppercase tracking-widest">تحصيلك العلمي والدرجات الأكاديمية</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => addListItem('education', { degree: '', school: '', year: '' })}
                        className="bg-emerald-50 text-emerald-600 p-3 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        <FaPlus />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {resumeData.education.map((edu, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={idx} 
                          className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 relative group hover:bg-white transition-all"
                        >
                          <button 
                            onClick={() => removeListItem('education', idx)}
                            className="absolute top-6 left-6 text-slate-300 hover:text-red-500"
                          >
                            <FiTrash2 size={20} />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-themed-text-ter uppercase">الدرجة العلمية</label>
                              <input type="text" placeholder="بكالوريوس هندسة..." className="formal-input py-2 text-sm" value={edu.degree} onChange={(e) => handleListChange('education', idx, 'degree', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-themed-text-ter uppercase">المؤسسة</label>
                              <input type="text" placeholder="اسم الجامعة" className="formal-input py-2 text-sm" value={edu.school} onChange={(e) => handleListChange('education', idx, 'school', e.target.value)} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[9px] font-black text-themed-text-ter uppercase">سنة التخرج</label>
                              <input type="text" placeholder="2023" className="formal-input py-2 text-sm" value={edu.year || edu.endDate} onChange={(e) => handleListChange('education', idx, 'year', e.target.value)} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                      <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <FaTools />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-themed-text">المهارات والخبرات</h2>
                        <p className="text-themed-text-ter text-xs font-bold uppercase tracking-widest">المهارات التقنية والشخصية التي تتقنها</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <form onSubmit={handleAddSkill} className="relative group">
                        <input 
                          type="text" 
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="أضف مهارة (مثلاً: React, AWS, القيادة...)" 
                          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-primary-500 focus:ring-0 rounded-2xl pr-6 pl-16 py-5 font-bold text-themed-text shadow-sm transition-all"
                        />
                        <button 
                          type="submit"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-500 shadow-glow transition-all"
                        >
                          <FaPlus />
                        </button>
                      </form>

                      <div className="flex flex-wrap gap-3">
                        {resumeData.skills.map((skill, i) => (
                          <motion.span 
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={i} 
                            className="group flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-primary-600 transition-all"
                          >
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="text-white/40 hover:text-white transition-colors">
                              <FiX />
                            </button>
                          </motion.span>
                        ))}
                      </div>

                      <div className="p-8 bg-blue-50 rounded-3xl border-2 border-blue-100">
                        <h4 className="text-blue-700 font-black text-sm mb-4 flex items-center gap-2">
                          <FiActivity /> مهارات مقترحة لمجالك:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {['Node.js', 'Docker', 'GraphQL', 'System Design'].map(s => (
                            <button 
                              key={s}
                              onClick={() => { if(!resumeData.skills.includes(s)) setResumeData(p => ({...p, skills: [...p.skills, s]})) }}
                              className="px-4 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black border border-blue-200 hover:bg-blue-600 hover:text-white transition-all"
                            >
                              + {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 5 && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                      <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <FaCertificate />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-themed-text">اللغات والشهادات</h2>
                        <p className="text-themed-text-ter text-xs font-bold uppercase tracking-widest">اللغات المتقنة والشهادات المهنية</p>
                      </div>
                    </div>
                    
                    <div className="space-y-10">
                      <section>
                        <div className="flex justify-between items-center mb-6">
                          <label className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">الشهادات والاعتمادات</label>
                          <button 
                            onClick={() => addListItem('certifications', { name: '', issuer: '', issueDate: '', credentialId: '' })}
                            className="text-primary-600 text-[10px] font-black flex items-center gap-1 hover:underline"
                          >
                            <FiPlusCircle /> إضافة شهادة
                          </button>
                        </div>
                        <div className="space-y-4">
                          {resumeData.certifications.map((cert, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                              <button onClick={() => removeListItem('certifications', idx)} className="absolute top-4 left-4 text-slate-300 hover:text-red-500 transition-colors">
                                <FiTrash2 size={16} />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="اسم الشهادة" className="formal-input py-2 text-sm" value={cert.name} onChange={(e) => handleListChange('certifications', idx, 'name', e.target.value)} />
                                <input type="text" placeholder="الجهة المصدرة" className="formal-input py-2 text-sm" value={cert.issuer} onChange={(e) => handleListChange('certifications', idx, 'issuer', e.target.value)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <div className="flex justify-between items-center mb-6">
                          <label className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest">اللغات</label>
                          <button 
                            onClick={() => addListItem('languages', { language: '', proficiency: 'متوسط' })}
                            className="text-primary-600 text-[10px] font-black flex items-center gap-1 hover:underline"
                          >
                            <FiPlusCircle /> إضافة لغة
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resumeData.languages.map((lang, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input type="text" placeholder="اللغة" className="formal-input py-2 text-sm flex-1" value={lang.language} onChange={(e) => handleListChange('languages', idx, 'language', e.target.value)} />
                              <select className="formal-input py-2 text-xs w-32" value={lang.proficiency} onChange={(e) => handleListChange('languages', idx, 'proficiency', e.target.value)}>
                                <option value="مبتدئ">مبتدئ</option>
                                <option value="متوسط">متوسط</option>
                                <option value="متقدم">متقدم</option>
                                <option value="طليق">طليق</option>
                              </select>
                              <button onClick={() => removeListItem('languages', idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
                  <button 
                    disabled={activeStep === 1}
                    onClick={() => setActiveStep(prev => prev - 1)}
                    className="flex items-center gap-2 text-themed-text-ter font-black text-xs uppercase tracking-widest disabled:opacity-0 hover:text-themed-text-sec transition-all"
                  >
                    <FiChevronRight className="text-lg" /> الخطوة السابقة
                  </button>
                  <button 
                    disabled={activeStep === steps.length}
                    onClick={() => setActiveStep(prev => prev + 1)}
                    className="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-widest disabled:opacity-0 hover:text-primary-700 transition-all group"
                  >
                    الخطوة التالية <FiChevronLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Preview Side */}
          <div className="xl:w-1/2 relative group w-full lg:w-auto">
            <div className="sticky top-28 no-print mb-10 xl:mb-0">
              {/* Template Selector */}
              <div className="flex justify-center gap-4 mb-6 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-premium sticky top-0 z-[100]">
                {[
                  { id: 'modern', name: 'عصري', color: 'bg-slate-900' },
                  { id: 'classic', name: 'كلاسيكي', color: 'bg-blue-700' },
                  { id: 'elegant', name: 'أنيق', color: 'bg-emerald-600' }
                ].map(t => (
                  <motion.button
                    key={t.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTemplateChange(t.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedTemplate === t.id ? 'bg-primary-600 text-white shadow-glow' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${t.color}`}></div>
                    {t.name}
                  </motion.button>
                ))}
              </div>

              <div className="absolute -inset-1 bg-gradient-to-br from-primary-600 to-accent rounded-[2rem] sm:rounded-[3rem] blur opacity-10"></div>
              <div className="relative bg-themed-bg-sec rounded-[1.8rem] sm:rounded-[2.8rem] p-4 sm:p-8 border-2 sm:border-4 border-themed-bg shadow-premium">
                <div className="flex items-center justify-between mb-4 sm:mb-6 px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-400"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-black text-themed-text-ter uppercase tracking-widest">المعاينة الذكية</span>
                </div>
                
                <div className="resume-paper bg-themed-bg rounded-[1.2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden min-h-[600px] sm:min-h-[1000px] transform origin-top transition-transform duration-500 border border-themed-border-light overflow-y-auto max-h-[70vh] xl:max-h-none">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedTemplate}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      {selectedTemplate === 'modern' && (
                        <>
                          {/* CV Header */}
                          <header className="bg-slate-900 text-white p-8 sm:p-14 text-right relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-primary-600/20 to-transparent opacity-50"></div>
                        <div className="relative z-10 space-y-4">
                          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">{resumeData.personalInfo.name || 'الاسم الكامل'}</h2>
                          <div className="inline-block bg-primary-600 px-4 py-1.5 rounded-lg">
                            <p className="text-white font-black text-xs sm:text-sm uppercase tracking-widest">{resumeData.personalInfo.jobTitle || 'المسمى الوظيفي'}</p>
                          </div>
                          
                          <div className="flex flex-wrap justify-start gap-y-3 gap-x-6 pt-6 border-t border-white/10 mt-6 text-[10px] sm:text-xs font-bold text-slate-300">
                            <span className="flex items-center gap-2"><FiMail className="text-primary-400" /> {resumeData.personalInfo.email || 'email@example.com'}</span>
                            <span className="flex items-center gap-2"><FaPhone className="text-primary-400" /> {resumeData.personalInfo.phone || '+967 ...'}</span>
                            <span className="flex items-center gap-2"><FiMapPin className="text-primary-400" /> {resumeData.personalInfo.address || 'المدينة'}</span>
                          </div>
                        </div>
                      </header>

                      <div className="p-6 sm:p-12 space-y-8 sm:space-y-12">
                        {/* Summary Section */}
                        <section>
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-4">
                            النبذة الشخصية
                            <div className="flex-1 h-1 bg-primary-600/10 rounded-full"></div>
                          </h3>
                          <p className="text-slate-600 leading-[1.8] sm:leading-[2.2] text-sm sm:text-base font-medium">
                            {resumeData.personalInfo.bio || 'اكتب نبذة مهنية مختصرة تبرز خبراتك وأهدافك المهنية بشكل جذاب.'}
                          </p>
                        </section>

                        {/* Experience Section */}
                        <section>
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-4">
                            الخبرات العملية
                            <div className="flex-1 h-1 bg-primary-600/10 rounded-full"></div>
                          </h3>
                          <div className="space-y-12">
                            {resumeData.experience.length > 0 ? (
                              resumeData.experience.map((exp, i) => (
                                <div key={i} className="relative pr-8 border-r-4 border-slate-100 group/item">
                                  <div className="absolute top-0 -right-[11px] w-5 h-5 rounded-full bg-white border-4 border-primary-600 shadow-sm group-hover/item:scale-125 transition-transform"></div>
                                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                    <h4 className="font-black text-slate-900 text-xl leading-none">{exp.title || 'المسمى الوظيفي'}</h4>
                                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-4 py-2 rounded-lg border border-primary-100">
                                      {exp.startDate} — {exp.endDate || 'الآن'}
                                    </span>
                                  </div>
                                  <div className="text-primary-600 font-black text-xs mb-4 uppercase tracking-widest">{exp.company || 'اسم الشركة أو المؤسسة'}</div>
                                  <p className="text-slate-600 text-sm leading-relaxed font-medium">{exp.description || 'وصف موجز لأهم المسؤوليات والإنجازات التي حققتها خلال هذه الفترة...'}</p>
                                </div>
                              ))
                            ) : (
                              <div className="py-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">بانتظار إضافة خبراتك الملهمة</p>
                              </div>
                            )}
                          </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <section>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-4">
                              المؤهلات العلمية
                              <div className="flex-1 h-1 bg-primary-600/10 rounded-full"></div>
                            </h3>
                            <div className="space-y-8">
                              {resumeData.education.length > 0 ? (
                                resumeData.education.map((edu, i) => (
                                  <div key={i} className="space-y-2">
                                    <h4 className="font-black text-slate-900 text-sm">{edu.degree || 'الدرجة العلمية'}</h4>
                                    <div className="text-primary-600 font-black text-[10px] uppercase tracking-widest">{edu.school || 'الجامعة'}</div>
                                    <span className="text-[10px] font-black text-slate-400">{edu.year || edu.endDate}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-300 text-[10px] font-black uppercase italic">لم يتم إدراج مؤهلات بعد</p>
                              )}
                            </div>
                          </section>

                          <section>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-4">
                              المهارات
                              <div className="flex-1 h-1 bg-primary-600/10 rounded-full"></div>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {resumeData.skills.length > 0 ? (
                                resumeData.skills.map((skill, i) => (
                                  <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <p className="text-slate-300 text-[10px] font-black uppercase italic">لم يتم تحديد مهارات</p>
                              )}
                            </div>
                          </section>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedTemplate === 'classic' && (
                    <div className="flex flex-col md:flex-row min-h-[1000px]">
                      {/* Sidebar */}
                      <aside className="md:w-1/3 bg-blue-700 text-white p-8 space-y-10">
                        <div className="space-y-4">
                          <h2 className="text-2xl font-black">{resumeData.personalInfo.name || 'الاسم الكامل'}</h2>
                          <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">{resumeData.personalInfo.jobTitle || 'المسمى الوظيفي'}</p>
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-blue-600 pb-2">التواصل</h3>
                          <div className="space-y-3 text-[10px] font-bold">
                            <p className="flex items-center gap-2"><FiMail /> {resumeData.personalInfo.email}</p>
                            <p className="flex items-center gap-2"><FaPhone /> {resumeData.personalInfo.phone}</p>
                            <p className="flex items-center gap-2"><FiMapPin /> {resumeData.personalInfo.address}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-blue-600 pb-2">المهارات</h3>
                          <div className="flex flex-wrap gap-2">
                            {resumeData.skills.map((s, i) => (
                              <span key={i} className="bg-blue-800 px-3 py-1 rounded text-[8px] font-black uppercase">{s}</span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-blue-600 pb-2">اللغات</h3>
                          <div className="space-y-2">
                            {resumeData.languages.map((l, i) => (
                              <div key={i} className="flex justify-between text-[9px] font-bold">
                                <span>{l.language}</span>
                                <span className="text-blue-200">{l.proficiency}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </aside>

                      {/* Main Content */}
                      <main className="md:w-2/3 bg-white p-8 sm:p-12 space-y-10">
                        <section className="space-y-4">
                          <h3 className="text-blue-700 font-black text-sm uppercase tracking-widest flex items-center gap-3">
                            <div className="w-8 h-px bg-blue-700"></div> النبذة الشخصية
                          </h3>
                          <p className="text-slate-600 text-sm leading-relaxed">{resumeData.personalInfo.bio}</p>
                        </section>

                        <section className="space-y-8">
                          <h3 className="text-blue-700 font-black text-sm uppercase tracking-widest flex items-center gap-3">
                            <div className="w-8 h-px bg-blue-700"></div> الخبرات العملية
                          </h3>
                          <div className="space-y-8">
                            {resumeData.experience.map((exp, i) => (
                              <div key={i} className="space-y-2">
                                <div className="flex justify-between font-black text-slate-900">
                                  <span>{exp.title}</span>
                                  <span className="text-[10px] text-blue-600 uppercase tracking-widest">{exp.startDate} - {exp.endDate || 'الآن'}</span>
                                </div>
                                <p className="text-blue-700 text-[10px] font-black uppercase">{exp.company}</p>
                                <p className="text-slate-500 text-xs leading-relaxed">{exp.description}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="space-y-8">
                          <h3 className="text-blue-700 font-black text-sm uppercase tracking-widest flex items-center gap-3">
                            <div className="w-8 h-px bg-blue-700"></div> المؤهلات العلمية
                          </h3>
                          {resumeData.education.map((edu, i) => (
                            <div key={i} className="space-y-1">
                              <h4 className="font-black text-slate-900 text-sm">{edu.degree}</h4>
                              <p className="text-blue-700 text-[10px] font-black">{edu.school}</p>
                              <p className="text-slate-400 text-[9px]">{edu.year || edu.endDate}</p>
                            </div>
                          ))}
                        </section>
                      </main>
                    </div>
                  )}

                  {selectedTemplate === 'elegant' && (
                    <div className="bg-white p-12 sm:p-20 space-y-16">
                      <header className="text-center space-y-6 border-b-2 border-slate-100 pb-12">
                        <h2 className="text-4xl sm:text-6xl font-light tracking-widest text-slate-900 uppercase italic">{resumeData.personalInfo.name}</h2>
                        <p className="text-emerald-600 font-black text-xs sm:text-sm uppercase tracking-[0.5em]">{resumeData.personalInfo.jobTitle}</p>
                        <div className="flex justify-center gap-8 text-[10px] font-bold text-slate-400">
                          <span>{resumeData.personalInfo.email}</span>
                          <span>{resumeData.personalInfo.phone}</span>
                          <span>{resumeData.personalInfo.address}</span>
                        </div>
                      </header>

                      <div className="max-w-2xl mx-auto space-y-16 text-center">
                        <section className="space-y-6">
                          <h3 className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em]">النبذة</h3>
                          <p className="text-slate-500 text-sm sm:text-base leading-loose font-serif italic">{resumeData.personalInfo.bio}</p>
                        </section>

                        <section className="space-y-10 text-right">
                          <h3 className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] text-center mb-10">الخبرات</h3>
                          {resumeData.experience.map((exp, i) => (
                            <div key={i} className="space-y-3">
                              <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                                <h4 className="text-xl font-bold text-slate-900">{exp.title}</h4>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{exp.startDate} — {exp.endDate || 'الآن'}</span>
                              </div>
                              <p className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">{exp.company}</p>
                              <p className="text-slate-500 text-sm leading-relaxed">{exp.description}</p>
                            </div>
                          ))}
                        </section>

                        <section className="space-y-10">
                          <h3 className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em]">التعليم</h3>
                          {resumeData.education.map((edu, i) => (
                            <div key={i} className="space-y-1">
                              <h4 className="text-lg font-bold text-slate-900">{edu.degree}</h4>
                              <p className="text-emerald-700 font-black text-[10px] uppercase">{edu.school}</p>
                              <p className="text-slate-400 text-[9px] uppercase tracking-widest">{edu.year || edu.endDate}</p>
                            </div>
                          ))}
                        </section>

                        <section className="space-y-10">
                          <h3 className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em]">المهارات</h3>
                          <div className="flex flex-wrap justify-center gap-4">
                            {resumeData.skills.map((s, i) => (
                              <span key={i} className="text-xs font-bold text-slate-600 border-b-2 border-emerald-100 pb-1">{s}</span>
                            ))}
                          </div>
                        </section>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .mesh-bg { background: white !important; padding: 0 !important; }
          .formal-container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .resume-paper { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important;
            min-height: auto !important;
            border-radius: 0 !important;
            transform: none !important;
          }
          body { background: white !important; }
          nav, footer { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default ResumeBuilder;