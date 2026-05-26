import os
import secrets
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

import models
from database import get_db
from services.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-internship-key-change-later")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
OTP_EXPIRE_MINUTES = 10

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def generate_otp() -> str:
    return ''.join(secrets.choice(string.digits) for _ in range(6))


@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Account created successfully.", "user_id": new_user.id}

@router.post("/login", response_model=Token)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )
    access_token = create_access_token(data={"sub": db_user.email, "id": db_user.id})
    return {"access_token": access_token, "token_type": "bearer", "user_name": db_user.full_name}

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")
    
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
    
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == request.email
    ).delete()
    
    token = models.PasswordResetToken(email=request.email, otp=otp, expires_at=expires_at)
    db.add(token)
    db.commit()

    try:
        send_otp_email(request.email, otp, OTP_EXPIRE_MINUTES)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Account found but failed to send email: {str(e)}")

    return {"message": f"A 6-digit reset code has been sent to {request.email}."}

@router.post("/verify-otp")
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == request.email,
        models.PasswordResetToken.otp == request.otp
    ).first()
    if not token:
        raise HTTPException(status_code=400, detail="Invalid code. Please check and try again.")
    if datetime.utcnow() > token.expires_at:
        raise HTTPException(status_code=400, detail="Code has expired. Please request a new one.")
    return {"message": "Code verified successfully."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == request.email,
        models.PasswordResetToken.otp == request.otp
    ).first()
    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset session.")
    if datetime.utcnow() > token.expires_at:
        raise HTTPException(status_code=400, detail="Code has expired. Please request a new one.")
    
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")
    
    user.hashed_password = get_password_hash(request.new_password)
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.email == request.email
    ).delete()
    db.commit()
    return {"message": "Password reset successfully."}

from dependencies import get_current_user

@router.get("/me")
def get_me(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return {"full_name": current_user.full_name, "email": current_user.email}
