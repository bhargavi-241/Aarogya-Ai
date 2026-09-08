"""
ocr_service.py - Multi-Engine OCR, Image Preprocessing, and Universal Medical Entity Extraction.

Features:
- Multi-Engine OCR: RapidOCR (ONNX Runtime, fast CPU inference) + PyPDF (multi-page PDF) + PyTesseract (fallback)
- OpenCV image preprocessing (Grayscale, CLAHE, Denoising, Sharpening, Adaptive Thresholding)
- Multi-page document handling
- Structured entity extraction: Medicines, Dosages, Frequencies, Lab Tests, Values, Normal Ranges, Clinician & Facility Information
- Integration with Universal Medical Document Parser (20+ categories)
"""

from __future__ import annotations
import os
import re
import logging
from pathlib import Path
from typing import Any, Optional
import numpy as np

logger = logging.getLogger("ocr_service")

# Optional dependency guards
try:
    import cv2
    _CV2_AVAILABLE = True
except ImportError:
    _CV2_AVAILABLE = False

try:
    from PIL import Image as PILImage
    _PIL_AVAILABLE = True
except ImportError:
    _PIL_AVAILABLE = False

try:
    import pypdf
    _PYPDF_AVAILABLE = True
except ImportError:
    _PYPDF_AVAILABLE = False

try:
    from rapidocr_onnxruntime import RapidOCR
    _rapidocr_engine = RapidOCR()
    _RAPIDOCR_AVAILABLE = True
except Exception as _exc:
    _rapidocr_engine = None
    _RAPIDOCR_AVAILABLE = False
    logger.warning("RapidOCR unavailable in ocr_service: %s", _exc)

try:
    import pytesseract
    _TESS_AVAILABLE = True
    for p in [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe")
    ]:
        if os.path.exists(p):
            pytesseract.pytesseract.tesseract_cmd = p
            break
except ImportError:
    _TESS_AVAILABLE = False


# Common medical entities dictionary for pattern matching
COMMON_MEDICINES: list[str] = [
    "Metformin", "Aspirin", "Atorvastatin", "Lisinopril", "Amlodipine",
    "Omeprazole", "Paracetamol", "Amoxicillin", "Ciprofloxacin", "Losartan",
    "Metoprolol", "Atenolol", "Ramipril", "Glibenclamide", "Insulin",
    "Warfarin", "Digoxin", "Furosemide", "Hydrochlorothiazide", "Spironolactone",
    "Prednisolone", "Dexamethasone", "Pantoprazole", "Ranitidine", "Azithromycin",
    "Cefixime", "Doxycycline", "Clarithromycin", "Clopidogrel", "Rosuvastatin",
    "Simvastatin", "Telmisartan", "Valsartan", "Carvedilol", "Bisoprolol",
    "Nifedipine", "Diltiazem", "Verapamil", "Phenytoin", "Carbamazepine",
    "Valproate", "Levodopa", "Donepezil", "Sertraline", "Escitalopram",
    "Fluoxetine", "Quetiapine", "Risperidone", "Clonazepam", "Alprazolam",
    "Ibuprofen", "Naproxen", "Diclofenac", "Tramadol", "Morphine",
    "Cetirizine", "Loratadine", "Montelukast", "Salbutamol", "Levothyroxine"
]

COMMON_TESTS: list[str] = [
    "Complete Blood Count", "CBC", "Hemoglobin", "Total Count", "TLC", "RBC", "WBC",
    "Neutrophils", "Lymphocytes", "Eosinophils", "Monocytes", "Basophils",
    "Packed Cell Volume", "PCV", "Hematocrit", "MCV", "MCH", "MCHC", "RDW",
    "Platelet Count", "Platelets", "ESR", "Serum Electrolytes", "Sodium", "Potassium",
    "Chloride", "Bicarbonate", "HbA1c", "Glucose", "Fasting Glucose", "Creatinine",
    "Urea", "Cholesterol", "Triglycerides", "HDL", "LDL", "VLDL", "TSH", "T3", "T4",
    "ALT", "AST", "Bilirubin", "Albumin", "Calcium", "Uric Acid", "CRP", "eGFR", "INR"
]

FREQUENCY_PATTERNS: list[str] = [
    r"\bonce\s+daily\b", r"\btwice\s+daily\b", r"\bthrice\s+daily\b",
    r"\bOD\b", r"\bBD\b", r"\bTDS\b", r"\bQID\b",
    r"\bonce\s+a\s+day\b", r"\btwice\s+a\s+day\b",
    r"\bevery\s+\d+\s+hours?\b", r"\bat\s+bedtime\b", r"\bSOS\b",
    r"\bmorning\b", r"\bnight\b", r"\bwith\s+meals?\b", r"\bbefore\s+food\b", r"\bafter\s+food\b"
]

DATE_PATTERNS: list[str] = [
    r"\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b",
    r"\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4}\b"
]


def preprocess_image(image_path: str) -> np.ndarray | None:
    """OpenCV pipeline: Resize -> Grayscale -> CLAHE -> Sharpening -> Denoising -> Binary."""
    if not _CV2_AVAILABLE:
        return None

    try:
        image = cv2.imread(image_path)
        if image is None:
            return None

        h, w = image.shape[:2]
        if w < 1600:
            scale = 1600 / w
            image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # Sharpening
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return binary
    except Exception as exc:
        logger.warning("preprocess_image error for %s: %s", image_path, exc)
        return None


def extract_text_multi_engine(file_path: str, file_type: str) -> dict[str, Any]:
    """
    Multi-engine OCR execution:
    1. Multi-page PDF text extraction via pypdf
    2. RapidOCR ONNX inference (primary for images)
    3. Preprocessed image retry pass
    4. PyTesseract fallback
    """
    file_type = file_type.lower().lstrip(".")
    raw_lines = []
    word_confidences = []
    conf_scores = []

    # 1. PDF all pages
    if file_type == "pdf" and _PYPDF_AVAILABLE:
        try:
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                txt = page.extract_text() or ""
                if txt.strip():
                    raw_lines.append(txt.strip())
            if raw_lines:
                combined_pdf = "\n\n".join(raw_lines)
                return {
                    "text": combined_pdf,
                    "confidence": 95.0,
                    "word_confidences": [{"word": w, "confidence": 95.0} for w in combined_pdf.split()[:50]]
                }
        except Exception as pdf_exc:
            logger.warning("PDF extraction failed: %s", pdf_exc)

    # 2. RapidOCR on Image
    if _RAPIDOCR_AVAILABLE and _rapidocr_engine is not None:
        try:
            res, _ = _rapidocr_engine(file_path)
            if res:
                for item in res:
                    line_text = item[1]
                    raw_lines.append(line_text)
                    c_val = float(item[2]) * 100.0 if len(item) > 2 and isinstance(item[2], (int, float)) else 85.0
                    conf_scores.append(c_val)
                    for w in line_text.split():
                        word_confidences.append({"word": w, "confidence": round(c_val, 1)})
        except Exception as ocr_exc:
            logger.warning("RapidOCR execution error on %s: %s", file_path, ocr_exc)

        # Retry pass with preprocessed image if initial text is sparse
        if len(" ".join(raw_lines).split()) < 12 and file_type in ["jpg", "jpeg", "png"]:
            preprocessed = preprocess_image(file_path)
            if preprocessed is not None:
                try:
                    res_prep, _ = _rapidocr_engine(preprocessed)
                    if res_prep and len(res_prep) > len(raw_lines):
                        raw_lines = [item[1] for item in res_prep]
                        conf_scores = [float(item[2]) * 100.0 for item in res_prep if len(item) > 2]
                        word_confidences = []
                        for item in res_prep:
                            c = float(item[2]) * 100.0 if len(item) > 2 else 85.0
                            for w in item[1].split():
                                word_confidences.append({"word": w, "confidence": round(c, 1)})
                except Exception:
                    pass

    # 3. Tesseract Fallback
    if not raw_lines and _TESS_AVAILABLE and _PIL_AVAILABLE:
        try:
            pil_img = PILImage.open(file_path)
            tess_txt = pytesseract.image_to_string(pil_img, config=r"--oem 3 --psm 6")
            if tess_txt.strip():
                raw_lines.append(tess_txt.strip())
                conf_scores.append(80.0)
        except Exception:
            pass

    full_text = "\n".join(raw_lines).strip()
    avg_conf = round(float(np.mean(conf_scores)), 1) if conf_scores else 85.0

    return {
        "text": full_text,
        "confidence": avg_conf,
        "word_confidences": word_confidences
    }


def extract_medical_info(text: str) -> dict[str, Any]:
    """Parse raw text to detect medical entities: medicines, dosages, frequencies, tests, dates, doctor, lab parameters."""
    text_lower = text.lower()
    
    # Medicines
    medicines = [med for med in COMMON_MEDICINES if re.search(r"\b" + re.escape(med) + r"\b", text, re.IGNORECASE)]
    
    # Dosages
    dosages = re.findall(r"\b\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|units?|IU|mEq)\b", text, re.IGNORECASE)
    dosages = list(dict.fromkeys(dosages))
    
    # Frequencies
    frequencies = []
    for pat in FREQUENCY_PATTERNS:
        matches = re.findall(pat, text, re.IGNORECASE)
        frequencies.extend(matches)
    frequencies = list(dict.fromkeys(frequencies))
    
    # Tests
    tests = [t for t in COMMON_TESTS if re.search(r"\b" + re.escape(t) + r"\b", text, re.IGNORECASE)]
    
    # Dates
    dates = []
    for pat in DATE_PATTERNS:
        dates.extend(re.findall(pat, text, re.IGNORECASE))
    dates = list(dict.fromkeys(dates))
    
    # Doctor name
    doctor_name = None
    doc_match = re.search(r"Dr\.?\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})", text)
    if doc_match:
        doctor_name = doc_match.group(0).strip()
        
    return {
        "medicines": medicines,
        "dosages": dosages,
        "frequencies": frequencies,
        "test_names": tests,
        "dates": dates,
        "doctor_name": doctor_name
    }


def process_document(file_path: str, file_type: str, language: str = "en", cached_text: Optional[str] = None) -> dict[str, Any]:
    """Top-level document OCR pipeline with table-ready extracted fields and verification flags."""
    file_type = file_type.lower().lstrip(".")
    
    if cached_text and len(cached_text.strip()) > 0:
        raw_text = cached_text.strip()
        overall_conf = 90.0
        word_confidences = [{"word": w, "confidence": 90.0} for w in raw_text.split()[:80]]
        logger.info("Using cached OCR text (%d chars) for %s - skipping redundant OCR pass", len(raw_text), file_path)
    else:
        ocr_result = extract_text_multi_engine(file_path, file_type)
        raw_text = ocr_result.get("text", "")
        overall_conf = ocr_result.get("confidence", 85.0)
        word_confidences = ocr_result.get("word_confidences", [])
    
    # If OCR produced text, extract entities
    medical_info = extract_medical_info(raw_text) if raw_text else {}
    
    # Build structured extracted table items with confidence scores
    extracted_table = []
    
    # 1. Medicines
    for med in medical_info.get("medicines", []):
        conf = next((w["confidence"] for w in word_confidences if med.lower() in w["word"].lower()), overall_conf)
        extracted_table.append({
            "field": "Medicine",
            "value": med,
            "confidence": conf,
            "needs_verification": conf < 70
        })
        
    # 2. Lab Tests & Parameters
    for test in medical_info.get("test_names", []):
        val_match = re.search(re.escape(test) + r"\s*[:=\s]\s*([\d\.]+\s*(?:g\/dl|mg\/dl|mmol\/l|meq\/l|fl|pg|%|cells\/cumm|thou\/mm3)?)", raw_text, re.IGNORECASE)
        test_val = val_match.group(1).strip() if val_match else test
        conf = next((w["confidence"] for w in word_confidences if test.lower().split()[0] in w["word"].lower()), overall_conf)
        extracted_table.append({
            "field": "Lab Parameter",
            "value": f"{test}: {test_val}" if val_match else test,
            "confidence": conf,
            "needs_verification": conf < 70
        })

    # 3. Dosages & Frequencies
    for dosage in medical_info.get("dosages", []):
        extracted_table.append({
            "field": "Dosage",
            "value": dosage,
            "confidence": overall_conf,
            "needs_verification": overall_conf < 70
        })
        
    for freq in medical_info.get("frequencies", []):
        extracted_table.append({
            "field": "Frequency",
            "value": freq,
            "confidence": overall_conf,
            "needs_verification": overall_conf < 70
        })

    # 4. Doctor / Referring Clinician
    if medical_info.get("doctor_name"):
        extracted_table.append({
            "field": "Doctor / Clinician",
            "value": medical_info["doctor_name"],
            "confidence": overall_conf,
            "needs_verification": False
        })

    low_confidence = [w for w in word_confidences if w["confidence"] < 65.0]

    # Run Universal Medical Document Analysis (20+ document categories)
    from app.services.medical_document_parser import analyze_medical_document_content
    analysis_payload = analyze_medical_document_content(
        raw_text=raw_text,
        filename=file_path,
        ocr_conf=overall_conf,
        image_path=file_path,
        language=language
    )

    return {
        "success": True,
        "raw_text": raw_text,
        "medical_info": medical_info,
        "extracted_table": extracted_table,
        "confidence_scores": {
            "overall": overall_conf,
            "medicines": overall_conf,
            "tests": overall_conf
        },
        "low_confidence_fields": low_confidence[:10],
        "analysis": analysis_payload,
        "document_type": analysis_payload.get("document_type"),
        "document_label": analysis_payload.get("document_label"),
        "document_category": analysis_payload.get("document_category"),
        "patient_information": analysis_payload.get("patient_information", {}),
        "structured_markdown": analysis_payload.get("structured_markdown", ""),
        "report_summary": analysis_payload.get("report_summary"),
        "simple_explanation": analysis_payload.get("simple_explanation"),
        "summary": analysis_payload.get("summary"),
        "overall_status": analysis_payload.get("overall_status"),
        "key_findings": analysis_payload.get("key_findings", []),
        "measurements": analysis_payload.get("measurements", []),
        "parameters": analysis_payload.get("parameters", []),
        "findings": analysis_payload.get("findings", []),
        "conclusion": analysis_payload.get("conclusion", ""),
        "medical_terms_explained": analysis_payload.get("medical_terms_explained", []),
        "report_review": analysis_payload.get("report_review", {}),
        "prescription": analysis_payload.get("prescription"),
        "diagnostic_details": analysis_payload.get("diagnostic_details"),
        "reference_range_check": analysis_payload.get("reference_range_check", {}),
        "check_my_report": analysis_payload.get("check_my_report"),
        "emergency_warning": analysis_payload.get("emergency_warning"),
        "next_steps": analysis_payload.get("next_steps"),
        "statistics": analysis_payload.get("statistics"),
        "error": None if raw_text else "Could not extract text. Please ensure the document is clear and readable."
    }

