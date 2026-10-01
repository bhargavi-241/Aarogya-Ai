"""
wellness_suggestion_service.py - Personalized Wellness Suggestions Engine for Arogya-Ai.

Capabilities:
- Generates tailored, non-prescriptive, safe lifestyle and wellness suggestions.
- Inputs: Medical report findings, BP measurements (current & previous trends), symptoms, lifestyle factors, ML risk results, and report comparison deltas.
- Suggestion Categories:
    1. 🧘 Yoga & Relaxation
    2. 🚶 Physical Activity
    3. 🥗 Healthy Lifestyle
    4. 😴 Sleep & Recovery
    5. 🧠 Stress Management
    6. 💧 General Daily Habits
- Safety Rules:
    - Never diagnose, cure, treat, or replace doctor consultation.
    - Never recommend stopping/changing medication or dosages.
    - Never recommend supplements or extreme diets.
    - Nephrology / Kidney safety guard: Avoid aggressive exercise, high-protein or potassium salt recommendations.
    - Confidence-aware: If OCR or extraction was uncertain, flag uncertainty and avoid generating speculative advice.
    - Transparent "Why am I seeing this?": Cites only genuinely present findings.
    - Doctor Discussion Integration: Supplies tailored consultation questions.
"""

from __future__ import annotations
import os
import re
import json
import logging
from typing import Any, Optional

logger = logging.getLogger("wellness_suggestion_service")

WELLNESS_DISCLAIMER = (
    "General wellness information only. These suggestions are not a diagnosis, treatment plan, "
    "or substitute for professional medical advice. Consider discussing personalized exercise, "
    "diet, or lifestyle changes with a qualified healthcare professional."
)


def _parse_bp(bp_str: Optional[str]) -> tuple[Optional[int], Optional[int]]:
    """Extracts (systolic, diastolic) from strings like '138/88', '140/90 mmHg'."""
    if not bp_str:
        return None, None
    m = re.search(r"(\d{2,3})\s*[\/\-]\s*(\d{2,3})", str(bp_str))
    if m:
        try:
            return int(m.group(1)), int(m.group(2))
        except Exception:
            pass
    return None, None


def _find_parameter_by_keywords(parameters: list[dict[str, Any]], keywords: list[str]) -> Optional[dict[str, Any]]:
    """Locates a parameter in extracted test results by matching keywords."""
    for p in parameters:
        name = str(p.get("parameter") or p.get("name") or "").lower()
        if any(kw in name for kw in keywords):
            return p
    return None


def generate_wellness_suggestions(
    report_data: Optional[dict[str, Any]] = None,
    bp_reading: Optional[str] = None,
    previous_bp_reading: Optional[str] = None,
    symptoms: Optional[str] = None,
    lifestyle: Optional[dict[str, Any]] = None,
    ml_risk: Optional[list[dict[str, Any]] | dict[str, Any]] = None,
    comparison_delta: Optional[list[dict[str, Any]] | dict[str, Any]] = None,
    language: str = "en"
) -> dict[str, Any]:
    """
    Main entry point for generating personalized wellness suggestions across:
    - Medical report findings
    - BP readings and multi-reading trends
    - Patient symptoms
    - Self-reported lifestyle factors
    - ML disease-risk indications
    - Longitudinal report comparison deltas
    """
    report_data = report_data or {}
    lifestyle = lifestyle or {}
    lang = (language or "en").lower().strip()

    # 1. Inspect extracted parameters & vitals
    params: list[dict[str, Any]] = (
        report_data.get("parameters") or
        report_data.get("measurements") or
        []
    )
    vitals: dict[str, Any] = report_data.get("patient_information", {}).get("vitals") or {}
    
    # Check for blood pressure in vitals if not directly passed
    if not bp_reading and vitals.get("blood_pressure"):
        bp_reading = str(vitals["blood_pressure"])
    if not bp_reading:
        # Check raw text or parameter list for BP
        bp_param = _find_parameter_by_keywords(params, ["blood pressure", "bp", "systolic"])
        if bp_param and bp_param.get("value"):
            bp_reading = str(bp_param["value"])

    sys_curr, dia_curr = _parse_bp(bp_reading)
    sys_prev, dia_prev = _parse_bp(previous_bp_reading)

    # 2. Confidence & Verification Assessment
    has_uncertain_data = False
    if report_data:
        low_confidence_fields = report_data.get("low_confidence_fields") or []
        conf_scores = report_data.get("confidence_scores") if isinstance(report_data.get("confidence_scores"), dict) else {}
        ocr_confidence = float(
            report_data.get("ocr_confidence") or
            report_data.get("confidence") or
            conf_scores.get("overall") or
            conf_scores.get("ocr_confidence") or
            85.0
        )
        has_uncertain_data = (
            len(low_confidence_fields) > 0 or
            ocr_confidence < 60.0 or
            report_data.get("status") in ["uncertain", "uncertain_review"] or
            ("is_medical" in report_data and report_data.get("is_medical") is None)
        )

    uncertainty_warning = None
    if has_uncertain_data:
        uncertainty_warning = (
            "Some information from this document could not be read confidently. "
            "Please verify the extracted information before using personalized wellness suggestions."
        )

    # 3. Detect Clinical Signals from Available Information
    # Fasting glucose / HbA1c
    glucose_param = _find_parameter_by_keywords(params, ["glucose", "sugar", "rbs", "fbs", "fasting blood"])
    hba1c_param = _find_parameter_by_keywords(params, ["hba1c", "glycated hemoglobin", "glycohemoglobin"])
    is_glucose_elevated = False
    glucose_val_str = ""
    if hba1c_param and (hba1c_param.get("is_normal") is False or str(hba1c_param.get("status", "")).lower() in ["high", "abnormal"]):
        is_glucose_elevated = True
        glucose_val_str = f"HbA1c: {hba1c_param.get('value')}"
    elif glucose_param and (glucose_param.get("is_normal") is False or str(glucose_param.get("status", "")).lower() in ["high", "abnormal"]):
        is_glucose_elevated = True
        glucose_val_str = f"Blood Glucose: {glucose_param.get('value')}"

    # Cholesterol / Lipids
    lipid_param = _find_parameter_by_keywords(params, ["cholesterol", "lipid", "triglyceride", "ldl"])
    is_lipid_elevated = bool(lipid_param and (lipid_param.get("is_normal") is False or str(lipid_param.get("status", "")).lower() in ["high", "abnormal"]))
    lipid_val_str = f"{lipid_param.get('parameter', 'Lipid')}: {lipid_param.get('value')}" if lipid_param else ""

    # Kidney metrics (Creatinine, BUN, eGFR)
    kidney_param = _find_parameter_by_keywords(params, ["creatinine", "bun", "blood urea", "egfr", "microalbumin"])
    is_kidney_abnormal = bool(kidney_param and (kidney_param.get("is_normal") is False or str(kidney_param.get("status", "")).lower() in ["high", "low", "abnormal", "critical"]))
    kidney_val_str = f"{kidney_param.get('parameter', 'Kidney test')}: {kidney_param.get('value')}" if kidney_param else ""

    # Complete Blood Count (Hemoglobin, WBC, Platelets)
    hb_param = _find_parameter_by_keywords(params, ["hemoglobin", "hb"])
    is_hb_low = bool(hb_param and (hb_param.get("is_normal") is False or "low" in str(hb_param.get("status", "")).lower()))
    hb_val_str = f"Hemoglobin: {hb_param.get('value')}" if hb_param else ""

    # ML Risk Indications
    ml_diabetes_high = False
    ml_heart_high = False
    ml_kidney_high = False
    if isinstance(ml_risk, list):
        for item in ml_risk:
            d_type = str(item.get("disease", "")).lower()
            prob = float(item.get("probability") or (1.0 if item.get("prediction") == 1 or str(item.get("risk_level", "")).lower() in ["high", "moderate"] else 0.0))
            if "diabet" in d_type and prob > 0.40:
                ml_diabetes_high = True
            elif "heart" in d_type and prob > 0.40:
                ml_heart_high = True
            elif "kidney" in d_type and prob > 0.40:
                ml_kidney_high = True
    elif isinstance(ml_risk, dict):
        d_type = str(ml_risk.get("disease", "")).lower()
        prob = float(ml_risk.get("probability") or (1.0 if ml_risk.get("prediction") == 1 or str(ml_risk.get("risk_level", "")).lower() in ["high", "moderate"] else 0.0))
        if "diabet" in d_type and prob > 0.40:
            ml_diabetes_high = True
        elif "heart" in d_type and prob > 0.40:
            ml_heart_high = True
        elif "kidney" in d_type and prob > 0.40:
            ml_kidney_high = True

    # Lifestyle Inputs
    phys_activity = str(lifestyle.get("physical_activity") or lifestyle.get("activity") or "").lower()
    stress_level = str(lifestyle.get("stress_level") or lifestyle.get("stress") or "").lower()
    sleep_quality = str(lifestyle.get("sleep_quality") or lifestyle.get("sleep") or "").lower()
    hydration_level = str(lifestyle.get("hydration") or "").lower()

    # Symptoms text cues
    sym_lower = (symptoms or "").lower()
    sym_stress = any(w in sym_lower for w in ["stress", "anxious", "anxiety", "panic", "tense", "worry", "तनाव", "चिंता"])
    sym_sleep = any(w in sym_lower for w in ["insomnia", "sleepless", "cant sleep", "poor sleep", "tired", "fatigue", "थकान", "नींद"])
    sym_bp = any(w in sym_lower for w in ["headache", "dizziness", "palpitation", "high bp", "सिरदर्द", "चक्कर"])

    # Report Comparison Deltas (Longitudinal changes)
    comp_changes = []
    if isinstance(comparison_delta, list):
        for delta in comparison_delta:
            p_name = delta.get("parameter") or delta.get("name")
            p_from = delta.get("previous_value") or delta.get("val_a")
            p_to = delta.get("current_value") or delta.get("val_b")
            p_trend = delta.get("trend") or delta.get("direction")
            if p_name and p_from and p_to:
                comp_changes.append(f"{p_name}: {p_from} → {p_to} ({p_trend or 'changed'})")
    elif isinstance(comparison_delta, dict) and comparison_delta.get("deltas"):
        for delta in comparison_delta.get("deltas", []):
            p_name = delta.get("parameter")
            if p_name:
                comp_changes.append(f"{p_name} changed across reports")

    # 4. Generate Tailored Suggestions by Category
    suggestions: list[dict[str, Any]] = []

    # Category A: 🧘 Yoga & Relaxation
    yoga_reasons = []
    if sys_curr and sys_curr >= 130:
        yoga_reasons.append(f"Reported BP reading: {sys_curr}/{dia_curr or 80} mmHg")
    if stress_level in ["high", "moderate"] or sym_stress:
        yoga_reasons.append("Reported stress or anxiety levels")
    if ml_heart_high:
        yoga_reasons.append("Cardiovascular risk assessment indication")
    if sleep_quality in ["poor", "fair"] or sym_sleep:
        yoga_reasons.append("Reported sleep challenges or daily fatigue")

    if yoga_reasons:
        suggestions.append({
            "id": "yoga_relaxation_1",
            "category": "Yoga & Relaxation",
            "icon": "🧘",
            "title": "Gentle Diaphragmatic & Breathing Practice",
            "suggestion": (
                "Consider incorporating 5–10 minutes of slow, comfortable diaphragmatic or box breathing "
                "(inhale 4 seconds, pause 4 seconds, exhale 4 seconds) into your morning or evening routine. "
                "Gentle mindful relaxation practices may support natural parasympathetic nervous system balance."
            ),
            "reason": f"Suggested because your health information notes: {', '.join(yoga_reasons)}.",
            "reasons_list": yoga_reasons,
            "confidence": "high" if not has_uncertain_data else "medium",
            "doctor_discussion": "Are gentle breathing and restorative yoga practices safe and appropriate alongside my current health plan?"
        })

    # Category B: 🚶 Physical Activity
    activity_reasons = []
    if sys_curr and sys_curr >= 130:
        activity_reasons.append(f"Resting BP: {sys_curr}/{dia_curr or 80} mmHg")
    if is_glucose_elevated or ml_diabetes_high:
        activity_reasons.append(glucose_val_str or "Blood sugar / diabetes risk indication")
    if is_lipid_elevated or ml_heart_high:
        activity_reasons.append(lipid_val_str or "Cardiovascular lipid profile")
    if phys_activity in ["low", "sedentary"]:
        activity_reasons.append("Low daily physical activity level")

    if activity_reasons:
        # Check kidney safety guard
        if is_kidney_abnormal or ml_kidney_high:
            act_text = (
                "Consider regular, low-impact light walking at an easy, conversational pace (10–15 minutes). "
                "Avoid strenuous or dehydrating high-intensity workouts without explicit clinical clearance."
            )
            act_doc_q = "What level and duration of low-impact physical activity is safe for my kidney parameters and general health?"
            activity_reasons.append(kidney_val_str or "Kidney laboratory test observations")
        elif is_glucose_elevated:
            act_text = (
                "Consider a gentle, 10–15 minute walk shortly after your primary meals. "
                "Light post-meal movement generally supports natural muscle glucose uptake."
            )
            act_doc_q = "Is a regular 15-minute post-meal walk appropriate for my blood sugar management plan?"
        else:
            act_text = (
                "Consider regular, moderate-intensity movement such as comfortable brisk walking, swimming, "
                "or cycling for 20–30 minutes most days, if appropriate for your current fitness level."
            )
            act_doc_q = "What exercise intensity and routine do you recommend for my cardiovascular and blood pressure health?"

        suggestions.append({
            "id": "physical_activity_1",
            "category": "Physical Activity",
            "icon": "🚶",
            "title": "Consistent Low-Impact Movement",
            "suggestion": act_text,
            "reason": f"Suggested based on reported indicators: {', '.join(activity_reasons)}.",
            "reasons_list": activity_reasons,
            "confidence": "high" if not has_uncertain_data else "medium",
            "doctor_discussion": act_doc_q
        })

    # Category C: 🥗 Healthy Lifestyle
    lifestyle_reasons = []
    if sys_curr and sys_curr >= 130:
        lifestyle_reasons.append(f"BP reading: {sys_curr}/{dia_curr or 80} mmHg")
    if is_lipid_elevated or ml_heart_high:
        lifestyle_reasons.append(lipid_val_str or "Lipid/Cholesterol parameters")
    if is_glucose_elevated or ml_diabetes_high:
        lifestyle_reasons.append(glucose_val_str or "Elevated blood sugar indication")
    if is_hb_low:
        lifestyle_reasons.append(hb_val_str or "Lower hemoglobin reading")
    if is_kidney_abnormal or ml_kidney_high:
        lifestyle_reasons.append(kidney_val_str or "Renal function parameter")

    if lifestyle_reasons:
        # Strict kidney guardrail
        if is_kidney_abnormal or ml_kidney_high:
            diet_text = (
                "Discuss an individualized nutrition plan with your physician or registered renal dietitian. "
                "Avoid high-protein supplements, unverified herbal formulas, or sudden sodium/potassium salt substitutes without direct clinical advice."
            )
            diet_doc_q = "What specific dietary and protein guidelines should I follow based on my kidney lab values?"
        elif is_glucose_elevated:
            diet_text = (
                "Consider balanced meal pacing with an emphasis on fiber-rich vegetables, whole grains, and protein. "
                "Pairing complex carbohydrates with fiber and protein generally supports steady energy and glucose response."
            )
            diet_doc_q = "Could you suggest general dietary guidelines or a nutrition consultation for managing my blood sugar levels?"
        elif sys_curr and sys_curr >= 130:
            diet_text = (
                "Consider lifestyle nutrition patterns such as the DASH dietary approach, emphasizing vegetables, "
                "fruits, lean proteins, and mindful sodium moderation in daily home cooking."
            )
            diet_doc_q = "What dietary sodium target or nutritional pattern is recommended for my blood pressure?"
        else:
            diet_text = (
                "Consider a wholesome dietary pattern rich in colorful vegetables, legumes, whole grains, "
                "and healthy unsaturated fats while moderating ultra-processed packaged snacks."
            )
            diet_doc_q = "Are there specific dietary adjustments that would best support my latest lab results?"

        suggestions.append({
            "id": "healthy_lifestyle_1",
            "category": "Healthy Lifestyle",
            "icon": "🥗",
            "title": "Supportive Nutritional & Lifestyle Habits",
            "suggestion": diet_text,
            "reason": f"Suggested because your report notes: {', '.join(lifestyle_reasons)}.",
            "reasons_list": lifestyle_reasons,
            "confidence": "high" if not has_uncertain_data else "medium",
            "doctor_discussion": diet_doc_q
        })

    # Category D: 😴 Sleep & Recovery
    sleep_reasons = []
    if sleep_quality in ["poor", "fair", "interrupted"]:
        sleep_reasons.append(f"Reported sleep quality: {sleep_quality.title()}")
    if sym_sleep:
        sleep_reasons.append("Reported fatigue or sleep difficulty")
    if sys_curr and sys_curr >= 130:
        sleep_reasons.append("Blood pressure profile (circadian BP dipping is supported by consistent sleep)")
    if stress_level in ["high", "moderate"] or sym_stress:
        sleep_reasons.append("Elevated daily stress")

    if sleep_reasons:
        suggestions.append({
            "id": "sleep_recovery_1",
            "category": "Sleep & Recovery",
            "icon": "😴",
            "title": "Restorative Sleep Hygiene & Routine",
            "suggestion": (
                "Maintaining a regular sleep-wake schedule (targeting 7–8 hours in a dark, quiet room) "
                "and dimming screens 45 minutes before bedtime may support healthy circadian rhythms and recovery."
            ),
            "reason": f"Suggested based on your inputs: {', '.join(sleep_reasons)}.",
            "reasons_list": sleep_reasons,
            "confidence": "high" if not has_uncertain_data else "medium",
            "doctor_discussion": "Could my sleep quality or fatigue be related to my reported health parameters?"
        })

    # Category E: 🧠 Stress Management
    stress_reasons = []
    if stress_level in ["high", "moderate"]:
        stress_reasons.append(f"Reported stress level: {stress_level.title()}")
    if sym_stress:
        stress_reasons.append("Reported stress or anxiety symptoms")
    if sys_curr and sys_curr >= 130:
        stress_reasons.append("Cardiovascular & BP stability")

    if stress_reasons:
        suggestions.append({
            "id": "stress_mgmt_1",
            "category": "Stress Management",
            "icon": "🧠",
            "title": "Mindful Stress Buffer Routine",
            "suggestion": (
                "Consider scheduling two dedicated 5-minute pauses during your workday for progressive muscle relaxation, "
                "gentle neck stretches, or quiet reflection. Consistent stress reduction practices generally support overall well-being."
            ),
            "reason": f"Suggested because your data includes: {', '.join(stress_reasons)}.",
            "reasons_list": stress_reasons,
            "confidence": "high" if not has_uncertain_data else "medium",
            "doctor_discussion": "What stress management approaches or resources do you recommend alongside clinical care?"
        })

    # Category F: 💧 General Daily Habits & BP / Comparison Integration
    daily_reasons = []
    bp_trend_note = ""
    if sys_curr and sys_prev:
        bp_delta = sys_curr - sys_prev
        direction = "decreased" if bp_delta < 0 else ("increased" if bp_delta > 0 else "remained steady")
        bp_trend_note = f" (Previous: {sys_prev}/{dia_prev or 80} → Current: {sys_curr}/{dia_curr or 80}, {direction})"
        daily_reasons.append(f"Multi-reading BP trend observed{bp_trend_note}")
    elif sys_curr:
        daily_reasons.append(f"Current resting BP reading: {sys_curr}/{dia_curr or 80} mmHg")

    if comp_changes:
        daily_reasons.extend(comp_changes[:2])

    if hydration_level in ["low", "poor"]:
        daily_reasons.append("Reported low daily hydration")

    if daily_reasons:
        # Check kidney safety guard for hydration
        if is_kidney_abnormal or ml_kidney_high:
            habits_text = (
                f"Continue tracking your readings consistently in a daily log{bp_trend_note}. "
                "Consult your doctor to establish your specific daily fluid intake target, rather than forcing excess hydration."
            )
            habits_doc_q = "What is my optimal daily fluid intake target given my current kidney function?"
        else:
            habits_text = (
                f"Consider keeping a consistent daily health log of your readings{bp_trend_note}, "
                "maintaining regular water intake throughout the day, and pacing yourself during periods of prolonged sitting."
            )
            habits_doc_q = "How frequently would you like me to log my readings before our next consultation?"

        suggestions.append({
            "id": "daily_habits_1",
            "category": "General Daily Habits",
            "icon": "💧",
            "title": "Daily Health Tracking & Habit Pacing",
            "suggestion": habits_text,
            "reason": f"Suggested based on available data: {', '.join(daily_reasons)}.",
            "reasons_list": daily_reasons,
            "confidence": "high" if not has_uncertain_data else "medium",
            "doctor_discussion": habits_doc_q
        })

    # If no specific triggers were found (e.g. perfectly normal routine checkup), provide foundational baseline
    if not suggestions and not has_uncertain_data:
        suggestions.append({
            "id": "foundation_habits_1",
            "category": "Healthy Lifestyle",
            "icon": "🥗",
            "title": "Foundational Health Maintenance",
            "suggestion": (
                "Your reported parameters align within typical baseline ranges. "
                "Continuing a balanced lifestyle with regular movement, whole foods, and adequate hydration supports ongoing vitality."
            ),
            "reason": "Suggested as baseline health maintenance based on normal evaluated report parameters.",
            "reasons_list": ["All evaluated parameters within standard reference ranges"],
            "confidence": "high",
            "doctor_discussion": "What preventive screening schedule do you recommend to maintain my current health status?"
        })
        suggestions.append({
            "id": "foundation_activity_1",
            "category": "Physical Activity",
            "icon": "🚶",
            "title": "Regular Moderate Activity",
            "suggestion": (
                "Maintaining 150 minutes of moderate aerobic physical activity weekly (e.g. brisk walking) "
                "is generally recommended for long-term health and cardiovascular conditioning."
            ),
            "reason": "General preventive health recommendation.",
            "reasons_list": ["Routine baseline health checkup"],
            "confidence": "high",
            "doctor_discussion": "Is my current physical activity routine optimal for long-term preventive health?"
        })

    # 5. Translation to requested language if needed
    if lang in ["hi", "hindi", "mr", "marathi"]:
        suggestions = _localize_suggestions(suggestions, lang)
        if uncertainty_warning:
            if lang in ["hi", "hindi"]:
                uncertainty_warning = (
                    "इस दस्तावेज़ से कुछ जानकारी स्पष्ट रूप से नहीं पढ़ी जा सकी। "
                    "कृपया व्यक्तिगत कल्याण सुझावों का उपयोग करने से पहले निकाली गई जानकारी को सत्यापित करें।"
                )
            else:
                uncertainty_warning = (
                    "या दस्तऐवजातील काही माहिती स्पष्टपणे वाचता आली नाही. "
                    "कृपया वैयक्तिकृत निरोगी जीवनशैली सूचना वापरण्यापूर्वी माहितीची पडताळणी करा."
                )

    return {
        "success": True,
        "has_uncertain_data": has_uncertain_data,
        "uncertainty_warning": uncertainty_warning,
        "kidney_safety_guard": bool(is_kidney_abnormal or ml_kidney_high),
        "wellness_suggestions": suggestions,
        "disclaimer": WELLNESS_DISCLAIMER
    }


def _localize_suggestions(suggestions: list[dict[str, Any]], lang: str) -> list[dict[str, Any]]:
    """Localizes suggestions to Hindi or Marathi using safe, verified clinical terminology."""
    localized = []
    is_hi = lang in ["hi", "hindi"]

    for s in suggestions:
        item = dict(s)
        cat = item.get("category")
        if cat == "Yoga & Relaxation":
            item["category"] = "योग और विश्राम" if is_hi else "योग आणि विश्रांती"
            item["title"] = "धीमी श्वास और विश्राम तकनीकें" if is_hi else "हळूवार श्वासोच्छ्वास आणि विश्रांती पद्धती"
            item["suggestion"] = (
                "प्रतिदिन 5-10 मिनट धीमी गहरी श्वास (डायाफ्रामिक ब्रीदिंग) या अनुलोम-विलोम जैसी सौम्य तकनीकों का अभ्यास करने पर विचार करें। यह प्राकृतिक विश्राम में सहायक हो सकता है।"
                if is_hi else
                "दररोज ५-१० मिनिटे हळूवार दीर्घ श्वासोच्छ्वास किंवा सौम्य विश्रांती पद्धतींचा सराव करण्याचा विचार करा. हे नैसर्गिक विश्रांतीस मदत करू शकते."
            )
            item["doctor_discussion"] = (
                "क्या मेरे वर्तमान स्वास्थ्य के लिए हल्की श्वास और योग अभ्यास सुरक्षित हैं?"
                if is_hi else
                "माझ्या सध्याच्या आरोग्यासाठी हलके श्वास आणि योगाभ्यास सुरक्षित आहेत का?"
            )
        elif cat == "Physical Activity":
            item["category"] = "शारीरिक गतिविधि" if is_hi else "शारीरिक हालचाल"
            item["title"] = "नियमित मध्यम शारीरिक गतिविधि" if is_hi else "नियमित मध्यम हालचाल"
            item["suggestion"] = (
                "अपनी फिटनेस के अनुसार प्रतिदिन 15-20 मिनट सामान्य गति से टहलने या हल्की शारीरिक गतिविधि पर विचार करें। भारी व्यायाम शुरू करने से पहले डॉक्टर से परामर्श लें।"
                if is_hi else
                "आपल्या क्षमतेनुसार दररोज १५-२० मिनिटे साध्या गतीने चालण्याचा किंवा हलक्या हालचालींचा विचार करा. कठीण व्यायाम सुरू करण्यापूर्वी डॉक्टरांचा सल्ला घ्या."
            )
            item["doctor_discussion"] = (
                "मेरी स्वास्थ्य रिपोर्ट के अनुसार मेरे लिए किस प्रकार का व्यायाम सबसे उपयुक्त रहेगा?"
                if is_hi else
                "माझ्या आरोग्य अहवालानुसार माझ्यासाठी कोणत्या प्रकारचा व्यायाम सर्वात योग्य ठरेल?"
            )
        elif cat == "Healthy Lifestyle":
            item["category"] = "स्वस्थ जीवनशैली" if is_hi else "निरोगी जीवनशैली"
            item["title"] = "संतुलित पोषण और दैनिक आदतें" if is_hi else "संतुलित पोषण आणि सवयी"
            item["suggestion"] = (
                "ताजी सब्जियों, साबुत अनाज और संतुलित भोजन को प्राथमिकता दें। अत्यधिक नमक, चीनी और प्रसंस्कृत खाद्य पदार्थों को सीमित करने पर विचार करें।"
                if is_hi else
                "ताज्या भाज्या, धान्ये आणि संतुलित आहाराला प्राधान्य द्या. जास्त मीठ, साखर आणि प्रक्रिया केलेले पदार्थ मर्यादित ठेवा."
            )
            item["doctor_discussion"] = (
                "मेरी नवीनतम रिपोर्ट के आधार पर मुझे अपने खानपान में क्या विशिष्ट बदलाव करने चाहिए?"
                if is_hi else
                "माझ्या नवीनतम अहवालानुसार मी आहारात कोणते विशिष्ट बदल करावेत?"
            )
        elif cat == "Sleep & Recovery":
            item["category"] = "नींद और पुनर्प्राप्ति" if is_hi else "झोप आणि विश्रांती"
            item["title"] = "नियमित और आरामदायक नींद" if is_hi else "नियमित आणि शांत झोप"
            item["suggestion"] = (
                "नियमित समय पर सोने और 7-8 घंटे की पर्याप्त आरामदायक नींद लेने का प्रयास करें। सोने से 45 मिनट पहले स्क्रीन समय सीमित करने पर विचार करें।"
                if is_hi else
                "नियमित वेळी झोपण्याचा आणि ७-८ तासांची शांत झोप घेण्याचा प्रयत्न करा. झोपण्यापूर्वी स्क्रीनचा वापर कमी करा."
            )
            item["doctor_discussion"] = (
                "क्या मेरी थकान या नींद की गुणवत्ता का संबंध मेरी रिपोर्ट के मापदंडों से हो सकता है?"
                if is_hi else
                "माझ्या थकव्याचा किंवा झोपेच्या दर्जाचा संबंध माझ्या अहवालातील घटकांशी असू शकतो का?"
            )
        elif cat == "Stress Management":
            item["category"] = "तनाव प्रबंधन" if is_hi else "तणाव व्यवस्थापन"
            item["title"] = "माइंडफुलनेस और तनाव निवारण" if is_hi else "माइंडफुलनेस आणि तणावमुक्ती"
            item["suggestion"] = (
                "दिन के दौरान 5 मिनट का शांत विराम लें और गहरी सांसें लें। निरंतर तनाव कम करने के उपाय समग्र स्वास्थ्य को सहारा दे सकते हैं।"
                if is_hi else
                "दिवसभरात ५ मिनिटांचा शांत ब्रेक घ्या आणि दीर्घ श्वास घ्या. तणाव कमी करण्याचे उपाय आरोग्यास हातभार लावू शकतात."
            )
            item["doctor_discussion"] = (
                "मेरे स्वास्थ्य को ध्यान में रखते हुए तनाव नियंत्रण के लिए आप क्या सलाह देंगे?"
                if is_hi else
                "माझे आरोग्य लक्षात घेऊन तणाव नियंत्रणासाठी आपण काय सल्ला द्याल?"
            )
        elif cat == "General Daily Habits":
            item["category"] = "दैनिक आदतें" if is_hi else "दैनिक सवयी"
            item["title"] = "दैनिक स्वास्थ्य निगरानी और आदतें" if is_hi else "दैनिक आरोग्य नोंदी आणि सवयी"
            item["suggestion"] = (
                "नियमित रूप से अपनी रीडिंग (जैसे बीपी या शुगर) की डायरी रखें और दिनभर पर्याप्त पानी पिएं (जब तक डॉक्टर द्वारा तरल सीमित न किया गया हो)।"
                if is_hi else
                "नियमितपणे आपल्या वाचनाची (उदा. बीपी किंवा साखर) नोंद ठेवा आणि दिवसभरात पुरेसे पाणी प्या (जोपर्यंत डॉक्टरांनी मर्यादित केले नसेल)."
            )
            item["doctor_discussion"] = (
                "मुझे अपनी अगली जांच तक अपने स्वास्थ्य की निगरानी किस प्रकार करनी चाहिए?"
                if is_hi else
                "पुढील तपासणीपर्यंत मी माझ्या आरोग्याची नोंद कशा प्रकारे ठेवावी?"
            )

        localized.append(item)

    return localized
