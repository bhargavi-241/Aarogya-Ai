"""
run_training.py - Master execution script to generate datasets and train/evaluate all models.
"""

import sys
import os
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DATASETS_DIR = BACKEND_DIR / "datasets"

sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(SCRIPT_DIR))
sys.path.insert(0, str(DATASETS_DIR))

from generate_datasets import generate_all
from train_models import train_all

def main():
    start_time = time.time()
    print("\n========================================================")
    print("            AAROGYA AI - ML TRAINING PIPELINE        ")
    print("========================================================\n")
    
    print("[1/2] Generating clinically plausible synthetic datasets...")
    generate_all()
    print(">> Datasets ready.\n")
    
    print("[2/2] Training & evaluating candidate classifiers (RF, LR, DT, KNN)...")
    train_all()
    print(">> All models and metrics artifacts generated.\n")
    
    duration = time.time() - start_time
    print(f"========================================================")
    print(f" ML Pipeline completed successfully in {duration:.2f} seconds.")
    print(f" Artifacts saved to: {BACKEND_DIR / 'trained_models'}")
    print(f"========================================================\n")

if __name__ == "__main__":
    main()
