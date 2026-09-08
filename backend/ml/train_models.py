"""
train_models.py - Multi-classifier training and real metrics evaluation for AarogyaAI:
- Trains: Random Forest, Logistic Regression, Decision Tree, K-Nearest Neighbors
- Calculates real test metrics (Accuracy, Precision, Recall, F1 Score, ROC-AUC, Confusion Matrix)
- Saves primary and selectable model artifacts to backend/trained_models/
"""

import json
import os
import sys
import logging
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DATASETS_DIR = BACKEND_DIR / "datasets"
TRAINED_MODELS_DIR = BACKEND_DIR / "trained_models"

if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from preprocessing import (
    DIABETES_FEATURES, HEART_FEATURES, KIDNEY_FEATURES,
    create_diabetes_pipeline, create_heart_pipeline, create_kidney_pipeline,
    get_feature_importances
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ml_train")


def get_classifiers():
    return {
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42),
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "DecisionTree": DecisionTreeClassifier(max_depth=6, random_state=42),
        "KNN": KNeighborsClassifier(n_neighbors=5),
    }


def train_and_evaluate_disease(
    disease: str,
    df: pd.DataFrame,
    feature_cols: list[str],
    target_col: str,
    pipeline_factory,
    class_labels: list[str]
):
    logger.info("==================================================")
    logger.info("Training models for disease module: %s", disease.upper())
    logger.info("Dataset shape: %s, Features: %d", df.shape, len(feature_cols))

    X = df[feature_cols].copy()
    y = df[target_col].copy()

    # Preprocess features
    pipeline = pipeline_factory()
    X_transformed = pipeline.fit_transform(X)

    # 80/20 train/test split with stratify
    X_train, X_test, y_train, y_test = train_test_split(
        X_transformed, y, test_size=0.20, random_state=42, stratify=y
    )

    models = get_classifiers()
    results = {}
    best_name = None
    best_f1 = -1.0

    # Save fitted preprocessor/scaler
    scaler_path = TRAINED_MODELS_DIR / f"{disease}_scaler.pkl"
    joblib.dump(pipeline, scaler_path)
    logger.info("Saved fitted pipeline -> %s", scaler_path)

    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        # Calculate proba for AUC
        if hasattr(model, "predict_proba"):
            y_proba = model.predict_proba(X_test)[:, 1]
            auc = round(float(roc_auc_score(y_test, y_proba)), 4)
        else:
            auc = 0.5

        acc = round(float(accuracy_score(y_test, y_pred)), 4)
        prec = round(float(precision_score(y_test, y_pred, zero_division=0)), 4)
        rec = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)
        f1 = round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
        cm = confusion_matrix(y_test, y_pred).tolist()

        importances = get_feature_importances(model, feature_cols)

        results[name] = {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "auc_roc": auc,
            "confusion_matrix": cm,
            "feature_importances": importances
        }

        # Save model instance
        joblib.dump(model, TRAINED_MODELS_DIR / f"{disease}_{name}_model.pkl")

        logger.info("  [%s] Acc: %.4f | Prec: %.4f | Rec: %.4f | F1: %.4f | AUC: %.4f",
                    name, acc, prec, rec, f1, auc)

        if f1 > best_f1:
            best_f1 = f1
            best_name = name

    # Default to RandomForest if close or top
    primary_name = "RandomForest" if "RandomForest" in models else best_name
    primary_model = models[primary_name]
    
    # Save default primary model
    joblib.dump(primary_model, TRAINED_MODELS_DIR / f"{disease}_model.pkl")
    
    # Prepare comprehensive metrics payload
    metrics_data = {
        "disease": disease,
        "default_model": primary_name,
        "best_model": best_name,
        "accuracy": results[primary_name]["accuracy"],
        "precision": results[primary_name]["precision"],
        "recall": results[primary_name]["recall"],
        "f1_score": results[primary_name]["f1_score"],
        "auc_roc": results[primary_name]["auc_roc"],
        "labels": class_labels,
        "confusion_matrix": results[primary_name]["confusion_matrix"],
        "feature_names": feature_cols,
        "feature_importances": results[primary_name]["feature_importances"],
        "models_compared": [
            {
                "name": m_name,
                "accuracy": m_res["accuracy"],
                "precision": m_res["precision"],
                "recall": m_res["recall"],
                "f1_score": m_res["f1_score"],
                "auc_roc": m_res["auc_roc"],
                "confusion_matrix": m_res["confusion_matrix"]
            }
            for m_name, m_res in results.items()
        ],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test))
    }

    # Save metrics JSON
    metrics_path = TRAINED_MODELS_DIR / f"{disease}_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    # Save confusion matrix JSON
    cm_path = TRAINED_MODELS_DIR / f"{disease}_confusion_matrix.json"
    with open(cm_path, "w", encoding="utf-8") as f:
        json.dump({
            "disease": disease,
            "labels": class_labels,
            "matrix": results[primary_name]["confusion_matrix"]
        }, f, indent=2)

    logger.info("Saved metrics -> %s", metrics_path)
    return metrics_data


def train_all():
    TRAINED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Diabetes
    diabetes_csv = DATASETS_DIR / "diabetes.csv"
    if not diabetes_csv.exists():
        logger.info("Generating datasets first...")
        from datasets.generate_datasets import generate_all
        generate_all()
        
    df_diabetes = pd.read_csv(diabetes_csv)
    train_and_evaluate_disease(
        disease="diabetes",
        df=df_diabetes,
        feature_cols=DIABETES_FEATURES,
        target_col="Outcome",
        pipeline_factory=create_diabetes_pipeline,
        class_labels=["Lower Risk", "Higher Risk"]
    )

    # 2. Heart Disease
    df_heart = pd.read_csv(DATASETS_DIR / "heart_disease.csv")
    train_and_evaluate_disease(
        disease="heart",
        df=df_heart,
        feature_cols=HEART_FEATURES,
        target_col="target",
        pipeline_factory=create_heart_pipeline,
        class_labels=["Lower Risk", "Higher Risk"]
    )

    # 3. Kidney Disease
    df_kidney = pd.read_csv(DATASETS_DIR / "kidney_disease.csv")
    train_and_evaluate_disease(
        disease="kidney",
        df=df_kidney,
        feature_cols=KIDNEY_FEATURES,
        target_col="classification",
        pipeline_factory=create_kidney_pipeline,
        class_labels=["Lower Risk", "Higher Risk"]
    )

    logger.info("All 3 disease models successfully trained and evaluated.")

if __name__ == "__main__":
    train_all()
