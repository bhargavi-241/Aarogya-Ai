"""
database.py - SQLAlchemy database setup and ORM models for AarogyaAI.
SQLite is used for local academic prototype, architected for seamless PostgreSQL migration.
"""

from sqlalchemy import (
    create_engine, Column, Integer, String, Text,
    DateTime, Float, ForeignKey,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'ai_health.db'}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------------------------------------------------------------------------
# ORM Models
# ---------------------------------------------------------------------------

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
    ocr_text = Column(Text, nullable=True)
    verified_text = Column(Text, nullable=True)
    status = Column(String(50), default="uploaded")

    predictions = relationship("Prediction", back_populates="report", cascade="all, delete-orphan")
    explanations = relationship("Explanation", back_populates="report", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    disease_type = Column(String(50), nullable=False)
    model_name = Column(String(100), default="RandomForest")
    inputs_json = Column(Text, nullable=False)
    result = Column(String(100), nullable=False)
    probability = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("Report", back_populates="predictions")


class Explanation(Base):
    __tablename__ = "explanations"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    term = Column(String(255), nullable=False)
    simple_explanation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("Report", back_populates="explanations")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    category = Column(String(100), default="General")
    comments = Column(Text, nullable=False)
    user_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    tags = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Create all tables if they do not exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
