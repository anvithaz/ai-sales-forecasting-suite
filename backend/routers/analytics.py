from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from dependencies import get_current_user
from services.kpi_calculator import calculate_dashboard_metrics
from services.ai_service import get_ai_insight, chat_with_ai
from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]
    category: Optional[str] = None

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def get_latest_dataset(db: Session, user_id: int) -> models.Dataset:
    dataset = db.query(models.Dataset).filter(models.Dataset.user_id == user_id).order_by(models.Dataset.upload_date.desc()).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="No dataset found. Please upload a file first.")
    return dataset

@router.get("/kpis")
def get_kpis(
    category: str = Query(None),
    date_range: str = Query(None),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    dataset = get_latest_dataset(db, current_user.id)
    result = calculate_dashboard_metrics(
        dataset.file_path,
        category_filter=category,
        date_filter=date_range
    )
    
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
        
    return result

@router.get("/ai-analysis")
def get_analysis(
    category: str = Query(None),
    date_range: str = Query(None),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    dataset = get_latest_dataset(db, current_user.id)
    kpi_result = calculate_dashboard_metrics(
        dataset.file_path,
        category_filter=category,
        date_filter=date_range
    )
    
    if kpi_result.get("status") == "error":
        raise HTTPException(status_code=400, detail="Cannot generate AI analysis without valid data.")
        
    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    api_key = settings.groq_api_key if settings else None
        
    insight_data = get_ai_insight(kpi_result["kpis"], user_api_key=api_key)
    
    return {
        "status": "success", 
        "analysis": insight_data.get("summary", "No summary generated."),
        "recommendation": insight_data.get("recommendation", "N/A"),
        "insights": insight_data.get("insights", [])
    }

@router.post("/chat")
def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    dataset = get_latest_dataset(db, current_user.id)
    kpi_result = calculate_dashboard_metrics(
        dataset.file_path,
        category_filter=request.category
    )
    
    if kpi_result.get("status") == "error":
        raise HTTPException(status_code=400, detail="Cannot chat without valid data.")
        
    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    api_key = settings.groq_api_key if settings else None
        
    ai_response = chat_with_ai(
        kpis=kpi_result["kpis"], 
        history=request.history, 
        message=request.message,
        user_api_key=api_key
    )
    
    return {"status": "success", "response": ai_response}
