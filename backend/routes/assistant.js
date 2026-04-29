const express = require('express');
const { protect } = require('../middleware/auth');
const natural = require('natural');
const axios = require('axios');
const KNOWLEDGE_BASE = require('../utils/knowledgeBase');
const Job = require('../models/Job');

const router = express.Router();

// ── Gemini Setup ──────────────────────────────────────────
let geminiModel = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    const genAI = new GoogleGenerativeAI(key);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Gemini AI ready in Assistant');
  }
} catch (e) {
  console.warn('Gemini not available:', e.message);
}

// ── NLP Setup (TF-IDF للبحث في قاعدة المعرفة) ───────────
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();
const faqKeys = Object.keys(KNOWLEDGE_BASE.faq || {});
faqKeys.forEach(q => tfidf.addDocument(q));

// ── السياق النظامي لـ Gemini ──────────────────────────────
const SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي احترافي لمنصة Jobify للتوظيف، طوّرك فريق Smart Solution بقيادة المهندس محمد علي.

مهمتك مساعدة المستخدمين في:
🔍 البحث عن وظائف مناسبة
📄 تحسين وكتابة السيرة الذاتية
🎤 التحضير لمقابلات العمل
📈 تطوير المسار المهني
💼 نصائح سوق العمل

قواعد الرد:
- تحدث دائماً بالعربية بأسلوب ودي ومحفز
- اجعل ردودك مختصرة ومفيدة (3-5 جمل كحد أقصى)
- استخدم الرموز التعبيرية بشكل مناسب
- إذا سأل المستخدم عن وظيفة محددة، اقترح البحث في صفحة الوظائف
- لا تُعطِ معلومات خاطئة عن رواتب أو شركات محددة`;

// ── @route POST /api/assistant/chat ──────────────────────
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'الرسالة مطلوبة' });
    }

    let finalResponse = null;
    let usedAI = false;

    // ══════════════════════════════════════════════════════
    // 1️⃣  Gemini (الأولوية القصوى)
    // ══════════════════════════════════════════════════════
    if (geminiModel) {
      try {
        // ابحث في الوظائف أولاً إذا كان السؤال عن وظيفة
        let jobContext = '';
        const jobKeywords = ['وظيفة', 'عمل', 'شاغر', 'فرصة', 'توظيف', 'شغل', 'أبحث'];
        if (jobKeywords.some(kw => message.includes(kw))) {
          const words = tokenizer.tokenize(message) || [];
          const searchTerms = words.filter(w => !jobKeywords.includes(w) && w.length > 2);
          if (searchTerms.length > 0) {
            const jobs = await Job.find({
              $or: [
                { title: { $regex: searchTerms.slice(0, 3).join('|'), $options: 'i' } },
                { category: { $regex: searchTerms.slice(0, 3).join('|'), $options: 'i' } }
              ],
              status: 'نشط'
            }).limit(3).select('title location.city category');

            if (jobs.length > 0) {
              jobContext = `\n\nوظائف متاحة الآن في المنصة:\n` +
                jobs.map(j => `- ${j.title} في ${j.location?.city || 'غير محدد'}`).join('\n');
            }
          }
        }

        // بناء سياق المستخدم
        const userContext = context.userRole
          ? `نوع المستخدم: ${context.userRole === 'jobseeker' ? 'باحث عن عمل' : context.userRole === 'employer' ? 'صاحب عمل' : 'مستخدم'}`
          : '';

        const fullPrompt = `${SYSTEM_PROMPT}\n${userContext}${jobContext}\n\nالمستخدم: ${message}\nالمساعد:`;
        const result = await geminiModel.generateContent(fullPrompt);
        finalResponse = result.response.text().trim();
        usedAI = true;
      } catch (e) {
        console.error('Gemini error in assistant:', e.message);
      }
    }

    // ══════════════════════════════════════════════════════
    // 2️⃣  Python AI Service (fallback)
    // ══════════════════════════════════════════════════════
    if (!finalResponse) {
      try {
        const pythonUrl = process.env.PYTHON_AI_SERVICE_URL;
        if (pythonUrl) {
          const res2 = await axios.post(`${pythonUrl}/api/v1/ai/chat`, { message, context }, { timeout: 4000 });
          if (res2.data?.response) {
            finalResponse = res2.data.response;
            usedAI = true;
          }
        }
      } catch (e) { /* continue to fallback */ }
    }

    // ══════════════════════════════════════════════════════
    // 3️⃣  قاعدة المعرفة المحلية (NLP TF-IDF)
    // ══════════════════════════════════════════════════════
    if (!finalResponse) {
      let bestScore = 0;
      let bestKey = null;
      tfidf.tfidfs(message, (i, score) => {
        if (score > bestScore) { bestScore = score; bestKey = faqKeys[i]; }
      });

      if (bestScore > 0.4 && bestKey && KNOWLEDGE_BASE.faq[bestKey]) {
        finalResponse = KNOWLEDGE_BASE.faq[bestKey].answer;
      }
    }

    // ══════════════════════════════════════════════════════
    // 4️⃣  بحث في الوظائف (إذا لم يُرد شيء)
    // ══════════════════════════════════════════════════════
    if (!finalResponse) {
      const jobKeywords = ['وظيفة', 'عمل', 'أبحث', 'فرص', 'شاغر', 'شغل', 'توظيف'];
      if (jobKeywords.some(kw => message.includes(kw))) {
        const words = tokenizer.tokenize(message) || [];
        const terms = words.filter(w => !jobKeywords.includes(w) && w.length > 2);
        if (terms.length > 0) {
          const jobs = await Job.find({
            $or: [
              { title: { $regex: terms.join('|'), $options: 'i' } },
              { category: { $regex: terms.join('|'), $options: 'i' } }
            ],
            status: 'نشط'
          }).limit(3);

          if (jobs.length > 0) {
            finalResponse = `وجدت هذه الوظائف المتاحة لك 👇\n\n` +
              jobs.map(j => `🔹 **${j.title}** — 📍 ${j.location?.city || ''}`).join('\n\n') +
              `\n\nاستكشف المزيد في صفحة "البحث عن وظائف" 🔍`;
          }
        }
      }
    }

    // ══════════════════════════════════════════════════════
    // 5️⃣  رد ذكي افتراضي حسب نوع الرسالة
    // ══════════════════════════════════════════════════════
    if (!finalResponse) {
      const msg = message.toLowerCase();
      if (msg.includes('سيرة') || msg.includes('cv') || msg.includes('resume')) {
        finalResponse = 'لتحسين سيرتك الذاتية، اذهب لصفحة "باني السيرة الذاتية" 📄 واستخدم أداة التحليل الذكي التي ستعطيك اقتراحات مخصصة!';
      } else if (msg.includes('مقابلة') || msg.includes('interview')) {
        finalResponse = 'للتحضير للمقابلة 🎤، راجع أسئلة المقابلة الشائعة في مجالك، تدرب على إجاباتك بصوت عالٍ، وتأكد من البحث عن الشركة مسبقاً. هل تريد أسئلة تدريبية لمجال معين؟';
      } else if (msg.includes('راتب') || msg.includes('salary')) {
        finalResponse = 'الرواتب تختلف حسب المجال والخبرة والموقع 💰. يمكنك الاطلاع على متوسطات الرواتب في صفحة تحليل سوق العمل!';
      } else {
        finalResponse = 'مرحباً! 👋 أنا مساعدك الذكي في Jobify. يمكنني مساعدتك في:\n• البحث عن وظائف\n• تحسين سيرتك الذاتية\n• التحضير للمقابلات\n• نصائح مهنية\n\nكيف يمكنني مساعدتك اليوم؟ 😊';
      }
    }

    res.status(200).json({
      success: true,
      data: { response: finalResponse, usedAI, timestamp: new Date() }
    });

  } catch (error) {
    console.error('Assistant Error:', error);
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

module.exports = router;
