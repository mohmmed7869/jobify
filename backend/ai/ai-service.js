// خدمة الذكاء الاصطناعي المتقدمة
// فريق التطوير: م. محمد علي (مدير) • م. هيثم نجاد • م. محمد حنش • م. محمد مسرع • م. مكين الشلفي
class AIService {
  constructor() {
    this.initialized = false;
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.init();
  }

  async init() {
    console.log('🤖 تهيئة خدمة الذكاء الاصطناعي المتقدمة...');
    this.initialized = true;
  }

  // Initialize comprehensive knowledge base
  initializeKnowledgeBase() {
    return {
      industries: {
        'تقنية المعلومات': {
          skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'Git'],
          roles: ['مطور ويب', 'مطور تطبيقات', 'مهندس DevOps', 'محلل أنظمة', 'مهندس أمن سيبراني'],
          salaryRange: '8000-25000',
          growth: 'عالي'
        },
        'التسويق الرقمي': {
          skills: ['Google Ads', 'Facebook Ads', 'SEO', 'Content Marketing', 'Analytics', 'Social Media', 'Email Marketing'],
          roles: ['مختص تسويق رقمي', 'مدير وسائل التواصل', 'محلل تسويق', 'مختص SEO'],
          salaryRange: '5000-15000',
          growth: 'متوسط'
        },
        'التصميم': {
          skills: ['Photoshop', 'Illustrator', 'Figma', 'Adobe XD', 'UI/UX', 'Sketch', 'InDesign', 'After Effects'],
          roles: ['مصمم جرافيك', 'مصمم UI/UX', 'مصمم منتجات', 'مصمم حركة'],
          salaryRange: '4000-12000',
          growth: 'متوسط'
        },
        'المبيعات': {
          skills: ['CRM', 'التفاوض', 'خدمة العملاء', 'تطوير الأعمال', 'العروض التقديمية', 'إدارة العلاقات'],
          roles: ['مندوب مبيعات', 'مدير مبيعات', 'مطور أعمال', 'مختص علاقات عملاء'],
          salaryRange: '3000-20000',
          growth: 'عالي'
        },
        'الموارد البشرية': {
          skills: ['التوظيف', 'إدارة الأداء', 'التدريب', 'قوانين العمل', 'HRIS', 'تطوير المواهب'],
          roles: ['مختص توظيف', 'مدير موارد بشرية', 'مطور مواهب', 'محلل أداء'],
          salaryRange: '5000-18000',
          growth: 'متوسط'
        },
        'المحاسبة والمالية': {
          skills: ['Excel', 'QuickBooks', 'SAP', 'المحاسبة المالية', 'التدقيق', 'التقارير المالية', 'التحليل المالي'],
          roles: ['محاسب', 'محلل مالي', 'مدقق حسابات', 'مدير مالي'],
          salaryRange: '4000-16000',
          growth: 'مستقر'
        }
      },
      
      careerPaths: {
        'مطور مبتدئ': {
          nextLevel: 'مطور متوسط',
          requiredSkills: ['JavaScript', 'HTML', 'CSS', 'Git'],
          timeframe: '1-2 سنة',
          recommendations: ['بناء مشاريع شخصية', 'المساهمة في مشاريع مفتوحة المصدر', 'تعلم إطار عمل حديث']
        },
        'مطور متوسط': {
          nextLevel: 'مطور أول',
          requiredSkills: ['React/Vue', 'Node.js', 'Database', 'Testing'],
          timeframe: '2-3 سنوات',
          recommendations: ['قيادة مشاريع صغيرة', 'تعلم أنماط التصميم', 'تطوير مهارات التواصل']
        }
      },

      resumeTemplates: {
        'تقني': {
          sections: ['المعلومات الشخصية', 'الملخص المهني', 'المهارات التقنية', 'الخبرات', 'التعليم', 'المشاريع', 'الشهادات'],
          colors: ['#2196F3', '#4CAF50', '#FF9800'],
          fonts: ['Arial', 'Roboto', 'Open Sans']
        },
        'إبداعي': {
          sections: ['المعلومات الشخصية', 'نبذة إبداعية', 'المهارات', 'الخبرات', 'التعليم', 'المعرض', 'الجوائز'],
          colors: ['#E91E63', '#9C27B0', '#FF5722'],
          fonts: ['Montserrat', 'Lato', 'Poppins']
        },
        'تقليدي': {
          sections: ['المعلومات الشخصية', 'الهدف المهني', 'الخبرات', 'التعليم', 'المهارات', 'المراجع'],
          colors: ['#333333', '#666666', '#999999'],
          fonts: ['Times New Roman', 'Georgia', 'Serif']
        }
      },

      interviewQuestions: {
        'عامة': [
          'حدثني عن نفسك',
          'ما هي نقاط قوتك وضعفك؟',
          'لماذا تريد العمل في هذه الشركة؟',
          'أين ترى نفسك خلال 5 سنوات؟',
          'ما هو أكبر تحدٍ واجهته في العمل؟'
        ],
        'تقنية': [
          'اشرح مفهوم البرمجة الكائنية',
          'ما الفرق بين SQL و NoSQL؟',
          'كيف تتعامل مع الأخطاء في التطبيقات؟',
          'اشرح مفهوم API وكيفية استخدامه',
          'ما هي أفضل الممارسات في الأمان السيبراني؟'
        ],
        'إدارية': [
          'كيف تدير فريق العمل؟',
          'اشرح تجربة في حل نزاع بين الموظفين',
          'كيف تحدد أولويات المهام؟',
          'ما هو أسلوبك في اتخاذ القرارات؟',
          'كيف تتعامل مع الضغط والمواعيد النهائية؟'
        ]
      }
    };
  }

  // تحليل السيرة الذاتية
  async analyzeResume(resumeText, jobRequirements = []) {
    try {
      // محاكاة تحليل السيرة الذاتية
      const skills = this.extractSkills(resumeText);
      const experience = this.extractExperience(resumeText);
      const education = this.extractEducation(resumeText);
      
      const matchScore = this.calculateJobMatch(skills, jobRequirements);
      
      return {
        success: true,
        analysis: {
          skills: skills,
          experience: experience,
          education: education,
          matchScore: matchScore,
          recommendations: this.generateRecommendations(skills, jobRequirements),
          strengths: this.identifyStrengths(skills, experience),
          improvements: this.suggestImprovements(skills, jobRequirements)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'خطأ في تحليل السيرة الذاتية'
      };
    }
  }

  // استخراج المهارات من النص
  extractSkills(text) {
    const skillKeywords = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'MongoDB', 
      'SQL', 'HTML', 'CSS', 'PHP', 'Laravel', 'Vue.js', 'Angular',
      'Docker', 'AWS', 'Git', 'Linux', 'Windows', 'Photoshop',
      'Illustrator', 'Figma', 'UI/UX', 'Marketing', 'SEO'
    ];
    
    const foundSkills = [];
    const lowerText = text.toLowerCase();
    
    skillKeywords.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    
    return foundSkills;
  }

  // استخراج الخبرة
  extractExperience(text) {
    const experiencePatterns = [
      /(\d+)\s*(سنة|سنوات|عام|أعوام)/g,
      /(\d+)\s*(year|years)/gi
    ];
    
    let totalExperience = 0;
    experiencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const years = parseInt(match.match(/\d+/)[0]);
          totalExperience = Math.max(totalExperience, years);
        });
      }
    });
    
    return {
      years: totalExperience,
      level: totalExperience >= 5 ? 'خبير' : totalExperience >= 2 ? 'متوسط' : 'مبتدئ'
    };
  }

  // استخراج التعليم
  extractEducation(text) {
    const educationKeywords = [
      'بكالوريوس', 'ماجستير', 'دكتوراه', 'دبلوم', 'شهادة',
      'bachelor', 'master', 'phd', 'diploma', 'certificate'
    ];
    
    const foundEducation = [];
    const lowerText = text.toLowerCase();
    
    educationKeywords.forEach(edu => {
      if (lowerText.includes(edu.toLowerCase())) {
        foundEducation.push(edu);
      }
    });
    
    return foundEducation;
  }

  // حساب مطابقة الوظيفة
  calculateJobMatch(candidateSkills, jobRequirements) {
    if (jobRequirements.length === 0) return 75; // نسبة افتراضية
    
    const matchingSkills = candidateSkills.filter(skill => 
      jobRequirements.some(req => 
        req.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(req.toLowerCase())
      )
    );
    
    const matchPercentage = (matchingSkills.length / jobRequirements.length) * 100;
    return Math.min(Math.round(matchPercentage), 100);
  }

  // توليد التوصيات
  generateRecommendations(skills, jobRequirements) {
    const recommendations = [];
    
    if (skills.length < 3) {
      recommendations.push('ننصح بتطوير المزيد من المهارات التقنية');
    }
    
    if (jobRequirements.length > 0) {
      const missingSkills = jobRequirements.filter(req => 
        !skills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
      );
      
      if (missingSkills.length > 0) {
        recommendations.push(`ننصح بتعلم: ${missingSkills.slice(0, 3).join(', ')}`);
      }
    }
    
    recommendations.push('احرص على تحديث سيرتك الذاتية بانتظام');
    
    return recommendations;
  }

  // تحديد نقاط القوة
  identifyStrengths(skills, experience) {
    const strengths = [];
    
    if (skills.length >= 5) {
      strengths.push('تنوع في المهارات التقنية');
    }
    
    if (experience.years >= 3) {
      strengths.push('خبرة عملية جيدة');
    }
    
    if (skills.some(skill => ['React', 'Vue.js', 'Angular'].includes(skill))) {
      strengths.push('خبرة في تقنيات الواجهات الحديثة');
    }
    
    if (skills.some(skill => ['Node.js', 'Python', 'Java'].includes(skill))) {
      strengths.push('خبرة في تطوير الخادم');
    }
    
    return strengths.length > 0 ? strengths : ['مرشح واعد'];
  }

  // اقتراح التحسينات
  suggestImprovements(skills, jobRequirements) {
    const improvements = [];
    
    if (jobRequirements.length > 0) {
      const missingSkills = jobRequirements.filter(req => 
        !skills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
      );
      
      missingSkills.slice(0, 3).forEach(skill => {
        improvements.push(`تعلم ${skill}`);
      });
    }
    
    if (improvements.length === 0) {
      improvements.push('استمر في تطوير مهاراتك الحالية');
      improvements.push('احصل على شهادات معتمدة');
    }
    
    return improvements;
  }

  // تحليل الوظيفة تلقائياً
  async analyzeJob(jobData) {
    try {
      const analysis = {
        difficulty: this.assessJobDifficulty(jobData.requirements || []),
        salaryRange: this.analyzeSalaryRange(jobData.salary || ''),
        skillsRequired: jobData.requirements || [],
        experienceLevel: this.determineExperienceLevel(jobData.description || ''),
        marketDemand: this.assessMarketDemand(jobData.requirements || []),
        recommendations: this.generateJobRecommendations(jobData)
      };
      
      return {
        success: true,
        analysis: analysis
      };
    } catch (error) {
      return {
        success: false,
        error: 'خطأ في تحليل الوظيفة'
      };
    }
  }

  // تقييم صعوبة الوظيفة
  assessJobDifficulty(requirements) {
    const advancedSkills = ['AI', 'Machine Learning', 'DevOps', 'Kubernetes', 'Microservices'];
    const hasAdvanced = requirements.some(req => 
      advancedSkills.some(skill => req.toLowerCase().includes(skill.toLowerCase()))
    );
    
    if (hasAdvanced) return 'متقدم';
    if (requirements.length > 5) return 'متوسط';
    return 'مبتدئ';
  }

  // تحليل نطاق الراتب
  analyzeSalaryRange(salaryText) {
    const numbers = salaryText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const min = parseInt(numbers[0]);
      const max = parseInt(numbers[1]);
      return {
        min: min,
        max: max,
        average: Math.round((min + max) / 2),
        competitive: max > 10000 ? 'مرتفع' : max > 5000 ? 'متوسط' : 'منخفض'
      };
    }
    return { competitive: 'غير محدد' };
  }

  // تحديد مستوى الخبرة المطلوب
  determineExperienceLevel(description) {
    const seniorKeywords = ['خبير', 'كبير', 'senior', 'lead', 'manager'];
    const juniorKeywords = ['مبتدئ', 'junior', 'entry', 'fresh'];
    
    const lowerDesc = description.toLowerCase();
    
    if (seniorKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'خبير';
    }
    if (juniorKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'مبتدئ';
    }
    return 'متوسط';
  }

  // تقييم الطلب في السوق
  assessMarketDemand(requirements) {
    const highDemandSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'AWS'];
    const matchingSkills = requirements.filter(req => 
      highDemandSkills.some(skill => req.toLowerCase().includes(skill.toLowerCase()))
    );
    
    if (matchingSkills.length >= 3) return 'عالي';
    if (matchingSkills.length >= 1) return 'متوسط';
    return 'منخفض';
  }

  // توليد توصيات للوظيفة
  generateJobRecommendations(jobData) {
    const recommendations = [];
    
    if (!jobData.salary || jobData.salary.includes('غير محدد')) {
      recommendations.push('ننصح بتحديد نطاق راتب واضح');
    }
    
    if (!jobData.requirements || jobData.requirements.length < 3) {
      recommendations.push('ننصح بتوضيح المتطلبات بشكل أكبر');
    }
    
    if (!jobData.description || jobData.description.length < 100) {
      recommendations.push('ننصح بكتابة وصف أكثر تفصيلاً');
    }
    
    return recommendations;
  }

  // بوت المحادثة الذكي
  async chatBot(message, context = {}) {
    try {
      const response = await this.generateChatResponse(message, context);
      return {
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        response: 'عذراً، حدث خطأ في المحادثة. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toISOString()
      };
    }
  }

  // توليد رد المحادثة
  async generateChatResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // الترحيب والتحيات
    if (lowerMessage.includes('مرحبا') || lowerMessage.includes('السلام') || lowerMessage.includes('hello') || lowerMessage.includes('أهلا')) {
      const greetings = [
        'مرحباً بك في Jobify! 🌟 أنا مساعدك الشخصي، كيف يمكنني مساعدتك اليوم؟',
        'أهلاً وسهلاً! 👋 أنا هنا لمساعدتك في رحلة البحث عن الوظيفة المثالية. ما الذي تحتاج إليه؟',
        'مرحباً! 😊 يسعدني أن أساعدك في كل ما يتعلق بالتوظيف والمهن. كيف يمكنني خدمتك؟'
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // البحث عن الوظائف
    if (lowerMessage.includes('وظيفة') || lowerMessage.includes('عمل') || lowerMessage.includes('job') || lowerMessage.includes('بحث')) {
      return `🔍 **البحث عن الوظائف**

يمكنني مساعدتك في العثور على الوظيفة المثالية! 

**أخبرني عن:**
• مجال تخصصك أو اهتمامك
• مستوى خبرتك (مبتدئ، متوسط، خبير)
• الموقع المفضل للعمل
• نوع العمل (دوام كامل، جزئي، عن بُعد)

**نصائح للبحث الفعال:**
✅ استخدم كلمات مفتاحية محددة
✅ حدث سيرتك الذاتية بانتظام
✅ تابع الشركات التي تهمك
✅ استخدم شبكتك المهنية

هل تريد البدء في البحث الآن؟`;
    }
    
    // السيرة الذاتية
    if (lowerMessage.includes('سيرة') || lowerMessage.includes('cv') || lowerMessage.includes('resume')) {
      return `📄 **تحسين السيرة الذاتية**

السيرة الذاتية هي بطاقتك التعريفية المهنية! 

**عناصر السيرة الذاتية المثالية:**
1️⃣ **المعلومات الشخصية** - الاسم، الهاتف، البريد الإلكتروني
2️⃣ **الملخص المهني** - 2-3 جمل تلخص خبرتك
3️⃣ **الخبرات العملية** - مرتبة من الأحدث للأقدم
4️⃣ **التعليم والمؤهلات** - الشهادات والدورات
5️⃣ **المهارات** - التقنية واللغوية والشخصية
6️⃣ **الإنجازات** - أرقام ونتائج ملموسة

**نصائح ذهبية:**
✨ اجعلها مختصرة (1-2 صفحة)
✨ استخدم كلمات مفتاحية من الوظيفة
✨ اذكر إنجازات بأرقام محددة
✨ تأكد من خلوها من الأخطاء

هل تريد مراجعة سيرتك الذاتية؟`;
    }
    
    // المقابلات
    if (lowerMessage.includes('مقابلة') || lowerMessage.includes('interview')) {
      return `💼 **التحضير للمقابلات**

المقابلة فرصتك لإثبات أنك الشخص المناسب! 

**قبل المقابلة:**
🔍 ابحث عن الشركة ومجال عملها
📋 راجع الوصف الوظيفي جيداً
👔 اختر ملابس مناسبة ومهنية
⏰ احضر قبل الموعد بـ 10-15 دقيقة

**أسئلة شائعة وإجاباتها:**
❓ "حدثني عن نفسك" - ركز على الخبرة المهنية
❓ "لماذا تريد هذه الوظيفة؟" - اربط مهاراتك بمتطلبات العمل
❓ "ما نقاط قوتك؟" - اذكر مهارات مطلوبة في الوظيفة
❓ "أين ترى نفسك خلال 5 سنوات؟" - أظهر طموحك المهني

**نصائح للنجاح:**
✅ حافظ على التواصل البصري
✅ اطرح أسئلة ذكية عن العمل
✅ أظهر حماسك للوظيفة
✅ اشكر المقابِل في النهاية

هل تريد محاكاة مقابلة تجريبية؟`;
    }
    
    // الراتب والتفاوض
    if (lowerMessage.includes('راتب') || lowerMessage.includes('salary') || lowerMessage.includes('تفاوض')) {
      return `💰 **الرواتب والتفاوض**

معرفة قيمتك في السوق مهم جداً! 

**متوسط الرواتب حسب المجال:**
💻 **تقنية المعلومات:** 8,000 - 25,000 ريال
🎨 **التصميم والإبداع:** 5,000 - 15,000 ريال
📊 **التسويق الرقمي:** 6,000 - 18,000 ريال
🏥 **الصحة:** 7,000 - 30,000 ريال
🏫 **التعليم:** 5,000 - 12,000 ريال

**نصائح للتفاوض:**
📈 ابحث عن متوسط الرواتب في مجالك
🎯 حدد نطاق راتب واقعي
💪 اذكر إنجازاتك وقيمتك المضافة
🤝 كن مرناً في التفاوض
📋 فكر في المزايا الأخرى (تأمين، إجازات، تدريب)

**متى تتفاوض؟**
✅ بعد الحصول على عرض العمل
✅ عند مراجعة الراتب السنوية
✅ عند الترقية أو تغيير المسؤوليات

ما مجال عملك لأعطيك معلومات أكثر دقة؟`;
    }
    
    // المهارات والتطوير
    if (lowerMessage.includes('مهارات') || lowerMessage.includes('تطوير') || lowerMessage.includes('تعلم') || lowerMessage.includes('دورات')) {
      return `🎯 **تطوير المهارات**

الاستثمار في نفسك هو أفضل استثمار! 

**المهارات الأكثر طلباً 2024:**
🔥 **التقنية:**
• البرمجة (Python, JavaScript, Java)
• الذكاء الاصطناعي وتعلم الآلة
• الأمن السيبراني
• تطوير التطبيقات المحمولة
• إدارة البيانات والتحليل

🔥 **الرقمية:**
• التسويق الرقمي ووسائل التواصل
• تحليل البيانات والإحصاء
• التجارة الإلكترونية
• إدارة المحتوى الرقمي

🔥 **الشخصية:**
• القيادة وإدارة الفرق
• التواصل الفعال
• حل المشكلات والتفكير النقدي
• إدارة الوقت والمشاريع

**منصات التعلم المجانية:**
📚 Coursera, edX, Khan Academy
🎥 YouTube التعليمية
📖 كتب ومقالات متخصصة
🏆 شهادات مهنية معتمدة

ما المهارة التي تريد تطويرها؟`;
    }
    
    // نصائح عامة للتوظيف
    if (lowerMessage.includes('نصائح') || lowerMessage.includes('tips') || lowerMessage.includes('إرشادات')) {
      return `💡 **نصائح ذهبية للتوظيف**

**للباحثين عن عمل:**
🎯 حدد أهدافك المهنية بوضوح
📝 اكتب سيرة ذاتية مخصصة لكل وظيفة
🌐 بناء حضور مهني على LinkedIn
📞 تواصل مع المهنيين في مجالك
📈 طور مهاراتك باستمرار
⏰ كن صبوراً ومثابراً

**أخطاء شائعة تجنبها:**
❌ إرسال نفس السيرة لكل الوظائف
❌ عدم البحث عن الشركة قبل المقابلة
❌ التأخير عن المواعيد
❌ عدم متابعة الطلبات
❌ إهمال الشبكة المهنية

**للشركات:**
✅ اكتب أوصاف وظيفية واضحة
✅ حدد المتطلبات الأساسية والمفضلة
✅ قدم معلومات عن ثقافة الشركة
✅ رد على المتقدمين في وقت معقول
✅ استخدم تقنيات التوظيف الحديثة

هل تريد نصائح محددة لموقفك؟`;
    }
    
    // المساعدة العامة
    if (lowerMessage.includes('مساعدة') || lowerMessage.includes('help') || lowerMessage.includes('ساعدني')) {
      return `🤝 **كيف يمكنني مساعدتك؟**

أنا مساعدك الذكي في رحلة التوظيف، يمكنني مساعدتك في:

🔍 **البحث عن الوظائف**
• العثور على وظائف مناسبة لمهاراتك
• نصائح للبحث الفعال
• تحليل متطلبات الوظائف

📄 **السيرة الذاتية**
• مراجعة وتحسين السيرة الذاتية
• كتابة خطاب التقديم
• تحليل مطابقة المهارات

💼 **المقابلات**
• التحضير للمقابلات
• محاكاة مقابلات تجريبية
• نصائح للإجابة على الأسئلة الصعبة

📊 **تحليل السوق**
• معرفة المهارات المطلوبة
• متوسط الرواتب في مجالك
• اتجاهات سوق العمل

🎯 **التطوير المهني**
• خطط التطوير الشخصي
• اقتراح دورات ومهارات
• بناء الشبكة المهنية

**اكتب لي ما تحتاج إليه وسأساعدك فوراً!** 😊`;
    }
    
    // أسئلة عن الشركات
    if (lowerMessage.includes('شركة') || lowerMessage.includes('شركات') || lowerMessage.includes('company')) {
      return `🏢 **معلومات عن الشركات**

**كيف تختار الشركة المناسبة؟**

🎯 **ابحث عن:**
• ثقافة الشركة وقيمها
• فرص النمو والتطوير
• توازن العمل والحياة
• سمعة الشركة في السوق
• المزايا والحوافز

🔍 **مصادر البحث:**
• الموقع الرسمي للشركة
• LinkedIn وملفات الموظفين
• مواقع تقييم الشركات (Glassdoor)
• الأخبار والمقالات
• التواصل مع موظفين حاليين

**أسئلة مهمة للمقابلة:**
❓ ما هي ثقافة العمل في الشركة؟
❓ ما فرص التطوير والترقية؟
❓ كيف تقيس الشركة الأداء؟
❓ ما التحديات التي تواجه الفريق؟

هل تريد معلومات عن شركة معينة؟`;
    }
    
    // العمل عن بُعد
    if (lowerMessage.includes('بعد') || lowerMessage.includes('remote') || lowerMessage.includes('منزل')) {
      return `🏠 **العمل عن بُعد**

العمل عن بُعد أصبح جزءاً مهماً من سوق العمل! 

**مزايا العمل عن بُعد:**
✅ مرونة في الوقت والمكان
✅ توفير وقت وتكلفة التنقل
✅ توازن أفضل بين العمل والحياة
✅ إمكانية العمل مع شركات عالمية
✅ بيئة عمل مريحة

**تحديات العمل عن بُعد:**
⚠️ الحاجة لانضباط ذاتي
⚠️ قلة التفاعل المباشر
⚠️ صعوبة الفصل بين العمل والحياة
⚠️ الحاجة لمهارات تقنية جيدة

**نصائح للنجاح:**
🎯 أنشئ مساحة عمل مخصصة
⏰ حدد ساعات عمل واضحة
📱 استخدم أدوات التواصل الفعالة
🤝 حافظ على التواصل مع الفريق
📈 طور مهارات إدارة الوقت

**مجالات مناسبة للعمل عن بُعد:**
💻 البرمجة وتطوير المواقع
🎨 التصميم الجرافيكي
📝 كتابة المحتوى والترجمة
📊 التسويق الرقمي
📞 خدمة العملاء

هل تبحث عن وظائف عن بُعد؟`;
    }
    
    // ريادة الأعمال
    if (lowerMessage.includes('ريادة') || lowerMessage.includes('مشروع') || lowerMessage.includes('startup') || lowerMessage.includes('أعمال')) {
      return `🚀 **ريادة الأعمال**

تفكر في بدء مشروعك الخاص؟ رائع! 

**خطوات البداية:**
1️⃣ **الفكرة والبحث**
• حدد مشكلة تريد حلها
• ادرس السوق والمنافسين
• تأكد من وجود طلب على منتجك

2️⃣ **التخطيط**
• اكتب خطة عمل واضحة
• حدد الجمهور المستهدف
• احسب التكاليف والإيرادات المتوقعة

3️⃣ **التمويل**
• رأس المال الشخصي
• المستثمرين الملائكيين
• صناديق الاستثمار الجريء
• القروض والمنح الحكومية

4️⃣ **التنفيذ**
• ابدأ بمنتج أولي (MVP)
• اختبر السوق واجمع التغذية الراجعة
• طور المنتج تدريجياً

**مهارات مهمة لرائد الأعمال:**
🎯 القيادة وإدارة الفرق
💡 الإبداع وحل المشكلات
📊 التحليل المالي
🤝 التواصل والتفاوض
📈 التسويق والمبيعات

**نصائح للنجاح:**
✅ ابدأ صغيراً وتوسع تدريجياً
✅ تعلم من الأخطاء والفشل
✅ بناء شبكة علاقات قوية
✅ ركز على العميل أولاً
✅ كن مرناً وقابلاً للتكيف

ما نوع المشروع الذي تفكر فيه؟`;
    }
    
    // التدريب والتطوير
    if (lowerMessage.includes('تدريب') || lowerMessage.includes('دورة') || lowerMessage.includes('شهادة')) {
      return `🎓 **التدريب والتطوير المهني**

الاستثمار في التعلم استثمار في مستقبلك! 

**أنواع التدريب:**
📚 **الدورات الأكاديمية**
• شهادات جامعية ودبلومات
• دورات متخصصة في مجالك
• برامج الماجستير المهني

💻 **التعلم الرقمي**
• منصات التعلم الإلكتروني
• دورات مجانية ومدفوعة
• ورش عمل افتراضية

🏢 **التدريب المؤسسي**
• برامج تدريب الشركات
• التدريب أثناء العمل
• برامج القيادة والإدارة

**منصات تعلم موصى بها:**
🌟 **عربية:**
• رواق، إدراك، نفهم
• أكاديمية حسوب
• معهد خبرات

🌟 **عالمية:**
• Coursera, edX, Udemy
• LinkedIn Learning
• Google Career Certificates

**كيف تختار الدورة المناسبة؟**
✅ حدد أهدافك المهنية
✅ ابحث عن محتوى محدث
✅ اقرأ تقييمات المتدربين
✅ تأكد من الشهادة المعتمدة
✅ قارن الأسعار والمدة

**نصائح للاستفادة القصوى:**
🎯 ضع جدولاً زمنياً للتعلم
📝 طبق ما تتعلمه عملياً
🤝 تفاعل مع المدربين والزملاء
📊 قيم تقدمك بانتظام

ما المجال الذي تريد التدرب فيه؟`;
    }
    
    // أسئلة تقنية
    if (lowerMessage.includes('برمجة') || lowerMessage.includes('تقنية') || lowerMessage.includes('programming') || lowerMessage.includes('تطوير')) {
      return `💻 **المجال التقني والبرمجة**

مجال التقنية مليء بالفرص الرائعة! 

**أهم لغات البرمجة 2024:**
🔥 **للمبتدئين:**
• Python - سهلة التعلم ومتعددة الاستخدامات
• JavaScript - أساسية لتطوير الويب
• Java - قوية ومطلوبة في الشركات

🔥 **للتطوير المتقدم:**
• React/Vue.js - لتطوير واجهات المستخدم
• Node.js - لتطوير الخوادم
• Flutter/React Native - للتطبيقات المحمولة

**مسارات مهنية تقنية:**
🎯 **تطوير الويب**
• Front-end Developer
• Back-end Developer  
• Full-stack Developer

🎯 **تطوير التطبيقات**
• Mobile App Developer
• Desktop App Developer

🎯 **البيانات والذكاء الاصطناعي**
• Data Scientist
• Machine Learning Engineer
• AI Specialist

**نصائح للمبرمجين:**
✅ ابدأ بمشاريع صغيرة
✅ ساهم في مشاريع مفتوحة المصدر
✅ بناء portfolio قوي
✅ تعلم أساسيات علوم الحاسوب
✅ مواكبة التطورات التقنية

**مصادر تعلم البرمجة:**
📚 FreeCodeCamp, Codecademy
🎥 قنوات YouTube التعليمية
📖 كتب البرمجة المتخصصة
🏆 تحديات البرمجة (HackerRank, LeetCode)

ما لغة البرمجة التي تريد تعلمها؟`;
    }
    
    // الأسئلة الشخصية والتحفيز
    if (lowerMessage.includes('محبط') || lowerMessage.includes('يأس') || lowerMessage.includes('صعب') || lowerMessage.includes('فشل')) {
      return `💪 **لا تستسلم - أنت أقوى مما تعتقد!**

البحث عن عمل قد يكون تحدياً، لكن كل "لا" تقربك من "نعم" المناسبة! 

**تذكر:**
🌟 كل شخص ناجح مر بفترات صعبة
🎯 الرفض لا يعني أنك غير مؤهل
💡 كل تجربة تعلمك شيئاً جديداً
🚀 الفرصة المناسبة في الطريق إليك

**استراتيجيات للتعامل مع الرفض:**
✅ اطلب تغذية راجعة من المقابلين
✅ حلل نقاط القوة والضعف
✅ طور المهارات المطلوبة
✅ وسع دائرة البحث
✅ استخدم شبكتك المهنية

**اعتن بصحتك النفسية:**
🧘 خذ فترات راحة من البحث
🏃 مارس الرياضة والأنشطة المفضلة
🤝 تحدث مع الأصدقاء والعائلة
📚 طور مهارات جديدة
🎯 ضع أهدافاً صغيرة قابلة للتحقيق

**قصص نجاح ملهمة:**
• ستيف جوبز رُفض من شركته الخاصة
• أوبرا وينفري طُردت من أول وظيفة إعلامية
• كولونيل ساندرز رُفضت وصفته 1009 مرة

**أنت لست وحدك في هذه الرحلة!** 
أنا هنا لدعمك ومساعدتك. ما الذي يقلقك تحديداً؟`;
    }
    
    // أسئلة عن المنصة
    if (lowerMessage.includes('منصة') || lowerMessage.includes('موقع') || lowerMessage.includes('platform')) {
      return `🌟 **Jobify**

مرحباً بك في منصتنا المتطورة! 

**ما يميز منصتنا:**
🤖 **الذكاء الاصطناعي**
• تحليل ذكي للسير الذاتية
• مطابقة دقيقة بين المهارات والوظائف
• توصيات شخصية للتطوير

🔍 **بحث متقدم**
• فلاتر ذكية للوظائف
• بحث بالمهارات والخبرة
• تنبيهات للوظائف الجديدة

💼 **للباحثين عن عمل**
• إنشاء ملف شخصي احترافي
• تتبع طلبات التوظيف
• نصائح مخصصة للتطوير

🏢 **للشركات**
• نشر الوظائف بسهولة
• أدوات فرز المتقدمين
• تحليلات متقدمة للتوظيف

**المطور:**
👨‍💻 **المهندس محمد علي**
📞 الهاتف: 783332292
📧 البريد: mohammedaljmr53@gemail.com

**تم تطوير المنصة بأحدث التقنيات:**
• ذكاء اصطناعي متطور
• واجهات مستخدم حديثة
• حماية عالية للبيانات
• تجربة مستخدم مميزة

كيف يمكنني مساعدتك في استخدام المنصة؟`;
    }
    
    // رد افتراضي ذكي
    const responses = [
      'شكراً لك على سؤالك! 😊 يمكنني مساعدتك في كل ما يتعلق بالتوظيف والمهن. هل يمكنك توضيح ما تحتاج إليه بالتحديد؟',
      'أقدر تواصلك معي! 🤝 أنا هنا لمساعدتك في رحلة البحث عن العمل. ما الموضوع الذي تريد التحدث عنه؟',
      'مرحباً! 👋 لم أفهم سؤالك تماماً، لكنني متأكد أنني أستطيع مساعدتك. هل يمكنك إعادة صياغة سؤالك؟',
      'أعتذر إذا لم أفهم قصدك بوضوح. 🤔 يمكنك سؤالي عن: الوظائف، السيرة الذاتية، المقابلات، الرواتب، أو أي موضوع متعلق بالتوظيف!'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // محاكاة مقابلة عمل
  async conductInterview(jobId, candidateData) {
    try {
      const questions = this.generateInterviewQuestions(jobId);
      return {
        success: true,
        interview: {
          id: `interview_${Date.now()}`,
          jobId: jobId,
          candidateId: candidateData.id,
          questions: questions,
          status: 'started',
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'خطأ في بدء المقابلة'
      };
    }
  }

  // توليد أسئلة المقابلة
  generateInterviewQuestions(jobId) {
    const generalQuestions = [
      'حدثني عن نفسك',
      'لماذا تريد العمل في هذه الشركة؟',
      'ما هي نقاط قوتك؟',
      'ما هي التحديات التي واجهتها في عملك السابق؟',
      'أين ترى نفسك خلال 5 سنوات؟'
    ];
    
    const technicalQuestions = [
      'ما هي التقنيات التي تجيدها؟',
      'كيف تتعامل مع المشاكل التقنية؟',
      'ما هو أصعب مشروع عملت عليه؟',
      'كيف تواكب التطورات التقنية؟'
    ];
    
    return {
      general: generalQuestions,
      technical: technicalQuestions,
      totalQuestions: generalQuestions.length + technicalQuestions.length
    };
  }

  // Generate job description
  async generateJobDescription(title, company) {
    try {
      const templates = {
        'مطور': `نحن في ${company} نبحث عن ${title} موهوب للانضمام إلى فريقنا المتنامي. ستكون مسؤولاً عن تطوير وصيانة التطبيقات والأنظمة، والعمل مع فريق متعدد التخصصات لتقديم حلول تقنية مبتكرة. نوفر بيئة عمل محفزة وفرص نمو مهني ممتازة.`,
        
        'مصمم': `يسعدنا في ${company} أن نعلن عن فرصة عمل ل${title} مبدع. ستقوم بتصميم واجهات مستخدم جذابة وتجارب مستخدم متميزة. نبحث عن شخص لديه عين فنية وفهم عميق لاحتياجات المستخدمين. انضم إلينا وكن جزءاً من فريق الإبداع.`,
        
        'مسوق': `تبحث ${company} عن ${title} محترف لقيادة استراتيجيات التسويق وتطوير العلامة التجارية. ستكون مسؤولاً عن تخطيط وتنفيذ الحملات التسويقية، وتحليل السوق، والتواصل مع العملاء. فرصة رائعة للنمو في بيئة ديناميكية.`,
        
        'محاسب': `نحن في ${company} نبحث عن ${title} دقيق وموثوق لإدارة الشؤون المالية والمحاسبية. ستقوم بإعداد التقارير المالية، ومتابعة الحسابات، وضمان الامتثال للمعايير المحاسبية. انضم إلى فريقنا المالي المحترف.`,
        
        'مبيعات': `تعلن ${company} عن حاجتها ل${title} نشيط ومتحمس لتحقيق أهداف المبيعات. ستكون مسؤولاً عن بناء علاقات مع العملاء، وتطوير الأعمال، وتحقيق الأهداف المحددة. نوفر عمولات جذابة وحوافز تحفيزية.`
      };

      // Find matching template
      let description = '';
      for (const [key, template] of Object.entries(templates)) {
        if (title.includes(key)) {
          description = template;
          break;
        }
      }

      // Default template if no match
      if (!description) {
        description = `تعلن ${company} عن فرصة عمل ممتازة لشغل منصب ${title}. نبحث عن مرشح مؤهل وذو خبرة للانضمام إلى فريقنا المتميز. ستكون مسؤولاً عن تنفيذ المهام المطلوبة بكفاءة عالية والمساهمة في تحقيق أهداف الشركة. نوفر بيئة عمل محفزة وفرص تطوير مهني متميزة.`;
      }

      return description;
    } catch (error) {
      console.error('Error generating job description:', error);
      return 'وصف الوظيفة سيتم إضافته قريباً...';
    }
  }

  // Suggest skills based on job title and description
  async suggestSkills(title, description) {
    try {
      const skillsDatabase = {
        'مطور': ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js', 'Python', 'Git', 'SQL'],
        'مطور ويب': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js', 'Angular', 'Bootstrap', 'jQuery'],
        'مطور تطبيقات': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Java', 'Dart', 'Firebase'],
        'مصمم': ['Photoshop', 'Illustrator', 'Figma', 'Adobe XD', 'Sketch', 'InDesign', 'UI/UX'],
        'مسوق': ['Google Ads', 'Facebook Ads', 'SEO', 'SEM', 'Analytics', 'Social Media', 'Content Marketing'],
        'محاسب': ['Excel', 'QuickBooks', 'SAP', 'المحاسبة المالية', 'التدقيق', 'التقارير المالية'],
        'مبيعات': ['CRM', 'التفاوض', 'خدمة العملاء', 'تطوير الأعمال', 'العروض التقديمية'],
        'موارد بشرية': ['التوظيف', 'إدارة الأداء', 'التدريب', 'قوانين العمل', 'HRIS'],
        'تسويق رقمي': ['Google Analytics', 'AdWords', 'Social Media', 'Email Marketing', 'SEO', 'Content Strategy'],
        'أمن سيبراني': ['Network Security', 'Penetration Testing', 'CISSP', 'Ethical Hacking', 'Firewall'],
        'ذكاء اصطناعي': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Science', 'Deep Learning'],
        'إدارة مشاريع': ['PMP', 'Agile', 'Scrum', 'JIRA', 'MS Project', 'Risk Management']
      };

      let suggestedSkills = [];

      // Find matching skills based on title
      for (const [key, skills] of Object.entries(skillsDatabase)) {
        if (title.toLowerCase().includes(key.toLowerCase())) {
          suggestedSkills = [...suggestedSkills, ...skills];
          break;
        }
      }

      // If no direct match, suggest general skills
      if (suggestedSkills.length === 0) {
        suggestedSkills = ['التواصل الفعال', 'العمل الجماعي', 'حل المشكلات', 'إدارة الوقت', 'التفكير النقدي'];
      }

      // Remove duplicates and limit to 8 skills
      return [...new Set(suggestedSkills)].slice(0, 8);
    } catch (error) {
      console.error('Error suggesting skills:', error);
      return ['التواصل الفعال', 'العمل الجماعي', 'حل المشكلات', 'إدارة الوقت'];
    }
  }

  // Generate personalized resume
  async generateResume(userData, template = 'تقني') {
    try {
      const templateData = this.knowledgeBase.resumeTemplates[template];
      
      return {
        template: template,
        sections: templateData.sections,
        colors: templateData.colors,
        fonts: templateData.fonts,
        content: {
          personalInfo: userData.personalInfo || {},
          summary: this.generateProfessionalSummary(userData),
          skills: userData.skills || [],
          experience: userData.experience || [],
          education: userData.education || [],
          projects: userData.projects || [],
          certifications: userData.certifications || []
        },
        recommendations: this.getResumeRecommendations(userData)
      };
    } catch (error) {
      console.error('Error generating resume:', error);
      return null;
    }
  }

  // Generate professional summary
  generateProfessionalSummary(userData) {
    const { experience, skills, field } = userData;
    const yearsExp = experience?.length || 0;
    
    const summaries = {
      'تقنية المعلومات': `مطور برمجيات متخصص بخبرة ${yearsExp} سنوات في تطوير التطبيقات والأنظمة. أتقن ${skills?.slice(0, 3).join('، ')} وأسعى لتقديم حلول تقنية مبتكرة تلبي احتياجات العمل.`,
      'التسويق': `مختص تسويق رقمي بخبرة ${yearsExp} سنوات في إدارة الحملات التسويقية وتطوير العلامة التجارية. خبرة واسعة في ${skills?.slice(0, 3).join('، ')}.`,
      'التصميم': `مصمم إبداعي بخبرة ${yearsExp} سنوات في تصميم الهوية البصرية وتجربة المستخدم. متخصص في ${skills?.slice(0, 3).join('، ')}.`
    };

    return summaries[field] || `محترف متخصص بخبرة ${yearsExp} سنوات في مجال العمل، يتمتع بمهارات قوية في ${skills?.slice(0, 3).join('، ')}.`;
  }

  // Get resume recommendations
  getResumeRecommendations(userData) {
    const recommendations = [];
    
    if (!userData.skills || userData.skills.length < 5) {
      recommendations.push('أضف المزيد من المهارات لتحسين فرصك');
    }
    
    if (!userData.projects || userData.projects.length === 0) {
      recommendations.push('أضف مشاريع عملت عليها لإظهار خبرتك العملية');
    }
    
    if (!userData.certifications || userData.certifications.length === 0) {
      recommendations.push('أضف الشهادات والدورات التدريبية');
    }
    
    return recommendations;
  }

  // Career path analysis
  async analyzeCareerPath(userData) {
    try {
      const { currentRole, skills, experience } = userData;
      const careerPath = this.knowledgeBase.careerPaths[currentRole];
      
      if (!careerPath) {
        return {
          currentLevel: currentRole,
          recommendations: ['حدد مجالك المهني بدقة أكبر للحصول على توجيه مخصص']
        };
      }
      
      return {
        currentLevel: currentRole,
        nextLevel: careerPath.nextLevel,
        requiredSkills: careerPath.requiredSkills,
        missingSkills: careerPath.requiredSkills.filter(skill => 
          !skills?.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
        ),
        timeframe: careerPath.timeframe,
        recommendations: careerPath.recommendations
      };
    } catch (error) {
      console.error('Error analyzing career path:', error);
      return null;
    }
  }

  // Salary estimation
  async estimateSalary(jobTitle, location, experience, skills) {
    try {
      // Find matching industry
      let baseSalary = 5000; // Default base salary
      
      for (const [industry, data] of Object.entries(this.knowledgeBase.industries)) {
        if (data.roles.some(role => jobTitle.includes(role))) {
          const [min, max] = data.salaryRange.split('-').map(Number);
          baseSalary = min + (max - min) * 0.5; // Average
          break;
        }
      }
      
      // Adjust for experience
      const experienceMultiplier = 1 + (experience * 0.1);
      
      // Adjust for location
      const locationMultipliers = {
        'الرياض': 1.2,
        'جدة': 1.1,
        'الدمام': 1.0,
        'مكة': 0.9,
        'المدينة': 0.9
      };
      
      const locationMultiplier = locationMultipliers[location] || 1.0;
      
      // Adjust for skills
      const skillsMultiplier = 1 + (skills.length * 0.05);
      
      const estimatedSalary = Math.round(baseSalary * experienceMultiplier * locationMultiplier * skillsMultiplier);
      
      return {
        estimated: estimatedSalary,
        range: {
          min: Math.round(estimatedSalary * 0.8),
          max: Math.round(estimatedSalary * 1.3)
        },
        factors: {
          experience: experienceMultiplier,
          location: locationMultiplier,
          skills: skillsMultiplier
        }
      };
    } catch (error) {
      console.error('Error estimating salary:', error);
      return null;
    }
  }

  // Job market analysis
  async analyzeJobMarket(field) {
    try {
      const industryData = this.knowledgeBase.industries[field];
      
      if (!industryData) {
        return {
          demand: 'متوسط',
          growth: 'مستقر',
          topSkills: ['التواصل الفعال', 'العمل الجماعي'],
          averageSalary: '5000-10000'
        };
      }
      
      return {
        demand: industryData.growth === 'عالي' ? 'عالي' : 'متوسط',
        growth: industryData.growth,
        topSkills: industryData.skills.slice(0, 5),
        averageSalary: industryData.salaryRange,
        topRoles: industryData.roles,
        recommendations: this.getMarketRecommendations(industryData)
      };
    } catch (error) {
      console.error('Error analyzing job market:', error);
      return null;
    }
  }

  // Get market recommendations
  getMarketRecommendations(industryData) {
    const recommendations = [];
    
    if (industryData.growth === 'عالي') {
      recommendations.push('مجال نمو سريع - فرص ممتازة للتطوير المهني');
    }
    
    recommendations.push(`تعلم ${industryData.skills.slice(0, 3).join('، ')} لتحسين فرصك`);
    recommendations.push('ابني شبكة علاقات مهنية قوية في هذا المجال');
    
    return recommendations;
  }

  // Video analysis (placeholder for future implementation)
  async analyzeVideo(videoPath) {
    try {
      // Placeholder for video analysis
      return {
        confidence: Math.random() * 40 + 60, // 60-100%
        communication: Math.random() * 30 + 70,
        professionalism: Math.random() * 25 + 75,
        recommendations: [
          'حافظ على التواصل البصري',
          'تحدث بوضوح وثقة',
          'استخدم لغة الجسد الإيجابية'
        ]
      };
    } catch (error) {
      console.error('Error analyzing video:', error);
      return null;
    }
  }

  // Image analysis (placeholder for future implementation)
  async analyzeImage(imagePath) {
    try {
      // Placeholder for image analysis
      return {
        professionalism: Math.random() * 30 + 70,
        quality: Math.random() * 25 + 75,
        recommendations: [
          'استخدم خلفية احترافية',
          'تأكد من الإضاءة الجيدة',
          'ارتدي ملابس مناسبة للمجال'
        ]
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      return null;
    }
  }

  // Smart job matching
  async smartJobMatch(userProfile, availableJobs) {
    try {
      const matches = [];
      
      for (const job of availableJobs) {
        const score = this.calculateAdvancedMatchScore(userProfile, job);
        
        matches.push({
          job: job,
          score: score,
          reasons: this.getMatchReasons(userProfile, job, score)
        });
      }
      
      // Sort by score descending
      return matches.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error in smart job matching:', error);
      return [];
    }
  }

  // Calculate advanced match score
  calculateAdvancedMatchScore(userProfile, job) {
    let score = 0;
    
    // Skills matching (40% weight)
    const skillsMatch = this.calculateSkillsMatch(userProfile.skills || [], job.requirements || []);
    score += skillsMatch * 0.4;
    
    // Experience matching (25% weight)
    const expMatch = this.calculateExperienceMatch(userProfile.experience || [], job.experience || 'مبتدئ');
    score += expMatch * 0.25;
    
    // Location matching (15% weight)
    const locationMatch = userProfile.location === job.location ? 100 : 50;
    score += locationMatch * 0.15;
    
    // Salary matching (10% weight)
    const salaryMatch = this.calculateSalaryMatch(userProfile.expectedSalary, job.salary);
    score += salaryMatch * 0.1;
    
    // Industry matching (10% weight)
    const industryMatch = userProfile.field === job.department ? 100 : 70;
    score += industryMatch * 0.1;
    
    return Math.round(score);
  }

  // Calculate skills match
  calculateSkillsMatch(userSkills, jobRequirements) {
    if (jobRequirements.length === 0) return 50;
    
    const matches = jobRequirements.filter(req =>
      userSkills.some(skill => 
        skill.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return (matches.length / jobRequirements.length) * 100;
  }

  // Calculate experience match
  calculateExperienceMatch(userExperience, jobExperience) {
    const userYears = userExperience.length;
    
    const experienceMap = {
      'مبتدئ': 0,
      'متوسط': 3,
      'متقدم': 7,
      'خبير': 10
    };
    
    const requiredYears = experienceMap[jobExperience] || 0;
    
    if (userYears >= requiredYears) return 100;
    if (userYears >= requiredYears * 0.7) return 80;
    if (userYears >= requiredYears * 0.5) return 60;
    return 40;
  }

  // Calculate salary match
  calculateSalaryMatch(expectedSalary, jobSalary) {
    if (!expectedSalary || !jobSalary) return 50;
    
    // Extract numbers from salary strings
    const expected = parseInt(expectedSalary.replace(/[^\d]/g, ''));
    const offered = parseInt(jobSalary.replace(/[^\d]/g, ''));
    
    if (offered >= expected) return 100;
    if (offered >= expected * 0.8) return 80;
    if (offered >= expected * 0.6) return 60;
    return 40;
  }

  // Get match reasons
  getMatchReasons(userProfile, job, score) {
    const reasons = [];
    
    if (score >= 80) {
      reasons.push('مطابقة ممتازة لملفك الشخصي');
    } else if (score >= 60) {
      reasons.push('مطابقة جيدة مع إمكانية التطوير');
    } else {
      reasons.push('قد تحتاج لتطوير بعض المهارات');
    }
    
    // Add specific reasons
    const skillsMatch = this.calculateSkillsMatch(userProfile.skills || [], job.requirements || []);
    if (skillsMatch >= 70) {
      reasons.push('مهاراتك تتطابق مع متطلبات الوظيفة');
    }
    
    if (userProfile.location === job.location) {
      reasons.push('الموقع مناسب لك');
    }
    
    return reasons;
  }
}

module.exports = new AIService();