"""
explanation.py - Medical report explanation endpoints.
"""

from __future__ import annotations
import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db, Explanation, Report
from app.services.explanation_service import get_explanation, get_llm_explanation

logger = logging.getLogger(__name__)
router = APIRouter(tags=["explanation"])


class ExplainRequest(BaseModel):
    terms: list[str] = Field(..., description="Medical terms or test names to explain")
    text_context: Optional[str] = Field(default="", description="Optional raw text for context")
    report_id: Optional[int] = Field(default=None, description="Optional associated report id")
    use_llm: Optional[bool] = Field(default=False)
    language: Optional[str] = Field(default="en", description="Target language code (e.g. en, hi, mr)")


@router.post("/explain")
async def explain_medical_terms(payload: ExplainRequest, db: Session = Depends(get_db)):
    """Generate structured, patient-friendly explanations for extracted clinical terms."""
    if not payload.terms:
        raise HTTPException(status_code=422, detail="Please provide at least one medical term.")

    api_key = os.getenv("GEMINI_API_KEY", "").strip() if payload.use_llm else ""
    explanations = []

    for term in payload.terms:
        clean_term = term.strip()
        if not clean_term:
            continue
            
        if api_key:
            exp = await get_llm_explanation(clean_term, payload.text_context or "", api_key, language=payload.language or "en")
        else:
            exp = get_explanation(clean_term)
            
        explanations.append(exp)

        # Store to DB if report_id provided
        if payload.report_id:
            try:
                report = db.get(Report, payload.report_id)
                if report:
                    record = Explanation(
                        report_id=payload.report_id,
                        term=clean_term,
                        simple_explanation=exp.get("simple_explanation", "")
                    )
                    db.add(record)
            except Exception as e:
                logger.warning("Could not persist explanation: %s", e)

    if payload.report_id:
        try:
            db.commit()
        except Exception:
            pass

    return {
        "explanations": explanations,
        "count": len(explanations)
    }
