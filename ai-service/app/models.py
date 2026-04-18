from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    user_type = Column(String, default="candidate")  # candidate, employer, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False)
    employer_profile = relationship("EmployerProfile", back_populates="user", uselist=False)
    applications = relationship("Application", back_populates="candidate")

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    resume_text = Column(Text)
    skills = Column(JSON)  # List of skills
    experience_years = Column(Integer)
    education = Column(JSON)  # Education details
    location = Column(String)
    desired_salary = Column(Float)
    job_preferences = Column(JSON)  # Job preferences
    resume_embedding = Column(JSON)  # AI-generated embedding
    ai_score = Column(Float)  # AI-calculated profile score
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="candidate_profile")

class EmployerProfile(Base):
    __tablename__ = "employer_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    company_name = Column(String, nullable=False)
    company_description = Column(Text)
    industry = Column(String)
    company_size = Column(String)
    location = Column(String)
    website = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="employer_profile")
    jobs = relationship("Job", back_populates="employer")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("employer_profiles.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(JSON)  # List of requirements
    skills_required = Column(JSON)  # Required skills
    experience_required = Column(Integer)
    salary_min = Column(Float)
    salary_max = Column(Float)
    location = Column(String)
    job_type = Column(String)  # full-time, part-time, contract
    is_active = Column(Boolean, default=True)
    job_embedding = Column(JSON)  # AI-generated embedding
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employer = relationship("EmployerProfile", back_populates="jobs")
    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    candidate_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")  # pending, reviewed, interview, accepted, rejected
    cover_letter = Column(Text)
    ai_match_score = Column(Float)  # AI-calculated match score
    ai_analysis = Column(JSON)  # AI analysis results
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
    interviews = relationship("Interview", back_populates="application")

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    interview_type = Column(String)  # ai_screening, technical, hr
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled
    scheduled_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    ai_questions = Column(JSON)  # AI-generated questions
    ai_responses = Column(JSON)  # Candidate responses
    ai_evaluation = Column(JSON)  # AI evaluation results
    score = Column(Float)
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    application = relationship("Application", back_populates="interviews")

class AIModel(Base):
    __tablename__ = "ai_models"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    model_type = Column(String)  # resume_analysis, job_matching, interview_ai
    model_version = Column(String)
    is_active = Column(Boolean, default=True)
    configuration = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())