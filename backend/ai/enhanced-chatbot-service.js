/**
 * Enhanced ChatBot Service
 * Provides improved chatbot functionality with support for multiple languages,
 * accessibility features, and specialized assistance for different user groups.
 */

const { OpenAI } = require('openai');
const natural = require('natural');
const compromise = require('compromise');
const { NlpManager } = require('node-nlp');
const franc = require('franc');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

class EnhancedChatbotService {
  constructor() {
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
    });
    
    // Initialize NLP Manager for intent recognition
    this.nlpManager = new NlpManager({ 
      languages: ['ar', 'en', 'fr', 'es'],
      forceNER: true
    });
    
    // Load specialized models for different user groups
    this.userGroupModels = {
      'job_seeker': this.loadUserGroupModel('job_seeker'),
      'employer': this.loadUserGroupModel('employer'),
      'student': this.loadUserGroupModel('student'),
      'experienced': this.loadUserGroupModel('experienced'),
      'disabled': this.loadUserGroupModel('disabled'),
      'elderly': this.loadUserGroupModel('elderly')
    };
    
    // Initialize language detection
    this.languageDetector = {
      detect: (text) => {
        const langCode = franc(text);
        return this.mapLanguageCode(langCode);
      }
    };
    
    // Train NLP manager with intents
    this.trainNlpManager();
  }
  
  /**
   * Maps franc language codes to our supported languages
   */
  mapLanguageCode(code) {
    const mapping = {
      'ara': 'ar',
      'eng': 'en',
      'fra': 'fr',
      'spa': 'es',
      'und': 'ar' // Default to Arabic for undefined
    };
    
    return mapping[code] || 'ar';
  }
  
  /**
   * Loads specialized model for a specific user group
   */
  loadUserGroupModel(userGroup) {
    // In a real implementation, this would load specialized models
    // For now, we'll return configuration objects
    const models = {
      'job_seeker': {
        prompts: {
          'ar': 'أنا مساعد متخصص للباحثين عن عمل. كيف يمكنني مساعدتك اليوم؟',
          'en': 'I am a specialized assistant for job seekers. How can I help you today?'
        },
        topics: ['resume', 'job_search', 'interview_prep', 'skills', 'career_advice']
      },
      'employer': {
        prompts: {
          'ar': 'أنا مساعد متخصص لأصحاب العمل والشركات. كيف يمكنني مساعدتك اليوم؟',
          'en': 'I am a specialized assistant for employers and companies. How can I help you today?'
        },
        topics: ['candidate_search', 'job_posting', 'interview_management', 'hiring', 'talent_assessment']
      },
      'student': {
        prompts: {
          'ar': 'أنا مساعد متخصص للطلاب والخريجين الجدد. كيف يمكنني مساعدتك اليوم؟',
          'en': 'I am a specialized assistant for students and recent graduates. How can I help you today?'
        },
        topics: ['internships', 'entry_level', 'education', 'skills_development', 'career_start']
      },
      'experienced': {
        prompts: {
          'ar': 'أنا مساعد متخصص للمهنيين ذوي الخبرة. كيف يمكنني مساعدتك اليوم؟',
          'en': 'I am a specialized assistant for experienced professionals. How can I help you today?'
        },
        topics: ['career_advancement', 'leadership', 'salary_negotiation', 'industry_change', 'senior_roles']
      },
      'disabled': {
        prompts: {
          'ar': 'أنا مساعد متخصص للأشخاص ذوي الاحتياجات الخاصة. كيف يمكنني مساعدتك اليوم؟',
          'en': 'I am a specialized assistant for people with disabilities. How can I help you today?'
        },
        topics: ['accessible_jobs', 'workplace_accommodations', 'rights', 'specialized_programs', 'remote_work']
      },
      'elderly': {
        prompts: {
          'ar': 'أنا مساعد متخصص لكبار السن والمتقاعدين. كيف يمكنني مساعدتك اليوم؟',
          'en': 'I am a specialized assistant for seniors and retirees. How can I help you today?'
        },
        topics: ['part_time_work', 'retirement_planning', 'age_friendly_employers', 'skills_updating', 'consulting']
      }
    };
    
    return models[userGroup] || models['job_seeker'];
  }
  
  /**
   * Train NLP manager with intents for different languages
   */
  async trainNlpManager() {
    // Arabic intents
    this.nlpManager.addDocument('ar', 'أريد البحث عن وظيفة', 'intent.job_search');
    this.nlpManager.addDocument('ar', 'ساعدني في العثور على عمل', 'intent.job_search');
    this.nlpManager.addDocument('ar', 'أبحث عن فرص عمل', 'intent.job_search');
    
    this.nlpManager.addDocument('ar', 'حسن سيرتي الذاتية', 'intent.resume_help');
    this.nlpManager.addDocument('ar', 'راجع سيرتي الذاتية', 'intent.resume_help');
    this.nlpManager.addDocument('ar', 'كيف أطور سيرتي الذاتية', 'intent.resume_help');
    
    this.nlpManager.addDocument('ar', 'ساعدني للتحضير لمقابلة', 'intent.interview_prep');
    this.nlpManager.addDocument('ar', 'كيف أستعد لمقابلة عمل', 'intent.interview_prep');
    this.nlpManager.addDocument('ar', 'نصائح للمقابلات', 'intent.interview_prep');
    
    // English intents
    this.nlpManager.addDocument('en', 'I want to find a job', 'intent.job_search');
    this.nlpManager.addDocument('en', 'Help me find work', 'intent.job_search');
    this.nlpManager.addDocument('en', 'Looking for job opportunities', 'intent.job_search');
    
    this.nlpManager.addDocument('en', 'Improve my resume', 'intent.resume_help');
    this.nlpManager.addDocument('en', 'Review my CV', 'intent.resume_help');
    this.nlpManager.addDocument('en', 'How to enhance my resume', 'intent.resume_help');
    
    this.nlpManager.addDocument('en', 'Help me prepare for an interview', 'intent.interview_prep');
    this.nlpManager.addDocument('en', 'How to get ready for a job interview', 'intent.interview_prep');
    this.nlpManager.addDocument('en', 'Interview tips', 'intent.interview_prep');
    
    // Add more languages and intents as needed
    
    // Train the model
    await this.nlpManager.train();
  }
  
  /**
   * Process a user message and generate a response
   * @param {string} message - User message
   * @param {Object} userContext - User context including preferences and history
   * @returns {Promise<Object>} - Response object
   */
  async processMessage(message, userContext = {}) {
    try {
      // Detect language if not specified
      const language = userContext.language || this.languageDetector.detect(message);
      
      // Determine user group
      const userGroup = userContext.userGroup || 'job_seeker';
      
      // Get user group model
      const groupModel = this.userGroupModels[userGroup];
      
      // Analyze intent
      const nlpResult = await this.nlpManager.process(language, message);
      const intent = nlpResult.intent || 'unknown';
      const confidence = nlpResult.score || 0;
      
      // Generate response based on intent and user group
      let response;
      
      if (confidence > 0.7) {
        // Use intent-specific handling
        response = await this.handleIntent(intent, message, language, userGroup, userContext);
      } else {
        // Use general AI response
        response = await this.generateAIResponse(message, language, userGroup, userContext);
      }
      
      return {
        text: response,
        intent: intent,
        confidence: confidence,
        language: language,
        userGroup: userGroup,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Fallback response based on detected language
      const language = this.languageDetector.detect(message);
      const fallbackResponses = {
        'ar': 'عذراً، حدث خطأ أثناء معالجة رسالتك. هل يمكنك المحاولة مرة أخرى؟',
        'en': 'Sorry, there was an error processing your message. Could you try again?',
        'fr': 'Désolé, une erreur s\'est produite lors du traitement de votre message. Pourriez-vous réessayer?',
        'es': 'Lo siento, hubo un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?'
      };
      
      return {
        text: fallbackResponses[language] || fallbackResponses['ar'],
        intent: 'error',
        confidence: 0,
        language: language,
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Handle specific intents with specialized responses
   */
  async handleIntent(intent, message, language, userGroup, userContext) {
    switch (intent) {
      case 'intent.job_search':
        return await this.handleJobSearch(message, language, userGroup, userContext);
        
      case 'intent.resume_help':
        return await this.handleResumeHelp(message, language, userGroup, userContext);
        
      case 'intent.interview_prep':
        return await this.handleInterviewPrep(message, language, userGroup, userContext);
        
      default:
        return await this.generateAIResponse(message, language, userGroup, userContext);
    }
  }
  
  /**
   * Handle job search intent
   */
  async handleJobSearch(message, language, userGroup, userContext) {
    const responses = {
      'ar': {
        'job_seeker': 'يمكنني مساعدتك في البحث عن وظيفة مناسبة. هل يمكنك إخباري بمجال تخصصك والمهارات التي تمتلكها؟',
        'student': 'كطالب، يمكنني مساعدتك في البحث عن تدريب أو وظيفة بدوام جزئي. ما هو تخصصك الدراسي؟',
        'disabled': 'يمكنني مساعدتك في العثور على وظائف تدعم ذوي الاحتياجات الخاصة. هل تحتاج إلى ترتيبات خاصة في مكان العمل؟',
        'elderly': 'يمكنني مساعدتك في العثور على فرص عمل مناسبة لكبار السن، مثل العمل بدوام جزئي أو الاستشارات. ما هي خبراتك السابقة؟'
      },
      'en': {
        'job_seeker': 'I can help you find a suitable job. Can you tell me about your field of expertise and the skills you have?',
        'student': 'As a student, I can help you find an internship or part-time job. What is your field of study?',
        'disabled': 'I can help you find jobs that support people with disabilities. Do you need any special accommodations in the workplace?',
        'elderly': 'I can help you find suitable job opportunities for seniors, such as part-time work or consulting. What is your previous experience?'
      }
    };
    
    // Get appropriate response or default to general response
    return responses[language]?.[userGroup] || 
           responses['ar']['job_seeker'] || 
           await this.generateAIResponse(message, language, userGroup, userContext);
  }
  
  /**
   * Handle resume help intent
   */
  async handleResumeHelp(message, language, userGroup, userContext) {
    const responses = {
      'ar': {
        'job_seeker': 'يمكنني مساعدتك في تحسين سيرتك الذاتية. هل ترغب في تحليل سيرتك الحالية أو الحصول على نصائح لإنشاء سيرة جديدة؟',
        'student': 'كطالب، يمكنني مساعدتك في إنشاء سيرة ذاتية تبرز مهاراتك الأكاديمية وأنشطتك اللاصفية. هل لديك سيرة ذاتية بالفعل؟',
        'experienced': 'يمكنني مساعدتك في تحديث سيرتك الذاتية لتناسب المناصب القيادية. هل ترغب في التركيز على إنجازات معينة؟'
      },
      'en': {
        'job_seeker': 'I can help you improve your resume. Would you like to analyze your current resume or get tips for creating a new one?',
        'student': 'As a student, I can help you create a resume that highlights your academic skills and extracurricular activities. Do you already have a resume?',
        'experienced': 'I can help you update your resume to suit leadership positions. Would you like to focus on specific achievements?'
      }
    };
    
    return responses[language]?.[userGroup] || 
           responses['ar']['job_seeker'] || 
           await this.generateAIResponse(message, language, userGroup, userContext);
  }
  
  /**
   * Handle interview preparation intent
   */
  async handleInterviewPrep(message, language, userGroup, userContext) {
    const responses = {
      'ar': {
        'job_seeker': 'يمكنني مساعدتك في التحضير للمقابلة. هل هي مقابلة تقنية أم سلوكية؟ وما هو المنصب الذي تتقدم له؟',
        'student': 'كطالب، يمكنني مساعدتك في التحضير لمقابلة التدريب أو الوظيفة الأولى. ما هو القطاع الذي تستهدفه؟',
        'disabled': 'يمكنني مساعدتك في التحضير للمقابلة مع نصائح حول كيفية مناقشة احتياجاتك الخاصة بشكل مهني. هل لديك أسئلة محددة؟'
      },
      'en': {
        'job_seeker': 'I can help you prepare for the interview. Is it a technical or behavioral interview? And what position are you applying for?',
        'student': 'As a student, I can help you prepare for an internship or first job interview. What sector are you targeting?',
        'disabled': 'I can help you prepare for the interview with tips on how to professionally discuss your special needs. Do you have specific questions?'
      }
    };
    
    return responses[language]?.[userGroup] || 
           responses['ar']['job_seeker'] || 
           await this.generateAIResponse(message, language, userGroup, userContext);
  }
  
  /**
   * Generate AI response using OpenAI
   */
  async generateAIResponse(message, language, userGroup, userContext) {
    try {
      const groupModel = this.userGroupModels[userGroup];
      const systemPrompt = groupModel.prompts[language] || groupModel.prompts['ar'];
      
      // Build conversation history
      const conversationHistory = userContext.history || [];
      
      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: message }
      ];
      
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: parseInt(process.env.MAX_TOKENS || '500'),
        temperature: 0.7,
      });
      
      return completion.choices[0].message.content;
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback responses
      const fallbackResponses = {
        'ar': 'عذراً، لم أتمكن من الحصول على رد من نظام الذكاء الاصطناعي. هل يمكنك إعادة صياغة سؤالك؟',
        'en': 'Sorry, I couldn\'t get a response from the AI system. Could you rephrase your question?',
        'fr': 'Désolé, je n\'ai pas pu obtenir une réponse du système d\'IA. Pourriez-vous reformuler votre question?',
        'es': 'Lo siento, no pude obtener una respuesta del sistema de IA. ¿Podrías reformular tu pregunta?'
      };
      
      return fallbackResponses[language] || fallbackResponses['ar'];
    }
  }
  
  /**
   * Analyze user sentiment
   */
  analyzeSentiment(message, language) {
    if (language === 'en') {
      const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
      const tokenizer = new natural.WordTokenizer();
      const tokens = tokenizer.tokenize(message);
      return analyzer.getSentiment(tokens);
    }
    
    // For non-English languages, use a simpler approach
    // This is a placeholder - in a real system you'd use language-specific sentiment analyzers
    const positiveWords = {
      'ar': ['جيد', 'رائع', 'ممتاز', 'سعيد', 'شكرا'],
      'fr': ['bon', 'super', 'excellent', 'heureux', 'merci'],
      'es': ['bueno', 'genial', 'excelente', 'feliz', 'gracias']
    };
    
    const negativeWords = {
      'ar': ['سيء', 'حزين', 'غاضب', 'محبط', 'مشكلة'],
      'fr': ['mauvais', 'triste', 'fâché', 'frustré', 'problème'],
      'es': ['malo', 'triste', 'enojado', 'frustrado', 'problema']
    };
    
    const langPositive = positiveWords[language] || [];
    const langNegative = negativeWords[language] || [];
    
    let score = 0;
    const lowerMessage = message.toLowerCase();
    
    langPositive.forEach(word => {
      if (lowerMessage.includes(word)) score += 1;
    });
    
    langNegative.forEach(word => {
      if (lowerMessage.includes(word)) score -= 1;
    });
    
    return score / (langPositive.length + langNegative.length);
  }
  
  /**
   * Get quick reply suggestions based on context
   */
  getSuggestions(intent, language, userGroup) {
    const suggestions = {
      'intent.job_search': {
        'ar': [
          'ما هي أفضل المواقع للبحث عن وظائف؟',
          'كيف أحسن استراتيجية البحث عن وظيفة؟',
          'ما هي المهارات الأكثر طلباً في سوق العمل؟'
        ],
        'en': [
          'What are the best websites to search for jobs?',
          'How can I improve my job search strategy?',
          'What skills are most in demand in the job market?'
        ]
      },
      'intent.resume_help': {
        'ar': [
          'ما هي أهم العناصر في السيرة الذاتية؟',
          'كيف أبرز إنجازاتي في السيرة الذاتية؟',
          'هل يمكنك مراجعة سيرتي الذاتية؟'
        ],
        'en': [
          'What are the most important elements in a resume?',
          'How can I highlight my achievements in my resume?',
          'Can you review my resume?'
        ]
      },
      'intent.interview_prep': {
        'ar': [
          'ما هي الأسئلة الشائعة في المقابلات؟',
          'كيف أتعامل مع الأسئلة الصعبة؟',
          'نصائح للتحضير لمقابلة عبر الفيديو'
        ],
        'en': [
          'What are common interview questions?',
          'How do I handle difficult questions?',
          'Tips for preparing for a video interview'
        ]
      }
    };
    
    // Get suggestions for the detected intent and language
    return suggestions[intent]?.[language] || suggestions['intent.job_search']['ar'];
  }
}

module.exports = EnhancedChatbotService;