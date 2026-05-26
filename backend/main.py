from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()



from database import engine, Base
from routers import auth, upload, analytics, forecasts, settings

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Sales Forecasting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(analytics.router)
app.include_router(forecasts.router)
app.include_router(settings.router)

@app.get("/")
def health_check():
    return {"status": "Database, Auth, Upload, and Analytics systems online"}
