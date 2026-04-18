import re
import json
from typing import List, Dict, Any
import random
import math

class AIRecruitmentService:
    def __init__(self):
        # For now, we'll use mock AI functionality
        # In production, you would initialize actual AI models here
        pass
        
        # Skills extraction patterns
        self.skill_patterns = {
            'programming': [
                'python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
                'typescript', 'kotlin', 'swift', 'scala', 'r', 'matlab', 'sql'
            ],
            'web_development': [
                'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express',
                'django', 'flask', 'spring', 'laravel', 'bootstrap', 'jquery'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
                'oracle', 'sqlite', 'cassandra', 'dynamodb'
            ],
            'cloud': [
                'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
                'jenkins', 'gitlab', 'github actions'
            ],
            'data_science': [
                'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
                'keras', 'matplotlib', 'seaborn', 'jupyter', 'spark'
            ],
            'soft_skills': [
                'leadership', 'communication', 'teamwork', 'problem solving',
                'project management', 'agile', 'scrum', 'analytical thinking'
            ]
        }
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from resume or job description text"""
        text_lower = text.lower()
        extracted_skills = []
        
        for category, skills in self.skill_patterns.items():
            for skill in skills:
                if skill.lower() in text_lower:
                    extracted_skills.append(skill)
        
        # Remove duplicates and return
        return list(set(extracted_skills))
    
    def extract_experience_years(self, text: str) -> int:
        """Extract years of experience from text"""
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'(\d+)\+?\s*years?\s*in',
            r'experience\s*:\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                return max([int(match) for match in matches])
        
        return 0
    
    def extract_education(self, text: str) -> Dict[str, Any]:
        """Extract education information from text"""
        education = {
            'degree': None,
            'field': None,
            'institution': None,
            'level': 'bachelor'  # default
        }
        
        # Degree patterns
        degree_patterns = {
            'bachelor': r'bachelor|b\.?s\.?|b\.?a\.?|undergraduate',
            'master': r'master|m\.?s\.?|m\.?a\.?|mba|graduate',
            'phd': r'ph\.?d\.?|doctorate|doctoral'
        }
        
        text_lower = text.lower()
        
        for level, pattern in degree_patterns.items():
            if re.search(pattern, text_lower):
                education['level'] = level
                break
        
        # Extract field of study (simplified)
        fields = [
            'computer science', 'engineering', 'business', 'mathematics',
            'physics', 'chemistry', 'biology', 'economics', 'finance',
            'marketing', 'psychology', 'design', 'arts'
        ]
        
        for field in fields:
            if field in text_lower:
                education['field'] = field
                break
        
        return education
    
    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """Comprehensive resume analysis"""
        skills = self.extract_skills_from_text(resume_text)
        experience_years = self.extract_experience_years(resume_text)
        education = self.extract_education(resume_text)
        
        # Generate mock embedding for the resume (in production, use actual AI model)
        embedding = [random.random() for _ in range(384)]  # Mock 384-dimensional embedding
        
        # Calculate a basic score based on various factors
        score = self.calculate_resume_score(skills, experience_years, education, resume_text)
        
        # Generate summary
        summary = self.generate_resume_summary(skills, experience_years, education)
        
        return {
            'skills': skills,
            'experience_years': experience_years,
            'education': education,
            'embedding': embedding.tolist(),
            'score': score,
            'summary': summary
        }
    
    def calculate_resume_score(self, skills: List[str], experience_years: int, 
                             education: Dict[str, Any], resume_text: str) -> float:
        """Calculate a score for the resume (0-100)"""
        score = 0
        
        # Skills score (40% of total)
        skills_score = min(len(skills) * 2, 40)
        score += skills_score
        
        # Experience score (30% of total)
        experience_score = min(experience_years * 3, 30)
        score += experience_score
        
        # Education score (20% of total)
        education_scores = {'bachelor': 15, 'master': 18, 'phd': 20}
        education_score = education_scores.get(education['level'], 10)
        score += education_score
        
        # Resume completeness (10% of total)
        completeness_score = min(len(resume_text) / 100, 10)
        score += completeness_score
        
        return min(score, 100)
    
    def generate_resume_summary(self, skills: List[str], experience_years: int, 
                               education: Dict[str, Any]) -> str:
        """Generate a summary of the resume"""
        summary_parts = []
        
        if experience_years > 0:
            summary_parts.append(f"{experience_years} years of experience")
        
        if education['level']:
            level_text = education['level'].title()
            if education['field']:
                summary_parts.append(f"{level_text} in {education['field'].title()}")
            else:
                summary_parts.append(f"{level_text} degree")
        
        if skills:
            top_skills = skills[:5]  # Top 5 skills
            summary_parts.append(f"Skills: {', '.join(top_skills)}")
        
        return ". ".join(summary_parts) + "."
    
    def calculate_job_match_score(self, candidate_embedding: List[float], 
                                 job_embedding: List[float],
                                 candidate_skills: List[str],
                                 job_skills: List[str],
                                 candidate_experience: int,
                                 required_experience: int) -> Dict[str, Any]:
        """Calculate match score between candidate and job"""
        
        # Mock semantic similarity (40% of score)
        # In production, use actual cosine similarity
        semantic_score = random.uniform(0.3, 0.9) * 40
        
        # Skills match (40% of score)
        if job_skills:
            matching_skills = set(candidate_skills) & set(job_skills)
            skills_score = (len(matching_skills) / len(job_skills)) * 40
        else:
            skills_score = 20  # Default if no specific skills required
        
        # Experience match (20% of score)
        if required_experience > 0:
            if candidate_experience >= required_experience:
                experience_score = 20
            else:
                experience_score = (candidate_experience / required_experience) * 20
        else:
            experience_score = 15  # Default if no specific experience required
        
        total_score = semantic_score + skills_score + experience_score
        
        # Generate reasons for the match
        reasons = []
        if semantic_score > 15:
            reasons.append("Strong semantic match with job requirements")
        if skills_score > 15:
            reasons.append(f"Matches {len(set(candidate_skills) & set(job_skills))} required skills")
        if experience_score > 15:
            reasons.append("Meets experience requirements")
        
        return {
            'match_score': min(total_score, 100),
            'semantic_score': semantic_score,
            'skills_score': skills_score,
            'experience_score': experience_score,
            'reasons': reasons
        }
    
    def generate_job_embedding(self, job_description: str, job_title: str, 
                              skills_required: List[str]) -> List[float]:
        """Generate embedding for job posting"""
        # Combine all job information
        job_text = f"{job_title}. {job_description}"
        if skills_required:
            job_text += f" Required skills: {', '.join(skills_required)}"
        
        # Mock embedding generation (in production, use actual AI model)
        embedding = [random.random() for _ in range(384)]  # Mock 384-dimensional embedding
        return embedding
    
    def generate_interview_questions(self, job_title: str, job_description: str,
                                   candidate_skills: List[str],
                                   interview_type: str = "technical") -> List[Dict[str, str]]:
        """Generate AI-powered interview questions"""
        
        questions = []
        
        if interview_type == "technical":
            # Technical questions based on job requirements
            base_questions = [
                {
                    "question": f"Can you walk me through your experience with the technologies mentioned in your resume that are relevant to this {job_title} position?",
                    "type": "experience",
                    "expected_duration": 5
                },
                {
                    "question": "Describe a challenging technical problem you've solved recently. What was your approach?",
                    "type": "problem_solving",
                    "expected_duration": 7
                },
                {
                    "question": f"How would you approach learning new technologies required for this {job_title} role?",
                    "type": "learning",
                    "expected_duration": 4
                }
            ]
            
            # Add skill-specific questions
            for skill in candidate_skills[:3]:  # Top 3 skills
                questions.append({
                    "question": f"Can you give me an example of a project where you used {skill}? What challenges did you face?",
                    "type": "skill_specific",
                    "expected_duration": 6
                })
            
            questions.extend(base_questions)
            
        elif interview_type == "behavioral":
            questions = [
                {
                    "question": "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
                    "type": "teamwork",
                    "expected_duration": 5
                },
                {
                    "question": "Describe a situation where you had to meet a tight deadline. What was your approach?",
                    "type": "time_management",
                    "expected_duration": 5
                },
                {
                    "question": "Give me an example of when you had to learn something new quickly for a project.",
                    "type": "adaptability",
                    "expected_duration": 4
                },
                {
                    "question": "Tell me about a time when you disagreed with your manager's decision. How did you handle it?",
                    "type": "conflict_resolution",
                    "expected_duration": 6
                }
            ]
        
        elif interview_type == "hr":
            questions = [
                {
                    "question": f"What interests you most about this {job_title} position?",
                    "type": "motivation",
                    "expected_duration": 4
                },
                {
                    "question": "Where do you see yourself in 5 years?",
                    "type": "career_goals",
                    "expected_duration": 4
                },
                {
                    "question": "What are your salary expectations for this role?",
                    "type": "compensation",
                    "expected_duration": 3
                },
                {
                    "question": "Why are you looking to leave your current position?",
                    "type": "motivation",
                    "expected_duration": 4
                }
            ]
        
        return questions[:6]  # Return max 6 questions
    
    def evaluate_interview_response(self, question: str, response: str, 
                                  question_type: str) -> Dict[str, Any]:
        """Evaluate candidate's interview response"""
        
        # Basic response analysis
        response_length = len(response.split())
        
        # Score based on response length and content
        if response_length < 10:
            length_score = 2
        elif response_length < 50:
            length_score = 6
        elif response_length < 100:
            length_score = 8
        else:
            length_score = 10
        
        # Content analysis (simplified)
        positive_indicators = [
            'experience', 'project', 'team', 'solution', 'challenge',
            'learned', 'improved', 'successful', 'achieved', 'implemented'
        ]
        
        content_score = 0
        response_lower = response.lower()
        for indicator in positive_indicators:
            if indicator in response_lower:
                content_score += 1
        
        content_score = min(content_score, 10)
        
        # Overall score
        overall_score = (length_score + content_score) / 2
        
        # Generate feedback
        feedback = []
        if length_score < 5:
            feedback.append("Consider providing more detailed responses")
        if content_score < 5:
            feedback.append("Try to include specific examples and experiences")
        if overall_score >= 8:
            feedback.append("Excellent response with good detail and examples")
        
        return {
            'score': overall_score,
            'length_score': length_score,
            'content_score': content_score,
            'feedback': feedback,
            'word_count': response_length
        }

# Global instance
ai_service = AIRecruitmentService()