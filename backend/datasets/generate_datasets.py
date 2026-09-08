"""
generate_datasets.py - Generates realistic synthetic clinical datasets calibrated to diagnostic standards:
1. Diabetes (ADA diagnostic criteria, n=1000, ~40% positive)
2. Heart Disease (ACC/AHA clinical criteria, n=1000, ~46% positive)
3. Kidney Disease (KDIGO nephrology criteria, n=1000, balanced ~50% positive with realistic missing values)
"""

import os
import numpy as np
import pandas as pd
from pathlib import Path

DATASETS_DIR = Path(__file__).resolve().parent


def generate_diabetes(n_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates realistic clinical diabetes dataset calibrated to American Diabetes Association (ADA) criteria.
    - Diagnostic threshold: Fasting Plasma Glucose >= 126 mg/dL, Insulin resistance & Elevated BMI.
    - Biological edge cases: ~0.7% overlap.
    """
    np.random.seed(random_state)
    
    # 40% positive, 60% negative (stratified)
    is_diabetic = np.random.rand(n_samples) < 0.40
    
    age = np.random.randint(21, 81, size=n_samples)
    pregnancies = np.random.poisson(lam=2.5, size=n_samples)
    pregnancies = np.clip(pregnancies, 0, 15)
    
    bmi = np.where(
        is_diabetic,
        np.random.normal(loc=34.2, scale=4.8, size=n_samples),
        np.random.normal(loc=24.5, scale=3.5, size=n_samples)
    ).clip(18.0, 58.0)
    
    blood_pressure = np.where(
        is_diabetic,
        np.random.normal(loc=82, scale=10, size=n_samples),
        np.random.normal(loc=72, scale=8, size=n_samples)
    ).clip(50, 122)
    
    skin_thickness = np.where(
        is_diabetic,
        np.random.normal(loc=32, scale=7, size=n_samples),
        np.random.normal(loc=21, scale=6, size=n_samples)
    ).clip(7, 65)
    
    diabetes_pedigree = np.where(
        is_diabetic,
        np.random.gamma(shape=2.5, scale=0.30, size=n_samples),
        np.random.gamma(shape=1.8, scale=0.18, size=n_samples)
    ).clip(0.10, 2.45)
    
    # Fasting glucose: ADA threshold >= 126 mg/dL for diabetes
    glucose = np.where(
        is_diabetic,
        np.random.normal(loc=156, scale=16, size=n_samples).clip(126, 225),
        np.random.normal(loc=96, scale=10, size=n_samples).clip(65, 122)
    )
    
    # Fasting serum insulin: elevated in insulin-resistant Type 2 diabetes
    insulin = np.where(
        is_diabetic,
        np.random.normal(loc=162, scale=38, size=n_samples).clip(85, 480),
        np.random.normal(loc=65, scale=18, size=n_samples).clip(15, 125)
    )
    
    # Controlled biological edge cases (~0.7% boundary variance)
    flip = np.random.rand(n_samples) < 0.007
    outcome = np.where(flip, 1 - is_diabetic.astype(int), is_diabetic.astype(int))
    
    df = pd.DataFrame({
        "Pregnancies": pregnancies,
        "Glucose": np.round(glucose, 1),
        "BloodPressure": np.round(blood_pressure, 1),
        "SkinThickness": np.round(skin_thickness, 1),
        "Insulin": np.round(insulin, 1),
        "BMI": np.round(bmi, 1),
        "DiabetesPedigreeFunction": np.round(diabetes_pedigree, 3),
        "Age": age,
        "Outcome": outcome
    })
    return df


def generate_heart(n_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates realistic cardiovascular dataset calibrated to ACC/AHA clinical criteria.
    - Clinical indicators: Exercise-induced angina, ST depression (oldpeak >= 1.5), fluoroscopy vessel defects, reversible thal defects.
    - Biological edge cases: ~0.6% overlap.
    """
    np.random.seed(random_state)
    
    is_heart = np.random.rand(n_samples) < 0.46
    
    age = np.where(is_heart, np.random.randint(48, 79, size=n_samples), np.random.randint(29, 66, size=n_samples))
    sex = np.random.choice([1, 0], size=n_samples, p=[0.68, 0.32])
    
    cp = np.where(
        is_heart,
        np.random.choice([0, 1, 2], size=n_samples, p=[0.72, 0.18, 0.10]),
        np.random.choice([1, 2, 3], size=n_samples, p=[0.18, 0.46, 0.36])
    )
    
    trestbps = np.where(
        is_heart,
        np.random.normal(144, 12, size=n_samples),
        np.random.normal(120, 10, size=n_samples)
    ).clip(94, 200)
    
    chol = np.where(
        is_heart,
        np.random.normal(272, 30, size=n_samples),
        np.random.normal(214, 24, size=n_samples)
    ).clip(126, 560)
    
    fbs = np.where(
        is_heart,
        np.random.choice([1, 0], size=n_samples, p=[0.30, 0.70]),
        np.random.choice([1, 0], size=n_samples, p=[0.05, 0.95])
    )
    
    restecg = np.random.choice([0, 1, 2], size=n_samples, p=[0.48, 0.50, 0.02])
    
    thalach = np.where(
        is_heart,
        np.random.normal(120, 11, size=n_samples),
        np.random.normal(166, 11, size=n_samples)
    ).clip(71, 202)
    
    exang = np.where(
        is_heart,
        np.random.choice([1, 0], size=n_samples, p=[0.90, 0.10]),
        np.random.choice([1, 0], size=n_samples, p=[0.03, 0.97])
    )
    
    oldpeak = np.where(
        is_heart,
        np.random.normal(2.6, 0.65, size=n_samples),
        np.random.normal(0.3, 0.28, size=n_samples)
    ).clip(0.0, 6.2)
    
    slope = np.where(
        is_heart,
        np.random.choice([0, 1, 2], size=n_samples, p=[0.25, 0.65, 0.10]),
        np.random.choice([1, 2], size=n_samples, p=[0.20, 0.80])
    )
    
    ca = np.where(
        is_heart,
        np.random.choice([1, 2, 3], size=n_samples, p=[0.45, 0.35, 0.20]),
        np.random.choice([0, 1], size=n_samples, p=[0.97, 0.03])
    )
    
    thal = np.where(
        is_heart,
        np.random.choice([2, 3], size=n_samples, p=[0.15, 0.85]),
        np.random.choice([1, 2], size=n_samples, p=[0.20, 0.80])
    )
    
    # Controlled biological edge cases (~0.6% boundary variance)
    flip = np.random.rand(n_samples) < 0.006
    target = np.where(flip, 1 - is_heart.astype(int), is_heart.astype(int))
    
    df = pd.DataFrame({
        "age": age,
        "sex": sex,
        "cp": cp,
        "trestbps": np.round(trestbps, 1),
        "chol": np.round(chol, 1),
        "fbs": fbs,
        "restecg": restecg,
        "thalach": np.round(thalach, 1),
        "exang": exang,
        "oldpeak": np.round(oldpeak, 1),
        "slope": slope,
        "ca": ca,
        "thal": thal,
        "target": target
    })
    return df


def generate_kidney(n_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates realistic nephrology dataset calibrated to KDIGO clinical practice guidelines.
    - Clinical indicators: Elevated serum creatinine (sc >= 1.6 mg/dL), Albuminuria (al >= 1), Fixed low specific gravity (sg <= 1.015), Renal anemia (hemo <= 11 g/dL).
    - Fixes previous class imbalance bug by providing balanced ~50/50 classes.
    - Biological edge cases: ~0.5% overlap, with ~5% realistic missing clinical values.
    """
    np.random.seed(random_state)
    
    # Balanced classes 50% CKD / 50% Non-CKD
    is_ckd = np.random.rand(n_samples) < 0.50
    
    bp = np.where(
        is_ckd,
        np.random.normal(86, 12, size=n_samples),
        np.random.normal(72, 8, size=n_samples)
    ).clip(50, 180)
    
    # In CKD, renal tubules fail to concentrate urine (sg 1.005 - 1.015); healthy concentrates (1.020 - 1.025)
    sg = np.where(
        is_ckd,
        np.random.choice([1.005, 1.010, 1.015], size=n_samples, p=[0.35, 0.45, 0.20]),
        np.random.choice([1.020, 1.025], size=n_samples, p=[0.55, 0.45])
    )
    
    al = np.where(
        is_ckd,
        np.random.choice([1, 2, 3, 4], size=n_samples, p=[0.35, 0.35, 0.20, 0.10]),
        np.zeros(n_samples, dtype=int)
    )
    
    su = np.where(
        is_ckd,
        np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.50, 0.25, 0.15, 0.10]),
        np.zeros(n_samples, dtype=int)
    )
    
    bgr = np.where(
        is_ckd,
        np.random.normal(160, 45, size=n_samples),
        np.random.normal(102, 14, size=n_samples)
    ).clip(50, 490)
    
    bu = np.where(
        is_ckd,
        np.random.normal(72, 26, size=n_samples),
        np.random.normal(28, 6, size=n_samples)
    ).clip(10, 390)
    
    sc = np.where(
        is_ckd,
        np.random.exponential(scale=2.0, size=n_samples) + 1.6,
        np.random.normal(0.85, 0.16, size=n_samples)
    ).clip(0.4, 25.0)
    
    sod = np.where(
        is_ckd,
        np.random.normal(132, 5, size=n_samples),
        np.random.normal(140, 3, size=n_samples)
    ).clip(100, 165)
    
    pot = np.where(
        is_ckd,
        np.random.normal(4.9, 0.7, size=n_samples),
        np.random.normal(4.3, 0.35, size=n_samples)
    ).clip(2.5, 9.5)
    
    hemo = np.where(
        is_ckd,
        np.random.normal(9.8, 1.5, size=n_samples),
        np.random.normal(14.8, 1.1, size=n_samples)
    ).clip(3.1, 17.8)
    
    pcv = hemo * 3.1 + np.random.normal(0, 1.5, size=n_samples)
    pcv = np.clip(pcv, 9, 54)
    
    wc = np.random.normal(loc=8200, scale=2400, size=n_samples).clip(2200, 26400)
    rc = hemo / 3.0 + np.random.normal(0, 0.28, size=n_samples)
    rc = np.clip(rc, 2.1, 8.0)
    
    # Controlled biological edge cases (~0.4% boundary variance)
    flip = np.random.rand(n_samples) < 0.004
    classification = np.where(flip, 1 - is_ckd.astype(int), is_ckd.astype(int))
    
    df = pd.DataFrame({
        "bp": np.round(bp, 1),
        "sg": sg,
        "al": al,
        "su": su,
        "bgr": np.round(bgr, 1),
        "bu": np.round(bu, 1),
        "sc": np.round(sc, 2),
        "sod": np.round(sod, 1),
        "pot": np.round(pot, 1),
        "hemo": np.round(hemo, 1),
        "pcv": np.round(pcv, 1),
        "wc": np.round(wc, 0),
        "rc": np.round(rc, 2),
        "classification": classification
    })
    
    # Add realistic ~5% missing test values randomly across clinical columns (excluding target)
    for col in ["bp", "sg", "al", "su", "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wc", "rc"]:
        mask = np.random.rand(n_samples) < 0.05
        df.loc[mask, col] = np.nan
        
    return df


def generate_all():
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    
    df_diabetes = generate_diabetes()
    diabetes_path = DATASETS_DIR / "diabetes.csv"
    df_diabetes.to_csv(diabetes_path, index=False)
    print(f"[Diabetes] Saved {len(df_diabetes)} rows to {diabetes_path} (Positive: {df_diabetes['Outcome'].sum()} / {len(df_diabetes)})")
    
    df_heart = generate_heart()
    heart_path = DATASETS_DIR / "heart_disease.csv"
    df_heart.to_csv(heart_path, index=False)
    print(f"[Heart] Saved {len(df_heart)} rows to {heart_path} (Positive: {df_heart['target'].sum()} / {len(df_heart)})")
    
    df_kidney = generate_kidney()
    kidney_path = DATASETS_DIR / "kidney_disease.csv"
    df_kidney.to_csv(kidney_path, index=False)
    print(f"[Kidney] Saved {len(df_kidney)} rows to {kidney_path} (Positive: {df_kidney['classification'].sum()} / {len(df_kidney)})")


if __name__ == "__main__":
    generate_all()

