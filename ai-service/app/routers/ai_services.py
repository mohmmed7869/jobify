from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
import json

from app import schemas
from app.enhanced_ai_services import ai_service

router = APIRouter()

@router.post("/analyze-resume", response_model=schemas.ResumeAnalysisResponse)
async def analyze_resume(request: schemas.ResumeAnalysisRequest):
    """Analyze resume text using AI"""
    try:
        # Analyze resume using AI service
        analysis = await ai_service.analyze_resume(request.resume_text)
        
        return schemas.ResumeAnalysisResponse(
            skills=analysis.get('skills', []),
            experience_years=analysis.get('experience_years', 0),
            education=analysis.get('education', {}),
            summary=analysis.get('summary', ""),
            score=analysis.get('score', 0.0),
            embedding=analysis.get('embedding')
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing resume: {str(e)}"
        )

@router.post("/job-matching", response_model=schemas.JobMatchResponse)
async def get_job_match(request: schemas.JobMatchRequest):
    """Get AI-powered job match score for a candidate and job"""
    
    try:
        # Generate embeddings (mocked in service)
        candidate_embedding = ai_service.generate_job_embedding(
            request.candidate.resume_text or "", "Candidate", request.candidate.skills
        )
        
        job_embedding = ai_service.generate_job_embedding(
            request.job.description, request.job.title, request.job.skills_required
        )
        
        # Calculate match score
        match_result = ai_service.calculate_job_match_score(
            candidate_embedding,
            job_embedding,
            request.candidate.skills,
            request.job.skills_required,
            request.candidate.experience_years,
            request.job.experience_required
        )
        
        return schemas.JobMatchResponse(
            job_id=request.job.job_id,
            match_score=match_result['match_score'],
            semantic_score=match_result['semantic_score'],
            skills_score=match_result['skills_score'],
            experience_score=match_result['experience_score'],
            reasons=match_result['reasons'],
            job_title=request.job.title
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating match: {str(e)}"
        )

@router.post("/generate-interview-questions", response_model=schemas.InterviewQuestionsResponse)
async def generate_interview_questions(request: schemas.InterviewQuestionsRequest):
    """Generate AI-powered interview questions"""
    
    try:
        # Generate questions using AI service
        questions = ai_service.generate_interview_questions(
            request.job_title,
            request.job_description,
            request.candidate_skills,
            request.interview_type
        )
        
        # Calculate estimated duration
        total_duration = sum(q.get('expected_duration', 5) for q in questions)
        
        return schemas.InterviewQuestionsResponse(
            questions=questions,
            estimated_duration=total_duration
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating questions: {str(e)}"
        )

@router.post("/evaluate-response", response_model=schemas.InterviewEvaluationResponse)
async def evaluate_interview_response(request: schemas.InterviewEvaluationRequest):
    """Evaluate a single interview response"""
    try:
        evaluation = ai_service.evaluate_interview_response(
            request.question,
            request.response,
            request.question_type
        )
        
        return schemas.InterviewEvaluationResponse(
            score=evaluation['score'],
            length_score=evaluation['length_score'],
            content_score=evaluation['content_score'],
            feedback=evaluation['feedback'],
            word_count=evaluation['word_count']
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating response: {str(e)}"
        )

@router.post("/analyze-interview", response_model=schemas.InterviewAnalysisResponse)
async def analyze_interview(request: schemas.InterviewAnalysisRequest):
    """Analyze full interview performance"""
    try:
        # Prepare interview data for analysis
        interview_data = {
            "transcript": request.transcript,
            "notes": request.notes,
            "job_id": request.job_id,
            "candidate_id": request.candidate_id
        }
        
        # Analyze performance using AI service
        analysis = await ai_service.analyze_interview_performance(interview_data)
        
        return schemas.InterviewAnalysisResponse(
            score=analysis.get('score', 0),
            communication=analysis.get('communication_score', 0),
            technical=analysis.get('technical_competency', 0),
            confidence=analysis.get('confidence_score', 0),
            marketMatch=analysis.get('market_match', 0),
            strengths=analysis.get('strengths', []),
            improvements=analysis.get('improvement_areas', []),
            summary=analysis.get('summary', ""),
            hiring_recommendation=analysis.get('hiring_recommendation')
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing interview: {str(e)}"
        )

@router.post("/chat", response_model=schemas.ChatResponse)
async def chat(request: schemas.ChatRequest):
    """AI Chatbot endpoint"""
    try:
        chat_result = await ai_service.chat_bot(request.message, request.context)
        return schemas.ChatResponse(
            response=chat_result['response'],
            timestamp=chat_result['timestamp'],
            used_ai=chat_result['used_ai']
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )

@router.post("/improve-resume", response_model=schemas.ImproveResumeResponse)
async def improve_resume(request: schemas.ImproveResumeRequest):
    """Get AI suggestions to improve resume"""
    try:
        # First analyze the resume to get basic structure
        analysis = await ai_service.analyze_resume(request.resume_text)
        
        # Get suggestions
        suggestions = analysis.get('improvement_suggestions', [])
        if not suggestions:
            suggestions = await ai_service._generate_resume_suggestions(analysis)
        
        return schemas.ImproveResumeResponse(
            suggestions=suggestions,
            tips=[
                "استخدم أرقام ونتائج قابلة للقياس عند وصف إنجازاتك",
                "تأكد من أن سيرتك الذاتية لا تتجاوز صفحتين",
                "استخدم كلمات مفتاحية من إعلان الوظيفة",
                "راجع الأخطاء الإملائية والنحوية",
                "احرص على التحديث المستمر لسيرتك الذاتية"
            ],
            overall_quality=analysis.get('score', 0.0)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error improving resume: {str(e)}"
        )
