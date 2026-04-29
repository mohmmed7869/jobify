const { getCache, setCache } = require('./redisClient');
const { aiLogger, logAITrace } = require('./winstonLogger');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Enterprise AI Intent Classifier
 */
const IntentClassifier = (taskName) => {
  const task = taskName.toUpperCase();
  
  if (task.includes('MATCHING') || task.includes('SCORING') || task.includes('EVALUATION')) {
    return 'MUST_LOCAL';
  }
  
  if (task.includes('GENERATION') || task.includes('WRITING') || task.includes('DESC') || task.includes('IMPROVE')) {
    return 'GENERATION_TASKS';
  }
  
  if (task.includes('REASONING') || task.includes('CHAT') || task.includes('INTERVIEW_Q')) {
    return 'PREFERRED_GEMINI';
  }
  
  if (task.includes('HYBRID')) {
    return 'HYBRID';
  }

  return 'UNKNOWN';
};

class AIOrchestrator {
  
  _generateCacheKey(taskName, payload) {
    const hash = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex');
    return `AI_CACHE:${taskName}:${hash}`;
  }

  async routeRequest({ taskName, payload, localAIFunction, geminiFunction, useCache = true }) {
    const startTime = Date.now();
    const traceId = uuidv4();
    let cacheKey = null;
    
    if (useCache) {
      cacheKey = this._generateCacheKey(taskName, payload);
      const cachedResult = await getCache(cacheKey);
      
      if (cachedResult) {
        const latency = Date.now() - startTime;
        logAITrace({
          traceId, timestamp: new Date().toISOString(),
          input_preview: JSON.stringify(payload).substring(0, 100),
          task: taskName, chosen_layer: 'REDIS_CACHE',
          reason: 'Cache hit for identical previous request',
          latency_ms: latency
        });
        return {
          result: cachedResult, layer_used: 'REDIS_CACHE', cached: true,
          execution_time_ms: latency, confidence: 0.99, traceId
        };
      }
    }

    let finalResult = null;
    let chosenLayer = 'UNKNOWN';
    let reason = 'UNKNOWN';
    
    const intent = IntentClassifier(taskName);

    try {
      if (intent === 'MUST_LOCAL') {
        if (!localAIFunction) throw new Error('Local AI required for SCORING but not provided');
        chosenLayer = 'LOCAL_AI';
        reason = 'Task involves scoring/math, strictly routed to Local AI';
        finalResult = await localAIFunction(payload);

      } else if (intent === 'GENERATION_TASKS') {
        if (!geminiFunction) throw new Error('Gemini function required for GENERATION but not provided');
        chosenLayer = 'GEMINI_AI';
        reason = 'Task involves content generation, routed to Gemini';
        finalResult = await geminiFunction(payload);

      } else if (intent === 'PREFERRED_GEMINI') {
        if (geminiFunction) {
          chosenLayer = 'GEMINI_AI';
          reason = 'Task prefers reasoning, routed to Gemini';
          finalResult = await geminiFunction(payload);
        } else if (localAIFunction) {
          chosenLayer = 'LOCAL_AI_FALLBACK';
          reason = 'Gemini preferred but unavailable, using Local Fallback';
          finalResult = await localAIFunction(payload);
        }

      } else if (intent === 'HYBRID') {
        chosenLayer = 'HYBRID_AI';
        reason = 'Task uses both Local and Gemini AI';
        // In hybrid mode, try both or combine. Here we assume geminiFunction handles the hybrid logic internally, or we try gemini first.
        if (geminiFunction) {
          finalResult = await geminiFunction(payload);
        } else if (localAIFunction) {
          finalResult = await localAIFunction(payload);
        }

      } else {
        // Unknown Intent Fallback
        if (localAIFunction) {
          chosenLayer = 'LOCAL_AI_FALLBACK';
          reason = 'Unknown intent, defaulting to Local AI';
          finalResult = await localAIFunction(payload);
        } else if (geminiFunction) {
          chosenLayer = 'GEMINI_AI_FALLBACK';
          reason = 'Unknown intent, defaulting to Gemini AI';
          finalResult = await geminiFunction(payload);
        } else {
          chosenLayer = 'SYSTEM_FALLBACK';
          reason = 'No AI functions provided';
          finalResult = { fallback: true, message: '?? ???? ?????? ????? ??????' };
        }
      }

      // Safety check: Never return undefined
      if (finalResult === undefined || finalResult === null) {
        throw new Error('AI Layer returned null or undefined');
      }

      if (useCache && cacheKey && !finalResult.fallback) {
        await setCache(cacheKey, finalResult, 86400);
      }

      const latency = Date.now() - startTime;
      
      const tracePayload = {
        traceId, timestamp: new Date().toISOString(),
        input_preview: JSON.stringify(payload).substring(0, 100),
        task: taskName, chosen_layer: chosenLayer,
        reason: reason, latency_ms: latency, status: 'SUCCESS'
      };
      
      logAITrace(tracePayload);
      if (process.env.AI_DEBUG === 'true') aiLogger.debug(`[AI_DEBUG] Trace: ${JSON.stringify(tracePayload)}`);

      return {
        result: finalResult,
        layer_used: chosenLayer,
        cached: false,
        execution_time_ms: latency,
        confidence: finalResult.confidence || finalResult.score ? (finalResult.score / 100).toFixed(2) : 0.95,
        traceId
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      aiLogger.error(`AI Orchestrator Error in task ${taskName} [${traceId}]: ${error.message}`);
      
      logAITrace({
        traceId, timestamp: new Date().toISOString(),
        input_preview: JSON.stringify(payload).substring(0, 100),
        task: taskName, chosen_layer: chosenLayer,
        reason: `FAILED: ${error.message}`, latency_ms: latency, status: 'ERROR'
      });

      // Failsafe return
      return {
        result: { fallback: true, message: '??? ??? ????? ?? ???? ?????? ?????????' },
        layer_used: 'SYSTEM_ERROR_FALLBACK',
        cached: false,
        execution_time_ms: latency,
        confidence: 0,
        traceId
      };
    }
  }
}

module.exports = new AIOrchestrator();
