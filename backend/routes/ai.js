const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const aiOrchestrator = require('../utils/aiOrchestrator');
const { generateReasoning } = require('../utils/geminiClient');
const { 
  generatePersonalizedRecommendations, 
  intelligentJobSearch,
  calculateMatchingScore
} = require('../utils/aiHelpers');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');

const router = express.Router();

// @desc    الحصول على توصيات وظائف شخصية (SCORING)
router.get('/recommendations', protect, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ success: false, message: 'هذه الخدمة متاحة للباحثين عن عمل فقط' });
    }

    const limit = parseInt(req.query.limit) || 10;

    const result = await aiOrchestrator.routeRequest({
      taskName: 'JOB_RECOMMENDATIONS_SCORING',
      payload: { userId: req.user._id, limit },
      useCache: true,
      localAIFunction: async () => {
        const recommendations = await generatePersonalizedRecommendations(req.user, limit);
        const recommendationsWithScores = await Promise.all(
          recommendations.map(async (job) => {
            try {
              const match = await calculateMatchingScore(job, req.user, null);
              return { ...job.toObject(), matchingScore: match.matchingScore, matchDetails: match };
            } catch (error) {
              return { ...job.toObject(), matchingScore: 0, matchDetails: null };
            }
          })
        );
        recommendationsWithScores.sort((a, b) => b.matchingScore - a.matchingScore);
        return recommendationsWithScores;
      }
    });

    res.status(200).json({ 
      success: true, 
      count: result.result?.length || 0, 
      data: result.result,
      _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    البحث الذكي في الوظائف (SCORING)
router.post('/smart-search', protect, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'يرجى إدخال كلمات البحث' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'SMART_SEARCH_SCORING',
      payload: { query, userId: req.user._id },
      useCache: true,
      localAIFunction: async () => {
        const searchCriteria = await intelligentJobSearch(query, req.user);
        searchCriteria.$and = searchCriteria.$and || [];
        searchCriteria.$and.push({ status: 'نشط' });
        
        const jobs = await Job.find(searchCriteria).populate('company', 'name employerProfile.companyLogo').sort('-createdAt').limit(20);
        
        let jobsWithScores = jobs;
        if (req.user.role === 'jobseeker') {
          jobsWithScores = await Promise.all(
            jobs.map(async (job) => {
              try {
                const match = await calculateMatchingScore(job, req.user, null);
                return { ...job.toObject(), matchingScore: match.matchingScore };
              } catch(e) {
                return { ...job.toObject(), matchingScore: 0 };
              }
            })
          );
          jobsWithScores.sort((a, b) => b.matchingScore - a.matchingScore);
        }
        return jobsWithScores;
      }
    });

    res.status(200).json({ 
      success: true, 
      count: result.result?.length || 0, 
      data: result.result,
      _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    تحليل وتحسين متطلبات الوظيفة (GENERATION)
router.post('/improve-job-requirements', protect, async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId || jobId === 'undefined') return res.status(400).json({ success: false, message: 'jobId مطلوب' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'الوظيفة غير موجودة' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'IMPROVE_JOB_REASONING_GENERATION',
      payload: { jobId },
      useCache: true,
      geminiFunction: async () => {
        const prompt = `أنت خبير توظيف. حلل هذه الوظيفة واقترح تحسينات:\nالوظيفة: ${job.title}\nالمهارات: ${job.requirements?.skills?.join(', ')}\nأجب بـ JSON فقط: {"recommendedSkills":["مهارة1"],"descriptionImprovement":"نص","suggestedExperience":"نص","suggestedEducation":"نص","whyTheseChanges":"نص"}`;
        const aiResponse = await generateReasoning(prompt);
        return JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
      }
    });

    res.status(200).json({ 
      success: true, 
      data: result.result,
      _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    تحليل السيرة الذاتية بالذكاء الاصطناعي (SCORING/HYBRID)
router.post('/analyze-resume', protect, async (req, res) => {
  try {
    const { resumeText, jobId } = req.body;
    if (!resumeText) return res.status(400).json({ success: false, message: 'نص السيرة مطلوب' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'RESUME_ANALYSIS_HYBRID',
      payload: { resumeLength: resumeText.length, jobId },
      useCache: true,
      localAIFunction: async () => {
        const pythonUrl = process.env.PYTHON_AI_SERVICE_URL;
        let analysis = { skills: [], experience: 0, education: [], strengths: [], improvements: [], overallScore: 0 };
        if (pythonUrl) {
          try {
            const pythonRes = await axios.post(`${pythonUrl}/analyze-resume`, { resume_text: resumeText });
            if (pythonRes.data) {
              analysis = { ...pythonRes.data };
              analysis.experience = pythonRes.data.experience_years || 0;
            }
          } catch(e) {}
        }
        
        let jobMatch = null;
        if (jobId) {
          const job = await Job.findById(jobId);
          if (job) {
            const tempProfile = { jobseekerProfile: { skills: analysis.skills, experience: Array(analysis.experience).fill({}), education: analysis.education?.map(edu => ({ degree: edu })) || [] } };
            const resumeAnalysis = { skills: analysis.skills, experience: Array(analysis.experience).fill({}) };
            jobMatch = await calculateMatchingScore(job, tempProfile, resumeAnalysis);
          }
        }
        return { analysis, jobMatch };
      },
      geminiFunction: async () => {
         const prompt = `حلل السيرة الذاتية التالية واستخرج المعلومات بدقة:\n${resumeText}\nأجب بـ JSON فقط:\n{"skills":["مهارة1"],"experience_years":0,"education":["مؤهل1"],"strengths":["نقطة قوة"],"improvements":["تحسين"],"overall_score":75}`;
         const text = await generateReasoning(prompt);
         const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
         let jobMatch = null;
         if (jobId) {
            const job = await Job.findById(jobId);
            if (job) {
               const tempProfile = { jobseekerProfile: { skills: parsed.skills || [], experience: Array(parsed.experience_years || 0).fill({}) } };
               jobMatch = await calculateMatchingScore(job, tempProfile, { skills: parsed.skills || [], experience: [] });
            }
         }
         return { analysis: parsed, jobMatch };
      }
    });

    res.status(200).json({ 
      success: true, 
      data: result.result,
      _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    إنشاء وصف وظيفة بالذكاء الاصطناعي (GENERATION)
router.post('/generate-job-description', protect, async (req, res) => {
  try {
    const { jobTitle, industry, experienceLevel, keySkills, companyInfo } = req.body;
    if (!jobTitle) return res.status(400).json({ success: false, message: 'عنوان الوظيفة مطلوب' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'GENERATE_JOB_DESC_GENERATION',
      payload: { jobTitle, industry },
      useCache: true,
      geminiFunction: async () => {
        const isCompanyDesc = jobTitle === 'وصف الشركة' || jobTitle === 'بروفايل الشركة';
        const prompt = isCompanyDesc
          ? `Generate ONLY a professional and concise company description in Arabic language.

Rules:
- Do NOT add explanations
- Do NOT add titles
- Do NOT say "Here is the description" or "إليك الوصف"
- Do NOT use bullet points
- Output must be a single paragraph only

Content:
- Company Name: ${companyInfo}
- Industry: ${industry}
- Include: Vision, mission, and work culture.

Output:
Only the description text.`
          : `أنشئ وصف وظيفة احترافي باللغة العربية:
الوظيفة: ${jobTitle}
الصناعة: ${industry}
المهارات المطلوبة: ${keySkills}
الشركة: ${companyInfo}
اشمل: مقدمة، مسؤوليات رئيسية، متطلبات، ومزايا العمل.`;
        
        const text = await generateReasoning(prompt);
        return { description: text, suggestions: ['راجع الوصف وخصصه حسب هوية الشركة', 'تأكد من ذكر المزايا التنافسية'] };
      }
    });

    res.status(200).json({ 
      success: true, 
      data: result.result,
      _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    تحسين السيرة الذاتية بالذكاء الاصطناعي (GENERATION)
router.post('/improve-resume', protect, async (req, res) => {
  try {
    const { resumeText, targetJob } = req.body;
    if (!resumeText) return res.status(400).json({ success: false, message: 'نص السيرة مطلوب' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'IMPROVE_RESUME_GENERATION',
      payload: { resumeLength: resumeText.length, targetJob },
      useCache: true,
      geminiFunction: async () => {
        const prompt = `أنت خبير سير ذاتية. حلل السيرة وقدم 5 نقاط تحسين:\n${resumeText}\nالوظيفة المستهدفة: ${targetJob}`;
        const text = await generateReasoning(prompt);
        const suggestions = text.split('\n').filter(l => l.trim().length > 5).map(l => l.replace(/^[\-\*\d\.]+\s*/, '').trim());
        return { suggestions, tips: ['استخدم أرقام', 'لا تتجاوز صفحتين', 'راجع الأخطاء'] };
      }
    });

    res.status(200).json({ 
      success: true, 
      data: result.result,
      _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    تحليل المقابلة (SCORING)
router.post('/analyze-interview', protect, async (req, res) => {
  try {
    const { transcript, notes, jobId } = req.body;
    
    const result = await aiOrchestrator.routeRequest({
      taskName: 'EVALUATE_INTERVIEW_SCORING',
      payload: { transcriptLength: transcript?.length, jobId },
      useCache: false,
      localAIFunction: async () => {
        const pythonUrl = process.env.PYTHON_AI_SERVICE_URL;
        if (pythonUrl) {
          try {
            const pythonRes = await axios.post(`${pythonUrl}/analyze-interview`, { transcript, notes, job_id: jobId });
            if (pythonRes.data) return pythonRes.data;
          } catch(e) {}
        }
        return { score: 70, strengths: ["تواصل"], improvements: ["السرعة"], confidence: 75 };
      }
    });

    res.status(200).json({ 
      success: true, 
      data: result.result,
      _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    تحليل سوق العمل (SCORING)
router.get('/market-analysis', protect, async (req, res) => {
  try {
    const result = await aiOrchestrator.routeRequest({
      taskName: 'MARKET_ANALYSIS_SCORING',
      payload: { query: req.query },
      useCache: true,
      localAIFunction: async () => {
        const totalJobs = await Job.countDocuments({ status: 'نشط' });
        const jobsByIndustry = await Job.aggregate([{ $match: { status: 'نشط' } }, { $group: { _id: '$industry', count: { $sum: 1 } } }]);
        const totalApplications = await Application.countDocuments();
        return { 
          overview: { totalActiveJobs: totalJobs, totalApplications, competitionRatio: totalApplications / totalJobs || 0 }, 
          jobsByIndustry,
          insights: ['نمو مستمر في السوق']
        };
      }
    });

    res.status(200).json({ 
      success: true, 
      data: result.result,
      _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

module.exports = router;