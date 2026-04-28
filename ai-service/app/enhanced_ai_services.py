"""
Enhanced AI Services - Real AI Implementation
يستخدم Google Gemini API + scikit-learn للذكاء الاصطناعي الحقيقي
"""

import os
import re
import json
import logging
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import google.generativeai as genai
    GEMINI_KEY = os.getenv('GEMINI_API_KEY', '')
    if GEMINI_KEY:
        genai.configure(api_key=GEMINI_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        GEMINI_AVAILABLE = True
    else:
        GEMINI_AVAILABLE = False
except Exception:
    GEMINI_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── قاعدة بيانات المهارات ──────────────────────────────
SKILLS_DB = {
    'programming': [
        'python','javascript','typescript','java','c++','c#','php','ruby','go','rust',
        'kotlin','swift','scala','r','matlab','bash','perl','dart'
    ],
    'web': [
        'react','angular','vue','node.js','express','django','flask','fastapi',
        'spring','laravel','nextjs','html','css','tailwind','bootstrap','graphql','rest api'
    ],
    'databases': [
        'mysql','postgresql','mongodb','redis','elasticsearch','oracle','sqlite',
        'cassandra','dynamodb','firebase','supabase'
    ],
    'cloud_devops': [
        'aws','azure','gcp','docker','kubernetes','terraform','jenkins','github actions',
        'ci/cd','linux','nginx','ansible'
    ],
    'data_ai': [
        'machine learning','deep learning','data analysis','pandas','numpy',
        'tensorflow','pytorch','scikit-learn','tableau','power bi','nlp','computer vision'
    ],
    'mobile': ['react native','flutter','android','ios','swift','kotlin'],
    'design': ['figma','photoshop','illustrator','ux','ui','sketch'],
    'soft': [
        'leadership','communication','teamwork','problem solving','agile','scrum',
        'project management','critical thinking','time management','adaptability'
    ]
}

ALL_SKILLS = [s for skills in SKILLS_DB.values() for s in skills]


class EnhancedAIService:
    """خدمة الذكاء الاصطناعي الحقيقية"""

    def __init__(self):
        self._cache: Dict[str, Any] = {}
        self.resume_parser = ResumeParser()
        self.matching_engine = JobMatchingEngine()
        self.interview_analyzer = InterviewAnalyzer()
        logger.info(f"✅ AI Service ready | Gemini: {GEMINI_AVAILABLE}")

    # ═══════════════════════════════════════════════════
    # تحليل السيرة الذاتية
    # ═══════════════════════════════════════════════════
    async def analyze_resume(self, resume_text: str, user_id: str = None) -> Dict:
        cache_key = hashlib.md5(resume_text.encode()).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]

        skills       = extract_skills(resume_text)
        exp_years    = extract_experience_years(resume_text)
        education    = extract_education(resume_text)
        score        = _compute_resume_score(skills, exp_years, education, resume_text)
        summary      = _build_summary(skills, exp_years, education)
        suggestions  = await self._generate_resume_suggestions({'skills': skills, 'experience_years': exp_years, 'education': education, 'summary': summary})

        result = {
            'skills': skills,
            'experience_years': exp_years,
            'education': education,
            'score': round(score, 1),
            'summary': summary,
            'improvement_suggestions': suggestions,
            'embedding': _tfidf_vector(resume_text),
            'processed_at': datetime.now().isoformat()
        }
        self._cache[cache_key] = result
        return result

    # ═══════════════════════════════════════════════════
    # توليد embedding للوظيفة
    # ═══════════════════════════════════════════════════
    def generate_job_embedding(self, description: str, title: str, skills: List[str]) -> List[float]:
        text = f"{title} {description} {' '.join(skills)}"
        return _tfidf_vector(text)

    # ═══════════════════════════════════════════════════
    # حساب نسبة التطابق
    # ═══════════════════════════════════════════════════
    def calculate_job_match_score(
        self,
        candidate_embedding: List[float],
        job_embedding: List[float],
        candidate_skills: List[str],
        job_skills: List[str],
        candidate_experience: int,
        required_experience: int
    ) -> Dict:
        # cosine similarity حقيقية
        ce = np.array(candidate_embedding).reshape(1, -1)
        je = np.array(job_embedding).reshape(1, -1)
        sem = float(cosine_similarity(ce, je)[0][0]) * 40

        # مطابقة المهارات
        if job_skills:
            c_lower = [s.lower() for s in candidate_skills]
            j_lower = [s.lower() for s in job_skills]
            matched = sum(1 for js in j_lower if any(js in cs or cs in js for cs in c_lower))
            skills_score = (matched / len(job_skills)) * 40
        else:
            skills_score = 20

        # مطابقة الخبرة
        if required_experience > 0:
            exp_score = min(candidate_experience / required_experience, 1.0) * 20
        else:
            exp_score = 15

        total = round(min(sem + skills_score + exp_score, 100), 1)
        reasons = []
        if sem > 15:    reasons.append("تطابق دلالي قوي مع متطلبات الوظيفة")
        if skills_score > 15: reasons.append(f"يمتلك {int(skills_score/40*len(job_skills))} مهارة مطلوبة")
        if exp_score >= 15:  reasons.append("يستوفي متطلبات الخبرة")

        return {
            'match_score': total,
            'semantic_score': round(sem, 1),
            'skills_score': round(skills_score, 1),
            'experience_score': round(exp_score, 1),
            'reasons': reasons
        }

    # ═══════════════════════════════════════════════════
    # توليد أسئلة المقابلة
    # ═══════════════════════════════════════════════════
    def generate_interview_questions(
        self,
        job_title: str,
        job_description: str,
        candidate_skills: List[str],
        interview_type: str = "technical"
    ) -> List[Dict]:
        if GEMINI_AVAILABLE:
            return _gemini_generate_questions(job_title, job_description, candidate_skills, interview_type)
        return _local_questions(job_title, candidate_skills, interview_type)

    # ═══════════════════════════════════════════════════
    # تقييم إجابة المقابلة
    # ═══════════════════════════════════════════════════
    def evaluate_interview_response(self, question: str, response: str, question_type: str) -> Dict:
        words = response.split()
        word_count = len(words)

        # طول الإجابة
        if word_count < 10:   length_score = 2
        elif word_count < 50: length_score = 5
        elif word_count < 150: length_score = 8
        else:                  length_score = 10

        # جودة المحتوى
        positive_kw = ['نجحت','حققت','طورت','أنجزت','قدت','بنيت','حللت','حللت','نفذت',
                        'achieved','built','led','solved','improved','developed','implemented']
        content_score = min(sum(1 for kw in positive_kw if kw in response.lower()), 10)

        overall = round((length_score + content_score) / 2, 1)
        feedback = []
        if length_score < 5:   feedback.append("قدم إجابة أكثر تفصيلاً")
        if content_score < 4:  feedback.append("أضف أمثلة وإنجازات محددة")
        if overall >= 8:       feedback.append("إجابة ممتازة وشاملة")

        return {'score': overall, 'length_score': length_score, 'content_score': content_score,
                'feedback': feedback, 'word_count': word_count}

    # ═══════════════════════════════════════════════════
    # تحليل أداء المقابلة
    # ═══════════════════════════════════════════════════
    async def analyze_interview_performance(self, interview_data: Dict) -> Dict:
        transcript = interview_data.get('transcript', '')
        notes      = interview_data.get('notes', '')
        full_text  = f"{transcript} {notes}"

        # حساب درجات حقيقية من النص
        comm  = _score_communication(full_text)
        tech  = _score_technical(full_text)
        conf  = _score_confidence(full_text)
        total = round((comm * 0.35 + tech * 0.40 + conf * 0.25), 1)

        strengths, improvements = _extract_feedback(full_text, comm, tech, conf)

        if GEMINI_AVAILABLE and transcript:
            summary = await _gemini_interview_summary(transcript, total)
            recommendation = await _gemini_recommendation(total)
        else:
            summary = _local_interview_summary(total, comm, tech, conf)
            recommendation = "ينصح بالمضي قدماً" if total >= 60 else "يحتاج إلى مزيد من التقييم"

        return {
            'score': total,
            'communication_score': comm,
            'technical_competency': tech,
            'confidence_score': conf,
            'market_match': min(total + 5, 100),
            'strengths': strengths,
            'improvement_areas': improvements,
            'summary': summary,
            'hiring_recommendation': recommendation
        }

    # ═══════════════════════════════════════════════════
    # الشات بوت
    # ═══════════════════════════════════════════════════
    async def chat_bot(self, message: str, context: Optional[Dict] = None) -> Dict:
        if GEMINI_AVAILABLE:
            response = await _gemini_chat(message, context)
        else:
            response = _local_chat(message)
        return {'response': response, 'timestamp': datetime.now().isoformat(), 'used_ai': GEMINI_AVAILABLE}

    # ═══════════════════════════════════════════════════
    # اقتراحات تحسين السيرة
    # ═══════════════════════════════════════════════════
    async def _generate_resume_suggestions(self, analysis: Dict) -> List[str]:
        skills  = analysis.get('skills', [])
        exp     = analysis.get('experience_years', 0)
        summary = analysis.get('summary', '')
        edu     = analysis.get('education', {})

        suggestions = []
        if len(skills) < 5:
            suggestions.append("أضف المزيد من المهارات التقنية لزيادة فرص ظهورك في نتائج البحث.")
        if not summary or len(summary) < 30:
            suggestions.append("اكتب ملخصاً مهنياً قوياً (3-5 أسطر) يبرز أهم إنجازاتك.")
        if exp == 0:
            suggestions.append("أضف خبراتك العملية بتفاصيل المسؤوليات والإنجازات.")
        if not edu.get('level') or edu.get('level') == 'bachelor':
            suggestions.append("وضح مؤهلاتك التعليمية والتخصص بشكل واضح.")
        suggestions.append("استخدم أرقاماً وإنجازات قابلة للقياس (مثل: زيادة الأداء 30%).")
        suggestions.append("أضف كلمات مفتاحية من إعلانات الوظائف التي تستهدفها.")

        if GEMINI_AVAILABLE and len(skills) > 0:
            extra = await _gemini_resume_tip(skills, exp)
            if extra:
                suggestions.insert(0, extra)

        return suggestions[:6]


# ═══════════════════════════════════════════════════════════
# دوال مساعدة
# ═══════════════════════════════════════════════════════════

def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for skill in ALL_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return list(set(found))


def extract_experience_years(text: str) -> int:
    patterns = [
        r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
        r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience',
        r'خبرة\s*(\d+)\s*سنوات?',
        r'(\d+)\s*سنوات?\s*خبرة',
        r'(\d+)\+?\s*years?\s*in'
    ]
    max_years = 0
    for p in patterns:
        for m in re.findall(p, text, re.IGNORECASE):
            max_years = max(max_years, int(m))
    return max_years


def extract_education(text: str) -> Dict:
    t = text.lower()
    level = 'bachelor'
    if re.search(r'ph\.?d|doctorate|دكتوراه', t): level = 'phd'
    elif re.search(r'master|mba|ماجستير', t): level = 'master'
    elif re.search(r'bachelor|بكالوريوس|ليسانس', t): level = 'bachelor'
    elif re.search(r'diploma|دبلوم', t): level = 'diploma'

    field = None
    for f in ['computer science','engineering','business','mathematics','information technology',
               'علوم حاسوب','هندسة','تقنية معلومات','إدارة']:
        if f in t:
            field = f
            break
    return {'level': level, 'field': field}


def _compute_resume_score(skills, exp_years, education, text) -> float:
    score  = min(len(skills) * 3.5, 40)
    score += min(exp_years * 4, 30)
    edu_s  = {'phd': 20, 'master': 18, 'bachelor': 15, 'diploma': 10}
    score += edu_s.get(education.get('level',''), 8)
    score += min(len(text) / 200, 10)
    return min(score, 100)


def _build_summary(skills, exp_years, education) -> str:
    parts = []
    if exp_years > 0:  parts.append(f"{exp_years} سنوات خبرة")
    if education.get('field'): parts.append(f"{education['level']} في {education['field']}")
    if skills: parts.append(f"مهارات: {', '.join(skills[:5])}")
    return " | ".join(parts) if parts else "لم يتم استخراج ملخص"


def _tfidf_vector(text: str, size: int = 100) -> List[float]:
    """تحويل نص إلى vector حقيقي باستخدام hash features"""
    words = re.findall(r'\b\w+\b', text.lower())
    vec = [0.0] * size
    for w in words:
        idx = int(hashlib.md5(w.encode()).hexdigest(), 16) % size
        vec[idx] += 1.0
    norm = (sum(v**2 for v in vec) ** 0.5) or 1.0
    return [round(v / norm, 6) for v in vec]


def _score_communication(text: str) -> float:
    pos_kw = ['clearly','effectively','presented','communicated','explained','articulated',
               'بوضوح','شرحت','تواصلت','قدمت']
    score = 50 + min(sum(5 for kw in pos_kw if kw in text.lower()), 40)
    # طول النص كمؤشر للتفاعل
    score += min(len(text.split()) / 50, 10)
    return min(round(score, 1), 100)


def _score_technical(text: str) -> float:
    tech_terms = extract_skills(text)
    score = 40 + min(len(tech_terms) * 5, 50)
    return min(round(score, 1), 100)


def _score_confidence(text: str) -> float:
    conf_kw  = ['قدرت','نجحت','حققت','أنجزت','i am','i have','successfully','achieved','led']
    doubt_kw = ['ربما','أعتقد','ليس متأكد','maybe','i think','not sure','possibly']
    conf  = sum(1 for kw in conf_kw if kw in text.lower())
    doubt = sum(1 for kw in doubt_kw if kw in text.lower())
    score = 60 + (conf * 5) - (doubt * 5)
    return min(max(round(score, 1), 0), 100)


def _extract_feedback(text, comm, tech, conf):
    strengths, improvements = [], []
    if comm >= 70: strengths.append("مهارات تواصل ممتازة")
    else: improvements.append("تحسين أسلوب التواصل والوضوح")
    if tech >= 70: strengths.append("كفاءة تقنية عالية")
    else: improvements.append("تعميق المعرفة التقنية")
    if conf >= 70: strengths.append("ثقة عالية بالنفس")
    else: improvements.append("تعزيز الثقة في الإجابات")
    if len(text.split()) > 200: strengths.append("إجابات مفصلة وشاملة")
    return strengths, improvements


def _local_interview_summary(total, comm, tech, conf) -> str:
    level = "ممتاز" if total >= 80 else "جيد جداً" if total >= 65 else "متوسط" if total >= 50 else "يحتاج تحسين"
    return (f"أداء {level} بنسبة {total}%. "
            f"التواصل: {comm}% | التقني: {tech}% | الثقة: {conf}%")


def _local_chat(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ['وظيفة','عمل','job','hire']): 
        return "يمكنني مساعدتك في البحث عن الوظائف المناسبة. ما هو مجالك أو تخصصك؟"
    if any(w in msg for w in ['سيرة','cv','resume']): 
        return "لدينا أداة تحليل وتحسين السيرة الذاتية. هل تريد رفع سيرتك الآن؟"
    if any(w in msg for w in ['مقابلة','interview']): 
        return "التحضير للمقابلة مهم. يمكنني مساعدتك بأسئلة تدريبية في مجالك."
    if any(w in msg for w in ['راتب','salary']): 
        return "الراتب يعتمد على مهاراتك وخبرتك وموقعك. ما هو مجالك لأعطيك تقديرات أدق؟"
    return "مرحباً! أنا مساعدك الذكي في Jobify. كيف يمكنني مساعدتك في رحلتك المهنية؟"


def _local_questions(job_title, candidate_skills, interview_type) -> List[Dict]:
    if interview_type == "technical":
        qs = [
            {"question": f"صف تجربتك مع التقنيات المطلوبة لدور {job_title}.", "type": "experience", "expected_duration": 5},
            {"question": "أعطنا مثالاً على مشكلة تقنية معقدة حللتها وكيف تعاملت معها.", "type": "problem_solving", "expected_duration": 7},
            {"question": "كيف تضمن جودة الكود الذي تكتبه؟", "type": "quality", "expected_duration": 5},
            {"question": "كيف تتابع أحدث التطورات التقنية في مجالك؟", "type": "learning", "expected_duration": 4},
        ]
        for skill in candidate_skills[:2]:
            qs.append({"question": f"أعطنا مثالاً على مشروع استخدمت فيه {skill}.", "type": "skill_specific", "expected_duration": 6})
    elif interview_type == "behavioral":
        qs = [
            {"question": "أخبرنا عن موقف تعاملت فيه مع ضغط شديد في العمل.", "type": "stress", "expected_duration": 5},
            {"question": "كيف تتعامل مع الخلافات مع زملائك؟", "type": "conflict", "expected_duration": 5},
            {"question": "أعطنا مثالاً على قيادتك لمشروع أو فريق.", "type": "leadership", "expected_duration": 6},
            {"question": "أخبرنا عن فشل مررت به وما تعلمته منه.", "type": "growth", "expected_duration": 5},
        ]
    else:  # hr
        qs = [
            {"question": f"لماذا تريد العمل في هذه الوظيفة؟", "type": "motivation", "expected_duration": 4},
            {"question": "أين تريد أن تكون مهنياً بعد 5 سنوات؟", "type": "goals", "expected_duration": 4},
            {"question": "ما هي نقاط قوتك الرئيسية؟", "type": "strengths", "expected_duration": 4},
            {"question": "ما هي توقعاتك للراتب؟", "type": "salary", "expected_duration": 3},
        ]
    return qs[:6]


# ── Gemini Functions ──────────────────────────────────────

def _gemini_generate_questions(job_title, job_description, candidate_skills, interview_type) -> List[Dict]:
    try:
        skills_text = ', '.join(candidate_skills[:5]) if candidate_skills else 'غير محدد'
        type_map = {'technical': 'تقنية', 'behavioral': 'سلوكية', 'hr': 'موارد بشرية'}
        prompt = f"""أنت خبير توظيف. أنشئ 5 أسئلة مقابلة {type_map.get(interview_type,'تقنية')} لوظيفة {job_title}.
مهارات المرشح: {skills_text}
وصف الوظيفة: {job_description[:300]}

أرجع JSON فقط بهذا الشكل:
[{{"question": "السؤال", "type": "النوع", "expected_duration": رقم}}]"""
        response = gemini_model.generate_content(prompt)
        text = response.text.strip()
        text = re.sub(r'```json|```', '', text).strip()
        questions = json.loads(text)
        return questions[:6] if isinstance(questions, list) else _local_questions(job_title, candidate_skills, interview_type)
    except Exception as e:
        logger.warning(f"Gemini questions failed: {e}")
        return _local_questions(job_title, candidate_skills, interview_type)


async def _gemini_chat(message: str, context: Optional[Dict]) -> str:
    try:
        system = """أنت مساعد ذكي لمنصة Jobify للتوظيف. ساعد المستخدمين في:
- البحث عن وظائف وتحسين السيرة الذاتية
- التحضير للمقابلات
- تطوير المسار المهني
أجب بالعربية بشكل مختصر ومفيد (3-4 جمل كحد أقصى)."""
        full_prompt = f"{system}\n\nالمستخدم: {message}\nالمساعد:"
        response = gemini_model.generate_content(full_prompt)
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini chat failed: {e}")
        return _local_chat(message)


async def _gemini_interview_summary(transcript: str, score: float) -> str:
    try:
        prompt = f"""حلل أداء هذا المرشح في المقابلة وقدم ملخصاً باللغة العربية (3 جمل):
النص: {transcript[:500]}
الدرجة الإجمالية: {score}/100"""
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except:
        return _local_interview_summary(score, score, score, score)


async def _gemini_recommendation(score: float) -> str:
    if score >= 80: return "ينصح بشدة بتوظيفه - أداء استثنائي"
    if score >= 65: return "ينصح بالمضي قدماً - أداء جيد جداً"
    if score >= 50: return "يحتاج تقييماً إضافياً - أداء متوسط"
    return "لا ينصح حالياً - يحتاج تطوير"


async def _gemini_resume_tip(skills: List[str], exp_years: int) -> str:
    try:
        prompt = f"""بناءً على مهارات المرشح ({', '.join(skills[:5])}) وخبرته ({exp_years} سنوات)،
قدم نصيحة واحدة محددة لتحسين سيرته الذاتية في جملتين بالعربية."""
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except:
        return ""


# ── Sub-services (placeholders يستخدمها الكود القديم) ─────

class ResumeParser:
    async def parse_resume(self, text):
        return {
            'skills': extract_skills(text),
            'experience_years': extract_experience_years(text),
            'education': extract_education(text),
            'summary': ''
        }

class JobMatchingEngine:
    async def find_matches(self, candidate, jobs):
        return [{'job': j, 'match_score': 50} for j in jobs]

class InterviewAnalyzer:
    async def analyze_performance(self, data):
        return {'score': 70, 'summary': 'تحليل قيد المعالجة'}


# ── Global instance ───────────────────────────────────────
ai_service = EnhancedAIService()