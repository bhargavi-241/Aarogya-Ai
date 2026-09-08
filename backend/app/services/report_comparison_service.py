"""
report_comparison_service.py - Multi-Report Progression Comparison Engine.

Allows patients to upload or compare two reports from different dates and displays:
- Parameter
- Previous Value
- Current Value
- Delta Change (+ / -)
- Direction / Trend (Increased, Decreased, Stable)
- Reference Range
- Safe informational guidance
"""

from __future__ import annotations
import re
import logging
from typing import Any, Optional
from app.services.medical_document_parser import (
    extract_clinical_parameters,
    classify_document_type,
    KNOWN_PARAMETER_SPECS
)

logger = logging.getLogger(__name__)


def compare_two_reports(
    report_a_text: str,
    report_b_text: str,
    report_a_date: str = "Previous Report",
    report_b_date: str = "Current Report"
) -> dict[str, Any]:
    """
    Compares two clinical report texts (Report A = Previous, Report B = Current).
    Extracts common parameters, computes numeric changes, and notes differences.
    """
    params_a = extract_clinical_parameters(report_a_text, ocr_conf=90.0)
    params_b = extract_clinical_parameters(report_b_text, ocr_conf=90.0)

    doc_type_a = classify_document_type(report_a_text)
    doc_type_b = classify_document_type(report_b_text)

    # Build dictionary keyed by parameter_key
    dict_a = {p["parameter_key"]: p for p in params_a}
    dict_b = {p["parameter_key"]: p for p in params_b}

    all_keys = list(dict.fromkeys(list(dict_a.keys()) + list(dict_b.keys())))
    comparison_rows = []

    for key in all_keys:
        item_a = dict_a.get(key)
        item_b = dict_b.get(key)

        test_name = (item_b or item_a)["test_name"]
        unit = (item_b or item_a)["unit"]
        ref_range = (item_b or item_a)["reference_range"]

        val_a_str = item_a["result_value"] if item_a else "—"
        val_b_str = item_b["result_value"] if item_b else "—"

        val_a_num = item_a["result_num"] if item_a else None
        val_b_num = item_b["result_num"] if item_b else None

        change_str = "—"
        change_num = None
        trend = "unchanged"
        trend_label = "Stable"

        if val_a_num is not None and val_b_num is not None:
            delta = round(val_b_num - val_a_num, 2)
            change_num = delta
            if delta > 0:
                change_str = f"+{delta}"
                trend = "increased"
                trend_label = f"Increased (+{delta} {unit})"
            elif delta < 0:
                change_str = f"{delta}"
                trend = "decreased"
                trend_label = f"Decreased ({delta} {unit})"
            else:
                change_str = "0.0"
                trend = "stable"
                trend_label = "No Change"

        status_b = item_b["status_label"] if item_b else "Not Tested in Current"

        comparison_rows.append({
            "parameter_key": key,
            "test_name": test_name,
            "unit": unit,
            "reference_range": ref_range,
            "previous_value": val_a_str,
            "current_value": val_b_str,
            "change": change_str,
            "change_num": change_num,
            "trend": trend,
            "trend_label": trend_label,
            "current_status": status_b,
            "severity": item_b["severity"] if item_b else "Unable to Determine"
        })

    return {
        "report_a_title": f"{report_a_date} ({doc_type_a['document_type']})",
        "report_b_title": f"{report_b_date} ({doc_type_b['document_type']})",
        "comparison_table": comparison_rows,
        "matched_parameters_count": len([r for r in comparison_rows if r["previous_value"] != "—" and r["current_value"] != "—"]),
        "total_parameters_compared": len(comparison_rows),
        "guidance": "Changes are shown for informational purposes and should be interpreted by a healthcare professional in clinical context."
    }
