import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaCamera, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaBriefcase, FaGraduationCap, FaLanguage, FaCertificate,
  FaFilePdf, FaUpload, FaSave, FaPlus, FaTrash, FaGlobe,
  FaLinkedin, FaGithub, FaTwitter, FaShareAlt, FaCog, FaPalette,
  FaCalendarAlt, FaCheckCircle, FaIdCard, FaShieldAlt, FaMagic
} from 'react-icons/fa';
import { FiZap, FiAward, FiStar } from 'react-icons/fi';
import { getFileUrl } from '../../utils/fileUrl';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(getFileUrl(user?.profile?.avatar));
  const [idCard, setIdCard] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(getFileUrl(user?.profile?.idCardImage));
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.profile?.phone || '',
    bio: user?.profile?.bio || '',
    website: user?.profile?.website || '',
    location: {
      city: user?.profile?.location?.city || '',
      country: user?.profile?.location?.country || 'اليمن'
    },
    socialLinks: {
      linkedin: user?.profile?.socialLinks?.linkedin || '',
      github: user?.profile?.socialLinks?.github || '',
      twitter: user?.profile?.socialLinks?.twitter || ''
    },
    skills: user?.jobseekerProfile?.skills || [],
    experience: user?.jobseekerProfile?.experience || [],
    education: user?.jobseekerProfile?.education || [],
    languages: user?.jobseekerProfile?.languages || [],
    certifications: user?.jobseekerProfile?.certifications || [],
    preferences: {
      jobTypes: user?.jobseekerProfile?.preferences?.jobTypes || [],
      salaryRange: {
        min: user?.jobseekerProfile?.preferences?.salaryRange?.min || 0,
        max: user?.jobseekerProfile?.preferences?.salaryRange?.max || 0,
        currency: user?.jobseekerProfile?.preferences?.salaryRange?.currency || 'USD'
      },
      locations: user?.jobseekerProfile?.preferences?.locations || [],
      remoteWork: user?.jobseekerProfile?.preferences?.remoteWork || false
    },
    settings: {
      language: user?.settings?.language || 'ar',
      theme: user?.settings?.theme || 'light',
      profileVisibility: user?.settings?.profileVisibility || 'public'
    }
  });

  const [newSkill, setNewSkill] = useState('');
  const [showExpModal, setShowExpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  
  const [expData, setExpData] = useState({
    title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: ''
  });
  
  const [eduData, setEduData] = useState({
    degree: '', school: '', fieldOfStudy: '', startDate: '', endDate: '', grade: ''
  });

  const [langData, setLangData] = useState({
    language: '', proficiency: 'متوسط'
  });

  const [certData, setCertData] = useState({
    name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: ''
  });

  const [generatingBio, setGeneratingBio] = useState(false);
  
  // Sync formData when user changes in context
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.profile?.phone || '',
        bio: user.profile?.bio || '',
        website: user.profile?.website || '',
        location: {
          city: user.profile?.location?.city || '',
          country: user.profile?.location?.country || 'اليمن'
        },
        socialLinks: {
          linkedin: user.profile?.socialLinks?.linkedin || '',
          github: user.profile?.socialLinks?.github || '',
          twitter: user.profile?.socialLinks?.twitter || ''
        },
        skills: user.jobseekerProfile?.skills || [],
        experience: user.jobseekerProfile?.experience || [],
        education: user.jobseekerProfile?.education || [],
        languages: user.jobseekerProfile?.languages || [],
        certifications: user.jobseekerProfile?.certifications || [],
        preferences: {
          jobTypes: user.jobseekerProfile?.preferences?.jobTypes || [],
          salaryRange: {
            min: user.jobseekerProfile?.preferences?.salaryRange?.min || 0,
            max: user.jobseekerProfile?.preferences?.salaryRange?.max || 0,
            currency: user.jobseekerProfile?.preferences?.salaryRange?.currency || 'USD'
          },
          locations: user.jobseekerProfile?.preferences?.locations || [],
          remoteWork: user.jobseekerProfile?.preferences?.remoteWork || false
        },
        settings: {
          language: user.settings?.language || 'ar',
          theme: user.settings?.theme || 'light',
          profileVisibility: user.settings?.profileVisibility || 'public'
        }
      });
      if (user.profile?.avatar) setAvatarPreview(getFileUrl(user.profile.avatar));
      if (user.profile?.idCardImage) setIdCardPreview(getFileUrl(user.profile.idCardImage));
    }
  }, [user]);

  const calculateCompletion = () => {
    let score = 0;
    const total = 10;
    
    if (formData.name) score++;
    if (formData.phone) score++;
    if (formData.bio) score++;
    if (formData.location.city) score++;
    if (formData.skills.length > 0) score++;
    if (formData.experience.length > 0) score++;
    if (formData.education.length > 0) score++;
    if (user?.profile?.avatar) score++;
    if (user?.jobseekerProfile?.resume) score++;
    if (user?.profile?.idCardImage) score++;

    return Math.round((score / total) * 100);
  };

  const generateAiBio = async () => {
    if (formData.skills.length === 0) {
      toast.error('يرجى إضافة بعض المهارات أولاً للحصول على نبذة دقيقة');
      return;
    }

    setGeneratingBio(true);
    try {
      const res = await axios.post('/api/ai/generate-bio', {
        skills: formData.skills,
        experience: formData.experience,
        education: formData.education
      });
      
      if (res.data.success) {
        setFormData(prev => ({ ...prev, bio: res.data.data.bio }));
        toast.success('تم إنشاء النبذة الاحترافية بنجاح');
      }
    } catch (err) {
      toast.error('فشل في توليد النبذة بالذكاء الاصطناعي');
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleIdCardChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdCard(file);
      setIdCardPreview(URL.createObjectURL(file));
    }
  };

  const handleAddSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleAddExperience = () => {
    setFormData(prev => ({ ...prev, experience: [...prev.experience, expData] }));
    setExpData({ title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' });
    setShowExpModal(false);
  };

  const handleRemoveExperience = (index) => {
    setFormData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  };

  const handleAddEducation = () => {
    setFormData(prev => ({ ...prev, education: [...prev.education, eduData] }));
    setEduData({ degree: '', school: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '' });
    setShowEduModal(false);
  };

  const handleRemoveEducation = (index) => {
    setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  const handleAddLanguage = () => {
    setFormData(prev => ({ ...prev, languages: [...prev.languages, langData] }));
    setLangData({ language: '', proficiency: 'متوسط' });
    setShowLangModal(false);
  };

  const handleRemoveLanguage = (index) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));
  };

  const handleAddCertification = () => {
    setFormData(prev => ({ ...prev, certifications: [...(prev.certifications || []), certData] }));
    setCertData({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '' });
    setShowCertModal(false);
  };

  const handleRemoveCertification = (index) => {
    setFormData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('phone', formData.phone);
      form.append('bio', formData.bio);
      form.append('website', formData.website);
      form.append('location', JSON.stringify(formData.location));
      form.append('socialLinks', JSON.stringify(formData.socialLinks));
      
      if (avatar) form.append('avatar', avatar);
      if (idCard) form.append('idCardImage', idCard);

      // إرسال البيانات المهنية أيضاً في نفس الطلب لتجنب التضارب
      form.append('jobseekerProfile', JSON.stringify({
        skills: formData.skills,
        experience: formData.experience,
        education: formData.education,
        languages: formData.languages,
        certifications: formData.certifications,
        preferences: formData.preferences
      }));

      // تحديث الملف الشخصي بالكامل في طلب واحد
      const res = await axios.put('/api/users/profile', form);
      
      if (res.data.success) {
        setUser(res.data.data);
        toast.success('تم تحديث الملف الشخصي بالكامل بنجاح');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const res = await axios.post('/api/users/upload-resume', form);
      if (res.data.success) {
        setUser(res.data.data);
        toast.success('تم رفع السيرة الذاتية بنجاح');
      }
    } catch (err) {
      toast.error('فشل في رفع السيرة الذاتية');
    } finally {
      setLoading(false);
    }
  };

  const renderTabButton = (id, label, icon) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all relative overflow-hidden shrink-0 ${
        activeTab === id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon}
      <span>{label}</span>
      {activeTab === id && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-accent rounded-full"
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen mesh-bg pb-20 pt-10" dir="rtl">
      <div className="premium-container max-w-6xl">
        <div className="glass-card overflow-hidden border-none shadow-premium-lg">
          <div className="h-32 sm:h-48 bg-gradient-to-br from-primary-600 to-accent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            
            {/* Profile Completion Meter */}
            <div className="absolute top-4 left-4 sm:left-10 right-4 sm:right-10 z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
                  <FiAward /> اكتمال الملف الشخصي
                </span>
                <span className="text-xs font-black text-white">{calculateCompletion()}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-md border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateCompletion()}%` }}
                  className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
              </div>
            </div>
          </div>
          
          <div className="px-4 sm:px-10 pb-6 sm:pb-10">
            <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 sm:-mt-20 mb-8 sm:mb-10 gap-6 sm:gap-8">
              <div className="relative group">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[2.5rem] border-4 sm:border-8 border-white bg-white shadow-premium overflow-hidden rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><FaUser size={48} /></div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 p-3 sm:p-4 bg-primary-600 text-white rounded-xl sm:rounded-2xl shadow-glow cursor-pointer hover:bg-primary-700 transition-all border-2 sm:border-4 border-white">
                  <FaCamera size={16} /><input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                </label>
              </div>
              
              <div className="flex-1 text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>نشط الآن
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1 sm:mb-2">{user?.name}</h1>
                <p className="text-slate-500 font-bold text-sm sm:text-base flex items-center justify-center md:justify-start gap-2"><FaEnvelope className="text-primary-500 shrink-0" /> <span className="truncate">{user?.email}</span></p>
              </div>

              <button className="btn-premium-outline bg-white/50 flex items-center gap-2 text-sm sm:text-base"><FaShareAlt /> مشاركة</button>
            </div>

            <div className="flex border-b border-slate-100 mb-8 sm:mb-10 overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
              {renderTabButton('basic', 'الأساسية', <FaUser className="shrink-0" />)}
              {renderTabButton('professional', 'المهنية', <FaBriefcase className="shrink-0" />)}
              {renderTabButton('documents', 'الوثائق', <FaFilePdf className="shrink-0" />)}
              {renderTabButton('preferences', 'التفضيلات', <FaPalette className="shrink-0" />)}
              {renderTabButton('verification', 'التوثيق', <FaIdCard className="shrink-0" />)}
              {renderTabButton('settings', 'الإعدادات', <FaCog className="shrink-0" />)}
            </div>

            <form onSubmit={handleSubmit} className="animate-fade-in space-y-10">
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">الاسم</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="premium-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">الهاتف</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="premium-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">المدينة</label>
                    <input type="text" name="location.city" value={formData.location.city} onChange={handleInputChange} className="premium-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">الدولة</label>
                    <input type="text" name="location.country" value={formData.location.country} onChange={handleInputChange} className="premium-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">الموقع الإلكتروني</label>
                    <input type="text" name="website" value={formData.website} onChange={handleInputChange} className="premium-input" placeholder="https://example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">LinkedIn</label>
                    <input type="text" name="socialLinks.linkedin" value={formData.socialLinks.linkedin} onChange={handleInputChange} className="premium-input" placeholder="linkedin.com/in/username" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">GitHub</label>
                    <input type="text" name="socialLinks.github" value={formData.socialLinks.github} onChange={handleInputChange} className="premium-input" placeholder="github.com/username" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Twitter (X)</label>
                    <input type="text" name="socialLinks.twitter" value={formData.socialLinks.twitter} onChange={handleInputChange} className="premium-input" placeholder="twitter.com/username" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">النبذة التعريفية</label>
                      <button 
                        type="button" 
                        onClick={generateAiBio}
                        disabled={generatingBio}
                        className="text-[10px] font-black text-primary-600 flex items-center gap-1.5 px-3 py-1 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all border border-primary-100 shadow-sm"
                      >
                        {generatingBio ? (
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            جاري التوليد...
                          </span>
                        ) : (
                          <>
                            <FaMagic className="text-primary-500" /> توليد بالذكاء الاصطناعي
                          </>
                        )}
                      </button>
                    </div>
                    <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" className="premium-input resize-none" placeholder="اكتب نبذة مختصرة عنك أو استخدم الذكاء الاصطناعي لتوليدها..." />
                  </div>
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="space-y-12">
                  <section>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">المهارات</label>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {formData.skills.map(skill => (
                        <span key={skill} className="bg-primary-50 text-primary-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 border border-primary-100">
                          {skill}<button type="button" onClick={() => handleRemoveSkill(skill)}><FaTrash size={10} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="premium-input flex-1" placeholder="أضف مهارة..." />
                      <button type="button" onClick={handleAddSkill} className="btn-premium-primary px-6"><FaPlus /></button>
                    </div>
                  </section>

                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الخبرات العملية</label>
                      <button type="button" onClick={() => setShowExpModal(true)} className="text-primary-600 font-black text-xs flex items-center gap-1"><FaPlus /> إضافة خبرة</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {formData.experience.map((exp, i) => (
                        <div key={i} className="group relative glass-card p-6 flex gap-6 items-start border-slate-100 hover:border-primary-200 transition-all hover:shadow-premium-sm">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                            <FaBriefcase className="text-slate-400 group-hover:text-primary-500" size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-black text-slate-900 text-lg leading-tight">{exp.title}</h4>
                                <p className="text-primary-600 font-black text-sm mt-1">{exp.company}</p>
                              </div>
                              <button type="button" onClick={() => handleRemoveExperience(i)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><FaTrash size={14} /></button>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3">
                              <span className="text-slate-500 text-xs font-bold flex items-center gap-1.5"><FaCalendarAlt className="text-slate-300" /> {exp.startDate} - {exp.current ? 'الآن' : exp.endDate}</span>
                              <span className="text-slate-500 text-xs font-bold flex items-center gap-1.5"><FaMapMarkerAlt className="text-slate-300" /> {exp.location && typeof exp.location === 'object' ? exp.location.city : (exp.location || 'عن بعد')}</span>
                            </div>
                            {exp.description && <p className="text-slate-500 text-sm mt-4 font-medium leading-relaxed">{exp.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">التعليم</label>
                      <button type="button" onClick={() => setShowEduModal(true)} className="text-primary-600 font-black text-xs flex items-center gap-1"><FaPlus /> إضافة تعليم</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {formData.education.map((edu, i) => (
                        <div key={i} className="group relative glass-card p-6 flex gap-6 items-start border-slate-100 hover:border-primary-200 transition-all hover:shadow-premium-sm">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                            <FaGraduationCap className="text-slate-400 group-hover:text-primary-500" size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-black text-slate-900 text-lg leading-tight">{edu.degree}</h4>
                                <p className="text-primary-600 font-black text-sm mt-1">{edu.school}</p>
                              </div>
                              <button type="button" onClick={() => handleRemoveEducation(i)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><FaTrash size={14} /></button>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3">
                              <span className="text-slate-500 text-xs font-bold flex items-center gap-1.5"><FiAward className="text-slate-300" /> {edu.fieldOfStudy}</span>
                              <span className="text-slate-500 text-xs font-bold flex items-center gap-1.5"><FaCalendarAlt className="text-slate-300" /> {edu.startDate} - {edu.endDate}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">اللغات</label>
                      <button type="button" onClick={() => setShowLangModal(true)} className="text-primary-600 font-black text-xs flex items-center gap-1"><FaPlus /> إضافة لغة</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.languages?.map((lang, i) => (
                        <div key={i} className="glass-card p-4 flex justify-between items-center border-slate-100">
                          <div>
                            <h4 className="font-black text-slate-900">{lang.language}</h4>
                            <p className="text-primary-600 font-bold text-xs">{lang.proficiency}</p>
                          </div>
                          <button type="button" onClick={() => handleRemoveLanguage(i)} className="text-slate-300 hover:text-red-500"><FaTrash /></button>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الشهادات</label>
                      <button type="button" onClick={() => setShowCertModal(true)} className="text-primary-600 font-black text-xs flex items-center gap-1"><FaPlus /> إضافة شهادة</button>
                    </div>
                    <div className="space-y-4">
                      {formData.certifications?.map((cert, i) => (
                        <div key={i} className="glass-card p-6 flex justify-between items-start border-slate-100">
                          <div>
                            <h4 className="font-black text-slate-900">{cert.name}</h4>
                            <p className="text-primary-600 font-bold text-sm">{cert.issuer}</p>
                            <p className="text-slate-400 text-xs mt-1">{cert.issueDate} {cert.expiryDate && `- ${cert.expiryDate}`}</p>
                          </div>
                          <button type="button" onClick={() => handleRemoveCertification(i)} className="text-slate-300 hover:text-red-500"><FaTrash /></button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-8">
                  <div className="glass-card p-10 text-center border-dashed border-2 border-primary-200 bg-primary-50/30">
                    <FaFilePdf size={48} className="mx-auto text-primary-500 mb-4" />
                    <h3 className="text-xl font-black text-slate-900 mb-2">السيرة الذاتية الذكية</h3>
                    <p className="text-slate-500 mb-8">ارفع ملفك لتمكين نظام المطابقة بالذكاء الاصطناعي</p>
                    {user?.jobseekerProfile?.resume && (
                      <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                        <FaCheckCircle className="text-green-500" />
                        <span className="text-sm font-bold">تم رفع السيرة الذاتية</span>
                        <a href={getFileUrl(user.jobseekerProfile.resume)} target="_blank" rel="noreferrer" className="text-primary-600 text-xs font-black">عرض</a>
                      </div>
                    )}
                    <br/>
                    <label className="btn-premium-primary inline-flex items-center gap-2 cursor-pointer">
                      <FaUpload /> {loading ? 'جاري الرفع...' : 'رفع ملف جديد'}
                      <input type="file" className="hidden" accept=".pdf" onChange={handleResumeUpload} />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-10 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">أنواع الوظائف المفضلة</label>
                      <div className="flex flex-wrap gap-2">
                        {['دوام كامل', 'دوام جزئي', 'عقد', 'تدريب', 'عن بعد'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const types = formData.preferences.jobTypes.includes(type)
                                ? formData.preferences.jobTypes.filter(t => t !== type)
                                : [...formData.preferences.jobTypes, type];
                              setFormData({...formData, preferences: {...formData.preferences, jobTypes: types}});
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                              formData.preferences.jobTypes.includes(type)
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-slate-500 border-slate-100 hover:border-primary-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">توقع الراتب (شهرياً)</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          placeholder="الحد الأدنى"
                          value={formData.preferences.salaryRange.min}
                          onChange={e => setFormData({...formData, preferences: {...formData.preferences, salaryRange: {...formData.preferences.salaryRange, min: e.target.value}}})}
                          className="premium-input"
                        />
                        <span className="text-slate-400 font-black">إلى</span>
                        <input
                          type="number"
                          placeholder="الحد الأقصى"
                          value={formData.preferences.salaryRange.max}
                          onChange={e => setFormData({...formData, preferences: {...formData.preferences, salaryRange: {...formData.preferences.salaryRange, max: e.target.value}}})}
                          className="premium-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">العمل عن بعد</label>
                      <div className="flex items-center gap-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={formData.preferences.remoteWork}
                            onChange={e => setFormData({...formData, preferences: {...formData.preferences, remoteWork: e.target.checked}})}
                          />
                          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                          <span className="mr-3 text-sm font-bold text-slate-600">متاح للعمل عن بعد</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'verification' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="glass-card p-10 border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                        <FaIdCard size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">توثيق الهوية</h3>
                        <p className="text-slate-500 text-sm font-bold">رفع صورة البطاقة الشخصية يزيد من فرص قبولك في الوظائف</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                        <div className={`relative group w-full h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${idCardPreview ? 'border-primary-500 bg-primary-50/30' : 'border-slate-200 bg-slate-50 hover:border-primary-300'}`}>
                          {idCardPreview ? (
                            <img src={idCardPreview} alt="ID Card" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <FaUpload size={32} className="text-slate-300 mb-3" />
                              <span className="text-sm font-black text-slate-400">اسحب صورة البطاقة هنا</span>
                            </>
                          )}
                          <input type="file" className="hidden" id="id-card-upload" onChange={handleIdCardChange} accept="image/*" />
                          <label htmlFor="id-card-upload" className="absolute inset-0 cursor-pointer"></label>
                        </div>
                        {idCard && (
                          <p className="text-xs text-primary-600 font-bold flex items-center gap-1">
                            <FaCheckCircle /> تم اختيار ملف جديد: {idCard.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                        <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                          <FaShieldAlt className="text-primary-500" /> لماذا التوثيق؟
                        </h4>
                        <ul className="space-y-2">
                          <li className="text-xs text-slate-600 font-bold flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1"></span>
                            تفعيل علامة التوثيق الزرقاء بجانب اسمك.
                          </li>
                          <li className="text-xs text-slate-600 font-bold flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1"></span>
                            زيادة ثقة أصحاب العمل في ملفك الشخصي.
                          </li>
                          <li className="text-xs text-slate-600 font-bold flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1"></span>
                            الأولوية في نتائج البحث عن الموظفين.
                          </li>
                        </ul>
                        <div className="pt-2 text-[10px] text-slate-400 font-bold leading-relaxed">
                          * يتم تخزين جميع الوثائق بشكل مشفر وآمن ولا تظهر إلا لمديري المنصة لأغراض التحقق.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-10 border-t border-slate-100 flex justify-end gap-4">
                <button type="submit" disabled={loading} className="btn-premium-primary px-16 py-4 shadow-glow flex items-center gap-3">
                  <FaSave /> {loading ? 'جاري الحفظ...' : 'حفظ التغييرات الاستراتيجية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Experience Modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-8 animate-scale-up">
            <h3 className="text-2xl font-black mb-6">إضافة خبرة عملية</h3>
            <div className="space-y-4">
              <input type="text" placeholder="المسمى الوظيفي" value={expData.title} onChange={e => setExpData({...expData, title: e.target.value})} className="premium-input" />
              <input type="text" placeholder="الشركة" value={expData.company} onChange={e => setExpData({...expData, company: e.target.value})} className="premium-input" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" placeholder="من" value={expData.startDate} onChange={e => setExpData({...expData, startDate: e.target.value})} className="premium-input" />
                <input type="date" placeholder="إلى" value={expData.endDate} onChange={e => setExpData({...expData, endDate: e.target.value})} className="premium-input" disabled={expData.current} />
              </div>
              <label className="flex items-center gap-2 font-bold text-sm text-slate-600"><input type="checkbox" checked={expData.current} onChange={e => setExpData({...expData, current: e.target.checked})} /> ما زلت أعمل هنا</label>
              <textarea placeholder="الوصف" value={expData.description} onChange={e => setExpData({...expData, description: e.target.value})} className="premium-input h-24 resize-none" />
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowExpModal(false)} className="btn-premium-outline">إلغاء</button>
                <button onClick={handleAddExperience} className="btn-premium-primary px-8">إضافة</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-8 animate-scale-up">
            <h3 className="text-2xl font-black mb-6">إضافة مؤهل تعليمي</h3>
            <div className="space-y-4">
              <input type="text" placeholder="الدرجة العلمية" value={eduData.degree} onChange={e => setEduData({...eduData, degree: e.target.value})} className="premium-input" />
              <input type="text" placeholder="المؤسسة التعليمية" value={eduData.school} onChange={e => setEduData({...eduData, school: e.target.value})} className="premium-input" />
              <input type="text" placeholder="التخصص" value={eduData.fieldOfStudy} onChange={e => setEduData({...eduData, fieldOfStudy: e.target.value})} className="premium-input" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={eduData.startDate} onChange={e => setEduData({...eduData, startDate: e.target.value})} className="premium-input" />
                <input type="date" value={eduData.endDate} onChange={e => setEduData({...eduData, endDate: e.target.value})} className="premium-input" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowEduModal(false)} className="btn-premium-outline">إلغاء</button>
                <button onClick={handleAddEducation} className="btn-premium-primary px-8">إضافة</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-8 animate-scale-up">
            <h3 className="text-2xl font-black mb-6">إضافة لغة</h3>
            <div className="space-y-4">
              <input type="text" placeholder="اللغة" value={langData.language} onChange={e => setLangData({...langData, language: e.target.value})} className="premium-input" />
              <select value={langData.proficiency} onChange={e => setLangData({...langData, proficiency: e.target.value})} className="premium-input">
                <option value="مبتدئ">مبتدئ</option>
                <option value="متوسط">متوسط</option>
                <option value="متقدم">متقدم</option>
                <option value="طليق">طليق</option>
              </select>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowLangModal(false)} className="btn-premium-outline">إلغاء</button>
                <button onClick={handleAddLanguage} className="btn-premium-primary px-8">إضافة</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-8 animate-scale-up">
            <h3 className="text-2xl font-black mb-6">إضافة شهادة</h3>
            <div className="space-y-4">
              <input type="text" placeholder="اسم الشهادة" value={certData.name} onChange={e => setCertData({...certData, name: e.target.value})} className="premium-input" />
              <input type="text" placeholder="الجهة المصدرة" value={certData.issuer} onChange={e => setCertData({...certData, issuer: e.target.value})} className="premium-input" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" placeholder="تاريخ الإصدار" value={certData.issueDate} onChange={e => setCertData({...certData, issueDate: e.target.value})} className="premium-input" />
                <input type="date" placeholder="تاريخ الانتهاء" value={certData.expiryDate} onChange={e => setCertData({...certData, expiryDate: e.target.value})} className="premium-input" />
              </div>
              <input type="text" placeholder="رقم الشهادة" value={certData.credentialId} onChange={e => setCertData({...certData, credentialId: e.target.value})} className="premium-input" />
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowCertModal(false)} className="btn-premium-outline">إلغاء</button>
                <button onClick={handleAddCertification} className="btn-premium-primary px-8">إضافة</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
