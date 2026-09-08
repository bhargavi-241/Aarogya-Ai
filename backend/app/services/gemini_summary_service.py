"""
gemini_summary_service.py - AI-powered medical report summarizer and explainer using Google Gemini API.

Generates compassionate, patient-friendly clinical summaries and parameter explanations
while strictly adhering to medical safety rules (no definitive self-diagnosis).
"""

from __future__ import annotations
import os
import logging
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Try importing google.generativeai
try:
    import google.generativeai as genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False
    logger.warning("google-generativeai package not installed.")

# Candidate models in order of priority
CANDIDATE_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-2.5-flash"
]

def get_system_instruction(language: str = "en") -> str:
    """Returns language-specific system instructions for Gemini."""
    lang = (language or "en").lower().strip()
    if lang in ["hi", "hindi"]:
        return """You are a compassionate, patient-friendly medical report analyzer for an academic health application.
You MUST write all explanations, headings, and clinical analysis entirely in clear, natural HINDI (हिन्दी) using Devanagari script.
When given a medical/lab report text or parameters, explain the report in simple, easy-to-understand Hindi for patients.
You may include English medical terms or test names in parentheses for clarity (e.g. हीमोग्लोबिन (Hemoglobin)).

Always structure your response cleanly with clear line breaks and Markdown headings:
### 1. रिपोर्ट का सारांश (Report Overview)
दस्तावेज़ का प्रकार और यह क्या जांचता है, इसे 2-3 सरल वाक्यों में बताएं।

### 2. मापदंडों का विवरण (Parameters Breakdown)
#### सामान्य मापदंड (Normal Parameters)
* **[मापदंड का नाम]**: सामान्य सीमा में है और इसका शरीर के लिए क्या अर्थ है।
* ...

#### ध्यान देने योग्य / असामान्य मापदंड (Notable / Abnormal Parameters)
* **[मापदंड का नाम]**: सरल भाषा में इसका अर्थ और शरीर के लिए महत्व।
* ...

### 3. निष्कर्ष एवं स्वास्थ्य स्थिति (Conclusion & Health Status)
* **✓ स्वास्थ्य स्थिति: सामान्य (Normal)** — सभी मूल्यांकित मापदंड मानक संदर्भ सीमा के भीतर हैं।
(या)
* **⚠ स्वास्थ्य स्थिति: ध्यान देने की आवश्यकता (Attention Needed)** — [पहचानी गई प्रमुख स्वास्थ्य समस्या या चिंता का स्पष्ट विवरण]।
* **संक्षेप**: समग्र स्वास्थ्य स्थिति का 2 वाक्यों में सरल निष्कर्ष।

### 4. अगले कदम (Next Steps)
1. **डॉक्टर से परामर्श**: डॉक्टर से मिलने और रिपोर्ट पर चर्चा करने की सुरक्षित सलाह।
2. **जीवनशैली एवं सावधानियां**: स्वस्थ दिनचर्या और आवश्यक सावधानियां।

### 5. डॉक्टर से पूछने योग्य महत्वपूर्ण प्रश्न (Questions to Ask Your Doctor)
रोगी की रिपोर्ट के विशिष्ट परिणामों और स्वास्थ्य स्थिति के आधार पर 4 व्यावहारिक प्रश्न तैयार करें जिन्हें रोगी अपने डॉक्टर से परामर्श के दौरान पूछ सकता है:
1. **[पहला प्रश्न]**: इस रिपोर्ट के नतीजों का मेरी सेहत और दिनचर्या पर क्या असर पड़ेगा?
2. **[दूसरा प्रश्न]**: क्या मुझे इसके लिए किसी विशेष आहार, व्यायाम या दवा में बदलाव की आवश्यकता है?
3. **[तीसरा प्रश्न]**: क्या मुझे इसकी निगरानी के लिए आगे कोई फॉलो-अप टेस्ट कराने की जरूरत है?
4. **[चौथा प्रश्न]**: किन लक्षणों पर मुझे विशेष ध्यान देने की जरूरत है?

Strict Safety Rules:
- Never claim definitive self-diagnosis (e.g. 'You have diabetes').
- Always advise confirming lab results with a qualified physician."""

    if lang in ["mr", "marathi"]:
        return """You are a compassionate, patient-friendly medical report analyzer for an academic health application.
You MUST write all explanations, headings, and clinical analysis entirely in clear, natural MARATHI (मराठी) using Devanagari script.
When given a medical/lab report text or parameters, explain the report in simple, easy-to-understand Marathi for patients.
You may include English medical terms in parentheses for clarity (e.g. हिमोग्लोबिन (Hemoglobin)).

Always structure your response cleanly with clear line breaks and Markdown headings:
### 1. अहवाल विहंगावलोकन (Report Overview)
दस्तऐवजाचा प्रकार आणि त्याची तपासणी कशासाठी केली जाते हे २-३ सोप्या वाक्यात सांगा.

### 2. पॅरामीटर्स तपशील (Parameters Breakdown)
#### सामान्य पॅरामीटर्स (Normal Parameters)
* **[पॅरामीटरचे नाव]**: सामान्य मर्यादेत आहे आणि याचा शरीरासाठी काय अर्थ आहे.
* ...

#### असामान्य / लक्ष देण्याजोगे पॅरामीटर्स (Abnormal / Notable Parameters)
* **[पॅरामीटरचे नाव]**: सोप्या भाषेत याचा अर्थ आणि शरीरासाठी महत्त्व.
* ...

### 3. निष्कर्ष आणि आरोग्य स्थिती (Conclusion & Health Status)
* **✓ आरोग्य स्थिती: सामान्य (Normal)** — सर्व तपासलेले पॅरामीटर्स संदर्भ मर्यादेत आहेत.
(किंवा)
* **⚠ आरोग्य स्थिती: लक्ष देणे आवश्यक (Attention Needed)** — [प्रमुख आरोग्य समस्येचे स्पष्ट वर्णन].
* **थोडक्यात**: एकूण आरोग्य स्थितीचा २ वाक्यात सोपा निष्कर्ष.

### 4. पुढील पायऱ्या (Next Steps)
1. **डॉक्टरांचा सल्ला**: डॉक्टरांशी चर्चा करण्यासाठी कृतीयोग्य सल्ला.
2. **आरोग्यदायी सवयी**: जीवनशैली आणि घ्यावयाची काळजी.

### 5. आपल्या डॉक्टरांना विचारण्यासाठी महत्त्वाचे प्रश्न (Questions to Ask Your Doctor)
रुग्णाच्या अहवालावर आधारित ४ उपयुक्त आणि विचारण्याजोगे प्रश्न तयार करा:
1. **[पहिला प्रश्न]**: या अहवालातील निष्कर्षांचा माझ्या दैनंदिन आरोग्यावर काय परिणाम होईल?
2. **[दुसरा प्रश्न]**: यासाठी मला आहारात बदल, व्यायाम किंवा उपचारांची गरज आहे का?
3. **[तिसरा प्रश्न]**: या स्थितीवर लक्ष ठेवण्यासाठी मला पुन्हा कधी फॉलो-अप तपासणी करावी लागेल?
4. **[चौथा प्रश्न]**: मला कोणती लक्षणे आढळल्यास त्वरित वैद्यकीय सल्ला घ्यावा?

Strict Safety Rules:
- Never claim definitive self-diagnosis.
- Always advise confirming lab results with a qualified physician."""

    return """You are a compassionate, patient-friendly medical report analyzer for an academic health application.
When given a medical/lab report text or parameters, your job is to explain the report in simple, easy-to-understand language and provide a prominent Conclusion that clearly shows whether the report is normal or if any health issue is detected.

Always structure your response cleanly with clear line breaks and Markdown headings:
### 1. Report Overview
State the document type and what it tests in 2-3 simple, compassionate sentences.

### 2. Parameters Breakdown
#### Normal Parameters
* **[Parameter Name]**: State the value and explain in simple terms why it indicates healthy function.
* ...

#### Abnormal / Notable Parameters
* **[Parameter Name]**: Plain-language explanation for out-of-range value and what it means for the body.
* ...

### 3. Conclusion & Health Status
* **✓ Health Status: Normal** — All evaluated parameters are within standard reference limits.
(OR)
* **⚠ Health Status: Attention Needed** — [Explicitly describe the primary health issue or concern, e.g. mild anemia, high blood sugar, diastolic stiffness, etc.].
* **Summary**: 2-sentence overarching patient takeaway.

### 4. Next Steps
1. **Schedule a Follow-up Consultation**: Safe guidance on questions to ask your physician.
2. **Lifestyle & Care**: General healthy habits relevant to the report.

### 5. Questions to Ask Your Doctor
Provide 4 personalized, thoughtful questions the patient can take to their doctor visit based on their specific findings and overall health:
1. **[Question 1]**: What do these specific report findings mean for my day-to-day health and long-term wellness?
2. **[Question 2]**: Are there any dietary, exercise, or lifestyle modifications recommended based on these values?
3. **[Question 3]**: Do I need any follow-up tests, re-evaluations, or medication adjustments for this condition?
4. **[Question 4]**: What warning signs or symptoms should I watch out for that would require immediate clinical attention?

Strict Safety Rules:
- Never claim definitive self-diagnosis (e.g. 'You have diabetes' or 'You have chronic kidney disease').
- Always advise confirming lab results with a qualified physician."""


def get_configured_model(language: str = "en") -> Optional[Any]:
    """Retrieves and configures an active GenerativeModel instance using GEMINI_API_KEY with language-specific instructions."""
    if not _GENAI_AVAILABLE:
        return None

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_key_here":
        return None

    system_instruction = get_system_instruction(language)

    try:
        genai.configure(api_key=api_key)
        for model_name in CANDIDATE_MODELS:
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_instruction
                )
                return model
            except Exception:
                continue
    except Exception as exc:
        logger.warning("Failed to configure Gemini model: %s", exc)

    return None


def generate_gemini_report_summary(
    raw_text: str,
    parameters: list[dict[str, Any]],
    doc_type: str = "Medical Report",
    language: str = "en"
) -> dict[str, Any]:
    """
    Generates an AI-powered summary using Google Gemini API in the user's selected language.
    Falls back gracefully to structured rule-based summary if API is unreachable.
    """
    lang = (language or "en").lower().strip()
    model = get_configured_model(lang)
    if not model:
        return {
            "summary_text": None,
            "source": "fallback_rules",
            "is_ai_generated": False
        }

    # Format parameter snippet for prompt
    param_snippets = []
    for p in (parameters or [])[:15]:
        status_note = f"Status: {p.get('status_label', 'Recorded')}"
        param_snippets.append(f"- {p.get('test_name')}: {p.get('result_value')} {p.get('unit', '')} (Ref: {p.get('reference_range', 'N/A')}) [{status_note}]")

    param_context = "\n".join(param_snippets) if param_snippets else "Parameters extracted from document text."
    truncated_raw = (raw_text[:1500] if raw_text else "").strip()

    lang_instruction = ""
    if lang in ["hi", "hindi"]:
        lang_instruction = "CRITICAL: Write the entire summary in HINDI (हिन्दी) Devanagari script. Follow the 4 markdown sections with line breaks."
    elif lang in ["mr", "marathi"]:
        lang_instruction = "CRITICAL: Write the entire summary in MARATHI (मराठी) Devanagari script. Follow the 4 markdown sections with line breaks."
    else:
        lang_instruction = "Write the entire summary in English. Follow the 4 markdown sections with line breaks."

    prompt = f"""Target Language: {lang.upper()}
{lang_instruction}

Medical Document Type: {doc_type}

Extracted Key Parameters:
{param_context}

Original Report Snippet:
{truncated_raw}

Please write a simple, compassionate medical report summary for the patient following your system instruction. Ensure clean markdown formatting with line breaks between all sections and bullet points."""

    try:
        response = model.generate_content(prompt)
        ai_text = response.text.strip() if response and response.text else None
        if ai_text:
            return {
                "summary_text": ai_text,
                "source": "gemini_ai",
                "is_ai_generated": True,
                "language": lang
            }
    except Exception as exc:
        logger.warning("Gemini summary generation failed for language '%s': %s", lang, exc)

    return {
        "summary_text": None,
        "source": "fallback_rules",
        "is_ai_generated": False,
        "language": lang
    }


def generate_gemini_term_explanation(term: str, context: str = "", language: str = "en") -> Optional[str]:
    """Uses Gemini API to explain an individual medical term or medicine in plain language in the chosen language."""
    lang = (language or "en").lower().strip()
    model = get_configured_model(lang)
    if not model:
        return None

    lang_rule = "in simple, patient-friendly words (under 70 words)"
    if lang in ["hi", "hindi"]:
        lang_rule = "in simple, patient-friendly HINDI (हिन्दी) Devanagari script (under 70 words)"
    elif lang in ["mr", "marathi"]:
        lang_rule = "in simple, patient-friendly MARATHI (मराठी) Devanagari script (under 70 words)"

    prompt = f"""Explain the medical term, lab test, or medication '{term}' {lang_rule}.
Context from report: {context[:250]}.
Explain: 1) What it is, 2) Why it matters for health. Do NOT diagnose."""

    try:
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
    except Exception as exc:
        logger.warning("Gemini term explanation failed for '%s' (%s): %s", term, lang, exc)

    return None


def generate_ai_symptom_analysis(
    symptoms_text: str,
    language: str = "en"
) -> dict[str, Any]:
    """
    AI-powered symptom evaluator and clinical reasoning engine.
    Uses Google Gemini (with comprehensive clinical fallback) to predict:
    1. Potential Clinical Conditions & What Might Be Happening
    2. Pathophysiology / The Biological Reason Behind It in Simple Words
    3. Affected Organ Systems
    4. Red Flags / Warning Signs
    5. Recommended Specialist
    6. Recommended Diagnostic Lab Tests
    7. Self-Care & Lifestyle Measures
    8. Questions to Ask Your Doctor
    """
    lang = (language or "en").lower().strip()
    raw_input = (symptoms_text or "").strip()

    # Rule-based / Clinical Fallback Baseline
    fallback_data = _build_clinical_symptom_fallback(raw_input, lang)

    model = get_configured_model(lang)
    if not model:
        return {
            "success": True,
            "is_ai_generated": False,
            "source": "clinical_engine",
            "language": lang,
            **fallback_data
        }

    lang_instr = "Write the entire response in ENGLISH."
    if lang in ["hi", "hindi"]:
        lang_instr = "CRITICAL: Write the entire analysis in natural, fluent HINDI (हिन्दी) Devanagari script. Include English medical terms in parentheses."
    elif lang in ["mr", "marathi"]:
        lang_instr = "CRITICAL: Write the entire analysis in natural, fluent MARATHI (मराठी) Devanagari script. Include English medical terms in parentheses."

    prompt = f"""You are an advanced, compassionate medical AI clinical reasoning assistant (like ChatGPT / Med-PaLM) helping a patient understand their symptoms.

{lang_instr}

Patient's Reported Symptoms & Issues:
"{raw_input}"

Analyze the patient's symptoms thoroughly and provide a structured, educational breakdown.
Provide a rich, structured response using the following clear Markdown sections:

### 1. 🔍 What Might Be Happening (संभावित स्वास्थ्य स्थितियां)
List 2 to 3 most probable clinical conditions that could explain these symptoms, along with a likelihood level (Higher Likelihood / Moderate / Consideration) and a 1-sentence plain-language explanation for each.

### 2. 🧬 The Reason Behind It (इसके पीछे का वैज्ञानिक कारण)
Explain the biological / physiological mechanism in simple, intuitive language. Why do these specific symptoms occur together in the body? Explain what is happening inside the organs, blood vessels, or metabolism.

### 3. 🚨 Red Flags & Warning Signs (आपातकालीन चेतावनी संकेत)
List 3-4 specific warning signs where the patient should seek immediate or emergency medical care (e.g., severe sudden chest pressure, confusion, blood in urine, acute breathlessness).

### 4. 👨‍⚕️ Recommended Medical Specialist (परामर्श के लिए अनुशंसित विशेषज्ञ)
State which doctor or medical specialist the patient should consult first (e.g., Cardiologist, Endocrinologist, Nephrologist, Pulmonologist, or General Physician) and why.

### 5. 🧪 Recommended Clinical Lab Tests & Reports (अनुशंसित जांच व परीक्षण)
List 3 to 4 specific laboratory blood tests, scans, or diagnostic evaluations the patient should discuss with their doctor (e.g., HbA1c, Fasting Blood Sugar, 2D Echo, Serum Creatinine, CBC).

### 6. 🌿 Immediate Safe Precautions & Self-Care (प्राथमिक सावधानियां)
Give 2 to 3 safe non-pharmacological home care tips (hydration, rest, posture, dietary awareness).

### 7. ❓ Questions to Ask Your Doctor (डॉक्टर से पूछने योग्य प्रश्न)
Provide 3 specific questions the patient can ask during their consultation.

SAFETY RULE: Include a brief reminder that this is an educational AI assessment and not a replacement for an in-person medical diagnosis."""

    try:
        response = model.generate_content(prompt)
        ai_markdown = response.text.strip() if response and response.text else None
        if ai_markdown and len(ai_markdown) > 100:
            return {
                "success": True,
                "is_ai_generated": True,
                "source": "gemini_ai",
                "language": lang,
                "markdown_explanation": ai_markdown,
                "primary_domain": fallback_data.get("primary_domain", "general"),
                "system": fallback_data.get("system", "General Health"),
                "specialist": fallback_data.get("specialist", "General Physician"),
                "recommended_tests": fallback_data.get("recommended_tests", []),
                "predicted_conditions": fallback_data.get("predicted_conditions", []),
                "reason_behind_it": fallback_data.get("reason_behind_it", ""),
                "red_flags": fallback_data.get("red_flags", []),
                "doctor_questions": fallback_data.get("doctor_questions", [])
            }
    except Exception as exc:
        logger.warning("Gemini symptom analysis failed: %s", exc)

    return {
        "success": True,
        "is_ai_generated": False,
        "source": "clinical_engine",
        "language": lang,
        **fallback_data
    }


def _build_clinical_symptom_fallback(raw_text: str, language: str = "en") -> dict[str, Any]:
    """Generates rich structured clinical reasoning fallback across 8 medical domains."""
    lower = raw_text.lower()
    lang = language.lower()

    is_diabetes = any(w in lower for w in ["thirst", "urinat", "sugar", "glucose", "weight loss", "hunger", "sweet", "polyuria", "प्यास", "पेशाब", "शर्करा", "डायबिटीज", "तहान", "साखर"])
    is_heart = any(w in lower for w in ["chest", "heart", "palpitat", "angina", "pulse", "breathless", "pressure", "ecg", "echo", "हार्ट", "दिल", "छाती", "धड़कन", "सांस", "छातीत"])
    is_kidney = any(w in lower for w in ["kidney", "creatinine", "urea", "swelling", "edema", "ankle", "foamy", "flank", "urine", "किडनी", "गुर्दे", "सूजन", "पैर", "सूज"])
    is_anemia = any(w in lower for w in ["fatigue", "tired", "weak", "pale", "iron", "hemoglobin", "anemia", "dizzy", "थकान", "कमजोरी", "पीलापन", "हीमोग्लोबिन", "चक्कर", "अशक्तपणा"])
    is_respiratory = any(w in lower for w in ["cough", "phlegm", "sputum", "wheeze", "asthma", "fever", "cold", "खांसी", "कफ", "जुकाम", "बुखार", "खोकला", "ताप"])
    is_gastro = any(w in lower for w in ["acid", "heartburn", "stomach", "nausea", "vomit", "bloat", "gas", "constipat", "पेट", "एसिडिटी", "उल्टी", "गैस"])

    if is_heart:
        domain = "heart"
        system = "Cardiovascular & Heart Health"
        specialist = "Cardiologist or General Physician"
        tests = ["2D Echocardiography (2D Echo / EF)", "Electrocardiogram (ECG)", "Lipid Profile (Cholesterol)", "Troponin-T / Blood Pressure"]
        
        if lang in ["hi", "hindi"]:
            conditions = [
                {"condition": "कोरोनरी धमनी रोग / एनजाइना (Coronary Artery Disease)", "likelihood": "उच्च संभावना (Higher)", "summary": "दिल की मांसपेशियों में रक्त व ऑक्सीजन का प्रवाह कम होना।"},
                {"condition": "उच्च रक्तचाप एवं हृदय तनाव (Hypertensive Heart Strain)", "likelihood": "मध्यम (Moderate)", "summary": "रक्तचाप बढ़ने से हृदय की कार्यप्रणाली पर अतिरिक्त दबाव।"}
            ]
            reason = "जब हृदय की रक्त वाहिकाओं में रुकावट या तनाव होता है, तो शारीरिक परिश्रम के दौरान हृदय की मांसपेशियों को पर्याप्त ऑक्सीजन नहीं मिल पाती, जिससे सीने में भारीपन, खिंचाव और सांस फूलने की समस्या होती है।"
            red_flags = ["सीने में अत्यधिक तेज दर्द जो बाएं हाथ या जबड़े तक फैले", "अचानक पसीना आना और सांस लेने में गंभीर तकलीफ", "बेहोशी या चक्कर खाकर गिरना"]
            doctor_questions = ["क्या मुझे 2D इको और टीएमटी (TMT) टेस्ट करवाना चाहिए?", "क्या यह लक्षण रक्तचाप या कोलेस्ट्रॉल से जुड़े हैं?", "दवा शुरू करने तक मुझे कौन सी सावधानियां बरतनी चाहिए?"]
            md = f"""### 1. 🔍 संभावित स्थितियां (What Might Be Happening)
* **कोरोनरी धमनी रोग / एनजाइना (Coronary Artery Disease)** — *उच्च संभावना*: शारीरिक परिश्रम के दौरान दिल की धमनियों में रक्त प्रवाह सीमित होना।
* **उच्च रक्तचाप एवं हृदय तनाव (Hypertensive Heart Strain)** — *मध्यम संभावना*: बढ़ा हुआ रक्तचाप दिल के पंपिंग कार्य पर दबाव डालता है।

### 2. 🧬 इसके पीछे का वैज्ञानिक कारण (The Reason Behind It)
{reason}

### 3. 🚨 आपातकालीन चेतावनी संकेत (Red Flags)
* {red_flags[0]}
* {red_flags[1]}
* {red_flags[2]}

### 4. 👨‍⚕️ अनुशंसित विशेषज्ञ (Recommended Specialist)
**कार्डियोलॉजिस्ट (Cardiologist)** या जनरल फिजिशियन से तुरंत परामर्श लें।

### 5. 🧪 अनुशंसित जांच (Recommended Lab Tests)
* {tests[0]}
* {tests[1]}
* {tests[2]}
* {tests[3]}

### 6. ❓ डॉक्टर से पूछने योग्य प्रश्न (Questions to Ask Your Doctor)
* {doctor_questions[0]}
* {doctor_questions[1]}
* {doctor_questions[2]}"""
        else:
            conditions = [
                {"condition": "Coronary Artery Disease / Angina", "likelihood": "Higher Probability", "summary": "Reduced blood and oxygen delivery to the myocardium during exertion."},
                {"condition": "Hypertensive Heart Strain", "likelihood": "Moderate", "summary": "Elevated vascular resistance increasing cardiac workload."}
            ]
            reason = "During exertion, the heart muscle demands more oxygenated blood. If coronary blood vessels are narrowed or blood pressure is elevated, the oxygen supply falls short of demand (ischemia), triggering chest tightness, breathlessness, and fatigue."
            red_flags = ["Severe crushing chest pain radiating to left arm, neck or jaw", "Sudden cold sweat with shortness of breath at rest", "Sudden fainting (syncope) or irregular fluttering pulse"]
            doctor_questions = ["Should I undergo an Electrocardiogram (ECG) and 2D Echocardiogram?", "Could these symptoms be related to my blood pressure or cholesterol levels?", "Are there any physical exertion limits I should follow immediately?"]
            md = f"""### 1. 🔍 What Might Be Happening
* **Coronary Artery Disease / Angina** — *Higher Probability*: Narrowing of coronary vessels causing transient myocardial oxygen deficit during activity.
* **Hypertensive Cardiac Strain** — *Moderate*: Elevated systemic blood pressure increasing the workload on the heart's left ventricle.

### 2. 🧬 The Biological Reason Behind It
{reason}

### 3. 🚨 Red Flags & Warning Signs
* {red_flags[0]}
* {red_flags[1]}
* {red_flags[2]}

### 4. 👨‍⚕️ Recommended Medical Specialist
Consult a **Cardiologist** or General Physician for a formal clinical evaluation.

### 5. 🧪 Recommended Clinical Lab Tests & Reports
* {tests[0]}
* {tests[1]}
* {tests[2]}
* {tests[3]}

### 6. ❓ Questions to Ask Your Doctor
* {doctor_questions[0]}
* {doctor_questions[1]}
* {doctor_questions[2]}"""

    elif is_diabetes:
        domain = "diabetes"
        system = "Endocrine & Metabolic Health"
        specialist = "Endocrinologist / Diabetologist or General Physician"
        tests = ["Fasting Blood Glucose (FBS)", "HbA1c (3-Month Glycated Hemoglobin)", "Post Prandial Blood Sugar (PPBS)", "Urine Routine & Microalbumin"]

        if lang in ["hi", "hindi"]:
            conditions = [
                {"condition": "टाइप 2 डायबिटीज मेलिटस (Type 2 Diabetes Mellitus)", "likelihood": "उच्च संभावना (Higher)", "summary": "इंसुलिन प्रतिरोध के कारण रक्त में ग्लूकोज का स्तर बढ़ना।"},
                {"condition": "इम्पायर्ड ग्लूकोज टॉलरेंस / प्रीडायबिटीज (Prediabetes)", "likelihood": "मध्यम (Moderate)", "summary": "ब्लड शुगर सामान्य से अधिक लेकिन प्रारंभिक अवस्था में।"}
            ]
            reason = "जब रक्त में अतिरिक्त ग्लूकोज जमा होता है, तो गुर्दे (Kidneys) इसे छानने के लिए अधिक काम करते हैं। इसके कारण शरीर के ऊतकों से पानी खिंचकर पेशाब में चला जाता है (Osmotic Diuresis), जिससे बार-बार पेशाब आना, तीव्र प्यास और ऊर्जा की कमी (थकान) महसूस होती है।"
            red_flags = ["सांस में फलों जैसी गंध और उल्टी (Diabetic Ketoacidosis के संकेत)", "अत्यधिक भ्रम या चक्कर आना", "घाव या चोट का लंबे समय तक न भरना"]
            doctor_questions = ["क्या मेरा HbA1c और फास्टिंग शुगर टेस्ट आवश्यक है?", "क्या मुझे आहार में बदलाव या दवा की आवश्यकता होगी?", "क्या मुझे घर पर ग्लूकोमीटर से निगरानी करनी चाहिए?"]
            md = f"""### 1. 🔍 संभावित स्थितियां (What Might Be Happening)
* **टाइप 2 डायबिटीज मेलिटस (Type 2 Diabetes)** — *उच्च संभावना*: इंसुलिन की कमी या प्रतिरोध के कारण ब्लड शुगर का बढ़ना।
* **प्रीडायबिटीज (Prediabetes / Metabolic Syndrome)** — *मध्यम संभावना*: प्रारंभिक मेटाबॉलिक असंतुलन।

### 2. 🧬 इसके पीछे का वैज्ञानिक कारण (The Reason Behind It)
{reason}

### 3. 🚨 आपातकालीन चेतावनी संकेत (Red Flags)
* {red_flags[0]}
* {red_flags[1]}
* {red_flags[2]}

### 4. 👨‍⚕️ अनुशंसित विशेषज्ञ (Recommended Specialist)
**एंडोक्रिनोलॉजिस्ट / डायबेटोलॉजिस्ट (Endocrinologist)** या जनरल फिजिशियन से परामर्श लें।

### 5. 🧪 अनुशंसित जांच (Recommended Lab Tests)
* {tests[0]}
* {tests[1]}
* {tests[2]}
* {tests[3]}

### 6. ❓ डॉक्टर से पूछने योग्य प्रश्न (Questions to Ask Your Doctor)
* {doctor_questions[0]}
* {doctor_questions[1]}
* {doctor_questions[2]}"""
        else:
            conditions = [
                {"condition": "Type 2 Diabetes Mellitus", "likelihood": "Higher Probability", "summary": "Elevated blood glucose due to insulin resistance or impaired insulin secretion."},
                {"condition": "Prediabetes / Metabolic Dysregulation", "likelihood": "Moderate", "summary": "Subclinical glucose intolerance with compensatory metabolic strain."}
            ]
            reason = "When blood glucose exceeds the renal threshold, kidneys flush the excess sugar through urine. This pulls large volumes of water from body tissues (osmotic diuresis), triggering frequent urination, chronic dehydration, severe thirst, and cellular fatigue because glucose cannot enter cells for energy."
            red_flags = ["Fruity-smelling breath with persistent nausea/vomiting (DKA sign)", "Confusion, extreme dizziness, or sudden visual blurring", "Non-healing sores or numbness in feet/toes"]
            doctor_questions = ["What are my current HbA1c and fasting blood sugar levels?", "Are lifestyle and dietary modifications sufficient, or do I need medical therapy?", "Should I start self-monitoring blood glucose at home?"]
            md = f"""### 1. 🔍 What Might Be Happening
* **Type 2 Diabetes Mellitus** — *Higher Probability*: Hyperglycemia resulting from insulin resistance or insufficient insulin production.
* **Prediabetes / Metabolic Syndrome** — *Moderate*: Early metabolic dysregulation requiring preventive intervention.

### 2. 🧬 The Biological Reason Behind It
{reason}

### 3. 🚨 Red Flags & Warning Signs
* {red_flags[0]}
* {red_flags[1]}
* {red_flags[2]}

### 4. 👨‍⚕️ Recommended Medical Specialist
Consult an **Endocrinologist / Diabetologist** or General Physician.

### 5. 🧪 Recommended Clinical Lab Tests & Reports
* {tests[0]}
* {tests[1]}
* {tests[2]}
* {tests[3]}

### 6. ❓ Questions to Ask Your Doctor
* {doctor_questions[0]}
* {doctor_questions[1]}
* {doctor_questions[2]}"""

    elif is_kidney:
        domain = "kidney"
        system = "Renal & Urinary System"
        specialist = "Nephrologist or General Physician"
        tests = ["Serum Creatinine & Blood Urea (KFT)", "Estimated GFR (eGFR)", "Urine Protein / Albumin-Creatinine Ratio (ACR)", "Serum Electrolytes (Sodium/Potassium)"]
        conditions = [
            {"condition": "Impaired Renal Filtration (Kidney Function Variance)", "likelihood": "Higher Probability", "summary": "Reduced kidney ability to filter waste products and excess fluid."},
            {"condition": "Fluid Retention / Proteinuria", "likelihood": "Moderate", "summary": "Protein leakage into urine causing peripheral edema."}
        ]
        reason = "Healthy kidneys filter metabolic waste (creatinine, urea) and maintain precise fluid balance. When filtration slows down, fluid accumulates in gravity-dependent areas like ankles and feet, and waste buildup causes fatigue, loss of appetite, and nausea."
        red_flags = ["Sudden severe reduction in urine output", "Extreme shortness of breath from fluid buildup in lungs", "Severe uncontrolled high blood pressure"]
        doctor_questions = ["What is my estimated GFR (eGFR) and creatinine level?", "Is there any protein present in my urine?", "Should I restrict sodium or fluid intake?"]
        md = f"""### 1. 🔍 What Might Be Happening
* **Renal Function Variation / Fluid Retention** — *Higher Probability*: Alteration in kidney filtration and fluid homeostasis.
* **Proteinuria / Glomerular Strain** — *Moderate*: Micro-leakage of protein into urine.

### 2. 🧬 The Biological Reason Behind It
{reason}

### 3. 🚨 Red Flags & Warning Signs
* {red_flags[0]}
* {red_flags[1]}
* {red_flags[2]}

### 4. 👨‍⚕️ Recommended Medical Specialist
Consult a **Nephrologist** or General Physician.

### 5. 🧪 Recommended Clinical Lab Tests & Reports
* {tests[0]}
* {tests[1]}
* {tests[2]}
* {tests[3]}

### 6. ❓ Questions to Ask Your Doctor
* {doctor_questions[0]}
* {doctor_questions[1]}
* {doctor_questions[2]}"""

    else:
        domain = "general"
        system = "General Clinical Health"
        specialist = "General Physician / Family Doctor"
        tests = ["Complete Blood Count (CBC)", "Comprehensive Metabolic Panel", "Routine Urinalysis", "Blood Pressure Evaluation"]
        conditions = [
            {"condition": "General Physiological Variance / Nutritional Deficit", "likelihood": "Higher Probability", "summary": "Common systemic fatigue or metabolic imbalance."},
            {"condition": "Mild Subclinical Inflammation / Infection", "likelihood": "Moderate", "summary": "Immune system response to seasonal or viral stressors."}
        ]
        reason = "The reported symptoms reflect a systemic response where energy utilization, immune defense, or fluid distribution is slightly disrupted, leading to fatigue, mild discomfort, or changes in stamina."
        red_flags = ["High persistent fever over 102°F lasting more than 3 days", "Severe unexplained weight loss or severe pain", "Difficulty breathing or persistent vomiting"]
        doctor_questions = ["What baseline blood tests should I perform to evaluate these symptoms?", "Could nutritional deficiencies (Iron, Vitamin D3, B12) explain this?", "When should I schedule a follow-up consultation?"]
        md = f"""### 1. 🔍 What Might Be Happening
* **General Physiological Fatigue / Nutritional Deficiency** — *Higher Probability*: Baseline stamina fluctuation or vitamin/mineral variance.
* **Mild Subclinical Inflammatory Response** — *Moderate*: Body adapting to stress or seasonal changes.

### 2. 🧬 The Biological Reason Behind It
{reason}

### 3. 🚨 Red Flags & Warning Signs
* {red_flags[0]}
* {red_flags[1]}
* {red_flags[2]}

### 4. 👨‍⚕️ Recommended Medical Specialist
Consult a **General Physician / Family Doctor**.

### 5. 🧪 Recommended Clinical Lab Tests & Reports
* {tests[0]}
* {tests[1]}
* {tests[2]}
* {tests[3]}

### 6. ❓ Questions to Ask Your Doctor
* {doctor_questions[0]}
* {doctor_questions[1]}
* {doctor_questions[2]}"""

    return {
        "primary_domain": domain,
        "system": system,
        "specialist": specialist,
        "recommended_tests": tests,
        "predicted_conditions": conditions,
        "reason_behind_it": reason,
        "red_flags": red_flags,
        "doctor_questions": doctor_questions,
        "markdown_explanation": md
    }


def ask_health_assistant(
    question: str,
    report_context: Optional[str] = None,
    history: Optional[list] = None,
    language: str = "en"
) -> dict[str, Any]:
    """
    Universal Health Q&A Assistant:
    Answers any health, symptom, medication, lab test, diet, or medical report question.
    Uses Gemini AI (gemini-3.6-flash) with structured clinical fallback.
    """
    lang = (language or "en").lower().strip()
    clean_q = question.strip()
    if not clean_q:
        return {
            "answer": "Please ask a health question to receive guidance.",
            "source": "system",
            "suggestions": ["What do normal blood sugar levels look like?", "What does high blood pressure mean?"]
        }

    # Format prompt with system context, report context, conversation history
    lang_prompt_map = {
        "hi": "You MUST answer entirely in clear, natural HINDI (हिन्दी) using Devanagari script.",
        "mr": "You MUST answer entirely in clear, natural MARATHI (मराठी) using Devanagari script.",
        "en": "Answer in clear, empathetic English using plain, accessible language."
    }
    lang_rule = lang_prompt_map.get(lang, lang_prompt_map["en"])

    system_instruction = f"""You are AarogyaAI, a compassionate, highly knowledgeable, and safety-conscious AI Health Assistant.
Your goal is to answer patients' questions about health, lab tests, medicines, symptoms, wellness, and medical reports.

Rules:
1. {lang_rule}
2. Be empathetic, encouraging, and clear. Avoid overwhelming patients with dense medical jargon; explain concepts simply.
3. Use clean Markdown formatting with clear headings, bullet points, and bold keywords.
4. If the user provided medical report context, reference their specific findings, parameters, or values directly.
5. Provide actionable guidance: practical lifestyle tips, safe home care, dietary context, and questions they can discuss with their doctor.
6. If the question suggests red-flag emergency symptoms (crushing chest pain, severe shortness of breath, sudden facial drooping, severe bleeding), urge immediate emergency clinical attention (call 112 / 911).
7. Do not prescribe prescription-only medications or alter active dosages without physician supervision.
8. End with 2-3 brief suggested follow-up questions the patient might want to ask next."""

    # Build conversation context
    prompt_parts = []
    if report_context and report_context.strip():
        prompt_parts.append(f"--- PATIENT'S CURRENT MEDICAL REPORT CONTEXT ---\n{report_context.strip()[:3000]}\n--- END REPORT CONTEXT ---\n")

    if history and isinstance(history, list):
        prompt_parts.append("--- PREVIOUS CONVERSATION ---")
        for turn in history[-6:]:  # Keep last 3 turns
            role = turn.get("role", "user")
            content = turn.get("content", "")
            prompt_parts.append(f"{role.capitalize()}: {content}")
        prompt_parts.append("--- END PREVIOUS CONVERSATION ---\n")

    prompt_parts.append(f"Patient's Question: {clean_q}")
    full_prompt = "\n\n".join(prompt_parts)

    # 1. Try Gemini
    if _GENAI_AVAILABLE:
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if api_key and api_key != "your_key_here":
            try:
                genai.configure(api_key=api_key)
                for model_name in CANDIDATE_MODELS:
                    try:
                        model = genai.GenerativeModel(
                            model_name=model_name,
                            system_instruction=system_instruction
                        )
                        response = model.generate_content(
                            full_prompt,
                            generation_config=genai.types.GenerationConfig(
                                temperature=0.3,
                                max_output_tokens=1000,
                            )
                        )
                        if response and response.text and response.text.strip():
                            text_ans = response.text.strip()
                            suggestions = _extract_or_generate_suggestions(clean_q, text_ans, lang)
                            return {
                                "answer": text_ans,
                                "source": "gemini_ai",
                                "model": model_name,
                                "suggestions": suggestions
                            }
                    except Exception as m_exc:
                        logger.warning("Gemini model %s query failed: %s", model_name, m_exc)
                        continue
            except Exception as genai_exc:
                logger.warning("Gemini execution failed for question: %s", genai_exc)

    # 2. Comprehensive Clinical Rule-Based Fallback
    fallback_result = _generate_clinical_fallback_answer(clean_q, report_context, lang)
    return fallback_result


def _extract_or_generate_suggestions(question: str, answer: str, lang: str) -> list[str]:
    """Provides smart follow-up suggestions based on the topic."""
    q_lower = question.lower()
    if lang == "hi":
        if "sugar" in q_lower or "मधुमेह" in q_lower or "glucose" in q_lower:
            return ["डायबिटीज में क्या खाना चाहिए?", "HbA1c टेस्ट क्या होता है?", "सामान्य ब्लड शुगर रेंज क्या है?"]
        if "bp" in q_lower or "pressure" in q_lower or "रक्तचाप" in q_lower:
            return ["ब्लड प्रेशर कम करने के घरेलू उपाय?", "सामान्य बीपी कितना होना चाहिए?", "बीपी में नमक कितना लेना चाहिए?"]
        if "platelet" in q_lower or "cbc" in q_lower or "खून" in q_lower:
            return ["प्लेटलेट्स तेजी से कैसे बढ़ाएं?", "हीमोग्लोबिन बढ़ाने वाले फल?", "CBC टेस्ट में क्या-क्या आता है?"]
        return ["डॉक्टर से क्या सवाल पूछने चाहिए?", "इसके लिए क्या डाइट लेनी चाहिए?", "क्या कोई अन्य टेस्ट की जरूरत है?"]
    elif lang == "mr":
        if "sugar" in q_lower or "मधुमेह" in q_lower:
            return ["मधुमेहात कोणता आहार घ्यावा?", "HbA1c चाचणी म्हणजे काय?", "रक्तातील साखरेची सामान्य पातळी किती?"]
        if "bp" in q_lower or "रक्तदाब" in q_lower:
            return ["रक्तदाब नियंत्रित करण्याचे उपाय?", "सामान्य बीपी किती असावे?", "आहारात मिठाचे प्रमाण किती ठेवावे?"]
        return ["डॉक्टरांना कोणते प्रश्न विचारावेत?", "यासाठी कोणता आहार योग्य आहे?", "इतर कोणती चाचणी करावी लागेल?"]
    else:
        if "sugar" in q_lower or "glucose" in q_lower or "diabetes" in q_lower or "hba1c" in q_lower:
            return [
                "What is a healthy meal plan for high blood sugar?",
                "What is the difference between Fasting Blood Sugar and HbA1c?",
                "What warning symptoms indicate low blood sugar (hypoglycemia)?"
            ]
        if "pressure" in q_lower or "bp" in q_lower or "hypertension" in q_lower:
            return [
                "What lifestyle modifications help lower blood pressure?",
                "What is considered an ideal blood pressure reading by age?",
                "What foods should be avoided with high blood pressure?"
            ]
        if "platelet" in q_lower or "cbc" in q_lower or "hemoglobin" in q_lower or "rbc" in q_lower:
            return [
                "What natural foods help boost platelet count safely?",
                "What causes low hemoglobin (anemia) and how to improve it?",
                "How often should a CBC test be monitored?"
            ]
        if "kidney" in q_lower or "creatinine" in q_lower or "egfr" in q_lower:
            return [
                "What causes serum creatinine levels to rise?",
                "What diet is recommended for kidney protection?",
                "How does high blood pressure affect kidney function?"
            ]
        if "liver" in q_lower or "sgpt" in q_lower or "sgot" in q_lower or "bilirubin" in q_lower:
            return [
                "What do elevated liver enzymes (SGPT / SGOT) indicate?",
                "What diet promotes liver health and enzyme normalization?",
                "Is fatty liver reversible with diet and exercise?"
            ]
        return [
            "What specific questions should I ask my doctor about this?",
            "What dietary or lifestyle changes would help most?",
            "Are there follow-up tests recommended for this condition?"
        ]


def _generate_clinical_fallback_answer(question: str, report_context: Optional[str], lang: str) -> dict[str, Any]:
    """Generates structured medical knowledge guidance when LLM is offline."""
    q_lower = question.lower()
    
    # Check key medical categories
    if any(k in q_lower for k in ["sugar", "glucose", "diabetes", "hba1c"]):
        if lang == "hi":
            ans = """### 🩸 ब्लड शुगर (रक्त शर्करा) संबंधी मार्गदर्शन

* **सामान्य स्तर**: खाली पेट (Fasting) सामान्यतः 70-99 mg/dL और भोजन के 2 घंटे बाद (Post-Prandial) 140 mg/dL से कम सामान्य माना जाता है।
* **प्रमुख कारण**: इंसुलिन का ठीक से काम न करना, कार्बोहाइड्रेट युक्त आहार, शारीरिक निष्क्रियता, तनाव या आनुवंशिकी।
* **देखभाल के उपाय**:
  1. साबुत अनाज, हरी सब्जियां, दालें और रेशेदार (फाइबर) आहार शामिल करें।
  2. रिफाइंड चीनी, मीठे पेय पदार्थ और मैदे से बचें।
  3. प्रतिदिन कम से कम 30 मिनट पैदल चलें या व्यायाम करें।
  4. पर्याप्त पानी पिएं और पर्याप्त नींद लें।
* **डॉक्टर से परामर्श**: अपनी जांच रिपोर्ट और दवाओं के सही डोज के लिए अपने चिकित्सक से अवश्य मिलें।"""
        elif lang == "mr":
            ans = """### 🩸 रक्तातील साखरेविषयी (Blood Sugar) मार्गदर्शन

* **सामान्य पातळी**: उपाशीपोटी (Fasting) 70-99 mg/dL आणि जेवणानंतर 140 mg/dL पेक्षा कमी असणे सामान्य मानले जाते.
* **महत्त्वाचे उपाय**:
  1. आहारात पालेभाज्या, कडधान्ये आणि फायबरयुक्त पदार्थांचा समावेश करा.
  2. साखर, गोड पदार्थ आणि मैद्याचे सेवन टाळा.
  3. दररोज किमान 30 मिनिटे चालण्याचा व्यायाम करा.
* **सल्ला**: औषधे आणि योग्य उपचारांसाठी नेहमी डॉक्टरांचा सल्ला घ्या."""
        else:
            ans = """### 🩸 Understanding Blood Glucose & Diabetes Management

* **Reference Ranges**: 
  - Normal Fasting Blood Sugar: **70 – 99 mg/dL**
  - Pre-diabetes Fasting: **100 – 125 mg/dL**
  - Diabetes Range: **126 mg/dL or higher on repeat testing**
  - HbA1c: Under **5.7%** is normal; **5.7% – 6.4%** indicates prediabetes; **6.5%+** indicates diabetes.
* **Key Mechanisms**: Glucose is the body's primary cellular fuel. Insulin produced by the pancreas allows cells to absorb glucose. When cells become resistant or insulin output is insufficient, sugar accumulates in the bloodstream.
* **Practical Management Steps**:
  1. **Dietary Focus**: Emphasize complex carbohydrates (oats, legumes, millets), lean proteins, and leafy greens. Limit refined sugars, fruit juices, and white flour.
  2. **Physical Activity**: Regular moderate exercise (30 mins walking/day) enhances cellular insulin sensitivity.
  3. **Hydration**: Drink sufficient water to help the kidneys naturally flush excess circulating glucose.
* **Next Clinical Steps**: Share these values with your physician or endocrinologist to discuss personalized lifestyle and management strategies."""

    elif any(k in q_lower for k in ["blood pressure", "bp", "hypertension"]):
        if lang == "hi":
            ans = """### 🩺 ब्लड प्रेशर (रक्तचाप) संबंधी मार्गदर्शन

* **सामान्य स्तर**: सामान्य रक्तचाप लगभग **120/80 mmHg** होता है। 130-139/80-89 स्टेज-1 हाइपरटेंशन और 140/90 या अधिक उच्च रक्तचाप माना जाता है।
* **नियंत्रण के उपाय**:
  1. नमक (सोडियम) का सेवन प्रतिदिन 1 चम्मच से कम सीमित करें।
  2. पोटैशियम युक्त आहार (केला, पालक, नारियल पानी) लें।
  3. धूम्रपान व शराब से दूर रहें और तनाव कम करने के लिए प्राणायाम करें।
  4. यदि सिर में तेज दर्द या चक्कर आए तो तुरंत बीपी चेक करवाएं।"""
        else:
            ans = """### 🩺 Understanding Blood Pressure & Cardiovascular Health

* **Target Reference Ranges**:
  - Normal: **Systolic < 120 mmHg** and **Diastolic < 80 mmHg**
  - Elevated: **120 – 129 / < 80 mmHg**
  - Stage 1 Hypertension: **130 – 139 / 80 – 89 mmHg**
  - Stage 2 Hypertension: **140+ / 90+ mmHg**
* **Why Blood Pressure Matters**: High arterial pressure exerts chronic strain on the delicate endothelial lining of blood vessels, increasing long-term risks of heart attack, stroke, and kidney disease.
* **Evidence-Based Lifestyle Strategies**:
  1. **Sodium Reduction**: Keep daily sodium intake under 2,000 mg (about 1 teaspoon of table salt). Avoid processed snacks and canned foods.
  2. **DASH Eating Pattern**: Rich in potassium, magnesium, and calcium (leafy vegetables, fruits, seeds, nuts).
  3. **Aerobic Conditioning**: 150 minutes of moderate aerobic activity weekly lowers resting systolic pressure by 4–8 mmHg.
  4. **Stress Management**: Regular deep breathing exercises stimulate parasympathetic relaxation."""

    elif any(k in q_lower for k in ["platelet", "hemoglobin", "cbc", "rbc", "wbc", "anemia"]):
        ans = """### 🔬 Complete Blood Count (CBC) Parameters Guide

* **Hemoglobin (Hb)**: 
  - Typical normal: 13.5 – 17.5 g/dL (Males), 12.0 – 15.5 g/dL (Females).
  - Low values indicate anemia (fatigue, shortness of breath, pale skin). Iron-rich foods (spinach, lentils, dates, jaggery, beetroot) and Vitamin C aid absorption.
* **Platelets**:
  - Normal range: **150,000 – 450,000 cells/mcL**.
  - Essential for blood clotting. Transient drops may occur during viral infections (e.g. dengue, flu). Rest, hydration, and medical monitoring are key.
* **White Blood Cells (WBC)**:
  - Normal range: **4,000 – 11,000 /mcL**.
  - Elevation usually reflects an immune defense response against bacterial or viral infections or tissue inflammation.
* **Recommendation**: Correlate laboratory values with symptoms and review complete trends with your physician."""

    elif any(k in q_lower for k in ["kidney", "creatinine", "urea", "egfr", "uric acid"]):
        ans = """### 💧 Renal & Kidney Function Overview

* **Serum Creatinine**:
  - Typical adult baseline: **0.6 – 1.2 mg/dL**.
  - Creatinine is a natural byproduct of muscle metabolism filtered out by healthy kidneys. Elevated values may signify reduced filtration efficiency or severe dehydration.
* **Estimated GFR (eGFR)**:
  - Values **> 90 mL/min/1.73m²** represent healthy baseline kidney filtration.
* **Protective Habits**:
  1. Maintain consistent hydration (2–3 liters daily unless fluid-restricted by a doctor).
  2. Minimize unnecessary use of over-the-counter NSAID pain relievers (ibuprofen, naproxen).
  3. Keep blood sugar and blood pressure within target clinical boundaries.
* **Discussion with Doctor**: Ask whether repeat creatinine or a routine urine routine/microscopy test is advised."""

    else:
        ans = f"""### 💬 AarogyaAI Health Guidance

Thank you for your question regarding **{question}**.

* **General Clinical Context**:
  - Health parameters and symptoms are interconnected. Every individual's baseline varies by age, gender, medical history, and current medications.
  - When evaluating symptoms or diagnostic findings, doctors consider both the numeric values and how you feel physically.
* **Recommended Next Steps**:
  1. Note down when you first noticed these symptoms or questions.
  2. Keep a log of any changes in energy, appetite, sleep, or pain levels.
  3. Bring any recent prescriptions or lab reports to your clinical appointment for comparison.
* **Important Safety Notice**: If you experience severe chest pain, sudden numbness, difficulty breathing, or severe sudden pain, seek emergency medical care immediately."""

    return {
        "answer": ans,
        "source": "clinical_knowledge_base",
        "suggestions": _extract_or_generate_suggestions(question, ans, lang)
    }


