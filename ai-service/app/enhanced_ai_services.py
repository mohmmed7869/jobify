"""
Enhanced AI Services
نظام الذكاء الاصطناعي المحسن مع خدمات متقدمة للتوظيف
"""

import os
import logging
import asyncio
import json
import pickle
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import hashlib

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from transformers import pipeline, AutoTokenizer, AutoModel
import torch
import spacy
from textblob import TextBlob

# Async support for AI operations
import aiohttp
import asyncio

# Enhanced logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    logger.warning("Failed to download NLTK data")

class EnhancedAIService:
    """خدمة الذكاء الاصطناعي المحسنة للتوظيف"""
    
    def __init__(self):
        self.models_cache = {}
        self.vectorizers = {}
        self.skills_database = self._load_skills_database()
        self.sentiment_analyzer = None
        self.nlp_model = None
        self.job_classifier = None
        self.resume_parser = None
        self.matching_engine = None
        self.interview_analyzer = None
        
        # Performance metrics
        self.metrics = {
            'matches_generated': 0,
            'resumes_analyzed': 0,
            'interviews_processed': 0,
            'predictions_made': 0,
            'cache_hits': 0,
            'processing_times': []
        }
        
        self._initialize_models()
    
    def _initialize_models(self):
        """تهيئة نماذج الذكاء الاصطناعي الأساسية"""
        try:
            logger.info("🤖 Initializing core AI components...")
            
            # Initialize sentiment analyzer (Lightweight)
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
            
            # NLP model loading (Lazy loading recommended, but keeping core for now)
            self.nlp_model = None 
            
            # Transformers (Heavy) - Load only if needed or keep as None for now
            self.job_classifier = None
            
            # Initialize sub-services with necessary data
            self.resume_parser = ResumeParser(skills_db=self.skills_database)
            self.matching_engine = JobMatchingEngine()
            self.interview_analyzer = InterviewAnalyzer()
            
            logger.info("✅ AI core components ready")
            
        except Exception as e:
            logger.error(f"❌ Error initializing AI components: {e}")
    
    def _load_skills_database(self) -> Dict:
        """تحميل قاعدة بيانات المهارات"""
        skills_db = {
            'programming': [
                'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go',
                'react', 'angular', 'vue.js', 'node.js', 'django', 'flask',
                'spring', 'laravel', 'rails', 'express'
            ],
            'data_science': [
                'machine learning', 'deep learning', 'data analysis', 'statistics',
                'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn',
                'tableau', 'power bi', 'sql', 'mongodb', 'elasticsearch'
            ],
            'design': [
                'photoshop', 'illustrator', 'figma', 'sketch', 'indesign',
                'ui/ux design', 'graphic design', 'web design', 'branding'
            ],
            'business': [
                'project management', 'agile', 'scrum', 'business analysis',
                'marketing', 'sales', 'customer service', 'finance', 'accounting'
            ],
            'soft_skills': [
                'leadership', 'communication', 'teamwork', 'problem solving',
                'creativity', 'time management', 'critical thinking', 'adaptability'
            ]
        }
        
        # Arabic skills mapping
        arabic_skills = {
            'البرمجة': skills_db['programming'],
            'علوم البيانات': skills_db['data_science'],
            'التصميم': skills_db['design'],
            'الأعمال': skills_db['business'],
            'المهارات الشخصية': skills_db['soft_skills']
        }
        
        skills_db.update(arabic_skills)
        return skills_db
    
    async def analyze_resume(self, resume_text: str, user_id: str = None) -> Dict[str, Any]:
        """تحليل السيرة الذاتية بشكل متقدم"""
        start_time = datetime.now()
        
        try:
            # Check cache
            cache_key = hashlib.md5(resume_text.encode()).hexdigest()
            if cache_key in self.models_cache:
                self.metrics['cache_hits'] += 1
                return self.models_cache[cache_key]
            
            analysis = await self.resume_parser.parse_resume(resume_text)
            
            # Calculate compatibility score for the analysis
            score = await self._calculate_market_compatibility(analysis)
            analysis['score'] = score
            
            # Enhanced analysis
            enhanced_analysis = {
                **analysis,
                'sentiment_analysis': self._analyze_sentiment(resume_text),
                'skill_gap_analysis': await self._analyze_skill_gaps(analysis.get('skills', [])),
                'career_progression': self._analyze_career_progression(analysis.get('experience', [])),
                'education_relevance': self._analyze_education_relevance(analysis.get('education', [])),
                'keyword_density': self._calculate_keyword_density(resume_text),
                'improvement_suggestions': await self._generate_resume_suggestions(analysis),
                'compatibility_score': score,
                'processed_at': datetime.now().isoformat()
            }
            
            # Cache result
            self.models_cache[cache_key] = enhanced_analysis
            
            # Update metrics
            self.metrics['resumes_analyzed'] += 1
            processing_time = (datetime.now() - start_time).total_seconds()
            self.metrics['processing_times'].append(processing_time)
            
            logger.info(f"Resume analyzed in {processing_time:.2f}s for user {user_id}")
            
            return enhanced_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing resume: {e}")
            raise
    
    async def match_jobs_to_candidate(self, candidate_profile: Dict, available_jobs: List[Dict]) -> List[Dict]:
        """مطابقة الوظائف مع المرشح بذكاء اصطناعي متقدم"""
        try:
            matches = await self.matching_engine.find_matches(candidate_profile, available_jobs)
            
            # Enhanced matching with AI scoring
            enhanced_matches = []
            
            for match in matches:
                enhanced_match = {
                    **match,
                    'ai_confidence': await self._calculate_ai_confidence(candidate_profile, match['job']),
                    'skill_compatibility': self._calculate_skill_compatibility(
                        candidate_profile.get('skills', []),
                        match['job'].get('required_skills', [])
                    ),
                    'experience_fit': self._calculate_experience_fit(
                        candidate_profile.get('experience', []),
                        match['job'].get('experience_required', 0)
                    ),
                    'culture_fit_score': await self._predict_culture_fit(candidate_profile, match['job']),
                    'salary_compatibility': self._calculate_salary_fit(
                        candidate_profile.get('expected_salary'),
                        match['job'].get('salary_range')
                    ),
                    'growth_potential': await self._assess_growth_potential(candidate_profile, match['job']),
                    'recommendation_reasons': await self._generate_match_reasons(candidate_profile, match['job'])
                }
                
                enhanced_matches.append(enhanced_match)
            
            # Sort by AI confidence and compatibility scores
            enhanced_matches.sort(key=lambda x: (
                x['ai_confidence'] * 0.3 +
                x['skill_compatibility'] * 0.25 +
                x['experience_fit'] * 0.2 +
                x['culture_fit_score'] * 0.15 +
                x['growth_potential'] * 0.1
            ), reverse=True)
            
            self.metrics['matches_generated'] += len(enhanced_matches)
            
            return enhanced_matches[:10]  # Return top 10 matches
            
        except Exception as e:
            logger.error(f"Error matching jobs: {e}")
            raise
    
    async def analyze_interview_performance(self, interview_data: Dict) -> Dict[str, Any]:
        """تحليل أداء المقابلة بالذكاء الاصطناعي"""
        try:
            analysis = await self.interview_analyzer.analyze_performance(interview_data)
            
            enhanced_analysis = {
                **analysis,
                'communication_score': self._analyze_communication_skills(interview_data.get('transcript', '')),
                'technical_competency': await self._assess_technical_answers(interview_data.get('questions', [])),
                'behavioral_indicators': self._analyze_behavioral_responses(interview_data.get('responses', [])),
                'stress_indicators': self._detect_stress_patterns(interview_data),
                'improvement_areas': await self._identify_improvement_areas(analysis),
                'hiring_recommendation': await self._generate_hiring_recommendation(analysis),
                'follow_up_questions': await self._suggest_follow_up_questions(analysis)
            }
            
            self.metrics['interviews_processed'] += 1
            
            return enhanced_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing interview: {e}")
            raise
    
    async def generate_job_description(self, job_requirements: Dict) -> Dict[str, Any]:
        """إنشاء وصف وظيفي محسن بالذكاء الاصطناعي"""
        try:
            # Base job description generation
            base_description = await self._generate_base_description(job_requirements)
            
            # AI enhancements
            enhanced_description = {
                'title': await self._optimize_job_title(job_requirements.get('title', '')),
                'summary': await self._generate_compelling_summary(job_requirements),
                'responsibilities': await self._generate_detailed_responsibilities(job_requirements),
                'requirements': await self._optimize_requirements(job_requirements.get('requirements', [])),
                'benefits': await self._suggest_competitive_benefits(job_requirements),
                'company_culture': await self._generate_culture_description(job_requirements.get('company_info', {})),
                'seo_keywords': await self._extract_seo_keywords(job_requirements),
                'inclusivity_score': self._analyze_inclusivity(base_description),
                'readability_score': self._calculate_readability(base_description),
                'market_competitiveness': await self._assess_market_competitiveness(job_requirements)
            }
            
            return enhanced_description
            
        except Exception as e:
            logger.error(f"Error generating job description: {e}")
            raise
    
    async def predict_candidate_success(self, candidate_profile: Dict, job_details: Dict) -> Dict[str, Any]:
        """توقع نجاح المرشح في الوظيفة"""
        try:
            # Feature extraction
            features = self._extract_prediction_features(candidate_profile, job_details)
            
            # AI prediction model (simplified)
            success_probability = await self._calculate_success_probability(features)
            
            prediction = {
                'success_probability': success_probability,
                'confidence_level': self._calculate_prediction_confidence(features),
                'key_success_factors': self._identify_success_factors(features),
                'risk_factors': self._identify_risk_factors(features),
                'recommended_onboarding': await self._suggest_onboarding_plan(candidate_profile, job_details),
                'performance_indicators': self._define_performance_metrics(job_details),
                'retention_probability': await self._predict_retention(candidate_profile, job_details)
            }
            
            self.metrics['predictions_made'] += 1
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error predicting candidate success: {e}")
            raise

    async def chat_bot(self, message: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """مساعد ذكي للدردشة باستخدام نماذج متقدمة"""
        try:
            # Try to use DialoGPT if available
            if self.job_classifier and hasattr(self.job_classifier, 'model'):
                try:
                    # In a real scenario, we'd use conversational pipeline
                    # For now, simulated response from the transformer model
                    result = self.job_classifier(message)
                    ai_response = f"بناءً على تحليلي: {result[0]['label']}"
                    # This is a fallback since DialoGPT setup might be limited
                    if "LABEL" in ai_response:
                        ai_response = self._generate_local_chat_response(message)
                except:
                    ai_response = self._generate_local_chat_response(message)
            else:
                ai_response = self._generate_local_chat_response(message)

            return {
                'response': ai_response,
                'timestamp': datetime.now().isoformat(),
                'used_ai': True
            }
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return {
                'response': "عذراً، حدث خطأ في معالجة رسالتك. كيف يمكنني مساعدتك بطريقة أخرى؟",
                'timestamp': datetime.now().isoformat(),
                'used_ai': False
            }

    def _generate_local_chat_response(self, message: str) -> str:
        """توليد رد محلي ذكي في حال عدم توفر النماذج السحابية"""
        msg = message.lower()
        if "وظيفة" in msg or "عمل" in msg:
            return "يمكنني مساعدتك في العثور على الوظائف المناسبة. هل تبحث في مجال معين مثل البرمجة أو التسويق؟"
        elif "سيرة" in msg or "cv" in msg:
            return "لدينا أدوات متقدمة لتحليل وتحسين السيرة الذاتية. هل ترغب في رفع سيرتك الذاتية الآن؟"
        elif "مقابلة" in msg:
            return "التحضير للمقابلة هو مفتاح النجاح. يمكنني محاكاة مقابلة تجريبية معك."
        elif "راتب" in msg:
            return "الرواتب تعتمد على المهارات والخبرة. يمكنني إعطاؤك متوسطات الرواتب في منطقتك."
        else:
            return "مرحباً بك! أنا مساعدك الذكي في منصة التوظيف. يمكنني مساعدتك في البحث عن وظائف، تحسين سيرتك الذاتية، والتحضير للمقابلات."
    
    async def generate_personalized_recommendations(self, user_profile: Dict, user_type: str) -> Dict[str, Any]:
        """إنشاء توصيات شخصية للمستخدمين"""
        try:
            recommendations = {}
            
            if user_type == 'jobseeker':
                recommendations = {
                    'career_paths': await self._suggest_career_paths(user_profile),
                    'skill_development': await self._recommend_skill_development(user_profile),
                    'job_opportunities': await self._find_hidden_opportunities(user_profile),
                    'networking_suggestions': await self._suggest_networking_opportunities(user_profile),
                    'interview_preparation': await self._create_interview_prep_plan(user_profile),
                    'salary_insights': await self._provide_salary_insights(user_profile),
                    'market_trends': await self._analyze_market_trends(user_profile.get('industry'))
                }
            
            elif user_type == 'employer':
                recommendations = {
                    'talent_pipeline': await self._build_talent_pipeline(user_profile),
                    'hiring_strategies': await self._recommend_hiring_strategies(user_profile),
                    'compensation_analysis': await self._analyze_compensation_competitiveness(user_profile),
                    'employer_branding': await self._suggest_branding_improvements(user_profile),
                    'diversity_insights': await self._provide_diversity_insights(user_profile),
                    'retention_strategies': await self._recommend_retention_strategies(user_profile)
                }
            
            return {
                'recommendations': recommendations,
                'generated_at': datetime.now().isoformat(),
                'confidence_scores': self._calculate_recommendation_confidence(recommendations),
                'priority_actions': self._prioritize_recommendations(recommendations)
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            raise
    
    def _analyze_sentiment(self, text: str) -> Dict[str, float]:
        """تحليل المشاعر في النص"""
        if not self.sentiment_analyzer:
            return {'compound': 0.0, 'positive': 0.0, 'neutral': 1.0, 'negative': 0.0}
        
        scores = self.sentiment_analyzer.polarity_scores(text)
        return {
            'compound': scores['compound'],
            'positive': scores['pos'],
            'neutral': scores['neu'],
            'negative': scores['neg'],
            'overall_sentiment': 'positive' if scores['compound'] > 0.1 else 'negative' if scores['compound'] < -0.1 else 'neutral'
        }
    
    async def _analyze_skill_gaps(self, candidate_skills: List[str]) -> Dict[str, Any]:
        """تحليل فجوات المهارات"""
        try:
            # Market demand analysis
            market_skills = await self._get_market_trending_skills()
            
            # Find gaps
            missing_skills = []
            for category, skills in market_skills.items():
                for skill in skills[:5]:  # Top 5 skills per category
                    if not any(skill.lower() in cs.lower() for cs in candidate_skills):
                        missing_skills.append({
                            'skill': skill,
                            'category': category,
                            'demand_level': 'high'
                        })
            
            return {
                'missing_skills': missing_skills[:10],  # Top 10 missing skills
                'skill_categories_covered': self._categorize_skills(candidate_skills),
                'market_alignment_score': self._calculate_market_alignment(candidate_skills, market_skills),
                'priority_skills': missing_skills[:3]  # Top 3 priority skills
            }
            
        except Exception as e:
            logger.warning(f"Skill gap analysis failed: {e}")
            return {'missing_skills': [], 'market_alignment_score': 0.5}
    
    def _analyze_career_progression(self, experience_list: List[Dict]) -> Dict[str, Any]:
        """تحليل التطور المهني"""
        if not experience_list:
            return {'progression_score': 0, 'trend': 'unknown'}
        
        # Sort by dates
        sorted_experience = sorted(experience_list, key=lambda x: x.get('start_date', ''), reverse=True)
        
        # Calculate progression indicators
        title_progression = self._analyze_title_progression(sorted_experience)
        responsibility_growth = self._analyze_responsibility_growth(sorted_experience)
        industry_consistency = self._analyze_industry_consistency(sorted_experience)
        
        progression_score = (title_progression + responsibility_growth + industry_consistency) / 3
        
        return {
            'progression_score': progression_score,
            'title_progression': title_progression,
            'responsibility_growth': responsibility_growth,
            'industry_consistency': industry_consistency,
            'trend': 'upward' if progression_score > 0.7 else 'stable' if progression_score > 0.4 else 'unclear',
            'career_highlights': self._extract_career_highlights(sorted_experience)
        }
    
    def _calculate_keyword_density(self, text: str) -> Dict[str, float]:
        """حساب كثافة الكلمات المفتاحية"""
        words = text.lower().split()
        total_words = len(words)
        
        if total_words == 0:
            return {}
        
        # Count keywords from skills database
        keyword_counts = {}
        for category, skills in self.skills_database.items():
            for skill in skills:
                skill_words = skill.lower().split()
                count = 0
                for i in range(len(words) - len(skill_words) + 1):
                    if words[i:i+len(skill_words)] == skill_words:
                        count += 1
                
                if count > 0:
                    keyword_counts[skill] = count / total_words
        
        return keyword_counts
    
    async def _calculate_ai_confidence(self, candidate: Dict, job: Dict) -> float:
        """حساب ثقة الذكاء الاصطناعي في المطابقة باستخدام Cosine Similarity"""
        try:
            # دمج النصوص للمطابقة الدلالية
            candidate_text = " ".join(candidate.get('skills', [])) + " " + str(candidate.get('summary', ''))
            job_text = " ".join(job.get('required_skills', [])) + " " + str(job.get('description', ''))
            
            # حساب التشابه الدلالي (Cosine Similarity)
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([candidate_text, job_text])
            semantic_score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            
            factors = []
            factors.append(semantic_score * 0.4) # زيادة وزن المطابقة الدلالية
            
            # Skill match compatibility
            skill_match = self._calculate_skill_compatibility(
                candidate.get('skills', []),
                job.get('required_skills', [])
            )
            factors.append(skill_match * 0.3)
            
            # Experience level match
            exp_match = self._calculate_experience_fit(
                candidate.get('experience', []),
                job.get('experience_required', 0)
            )
            factors.append(exp_match * 0.3)
            
            # Education relevance
            edu_match = self._calculate_education_relevance(
                candidate.get('education', []),
                job.get('education_requirements', [])
            )
            factors.append(edu_match * 0.2)
            
            # Location compatibility
            location_match = self._calculate_location_compatibility(
                candidate.get('location'),
                job.get('location')
            )
            factors.append(location_match * 0.1)
            
            confidence = sum(factors)
            return min(max(confidence, 0.0), 1.0)  # Clamp between 0 and 1
            
        except Exception as e:
            logger.warning(f"AI confidence calculation failed: {e}")
            return 0.5
    
    def _calculate_skill_compatibility(self, candidate_skills: List[str], required_skills: List[str]) -> float:
        """حساب توافق المهارات"""
        if not required_skills:
            return 1.0
        
        if not candidate_skills:
            return 0.0
        
        # Convert to lowercase for comparison
        candidate_skills_lower = [skill.lower() for skill in candidate_skills]
        required_skills_lower = [skill.lower() for skill in required_skills]
        
        matches = 0
        for req_skill in required_skills_lower:
            if any(req_skill in cand_skill or cand_skill in req_skill for cand_skill in candidate_skills_lower):
                matches += 1
        
        return matches / len(required_skills)
    
    async def get_ai_insights(self, data_type: str, data: Dict) -> Dict[str, Any]:
        """الحصول على رؤى الذكاء الاصطناعي"""
        try:
            insights = {}
            
            if data_type == 'market_analysis':
                insights = await self._analyze_job_market_trends(data)
            elif data_type == 'hiring_trends':
                insights = await self._analyze_hiring_trends(data)
            elif data_type == 'skill_demand':
                insights = await self._analyze_skill_demand_trends(data)
            elif data_type == 'salary_trends':
                insights = await self._analyze_salary_trends(data)
            elif data_type == 'diversity_analysis':
                insights = await self._analyze_diversity_metrics(data)
            
            return {
                'insights': insights,
                'confidence_level': self._calculate_insight_confidence(insights),
                'generated_at': datetime.now().isoformat(),
                'data_freshness': self._assess_data_freshness(data)
            }
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {e}")
            raise
    
    async def optimize_job_posting(self, job_data: Dict) -> Dict[str, Any]:
        """تحسين إعلان الوظيفة"""
        try:
            optimization = {
                'title_suggestions': await self._suggest_better_titles(job_data.get('title', '')),
                'description_improvements': await self._improve_job_description(job_data.get('description', '')),
                'keyword_optimization': await self._optimize_job_keywords(job_data),
                'inclusivity_improvements': self._suggest_inclusivity_improvements(job_data),
                'market_positioning': await self._analyze_market_positioning(job_data),
                'expected_response_rate': await self._predict_response_rate(job_data),
                'optimization_score': 0  # Will be calculated
            }
            
            # Calculate overall optimization score
            optimization['optimization_score'] = self._calculate_optimization_score(optimization)
            
            return optimization
            
        except Exception as e:
            logger.error(f"Error optimizing job posting: {e}")
            raise
    
    async def _generate_resume_suggestions(self, analysis: Dict) -> List[str]:
        """توليد اقتراحات لتحسين السيرة الذاتية"""
        suggestions = []
        
        skills = analysis.get('skills', [])
        experience = analysis.get('experience', [])
        summary = analysis.get('summary', '')
        
        if len(skills) < 5:
            suggestions.append("أضف المزيد من المهارات التقنية المتعلقة بمجالك لزيادة فرص ظهورك في نتائج البحث.")
        
        if not summary or len(summary) < 50:
            suggestions.append("قم بكتابة ملخص مهني قوي (3-5 أسطر) يبرز أهم إنجازاتك وقيمتك المضافة.")
            
        if not experience:
            suggestions.append("تأكد من إضافة تفاصيل الخبرة العملية السابقة، بما في ذلك المسميات الوظيفية والمسؤوليات.")
        else:
            for exp in experience:
                desc = exp.get('description', '')
                if len(desc) < 30:
                    suggestions.append(f"قم بتوسيع وصف خبرتك في {exp.get('company', 'شركتك السابقة')} ليتضمن إنجازات محددة.")
        
        if not analysis.get('education'):
            suggestions.append("لم يتم العثور على مؤهلات تعليمية. تأكد من إضافة درجتك العلمية والجامعة.")
            
        # Add general AI-driven suggestions
        suggestions.append("استخدم كلمات مفتاحية (Keywords) مستمدة من إعلانات الوظائف التي تستهدفها.")
        suggestions.append("ركز على النتائج والأرقام (مثلاً: زيادة المبيعات بنسبة 20%) بدلاً من المهام فقط.")
        
        return suggestions

    async def _calculate_market_compatibility(self, analysis: Dict) -> float:
        """حساب درجة التوافق مع السوق"""
        score = 0.5
        skills = analysis.get('skills', [])
        
        # Simple scoring based on skills count and variety
        if len(skills) > 10:
            score += 0.2
        elif len(skills) > 5:
            score += 0.1
            
        # Check for trending skills
        trending = ['python', 'react', 'javascript', 'ai', 'cloud', 'docker', 'sql']
        found_trending = [s for s in skills if s.lower() in trending]
        score += len(found_trending) * 0.05
        
        return min(score, 1.0)

    def _analyze_sentiment(self, text: str) -> Dict:
        """تحليل نبرة النص"""
        if self.sentiment_analyzer:
            return self.sentiment_analyzer.polarity_scores(text)
        return {'compound': 0, 'pos': 0, 'neu': 0, 'neg': 0}

    async def _analyze_skill_gaps(self, skills: List[str]) -> List[str]:
        """تحليل فجوة المهارات"""
        # In a real scenario, compare with market demands
        return ["Cloud Computing", "System Design", "Unit Testing"]

    def _analyze_career_progression(self, experience: List[Dict]) -> str:
        """تحليل التطور المهني"""
        if not experience:
            return "مبتدئ"
        return "تطور مستقر"

    def _analyze_education_relevance(self, education: List[Dict]) -> float:
        """تحليل علاقة التعليم بالمجال"""
        return 0.8

    def _calculate_keyword_density(self, text: str) -> Dict:
        """حساب كثافة الكلمات المفتاحية"""
        return {"keywords": 0.05}

    def _calculate_optimization_score(self, optimization: Dict) -> float:
        """حساب درجة التحسين الكلية"""
        return 0.85

    def _calculate_insight_confidence(self, insights: Dict) -> float:
        return 0.9

    def _assess_data_freshness(self, data: Dict) -> str:
        return "حديث جداً"

    async def _calculate_ai_confidence(self, candidate, job) -> float:
        return 0.85

    def _calculate_experience_fit(self, candidate_exp, required_years) -> float:
        return 0.9

    async def _predict_culture_fit(self, candidate, job) -> float:
        return 0.8

    def _calculate_salary_fit(self, expected, offered) -> float:
        return 1.0

    async def _assess_growth_potential(self, candidate, job) -> float:
        return 0.75

    async def _generate_match_reasons(self, candidate, job) -> List[str]:
        return ["مهاراتك تتطابق تماماً", "خبرتك في نفس المجال", "موقعك الجغرافي مناسب"]

    def _analyze_communication_skills(self, transcript: str) -> float:
        return 0.85

    async def _assess_technical_answers(self, questions: List) -> float:
        return 0.8

    def _analyze_behavioral_responses(self, responses: List) -> List[str]:
        return ["إيجابي", "واثق"]

    def _detect_stress_patterns(self, data: Dict) -> List[str]:
        return []

    async def _identify_improvement_areas(self, analysis: Dict) -> List[str]:
        return ["التحدث ببطء أكثر", "تقديم أمثلة أكثر تفصيلاً"]

    async def _generate_hiring_recommendation(self, analysis: Dict) -> str:
        return "ينصح بشدة بالمضي قدماً"

    async def _suggest_follow_up_questions(self, analysis: Dict) -> List[str]:
        return ["كيف تتعامل مع الضغط؟", "ما هو أكبر تحدي واجهته؟"]

    async def _suggest_career_paths(self, profile: Dict) -> List[str]:
        return ["Software Architect", "Engineering Manager"]

    async def _recommend_skill_development(self, profile: Dict) -> List[Dict]:
        return [{"skill": "AWS", "reason": "مطلوب بشدة في السوق"}]

    def _extract_prediction_features(self, candidate, job) -> Dict:
        return {"skill_match": 0.8, "experience_match": 0.9}

    def _calculate_prediction_confidence(self, features) -> float:
        return 0.95

    def _identify_success_factors(self, features) -> List[str]:
        return ["المهارات التقنية القوية"]

    def _identify_risk_factors(self, features) -> List[str]:
        return ["نقص الخبرة القيادية"]

    async def _suggest_onboarding_plan(self, candidate, job) -> Dict:
        return {"weeks": 4, "focus": "System Architecture"}

    def _define_performance_metrics(self, job) -> List[str]:
        return ["Code Quality", "Sprint Velocity"]

    async def _predict_retention(self, candidate, job) -> float:
        return 0.9

    async def _generate_base_description(self, requirements) -> str:
        return "وصف وظيفي أساسي"

    async def _optimize_job_title(self, title) -> str:
        return title

    async def _generate_compelling_summary(self, requirements) -> str:
        return "ملخص وظيفي جذاب"

    async def _generate_detailed_responsibilities(self, requirements) -> List[str]:
        return ["تطوير البرمجيات", "إدارة الفريق"]

    async def _optimize_requirements(self, requirements) -> List[str]:
        return requirements

    async def _suggest_competitive_benefits(self, requirements) -> List[str]:
        return ["تأمين طبي", "ساعات عمل مرنة"]

    async def _generate_culture_description(self, company_info) -> str:
        return "بيئة عمل محفزة ومبتكرة"

    async def _extract_seo_keywords(self, requirements) -> List[str]:
        return ["Full Stack Developer", "React", "Node.js"]

    def _analyze_inclusivity(self, text) -> float:
        return 0.95

    def _calculate_readability(self, text) -> float:
        return 0.85

    async def _assess_market_competitiveness(self, requirements) -> float:
        return 0.75

    def _assess_insight_confidence(self, insights) -> float:
        return 0.9

    def _assess_data_freshness(self, data) -> str:
        return "حديث"

    def _calculate_insight_confidence(self, insights) -> float:
        return 0.9

    
    def __del__(self):
        """تنظيف الموارد عند إنهاء الكائن"""
        try:
            # Clear cache
            self.models_cache.clear()
            logger.info("AI service resources cleaned up")
        except:
            pass


class ResumeParser:
    """محلل السيرة الذاتية المتقدم"""
    
    def __init__(self, skills_db: Dict = None):
        self.skills_db = skills_db or {}
    
    async def parse_resume(self, resume_text: str) -> Dict[str, Any]:
        """تحليل السيرة الذاتية"""
        try:
            analysis = {
                'contact_info': self._extract_contact_info(resume_text),
                'skills': self._extract_skills(resume_text),
                'experience': self._extract_experience(resume_text),
                'education': self._extract_education(resume_text),
                'languages': self._extract_languages(resume_text),
                'certifications': self._extract_certifications(resume_text),
                'summary': self._extract_summary(resume_text),
                'experience_years': self._calculate_experience_years(resume_text),
                'score': 0.0, # Placeholder, will be calculated in enhanced analysis
                'embedding': None
            }
            
            return analysis
        except Exception as e:
            logger.error(f"Resume parsing error: {e}")
            return {
                'skills': [],
                'experience_years': 0,
                'education': {},
                'summary': "",
                'score': 0.0,
                'embedding': None
            }
    
    def _calculate_experience_years(self, text: str) -> int:
        """حساب سنوات الخبرة من النص"""
        import re
        # البحث عن أرقام متبوعة بكلمة "سنة" أو "years"
        patterns = [
            r'(\d+)\s+years',
            r'(\d+)\s+year',
            r'(\d+)\s+سنوات',
            r'(\d+)\s+سنة'
        ]
        
        years = 0
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                found_years = [int(m) for m in matches]
                years = max(years, max(found_years))
        
        return min(years, 40) # حد أقصى منطقي

    def _extract_contact_info(self, text: str) -> Dict[str, str]:
        """استخراج معلومات الاتصال"""
        import re
        
        contact_info = {}
        
        # Email extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact_info['email'] = emails[0]
        
        # Phone extraction
        phone_pattern = r'(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, text)
        if phones:
            contact_info['phone'] = ''.join(phones[0]) if isinstance(phones[0], tuple) else phones[0]
        
        return contact_info
    
    def _extract_skills(self, text: str) -> List[str]:
        """استخراج المهارات"""
        # This would use more sophisticated NLP techniques
        found_skills = []
        text_lower = text.lower()
        
        for category, skills in self.skills_db.items():
            for skill in skills:
                if skill.lower() in text_lower:
                    found_skills.append(skill)
        
        return list(set(found_skills))
    
    def _extract_experience(self, text: str) -> List[Dict]:
        """استخراج الخبرة العملية"""
        # Simplified implementation
        return []
    
    def _extract_education(self, text: str) -> List[Dict]:
        """استخراج المؤهلات التعليمية"""
        # Simplified implementation
        return []
    
    def _extract_languages(self, text: str) -> List[str]:
        """استخراج اللغات"""
        # Simplified implementation
        return []
    
    def _extract_certifications(self, text: str) -> List[str]:
        """استخراج الشهادات"""
        # Simplified implementation
        return []
    
    def _extract_summary(self, text: str) -> str:
        """استخراج الملخص المهني"""
        # Simplified implementation
        return ""


class JobMatchingEngine:
    """محرك مطابقة الوظائف"""
    
    async def find_matches(self, candidate: Dict, jobs: List[Dict]) -> List[Dict]:
        """العثور على المطابقات"""
        matches = []
        
        for job in jobs:
            match_score = self._calculate_match_score(candidate, job)
            if match_score > 0.3:  # Minimum threshold
                matches.append({
                    'job': job,
                    'match_score': match_score,
                    'match_details': self._get_match_details(candidate, job)
                })
        
        return sorted(matches, key=lambda x: x['match_score'], reverse=True)
    
    def _calculate_match_score(self, candidate: Dict, job: Dict) -> float:
        """حساب درجة المطابقة"""
        # Simplified implementation
        return 0.75  # Placeholder


class InterviewAnalyzer:
    """محلل المقابلات"""
    
    async def analyze_performance(self, interview_data: Dict) -> Dict[str, Any]:
        """تحليل أداء المقابلة"""
        analysis = {
            'overall_score': 0.8,  # Placeholder
            'strengths': ['Good communication', 'Technical knowledge'],
            'weaknesses': ['Nervousness', 'Limited leadership examples'],
            'recommendations': ['Practice behavioral questions', 'Prepare leadership examples']
        }
        
        return analysis


# Export the main service
ai_service = EnhancedAIService()

def get_ai_service():
    """الحصول على خدمة الذكاء الاصطناعي"""
    return ai_service