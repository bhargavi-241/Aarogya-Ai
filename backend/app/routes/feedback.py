"""
feedback.py - User Feedback collection endpoint.
Stores feedback (rating, category, comment) in SQLite.
"""
from __future__ import annotations
import os
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import Session
from app.database import get_db, Base, engine

logger = logging.getLogger(__name__)
router = APIRouter(tags=["feedback"])

ADMIN_PASSCODE = os.getenv("ADMIN_PASSCODE", "rajput")


# ---------------------------------------------------------------------------
# Database Model
# ---------------------------------------------------------------------------

class FeedbackRecord(Base):
    __tablename__ = "feedback"
    id           = Column(Integer, primary_key=True, index=True)
    rating       = Column(Integer, nullable=False)          # 1-5 stars
    category     = Column(String(60), nullable=True)        # e.g. "Report Analysis", "General"
    comment      = Column(Text, nullable=True)
    page         = Column(String(120), nullable=True)       # which page
    user_name    = Column(String(100), nullable=True)
    email        = Column(String(255), nullable=True)
    tags         = Column(String(255), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class FeedbackRequest(BaseModel):
    rating:   int                   = Field(..., ge=1, le=5)
    category: Optional[str]         = "General"
    comment:  Optional[str]         = ""
    page:     Optional[str]         = None
    user_name: Optional[str]        = None
    email:    Optional[str]         = None
    tags:     Optional[list[str] | str] = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/feedback")
def submit_feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    tags_str = ""
    if isinstance(payload.tags, list):
        tags_str = ", ".join([t.strip() for t in payload.tags if t.strip()])
    elif isinstance(payload.tags, str):
        tags_str = payload.tags.strip()

    record = FeedbackRecord(
        rating=payload.rating,
        category=payload.category or "General",
        comment=payload.comment or "",
        page=payload.page or "",
        user_name=payload.user_name or None,
        email=payload.email or None,
        tags=tags_str or None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("Feedback received: id=%d rating=%d, category=%s", record.id, payload.rating, payload.category)
    return {
        "success": True,
        "id": record.id,
        "message": "Thank you for your feedback! Your review helps us improve the AI Health Companion."
    }


@router.get("/feedback")
def list_feedback(db: Session = Depends(get_db)):
    records = db.query(FeedbackRecord).order_by(FeedbackRecord.submitted_at.desc()).limit(100).all()
    total_count = len(records)
    avg_rating = round(sum(r.rating for r in records) / total_count, 1) if total_count > 0 else 5.0
    
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in records:
        distribution[r.rating] = distribution.get(r.rating, 0) + 1

    feedbacks = [
        {
            "id": r.id,
            "rating": r.rating,
            "category": r.category or "General",
            "comment": r.comment,
            "page": r.page,
            "user_name": r.user_name or "Anonymous Patient",
            "tags": [t.strip() for t in r.tags.split(",") if t.strip()] if r.tags else [],
            "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
        }
        for r in records
    ]

    return {
        "total_count": total_count,
        "average_rating": avg_rating,
        "distribution": distribution,
        "feedbacks": feedbacks
    }


class AdminAuthRequest(BaseModel):
    passcode: str = Field(..., description="Admin authorization passcode")


@router.post("/feedback/verify-admin")
def verify_admin_access(payload: AdminAuthRequest):
    """Verifies whether the supplied admin passcode is valid."""
    if payload.passcode.strip() == ADMIN_PASSCODE:
        return {
            "success": True,
            "valid": True,
            "message": "Admin authorization verified."
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin passcode. Only authorized administrators can manage feedback."
    )


@router.delete("/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    admin_key: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Deletes a feedback record. Restricted strictly to authorized administrators.
    Requires matching admin key in 'X-Admin-Key' header or 'admin_key' query parameter.
    """
    provided_key = (x_admin_key or admin_key or "").strip()
    if not provided_key or provided_key != ADMIN_PASSCODE:
        logger.warning("Unauthorized attempt to delete feedback id=%d", feedback_id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only authorized administrators can delete feedback."
        )

    record = db.query(FeedbackRecord).filter(FeedbackRecord.id == feedback_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback #{feedback_id} not found."
        )

    db.delete(record)
    db.commit()
    logger.info("Feedback id=%d deleted by admin", feedback_id)

    return {
        "success": True,
        "id": feedback_id,
        "message": f"Feedback #{feedback_id} was successfully deleted by administrator."
    }
