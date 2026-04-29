require('dotenv').config();
const aiOrchestrator = require('./utils/aiOrchestrator');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🚀 بدء مرحلة System Validation Test 🚀\n');

  // ════════════════════════════════════════════
  // Test 1: Cache Effectiveness
  // ════════════════════════════════════════════
  console.log('--- 🧪 Test 1: Cache Effectiveness ---');
  const payload1 = { resumeText: 'React, Node.js, 5 years exp', jobId: '123' };
  
  console.log('الطلب الأول (Expected: Cache Miss)...');
  const res1 = await aiOrchestrator.routeRequest({
    taskName: 'RESUME_ANALYSIS_SCORING',
    payload: payload1,
    useCache: true,
    localAIFunction: async () => {
      await delay(500); // Simulate heavy TF-IDF calculation
      return { score: 85, skills: ['React', 'Node.js'] };
    }
  });
  console.log(`✅ نتيجة الطلب الأول: Latency=${res1.execution_time_ms}ms | Cached=${res1.cached} | Layer=${res1.layer_used} | Confidence=${res1.confidence}`);

  console.log('\nالطلب الثاني لنفس البيانات (Expected: Cache Hit)...');
  const res2 = await aiOrchestrator.routeRequest({
    taskName: 'RESUME_ANALYSIS_SCORING',
    payload: payload1,
    useCache: true,
    localAIFunction: async () => {
      await delay(500); 
      return { score: 85, skills: ['React', 'Node.js'] };
    }
  });
  console.log(`✅ نتيجة الطلب الثاني: Latency=${res2.execution_time_ms}ms | Cached=${res2.cached} | Layer=${res2.layer_used} | Confidence=${res2.confidence}\n`);

  // ════════════════════════════════════════════
  // Test 2: Routing Accuracy
  // ════════════════════════════════════════════
  console.log('--- 🧪 Test 2: Routing Accuracy ---');
  const chatRes = await aiOrchestrator.routeRequest({
    taskName: 'CHAT_REASONING',
    payload: { message: 'كيف أحسن سيرتي؟' },
    useCache: false,
    geminiFunction: async () => {
      await delay(300);
      return 'نصائح لتحسين السيرة...';
    }
  });
  console.log(`✅ Routing (Reasoning): Layer=${chatRes.layer_used} | Expected=GEMINI_AI`);

  const scoreRes = await aiOrchestrator.routeRequest({
    taskName: 'CV_MATCHING_SCORING',
    payload: { matchId: 1 },
    useCache: false,
    localAIFunction: async () => {
      return { score: 92 };
    }
  });
  console.log(`✅ Routing (Scoring): Layer=${scoreRes.layer_used} | Expected=LOCAL_AI\n`);

  // ════════════════════════════════════════════
  // Test 3: Load Simulation
  // ════════════════════════════════════════════
  console.log('--- 🧪 Test 3: Load Simulation (50 Concurrent Requests) ---');
  const promises = [];
  const startLoadTime = Date.now();
  for (let i = 0; i < 50; i++) {
    promises.push(
      aiOrchestrator.routeRequest({
        taskName: `BULK_MATCHING_SCORING`,
        payload: { cvId: i },
        useCache: true,
        localAIFunction: async () => {
          await delay(Math.random() * 50); // random minor delay
          return { score: Math.floor(Math.random() * 100) };
        }
      })
    );
  }

  try {
    const results = await Promise.all(promises);
    const endLoadTime = Date.now();
    const successful = results.filter(r => r.result).length;
    console.log(`✅ تمت معالجة ${successful}/50 طلب متزامن بنجاح.`);
    console.log(`⏳ الوقت الإجمالي للـ 50 طلب: ${endLoadTime - startLoadTime}ms`);
    console.log(`📊 أقصى Latency في الطلبات: ${Math.max(...results.map(r => r.execution_time_ms))}ms`);
  } catch (error) {
    console.error('❌ انهار النظام تحت الضغط:', error.message);
  }

  process.exit(0);
}

runTests();
