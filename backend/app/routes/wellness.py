"""
wellness.py - Endpoints for Personalized Wellness Suggestions and User Feedback.
"""

from __future__ import annotations
import json
import logging
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db, Report, WellnessFeedback
from app.services.wellness_suggestion_service import generate_wellness_suggestions, WELLNESS_DISCLAIMER

logger = logging.getLogger(__name__)
router = APIRouter(tags=["wellness"])


class WellnessSuggestionRequest(BaseModel):
    file_id: Optional[int] = None
    report_data: Optional[dict[str, Any]] = None
    bp_reading: Optional[str] = None
    previous_bp_reading: Optional[str] = None
    symptoms: Optional[str] = None
    lifestyle: Optional[dict[str, Any]] = None
    ml_risk: Optional[Any] = None
    comparison_delta: Optional[Any] = None
    language: Optional[str] = "en"


class WellnessFeedbackRequest(BaseModel):
    suggestion_id: str
    category: str
    is_useful: bool
    report_id: Optional[int] = None


@router.post("/wellness-suggestions")
def get_personalized_wellness_suggestions(
    payload: WellnessSuggestionRequest,
    db: Session = Depends(get_db)
):
    """
    Generates personalized, non-prescriptive wellness suggestions based on:
    - Report parameters & vitals
    - Current & previous BP measurements (trend-aware)
    - Patient symptoms
    - Self-reported lifestyle factors (sleep, stress, activity)
    - ML disease-risk indications
    - Longitudinal report comparison changes
    """
    report_payload = payload.report_data or {}

    # If file_id is provided and report_data is empty, load from database
    if payload.file_id and not report_payload:
        rep = db.get(Report, payload.file_id)
        if rep and rep.ocr_text:
            try:
                from app.services.medical_document_parser import analyze_medical_document_content
                report_payload = analyze_medical_document_content(
                    raw_text=rep.ocr_text,
                    filename=rep.filename,
                    language=payload.language or "en"
                )
            except Exception as e:
                logger.warning("Could not auto-parse report for wellness suggestions: %s", e)

    result = generate_wellness_suggestions(
        report_data=report_payload,
        bp_reading=payload.bp_reading,
        previous_bp_reading=payload.previous_bp_reading,
        symptoms=payload.symptoms,
        lifestyle=payload.lifestyle,
        ml_risk=payload.ml_risk,
        comparison_delta=payload.comparison_delta,
        language=payload.language or "en"
    )

    return result


@router.post("/wellness-feedback")
def submit_wellness_feedback(
    payload: WellnessFeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Records whether a patient found a wellness suggestion useful or not.
    """
    try:
        record = WellnessFeedback(
            report_id=payload.report_id,
            suggestion_id=payload.suggestion_id,
            category=payload.category,
            is_useful=1 if payload.is_useful else 0
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return {
            "success": True,
            "id": record.id,
            "saved_id": record.id,
            "message": "Thank you for your feedback! This helps Arogya-Ai provide more relevant wellness insights."
        }
    except Exception as exc:
        logger.error("Failed to record wellness feedback: %s", exc)
        return {
            "success": False,
            "message": "Feedback could not be persisted, but session preference is noted."
        }
