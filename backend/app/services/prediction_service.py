"""
prediction_service.py - Multi-disease ML risk prediction service.
Evaluates clinical parameters against real trained scikit-learn models (Random Forest, Logistic Regression, Decision Tree, KNN).
"""

from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Any
import numpy as np
import joblib

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "trained_models"

DISCLAIMER_TEXT = (
    "The model provides a potential disease-risk indication based on the entered parameters. "
    "This is NOT a medical diagnosis. Please consult a qualified healthcare professional for proper clinical evaluation."
)

DIABETES_COLS = ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"]
HEART_COLS = ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"]
KIDNEY_COLS = ["bp", "sg", "al", "su", "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wc", "rc"]


def _load_artifact(filename: str) -> Any | None:
    path = MODELS_DIR / filename
    if not path.exists():
        return None
    try:
        return joblib.load(path)
    except Exception as exc:
        logger.error("Failed to load %s: %s", path, exc)
        return None


def get_model_and_scaler(disease: str, model_name: str | None = None) -> tuple[Any | None, Any | None]:
    """Retrieve the selected or default model and fitted pipeline for a disease."""
    scaler = _load_artifact(f"{disease}_scaler.pkl")
    
    if model_name:
        model = _load_artifact(f"{disease}_{model_name}_model.pkl")
        if model is not None:
            return model, scaler
            
    # Default model
    model = _load_artifact(f"{disease}_model.pkl")
    return model, scaler


def predict_disease_risk(disease: str, inputs: dict[str, Any], model_name: str = "RandomForest") -> dict[str, Any]:
    """Generic disease risk prediction using fitted pipelines and selected classifiers."""
    model, scaler = get_model_and_scaler(disease, model_name)
    
    if model is None or scaler is None:
        return {
            "disease": disease,
            "model_used": model_name,
            "model_loaded": False,
            "result": "Model Not Trained",
            "probability": None,
            "confidence_percent": None,
            "risk_level": "unknown",
            "message": f"Trained model for {disease.title()} is not loaded. Please run the ML training pipeline.",
            "disclaimer": DISCLAIMER_TEXT
        }

    # Select expected columns
    if disease == "diabetes":
        col_order = DIABETES_COLS
        # Map frontend key variants
        mapped_vals = [
            float(inputs.get("pregnancies", inputs.get("Pregnancies", 0))),
            float(inputs.get("glucose", inputs.get("Glucose", 120))),
            float(inputs.get("blood_pressure", inputs.get("BloodPressure", 70))),
            float(inputs.get("skin_thickness", inputs.get("SkinThickness", 20))),
            float(inputs.get("insulin", inputs.get("Insulin", 80))),
            float(inputs.get("bmi", inputs.get("BMI", 25.0))),
            float(inputs.get("diabetes_pedigree", inputs.get("DiabetesPedigreeFunction", 0.5))),
            float(inputs.get("age", inputs.get("Age", 35)))
        ]
    elif disease == "heart":
        col_order = HEART_COLS
        mapped_vals = [
            float(inputs.get("age", 55)),
            float(inputs.get("sex", 1)),
            float(inputs.get("cp", 0)),
            float(inputs.get("trestbps", 130)),
            float(inputs.get("chol", 240)),
            float(inputs.get("fbs", 0)),
            float(inputs.get("restecg", 0)),
            float(inputs.get("thalach", 150)),
            float(inputs.get("exang", 0)),
            float(inputs.get("oldpeak", 1.0)),
            float(inputs.get("slope", 1)),
            float(inputs.get("ca", 0)),
            float(inputs.get("thal", 2))
        ]
    elif disease == "kidney":
        col_order = KIDNEY_COLS
        mapped_vals = [
            float(inputs.get("bp", 80)),
            float(inputs.get("sg", 1.020)),
            float(inputs.get("al", 0)),
            float(inputs.get("su", 0)),
            float(inputs.get("bgr", 110)),
            float(inputs.get("bu", 35)),
            float(inputs.get("sc", 1.0)),
            float(inputs.get("sod", 138)),
            float(inputs.get("pot", 4.5)),
            float(inputs.get("hemo", 14.0)),
            float(inputs.get("pcv", 42)),
            float(inputs.get("wc", 8000)),
            float(inputs.get("rc", 5.0))
        ]
    else:
        raise ValueError(f"Unknown disease: {disease}")

    try:
        import pandas as pd
        input_df = pd.DataFrame([mapped_vals], columns=col_order)
        X_scaled = scaler.transform(input_df)

        if hasattr(model, "predict_proba"):
            proba = float(model.predict_proba(X_scaled)[0][1])
        else:
            pred = int(model.predict(X_scaled)[0])
            proba = 0.85 if pred == 1 else 0.15

        is_higher_risk = proba >= 0.50
        result_text = "Higher Potential Risk Indication" if is_higher_risk else "Low Potential Risk Indication"
        risk_level = "higher" if is_higher_risk else "low"
        
        # Format human-readable input summary
        input_summary = {k: v for k, v in zip(col_order, mapped_vals)}

        return {
            "disease": disease,
            "model_used": model.__class__.__name__,
            "model_loaded": True,
            "result": result_text,
            "risk_level": risk_level,
            "probability": round(proba, 4),
            "confidence_percent": round(proba * 100, 1),
            "input_parameters": input_summary,
            "disclaimer": DISCLAIMER_TEXT
        }
    except Exception as exc:
        logger.error("Prediction computation error: %s", exc)
        return {
            "disease": disease,
            "model_used": model_name,
            "model_loaded": True,
            "result": "Evaluation Error",
            "probability": None,
            "confidence_percent": None,
            "risk_level": "unknown",
            "message": f"Calculation error: {str(exc)}",
            "disclaimer": DISCLAIMER_TEXT
        }


def get_disease_metrics(disease: str) -> dict[str, Any]:
    """Load stored real performance metrics from trained_models/."""
    metrics_path = MODELS_DIR / f"{disease}_metrics.json"
    if not metrics_path.exists():
        return {
            "disease": disease,
            "model_loaded": False,
            "error": "Model has not been trained yet. Please run ML training."
        }
    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["model_loaded"] = True
        return data
    except Exception as exc:
        return {"disease": disease, "model_loaded": False, "error": str(exc)}
