from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from dependencies import get_current_user
from services.forecast_engine import run_forecast
from services.ai_service import get_forecast_narrative

router = APIRouter(prefix="/forecasts", tags=["Forecasts"])


def _get_latest_dataset(db: Session, user_id: int) -> models.Dataset:
    dataset = (
        db.query(models.Dataset)
        .filter(models.Dataset.user_id == user_id)
        .order_by(models.Dataset.upload_date.desc())
        .first()
    )
    if not dataset:
        raise HTTPException(
            status_code=404,
            detail="No dataset found. Please upload a file first."
        )
    return dataset


@router.get("/run")
def run_forecast_endpoint(
    horizon:     int = Query(30,  ge=1,  le=365),
    aggregation: str = Query("Monthly"),
    category:    str = Query(None),
    db:          Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dataset = _get_latest_dataset(db, current_user.id)

    result = run_forecast(
        file_path=dataset.file_path,
        horizon=horizon,
        aggregation=aggregation,
        category_filter=category,
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@router.get("/ai-narrative")
def forecast_narrative_endpoint(
    horizon:     int = Query(30,  ge=1,  le=365),
    aggregation: str = Query("Monthly"),
    category:    str = Query(None),
    db:          Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dataset = _get_latest_dataset(db, current_user.id)

    result = run_forecast(
        file_path=dataset.file_path,
        horizon=horizon,
        aggregation=aggregation,
        category_filter=category,
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result["message"])

    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == current_user.id).first()
    api_key = settings.groq_api_key if settings else None

    narrative = get_forecast_narrative(
        summary_stats=result["summary_stats"],
        horizon=horizon,
        aggregation=aggregation,
        category=category,
        user_api_key=api_key
    )

    return {
        "status":    "success",
        "narrative": narrative,
        "trend":     result["summary_stats"]["trend"],
        "confidence_score": result["summary_stats"]["confidence_score"],
    }
