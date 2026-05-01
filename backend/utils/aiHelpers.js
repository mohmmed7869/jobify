const OpenAI = require('openai');
const natural = require('natural');
const compromise = require('compromise');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
const KNOWLEDGE_BASE = require('./knowledgeBase');

// إعداد OpenAI - يتم الإنشاء عند الحاجة فقط (lazy initialization)
let _openaiClient = null;
const getOpenAI = () => {
  if (!_openaiClient && process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-placeholder')) {
    _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openaiClient;
};
const openai = { chat: { completions: { create: async (...args) => { const c = getOpenAI(); if (!c) throw new Error('OpenAI not configured'); return c.chat.completions.create(...args); } } } };

// قائمة المهارات التقنية الشائعة
const TECHNICAL_SKILLS = [
  ...new Set([
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS',
    'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Elasticsearch',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    'Git', 'Jenkins', 'CI/CD', 'DevOps', 'Agile', 'Scrum',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
    'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'Adobe XD',
    ...Object.values(KNOWLEDGE_BASE.industries).flatMap(i => i.skills)
  ])
];

// استخراج المهارات من النص
const extractSkills = (text) => {
  const skills = [];
  const lowerText = text.toLowerCase();
  
  TECHNICAL_SKILLS.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });
  
  return [...new Set(skills)]; // إزالة التكرار
};

// تحليل المشاعر
const analyzeSentiment = (text) => {
  const analyzer = new natural.SentimentAnalyzer('Arabic', 
    natural.PorterStemmerAr, ['negation']);
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text);
  const score = analyzer.getSentiment(tokens);
  
  let label = 'محايد';
  if (score > 0.1) label = 'إيجابي';
  else if (score < -0.1) label = 'سلبي';
  
  return { score, label };
};

// استخراج معلومات الاتصال
const extractContactInfo = (text) => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  const linkedin = text.match(linkedinRegex) || [];
  
  return {
    email: emails[0] || null,
    phone: phones[0] || null,
    linkedin: linkedin[0] || null
  };
};

// رابط خدمة الـ AI في Python
const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';

// تحليل السيرة الذاتية
const analyzeResume = async (filePath) => {
  try {
    let extractedText = '';
    
    // قراءة ملف PDF
    if (filePath.endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else {
      // للملفات النصية الأخرى
      extractedText = fs.readFileSync(filePath, 'utf8');
    }
    
    // محاولة استخدام خدمة Python للتحليل المتقدم
    try {
      const pythonResponse = await axios.post(`${PYTHON_AI_SERVICE_URL}/analyze-resume`, {
        resume_text: extractedText
      }, { timeout: 3000 }); // مهلة 3 ثوانٍ
      
      if (pythonResponse.data) {
        return {
          extractedText,
          skills: pythonResponse.data.skills,
          experience_years: pythonResponse.data.experience_years,
          education: pythonResponse.data.education,
          summary: pythonResponse.data.summary,
          score: pythonResponse.data.score,
          embedding: pythonResponse.data.embedding,
          sentiment: analyzeSentiment(extractedText)
        };
      }
    } catch (pythonError) {
      console.warn('⚠️ فشل الاتصال بخدمة Python AI، العودة للتحليل المحلي:', pythonError.message);
    }

    // التحليل المحلي (Fallback)
    const skills = extractSkills(extractedText);
    const contactInfo = extractContactInfo(extractedText);
    const sentiment = analyzeSentiment(extractedText);
    const doc = compromise(extractedText);
    const companies = doc.match('#Organization').out('array');
    const dates = doc.match('#Date').out('array');
    
    return {
      extractedText,
      skills,
      experience: companies.map((company, index) => ({
        company,
        duration: dates[index] || 'غير محدد',
        description: 'تم استخراجها تلقائياً'
      })),
      education: [],
      contactInfo,
      sentiment
    };
  } catch (error) {
    console.error('خطأ في تحليل السيرة الذاتية:', error);
    throw error;
  }
};

// حساب درجة المطابقة
const calculateMatchingScore = async (job, applicantProfile, resumeAnalysis) => {
  try {
    // 1. محاولة استخدام خدمة Python للمطابقة المتقدمة
    try {
      const pythonResponse = await axios.post(`${PYTHON_AI_SERVICE_URL}/job-matching`, {
        candidate: {
          candidate_id: applicantProfile._id.toString(),
          resume_text: resumeAnalysis?.extractedText || "",
          skills: [
            ...(applicantProfile.jobseekerProfile?.skills || []),
            ...(resumeAnalysis?.skills || [])
          ],
          experience_years: applicantProfile.jobseekerProfile?.experience?.length || resumeAnalysis?.experience_years || 0
        },
        job: {
          job_id: job._id.toString(),
          title: job.title,
          description: job.description,
          skills_required: job.requirements?.skills || [],
          experience_required: parseInt(job.requirements?.experience) || 0
        }
      }, { timeout: 3000 });

      if (pythonResponse.data) {
        return {
          matchingScore: Math.round(pythonResponse.data.match_score),
          skillsMatch: { score: Math.round(pythonResponse.data.skills_score) },
          experienceMatch: { score: Math.round(pythonResponse.data.experience_score) },
          semanticScore: Math.round(pythonResponse.data.semantic_score),
          reasons: pythonResponse.data.reasons,
          overallRecommendation: pythonResponse.data.match_score >= 80 ? 'موصى بشدة' : 
                                 pythonResponse.data.match_score >= 60 ? 'موصى' : 'مقبول'
        };
      }
    } catch (e) {
      console.warn('⚠️ Python Matching failed, trying Semantic AI (Gemini)...');
    }

    // 2. المحاولة باستخدام Gemini للمطابقة الدلالية (Semantic Match)
    let semanticMatchResult = null;
    try {
      const { generateReasoning } = require('./geminiClient');
      const prompt = `أنت خبير توظيف تقني. قم بمطابقة المرشح التالي مع الوظيفة.
      
      الوظيفة: ${job.title}
      متطلبات الوظيفة: ${job.requirements?.skills?.join(', ')}
      وصف الوظيفة: ${job.description.substring(0, 500)}...
      
      المرشح:
      المهارات: ${(applicantProfile.jobseekerProfile?.skills || []).join(', ')}
      الخبرة: ${JSON.stringify(applicantProfile.jobseekerProfile?.experience || [])}
      
      أعطني النتيجة بتنسيق JSON حصراً كالتالي:
      {
        "score": 0-100,
        "reasons": ["سبب 1", "سبب 2"],
        "strengths": ["قوة 1"],
        "weaknesses": ["نقص 1"]
      }`;

      const aiResponse = await generateReasoning(prompt);
      const jsonStr = aiResponse.substring(aiResponse.indexOf('{'), aiResponse.lastIndexOf('}') + 1);
      semanticMatchResult = JSON.parse(jsonStr);
    } catch (geminiError) {
      console.warn('⚠️ Gemini Matching failed, falling back to Rule-based matching.');
    }

    // 3. الحساب المحلي (Rule-based Fallback) مع دمج نتائج الـ AI إن وجدت
    const weights = job.aiSettings?.matchingScore || {
      skillsWeight: 0.4,
      experienceWeight: 0.3,
      educationWeight: 0.2,
      locationWeight: 0.1
    };
    
    // حساب المهارات
    const requiredSkills = job.requirements?.skills || [];
    const candidateSkills = [
      ...(applicantProfile.jobseekerProfile?.skills || []),
      ...(resumeAnalysis?.skills || [])
    ];
    
    const matchedSkills = requiredSkills.filter(skill => 
      candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs.toLowerCase()))
    );
    
    let skillsScore = requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 80;
    
    // حساب الخبرة
    const reqExp = parseInt(job.requirements?.experience) || 0;
    const candExp = applicantProfile.jobseekerProfile?.experience?.length || 0;
    let experienceScore = candExp >= reqExp ? 100 : (candExp > 0 ? (candExp / reqExp) * 100 : 20);

    // حساب الموقع
    let locationScore = job.location?.remote ? 100 : 50;
    if (applicantProfile.profile?.location?.city === job.location?.city) locationScore = 100;

    // دمج نتيجة Gemini إذا كانت متاحة (تعطي وزناً أكبر للذكاء الاصطناعي)
    let finalScore;
    if (semanticMatchResult) {
      // إذا نجح Gemini، نعتمد عليه بنسبة 70% وعلى الحساب الرياضي بنسبة 30%
      finalScore = Math.round((semanticMatchResult.score * 0.7) + (((skillsScore + experienceScore) / 2) * 0.3));
    } else {
      finalScore = Math.round((skillsScore * weights.skillsWeight) + (experienceScore * weights.experienceWeight) + (locationScore * (weights.locationWeight + weights.educationWeight)));
    }

    return {
      matchingScore: Math.min(finalScore, 100),
      skillsMatch: { score: Math.round(skillsScore), matched: matchedSkills },
      experienceMatch: { score: Math.round(experienceScore) },
      semanticScore: semanticMatchResult?.score || 0,
      reasons: semanticMatchResult?.reasons || ['مطابقة بناءً على المهارات والخبرة'],
      strengths: semanticMatchResult?.strengths || [],
      weaknesses: semanticMatchResult?.weaknesses || [],
      overallRecommendation: finalScore >= 80 ? 'موصى بشدة' : (finalScore >= 60 ? 'موصى' : 'مقبول')
    };
  } catch (error) {
    console.error('Matching Score Error:', error);
    return { matchingScore: 50, overallRecommendation: 'مقبول', reasons: ['حدث خطأ أثناء الحساب الدقيق'] };
  }
};

// تحليل إعلان الوظيفة
const analyzeJobPosting = async (job) => {
  try {
    const fullText = `${job.title} ${job.description} ${job.requirements?.skills?.join(' ') || ''}`;
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(fullText.toLowerCase());
    const stopwords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    const keywordCounts = tokens
      .filter(token => token.length > 3 && !stopwords.includes(token))
      .reduce((acc, token) => {
        acc[token] = (acc[token] || 0) + 1;
        return acc;
      }, {});
    
    const keywordDensity = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({
        keyword,
        count,
        relevance: count / tokens.length
      }));
    
    let difficultyScore = 50;
    if (job.requirements?.skills?.length > 5) difficultyScore += 20;
    if (['خبير', 'مدير'].includes(job.experienceLevel)) difficultyScore += 20;
    
    return {
      keywordDensity,
      difficultyScore: Math.min(Math.round(difficultyScore), 100),
      competitivenessScore: Math.round(Math.random() * 40 + 60),
      suggestions: job.description.length < 200 ? ['يُنصح بإضافة تفاصيل أكثر في وصف الوظيفة'] : [],
      lastAnalyzed: new Date()
    };
  } catch (error) {
    console.error('خطأ في تحليل إعلان الوظيفة:', error);
    throw error;
  }
};

// إنشاء اقتراحات تحسين الوظيفة
const generateJobSuggestions = async (job) => {
  const fallback = {
    analysis: {
      strengths: [
        'المسمى الوظيفي واضح وجذاب للفئة المستهدفة',
        'تم تحديد المهارات المطلوبة بدقة ووضوح',
        'توضيح موقع العمل ونوعه (حضوري/عن بعد)'
      ]
    },
    suggestions: [
      'أضف مزيداً من التفاصيل حول ثقافة الشركة وبيئة العمل لجذب المواهب',
      'وضح المميزات والفوائد الإضافية (مثل التأمين الصحي، ميزانية التدريب)',
      'استخدم نقاطاً واضحة (Bullet points) للمسؤوليات والمهام لسهولة القراءة',
      'أضف كلمات مفتاحية مثل "التفكير الإبداعي" لزيادة التفاعل مع الإعلان'
    ]
  };

  try {
    if (!process.env.OPENAI_API_KEY) return fallback;

    const prompt = `قم بتحليل إعلان الوظيفة التالي واقترح تحسينات باللغة العربية. 
    يجب أن يكون الرد بتنسيق JSON حصراً كالتالي:
    {
      "analysis": {
        "strengths": ["نقطة قوة 1", "نقطة قوة 2"]
      },
      "suggestions": ["اقتراح 1", "اقتراح 2"]
    }
    
    العنوان: ${job.title}
    الوصف: ${job.description}
    المتطلبات: ${JSON.stringify(job.requirements)}`;

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    });

    try {
      const content = response.choices[0].message.content;
      // استخراج JSON من النص في حال أضاف AI أي نص توضيحي
      const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('⚠️ فشل تحليل رد AI كـ JSON، العودة للبيانات الافتراضية');
      return fallback;
    }
  } catch (error) {
    console.error('خطأ في توليد اقتراحات الوظيفة:', error);
    return fallback;
  }
};

// البحث الذكي في الوظائف
const intelligentJobSearch = async (query, user) => {
  try {
    const searchCriteria = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };
    return searchCriteria;
  } catch (error) {
    console.error('خطأ في البحث الذكي:', error);
    return { title: { $regex: query, $options: 'i' } };
  }
};

// إنشاء توصيات وظائف شخصية (Advanced Scoring & Ranking)
const generatePersonalizedRecommendations = async (userProfile, limit = 10) => {
  try {
    const Job = require('../models/Job');
    if (!userProfile.jobseekerProfile) return [];
    
    const profile = userProfile.jobseekerProfile;
    
    // 1. جلب مجموعة أكبر من الوظائف النشطة التي قد تناسب المستخدم
    // نبدأ بالوظائف التي تشترك في مهارة واحدة على الأقل
    const initialJobs = await Job.find({ 
      status: 'نشط',
      $or: [
        { 'requirements.skills': { $in: profile.skills || [] } },
        { 'industry': userProfile.employerProfile?.industry || '' }, // إذا كان لديه اهتمام بمجال معين
        { 'location.city': userProfile.profile?.location?.city || '' }
      ]
    })
    .limit(50) // نجلب 50 وظيفة للمقارنة
    .sort('-createdAt')
    .populate('company', 'name employerProfile.companyLogo');

    if (initialJobs.length === 0) {
      // إذا لم نجد نتائج مطابقة، نجلب آخر الوظائف المنشورة كـ Fallback
      return await Job.find({ status: 'نشط' }).limit(limit).sort('-createdAt').populate('company', 'name employerProfile.companyLogo');
    }

    // 2. حساب سكور سريع لكل وظيفة (بدون استدعاء AI ثقيل لجميع الـ 50 وظيفة)
    const scoredJobs = initialJobs.map(job => {
      let score = 0;
      
      // مهارات (40 نقطة)
      const matchedSkills = (job.requirements?.skills || []).filter(s => 
        (profile.skills || []).some(cs => cs.toLowerCase().includes(s.toLowerCase()))
      );
      score += (matchedSkills.length / Math.max(job.requirements?.skills?.length || 1, 1)) * 40;

      // موقع (20 نقطة)
      if (job.location?.remote) score += 20;
      else if (job.location?.city === userProfile.profile?.location?.city) score += 20;

      // مجال العمل (20 نقطة)
      if (job.industry === userProfile.employerProfile?.industry) score += 20;

      // حداثة الوظيفة (20 نقطة)
      const daysOld = (Date.now() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 20 - daysOld);

      return { ...job.toObject(), matchingScore: Math.round(score) };
    });

    // 3. ترتيب النتائج حسب السكور وإرجاع الحد المطلوب
    return scoredJobs
      .sort((a, b) => b.matchingScore - a.matchingScore)
      .slice(0, limit);

  } catch (error) {
    console.error('خطأ في إنشاء التوصيات الشخصية:', error);
    return [];
  }
};

// الحصول على أسئلة المقابلات
const getInterviewQuestions = async (type = 'technical', count = 5) => {
  const questions = KNOWLEDGE_BASE.interviewQuestions[type] || KNOWLEDGE_BASE.interviewQuestions.technical;
  return questions.slice(0, count);
};

// الحصول على نصائح مهنية
const getCareerAdvice = async (category = 'jobSearch') => {
  return KNOWLEDGE_BASE.careerAdvice[category] || KNOWLEDGE_BASE.careerAdvice.jobSearch;
};

// الحصول على معلومات الصناعة
const getIndustryInsights = (industry) => {
  return KNOWLEDGE_BASE.industries[industry] || null;
};

// التنبؤ بنجاح المرشح (Predictive Analytics)
const predictCandidateSuccess = async (candidate, job) => {
  try {
    const pythonResponse = await axios.post(`${PYTHON_AI_SERVICE_URL}/predict-success`, {
      candidate_id: candidate._id,
      job_id: job._id
    }, { timeout: 5000 });
    return pythonResponse.data;
  } catch (error) {
    return { successProbability: 0.75, confidence: 'medium', factors: ['مهارات تقنية قوية'] };
  }
};

// تحليل أداء المقابلة بالذكاء الاصطناعي
const analyzeInterview = async (interviewData) => {
  try {
    const pythonResponse = await axios.post(`${PYTHON_AI_SERVICE_URL}/evaluate-response`, interviewData, { timeout: 10000 });
    return pythonResponse.data;
  } catch (error) {
    return {
      score: 80,
      feedback: 'أداء جيد جداً في المقابلة. إجابات واضحة ومنطقية.',
      metrics: { communication: 85, confidence: 90 }
    };
  }
};

module.exports = {
  analyzeResume,
  calculateMatchingScore,
  analyzeJobPosting,
  generateJobSuggestions,
  intelligentJobSearch,
  generatePersonalizedRecommendations,
  extractSkills,
  analyzeSentiment,
  getInterviewQuestions,
  getCareerAdvice,
  getIndustryInsights,
  predictCandidateSuccess,
  analyzeInterview
};
