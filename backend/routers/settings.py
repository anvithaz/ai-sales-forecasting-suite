from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import requests
import os
import models
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])


class ProfileUpdateRequest(BaseModel):
    full_name: str
    location: str
    avatar: str

class ProfileResponse(BaseModel):
    full_name: str
    email: str
    role: str
    location: str
    avatar: str

class ApiKeyResponse(BaseModel):
    groq_api_key: str

class VerifyApiRequest(BaseModel):
    api_key: str

class PreferencesData(BaseModel):
    currency: str
    date_format: str

def get_or_create_user_settings(db: Session, user_id: int) -> models.UserSettings:
    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if not settings:
        settings = models.UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/profile", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    settings = get_or_create_user_settings(db, current_user.id)
    
    return ProfileResponse(
        full_name=current_user.full_name,
        email=current_user.email,
        role="User",
        location=settings.location,
        avatar=settings.avatar
    )

@router.put("/profile")
def update_profile(request: ProfileUpdateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.full_name = request.full_name
    
    settings = get_or_create_user_settings(db, current_user.id)
    settings.location = request.location
    settings.avatar = request.avatar
    
    db.commit()
    
    return {"message": "Profile updated successfully"}

@router.get("/api", response_model=ApiKeyResponse)
def get_api_keys(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    settings = get_or_create_user_settings(db, current_user.id)
    return {"groq_api_key": settings.groq_api_key or ""}

@router.post("/api/verify")
def verify_and_save_api_key(request: VerifyApiRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    key = request.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API Key cannot be empty.")
        
    headers = {"Authorization": f"Bearer {key}"}
    try:
        resp = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=5)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid API Key. Groq verification failed.")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Groq: {str(e)}")
        
    settings = get_or_create_user_settings(db, current_user.id)
    settings.groq_api_key = key
    db.commit()
    
    return {"message": "API Key verified and saved successfully"}

@router.delete("/api")
def remove_api_key(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    settings = get_or_create_user_settings(db, current_user.id)
    settings.groq_api_key = ""
    db.commit()
    return {"message": "API key removed successfully"}

@router.get("/preferences", response_model=PreferencesData)
def get_preferences(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    settings = get_or_create_user_settings(db, current_user.id)
    return {
        "currency": settings.currency or "usd",
        "date_format": settings.date_format or "mm-dd-yyyy"
    }

@router.put("/preferences")
def update_preferences(request: PreferencesData, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    settings = get_or_create_user_settings(db, current_user.id)
    settings.currency = request.currency
    settings.date_format = request.date_format
    db.commit()
    return {"message": "Preferences updated successfully"}

@router.post("/clear-cache")
def clear_cache(current_user: models.User = Depends(get_current_user)):
    # Placeholder for stateless cache clearing
    return {"message": "AI context cache cleared successfully!"}

@router.delete("/account")
def delete_account(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    datasets = db.query(models.Dataset).filter(models.Dataset.user_id == current_user.id).all()
    for dataset in datasets:
        if dataset.file_path and os.path.exists(dataset.file_path):
            try:
                os.remove(dataset.file_path)
            except OSError:
                pass
        db.delete(dataset)

    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    if settings:
        db.delete(settings)

    tokens = db.query(models.PasswordResetToken).filter(models.PasswordResetToken.email == current_user.email).all()
    for t in tokens:
        db.delete(t)

    db.delete(current_user)
    db.commit()

    return {"message": "Account deleted successfully."}
