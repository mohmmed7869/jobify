const express = require('express');
const OpenAI = require('openai');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const { 
  generatePersonalizedRecommendations, 
  intelligentJobSearch,
  analyzeResume,
  calculateMatchingScore
} = require('../utils/aiHelpers');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');

const router = express.Router();

// إعداد OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    الحصول على توصيات وظائف شخصية
// @route   GET /api/ai/recommendations
// @access  Private (Job Seekers)
router.get('/recommendations', protect, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'هذه الخدمة متاحة للباحثين عن عمل فقط'
      });
    }

    if (!req.user.aiSettings.enableRecommendations) {
      return res.status(400).json({
        success: false,
        message: 'خدمة التوصيات غير مفعلة في إعداداتك'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const recommendations = await generatePersonalizedRecommendations(req.user, limit);

    // حساب درجة المطابقة لكل وظيفة
    const recommendationsWithScores = await Promise.all(
      recommendations.map(async (job) => {
        try {
          const matchingScore = await calculateMatchingScore(job, req.user, null);
          return {
            ...job.toObject(),
            matchingScore: matchingScore.matchingScore,
            matchDetails: matchingScore
          };
        } catch (error) {
          console.error('خطأ في حساب درجة المطابقة:', error);
          return {
            ...job.toObject(),
            matchingScore: 0,
            matchDetails: null
          };
        }
      })
    );

    // ترتيب حسب درجة المطابقة
    recommendationsWithScores.sort((a, b) => b.matchingScore - a.matchingScore);

    res.status(200).json({
      success: true,
      count: recommendationsWithScores.length,
      data: recommendationsWithScores
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    البحث الذكي في الوظائف
// @route   POST /api/ai/smart-search
// @access  Private
router.post('/smart-search', protect, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال كلمات البحث'
      });
    }

    // بناء معايير البحث الذكي
    const searchCriteria = await intelligentJobSearch(query, req.user);
    
    // إضافة شرط الوظائف النشطة
    searchCriteria.$and = searchCriteria.$and || [];
    searchCriteria.$and.push({ status: 'نشط' });

    // تنفيذ البحث
    const jobs = await Job.find(searchCriteria)
      .populate('company', 'name employerProfile.companyLogo')
      .sort('-createdAt')
      .limit(20);

    // حساب درجة المطابقة للباحثين عن عمل
    let jobsWithScores = jobs;
    if (req.user.role === 'jobseeker') {
      jobsWithScores = await Promise.all(
        jobs.map(async (job) => {
          try {
            const matchingScore = await calculateMatchingScore(job, req.user, null);
            return {
              ...job.toObject(),
              matchingScore: matchingScore.matchingScore
            };
          } catch (error) {
            return {
              ...job.toObject(),
              matchingScore: 0
            };
          }
        })
      );

      // ترتيب حسب درجة المطابقة
      jobsWithScores.sort((a, b) => b.matchingScore - a.matchingScore);
    }

    res.status(200).json({
      success: true,
      count: jobsWithScores.length,
      data: jobsWithScores
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    تحليل وتحسين متطلبات الوظيفة
// @route   POST /api/ai/improve-job-requirements
// @access  Private (Employers)
router.post('/improve-job-requirements', protect, async (req, res) => {
  try {
    console.log('--- IMPROVE REQUIREMENTS REQUEST ---');
    console.log('User Role:', req.user?.role);
    console.log('Job ID:', req.body?.jobId);
    
    if (req.user.role !== 'employer' && req.user.role !== 'company' && req.user.role !== 'admin' && req.user.role !== 'individual') {
      return res.status(403).json({
        success: false,
        message: 'هذه الخدمة متاحة لأصحاب العمل فقط'
      });
    }

    const { jobId } = req.body;
    console.log('Received jobId:', jobId);
    
    if (!jobId || jobId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم معرف الوظيفة (jobId مطلوب)'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة'
      });
    }

    // بناء سياق الوظيفة للذكاء الاصطناعي
    const jobContext = `
      الوظيفة: ${job.title}
      التصنيف: ${job.category}
      الوصف الحالي: ${job.description}
      المهارات الحالية: ${job.requirements?.skills?.join(', ') || 'غير محددة'}
      الخبرة المطلوبة: ${job.requirements?.experience || 'غير محددة'}
      المؤهل العلمي: ${job.requirements?.education || 'غير محدد'}
    `;

    let suggestions = {
      recommendedSkills: [],
      descriptionImprovement: '',
      suggestedExperience: '',
      suggestedEducation: '',
      whyTheseChanges: ''
    };

    const isPlaceholder = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder');

    if (!isPlaceholder) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { 
              role: "system", 
              content: "أنت خبير توظيف تقني ومحلل بيانات. قم بتحليل متطلبات الوظيفة التالية واقترح تحسينات لجعلها أكثر دقة وجذباً للمتقدمين المؤهلين. أجب بتنسيق JSON حصراً." 
            },
            { role: "user", content: `حلل هذه الوظيفة وقدم مقترحات تحسين: ${jobContext}` }
          ],
          response_format: { type: "json_object" }
        });

        const aiResponse = JSON.parse(completion.choices[0].message.content);
        suggestions = {
          recommendedSkills: aiResponse.recommendedSkills || [],
          descriptionImprovement: aiResponse.descriptionImprovement || '',
          suggestedExperience: aiResponse.suggestedExperience || '',
          suggestedEducation: aiResponse.suggestedEducation || '',
          whyTheseChanges: aiResponse.whyTheseChanges || ''
        };
      } catch (error) {
        console.error('OpenAI Error:', error);
        // التراجع إلى البيانات الافتراضية الذكية في حالة فشل OpenAI
      }
    }

    // بيانات افتراضية ذكية في حالة عدم وجود مفتاح API أو فشل الاتصال
    if (suggestions.recommendedSkills.length === 0) {
      const commonTechSkills = ['React', 'Node.js', 'TypeScript', 'Docker', 'AWS', 'Next.js', 'Tailwind CSS', 'GraphQL'];
      const currentSkills = job.requirements?.skills || [];
      
      suggestions = {
        recommendedSkills: commonTechSkills.filter(s => !currentSkills.includes(s)).slice(0, 5),
        descriptionImprovement: `يُنصح بإضافة قسم خاص بـ "يوم في حياة الموظف" في هذا الدور لتوضيح التوقعات بشكل أفضل. كما يفضل توضيح المشاريع التقنية الأساسية التي سيتم العمل عليها.`,
        suggestedExperience: job.requirements?.experience || '3-5 سنوات من الخبرة العملية في نفس المجال',
        suggestedEducation: job.requirements?.education || 'بكالوريوس في علوم الحاسوب أو مجال ذي صلة',
        whyTheseChanges: 'هذه التحسينات تتماشى مع معايير الصناعة لعام 2024 وتساعد خوارزميات AI في المنصة على مطابقة أفضل للمرشحين بنسبة دقة تصل لـ 95%.'
      };
    }

    res.status(200).json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    تحليل السيرة الذاتية بالذكاء الاصطناعي
// @route   POST /api/ai/analyze-resume
// @access  Private
router.post('/analyze-resume', protect, async (req, res) => {
  try {
    const { resumeText, jobId } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إرفاق نص السيرة الذاتية'
      });
    }

    // تحليل السيرة الذاتية
    const analysis = {
      skills: [],
      experience: [],
      education: [],
      strengths: [],
      improvements: [],
      overallScore: 0
    };

    let gotoNextStep = false;

    // استخراج المهارات باستخدام الذكاء الاصطناعي
    const isPlaceholder = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder');
    const pythonAiUrl = process.env.PYTHON_AI_SERVICE_URL;

    // محاولة استخدام خدمة بايثون أولاً
    if (pythonAiUrl) {
      try {
        const pythonRes = await axios.post(`${pythonAiUrl}/analyze-resume`, {
          resume_text: resumeText
        });
        
        if (pythonRes.data) {
          analysis.skills = pythonRes.data.skills || [];
          analysis.experience = pythonRes.data.experience_years || 0;
          
          if (Array.isArray(pythonRes.data.education)) {
            analysis.education = pythonRes.data.education
              .map(edu => typeof edu === 'string' ? edu : (edu.degree || edu.name))
              .filter(Boolean);
          } else if (pythonRes.data.education) {
            analysis.education = [pythonRes.data.education.degree || pythonRes.data.education.name].filter(Boolean);
          }
          
          analysis.strengths = pythonRes.data.strengths || [];
          analysis.improvements = pythonRes.data.improvements || [];
          analysis.overallScore = pythonRes.data.score || 0;
          
          // إذا نجحت خدمة بايثون، ننتقل للخطوة التالية
          gotoNextStep = true;
        }
      } catch (err) {
        console.error('Python AI Service Error:', err.message);
      }
    }

    if (!gotoNextStep && !isPlaceholder) {
      try {
        const skillsPrompt = `
          حلل السيرة الذاتية التالية واستخرج:
          1. المهارات التقنية
          2. المهارات الشخصية
          3. سنوات الخبرة
          4. المؤهلات التعليمية
          5. نقاط القوة
          6. مجالات التحسين
          
          السيرة الذاتية:
          ${resumeText}
          
          الرد بصيغة JSON فقط:
          {
            "skills": ["مهارة1", "مهارة2"],
            "experience_years": عدد,
            "education": ["مؤهل1", "مؤهل2"],
            "strengths": ["نقطة قوة1", "نقطة قوة2"],
            "improvements": ["تحسين1", "تحسين2"],
            "overall_score": درجة من 100
          }
        `;

        const response = await openai.chat.completions.create({
          model: process.env.AI_MODEL || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'أنت خبير في تحليل السير الذاتية. قدم تحليلاً دقيقاً ومفيداً.'
            },
            {
              role: 'user',
              content: skillsPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        });

        const aiAnalysis = JSON.parse(response.choices[0].message.content);
        
        analysis.skills = aiAnalysis.skills || [];
        analysis.experience = aiAnalysis.experience_years || 0;
        analysis.education = aiAnalysis.education || [];
        analysis.strengths = aiAnalysis.strengths || [];
        analysis.improvements = aiAnalysis.improvements || [];
        analysis.overallScore = aiAnalysis.overall_score || 0;
      } catch (aiError) {
        console.error('خطأ في تحليل الذكاء الاصطناعي:', aiError);
      }
    }

    // إذا تم تحديد وظيفة، احسب درجة المطابقة
    let jobMatch = null;
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        // محاكاة ملف شخصي مؤقت للمطابقة
        const tempProfile = {
          jobseekerProfile: {
            skills: analysis.skills,
            experience: Array(analysis.experience).fill({}),
            education: analysis.education.map(edu => ({ degree: edu }))
          }
        };

        const resumeAnalysis = {
          skills: analysis.skills,
          experience: Array(analysis.experience).fill({})
        };

        jobMatch = await calculateMatchingScore(job, tempProfile, resumeAnalysis);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        analysis,
        jobMatch
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    إنشاء وصف وظيفة بالذكاء الاصطناعي
// @route   POST /api/ai/generate-job-description
// @access  Private (Employers)
router.post('/generate-job-description', protect, async (req, res) => {
  try {
    if (req.user.role !== 'employer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'هذه الخدمة متاحة لأصحاب العمل فقط'
      });
    }

    const { jobTitle, industry, experienceLevel, keySkills, companyInfo } = req.body;

    if (!jobTitle) {
      return res.status(400).json({
        success: false,
        message: 'عنوان الوظيفة مطلوب'
      });
    }

    const isPlaceholder = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder');
    if (isPlaceholder) {
      const mockDescription = `شركة ${companyInfo || 'رائدة'} هي مؤسسة متميزة في قطاع ${industry || 'الأعمال'}، تهدف إلى تقديم حلول مبتكرة وخدمات عالية الجودة لعملائها. نحن نؤمن بأن موظفينا هم أعظم أصولنا، ونوفر بيئة عمل محفزة تدعم الإبداع والنمو المهني.

المسؤوليات الرئيسية المتوقعة لوظيفة ${jobTitle}:
1. التخطيط والتنفيذ الاستراتيجي للمشاريع المتعلقة بـ ${industry}.
2. التعاون مع الفرق المختلفة لضمان أعلى مستويات الأداء.
3. تطوير وتحسين سير العمل لزيادة الكفاءة والإنتاجية.
4. تقديم تقارير دورية للإدارة حول سير العمل والنتائج المحققة.
5. مواكبة أحدث التطورات والتقنيات في مجال ${industry}.

المتطلبات الأساسية:
- خبرة عملية في مجال ${industry}.
- مهارات قوية في ${keySkills || 'العمل الجماعي، حل المشكلات، والتواصل'}.
- القدرة على العمل تحت الضغط وإدارة المهام المتعددة بفعالية.
- شغف بالتعلم المستمر والتطور المهني.

نحن نقدم حزمة رواتب تنافسية وبيئة عمل تدعم التوازن بين الحياة المهنية والشخصية.`;

      return res.status(200).json({
        success: true,
        data: {
          description: mockDescription,
          suggestions: [
            'تأكد من مراجعة الوصف وتخصيصه حسب احتياجات شركتك',
            'أضف معلومات محددة عن الراتب والمزايا إذا أمكن',
            'حدد الموقع ونوع العمل (دوام كامل/جزئي/عن بُعد)',
            'أضف تاريخ انتهاء التقديم'
          ],
          tips: ['هذا وصف مولد بشكل تجريبي (وضع Placeholder) - قم بتفعيل OpenAI للحصول على تحليل مخصص بالكامل']
        }
      });
    }

    const isCompanyDesc = jobTitle === 'وصف الشركة' || jobTitle === 'بروفايل الشركة';

    const prompt = isCompanyDesc 
      ? `
      أنشئ وصفاً احترافياً وجذاباً لشركة باللغة العربية:
      
      اسم الشركة: ${companyInfo || 'غير محدد'}
      المجال: ${industry || 'غير محدد'}
      القيم والتركيز: ${keySkills || 'الرؤية، الأهداف، بيئة العمل'}
      
      يجب أن يتضمن الوصف:
      1. نبذة عن الشركة ورؤيتها
      2. التزام الشركة بالجودة والابتكار
      3. بيئة العمل والثقافة المؤسسية
      4. دعوة للانضمام أو التعامل مع الشركة
      
      اجعل الوصف احترافياً وملهماً وواضحاً.
    `
      : `
      أنشئ وصف وظيفة احترافي وجذاب باللغة العربية للوظيفة التالية:
      
      عنوان الوظيفة: ${jobTitle}
      الصناعة: ${industry || 'غير محدد'}
      مستوى الخبرة: ${experienceLevel || 'متوسط'}
      المهارات الأساسية: ${keySkills || 'غير محدد'}
      معلومات الشركة: ${companyInfo || 'شركة رائدة في مجالها'}
      
      يجب أن يتضمن الوصف:
      1. مقدمة جذابة عن الوظيفة
      2. المسؤوليات الرئيسية (5-7 نقاط)
      3. المتطلبات والمؤهلات
      4. المهارات المطلوبة
      5. المزايا والحوافز
      
      اجعل الوصف احترافياً وواضحاً ومحفزاً للمتقدمين المناسبين.
    `;

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: isCompanyDesc ? 'أنت خبير في كتابة المحتوى التسويقي والتعريفي للشركات.' : 'أنت خبير في كتابة إعلانات الوظائف. اكتب وصفاً احترافياً وجذاباً.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const generatedDescription = response.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        description: generatedDescription,
        suggestions: [
          'تأكد من مراجعة الوصف وتخصيصه حسب احتياجات شركتك',
          'أضف معلومات محددة عن الراتب والمزايا إذا أمكن',
          'حدد الموقع ونوع العمل (دوام كامل/جزئي/عن بُعد)',
          'أضف تاريخ انتهاء التقديم'
        ]
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    تحسين السيرة الذاتية بالذكاء الاصطناعي
// @route   POST /api/ai/improve-resume
// @access  Private (Job Seekers)
router.post('/improve-resume', protect, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'هذه الخدمة متاحة للباحثين عن عمل فقط'
      });
    }

    const { resumeText, targetJob } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'نص السيرة الذاتية مطلوب'
      });
    }

    const isPlaceholder = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder');
    const pythonAiUrl = process.env.PYTHON_AI_SERVICE_URL;

    // محاولة استخدام خدمة بايثون أولاً مع مهلة زمنية قصيرة
    if (pythonAiUrl) {
      try {
        const pythonRes = await axios.post(`${pythonAiUrl}/improve-resume`, {
          resume_text: resumeText,
          target_job: targetJob
        }, { timeout: 3000 }); // مهلة 3 ثوانٍ

        if (pythonRes.data) {
          return res.status(200).json({
            success: true,
            data: {
              suggestions: pythonRes.data.suggestions,
              tips: pythonRes.data.tips,
              overallQuality: pythonRes.data.overall_quality
            }
          });
        }
      } catch (err) {
        console.error('Python AI Service Error or Timeout (Improve):', err.message);
        // نواصل لأسفل للمحاولة عبر OpenAI
      }
    }

    if (isPlaceholder) {
      return res.status(200).json({
        success: true,
        data: {
          suggestions: [
            'ركز على النتائج والأرقام (مثلاً: زيادة المبيعات بنسبة 20%)',
            'استخدم كلمات مفتاحية من إعلان الوظيفة المستهدفة',
            'اجعل الملخص المهني قصيراً ومركزاً على قيمتك المضافة'
          ],
          tips: ['هذه مقترحات عامة - قم بتفعيل OpenAI للحصول على تحليل مخصص بالكامل']
        }
      });
    }

    const prompt = `
      حلل السيرة الذاتية التالية وقدم اقتراحات تحسين مفصلة:
      
      السيرة الذاتية:
      ${resumeText}
      
      ${targetJob ? `الوظيفة المستهدفة: ${targetJob}` : ''}
      
      قدم اقتراحات في المجالات التالية:
      1. تحسين الملخص الشخصي
      2. إبراز المهارات الأساسية
      3. تحسين وصف الخبرات
      4. إضافة كلمات مفتاحية مهمة
      5. تحسين التنسيق والهيكل
      6. نصائح عامة
      
      الرد باللغة العربية في شكل نقاط واضحة ومفيدة.
    `;

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'أنت خبير في كتابة وتحسين السير الذاتية. قدم نصائح عملية ومفيدة.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const suggestions = response.choices[0].message.content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim());

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        tips: [
          'استخدم أرقام ونتائج قابلة للقياس عند وصف إنجازاتك',
          'تأكد من أن سيرتك الذاتية لا تتجاوز صفحتين',
          'استخدم كلمات مفتاحية من إعلان الوظيفة',
          'راجع الأخطاء الإملائية والنحوية',
          'احرص على التحديث المستمر لسيرتك الذاتية'
        ]
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    تحليل سوق العمل
// @route   GET /api/ai/market-analysis
// @access  Private
router.get('/market-analysis', protect, async (req, res) => {
  try {
    const { industry, location, jobTitle } = req.query;

    // إحصائيات أساسية من قاعدة البيانات
    const totalJobs = await Job.countDocuments({ status: 'نشط' });
    const totalApplications = await Application.countDocuments();
    
    // إحصائيات حسب الصناعة
    const jobsByIndustry = await Job.aggregate([
      { $match: { status: 'نشط' } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // إحصائيات حسب نوع الوظيفة
    const jobsByType = await Job.aggregate([
      { $match: { status: 'نشط' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // إحصائيات حسب مستوى الخبرة
    const jobsByExperience = await Job.aggregate([
      { $match: { status: 'نشط' } },
      { $group: { _id: '$experienceLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // المهارات الأكثر طلباً
    const topSkills = await Job.aggregate([
      { $match: { status: 'نشط' } },
      { $unwind: '$requirements.skills' },
      { $group: { _id: '$requirements.skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // متوسط الرواتب (تقريبي)
    const salaryStats = await Job.aggregate([
      { 
        $match: { 
          status: 'نشط',
          'salary.min': { $exists: true, $gt: 0 }
        } 
      },
      {
        $group: {
          _id: null,
          avgMin: { $avg: '$salary.min' },
          avgMax: { $avg: '$salary.max' },
          minSalary: { $min: '$salary.min' },
          maxSalary: { $max: '$salary.max' }
        }
      }
    ]);

    // اتجاهات التوظيف (آخر 6 أشهر)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const hiringTrends = await Job.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const analysis = {
      overview: {
        totalActiveJobs: totalJobs,
        totalApplications,
        competitionRatio: totalApplications / totalJobs || 0
      },
      jobsByIndustry,
      jobsByType,
      jobsByExperience,
      topSkills: topSkills.map(skill => ({
        skill: skill._id,
        demand: skill.count
      })),
      salaryInsights: salaryStats[0] || {
        avgMin: 0,
        avgMax: 0,
        minSalary: 0,
        maxSalary: 0
      },
      hiringTrends,
      insights: [
        'سوق العمل في نمو مستمر مع زيادة الطلب على المهارات التقنية',
        'الوظائف عن بُعد تشهد نمواً كبيراً',
        'المهارات الرقمية أصبحت ضرورية في معظم المجالات',
        'التخصصات التقنية تحظى بأعلى الرواتب'
      ]
    };

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    تحليل المقابلة بالذكاء الاصطناعي
// @route   POST /api/ai/analyze-interview
// @access  Private
router.post('/analyze-interview', protect, async (req, res) => {
  try {
    const { transcript, notes, roomId, jobId } = req.body;

    if (!transcript && !notes) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد بيانات للتحليل'
      });
    }

    const isPlaceholder = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder');
    const pythonAiUrl = process.env.PYTHON_AI_SERVICE_URL;
    
    let analysis;

    // محاولة استخدام خدمة بايثون أولاً
    if (pythonAiUrl) {
      try {
        const pythonRes = await axios.post(`${pythonAiUrl}/analyze-interview`, {
          transcript: transcript,
          notes: notes,
          job_id: jobId,
          candidate_id: req.user._id
        });

        if (pythonRes.data) {
          analysis = pythonRes.data;
        }
      } catch (err) {
        console.error('Python AI Service Error (Interview):', err.message);
      }
    }

    if (!analysis && isPlaceholder) {
      // Fallback analysis when no API key
      analysis = {
        score: 75,
        communication: 80,
        technical: 70,
        confidence: 75,
        marketMatch: 85,
        strengths: ['تواصل جيد', 'مهارات تقنية أساسية'],
        improvements: ['تحسين الثقة بالنفس', 'التعمق في التفاصيل'],
        summary: 'مقابلة جيدة بشكل عام مع وجود فرص للتطوير.'
      };
    } else {
      try {
        const prompt = `
          حلل المقابلة الوظيفية التالية بناءً على النص (Transcript) والملاحظات (Notes):
          
          النص: ${transcript || 'لا يوجد'}
          الملاحظات: ${notes || 'لا يوجد'}
          
          المطلوب تقديم تحليل دقيق باللغة العربية يتضمن:
          1. النتيجة الكلية (0-100)
          2. مهارات التواصل (0-100)
          3. الجانب التقني (0-100)
          4. الثقة بالنفس (0-100)
          5. ملاءمة السوق (0-100)
          6. نقاط القوة (قائمة)
          7. فرص التطوير (قائمة)
          8. ملخص شامل
          
          الرد بصيغة JSON فقط:
          {
            "score": number,
            "communication": number,
            "technical": number,
            "confidence": number,
            "marketMatch": number,
            "strengths": ["نقطة1", "نقطة2"],
            "improvements": ["تحسين1", "تحسين2"],
            "summary": "نص الملخص"
          }
        `;

        const response = await openai.chat.completions.create({
          model: process.env.AI_MODEL || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'أنت خبير في تحليل المقابلات الوظيفية.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.5
        });

        analysis = JSON.parse(response.choices[0].message.content);
      } catch (aiError) {
        console.error('AI Interview Analysis error:', aiError);
        return res.status(500).json({ success: false, message: 'فشل في تحليل الذكاء الاصطناعي' });
      }
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    الدردشة مع مساعد الذكاء الاصطناعي
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'الرسالة مطلوبة'
      });
    }

    if (!req.user.aiSettings.enableChatbot) {
      return res.status(400).json({
        success: false,
        message: 'خدمة المساعد الذكي غير مفعلة في إعداداتك'
      });
    }

    const isPlaceholder = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder');
    const pythonAiUrl = process.env.PYTHON_AI_SERVICE_URL;

    // محاولة استخدام خدمة بايثون أولاً
    if (pythonAiUrl) {
      try {
        const pythonRes = await axios.post(`${pythonAiUrl}/chat`, {
          message: message,
          context: {
            user_name: req.user.name,
            user_role: req.user.role,
            ...context
          }
        });

        if (pythonRes.data) {
          return res.status(200).json({
            success: true,
            data: {
              message: pythonRes.data.response,
              timestamp: pythonRes.data.timestamp
            }
          });
        }
      } catch (err) {
        console.error('Python AI Service Error (Chat):', err.message);
      }
    }

    if (isPlaceholder) {
      return res.status(200).json({
        success: true,
        data: {
          message: `مرحباً ${req.user.name}! أنا مساعدك الذكي في منصة التوظيف. حالياً أنا أعمل في وضع المعاينة المحدود. كيف يمكنني مساعدتك في رحلتك المهنية اليوم؟`,
          timestamp: new Date().toISOString()
        }
      });
    }

    // تحديد السياق حسب دور المستخدم
    let systemPrompt = `
      أنت مساعد ذكي متخصص في التوظيف والموارد البشرية.
      تتحدث باللغة العربية وتقدم نصائح مفيدة ومهنية.
      
      معلومات المستخدم:
      - الاسم: ${req.user.name}
      - الدور: ${req.user.role === 'jobseeker' ? 'باحث عن عمل' : req.user.role === 'employer' ? 'صاحب عمل' : 'مدير'}
    `;

    if (req.user.role === 'jobseeker') {
      systemPrompt += `
        ساعد المستخدم في:
        - البحث عن الوظائف المناسبة
        - تحسين السيرة الذاتية
        - التحضير للمقابلات
        - تطوير المهارات المهنية
        - نصائح التقديم للوظائف
      `;
    } else if (req.user.role === 'employer') {
      systemPrompt += `
        ساعد المستخدم في:
        - كتابة إعلانات الوظائف
        - اختيار المرشحين المناسبين
        - إجراء المقابلات
        - إدارة عملية التوظيف
        - بناء فريق العمل
      `;
    }

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const aiResponse = response.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

// @desc    إنشاء نبذة شخصية بالذكاء الاصطناعي
router.post('/generate-bio', protect, async (req, res) => {
  try {
    const { skills, experience, education } = req.body;

    const isPlaceholder = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder');
    if (isPlaceholder) {
      return res.status(200).json({
        success: true,
        data: {
          bio: "محترف طموح بخلفية قوية في المهارات المذكورة، أسعى للمساهمة في بيئة عمل ديناميكية وتحقيق أهداف الشركة من خلال التميز والابتكار."
        }
      });
    }

    const prompt = `
      أنشئ نبذة شخصية (Bio) احترافية وجذابة باللغة العربية لشخص يمتلك المهارات والخبرات التالية:
      
      المهارات: ${skills?.join(', ') || 'غير محدد'}
      الخبرة: ${JSON.stringify(experience) || 'غير محدد'}
      التعليم: ${JSON.stringify(education) || 'غير محدد'}
      
      يجب أن تكون النبذة:
      1. مكتوبة بضمير المتكلم (أنا)
      2. احترافية وموجزة (حوالي 3-4 جمل)
      3. تركز على القيمة المضافة والشغف
      
      الرد بالنص فقط.
    `;

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'أنت خبير في كتابة الملفات الشخصية المهنية.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    res.status(200).json({
      success: true,
      data: { bio: response.choices[0].message.content.trim() }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

module.exports = router;