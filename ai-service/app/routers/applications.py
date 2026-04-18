from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

@router.post("/", response_model=schemas.Application)
def apply_for_job(
    application: schemas.ApplicationCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can apply for jobs"
        )
    
    # Check if job exists and is active
    job = db.query(models.Job).filter(
        models.Job.id == application.job_id,
        models.Job.is_active == True
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or no longer active"
        )
    
    # Check if user already applied for this job
    existing_application = db.query(models.Application).filter(
        models.Application.job_id == application.job_id,
        models.Application.candidate_id == current_user.id
    ).first()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job"
        )
    
    db_application = models.Application(
        job_id=application.job_id,
        candidate_id=current_user.id,
        cover_letter=application.cover_letter
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    return db_application

@router.get("/my-applications", response_model=List[schemas.Application])
def get_my_applications(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this endpoint"
        )
    
    applications = db.query(models.Application).filter(
        models.Application.candidate_id == current_user.id
    ).all()
    
    return applications

@router.get("/job/{job_id}", response_model=List[schemas.Application])
def get_job_applications(
    job_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this endpoint"
        )
    
    # Verify that the employer owns this job
    employer_profile = db.query(models.EmployerProfile).filter(
        models.EmployerProfile.user_id == current_user.id
    ).first()
    
    job = db.query(models.Job).filter(
        models.Job.id == job_id,
        models.Job.employer_id == employer_profile.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission to view its applications"
        )
    
    applications = db.query(models.Application).filter(
        models.Application.job_id == job_id
    ).all()
    
    return applications

@router.get("/{application_id}", response_model=schemas.Application)
def get_application(
    application_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    application = db.query(models.Application).filter(
        models.Application.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check permissions
    if current_user.user_type == "candidate":
        if application.candidate_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own applications"
            )
    elif current_user.user_type == "employer":
        employer_profile = db.query(models.EmployerProfile).filter(
            models.EmployerProfile.user_id == current_user.id
        ).first()
        
        job = db.query(models.Job).filter(
            models.Job.id == application.job_id,
            models.Job.employer_id == employer_profile.id
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view applications for your jobs"
            )
    
    return application

@router.put("/{application_id}", response_model=schemas.Application)
def update_application_status(
    application_id: int,
    application_update: schemas.ApplicationUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    application = db.query(models.Application).filter(
        models.Application.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Only employers can update application status
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can update application status"
        )
    
    employer_profile = db.query(models.EmployerProfile).filter(
        models.EmployerProfile.user_id == current_user.id
    ).first()
    
    job = db.query(models.Job).filter(
        models.Job.id == application.job_id,
        models.Job.employer_id == employer_profile.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update applications for your jobs"
        )
    
    for field, value in application_update.dict(exclude_unset=True).items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    
    return application