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

// @desc    ?????? ??? ?????? ????? ????? (SCORING -> LOCAL_AI)
router.get('/recommendations', protect, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ success: false, message: '??? ?????? ????? ???????? ?? ??? ???' });
    }
    if (!req.user.aiSettings?.enableRecommendations) {
      return res.status(400).json({ success: false, message: '???? ???????? ??? ????? ?? ????????' });
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
              const matchingScore = await calculateMatchingScore(job, req.user, null);
              return {
                ...job.toObject(),
                matchingScore: matchingScore.matchingScore,
                matchDetails: matchingScore
              };
            } catch (error) {
              return { ...job.toObject(), matchingScore: 0, matchDetails: null };
            }
          })
        );
        recommendationsWithScores.sort((a, b) => b.matchingScore - a.matchingScore);
        return recommendationsWithScores;
      }
    });

    res.status(200).json({ success: true, count: result.result?.length || 0, data: result.result, _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId } });
  } catch (error) {
    res.status(500).json({ success: false, message: `??? ?? ?????? (${error.message})` });
  }
});

// @desc    ????? ????? ?? ??????? (SCORING -> LOCAL_AI)
router.post('/smart-search', protect, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: '???? ????? ????? ?????' });
    }

    const result = await aiOrchestrator.routeRequest({
      taskName: 'SMART_SEARCH_SCORING',
      payload: { query, userId: req.user._id },
      useCache: true,
      localAIFunction: async () => {
        const searchCriteria = await intelligentJobSearch(query, req.user);
        searchCriteria.$and = searchCriteria.$and || [];
        searchCriteria.$and.push({ status: '???' });

        const jobs = await Job.find(searchCriteria)
          .populate('company', 'name employerProfile.companyLogo')
          .sort('-createdAt')
          .limit(20);

        let jobsWithScores = jobs;
        if (req.user.role === 'jobseeker') {
          jobsWithScores = await Promise.all(
            jobs.map(async (job) => {
              try {
                const match = await calculateMatchingScore(job, req.user, null);
                return { ...job.toObject(), matchingScore: match.matchingScore };
              } catch (error) {
                return { ...job.toObject(), matchingScore: 0 };
              }
            })
          );
          jobsWithScores.sort((a, b) => b.matchingScore - a.matchingScore);
        }
        return jobsWithScores;
      }
    });

    res.status(200).json({ success: true, count: result.result?.length || 0, data: result.result, _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId } });
  } catch (error) {
    res.status(500).json({ success: false, message: `??? ?? ?????? (${error.message})` });
  }
});

// @desc    ????? ?????? ??????? ??????? (REASONING -> GEMINI_AI)
router.post('/improve-job-requirements', protect, async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId || jobId === 'undefined') {
      return res.status(400).json({ success: false, message: '???? ????? ???? ??????? (jobId ?????)' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: '??????? ??? ??????' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'IMPROVE_JOB_REQUIREMENTS_REASONING',
      payload: { jobId },
      useCache: true,
      geminiFunction: async () => {
        const jobContext = `
          ???????: ${job.title}
          ???????: ${job.category}
          ????? ??????: ${job.description}
          ???????? ???????: ${job.requirements?.skills?.join(', ') || '??? ?????'}
        `;
        const geminiPrompt = `??? ???? ?????. ??? ??? ??????? ?????? ???????:\n${jobContext}\n??? ?? JSON ???: {"recommendedSkills":["?????1"],"descriptionImprovement":"??","suggestedExperience":"??","suggestedEducation":"??","whyTheseChanges":"??"}`;
        
        const geminiText = await generateReasoning(geminiPrompt);
        const cleaned = geminiText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
      }
    });

    res.status(200).json({ success: true, data: result.result, _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId } });
  } catch (error) {
    res.status(500).json({ success: false, message: `??? ?? ?????? (${error.message})` });
  }
});

// @desc    ????? ?????? ??????? ??????? ????????? (SCORING -> LOCAL_AI ONLY)
router.post('/analyze-resume', protect, async (req, res) => {
  try {
    const { resumeText, jobId } = req.body;
    if (!resumeText) return res.status(400).json({ success: false, message: '???? ????? ?? ?????? ???????' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'RESUME_ANALYSIS_SCORING',
      payload: { resumeLength: resumeText.length, jobId },
      useCache: true,
      localAIFunction: async () => {
        const pythonAiUrl = process.env.PYTHON_AI_SERVICE_URL;
        let analysis = { skills: [], experience: 0, education: [], strengths: [], improvements: [], overallScore: 0 };
        
        if (pythonAiUrl) {
          try {
            const pythonRes = await axios.post(`${pythonAiUrl}/analyze-resume`, { resume_text: resumeText });
            if (pythonRes.data) {
              analysis = {
                skills: pythonRes.data.skills || [],
                experience: pythonRes.data.experience_years || 0,
                education: Array.isArray(pythonRes.data.education) ? pythonRes.data.education : [pythonRes.data.education?.degree].filter(Boolean),
                strengths: pythonRes.data.strengths || [],
                improvements: pythonRes.data.improvements || [],
                overallScore: pythonRes.data.score || 0
              };
            }
          } catch (e) {
            console.error('Python API Failed', e.message);
          }
        }

        let jobMatch = null;
        if (jobId) {
          const job = await Job.findById(jobId);
          if (job) {
            const tempProfile = { jobseekerProfile: { skills: analysis.skills, experience: Array(analysis.experience).fill({}), education: analysis.education.map(edu => ({ degree: edu })) } };
            const resumeAnalysis = { skills: analysis.skills, experience: Array(analysis.experience).fill({}) };
            jobMatch = await calculateMatchingScore(job, tempProfile, resumeAnalysis);
          }
        }
        return { analysis, jobMatch };
      }
    });

    res.status(200).json({ success: true, data: result.result, _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId } });
  } catch (error) {
    res.status(500).json({ success: false, message: `??? ?? ?????? (${error.message})` });
  }
});

// @desc    ????? ??? ????? ??????? ????????? (REASONING -> GEMINI_AI)
router.post('/generate-job-description', protect, async (req, res) => {
  try {
    const { jobTitle, industry, experienceLevel, keySkills, companyInfo } = req.body;
    if (!jobTitle) return res.status(400).json({ success: false, message: '????? ??????? ?????' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'GENERATE_JOB_DESC_REASONING',
      payload: { jobTitle, industry },
      useCache: true,
      geminiFunction: async () => {
        const isCompanyDesc = jobTitle === '??? ??????' || jobTitle === '??????? ??????';
        const prompt = isCompanyDesc
          ? `???? ????? ????????? ?????:\n??? ??????: ${companyInfo}\n??????: ${industry}\n????: ????? ????? ???? ?????.`
          : `???? ??? ?????:\n???????: ${jobTitle}\n???????: ${industry}\n????????: ${keySkills}\n??????: ${companyInfo}\n????: ?????? ????????? ???????? ?????.`;
        
        const generatedDescription = await generateReasoning(prompt);
        return { description: generatedDescription };
      }
    });

    res.status(200).json({ success: true, data: result.result, _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId } });
  } catch (error) {
    res.status(500).json({ success: false, message: `??? ?? ?????? (${error.message})` });
  }
});

// @desc    ????? ???????? (SCORING -> LOCAL_AI)
router.post('/analyze-interview', protect, async (req, res) => {
  try {
    const { transcript, notes, roomId, jobId } = req.body;
    if (!transcript && !notes) return res.status(400).json({ success: false, message: '?? ???? ?????? ???????' });

    const result = await aiOrchestrator.routeRequest({
      taskName: 'INTERVIEW_ANALYSIS_SCORING',
      payload: { roomId, jobId, length: transcript?.length },
      useCache: false,
      localAIFunction: async () => {
        const pythonAiUrl = process.env.PYTHON_AI_SERVICE_URL;
        if (pythonAiUrl) {
          const pythonRes = await axios.post(`${pythonAiUrl}/analyze-interview`, { transcript, notes, job_id: jobId });
          return pythonRes.data;
        }
        return { score: 75, strengths: ['?????'], improvements: ['??????'], confidence: 75 };
      }
    });

    res.status(200).json({ success: true, data: result.result, _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId } });
  } catch (error) {
    res.status(500).json({ success: false, message: `??? ?? ?????? (${error.message})` });
  }
});

// @desc    ????? ??? ????? (SCORING -> LOCAL_AI)
router.get('/market-analysis', protect, async (req, res) => {
  try {
    const result = await aiOrchestrator.routeRequest({
      taskName: 'MARKET_ANALYSIS_SCORING',
      payload: req.query,
      useCache: true,
      localAIFunction: async () => {
        const totalJobs = await Job.countDocuments({ status: '???' });
        const jobsByIndustry = await Job.aggregate([{ $match: { status: '???' } }, { $group: { _id: '$industry', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);
        const topSkills = await Job.aggregate([{ $match: { status: '???' } }, { $unwind: '$requirements.skills' }, { $group: { _id: '$requirements.skills', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);
        return { overview: { totalActiveJobs: totalJobs }, jobsByIndustry, topSkills };
      }
    });

    res.status(200).json({ success: true, data: result.result, _ai_metrics: { layer_used: result.layer_used, cached: result.cached, execution_time_ms: result.execution_time_ms, confidence: result.confidence, traceId: result.traceId } });
  } catch (error) {
    res.status(500).json({ success: false, message: `??? ?? ?????? (${error.message})` });
  }
});

module.exports = router;
