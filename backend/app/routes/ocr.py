"""
ocr.py - Endpoints for Universal Medical Document Analysis, OCR execution,
human-in-the-loop verification, 'Check My Report' assessments, and Multi-Report Comparison.
"""

from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db, Report
from app.services.ocr_service import process_document
from app.services.medical_document_parser import analyze_medical_document_content
from app.services.report_comparison_service import compare_two_reports

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ocr"])

if os.environ.get("VERCEL"):
    UPLOAD_DIR = Path("/tmp/uploads")
else:
    UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class OCRRequest(BaseModel):
    file_id: int
    language: Optional[str] = "en"
    cached_text: Optional[str] = None


class VerifyRequest(BaseModel):
    file_id: int
    verified_fields: list[dict] | dict


class CheckReportRequest(BaseModel):
    file_id: Optional[int] = None
    raw_text: Optional[str] = ""
    parameters: Optional[list[dict]] = None


class CompareReportsRequest(BaseModel):
    file_id_a: Optional[int] = None
    file_id_b: Optional[int] = None
    raw_text_a: Optional[str] = None
    raw_text_b: Optional[str] = None
    label_a: Optional[str] = "Previous Report"
    label_b: Optional[str] = "Current Report"


@router.post("/ocr")
def run_document_ocr(payload: OCRRequest, db: Session = Depends(get_db)):
    """
    Run preprocessing, OCR text extraction, and universal medical document analysis.
    Enforces non-medical rejection guard while supporting 20+ clinical document categories.
    """
    report = db.get(Report, payload.file_id)
    cached = payload.cached_text
    
    if report:
        # Guard: Reject non-medical files
        if report.status == "rejected_non_medical":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file was identified as non-medical. Medical entity extraction cannot be performed."
            )
        cached = cached or report.ocr_text
        file_path = UPLOAD_DIR / report.filename
        ext = report.filename.rsplit(".", 1)[-1].lower() if "." in report.filename else "jpg"
        orig_name = report.original_filename
        report.status = "processing"
        db.commit()
    else:
        file_path = UPLOAD_DIR / f"doc_{payload.file_id}.jpg"
        ext = "jpg"
        orig_name = f"document_{payload.file_id}"
        if not cached and not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Document id {payload.file_id} not found.")

    if not file_path.exists() and not cached:
        raise HTTPException(status_code=404, detail="Underlying document file was not found.")

    try:
        result = process_document(
            str(file_path),
            ext,
            language=payload.language or "en",
            cached_text=cached
        )
    except Exception as exc:
        report.status = "error"
        db.commit()
        logger.error("OCR execution error for file %d: %s", payload.file_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing OCR pipeline: {exc}"
        )

    raw_text = result.get("raw_text", "")
    report.ocr_text = raw_text
    report.status = "analyzed"
    db.commit()

    return {
        "success": True,
        "file_id": payload.file_id,
        "filename": report.original_filename,
        "raw_text": raw_text,
        "medical_info": result.get("medical_info", {}),
        "extracted_table": result.get("extracted_table", []),
        "confidence_scores": result.get("confidence_scores", {}),
        "low_confidence_fields": result.get("low_confidence_fields", []),
        "analysis": result.get("analysis", {}),
        "document_type": result.get("document_type"),
        "document_label": result.get("document_label"),
        "document_category": result.get("document_category"),
        "patient_information": result.get("patient_information", {}),
        "structured_markdown": result.get("structured_markdown", ""),
        "report_summary": result.get("report_summary") or result.get("summary") or result.get("simple_explanation"),
        "simple_explanation": result.get("simple_explanation") or result.get("report_summary") or result.get("summary"),
        "summary": result.get("summary") or result.get("report_summary"),
        "overall_status": result.get("overall_status"),
        "key_findings": result.get("key_findings", []),
        "measurements": result.get("measurements", []),
        "parameters": result.get("parameters", []),
        "findings": result.get("findings", []),
        "conclusion": result.get("conclusion", ""),
        "medical_terms_explained": result.get("medical_terms_explained", []),
        "report_review": result.get("report_review", {}),
        "prescription": result.get("prescription"),
        "diagnostic_details": result.get("diagnostic_details"),
        "reference_range_check": result.get("reference_range_check", {}),
        "check_my_report": result.get("check_my_report"),
        "emergency_warning": result.get("emergency_warning"),
        "next_steps": result.get("next_steps"),
        "statistics": result.get("statistics"),
        "error": result.get("error")
    }


@router.post("/verify")
def submit_verified_info(payload: VerifyRequest, db: Session = Depends(get_db)):
    """Saves user-confirmed and corrected clinical information."""
    report = db.get(Report, payload.file_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Document id {payload.file_id} not found.")

    report.verified_text = json.dumps(payload.verified_fields, ensure_ascii=False)
    report.status = "verified"
    db.commit()

    return {
        "success": True,
        "file_id": payload.file_id,
        "message": "Human verification completed. Information saved."
    }


@router.post("/check-report")
def check_report_status(payload: CheckReportRequest, db: Session = Depends(get_db)):
    """
    Evaluates 'Is Everything Proper?' review based on extracted or verified parameters.
    Provides transparent, medically safe feedback without issuing diagnoses.
    """
    text_to_analyze = payload.raw_text or ""
    if payload.file_id:
        report = db.get(Report, payload.file_id)
        if report and report.ocr_text:
            text_to_analyze = report.ocr_text

    analysis = analyze_medical_document_content(text_to_analyze)
    return {
        "check_my_report": analysis.get("check_my_report"),
        "overall_status": analysis.get("overall_status"),
        "statistics": analysis.get("statistics"),
        "emergency_warning": analysis.get("emergency_warning"),
        "next_steps": analysis.get("next_steps"),
        "disclaimer": "This automated evaluation is not a diagnosis. Discuss all reports with your physician."
    }


@router.post("/compare-reports")
def compare_medical_reports(payload: CompareReportsRequest, db: Session = Depends(get_db)):
    """
    Compares two medical reports from different dates and generates
    side-by-side progression deltas and trends for all common clinical parameters.
    """
    text_a = payload.raw_text_a or ""
    text_b = payload.raw_text_b or ""

    if payload.file_id_a:
        rep_a = db.get(Report, payload.file_id_a)
        if rep_a and rep_a.ocr_text:
            text_a = rep_a.ocr_text

    if payload.file_id_b:
        rep_b = db.get(Report, payload.file_id_b)
        if rep_b and rep_b.ocr_text:
            text_b = rep_b.ocr_text

    if not text_a.strip() and not text_b.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide text or valid file IDs for both reports to compare."
        )

    result = compare_two_reports(
        report_a_text=text_a,
        report_b_text=text_b,
        report_a_date=payload.label_a or "Previous Report",
        report_b_date=payload.label_b or "Current Report"
    )

    return result


class SummarizeRequest(BaseModel):
    raw_text: Optional[str] = ""
    parameters: Optional[list[dict]] = None
    doc_type: Optional[str] = "Medical Report"
    file_id: Optional[int] = None
    language: Optional[str] = "en"


@router.post("/summarize-report")
def summarize_medical_report(payload: SummarizeRequest, db: Session = Depends(get_db)):
    """
    Generates an AI-powered medical summary using Google Gemini API in the requested language.
    """
    from app.services.gemini_summary_service import generate_gemini_report_summary

    text_to_summarize = payload.raw_text or ""
    if payload.file_id:
        rep = db.get(Report, payload.file_id)
        if rep and rep.ocr_text:
            text_to_summarize = rep.ocr_text

    params = payload.parameters or []
    if not params and text_to_summarize:
        analysis = analyze_medical_document_content(text_to_summarize, language=payload.language or "en")
        params = analysis.get("parameters", [])

    gemini_result = generate_gemini_report_summary(
        raw_text=text_to_summarize,
        parameters=params,
        doc_type=payload.doc_type or "Medical Report",
        language=payload.language or "en"
    )

    return {
        "success": True,
        "summary": gemini_result.get("summary_text"),
        "is_ai_generated": gemini_result.get("is_ai_generated", False),
        "source": gemini_result.get("source", "gemini_ai"),
        "language": payload.language or "en"
    }


class SymptomAnalysisRequest(BaseModel):
    symptoms: str
    language: Optional[str] = "en"


@router.post("/analyze-symptoms")
def analyze_patient_symptoms(payload: SymptomAnalysisRequest):
    """
    Evaluates patient-described symptoms using AI / Clinical reasoning to predict:
    1. Potential Clinical Conditions & What Might Be Happening
    2. Pathophysiology / The Biological Reason Behind It
    3. Recommended Specialists & Diagnostic Lab Tests
    4. Red Flags & Questions to Ask Your Doctor
    """
    from app.services.gemini_summary_service import generate_ai_symptom_analysis

    if not payload.symptoms or not payload.symptoms.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide a description of your symptoms."
        )

    result = generate_ai_symptom_analysis(
        symptoms_text=payload.symptoms,
        language=payload.language or "en"
    )

    return result


