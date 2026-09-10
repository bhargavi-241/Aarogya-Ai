"""
upload.py - Medical document upload, file management, and document validation endpoints.
"""

from __future__ import annotations
import os
import re
import uuid
import logging
from pathlib import Path
import aiofiles
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db, Report
from app.services.document_validation_service import classify_medical_document

logger = logging.getLogger(__name__)
router = APIRouter(tags=["upload"])

if os.environ.get("VERCEL"):
    UPLOAD_DIR = Path("/tmp/uploads")
else:
    UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "application/pdf"}


class ValidateDocumentRequest(BaseModel):
    file_id: Optional[int] = None


def _sanitize_filename(filename: str) -> str:
    stem, _, ext = filename.rpartition(".")
    stem_clean = re.sub(r"[^a-zA-Z0-9_\-]", "_", stem)
    unique_suffix = uuid.uuid4().hex[:8]
    return f"{stem_clean}_{unique_suffix}.{ext.lower()}"


def _get_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Securely uploads a prescription or medical report (JPG, PNG, PDF up to 10MB)."""
    ext = _get_extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS)).upper()}"
        )
        
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes). Please upload a valid document."
        )
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_SIZE_BYTES // (1024 * 1024)} MB."
        )

    safe_name = _sanitize_filename(file.filename or f"doc.{ext}")
    dest_path = UPLOAD_DIR / safe_name
    
    async with aiofiles.open(dest_path, "wb") as f_out:
        await f_out.write(contents)

    report = Report(
        filename=safe_name,
        original_filename=file.filename or safe_name,
        status="uploaded"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    logger.info("Uploaded document id=%d (%s), size=%d bytes", report.id, safe_name, len(contents))

    return {
        "file_id": report.id,
        "filename": safe_name,
        "original_filename": file.filename,
        "file_path": str(dest_path),
        "file_type": ext,
        "size_bytes": len(contents),
        "message": "Document successfully uploaded and stored for validation."
    }


@router.post("/validate-document")
async def validate_uploaded_document(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Evaluates whether the uploaded file is a genuine medical document (Prescription, Lab Report, etc.).
    Seamlessly supports both { "file_id": int } JSON payload and direct multipart/form-data File upload.
    Returns 3-state structured response:
      - is_medical: True  (status='medical')
      - is_medical: None  (status='uncertain')
      - is_medical: False (status='non_medical')
    """
    content_type = request.headers.get("content-type", "").lower()
    report = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        file_id_val = form.get("file_id")

        if uploaded_file and hasattr(uploaded_file, "filename") and uploaded_file.filename:
            ext = _get_extension(uploaded_file.filename)
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS)).upper()}"
                )
            contents = await uploaded_file.read()
            if len(contents) == 0:
                raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")
            safe_name = _sanitize_filename(uploaded_file.filename)
            dest_path = UPLOAD_DIR / safe_name
            async with aiofiles.open(dest_path, "wb") as f_out:
                await f_out.write(contents)
            report = Report(
                filename=safe_name,
                original_filename=uploaded_file.filename,
                status="uploaded"
            )
            db.add(report)
            db.commit()
            db.refresh(report)
        elif file_id_val:
            try:
                fid = int(file_id_val)
                report = db.get(Report, fid)
            except Exception:
                pass
    else:
        # JSON body
        try:
            body = await request.json()
            fid = body.get("file_id")
            if fid is not None:
                report = db.get(Report, int(fid))
        except Exception:
            pass

    if not report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid file_id or upload a file directly."
        )

    dest_path = UPLOAD_DIR / report.filename
    if not dest_path.exists():
        raise HTTPException(status_code=404, detail="Underlying document file not found.")

    ext = _get_extension(report.filename)
    validation_result = classify_medical_document(str(dest_path), ext)

    # Save extracted text directly into report.ocr_text to avoid duplicate OCR in subsequent analysis
    if validation_result.get("extracted_text"):
        report.ocr_text = validation_result["extracted_text"]

    # Update database record status based on 3-state evaluation
    if validation_result.get("is_medical") is True:
        report.status = "medical_verified"
    elif validation_result.get("status") == "uncertain" or validation_result.get("is_medical") is None:
        report.status = "uncertain_review"
    else:
        report.status = "rejected_non_medical"
    db.commit()

    return {
        "file_id": report.id,
        "filename": report.original_filename,
        **validation_result
    }


@router.get("/uploads/{file_id}")
def get_upload_status(file_id: int, db: Session = Depends(get_db)):
    report = db.get(Report, file_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Document id {file_id} not found.")
    return {
        "file_id": report.id,
        "filename": report.filename,
        "original_filename": report.original_filename,
        "upload_time": report.upload_time,
        "status": report.status,
        "has_ocr": report.ocr_text is not None,
        "has_verified_text": report.verified_text is not None
    }


@router.delete("/uploads/{file_id}")
def delete_upload(file_id: int, db: Session = Depends(get_db)):
    report = db.get(Report, file_id)
    if not report:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    file_path = UPLOAD_DIR / report.filename
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass
            
    db.delete(report)
    db.commit()
    return {"success": True, "message": "Document deleted successfully."}
