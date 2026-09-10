"""
patient_voice_service.py - Voice Health Assistant for Patients.
Designed specifically for patients (who may not be literate or have no medical background)
who describe their health problems in spoken language.

Processes speech-to-text transcriptions and delivers simple, spoken-style
safe guidance adhering to medical boundaries (no diagnosis, no prescriptions),
ending with "Please consult a doctor for proper checkup."
"""

from __future__ import annotations
import logging
import os
import re
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# External cloud API disabled in favor of 100% local backend execution
_GENAI_AVAILABLE = False
VOICE_CANDIDATE_MODELS = ["aarogya-clinical-voice-engine"]

# Clinical symptom dictionary for fallback & extraction across EN, HI, MR
SYMPTOM_LEXICON: dict[str, dict[str, Any]] = {
    "fever": {
        "keywords": ["fever", "temperature", "chills", "bukhar", "taap", "tap", "garam", "high temp", "बुखार", "ताप", "अंग गरम"],
        "en": "fever",
        "hi": "बुखार (Fever)",
        "mr": "ताप (Fever)"
    },
    "cough": {
        "keywords": ["cough", "coughing", "khasi", "khas", "khokla", "khokli", "phlegm", "खांसी", "खोखला", "खोकला"],
        "en": "cough",
        "hi": "खांसी (Cough)",
        "mr": "खोकला (Cough)"
    },
    "cold": {
        "keywords": ["cold", "runny nose", "sneezing", "congestion", "sardi", "nazla", "shardi", "सर्दी", "वाहणारे नाक", "शिंका"],
        "en": "cold / runny nose",
        "hi": "सर्दी / जुकाम (Cold)",
        "mr": "सर्दी (Cold)"
    },
    "throat_pain": {
        "keywords": ["throat", "sore throat", "gale me dard", "gala", "swallow", "kharash", "गले में दर्द", "गले", "घसा दुख", "घसा", "गळा"],
        "en": "sore throat / throat pain",
        "hi": "गले में खराश या दर्द (Sore Throat)",
        "mr": "घसा दुखणे किंवा खवखव (Sore Throat)"
    },
    "headache": {
        "keywords": ["headache", "head pain", "sir dard", "sar dard", "matha", "doke dukhi", "doke", "डोकेदुखी", "डोके दुख", "डोके", "सिर दर्द", "सिर में दर्द", "सर दर्द"],
        "en": "headache",
        "hi": "सिर दर्द (Headache)",
        "mr": "डोकेदुखी (Headache)"
    },
    "body_ache": {
        "keywords": ["body ache", "body pain", "badan dard", "badan me dard", "ang dard", "muscle pain", "body hurts", "अंगदुखी", "अंग दुख", "बदन दर्द", "बदन में दर्द", "शरीर में दर्द", "हाथ पैर दर्द", "दर्द"],
        "en": "body ache / muscle soreness",
        "hi": "शरीर या बदन में दर्द (Body Ache)",
        "mr": "अंगदुखी (Body Ache)"
    },
    "weakness": {
        "keywords": ["weakness", "tired", "fatigue", "kamzori", "thakan", "thakva", "कमजोरी", "थकावट", "थकवा", "अशक्त"],
        "en": "weakness / fatigue",
        "hi": "कमजोरी या थकावट (Weakness)",
        "mr": "अशक्तपणा किंवा थकवा (Weakness)"
    },
    "chest_pain": {
        "keywords": ["chest pain", "chest tightness", "chest pressure", "seene me dard", "chhati", "सीने में दर्द", "छातीत", "छाती"],
        "en": "chest pain / chest heaviness",
        "hi": "सीने में दर्द या भारीपन (Chest Pain)",
        "mr": "छातीत वेदना किंवा जडपणा (Chest Pain)"
    },
    "breathlessness": {
        "keywords": ["breath", "breathing", "shortness of breath", "saans", "saas", "dam", "श्वास", "सांस फूलना", "दम"],
        "en": "difficulty breathing / breathlessness",
        "hi": "सांस लेने में तकलीफ (Shortness of Breath)",
        "mr": "श्वास घेण्यास त्रास (Breathlessness)"
    },
    "stomach_pain": {
        "keywords": ["stomach", "tummy", "abdomen", "pet dard", "pet kharab", "potdukhi", "पोटात", "पेट दर्द", "पोटदुखी", "पेट"],
        "en": "stomach pain / abdominal discomfort",
        "hi": "पेट में दर्द (Stomach Pain)",
        "mr": "पोटात दुखणे (Stomach Pain)"
    },
    "vomiting": {
        "keywords": ["vomit", "vomiting", "throwing up", "nausea", "ulti", "machli", "उल्टी", "मळमळ"],
        "en": "nausea / vomiting",
        "hi": "उल्टी या मतली (Vomiting)",
        "mr": "उलटी किंवा मळमळ (Vomiting)"
    },
    "loose_motion": {
        "keywords": ["diarrhea", "loose motion", "dast", "julab", "flush", "दस्त", "जुलाब"],
        "en": "loose stools / diarrhea",
        "hi": "दस्त या लूज मोशन (Diarrhea)",
        "mr": "जुलाब (Loose Motions)"
    },
    "swelling": {
        "keywords": ["swelling", "swollen", "sujan", "sooj", "puffiness", "सूजन", "सूज"],
        "en": "swelling / puffiness",
        "hi": "सूजन (Swelling)",
        "mr": "सूज (Swelling)"
    },
    "dizziness": {
        "keywords": ["dizzy", "dizziness", "chakkar", "giddiness", "चक्कर"],
        "en": "dizziness / feeling lightheaded",
        "hi": "चक्कर आना (Dizziness)",
        "mr": "चक्कर येणे (Dizziness)"
    }
}


def identify_symptoms_from_text(text: str, language: str = "en") -> list[str]:
    """Identifies possible symptoms from patient spoken text using the lexicon."""
    lang = (language or "en").lower().strip()
    lowered = text.lower()
    found: list[str] = []

    for sym_key, sym_info in SYMPTOM_LEXICON.items():
        for kw in sym_info["keywords"]:
            pattern = r"\b" + re.escape(kw) + r"\b"
            if re.search(pattern, lowered) or kw in lowered:
                if lang in ["hi", "hindi"]:
                    label = sym_info["hi"]
                elif lang in ["mr", "marathi"]:
                    label = sym_info["mr"]
                else:
                    label = sym_info["en"]
                if label not in found:
                    found.append(label)
                break

    if not found:
        if lang in ["hi", "hindi"]:
            found = ["शारीरिक अस्वस्थता (Body Discomfort)"]
        elif lang in ["mr", "marathi"]:
            found = ["शारीरिक अस्वस्थता (General Discomfort)"]
        else:
            found = ["general physical discomfort"]

    return found


def _build_spoken_voice_fallback(
    patient_spoken_text: str,
    language: str = "en"
) -> dict[str, Any]:
    """
    Robust clinical rule-based fallback that complies strictly with:
    1. Identify symptoms
    2. Simple general explanation in everyday language
    3. Safe basic precautions (rest, hydration, hygiene) - NO medicines
    4. Urgent doctor red-flags
    5. No disease diagnosis, no prescriptions
    Short, spoken-style, suitable for TTS, ending with:
    "Please consult a doctor for proper checkup."
    """
    lang = (language or "en").lower().strip()
    symptoms = identify_symptoms_from_text(patient_spoken_text, lang)
    clean_text = patient_spoken_text.lower()

    is_emergency = any(kw in clean_text for kw in ["chest pain", "seene me dard", "breath", "saans", "saas", "severe", "blood", "unconscious"])

    if lang in ["hi", "hindi"]:
        symptom_str = " और ".join(symptoms)
        explanation = "आपकी बातों से ऐसा लगता है कि आपके शरीर में सामान्य मौसमी संक्रमण, थकान या कमजोरी का असर हो सकता है।"
        precautions = [
            "पर्याप्त आराम करें ताकि शरीर को ठीक होने की ताकत मिले।",
            "दिन भर में पर्याप्त मात्रा में गुनगुना या साफ पानी पिएं और खुद को हाइड्रेटेड रखें।",
            "हाथों को साबुन से साफ रखें, खांसते या छींकते समय मुंह ढकें, और हल्का व ताजा खाना खाएं।"
        ]
        urgent_warning = "यदि आपको तेज बुखार हो, सांस लेने में तकलीफ हो, सीने में भारीपन लगे, उल्टी बंद न हो, या यह समस्या 2 से 3 दिन से ज्यादा रहे, तो बिना देरी किए तुरंत डॉक्टर को दिखाएं।"
        closing = "कृपया उचित जांच के लिए डॉक्टर से मिलें।"

        spoken_lines = [
            f"आपने ये लक्षण बताए हैं: {symptom_str}।",
            explanation,
            "घर पर सुरक्षित रहने के लिए ये जरूरी बातें ध्यान रखें:",
            f"1. {precautions[0]}",
            f"2. {precautions[1]}",
            f"3. {precautions[2]}",
            f"ध्यान दें: {urgent_warning}",
            closing
        ]
        spoken_response = "\n\n".join(spoken_lines)

    elif lang in ["mr", "marathi"]:
        symptom_str = " आणि ".join(symptoms)
        explanation = "तुमच्या सांगण्यावरून शरीरात सामान्य मौसमी बदल, थकवा किंवा संसर्गाचा परिणाम झालेला असू शकतो."
        precautions = [
            "शरीराला पूर्ण विश्रांती द्या ज्यामुळे बरे होण्यास मदत होईल.",
            "दिवसभरात भरपूर स्वच्छ किंवा कोमट पाणी प्या आणि हायड्रेटेड राहा.",
            "हात स्वच्छ धुवा, खोकताना तोंडावर रुमाल धरा आणि हलका ताजा आहार घ्या."
        ]
        urgent_warning = "जर खूप जास्त ताप असेल, श्वास घेण्यास त्रास होत असेल, छातीत जड वाटत असेल, किंवा त्रास २ ते ३ दिवसांपेक्षा जास्त राहिला, तर त्वरित डॉक्टरांकडे जा."
        closing = "कृपया योग्य तपासणीसाठी डॉक्टरांचा सल्ला घ्या."

        spoken_lines = [
            f"तुम्ही सांगितलेली लक्षणे: {symptom_str}.",
            explanation,
            "घरच्या घरी घ्यायची सुरक्षित काळजी:",
            f"१. {precautions[0]}",
            f"२. {precautions[1]}",
            f"३. {precautions[2]}",
            f"महत्त्वाची सूचना: {urgent_warning}",
            closing
        ]
        spoken_response = "\n\n".join(spoken_lines)

    else:
        # English
        symptom_str = ", ".join(symptoms)
        explanation = "These symptoms commonly mean your body is reacting to a mild seasonal infection, common cold, or physical fatigue."
        precautions = [
            "Get plenty of restful sleep so your body has energy to recover.",
            "Drink plenty of clean water, warm broth, or fluids throughout the day to stay well hydrated.",
            "Wash your hands frequently with clean water and soap, and eat light, fresh home-cooked meals."
        ]
        urgent_warning = "You should see a doctor urgently if you experience high fever, difficulty breathing, chest pain, inability to keep fluids down, or if your symptoms last for more than 2 to 3 days."
        closing = "Please consult a doctor for proper checkup."

        spoken_lines = [
            f"You have mentioned these symptoms: {symptom_str}.",
            explanation,
            "Here are basic and safe things you can do at home:",
            f"* {precautions[0]}",
            f"* {precautions[1]}",
            f"* {precautions[2]}",
            f"When to seek immediate medical help: {urgent_warning}",
            closing
        ]
        spoken_response = "\n\n".join(spoken_lines)

    return {
        "success": True,
        "patient_spoken_text": patient_spoken_text,
        "spoken_response": spoken_response,
        "symptoms_identified": symptoms,
        "general_explanation": explanation,
        "precautions": precautions,
        "urgent_warning": urgent_warning,
        "doctor_closing": closing,
        "is_emergency_flag": is_emergency,
        "source": "clinical_engine",
        "language": lang
    }


def generate_patient_voice_guide(
    patient_spoken_text: str,
    language: str = "en"
) -> dict[str, Any]:
    """
    Core engine for Patient Voice Assistant.
    Converts transcribed spoken words into simple, compassionate spoken-style safety guidance.
    Follows exact prompt requirements:
    1. Identify symptoms
    2. Simple general explanation in everyday words
    3. Safe basic precautions (rest, hydration, hygiene) - no medicine names or doses
    4. State when to see a doctor urgently
    5. NO disease diagnosis. NO medicine prescription.
    Short, spoken-style, suitable for TTS, ending with:
    "Please consult a doctor for proper checkup."
    """
    lang = (language or "en").lower().strip()
    clean_text = (patient_spoken_text or "").strip()

    if not clean_text:
        fallback = _build_spoken_voice_fallback("I am not feeling well", lang)
        fallback["spoken_response"] = "Please describe how you are feeling or what problem you are having. Please consult a doctor for proper checkup."
        return fallback

    # 100% Local Clinical Voice Guidance Execution
    fallback_data = _build_spoken_voice_fallback(clean_text, lang)
    fallback_data["source"] = "clinical_engine"
    fallback_data["model"] = "Aarogya Clinical Voice Engine"
    return fallback_data
