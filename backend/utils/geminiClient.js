const { GoogleGenerativeAI } = require('@google/generative-ai');
const { aiLogger } = require('./winstonLogger');

let geminiModel = null;

try {
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    const genAI = new GoogleGenerativeAI(key);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    aiLogger.info('✅ Gemini AI Engine Initialized');
  } else {
    aiLogger.warn('⚠️ GEMINI_API_KEY is missing. Generative features will fail.');
  }
} catch (error) {
  aiLogger.error(`Gemini Initialization Error: ${error.message}`);
}

const generateReasoning = async (prompt) => {
  if (!geminiModel) {
    throw new Error('Gemini model is not initialized (Missing API Key)');
  }
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
};

module.exports = {
  geminiModel,
  generateReasoning
};
