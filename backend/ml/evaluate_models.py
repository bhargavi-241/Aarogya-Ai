"""
evaluate_models.py - Standalone model evaluation and metrics inspector.
"""

import json
from pathlib import Path

TRAINED_MODELS_DIR = Path(__file__).resolve().parent.parent / "trained_models"

def evaluate_all():
    print("\n========================================================")
    print("            AAROGYA AI - MODEL EVALUATION REPORT     ")
    print("========================================================\n")
    
    for disease in ["diabetes", "heart", "kidney"]:
        metrics_file = TRAINED_MODELS_DIR / f"{disease}_metrics.json"
        if not metrics_file.exists():
            print(f"[{disease.upper()}] No metrics found. Please run train_models.py first.")
            continue
            
        with open(metrics_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        print(f"--- Disease: {disease.upper()} ---")
        print(f"  Primary Model : {data.get('default_model', 'N/A')}")
        print(f"  Accuracy      : {data.get('accuracy', 0.0) * 100:.2f}%")
        print(f"  Precision     : {data.get('precision', 0.0) * 100:.2f}%")
        print(f"  Recall        : {data.get('recall', 0.0) * 100:.2f}%")
        print(f"  F1 Score      : {data.get('f1_score', 0.0) * 100:.2f}%")
        print(f"  AUC-ROC       : {data.get('auc_roc', 0.0):.4f}")
        print(f"  Confusion Matrix: {data.get('confusion_matrix', [])}")
        
        print("\n  Candidate Models Comparison:")
        for m in data.get("models_compared", []):
            print(f"    - {m['name']:<20}: Acc={m['accuracy']*100:5.2f}% | F1={m['f1_score']*100:5.2f}% | AUC={m['auc_roc']:.4f}")
        print()

if __name__ == "__main__":
    evaluate_all()
