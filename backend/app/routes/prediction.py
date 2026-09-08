"""
prediction.py - Machine learning disease risk prediction routes for Diabetes, Heart Disease, and Kidney Disease.
Supports candidate classifier selection (RandomForest, LogisticRegression, DecisionTree, KNN) and metric retrieval.
"""

from __future__ import annotations
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db, Prediction
from app.services.prediction_service import (
    predict_disease_risk, get_disease_metrics, get_model_and_scaler, DISCLAIMER_TEXT
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["prediction"])

ModelType = Literal["RandomForest", "LogisticRegression", "DecisionTree", "KNN"]


# ---------------------------------------------------------------------------
# Input Schemas
# ---------------------------------------------------------------------------

class DiabetesInput(BaseModel):
    pregnancies: float = Field(0, ge=0, description="Number of pregnancies")
    glucose: float = Field(120, ge=0, description="Plasma glucose concentration (mg/dL)")
    blood_pressure: float = Field(70, ge=0, description="Diastolic blood pressure (mm Hg)")
    skin_thickness: float = Field(20, ge=0, description="Triceps skin fold thickness (mm)")
    insulin: float = Field(80, ge=0, description="2-Hour serum insulin (mu U/ml)")
    bmi: float = Field(25.0, ge=10, le=70, description="Body mass index (weight in kg/(height in m)^2)")
    diabetes_pedigree: float = Field(0.5, ge=0, description="Diabetes pedigree function score")
    age: float = Field(35, ge=1, le=120, description="Age in years")
    model_name: Optional[ModelType] = "RandomForest"
    report_id: Optional[int] = None


class HeartInput(BaseModel):
    age: float = Field(55, ge=1, le=120, description="Age in years")
    sex: float = Field(1, ge=0, le=1, description="Sex (1 = male; 0 = female)")
    cp: float = Field(0, ge=0, le=3, description="Chest pain type (0: typical, 1: atypical, 2: non-anginal, 3: asymptomatic)")
    trestbps: float = Field(130, ge=50, le=250, description="Resting blood pressure (mm Hg)")
    chol: float = Field(240, ge=50, le=600, description="Serum cholesterol in mg/dl")
    fbs: float = Field(0, ge=0, le=1, description="Fasting blood sugar > 120 mg/dl (1 = true; 0 = false)")
    restecg: float = Field(0, ge=0, le=2, description="Resting electrocardiographic results (0, 1, 2)")
    thalach: float = Field(150, ge=50, le=250, description="Maximum heart rate achieved")
    exang: float = Field(0, ge=0, le=1, description="Exercise induced angina (1 = yes; 0 = no)")
    oldpeak: float = Field(1.0, ge=0, le=10, description="ST depression induced by exercise relative to rest")
    slope: float = Field(1, ge=0, le=2, description="The slope of the peak exercise ST segment")
    ca: float = Field(0, ge=0, le=4, description="Number of major vessels (0-4) colored by fluoroscopy")
    thal: float = Field(2, ge=1, le=3, description="Thalassemia (1: normal, 2: fixed defect, 3: reversible defect)")
    model_name: Optional[ModelType] = "RandomForest"
    report_id: Optional[int] = None


class KidneyInput(BaseModel):
    bp: float = Field(80, ge=40, le=220, description="Blood pressure in mm/Hg")
    sg: float = Field(1.020, ge=1.000, le=1.035, description="Specific gravity (1.005, 1.010, 1.015, 1.020, 1.025)")
    al: float = Field(0, ge=0, le=5, description="Albumin level (0-5)")
    su: float = Field(0, ge=0, le=5, description="Sugar level (0-5)")
    bgr: float = Field(110, ge=40, le=500, description="Blood glucose random (mg/dL)")
    bu: float = Field(35, ge=5, le=400, description="Blood urea (mg/dL)")
    sc: float = Field(1.0, ge=0.1, le=25.0, description="Serum creatinine (mg/dL)")
    sod: float = Field(138, ge=80, le=180, description="Sodium (mEq/L)")
    pot: float = Field(4.5, ge=1.5, le=12.0, description="Potassium (mEq/L)")
    hemo: float = Field(14.0, ge=3.0, le=22.0, description="Hemoglobin (g/dL)")
    pcv: float = Field(42, ge=10, le=60, description="Packed cell volume (%)")
    wc: float = Field(8000, ge=1500, le=30000, description="White blood cell count (cells/cumm)")
    rc: float = Field(5.0, ge=1.5, le=9.0, description="Red blood cell count (millions/cmm)")
    model_name: Optional[ModelType] = "RandomForest"
    report_id: Optional[int] = None


def _log_prediction(db: Session, disease: str, inputs: dict, result_dict: dict, report_id: int | None):
    try:
        pred = Prediction(
            report_id=report_id,
            disease_type=disease,
            model_name=result_dict.get("model_used", "RandomForest"),
            inputs_json=json.dumps(inputs, default=str),
            result=result_dict.get("result", "Indication"),
            probability=result_dict.get("probability"),
            confidence=result_dict.get("confidence_percent")
        )
        db.add(pred)
        db.commit()
    except Exception as exc:
        logger.warning("Could not log prediction to database: %s", exc)
        db.rollback()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/predict/diabetes")
def predict_diabetes(payload: DiabetesInput, db: Session = Depends(get_db)):
    """Evaluate Diabetes potential risk indication from clinical parameters."""
    data = payload.model_dump()
    report_id = data.pop("report_id", None)
    model_choice = data.pop("model_name", "RandomForest")
    
    result = predict_disease_risk("diabetes", data, model_name=model_choice)
    _log_prediction(db, "diabetes", data, result, report_id)
    return result


@router.post("/predict/heart")
def predict_heart(payload: HeartInput, db: Session = Depends(get_db)):
    """Evaluate Heart Disease potential risk indication from clinical parameters."""
    data = payload.model_dump()
    report_id = data.pop("report_id", None)
    model_choice = data.pop("model_name", "RandomForest")
    
    result = predict_disease_risk("heart", data, model_name=model_choice)
    _log_prediction(db, "heart", data, result, report_id)
    return result


@router.post("/predict/kidney")
def predict_kidney(payload: KidneyInput, db: Session = Depends(get_db)):
    """Evaluate Chronic Kidney Disease potential risk indication from clinical parameters."""
    data = payload.model_dump()
    report_id = data.pop("report_id", None)
    model_choice = data.pop("model_name", "RandomForest")
    
    result = predict_disease_risk("kidney", data, model_name=model_choice)
    _log_prediction(db, "kidney", data, result, report_id)
    return result


@router.get("/model-metrics")
def get_all_model_metrics():
    """Retrieve actual evaluation performance metrics (Accuracy, Precision, Recall, F1, AUC, Confusion Matrix) for all models."""
    return {
        "diabetes": get_disease_metrics("diabetes"),
        "heart": get_disease_metrics("heart"),
        "kidney": get_disease_metrics("kidney")
    }


@router.get("/history")
def get_prediction_history(db: Session = Depends(get_db)):
    """Retrieve past risk assessment indications from the database."""
    items = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(50).all()
    return {
        "history": [
            {
                "id": p.id,
                "disease_type": p.disease_type,
                "model_name": p.model_name,
                "result": p.result,
                "probability": p.probability,
                "confidence_percent": p.confidence,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in items
        ]
    }


@router.get("/health")
def health_status():
    """Service health and ML model readiness probe."""
    models_ready = {}
    for d in ["diabetes", "heart", "kidney"]:
        model, _ = get_model_and_scaler(d)
        models_ready[d] = model is not None

    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models_loaded": models_ready,
        "disclaimer": DISCLAIMER_TEXT
    }
