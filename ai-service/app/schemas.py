from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# AI Service Schemas
class ResumeAnalysisRequest(BaseModel):
    resume_text: str

class ResumeAnalysisResponse(BaseModel):
    skills: List[str]
    experience_years: int
    education: List[Any]
    summary: str
    score: float
    embedding: Optional[List[float]] = None

class JobMatchData(BaseModel):
    job_id: str
    title: str
    description: str
    skills_required: List[str]
    experience_required: Optional[int] = 0

class CandidateMatchData(BaseModel):
    candidate_id: str
    resume_text: Optional[str] = None
    skills: List[str]
    experience_years: int

class JobMatchRequest(BaseModel):
    candidate: CandidateMatchData
    job: JobMatchData

class JobMatchResponse(BaseModel):
    job_id: str
    match_score: float
    reasons: List[str]
    semantic_score: float
    skills_score: float
    experience_score: float
    job_title: Optional[str] = None

class InterviewQuestionsRequest(BaseModel):
    job_title: str
    job_description: str
    candidate_skills: List[str]
    interview_type: str = "technical"

class InterviewQuestionsResponse(BaseModel):
    questions: List[Dict[str, str]]
    estimated_duration: int

class InterviewEvaluationRequest(BaseModel):
    question: str
    response: str
    question_type: str = "general"

class InterviewEvaluationResponse(BaseModel):
    score: float
    length_score: float
    content_score: float
    feedback: List[str]
    word_count: int

class InterviewAnalysisRequest(BaseModel):
    transcript: str
    notes: Optional[str] = None
    job_id: Optional[str] = None
    candidate_id: Optional[str] = None

class InterviewAnalysisResponse(BaseModel):
    score: float
    communication: float
    technical: float
    confidence: float
    marketMatch: float
    strengths: List[str]
    improvements: List[str]
    summary: str
    hiring_recommendation: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime
    used_ai: bool = True

class ImproveResumeRequest(BaseModel):
    resume_text: str
    target_job: Optional[str] = None

class ImproveResumeResponse(BaseModel):
    suggestions: List[str]
    tips: List[str]
    overall_quality: float
