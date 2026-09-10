"""
main.py - FastAPI application entrypoint for AarogyaAI.
"""

from __future__ import annotations
import logging
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.database import init_db
from app.routes.upload import router as upload_router
from app.routes.ocr import router as ocr_router
from app.routes.explanation import router as explanation_router
from app.routes.prediction import router as prediction_router
from app.routes.feedback import router as feedback_router
from app.routes.ask import router as ask_router
from app.routes.voice_assistant import router as voice_assistant_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_health_app")

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="AarogyaAI API",
    description="AI-Powered Healthcare Assistant for Medical Document Understanding and Health Risk Indication.",
    version="1.0.0"
)

# CORS configuration - use env var in production, fallback to wildcard for local dev
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_allow_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Privacy logging middleware (does not log file contents)
@app.middleware("http")
async def privacy_middleware(request: Request, call_next):
    logger.info("API Request: %s %s", request.method, request.url.path)
    response = await call_next(request)
    return response

# Serve static uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include routers with /api prefix
app.include_router(upload_router, prefix="/api")
app.include_router(ocr_router, prefix="/api")
app.include_router(explanation_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")
app.include_router(ask_router, prefix="/api")
app.include_router(voice_assistant_router, prefix="/api")

@app.on_event("startup")
def startup_event():
    logger.info("Initialising SQLite database tables...")
    init_db()
    logger.info("Database initialised. Uploads path: %s", UPLOAD_DIR)

@app.get("/")
def root():
    return {
        "app": "AarogyaAI API",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
        "disclaimer": "This system provides informational risk indications only and is not a medical diagnosis."
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing your request."}
    )
