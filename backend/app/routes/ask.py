"""
ask.py - Conversational Health Q&A Assistant endpoints.
Allows patients and users to ask any health-related question, symptom inquiry,
medication clarification, or medical report query with instant AI responses.
"""

import logging
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.gemini_summary_service import ask_health_assistant

logger = logging.getLogger("ask_router")

router = APIRouter(tags=["ask"])


class MessageTurn(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="The user's health question")
    report_context: Optional[str] = Field(None, max_length=10000, description="Optional raw text or summary of uploaded report")
    history: Optional[list[MessageTurn]] = Field(None, description="Previous conversation turns for context")
    language: Optional[str] = Field("en", description="Target language ('en', 'hi', 'mr')")


@router.post("/ask")
def handle_ask_question(payload: AskRequest) -> dict[str, Any]:
    """
    Universal Health Q&A:
    Answers any medical or health question in English, Hindi, or Marathi.
    Supports both standalone health inquiries and questions about an uploaded medical report.
    """
    clean_q = payload.question.strip()
    if not clean_q:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    # Convert pydantic history to dicts
    history_dicts = None
    if payload.history:
        history_dicts = [{"role": m.role, "content": m.content} for m in payload.history]

    try:
        result = ask_health_assistant(
            question=clean_q,
            report_context=payload.report_context,
            history=history_dicts,
            language=payload.language or "en"
        )
        return {
            "success": True,
            "question": clean_q,
            "answer": result.get("answer", ""),
            "source": result.get("source", "gemini_ai"),
            "model": result.get("model"),
            "suggestions": result.get("suggestions", []),
            "language": payload.language or "en"
        }
    except Exception as exc:
        logger.error("Error handling health question: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process health question: {exc}"
        )
