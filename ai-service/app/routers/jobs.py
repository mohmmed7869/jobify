from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

@router.post("/", response_model=schemas.Job)
def create_job(
    job: schemas.JobCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can create jobs"
        )
    
    # Get employer profile
    employer_profile = db.query(models.EmployerProfile).filter(
        models.EmployerProfile.user_id == current_user.id
    ).first()
    
    if not employer_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your employer profile first"
        )
    
    db_job = models.Job(
        employer_id=employer_profile.id,
        **job.dict()
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/", response_model=List[schemas.Job])
def get_jobs(
    skip: int = 0,
    limit: int = 100,
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    min_salary: Optional[float] = Query(None),
    max_salary: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Job).filter(models.Job.is_active == True)
    
    if location:
        query = query.filter(models.Job.location.contains(location))
    if job_type:
        query = query.filter(models.Job.job_type == job_type)
    if min_salary:
        query = query.filter(models.Job.salary_min >= min_salary)
    if max_salary:
        query = query.filter(models.Job.salary_max <= max_salary)
    
    jobs = query.offset(skip).limit(limit).all()
    return jobs

@router.get("/my-jobs", response_model=List[schemas.Job])
def get_my_jobs(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this endpoint"
        )
    
    employer_profile = db.query(models.EmployerProfile).filter(
        models.EmployerProfile.user_id == current_user.id
    ).first()
    
    if not employer_profile:
        return []
    
    jobs = db.query(models.Job).filter(
        models.Job.employer_id == employer_profile.id
    ).all()
    
    return jobs

@router.get("/{job_id}", response_model=schemas.Job)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(
        models.Job.id == job_id,
        models.Job.is_active == True
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job

@router.put("/{job_id}", response_model=schemas.Job)
def update_job(
    job_id: int,
    job_update: schemas.JobUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can update jobs"
        )
    
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
            detail="Job not found or you don't have permission to update it"
        )
    
    for field, value in job_update.dict(exclude_unset=True).items():
        setattr(job, field, value)
    
    db.commit()
    db.refresh(job)
    return job

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can delete jobs"
        )
    
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
            detail="Job not found or you don't have permission to delete it"
        )
    
    # Soft delete - just mark as inactive
    job.is_active = False
    db.commit()
    
    return {"message": "Job deleted successfully"}