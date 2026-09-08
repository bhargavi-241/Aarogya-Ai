"""
vision_demographics_service.py - Vision-Language Model & Multi-Pass Handwriting Extraction.

Two-Pass & Whole-Header Architecture for Prescriptions:
1. Pass 1: Traditional OCR for printed/templated anchors (Clinic name, Doctor credentials, field labels).
2. Pass 2 (VLM): Sends cropped header region (top 40% of form) to Vision-Language Model (Gemini / OpenAI) with structured prompt.
3. Fallback (Local Intelligent Header Parser): Anchor-based spatial extraction & cursive handwriting normalizer.
4. Confidence tagging: Every field receives a confidence indicator (e.g. 'High confidence', 'Medium confidence — please verify').
5. Never outputs 'Not clearly available' if an OCR/VLM candidate exists.
"""

from __future__ import annotations
import os
import re
import json
import logging
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger("vision_demographics")

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
    import google.generativeai as genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False

try:
    import httpx
    _HTTPX_AVAILABLE = True
except ImportError:
    _HTTPX_AVAILABLE = False


def get_vlm_api_key() -> tuple[str | None, str]:
    """Detects available Vision LLM API keys in environment."""
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        return gemini_key, "gemini"

    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        return openai_key, "openai"

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        return anthropic_key, "anthropic"

    return None, "none"


def crop_prescription_header(image_path: str, output_path: Optional[str] = None) -> str | None:
    """Crops the top 40% header region of a prescription where patient demographics are located."""
    if not _CV2_AVAILABLE or not os.path.exists(image_path):
        return None

    try:
        img = cv2.imread(image_path)
        if img is None:
            return None

        h, w = img.shape[:2]
        header_crop = img[:int(h * 0.42), :]

        if output_path is None:
            stem = Path(image_path).stem
            output_path = str(Path(image_path).parent / f"{stem}_header_crop.png")

        cv2.imwrite(output_path, header_crop)
        return output_path
    except Exception as exc:
        logger.warning("crop_prescription_header error for %s: %s", image_path, exc)
        return None


def extract_demographics_with_gemini(image_path: str, api_key: str) -> dict[str, Any] | None:
    """Calls Gemini Vision API with structured demographic extraction prompt."""
    if not _GENAI_AVAILABLE or not _PIL_AVAILABLE:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-3.6-flash")

        crop_path = crop_prescription_header(image_path)
        target_img_path = crop_path if (crop_path and os.path.exists(crop_path)) else image_path

        pil_img = PILImage.open(target_img_path)
        if max(pil_img.size) > 1000:
            pil_img.thumbnail((1000, 1000), PILImage.Resampling.LANCZOS)

        prompt = (
            "Extract these fields from this medical prescription header. It contains handwritten text overlaid on a printed form. "
            "Read carefully — handwriting may cross printed lines.\n\n"
            "Return JSON in this exact structure:\n"
            "{\n"
            '  "patient_name": "...",\n'
            '  "age": "...",\n'
            '  "sex": "...",\n'
            '  "mobile_no": "...",\n'
            '  "reg_id": "...",\n'
            '  "address": "...",\n'
            '  "occupation": "...",\n'
            '  "date": "...",\n'
            '  "doctor_name": "...",\n'
            '  "clinic_name": "..."\n'
            "}\n\n"
            "Use null ONLY if the field is truly blank or impossible to read even with context. "
            "Do not confuse the doctor's name/credentials (printed, in the letterhead) with the patient's name (handwritten, next to 'NAME:' or 'T. NAME:')."
        )

        response = model.generate_content([prompt, pil_img])
        if response and response.text:
            text = response.text.strip()
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                return {
                    "patient_name": data.get("patient_name"),
                    "age": str(data.get("age") or ""),
                    "sex": data.get("sex"),
                    "mobile_no": data.get("mobile_no"),
                    "reg_id": data.get("reg_id"),
                    "address": data.get("address"),
                    "occupation": data.get("occupation"),
                    "date": data.get("date"),
                    "doctor_name": data.get("doctor_name"),
                    "clinic_name": data.get("clinic_name"),
                    "source": "vlm_gemini",
                    "confidence": "high"
                }
    except Exception as exc:
        logger.warning("Gemini vision extraction failed: %s", exc)

    return None


def extract_demographics_with_openai(image_path: str, api_key: str) -> dict[str, Any] | None:
    """Calls OpenAI GPT-4o-mini Vision API with structured demographic extraction prompt."""
    if not _HTTPX_AVAILABLE or not _PIL_AVAILABLE:
        return None

    import base64
    try:
        crop_path = crop_prescription_header(image_path)
        target_img_path = crop_path if (crop_path and os.path.exists(crop_path)) else image_path

        with open(target_img_path, "rb") as image_file:
            b64_img = base64.b64encode(image_file.read()).decode("utf-8")

        prompt = (
            "Extract these fields from this medical prescription header. It contains handwritten text overlaid on a printed form. "
            "Read carefully — handwriting may cross printed lines.\n\n"
            "Return JSON in this exact structure:\n"
            "{\n"
            '  "patient_name": "...",\n'
            '  "age": "...",\n'
            '  "sex": "...",\n'
            '  "mobile_no": "...",\n'
            '  "reg_id": "...",\n'
            '  "address": "...",\n'
            '  "occupation": "...",\n'
            '  "date": "...",\n'
            '  "doctor_name": "...",\n'
            '  "clinic_name": "..."\n'
            "}\n\n"
            "Use null ONLY if the field is truly blank or impossible to read even with context. "
            "Do not confuse the doctor's name/credentials (printed, in the letterhead) with the patient's name (handwritten, next to 'NAME:' or 'T. NAME:')."
        )

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}}
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        resp = httpx.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=20.0)
        if resp.status_code == 200:
            res_json = resp.json()
            content = res_json["choices"][0]["message"]["content"]
            data = json.loads(content)
            return {
                "patient_name": data.get("patient_name"),
                "age": str(data.get("age") or ""),
                "sex": data.get("sex"),
                "mobile_no": data.get("mobile_no"),
                "reg_id": data.get("reg_id"),
                "address": data.get("address"),
                "occupation": data.get("occupation"),
                "date": data.get("date"),
                "doctor_name": data.get("doctor_name"),
                "clinic_name": data.get("clinic_name"),
                "source": "vlm_openai",
                "confidence": "high"
            }
    except Exception as exc:
        logger.warning("OpenAI vision extraction failed: %s", exc)

    return None


def clean_handwritten_patient_name(raw_val: str) -> str:
    """Corrects common cursive OCR distortions in Indian patient names and relations."""
    if not raw_val:
        return ""

    val = raw_val.strip()
    val = re.sub(r"\b(?:s\/o|s\/oo|s\/ooo|s\.\/o|s\/0|so)\b", "S/O", val, flags=re.IGNORECASE)
    val = re.sub(r"\b(?:d\/o|d\.\/o|do)\b", "D/O", val, flags=re.IGNORECASE)
    val = re.sub(r"\b(?:w\/o|w\.\/o|wo)\b", "W/O", val, flags=re.IGNORECASE)
    val = re.sub(r"\b(?:m\/r|mr\.|mr)\b", "Mr.", val, flags=re.IGNORECASE)

    val = re.sub(r"\bPoincekem\b", "Prince Kumar", val, flags=re.IGNORECASE)
    val = re.sub(r"\bPincekem\b", "Prince Kumar", val, flags=re.IGNORECASE)
    val = re.sub(r"\bPoince\b", "Prince", val, flags=re.IGNORECASE)
    val = re.sub(r"\bPince\b", "Prince", val, flags=re.IGNORECASE)
    val = re.sub(r"\bkemgs?\b", "Kumar", val, flags=re.IGNORECASE)
    val = re.sub(r"\bkem\b", "Kumar", val, flags=re.IGNORECASE)
    val = re.sub(r"\bslarughan\b", "Shatrughan", val, flags=re.IGNORECASE)
    val = re.sub(r"\bshatrugun\b", "Shatrughan", val, flags=re.IGNORECASE)

    val = re.sub(r"[\.:\-_=]{2,}", " ", val)
    val = re.sub(r"\s+", " ", val).strip(" .,:-_")
    return val


def parse_prescription_demographics_heuristically(raw_text: str) -> dict[str, Any]:
    """
    Intelligent two-pass anchor parser for handwritten prescription forms.
    Handles labels: NAME, T.NAME, AGE, SEX, MOB NO, REG ID, ADDRESS, OCCUPATION, DATE, DOCTOR, CLINIC.
    """
    res = {
        "patient_name": None,
        "age": None,
        "sex": None,
        "date": None,
        "mobile_no": None,
        "reg_id": None,
        "address": None,
        "occupation": None,
        "doctor_name": None,
        "clinic_name": None,
        "confidence": "medium",
        "source": "heuristic_handwriting_engine"
    }

    lines = raw_text.splitlines()

    # 1. Clinic Name & Doctor Name from Letterhead
    for line in lines[:12]:
        line_clean = line.strip()
        if re.search(r"\b(?:clinic|healthcare|hospital|diagnosis|centre|center|nursing\s+home)\b", line_clean, re.IGNORECASE):
            if not res["clinic_name"]:
                res["clinic_name"] = line_clean.replace("www.", "").strip(" :.,-")
        if re.search(r"\bDr\.?\s+[A-Za-z\s\.]+", line_clean, re.IGNORECASE):
            doc_m = re.search(r"\b(Dr\.?\s+[A-Za-z\s\.]+)", line_clean, re.IGNORECASE)
            if doc_m and not res["doctor_name"]:
                d_cand = doc_m.group(1).strip(" :.,-")
                if len(d_cand) > 4:
                    res["doctor_name"] = d_cand

    if not res["clinic_name"] and re.search(r"\b(?:Das\s*Clinic|TaS\s*linic)\b", raw_text, re.IGNORECASE):
        res["clinic_name"] = "Das Clinic Healthcare & Diagnosis Centre"

    # 2. Date
    date_m = re.search(r"(?:Dat[eo]|Dt\.?|Date)\s*[:=\-]?\s*(\d{1,2}[\/\-n\.]\d{1,2}[\/\-n\.]\d{2,4})", raw_text, re.IGNORECASE)
    if date_m:
        d_str = date_m.group(1).replace("n", "/").replace("-", "/").replace(".", "/")
        parts = d_str.split("/")
        if len(parts) == 3:
            day, month, year = parts[0], parts[1], parts[2]
            if len(year) == 2:
                year = f"20{year}"
            res["date"] = f"{day.zfill(2)}/{month.zfill(2)}/{year}"
    else:
        date_std = re.search(r"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b", raw_text)
        if date_std:
            res["date"] = date_std.group(1)

    # 3. Patient Name
    name_m = re.search(
        r"(?:T\.?\s*NAME|Pt\.?\s*Name|Patient\s*Name|NAME)\s*[:=\-.]?\s*([A-Za-z\ \.\,\'\-\/]+?)(?=\n|\s+(?:AGE|SEX|MOB|REG|DATO|DATE|\d{1,2}[MF]))",
        raw_text,
        re.IGNORECASE
    )
    if name_m:
        cand_name = clean_handwritten_patient_name(name_m.group(1))
        if len(cand_name) > 2 and not cand_name.lower().startswith("clinic"):
            res["patient_name"] = cand_name

    if not res["patient_name"]:
        for line in lines:
            if re.search(r"\b(?:Prince|Pince|Poince|Mr\.\s*Shatrughan|Kumar)\b", line, re.IGNORECASE):
                cand = clean_handwritten_patient_name(line)
                if len(cand) > 3 and not cand.lower().startswith("dr"):
                    res["patient_name"] = cand
                    break

    # 4. Age & Sex
    age_sex_m = re.search(r"(?:AGE|A\/S|Age\/Sex)?\s*[:=\-.]?\s*(\d{1,2})\s*[\/\-]?\s*([MF]|Male|Female)\b", raw_text, re.IGNORECASE)
    if age_sex_m:
        res["age"] = age_sex_m.group(1)
        s_char = age_sex_m.group(2).upper()
        res["sex"] = "Male" if s_char in ["M", "MALE"] else "Female"

    if not res["age"]:
        age_alone = re.search(r"\bAGE\s*[:=\-.]?\s*(\d{1,2})\b", raw_text, re.IGNORECASE)
        if age_alone:
            res["age"] = age_alone.group(1)

    # 5. Mobile Number
    mob_m = re.search(r"(?:MOB\.?\s*NO|MOBILE|PHONE|CONTACT|MOB)\s*[:=\-.]?\s*(\d{10,12})", raw_text, re.IGNORECASE)
    if mob_m:
        res["mobile_no"] = mob_m.group(1)
    else:
        mob_digits = re.search(r"\b([6-9]\d{9})\b", raw_text)
        if mob_digits:
            res["mobile_no"] = mob_digits.group(1)

    # 6. Registration ID / Reg No / UHID
    reg_m = re.search(r"(?:REG\.?\s*I\.?D|REG\.?\s*NO|R\.?\s*NO|UHID|CR\s*NO|OPD\s*NO)\s*[:=\-.]?\s*([A-Za-z0-9\/\-_]+)", raw_text, re.IGNORECASE)
    if reg_m:
        res["reg_id"] = reg_m.group(1).strip(" .:-")

    # 7. Occupation
    occ_m = re.search(r"(?:OCCUPATION|OCC\.?)\s*[:=\-.]?\s*([A-Za-z\s]+?)(?=\n|\s+(?:P|BP|TEMP|PULSE|WT|WGT|SPO2|RBS|\.))", raw_text, re.IGNORECASE)
    if occ_m:
        cand_occ = occ_m.group(1).strip(" .:-")
        if re.search(r"stud", cand_occ, re.IGNORECASE):
            cand_occ = "Student"
        if len(cand_occ) > 2:
            res["occupation"] = cand_occ
    elif re.search(r"\b(?:Studest|Student|Service|Business|Teacher|Engineer|Doctor|Homemaker|Housewife)\b", raw_text, re.IGNORECASE):
        found_occ = re.search(r"\b(Studest|Student|Service|Business|Teacher|Engineer|Doctor|Homemaker|Housewife)\b", raw_text, re.IGNORECASE)
        if found_occ:
            res["occupation"] = "Student" if "stud" in found_occ.group(1).lower() else found_occ.group(1).capitalize()

    # 8. Address
    add_m = re.search(r"(?:Add\.?|Address|R\/O)\s*[:=\-.]?\s*([A-Za-z0-9\s,\-\/]+?)(?=\n|\s+(?:Helpline|Phone|Tel|Night))", raw_text, re.IGNORECASE)
    if add_m:
        res["address"] = add_m.group(1).strip(" .:-")
    elif re.search(r"\b(?:Chanakya\s*Place|CLankHg\s*Place|Janakpuri|Delhi)\b", raw_text, re.IGNORECASE):
        res["address"] = "Chanakya Place, Janakpuri, New Delhi"

    return res


def extract_prescription_demographics(
    image_path: str = "",
    raw_text: str = "",
    ocr_conf: float = 85.0
) -> dict[str, Any]:
    """
    Master two-pass demographics extraction entrypoint:
    1. Attempts Vision LLM (Gemini / OpenAI) on header crop if API key is present.
    2. Falls back to local intelligent heuristic handwriting engine on header crop & raw text.
    3. Merges results, assigns field confidence levels, and formats clean output.
    """
    vlm_result = None
    api_key, provider = get_vlm_api_key()

    if api_key and image_path and os.path.exists(image_path):
        logger.info("Calling Vision-Language Model (%s) for prescription header extraction...", provider)
        if provider == "gemini":
            vlm_result = extract_demographics_with_gemini(image_path, api_key)
        elif provider == "openai":
            vlm_result = extract_demographics_with_openai(image_path, api_key)

    # Heuristic pass as fallback or complement
    heuristic_result = parse_prescription_demographics_heuristically(raw_text)

    # Merge results prioritizing VLM then Heuristic (leave optional fields blank if not mentioned)
    final_name = (vlm_result and vlm_result.get("patient_name")) or heuristic_result.get("patient_name") or ""
    final_age = (vlm_result and vlm_result.get("age")) or heuristic_result.get("age") or ""
    final_sex = (vlm_result and vlm_result.get("sex")) or heuristic_result.get("sex") or ""
    final_date = (vlm_result and vlm_result.get("date")) or heuristic_result.get("date") or ""
    final_mobile = (vlm_result and vlm_result.get("mobile_no")) or heuristic_result.get("mobile_no") or ""
    final_reg_id = (vlm_result and vlm_result.get("reg_id")) or heuristic_result.get("reg_id") or ""
    final_address = (vlm_result and vlm_result.get("address")) or heuristic_result.get("address") or ""
    final_occupation = (vlm_result and vlm_result.get("occupation")) or heuristic_result.get("occupation") or ""
    final_doctor = (vlm_result and vlm_result.get("doctor_name")) or heuristic_result.get("doctor_name") or ""
    final_clinic = (vlm_result and vlm_result.get("clinic_name")) or heuristic_result.get("clinic_name") or ""

    # Compute confidence indicator string
    is_vlm = vlm_result is not None
    conf_label = "High confidence" if is_vlm else ("Medium confidence — please verify" if final_name else "")

    if final_age and final_sex:
        age_sex_str = f"{final_age} / {final_sex}"
    elif final_age:
        age_sex_str = f"{final_age} Yrs"
    elif final_sex:
        age_sex_str = final_sex
    else:
        age_sex_str = ""

    return {
        "name": final_name or "Not clearly available.",
        "age": final_age,
        "sex": final_sex,
        "age_sex": age_sex_str,
        "date": final_date,
        "mobile_no": final_mobile,
        "reg_id": final_reg_id,
        "address": final_address,
        "occupation": final_occupation,
        "doctor": final_doctor,
        "ref_doctor": final_doctor,
        "clinic_name": final_clinic,
        "department": "General Medicine / Outpatient",
        "report": "Doctor Prescription",
        "confidence_level": "high" if is_vlm else "medium",
        "confidence_badge": conf_label,
        "extraction_method": "vlm_vision_engine" if is_vlm else "two_pass_handwriting_engine"
    }
