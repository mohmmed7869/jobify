from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

@router.get("/profile", response_model=schemas.User)
def get_user_profile(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.put("/profile", response_model=schemas.User)
def update_user_profile(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/candidate-profile", response_model=schemas.CandidateProfile)
def get_candidate_profile(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this endpoint"
        )
    
    profile = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        # Create profile if it doesn't exist
        profile = models.CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return profile

@router.put("/candidate-profile", response_model=schemas.CandidateProfile)
def update_candidate_profile(
    profile_update: schemas.CandidateProfileUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this endpoint"
        )
    
    profile = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = models.CandidateProfile(user_id=current_user.id)
        db.add(profile)
    
    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/employer-profile", response_model=schemas.EmployerProfile)
def get_employer_profile(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this endpoint"
        )
    
    profile = db.query(models.EmployerProfile).filter(
        models.EmployerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found. Please create one first."
        )
    
    return profile

@router.post("/employer-profile", response_model=schemas.EmployerProfile)
def create_employer_profile(
    profile_data: schemas.EmployerProfileCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this endpoint"
        )
    
    # Check if profile already exists
    existing_profile = db.query(models.EmployerProfile).filter(
        models.EmployerProfile.user_id == current_user.id
    ).first()
    
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employer profile already exists"
        )
    
    profile = models.EmployerProfile(
        user_id=current_user.id,
        **profile_data.dict()
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.put("/employer-profile", response_model=schemas.EmployerProfile)
def update_employer_profile(
    profile_update: schemas.EmployerProfileUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this endpoint"
        )
    
    profile = db.query(models.EmployerProfile).filter(
        models.EmployerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )
    
    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile