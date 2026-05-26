import os
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from dependencies import get_current_user
from services.preprocessing import clean_and_save_dataset

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

@router.get("/datasets")
def list_datasets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    datasets = (
        db.query(models.Dataset)
        .filter(models.Dataset.user_id == current_user.id)
        .order_by(models.Dataset.upload_date.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "original_filename": d.original_filename,
            "upload_date": d.upload_date.isoformat() if d.upload_date else None,
            "file_path": d.file_path,
        }
        for d in datasets
    ]

@router.delete("/datasets/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    dataset = (
        db.query(models.Dataset)
        .filter(models.Dataset.id == dataset_id, models.Dataset.user_id == current_user.id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if dataset.file_path and os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except OSError:
            pass

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully.", "id": dataset_id}

@router.post("/")
async def upload_dataset(
    files: List[UploadFile] = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    saved_paths = []
    filenames = []
    
    for file in files:
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not supported. Use CSV or Excel.")
            
        file_bytes = await file.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File {file.filename} too large. Max 50MB.")

        unique_filename = f"{uuid.uuid4().hex[:8]}-{file.filename}"
        saved_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(saved_path, "wb") as buffer:
            buffer.write(file_bytes)
        
        saved_paths.append(saved_path)
        filenames.append(file.filename)

    try:
        final_path = clean_and_save_dataset(saved_paths, filenames)
    except Exception as e:
        for p in saved_paths:
            if os.path.exists(p):
                os.remove(p)
        raise HTTPException(status_code=500, detail=f"Data joining/cleaning failed: {str(e)}")

    display_name = filenames[0] if len(filenames) == 1 else f"Merged Dataset ({' + '.join(filenames)})"
    
    new_dataset = models.Dataset(
        user_id=current_user.id,
        original_filename=display_name,
        file_path=final_path
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return {
        "message": "Dataset(s) uploaded and processed successfully!", 
        "dataset_id": new_dataset.id,
        "is_merged": len(filenames) > 1,
        "file_path": final_path
    }

