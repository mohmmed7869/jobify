const { getCache, setCache } = require('./redisClient');
const { aiLogger, logAITrace } = require('./winstonLogger');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * AI Router & Orchestrator
 * This is the central brain that decides WHEN to use Local AI, WHEN to use Gemini,
 * and WHEN to use Cache. It strictly enforces the Enterprise boundary:
 * Scoring = Local Math Only. Reasoning = Gemini Only.
 */
class AIOrchestrator {
  
  /**
   * Generates a unique cache key based on the task and input payload
   */
  _generateCacheKey(taskName, payload) {
    const hash = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex');
    return `AI_CACHE:${taskName}:${hash}`;
  }

  /**
   * Main Router Method
   * @param {string} taskName - Name of the task (e.g., 'CV_MATCHING', 'INTERVIEW_QUESTIONS')
   * @param {object} payload - The input data for the task
   * @param {function} localAIFunction - Callback for Local AI processing (Math/Scoring)
   * @param {function} geminiFunction - Callback for Gemini AI processing (Reasoning/Chat)
   * @param {boolean} useCache - Whether to check/set cache for this request
   */
  async routeRequest({ taskName, payload, localAIFunction, geminiFunction, useCache = true }) {
    const startTime = Date.now();
    const traceId = uuidv4();
    let cacheKey = null;
    
    // 1. Check Cache Layer (If enabled for this task)
    if (useCache) {
      cacheKey = this._generateCacheKey(taskName, payload);
      const cachedResult = await getCache(cacheKey);
      
      if (cachedResult) {
        const latency = Date.now() - startTime;
        logAITrace({
          traceId,
          timestamp: new Date().toISOString(),
          input_preview: JSON.stringify(payload).substring(0, 100),
          task: taskName,
          chosen_layer: 'REDIS_CACHE',
          reason: 'Cache hit for identical previous request',
          latency_ms: latency
        });
        return {
          result: cachedResult,
          layer_used: 'REDIS_CACHE',
          cached: true,
          execution_time_ms: latency,
          traceId
        };
      }
    }

    let finalResult = null;
    let chosenLayer = 'UNKNOWN';
    let reason = 'UNKNOWN';

    try {
      // 2. Strict Boundary Enforcement
      if (taskName.includes('MATCHING') || taskName.includes('SCORING') || taskName.includes('EVALUATION')) {
        // SCORING -> STRICTLY LOCAL AI
        if (!localAIFunction) {
          throw new Error('Local AI Function must be provided for SCORING tasks to avoid Gemini hallucination and cost.');
        }
        
        chosenLayer = 'LOCAL_AI';
        reason = 'Task involves scoring or math, strict local processing required';
        finalResult = await localAIFunction(payload);

      } else if (taskName.includes('REASONING') || taskName.includes('CHAT') || taskName.includes('GENERATION')) {
        // REASONING -> GEMINI ALLOWED
        if (!geminiFunction) {
          throw new Error('Gemini Function must be provided for GENERATION/REASONING tasks.');
        }

        chosenLayer = 'GEMINI_AI';
        reason = 'Task involves text generation or reasoning, passing to Google Gemini';
        finalResult = await geminiFunction(payload);

      } else {
        // Fallback for unknown tasks (try local, then fallback)
        if (localAIFunction) {
          chosenLayer = 'LOCAL_AI_FALLBACK';
          reason = 'Unknown task type, defaulting to safe Local AI';
          finalResult = await localAIFunction(payload);
        } else {
          throw new Error('No appropriate AI processor available for this task type');
        }
      }

      // 3. Save to Cache
      if (useCache && cacheKey && finalResult) {
        // Store for 24 hours (86400 seconds) by default
        await setCache(cacheKey, finalResult, 86400);
      }

      const latency = Date.now() - startTime;
      
      // 4. Log AI Decision Trace (Observability)
      const tracePayload = {
        traceId,
        timestamp: new Date().toISOString(),
        input_preview: JSON.stringify(payload).substring(0, 100),
        task: taskName,
        chosen_layer: chosenLayer,
        reason: reason,
        latency_ms: latency,
        status: 'SUCCESS'
      };
      
      logAITrace(tracePayload);

      // AI Debug Mode
      if (process.env.AI_DEBUG === 'true') {
        aiLogger.debug(`[AI_DEBUG] Trace: ${JSON.stringify(tracePayload)}`);
      }

      return {
        result: finalResult,
        layer_used: chosenLayer,
        cached: false,
        execution_time_ms: latency,
        traceId
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      aiLogger.error(`AI Orchestrator Error in task ${taskName} [${traceId}]: ${error.message}`);
      
      logAITrace({
        traceId,
        timestamp: new Date().toISOString(),
        input_preview: JSON.stringify(payload).substring(0, 100),
        task: taskName,
        chosen_layer: chosenLayer,
        reason: `FAILED: ${error.message}`,
        latency_ms: latency,
        status: 'ERROR'
      });

      throw error;
    }
  }
}

module.exports = new AIOrchestrator();
