"""
preprocessing.py - Data cleaning, missing value imputation, scaling, and feature transformation pipelines for each disease module.
"""

from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Any, Tuple
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer

DIABETES_FEATURES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
]

HEART_FEATURES = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]

KIDNEY_FEATURES = [
    "bp", "sg", "al", "su", "bgr", "bu", "sc", "sod", "pot",
    "hemo", "pcv", "wc", "rc"
]

def create_diabetes_pipeline() -> Pipeline:
    """Imputer + StandardScaler for numerical features."""
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

def create_heart_pipeline() -> Pipeline:
    """Imputer + StandardScaler for heart dataset."""
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

def create_kidney_pipeline() -> Pipeline:
    """Handles missing values with median imputation + StandardScaler."""
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

def get_feature_importances(model: Any, feature_names: list[str]) -> list[dict[str, Any]]:
    """Extract feature importance or coefficients, returning a sorted list of dicts."""
    importances = []
    try:
        if hasattr(model, "feature_importances_"):
            raw = model.feature_importances_
            for name, val in zip(feature_names, raw):
                importances.append({"feature": name, "importance": round(float(val), 4)})
        elif hasattr(model, "coef_"):
            raw = np.abs(model.coef_[0])
            total = np.sum(raw) if np.sum(raw) > 0 else 1.0
            norm_val = raw / total
            for name, val in zip(feature_names, norm_val):
                importances.append({"feature": name, "importance": round(float(val), 4)})
        else:
            # Fallback uniform importance
            for name in feature_names:
                importances.append({"feature": name, "importance": round(1.0 / len(feature_names), 4)})
        
        importances.sort(key=lambda x: x["importance"], reverse=True)
    except Exception:
        for name in feature_names:
            importances.append({"feature": name, "importance": round(1.0 / len(feature_names), 4)})
            
    return importances
