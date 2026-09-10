"""
explanation_service.py - Plain-language medical explanations for patients.
Converts complex clinical terms, medicines, diagnostic concepts, and laboratory tests
into structured, easy-to-understand cards and tooltips.
"""

from __future__ import annotations
import logging
import os
from typing import Any
import httpx

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "This explanation is for educational purposes only and is not a substitute for professional medical advice, "
    "diagnosis, or treatment. Always consult your doctor or healthcare professional."
)

MEDICAL_EXPLANATIONS: dict[str, dict[str, Any]] = {
    # ------------------ Common Medications ------------------
    "metformin": {
        "term": "Metformin",
        "simple_explanation": "A widely prescribed oral medicine that helps maintain healthy blood sugar levels in type 2 diabetes.",
        "why_it_matters": "It reduces the amount of glucose your liver produces and helps your body's cells respond better to insulin.",
        "reference_info": "Commonly taken with meals to prevent mild stomach upset.",
        "important_points": [
            "Take with meals to reduce stomach discomfort.",
            "Avoid heavy alcohol consumption while taking this medication.",
            "Regular kidney function monitoring is standard practice."
        ]
    },
    "aspirin": {
        "term": "Aspirin",
        "simple_explanation": "A medication used in low doses as a blood thinner to prevent blood clots, and in higher doses for pain and fever.",
        "why_it_matters": "Helps reduce the risk of heart attacks and strokes by preventing blood platelets from clumping together.",
        "reference_info": "Low-dose aspirin is typically 75 mg to 81 mg daily.",
        "important_points": [
            "Take with food or milk to minimize stomach irritation.",
            "Inform your doctor or dentist before any surgical or dental procedures.",
            "Seek medical guidance if you notice unusual bleeding or bruising."
        ]
    },
    "atorvastatin": {
        "term": "Atorvastatin",
        "simple_explanation": "A cholesterol-lowering medication from the statin family used to lower LDL ('bad') cholesterol.",
        "why_it_matters": "Reduces plaque buildup in arteries, significantly decreasing cardiovascular risks like heart attacks.",
        "reference_info": "Often prescribed once daily in the evening.",
        "important_points": [
            "Report unexplained muscle soreness or weakness to your doctor.",
            "Avoid consuming large amounts of grapefruit juice while on this medicine."
        ]
    },
    "lisinopril": {
        "term": "Lisinopril",
        "simple_explanation": "An ACE inhibitor medication used to lower high blood pressure and protect heart and kidney function.",
        "why_it_matters": "Relaxes blood vessels so blood flows more smoothly, reducing the workload on your heart.",
        "reference_info": "Target blood pressure is typically below 130/80 mmHg.",
        "important_points": [
            "A dry, persistent cough can occur as a harmless but known side effect.",
            "Stay adequately hydrated to prevent lightheadedness."
        ]
    },
    "amlodipine": {
        "term": "Amlodipine",
        "simple_explanation": "A calcium channel blocker that lowers blood pressure and relieves chest pain (angina).",
        "why_it_matters": "Widens arterial blood vessels to improve blood flow and oxygen delivery to the heart muscle.",
        "reference_info": "Usually taken once daily with or without food.",
        "important_points": [
            "Mild ankle or foot swelling can sometimes occur.",
            "Do not discontinue abruptly without speaking to your doctor."
        ]
    },
    "omeprazole": {
        "term": "Omeprazole",
        "simple_explanation": "A proton pump inhibitor (PPI) that reduces stomach acid production.",
        "why_it_matters": "Heals and prevents stomach ulcers, acid reflux (GERD), and heartburn.",
        "reference_info": "Best taken 30 to 60 minutes before breakfast.",
        "important_points": [
            "Intended for defined treatment courses as recommended by your physician."
        ]
    },
    "pantoprazole": {
        "term": "Pantoprazole",
        "simple_explanation": "A medicine that decreases stomach acid secretion to treat heartburn, gastritis, and ulcers.",
        "why_it_matters": "Protects the stomach lining and allows inflamed esophageal tissue to heal.",
        "reference_info": "Often prescribed once daily before morning breakfast.",
        "important_points": [
            "Swallow whole; do not crush or chew delayed-release tablets."
        ]
    },
    "paracetamol": {
        "term": "Paracetamol / Acetaminophen",
        "simple_explanation": "A common pain reliever and fever reducer used for headaches, muscle aches, and viral fevers.",
        "why_it_matters": "Provides relief from discomfort without irritating the stomach lining.",
        "reference_info": "Do not exceed the maximum daily limit (usually 3000-4000 mg in adults).",
        "important_points": [
            "Check other over-the-counter cold medicines to avoid accidental double dosing."
        ]
    },
    "telmisartan": {
        "term": "Telmisartan",
        "simple_explanation": "An Angiotensin Receptor Blocker (ARB) that manages high blood pressure and protects cardiovascular health.",
        "why_it_matters": "Blocks blood vessels from constricting, keeping arterial pressure within a healthy range.",
        "reference_info": "Typically taken once daily at the same time each day.",
        "important_points": [
            "Regular blood pressure checks help ensure the dose is optimal."
        ]
    },
    "levothyroxine": {
        "term": "Levothyroxine",
        "simple_explanation": "A synthetic thyroid hormone replacement used to treat an underactive thyroid (hypothyroidism).",
        "why_it_matters": "Restores normal energy levels, metabolism, and body temperature regulation.",
        "reference_info": "Best taken on an empty stomach with plain water at least 30-60 minutes before breakfast.",
        "important_points": [
            "Avoid calcium or iron supplements within 4 hours of your dose.",
            "Periodic TSH blood tests are needed to calibrate your dose."
        ]
    },

    # ------------------ Hematology & CBC ------------------
    "hemoglobin": {
        "term": "Hemoglobin (Hb)",
        "simple_explanation": "The iron-rich protein inside red blood cells that carries oxygen from your lungs to all tissues.",
        "why_it_matters": "Low levels (anemia) cause tiredness, weakness, and shortness of breath; high levels can occur with dehydration.",
        "reference_info": "Typically 12.0–15.5 g/dL for women and 13.5–17.5 g/dL for men.",
        "important_points": [
            "Dietary iron, vitamin B12, and hydration status influence hemoglobin.",
            "Always review low hemoglobin with your doctor to find the underlying cause."
        ]
    },
    "wbc": {
        "term": "Total White Blood Cell Count (WBC)",
        "simple_explanation": "The infection-fighting immune cells in your bloodstream.",
        "why_it_matters": "High counts usually indicate your immune system is responding to an infection or inflammation.",
        "reference_info": "Standard reference range is 4,000 to 11,000 cells/cumm.",
        "important_points": [
            "Temporary elevations are normal during physical stress or bacterial/viral colds."
        ]
    },
    "rbc": {
        "term": "Red Blood Cell Count (RBC)",
        "simple_explanation": "The actual number of red blood cells in a sample of blood.",
        "why_it_matters": "Red cells carry oxygen and vital nutrients to all body organs.",
        "reference_info": "Usually 3.8 to 5.8 million cells/cumm.",
        "important_points": [
            "Interpreted alongside hemoglobin and hematocrit (PCV)."
        ]
    },
    "platelet count": {
        "term": "Platelet Count",
        "simple_explanation": "Tiny cell fragments in the blood that stick together to form clots and stop bleeding.",
        "why_it_matters": "Low counts can lead to easy bruising or nosebleeds; elevated counts can occur with inflammation.",
        "reference_info": "Normal range is roughly 150,000 to 450,000 cells/cumm.",
        "important_points": [
            "Viral infections like dengue often cause temporary drops in platelets."
        ]
    },
    "platelets": {
        "term": "Platelet Count",
        "simple_explanation": "Tiny cell fragments in the blood that stick together to form clots and stop bleeding.",
        "why_it_matters": "Low counts can lead to easy bruising or nosebleeds; elevated counts can occur with inflammation.",
        "reference_info": "Normal range is roughly 150,000 to 450,000 cells/cumm.",
        "important_points": [
            "Viral infections like dengue often cause temporary drops in platelets."
        ]
    },
    "pcv": {
        "term": "Packed Cell Volume (Hematocrit / PCV)",
        "simple_explanation": "The percentage of your total blood volume that consists of red blood cells.",
        "why_it_matters": "Gives a quick snapshot of red cell concentration and hydration status.",
        "reference_info": "Generally 36% to 50%.",
        "important_points": [
            "Values drop in anemia and rise with dehydration."
        ]
    },
    "mcv": {
        "term": "Mean Corpuscular Volume (MCV)",
        "simple_explanation": "Measures the average physical size of individual red blood cells.",
        "why_it_matters": "Helps doctors determine the exact type of anemia (e.g. iron deficiency vs. B12 deficiency).",
        "reference_info": "Standard normal range is 80 to 100 fL.",
        "important_points": [
            "Small cells (low MCV) suggest iron deficiency; large cells (high MCV) suggest B12/folate deficit."
        ]
    },
    "neutrophils": {
        "term": "Neutrophils",
        "simple_explanation": "The frontline white blood cells that specifically combat bacterial infections.",
        "why_it_matters": "Rapidly increase when your body encounters bacterial pathogens.",
        "reference_info": "Usually constitutes 40% to 75% of total white blood cells.",
        "important_points": [
            "Elevations are common in acute bacterial infections."
        ]
    },
    "lymphocytes": {
        "term": "Lymphocytes",
        "simple_explanation": "White blood cells that generate antibodies and protect against viral infections.",
        "why_it_matters": "Key components of acquired long-term immune memory and defense.",
        "reference_info": "Usually constitutes 20% to 45% of total white blood cells.",
        "important_points": [
            "Elevations frequently indicate viral illnesses like the flu."
        ]
    },
    "esr": {
        "term": "Erythrocyte Sedimentation Rate (ESR)",
        "simple_explanation": "A general blood test that measures how quickly red blood cells settle to the bottom of a test tube.",
        "why_it_matters": "Faster settling indicates active inflammation somewhere in the body.",
        "reference_info": "Normal is generally 0 to 20 mm/hr depending on age and gender.",
        "important_points": [
            "A non-specific marker used to track inflammatory conditions over time."
        ]
    },

    # ------------------ Diabetes & Metabolic ------------------
    "hba1c": {
        "term": "HbA1c (Glycated Hemoglobin)",
        "simple_explanation": "A standard blood test showing your average blood sugar levels over the past 2 to 3 months.",
        "why_it_matters": "Provides an overall picture of blood glucose regulation without being skewed by a single day's meals.",
        "reference_info": "Below 5.7% is normal; 5.7%–6.4% indicates prediabetes; 6.5% or higher on two occasions suggests diabetes.",
        "important_points": [
            "Does not require fasting before the blood draw.",
            "Helps track how well lifestyle or medication is managing glucose."
        ]
    },
    "fasting glucose": {
        "term": "Fasting Blood Glucose (FBS)",
        "simple_explanation": "The amount of sugar in your bloodstream after an overnight fast of at least 8 hours.",
        "why_it_matters": "Indicates baseline glucose control when no food is currently being digested.",
        "reference_info": "Normal is 70 to 99 mg/dL; 100 to 125 mg/dL suggests impaired fasting glucose.",
        "important_points": [
            "Requires avoiding food and sugary drinks for 8-10 hours prior to test."
        ]
    },
    "glucose": {
        "term": "Blood Glucose",
        "simple_explanation": "The main type of sugar present in blood, supplying primary energy to all body cells.",
        "why_it_matters": "Properly regulated glucose ensures organs have steady fuel without damaging blood vessels.",
        "reference_info": "Normal ranges vary depending on whether you fasted or ate recently.",
        "important_points": [
            "Always interpret in context with fasting or post-meal status."
        ]
    },

    # ------------------ Kidney (Renal) Tests ------------------
    "serum creatinine": {
        "term": "Serum Creatinine",
        "simple_explanation": "A normal muscle waste product that healthy kidneys filter out through urine.",
        "why_it_matters": "High levels in the blood suggest the kidneys may not be filtering waste at full efficiency.",
        "reference_info": "Normal range is roughly 0.6 to 1.2 mg/dL.",
        "important_points": [
            "Temporary rises can occur with severe dehydration or strenuous physical workouts.",
            "Doctors use creatinine alongside age and gender to calculate your eGFR."
        ]
    },
    "creatinine": {
        "term": "Serum Creatinine",
        "simple_explanation": "A normal muscle waste product that healthy kidneys filter out through urine.",
        "why_it_matters": "High levels in the blood suggest the kidneys may not be filtering waste at full efficiency.",
        "reference_info": "Normal range is roughly 0.6 to 1.2 mg/dL.",
        "important_points": [
            "Temporary rises can occur with severe dehydration or strenuous physical workouts.",
            "Doctors use creatinine alongside age and gender to calculate your eGFR."
        ]
    },
    "blood urea": {
        "term": "Blood Urea / BUN",
        "simple_explanation": "A nitrogen byproduct produced when the liver breaks down proteins, excreted by kidneys.",
        "why_it_matters": "Helps assess kidney filtration, hydration status, and protein metabolism.",
        "reference_info": "Standard reference range is 15 to 45 mg/dL.",
        "important_points": [
            "Dehydration or high protein diets can mildly elevate urea levels."
        ]
    },
    "uric acid": {
        "term": "Serum Uric Acid",
        "simple_explanation": "A compound created when the body metabolizes purines found in certain foods and cells.",
        "why_it_matters": "High levels can form sharp needle-like crystals in joints (causing gout) or kidneys (stones).",
        "reference_info": "Generally 3.5 to 7.0 mg/dL.",
        "important_points": [
            "Adequate water intake and balanced diet help keep uric acid soluble."
        ]
    },
    "egfr": {
        "term": "Estimated Glomerular Filtration Rate (eGFR)",
        "simple_explanation": "A calculated estimate of how many milliliters of blood your kidneys clean every minute.",
        "why_it_matters": "The primary clinical measure used to evaluate overall kidney function stages.",
        "reference_info": "Values of 90 or above are normal; 60-89 indicates mild reduction; below 60 suggests chronic kidney disease.",
        "important_points": [
            "Calculated mathematically using creatinine, age, and sex."
        ]
    },

    # ------------------ Liver (Hepatic) Tests ------------------
    "total bilirubin": {
        "term": "Total Bilirubin",
        "simple_explanation": "A yellow pigment formed during the natural breakdown of old red blood cells in the liver.",
        "why_it_matters": "Excess bilirubin circulating in blood causes visible yellowing of eyes and skin (jaundice).",
        "reference_info": "Typically 0.2 to 1.2 mg/dL.",
        "important_points": [
            "Elevations can stem from liver processing changes or increased red cell breakdown."
        ]
    },
    "sgot": {
        "term": "SGOT / AST (Aspartate Aminotransferase)",
        "simple_explanation": "An enzyme found in liver cells, heart muscle, and skeletal muscle.",
        "why_it_matters": "Leaked into bloodstream when liver or muscle tissues experience irritation or stress.",
        "reference_info": "Normal range is roughly 10 to 40 U/L.",
        "important_points": [
            "Evaluated together with SGPT (ALT) to pinpoint liver health."
        ]
    },
    "sgpt": {
        "term": "SGPT / ALT (Alanine Aminotransferase)",
        "simple_explanation": "An enzyme concentrated almost entirely inside liver cells.",
        "why_it_matters": "A highly sensitive and specific indicator for active liver irritation or fatty changes.",
        "reference_info": "Normal range is typically 10 to 45 U/L.",
        "important_points": [
            "Mild elevations are very common in fatty liver or after certain medications."
        ]
    },
    "alp": {
        "term": "Alkaline Phosphatase (ALP)",
        "simple_explanation": "An enzyme related to bile drainage ducts in the liver and bone metabolism.",
        "why_it_matters": "Rises when bile flow is slowed or during active bone remodeling and healing.",
        "reference_info": "Generally 30 to 120 U/L in adults.",
        "important_points": [
            "Naturally higher in growing children and pregnant individuals."
        ]
    },
    "albumin": {
        "term": "Serum Albumin",
        "simple_explanation": "The most abundant protein in blood, manufactured exclusively by the liver.",
        "why_it_matters": "Keeps fluid from leaking out of blood vessels into surrounding tissues and transports hormones.",
        "reference_info": "Normal reference range is 3.5 to 5.0 g/dL.",
        "important_points": [
            "Low levels can indicate liver impairment, kidney protein loss, or poor nutrition."
        ]
    },

    # ------------------ Lipid & Cardiovascular ------------------
    "total cholesterol": {
        "term": "Total Cholesterol",
        "simple_explanation": "A composite measurement of all cholesterol types circulating in your bloodstream.",
        "why_it_matters": "High levels can slowly contribute to fatty plaque buildup inside artery walls.",
        "reference_info": "Desirable level is generally below 200 mg/dL.",
        "important_points": [
            "Best analyzed by looking at individual fractions (HDL vs. LDL)."
        ]
    },
    "cholesterol": {
        "term": "Total Cholesterol",
        "simple_explanation": "A composite measurement of all cholesterol types circulating in your bloodstream.",
        "why_it_matters": "High levels can slowly contribute to fatty plaque buildup inside artery walls.",
        "reference_info": "Desirable level is generally below 200 mg/dL.",
        "important_points": [
            "Best analyzed by looking at individual fractions (HDL vs. LDL)."
        ]
    },
    "hdl": {
        "term": "HDL Cholesterol ('Good' Cholesterol)",
        "simple_explanation": "High-Density Lipoprotein that collects excess cholesterol from blood vessels and carries it to the liver.",
        "why_it_matters": "Higher HDL numbers provide protective defense against heart disease.",
        "reference_info": "Above 50 mg/dL is desirable in women, above 40 mg/dL in men.",
        "important_points": [
            "Regular aerobic exercise and healthy fats help boost HDL."
        ]
    },
    "ldl": {
        "term": "LDL Cholesterol ('Bad' Cholesterol)",
        "simple_explanation": "Low-Density Lipoprotein that can deposit excess cholesterol onto arterial walls.",
        "why_it_matters": "A primary target for cardiovascular prevention; lower levels reduce heart attack risks.",
        "reference_info": "Optimal is below 100 mg/dL (or below 70 mg/dL for individuals with cardiac history).",
        "important_points": [
            "Dietary fiber and physical activity help lower LDL."
        ]
    },
    "triglycerides": {
        "term": "Serum Triglycerides",
        "simple_explanation": "The most common form of stored fat in the body, derived from dietary sugars and fats.",
        "why_it_matters": "High levels contribute to artery hardening and metabolic syndrome.",
        "reference_info": "Normal fasting level is below 150 mg/dL.",
        "important_points": [
            "Limiting refined carbohydrates and sugars helps reduce triglycerides."
        ]
    },

    # ------------------ Thyroid Profile ------------------
    "tsh": {
        "term": "Thyroid Stimulating Hormone (TSH)",
        "simple_explanation": "A master hormone from the pituitary gland that instructs the thyroid to make energy hormones.",
        "why_it_matters": "High TSH means your thyroid is underactive (hypothyroidism); low TSH suggests an overactive thyroid.",
        "reference_info": "Standard reference range is 0.4 to 4.5 uIU/mL.",
        "important_points": [
            "A sensitive frontline screening test for thyroid health."
        ]
    },
    "t3": {
        "term": "Total Triiodothyronine (T3)",
        "simple_explanation": "The active thyroid hormone controlling body temperature, metabolic rate, and heartbeat.",
        "why_it_matters": "Provides direct information on active thyroid hormone levels.",
        "reference_info": "Usually 80 to 200 ng/dL.",
        "important_points": [
            "Evaluated alongside T4 and TSH."
        ]
    },
    "t4": {
        "term": "Total Thyroxine (T4)",
        "simple_explanation": "The primary storage hormone manufactured by the thyroid gland.",
        "why_it_matters": "Converted into active T3 in body tissues to sustain metabolism.",
        "reference_info": "Standard reference is 4.5 to 12.0 ug/dL.",
        "important_points": [
            "Helps confirm thyroid diagnosis alongside TSH."
        ]
    },

    # ------------------ Electrolytes ------------------
    "sodium": {
        "term": "Serum Sodium (Na+)",
        "simple_explanation": "A vital electrolyte that controls fluid balance, blood pressure, and nerve transmission.",
        "why_it_matters": "Both low and high sodium levels can cause confusion, lethargy, or muscle weakness.",
        "reference_info": "Normal range is 135 to 145 mEq/L.",
        "important_points": [
            "Heavily influenced by hydration, water intake, and diuretic medications."
        ]
    },
    "potassium": {
        "term": "Serum Potassium (K+)",
        "simple_explanation": "An essential mineral electrolyte that regulates steady heart muscle contractions and nerve impulses.",
        "why_it_matters": "Significant abnormalities can disrupt normal heart rhythms and require prompt medical evaluation.",
        "reference_info": "Normal reference range is 3.5 to 5.0 mEq/L.",
        "important_points": [
            "Kidney function and certain blood pressure medicines affect potassium balance."
        ]
    },
    "chloride": {
        "term": "Serum Chloride (Cl-)",
        "simple_explanation": "An electrolyte that partners with sodium to maintain healthy body fluid and acid-base equilibrium.",
        "why_it_matters": "Tracks hydration, kidney filtration, and respiratory acid balance.",
        "reference_info": "Standard reference range is 96 to 106 mEq/L.",
        "important_points": [
            "Often shifts in tandem with sodium levels."
        ]
    },
    "calcium": {
        "term": "Serum Calcium",
        "simple_explanation": "The mineral essential for strong bones, tooth structure, muscle contraction, and blood clotting.",
        "why_it_matters": "Regulated by the parathyroid glands and vitamin D.",
        "reference_info": "Standard normal range is 8.5 to 10.2 mg/dL.",
        "important_points": [
            "Blood calcium is tightly controlled and distinct from bone density scores."
        ]
    },

    # ------------------ Vitamins & Minerals ------------------
    "vitamin d": {
        "term": "25-Hydroxy Vitamin D",
        "simple_explanation": "A sunshine vitamin essential for absorbing calcium, maintaining bone strength, and immune defense.",
        "why_it_matters": "Deficiency can lead to bone softness, fatigue, and muscle aches.",
        "reference_info": "Above 30 ng/mL is optimal; 20-30 ng/mL is insufficient; below 20 ng/mL is deficient.",
        "important_points": [
            "Sunlight exposure, fortified foods, or supplements help replenish levels."
        ]
    },
    "vitamin b12": {
        "term": "Vitamin B12 (Cyanocobalamin)",
        "simple_explanation": "A nutrient crucial for red blood cell formation, brain function, and nerve protection.",
        "why_it_matters": "Low levels cause fatigue, tingling or numbness in hands/feet, and cognitive fog.",
        "reference_info": "Generally 200 to 900 pg/mL.",
        "important_points": [
            "Found primarily in animal products; vegetarians often benefit from supplementation."
        ]
    },

    # ------------------ Diagnostics & Imaging ------------------
    "ultrasound": {
        "term": "Ultrasound / Sonography",
        "simple_explanation": "A safe imaging procedure using high-frequency sound waves to create live pictures of internal organs.",
        "why_it_matters": "Provides radiation-free views of the liver, kidneys, gallbladder, and pelvic organs.",
        "reference_info": "Does not use ionizing radiation.",
        "important_points": [
            "Interpreted by a radiologist based on acoustic echoes."
        ]
    },
    "ecg": {
        "term": "Electrocardiogram (ECG / EKG)",
        "simple_explanation": "A painless test that records the electrical signals traveling through your heart muscle.",
        "why_it_matters": "Detects heart rate, rhythm irregularities, and signs of strain or reduced blood flow.",
        "reference_info": "Standard normal result is 'Normal Sinus Rhythm'.",
        "important_points": [
            "Reflects heart electrical activity at the specific time of recording."
        ]
    }
}

# Aliases for canonical term lookup
EXPLANATION_ALIASES: dict[str, str] = {
    "haemoglobin": "hemoglobin", "hb": "hemoglobin", "hgb": "hemoglobin",
    "tlc": "wbc", "total leukocyte count": "wbc", "total leucocyte count": "wbc",
    "white blood cell": "wbc", "white blood cells": "wbc",
    "rbc count": "rbc", "red blood cell": "rbc",
    "platelets": "platelet count", "plt": "platelet count",
    "packed cell volume": "pcv", "hematocrit": "pcv", "hct": "pcv",
    "fbs": "fasting glucose", "fasting blood sugar": "fasting glucose",
    "ppbs": "glucose", "random blood sugar": "glucose", "rbs": "glucose",
    "glycated hemoglobin": "hba1c", "glycated haemoglobin": "hba1c",
    "s.creatinine": "serum creatinine", "creatinine": "serum creatinine",
    "s.urea": "blood urea", "urea": "blood urea", "bun": "blood urea",
    "s.uric acid": "uric acid",
    "s.cholesterol": "total cholesterol", "cholesterol": "total cholesterol",
    "s.bilirubin": "total bilirubin", "bilirubin": "total bilirubin",
    "ast": "sgot", "alt": "sgpt",
    "s.sodium": "sodium", "s.potassium": "potassium", "s.chloride": "chloride", "s.calcium": "calcium",
    "vit d": "vitamin d", "25-oh vitamin d": "vitamin d", "vit b12": "vitamin b12",
    "ekg": "ecg", "sonography": "ultrasound", "usg": "ultrasound"
}


def get_explanation(term: str) -> dict[str, Any]:
    """Retrieve structured explanation card from verified dictionary or fallback."""
    cleaned = term.lower().strip()
    canonical = EXPLANATION_ALIASES.get(cleaned, cleaned)

    if canonical in MEDICAL_EXPLANATIONS:
        entry = MEDICAL_EXPLANATIONS[canonical]
        return {
            "term": entry["term"],
            "simple_explanation": entry["simple_explanation"],
            "why_it_matters": entry["why_it_matters"],
            "reference_info": entry.get("reference_info", "Consult laboratory standards for reference context."),
            "important_points": entry.get("important_points", []),
            "disclaimer": DISCLAIMER_TEXT,
            "source": "verified_dictionary"
        }

    return {
        "term": term.title(),
        "simple_explanation": f"'{term.title()}' is a medical term or health parameter found in your clinical document.",
        "why_it_matters": "Medical parameters are evaluated by doctors in the context of your personal health, symptoms, and medical history.",
        "reference_info": "Reference ranges vary depending on the laboratory methodology and individual profile.",
        "important_points": [
            "Always consult your doctor or pharmacist to interpret what this means for your care.",
            "Do not modify treatments or medications based solely on automated readings."
        ],
        "disclaimer": DISCLAIMER_TEXT,
        "source": "general_guidance"
    }


def explain_extracted_entities(extracted_info: dict[str, Any]) -> list[dict[str, Any]]:
    """Generate explanations for all extracted medicines and test names."""
    results = []
    seen = set()

    for category in ["medicines", "test_names"]:
        for term in extracted_info.get(category, []):
            k = term.lower().strip()
            if k and k not in seen:
                seen.add(k)
                results.append(get_explanation(term))

    return results


async def get_llm_explanation(term: str, context: str = "", api_key: str = "", language: str = "en") -> dict[str, Any]:
    """
    Local Clinical Explanation Engine running 100% locally on the backend codebase.
    Provides structured, compassionate explanations in English, Hindi, and Marathi without cloud APIs.
    """
    lang = (language or "en").lower().strip()
    if lang not in ["hi", "hindi", "mr", "marathi"]:
        lang = "en"

    # 1. Check local clinical dictionary
    exp = get_explanation(term)
    if exp and exp.get("simple_explanation"):
        if lang in ["hi", "hindi"]:
            exp_copy = dict(exp)
            exp_copy["disclaimer"] = "यह व्याख्या केवल शैक्षिक उद्देश्यों के लिए है और पेशेवर चिकित्सीय सलाह का विकल्प नहीं है। हमेशा अपने डॉक्टर से परामर्श करें।"
            exp_copy["source"] = "clinical_engine"
            return exp_copy
        elif lang in ["mr", "marathi"]:
            exp_copy = dict(exp)
            exp_copy["disclaimer"] = "हे स्पष्टीकरण केवळ शैक्षणिक उद्देशांसाठी आहे आणि व्यावसायिक वैद्यकीय सल्ल्याचा पर्याय नाही. नेहमी आपल्या डॉक्टरांचा सल्ला घ्या."
            exp_copy["source"] = "clinical_engine"
            return exp_copy
        else:
            exp_copy = dict(exp)
            exp_copy["source"] = "clinical_engine"
            return exp_copy

    # 2. Dynamic Clinical Synthesis for unlisted medical terms / tests / medications
    term_lower = term.lower().strip()
    clean_title = term.strip().title()

    # Medical terminology heuristics
    if any(term_lower.endswith(s) for s in ["statin"]):
        meaning_en = f"{clean_title} is a lipid-lowering medication used to manage blood cholesterol and support cardiovascular health."
        why_en = "It helps reduce arterial plaque formation, decreasing risks of adverse cardiac events."
        points_en = ["Take regularly as prescribed by your doctor", "Report unexplained muscle tenderness to your clinician"]
    elif any(term_lower.endswith(s) for s in ["pril", "sartan", "olol", "pine"]):
        meaning_en = f"{clean_title} is a cardiovascular medication primarily prescribed to regulate blood pressure and reduce cardiac workload."
        why_en = "It relaxes vascular resistance, promoting smoother blood circulation and protecting target organs."
        points_en = ["Monitor blood pressure periodically", "Do not discontinue abruptly without clinical consultation"]
    elif any(term_lower.endswith(s) for s in ["cillin", "mycin", "floxacin", "cycline", "penem"]) or term_lower.startswith("cef"):
        meaning_en = f"{clean_title} is an antimicrobial medication indicated for treating susceptible bacterial infections."
        why_en = "It eradicates pathogenic bacteria or halts their replication to allow immune recovery."
        points_en = ["Complete the full directed course even if symptoms improve", "Take with meals or water as instructed by your pharmacist"]
    elif any(term_lower.endswith(s) for s in ["formin", "gliptin", "gliflozin", "glitazone"]) or "insulin" in term_lower:
        meaning_en = f"{clean_title} is a metabolic medication prescribed to help maintain optimal blood glucose boundaries in diabetes."
        why_en = "It improves cellular insulin response or aids renal excretion of excess circulating glucose."
        points_en = ["Take consistently alongside balanced nutrition", "Be mindful of early signs of low blood sugar (hypoglycemia)"]
    elif any(term_lower.endswith(s) for s in ["prazole", "tidine"]):
        meaning_en = f"{clean_title} is an acid-reducing medication used to protect gastric mucosal lining from acid irritation."
        why_en = "It decreases stomach acid production, relieving heartburn and facilitating ulcer healing."
        points_en = ["Often taken in the morning before breakfast", "Consult your physician for long-term symptom management"]
    elif any(k in term_lower for k in ["count", "level", "test", "profile", "panel", "ratio", "titer", "scan"]):
        meaning_en = f"{clean_title} is a diagnostic laboratory or imaging evaluation used to assess specific physiological parameters."
        why_en = "It provides objective numeric markers that help doctors identify underlying conditions and track wellness."
        points_en = ["Always interpret values in reference to the reported lab range", "Discuss individual implications with your doctor"]
    elif any(term_lower.endswith(s) for s in ["itis"]):
        meaning_en = f"{clean_title} refers to a localized inflammatory response within body tissues."
        why_en = "Inflammation is an immune response that causes swelling, redness, and discomfort that requires medical evaluation."
        points_en = ["Follow prescribed anti-inflammatory or medical therapy", "Seek prompt care if symptoms worsen"]
    else:
        meaning_en = f"{clean_title} is a clinical term, medication, or test parameter documented in your medical record."
        why_en = "It provides diagnostic context regarding your health evaluation, symptoms, or recommended treatment plan."
        points_en = ["Confirm exact details and instructions with your doctor or pharmacist", "Follow all prescribed clinical directions"]

    if lang in ["hi", "hindi"]:
        return {
            "term": clean_title,
            "simple_explanation": f"{clean_title} एक नैदानिक शब्द, परीक्षण या दवा है। यह आपके स्वास्थ्य मूल्यांकन से संबंधित महत्वपूर्ण जानकारी प्रदान करता है।",
            "why_it_matters": "यह शरीर की कार्यप्रणाली और उपचार योजना को समझने में मदद करता है।",
            "reference_info": "अपने व्यक्तिगत परिणामों पर डॉक्टर से विस्तार से चर्चा करें।",
            "important_points": ["डॉक्टर या फार्मासिस्ट से विवरण की पुष्टि करें", "निर्धारित सलाह का पालन करें"],
            "disclaimer": "यह व्याख्या केवल शैक्षिक उद्देश्यों के लिए है और चिकित्सीय निदान नहीं है।",
            "source": "clinical_engine"
        }
    elif lang in ["mr", "marathi"]:
        return {
            "term": clean_title,
            "simple_explanation": f"{clean_title} ही एक वैद्यकीय संज्ञा, चाचणी किंवा औषध आहे जी तुमच्या आरोग्य तपासणीशी संबंधित आहे.",
            "why_it_matters": "हे शरीराचे आरोग्य आणि उपचारांचे नियोजन समजून घेण्यास मदत करते.",
            "reference_info": "आपल्या वैयक्तिक निष्कर्षांवर डॉक्टरांशी चर्चा करा.",
            "important_points": ["डॉक्टरांकडून किंवा औषधविक्रेत्याकडून खात्री करा", "वेळेवर काळजी घ्या"],
            "disclaimer": "हे स्पष्टीकरण केवळ माहितीसाठी आहे आणि वैद्यकीय निदान नाही.",
            "source": "clinical_engine"
        }
    else:
        return {
            "term": clean_title,
            "simple_explanation": meaning_en,
            "why_it_matters": why_en,
            "reference_info": "Discuss individual results and implications directly with your healthcare provider.",
            "important_points": points_en,
            "disclaimer": DISCLAIMER_TEXT,
            "source": "clinical_engine"
        }
