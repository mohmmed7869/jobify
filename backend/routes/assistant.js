const express = require('express');
const { protect } = require('../middleware/auth');
const aiOrchestrator = require('../utils/aiOrchestrator');
const { generateReasoning } = require('../utils/geminiClient');
const Job = require('../models/Job');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

const router = express.Router();

const SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي احترافي لمنصة Jobify للتوظيف.
تحدث بالعربية بأسلوب ودي، اختصر إجاباتك، وإذا سأل المستخدم عن وظيفة اقترح البحث في صفحة الوظائف.`;

// @route POST /api/assistant/chat
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'الرسالة مطلوبة' });
    }

    // Prepare payload for AI Router
    const payload = {
      message,
      userRole: context.userRole || 'jobseeker'
    };

    // Execute via Orchestrator
    const result = await aiOrchestrator.routeRequest({
      taskName: 'CHAT_REASONING',
      payload: payload,
      useCache: true, // Repeated queries get cached
      geminiFunction: async (data) => {
        
        // 1. Check for local jobs first to inject into context (Hybrid Approach)
        let jobContext = '';
        const jobKeywords = ['وظيفة', 'عمل', 'شاغر', 'فرصة', 'توظيف'];
        if (jobKeywords.some(kw => data.message.includes(kw))) {
          const words = tokenizer.tokenize(data.message) || [];
          const searchTerms = words.filter(w => w.length > 2);
          if (searchTerms.length > 0) {
            const jobs = await Job.find({
              $or: [
                { title: { $regex: searchTerms.join('|'), $options: 'i' } }
              ],
              status: 'نشط'
            }).limit(2).select('title location.city');
            if (jobs.length > 0) {
              jobContext = `وظائف متاحة حالياً:\n` + jobs.map(j => `- ${j.title}`).join('\n');
            }
          }
        }

        const fullPrompt = `${SYSTEM_PROMPT}\nالمستخدم نوعه: ${data.userRole}\n${jobContext}\n\nسؤال المستخدم: ${data.message}\nالجواب:`;
        
        // Call centralized Gemini Layer
        return await generateReasoning(fullPrompt);
      }
    });

    // Unified Enterprise Response Format
    res.status(200).json({
      success: true,
      data: {
        result: result,
        layer_used: 'GEMINI_AI',
        executed_via: 'AI_ORCHESTRATOR'
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'تعذر معالجة الطلب في الوقت الحالي',
      debug_error: process.env.AI_DEBUG === 'true' ? error.message : undefined
    });
  }
});

module.exports = router;
