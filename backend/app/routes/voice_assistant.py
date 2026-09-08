"""
voice_assistant.py - Voice Health Assistant router for AarogyaAI.
Provides endpoints for patients (especially non-literate or elderly users)
who speak their symptoms in their own words.
"""

from __future__ import annotations
import logging
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.patient_voice_service import generate_patient_voice_guide

logger = logging.getLogger("voice_assistant_router")

router = APIRouter(tags=["voice-assistant"])


class PatientVoiceRequest(BaseModel):
    patient_spoken_text: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Patient's spoken problem converted to text"
    )
    language: Optional[str] = Field(
        "en",
        description="Target language: 'en', 'hi', or 'mr'"
    )


class PatientVoiceResponse(BaseModel):
    success: bool
    patient_spoken_text: str
    spoken_response: str
    symptoms_identified: list[str]
    general_explanation: str
    precautions: list[str]
    urgent_warning: str
    doctor_closing: str
    is_emergency_flag: bool = False
    source: str
    model: Optional[str] = None
    language: str


@router.post("/patient-voice-guide", response_model=PatientVoiceResponse)
@router.post("/voice-assistant", response_model=PatientVoiceResponse)
def handle_patient_voice_guide(payload: PatientVoiceRequest) -> dict[str, Any]:
    """
    Patient Voice Guide:
    Analyzes patient spoken text, identifies symptoms, gives simple everyday explanation,
    provides safe basic precautions (no medications), warns when to see a doctor urgently,
    and returns a short spoken-style response ending with 'Please consult a doctor for proper checkup.'
    """
    clean_text = payload.patient_spoken_text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient spoken text cannot be empty."
        )

    try:
        result = generate_patient_voice_guide(
            patient_spoken_text=clean_text,
            language=payload.language or "en"
        )
        return result
    except Exception as exc:
        logger.error("Error processing patient voice text: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process patient voice guide: {exc}"
        )
