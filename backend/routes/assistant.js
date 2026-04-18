const express = require('express');
const { protect } = require('../middleware/auth');
const OpenAI = require('openai');
const natural = require('natural');
const axios = require('axios');
const KNOWLEDGE_BASE = require('../utils/knowledgeBase');
const AIService = require('../ai/ai-service');
const Job = require('../models/Job');
const SystemSettings = require('../models/SystemSettings');

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// تهيئة خدمة الذكاء الاصطناعي
const aiService = AIService;

// إعداد المحللات اللغوية
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();

// إضافة الأسئلة الشائعة إلى TF-IDF للبحث المتقدم
Object.entries(KNOWLEDGE_BASE.faq).forEach(([question, data]) => {
  tfidf.addDocument(question);
});

// @desc    مساعد الذكاء الاصطناعي (Chatbot)
// @route   POST /api/assistant/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'الرسالة مطلوبة'
      });
    }

    // جلب إعدادات النظام لمعرفة المزود المفضل
    const settings = await SystemSettings.findOne();
    const aiProvider = settings?.aiProvider || 'local';
    
    let finalResponse = null;
    let usedAI = false;

    // 1. إذا كان المزوّد هو Python Service
    if (aiProvider === 'python-service') {
      try {
        const pythonUrl = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
        const pythonResponse = await axios.post(`${pythonUrl}/chat`, {
          message,
          context
        });
        
        if (pythonResponse.data && pythonResponse.data.response) {
          finalResponse = pythonResponse.data.response;
          usedAI = true;
        }
      } catch (error) {
        console.error('Python AI Service Error:', error.message);
        // Fallback to local if python fails
      }
    }

    // 2. إذا كان المزوّد هو OpenAI (أو فشل Python)
    if (!finalResponse && aiProvider === 'openai') {
      const effectiveApiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY;
      const isPlaceholder = !effectiveApiKey || effectiveApiKey.includes('placeholder');
      
      if (!isPlaceholder) {
        try {
          const dynamicOpenai = new OpenAI({ apiKey: effectiveApiKey });
          const completion = await dynamicOpenai.chat.completions.create({
            model: settings?.openaiModel || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `أنت مساعد ذكي احترافي لJobify. المطور: المهندس محمد علي. ساعد المستخدم في رحلته المهنية (وظائف، سير ذاتية، مقابلات). تحدث بالعربية بأسلوب ودود ومحفز.`
              },
              { role: 'user', content: message }
            ],
            max_tokens: settings?.maxTokens || 800,
            temperature: settings?.aiTemperature || 0.7
          });
          finalResponse = completion.choices[0].message.content;
          usedAI = true;
        } catch (error) {
          console.error('OpenAI Error:', error.message);
        }
      }
    }

    // 3. المنطق المحلي (Local Logic / NLP) - يستخدم كـ Fallback أو إذا تم اختياره
    if (!finalResponse) {
      // استخدام خدمة الذكاء الاصطناعي المتقدمة (AIService) أولاً
      const aiServiceResult = await aiService.chatBot(message, context);
      
      if (aiServiceResult.success && aiServiceResult.response && 
          !aiServiceResult.response.includes('عذراً، حدث خطأ')) {
        finalResponse = aiServiceResult.response;
      } else {
        // البحث في قاعدة المعرفة المحلية باستخدام تقنيات NLP
        let bestMatchScore = 0;
        let bestMatchKey = null;

        tfidf.tfidfs(message, (i, score) => {
          if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatchKey = Object.keys(KNOWLEDGE_BASE.faq)[i];
          }
        });

        if (bestMatchScore > 0.5 && bestMatchKey) {
          finalResponse = KNOWLEDGE_BASE.faq[bestMatchKey].answer;
        }

        // التحقق من نية البحث عن وظائف
        if (!finalResponse) {
          const jobKeywords = ['وظيفة', 'عمل', 'أبحث عن', 'فرص', 'شاغر', 'شغل', 'توظيف'];
          const isSearchingJobs = jobKeywords.some(keyword => message.includes(keyword));
          
          if (isSearchingJobs) {
            const words = tokenizer.tokenize(message);
            const searchTerms = words.filter(w => !jobKeywords.includes(w) && w.length > 2);
            
            if (searchTerms.length > 0) {
              const jobs = await Job.find({
                $or: [
                  { title: { $regex: searchTerms.join('|'), $options: 'i' } },
                  { category: { $regex: searchTerms.join('|'), $options: 'i' } }
                ],
                status: 'نشط'
              }).limit(3);

              if (jobs.length > 0) {
                finalResponse = `لقد وجدت بعض الوظائف الشاغرة التي قد تناسبك:\n\n` + 
                  jobs.map(j => `🔹 **${j.title}**\n📍 ${j.location.city}`).join('\n\n') +
                  `\n\nيمكنك استكشاف المزيد في صفحة "البحث عن وظائف".`;
              }
            }
          }
        }
      }
    }

    // 4. Fallback نهائي لـ OpenAI إذا لم يتوفر رد محلي وكان المزود 'local'
    if (!finalResponse && aiProvider === 'local') {
      const effectiveApiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY;
      if (effectiveApiKey && !effectiveApiKey.includes('placeholder')) {
        try {
          const dynamicOpenai = new OpenAI({ apiKey: effectiveApiKey });
          const completion = await dynamicOpenai.chat.completions.create({
            model: settings?.openaiModel || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }],
            max_tokens: settings?.maxTokens || 500
          });
          finalResponse = completion.choices[0].message.content;
          usedAI = true;
        } catch (e) {}
      }
    }

    // الرد النهائي الشامل
    if (!finalResponse) {
      finalResponse = "مرحباً بك! أنا مساعدك الذكي. يمكنني مساعدتك في البحث عن وظائف، تحسين سيرتك الذاتية، والتحضير للمقابلات. كيف يمكنني مساعدتك اليوم؟";
    }

    res.status(200).json({
      success: true,
      data: {
        response: finalResponse,
        usedAI,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Assistant Error:', error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

module.exports = router;

