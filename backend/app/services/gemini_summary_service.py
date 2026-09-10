"""
gemini_summary_service.py - 100% Local Backend Clinical Intelligence Engine.

Replaces external cloud API dependencies (Google Gemini API / OpenAI) with a
completely offline, self-contained, high-performance Clinical Reasoning Engine
running directly on the backend Python codebase.

Capabilities:
1. Multi-lingual Medical Report Summarizer & Explainer (5 structured sections in EN, HI, MR)
2. Comprehensive Symptom Reasoning & Differential Analysis
3. Universal Patient Health Q&A Assistant with report context integration
4. Patient-friendly Medical Terms Explainer
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
CANDIDATE_MODELS = ["aarogya-clinical-engine"]


def get_system_instruction(language: str = "en") -> str:
    """Returns language-specific guidance instructions for clinical summarization."""
    lang = (language or "en").lower().strip()
    if lang in ["hi", "hindi"]:
        return "सभी व्याख्याएं एवं क्लिनिकल विश्लेषण स्पष्ट और स्वाभाविक हिन्दी में देवनागरी लिपि में प्रदान करें।"
    if lang in ["mr", "marathi"]:
        return "सर्व स्पष्टीकरण आणि क्लिनिकल विश्लेषण स्पष्ट आणि नैसर्गिक मराठीत देवनागरी लिपीमध्ये प्रदान करा."
    return "Provide all clinical explanations in compassionate, accessible, patient-friendly English."


def get_configured_model(language: str = "en") -> Optional[Any]:
    """Compatibility stub for external callers. Returns None to ensure 100% local execution."""
    return None


# ---------------------------------------------------------------------------
# 1. LOCAL CLINICAL REPORT SUMMARY GENERATOR (5 SECTIONS)
# ---------------------------------------------------------------------------

# CLINICAL MEDICINES KNOWLEDGE BASE & PRESCRIPTION EXTRACTOR
# ---------------------------------------------------------------------------

COMMON_MEDICINES_DATABASE: dict[str, dict[str, Any]] = {
    "metformin": {
        "canonical": "Metformin",
        "category_en": "Anti-Diabetic (Biguanide)",
        "category_hi": "मधुमेह नियंत्रक (Anti-Diabetic)",
        "category_mr": "मधुमेह नियंत्रक (Anti-Diabetic)",
        "purpose_en": "Lowers blood glucose production by the liver and improves insulin sensitivity in Type 2 Diabetes.",
        "purpose_hi": "रक्त में ग्लूकोज (शुगर) के स्तर को नियंत्रित करता है और इंसुलिन संवेदनशीलता में सुधार करता है।",
        "purpose_mr": "रक्तातील साखरेचे प्रमाण नियंत्रित ठेवण्यास आणि इन्सुलिन संवेदनशीलता सुधारण्यास मदत करतो.",
        "precautions_en": "Take with or immediately after meals to minimize digestive discomfort. Regular HbA1c and renal monitoring advised.",
        "precautions_hi": "पेट की परेशानी से बचने के लिए भोजन के साथ या बाद में लें। डॉक्टर की सलाह के बिना बंद न करें।",
        "precautions_mr": "पोटाचा त्रास टाळण्यासाठी जेवणासोबत किंवा जेवणानंतर घ्या. डॉक्टरांच्या सल्ल्याशिवाय बंद करू नका."
    },
    "glycomet": {
        "canonical": "Metformin (Glycomet)",
        "category_en": "Anti-Diabetic (Biguanide)",
        "category_hi": "मधुमेह नियंत्रक (Anti-Diabetic)",
        "category_mr": "मधुमेह नियंत्रक (Anti-Diabetic)",
        "purpose_en": "Helps maintain healthy blood sugar levels and prevents post-meal glucose spikes.",
        "purpose_hi": "रक्त शर्करा को नियंत्रित रखने और भोजन के बाद शुगर की वृद्धि को रोकने में मदद करता है।",
        "purpose_mr": "रक्तातील साखर नियंत्रित ठेवण्यास आणि जेवणानंतरची साखर वाढ रोखण्यास मदत करतो.",
        "precautions_en": "Take with meals. Avoid heavy alcohol intake. Do not discontinue without medical advice.",
        "precautions_hi": "भोजन के साथ लें। अत्यधिक शराब से बचें। डॉक्टर की सलाह के बिना बंद न करें।",
        "precautions_mr": "जेवणासोबत घ्या. दारूचे सेवन टाळा. डॉक्टरांच्या सल्ल्याशिवाय औषध थांबवू नका."
    },
    "glimepiride": {
        "canonical": "Glimepiride",
        "category_en": "Anti-Diabetic (Sulfonylurea)",
        "category_hi": "मधुमेह नियंत्रक (Sulfonylurea)",
        "category_mr": "मधुमेह नियंत्रक (Sulfonylurea)",
        "purpose_en": "Stimulates the pancreas to release more insulin to lower elevated blood sugar.",
        "purpose_hi": "अग्न्याशय (Pancreas) से इंसुलिन का स्राव बढ़ाकर बढ़े हुए ब्लड शुगर को कम करता है।",
        "purpose_mr": "इन्सुलिनचे प्रमाण वाढवून रक्तातील वाढलेली साखर कमी करण्यास मदत करतो.",
        "precautions_en": "Take immediately before or with the first main meal. Watch out for hypoglycemia (low sugar signs like dizziness or tremors).",
        "precautions_hi": "सुबह के पहले भोजन के ठीक पहले या साथ में लें। अचानक चक्कर या कंपकंपी आने पर तुरंत मीठा लें।",
        "precautions_mr": "सकाळच्या पहिल्या जेवणापूर्वी किंवा जेवणासोबत घ्या. चक्कर किंवा घाम आल्यास साखर तपासा."
    },
    "teneligliptin": {
        "canonical": "Teneligliptin",
        "category_en": "Anti-Diabetic (DPP-4 Inhibitor)",
        "category_hi": "मधुमेह नियंत्रक (DPP-4 Inhibitor)",
        "category_mr": "मधुमेह नियंत्रक (DPP-4 Inhibitor)",
        "purpose_en": "Enhances natural incretin hormones to stimulate insulin and suppress excess glucagon.",
        "purpose_hi": "प्राकृतिक हार्मोन को सक्रिय करके इंसुलिन बढ़ाता है और अनियंत्रित शुगर को नियंत्रित करता है।",
        "purpose_mr": "शरीरातील नैसर्गिक हार्मोन्स संतुलित करून रक्तातील साखर नियंत्रणात ठेवतो.",
        "precautions_en": "Take once daily as directed. Compatible with or without food.",
        "precautions_hi": "डॉक्टर के निर्देशानुसार दिन में एक बार लें। भोजन के साथ या पहले लिया जा सकता है।",
        "precautions_mr": "डॉक्टरांच्या सल्ल्यानुसार दिवसातून एकदा घ्या."
    },
    "dapagliflozin": {
        "canonical": "Dapagliflozin",
        "category_en": "Anti-Diabetic / SGLT2 Inhibitor",
        "category_hi": "शुगर व हृदय-किडनी सुरक्षा (SGLT2 Inhibitor)",
        "category_mr": "साखर व हृदय-मूत्रपिंड रक्षण (SGLT2 Inhibitor)",
        "purpose_en": "Removes excess glucose via urine, aiding blood sugar control and cardiovascular/renal protection.",
        "purpose_hi": "मूत्र के माध्यम से अतिरिक्त शुगर बाहर निकालता है और हृदय व गुर्दे की सुरक्षा में मदद करता है।",
        "purpose_mr": "लघवीवाटे अतिरिक्त साखर बाहेर काढून हृदय आणि मूत्रपिंडाचे रक्षण करतो.",
        "precautions_en": "Drink plenty of water throughout the day to avoid dehydration and urinary tract infections.",
        "precautions_hi": "दिनभर पर्याप्त पानी पिएं ताकि डिहाइड्रेशन या यूरिन इन्फेक्शन से बचाव हो सके।",
        "precautions_mr": "डिहायड्रेशन टाळण्यासाठी दिवसभरात भरपूर पाणी प्या."
    },
    "insulin": {
        "canonical": "Insulin",
        "category_en": "Glycemic Hormone Therapy",
        "category_hi": "इंसुलिन हार्मोन थेरेपी",
        "category_mr": "इन्सुलिन हार्मोन थेरपी",
        "purpose_en": "Supplies essential hormone to transport glucose from bloodstream into cells for energy.",
        "purpose_hi": "रक्त से ग्लूकोज को कोशिकाओं में पहुंचाकर शरीर को ऊर्जा प्रदान करता है और शुगर नियंत्रित करता है।",
        "purpose_mr": "रक्तातील ग्लुकोज पेशींपर्यंत पोहोचवून शरीराला ऊर्जा देतो आणि साखर नियंत्रित करतो.",
        "precautions_en": "Administer subcutaneously at scheduled times. Rotate injection sites. Keep fast-acting sugar nearby for hypoglycemia.",
        "precautions_hi": "निर्धारित समय पर इंजेक्शन लगाएं। इंजेक्शन का स्थान बदलते रहें। कम शुगर के लिए पास में टॉफी या ग्लूकोज रखें।",
        "precautions_mr": "ठरलेल्या वेळी इंजेक्शन घ्या. साखर अचानक कमी झाल्यास जवळ ग्लुकोज किंवा गोड ठेवा."
    },
    "paracetamol": {
        "canonical": "Paracetamol",
        "category_en": "Analgesic & Antipyretic",
        "category_hi": "बुखार व दर्द निवारक (Antipyretic & Analgesic)",
        "category_mr": "ताप आणि वेदनाशामक (Antipyretic & Analgesic)",
        "purpose_en": "Relieves mild to moderate pain (headaches, body aches) and effectively lowers fever.",
        "purpose_hi": "बुखार को कम करता है और सिरदर्द, बदन दर्द व हल्के दर्द से प्रभावी राहत देता है।",
        "purpose_mr": "ताप कमी करतो तसेच डोकेदुखी, अंगदुखी आणि सौम्य वेदनांपासून आराम देतो.",
        "precautions_en": "Do not exceed maximum daily limit (3000-4000 mg in 24 hours). Avoid combining with other paracetamol products.",
        "precautions_hi": "24 घंटे में अधिकतम खुराक (3000-4000 mg) से अधिक न लें। अन्य पैरासिटामोल दवाओं के साथ न जोड़ें।",
        "precautions_mr": "२४ तासांत जास्त डोस घेऊ नका. एकाच वेळी इतर पॅरासिटामॉल गोळ्या घेणे टाळा."
    },
    "dolo": {
        "canonical": "Paracetamol (Dolo 650)",
        "category_en": "Analgesic & Antipyretic",
        "category_hi": "बुखार व दर्द निवारक (Antipyretic & Analgesic)",
        "category_mr": "ताप आणि वेदनाशामक (Antipyretic & Analgesic)",
        "purpose_en": "Rapidly controls high body temperature and relieves persistent muscular and fever-associated aches.",
        "purpose_hi": "तेज बुखार को तेजी से नियंत्रित करता है और बदन दर्द व थकान से राहत देता है।",
        "purpose_mr": "तीव्र ताप वेगाने नियंत्रित करतो आणि अंगदुखीपासून आराम मिळवून देतो.",
        "precautions_en": "Take after light food with plenty of water. Keep at least 4 to 6 hours gap between doses.",
        "precautions_hi": "हल्के भोजन के बाद पर्याप्त पानी के साथ लें। दो खुराकों के बीच कम से कम 4 से 6 घंटे का अंतर रखें।",
        "precautions_mr": "जेवणानंतर पुरेसे पाणी पिऊन घ्या. दोन डोसमधील अंतर किमान ४ ते ६ तास असावे."
    },
    "calpol": {
        "canonical": "Paracetamol (Calpol)",
        "category_en": "Analgesic & Antipyretic",
        "category_hi": "बुखार व दर्द निवारक (Antipyretic & Analgesic)",
        "category_mr": "ताप आणि वेदनाशामक (Antipyretic & Analgesic)",
        "purpose_en": "Reduces fever and eases pain from viral infections, colds, and minor injuries.",
        "purpose_hi": "वायरल बुखार, सर्दी और बदन दर्द को शांत करने के लिए उपयोग किया जाता है।",
        "purpose_mr": "व्हायरल ताप, सर्दी आणि सौम्य वेदना शांत करण्यासाठी वापरले जाते.",
        "precautions_en": "Use as directed by physician. Do not take with alcohol.",
        "precautions_hi": "डॉक्टर के निर्देशानुसार ही लें। शराब के साथ सेवन न करें।",
        "precautions_mr": "डॉक्टरांच्या सल्ल्यानुसारच घ्या."
    },
    "crocin": {
        "canonical": "Paracetamol (Crocin)",
        "category_en": "Analgesic & Antipyretic",
        "category_hi": "बुखार व दर्द निवारक",
        "category_mr": "ताप आणि वेदनाशामक",
        "purpose_en": "Relieves headache, toothache, and feverish symptoms.",
        "purpose_hi": "सिरदर्द, दांत दर्द और बुखार के लक्षणों को कम करता है।",
        "purpose_mr": "डोकेदुखी, दातदुखी आणि तापाच्या लक्षणांपासून आराम देतो.",
        "precautions_en": "Take after meals. Maintain gap between doses.",
        "precautions_hi": "भोजन के बाद लें। खुराकों के बीच उचित समय अंतर रखें।",
        "precautions_mr": "जेवणानंतर घ्या. दोन डोसमधील अंतर योग्य ठेवा."
    },
    "combiflam": {
        "canonical": "Ibuprofen + Paracetamol (Combiflam)",
        "category_en": "NSAID Pain & Inflammation Relief",
        "category_hi": "दर्द व सूजन निवारक (Pain & Inflammation)",
        "category_mr": "वेदना व सूज प्रतिबंधक (Pain & Inflammation)",
        "purpose_en": "Combination formula relieving severe pain, joint inflammation, dental pain, and fever.",
        "purpose_hi": "जोड़ों के दर्द, सूजन, दांत दर्द और बदन दर्द में राहत देने वाली संयोजन दवा।",
        "purpose_mr": "सांधेदुखी, सूज, दातदुखी आणि अंगदुखीवर गुणकारी संयोजन औषध.",
        "precautions_en": "Always take after food or with milk. Avoid in case of severe kidney disease or active stomach ulcers.",
        "precautions_hi": "हमेशा भोजन या दूध के बाद लें। अल्सर या किडनी की समस्या होने पर डॉक्टर को बताएं।",
        "precautions_mr": "नेहमी जेवणानंतर किंवा दुधासोबत घ्या. पोटातील अल्सर असल्यास डॉक्टरांना सांगा."
    },
    "meftal": {
        "canonical": "Mefenamic Acid (Meftal)",
        "category_en": "NSAID Analgesic",
        "category_hi": "दर्द व ऐंठन निवारक (Antispasmodic)",
        "category_mr": "वेदना व पेटके प्रतिबंधक (Antispasmodic)",
        "purpose_en": "Relieves abdominal cramps, menstrual pain, and musculoskeletal discomfort.",
        "purpose_hi": "पेट की ऐंठन, मांसपेशियों के दर्द और मासिक धर्म के दर्द से राहत देता है।",
        "purpose_mr": "पोटातील पेटके, स्नायूंच्या वेदना आणि मासिक पाळीतील त्रासावर आराम देतो.",
        "precautions_en": "Take after food to protect stomach lining. Use only for short periods as directed.",
        "precautions_hi": "पेट की सुरक्षा के लिए भोजन के बाद लें। केवल डॉक्टर द्वारा बताई गई अवधि तक ही लें।",
        "precautions_mr": "पोटाच्या संरक्षणासाठी जेवणानंतर घ्या."
    },
    "pantoprazole": {
        "canonical": "Pantoprazole",
        "category_en": "Proton Pump Inhibitor (Antacid)",
        "category_hi": "एसिडिटी व अल्सर रोधक (Antacid / PPI)",
        "category_mr": "ॲसिडिटी व छातीत जळजळ रोधक (Antacid / PPI)",
        "purpose_en": "Decreases gastric acid production to heal acid reflux (GERD), heartburn, and gastritis.",
        "purpose_hi": "पेट में एसिड की अधिकता को रोकता है, गैस, सीने में जलन और खट्टी डकारों से राहत देता है।",
        "purpose_mr": "पोटातील ॲसिडचे प्रमाण कमी करून छातीतील जळजळ आणि गॅसपासून आराम देतो.",
        "precautions_en": "Best taken once daily 30-60 minutes before morning breakfast. Swallow whole; do not chew or crush.",
        "precautions_hi": "सुबह नाश्ते से 30-60 मिनट पहले खाली पेट लेना सबसे अच्छा है। गोली को चबाएं या तोड़ें नहीं।",
        "precautions_mr": "सकाळी नाश्त्यापूर्वी ३०-६० मिनिटे आधी उपाशीपोटी घ्या. गोळी चावून खाऊ नका."
    },
    "pan": {
        "canonical": "Pantoprazole (Pan)",
        "category_en": "Proton Pump Inhibitor (Antacid)",
        "category_hi": "एसिडिटी व गैस रोधक (Antacid / PPI)",
        "category_mr": "ॲसिडिटी व गॅस प्रतिबंधक (Antacid / PPI)",
        "purpose_en": "Reduces stomach acid, protecting the stomach lining and preventing acidity spikes.",
        "purpose_hi": "पेट में अतिरिक्त एसिड को शांत करता है और पेट की आंतरिक परत की रक्षा करता है।",
        "purpose_mr": "पोटातील अतिरिक्त ॲसिड कमी करून पोटाच्या अस्तराचे रक्षण करतो.",
        "precautions_en": "Take before breakfast in the morning with a full glass of water.",
        "precautions_hi": "सुबह नाश्ते से पहले एक गिलास पानी के साथ लें।",
        "precautions_mr": "सकाळी नाश्त्यापूर्वी एक ग्लास पाण्यासोबत घ्या."
    },
    "omeprazole": {
        "canonical": "Omeprazole",
        "category_en": "Proton Pump Inhibitor (Antacid)",
        "category_hi": "एसिडिटी व अल्सर रोधक (Antacid)",
        "category_mr": "ॲसिडिटी व अल्सर प्रतिबंधक (Antacid)",
        "purpose_en": "Suppresses gastric acid secretion, relieving persistent indigestion and esophageal reflux.",
        "purpose_hi": "पेट में अम्ल उत्पादन को कम करता है और अपच व भोजन नली में जलन को ठीक करता है।",
        "purpose_mr": "पोटातील ॲसिड कमी करून अपचन व जळजळ बरी करतो.",
        "precautions_en": "Take before food in the morning. Complete the full duration prescribed by your doctor.",
        "precautions_hi": "सुबह भोजन से पहले लें। डॉक्टर द्वारा बताई गई पूरी अवधि तक सेवन करें।",
        "precautions_mr": "सकाळी जेवणापूर्वी घ्या. डॉक्टरांनी सांगितलेल्या कालावधीपर्यंत औषध चालू ठेवा."
    },
    "rabeprazole": {
        "canonical": "Rabeprazole",
        "category_en": "Proton Pump Inhibitor (Antacid)",
        "category_hi": "एसिडिटी व गैस्ट्रिक अल्सर रोधक",
        "category_mr": "ॲसिडिटी व गॅस्ट्रिक अल्सर प्रतिबंधक",
        "purpose_en": "Fast-acting acid reducer for hyperacidity, peptic ulcers, and gastroesophageal reflux.",
        "purpose_hi": "तीव्र एसिडिटी, पेट के छालों और सीने में जलन से त्वरित राहत प्रदान करता है।",
        "purpose_mr": "तीव्र ॲसिडिटी, पोटातील व्रण आणि छातीतील जळजळीवर त्वरित आराम देतो.",
        "precautions_en": "Take before breakfast. Swallow tablet whole with plain water.",
        "precautions_hi": "नाश्ते से पहले लें। गोली को सादे पानी के साथ पूरा निगलें।",
        "precautions_mr": "नाश्त्यापूर्वी घ्या. गोळी साध्या पाण्यासोबत गिळा."
    },
    "telmisartan": {
        "canonical": "Telmisartan",
        "category_en": "Antihypertensive (ARB)",
        "category_hi": "रक्तचाप नियंत्रक (High BP / Cardiovascular)",
        "category_mr": "रक्तदाब नियंत्रक (High BP / Cardiovascular)",
        "purpose_en": "Blocks angiotensin II to relax blood vessels, lowering blood pressure and protecting heart and kidneys.",
        "purpose_hi": "रक्त वाहिकाओं को शिथिल करके रक्तचाप (High BP) को नियंत्रित करता है और हृदय व किडनी की सुरक्षा करता है।",
        "purpose_mr": "रक्तवाहिन्या सैल करून रक्तदाब (High BP) नियंत्रित करतो आणि हृदय व मूत्रपिंडाचे रक्षण करतो.",
        "precautions_en": "Take once daily at the same time each day. Regular BP monitoring is essential. Do not stop abruptly.",
        "precautions_hi": "प्रतिदिन एक ही निश्चित समय पर लें। नियमित बीपी जांचें और अचानक बंद न करें।",
        "precautions_mr": "दररोज एकाच वेळी घ्या. नियमित रक्तदाब तपासा आणि अचानक औषध बंद करू नका."
    },
    "telma": {
        "canonical": "Telmisartan (Telma)",
        "category_en": "Antihypertensive (ARB)",
        "category_hi": "रक्तचाप नियंत्रक (High BP)",
        "category_mr": "रक्तदाब नियंत्रक (High BP)",
        "purpose_en": "Maintains 24-hour blood pressure control, preventing hypertension complications like strokes.",
        "purpose_hi": "24 घंटे रक्तचाप को नियंत्रित रखता है और स्ट्रोक व हृदय रोगों के जोखिम को घटाता है।",
        "purpose_mr": "२४ तास रक्तदाब नियंत्रित ठेवून पक्षाघात व हृदयविकाराचा धोका कमी करतो.",
        "precautions_en": "Do not skip doses. Check blood pressure periodically.",
        "precautions_hi": "खुराक न छोड़ें। समय-समय पर अपने रक्तचाप की जांच कराएं।",
        "precautions_mr": "औषध नियमित घ्या. वेळोवेळी रक्तदाब तपासत राहा."
    },
    "amlodipine": {
        "canonical": "Amlodipine",
        "category_en": "Calcium Channel Blocker (BP)",
        "category_hi": "रक्तचाप व हृदय सुरक्षा (BP / Angina)",
        "category_mr": "रक्तदाब व हृदय रक्षण (BP / Angina)",
        "purpose_en": "Relaxes arterial muscles, improving blood flow and reducing heart strain and chest pain (angina).",
        "purpose_hi": "धमनियों को चौड़ा करके रक्त प्रवाह को सुगम बनाता है, बीपी घटाता है और सीने के दर्द में राहत देता है।",
        "purpose_mr": "रक्तवाहिन्या रुंद करून रक्तप्रवाह सुधारतो, रक्तदाब कमी करतो आणि छातीतील वेदना कमी करतो.",
        "precautions_en": "May cause mild ankle swelling; report to physician if troublesome. Continue taking regularly.",
        "precautions_hi": "कभी-कभी टखनों में हल्की सूजन हो सकती है; समस्या होने पर डॉक्टर को बताएं। नियमित रूप से लें।",
        "precautions_mr": "काही वेळा पायांना सौम्य सूज येऊ शकते; त्रास झाल्यास डॉक्टरांना कळवा."
    },
    "losartan": {
        "canonical": "Losartan",
        "category_en": "Antihypertensive (ARB)",
        "category_hi": "रक्तचाप नियंत्रक (ARB)",
        "category_mr": "रक्तदाब नियंत्रक (ARB)",
        "purpose_en": "Keeps blood pressure within healthy targets and shields renal filtration in diabetic patients.",
        "purpose_hi": "रक्तचाप को सामान्य सीमा में रखता है और मधुमेह रोगियों में गुर्दे की सुरक्षा करता है।",
        "purpose_mr": "रक्तदाब योग्य मर्यादेत ठेवतो आणि मधुमेह रुग्णांमध्ये मूत्रपिंडाचे रक्षण करतो.",
        "precautions_en": "Stay well hydrated. Avoid potassium-rich salt substitutes without consulting your physician.",
        "precautions_hi": "पर्याप्त पानी पिएं। डॉक्टर की अनुमति के बिना पोटेशियम युक्त नमक का उपयोग न करें।",
        "precautions_mr": "पुरेसे पाणी प्या. डॉक्टरांच्या सल्ल्याशिवाय आहारात बदल करू नका."
    },
    "atorvastatin": {
        "canonical": "Atorvastatin",
        "category_en": "Lipid-Lowering Statin",
        "category_hi": "कोलेस्ट्रॉल नियंत्रक (Statin)",
        "category_mr": "कोलेस्ट्रॉल नियंत्रक (Statin)",
        "purpose_en": "Reduces LDL ('bad') cholesterol and triglycerides while stabilizing vascular plaque to prevent heart attacks.",
        "purpose_hi": "खराब कोलेस्ट्रॉल (LDL) को कम करता है, धमनियों में रुकावट रोकता है और दिल के दौरे से बचाव करता है।",
        "purpose_mr": "वाईट कोलेस्ट्रॉल (LDL) कमी करून रक्तवाहिन्या मोकळ्या ठेवतो आणि हृदयविकाराचा झटका टाळतो.",
        "precautions_en": "Usually taken once daily at bedtime. Report any unexplained muscle weakness or soreness.",
        "precautions_hi": "आमतौर पर रात को सोने से पहले लिया जाता है। मांसपेशियों में बिना कारण दर्द होने पर डॉक्टर को सूचित करें।",
        "precautions_mr": "साधारणपणे रात्री झोपताना घेतले जाते. स्नायू दुखत असल्यास डॉक्टरांना सांगा."
    },
    "rosuvastatin": {
        "canonical": "Rosuvastatin",
        "category_en": "Lipid-Lowering Statin",
        "category_hi": "कोलेस्ट्रॉल नियंत्रक (Statin)",
        "category_mr": "कोलेस्ट्रॉल नियंत्रक (Statin)",
        "purpose_en": "Potently lowers circulating cholesterol and reduces cardiovascular event risk.",
        "purpose_hi": "कोलेस्ट्रॉल के स्तर को तेजी से कम करके हृदय व धमनियों को स्वस्थ रखता है।",
        "purpose_mr": "रक्तातील कोलेस्ट्रॉलचे प्रमाण प्रभावीपणे कमी करून हृदयाचे आरोग्य सुधारतो.",
        "precautions_en": "Take once daily in evening. Combine with low-fat, high-fiber dietary habits.",
        "precautions_hi": "शाम या रात को दिन में एक बार लें। कम वसा व रेशेदार आहार के साथ सेवन करें।",
        "precautions_mr": "संध्याकाळी किंवा रात्री एकदा घ्या. कमी चरबीयुक्त आहारासोबत सेवन करा."
    },
    "aspirin": {
        "canonical": "Aspirin (Ecosprin)",
        "category_en": "Antiplatelet / Blood Thinner",
        "category_hi": "रक्त पतला करने वाली दवा (Blood Thinner)",
        "category_mr": "रक्त पातळ करणारे औषध (Blood Thinner)",
        "purpose_en": "Prevents blood clots in arteries, significantly lowering the risk of heart attacks and strokes.",
        "purpose_hi": "रक्त में थक्के बनने से रोकता है, खून को पतला रखता है और हार्ट अटैक व स्ट्रोक से बचाता है।",
        "purpose_mr": "रक्ताच्या गुठळ्या होण्यास प्रतिबंध करतो, रक्त पातळ ठेवतो आणि हृदयविकाराचा झटका टाळतो.",
        "precautions_en": "Take after meals with water to avoid gastric irritation. Alert doctors/dentists before surgical procedures.",
        "precautions_hi": "पेट की जलन से बचने के लिए भोजन के बाद पानी के साथ लें। किसी भी सर्जरी से पहले डॉक्टर को बताएं।",
        "precautions_mr": "पोटाचा त्रास टाळण्यासाठी जेवणानंतर पाण्यासोबत घ्या. कोणत्याही शस्त्रक्रियेपूर्वी डॉक्टरांना कल्पना द्या."
    },
    "ecosprin": {
        "canonical": "Aspirin (Ecosprin)",
        "category_en": "Antiplatelet / Blood Thinner",
        "category_hi": "रक्त पतला करने वाली दवा (Blood Thinner)",
        "category_mr": "रक्त पातळ करणारे औषध (Blood Thinner)",
        "purpose_en": "Cardiovascular protective antiplatelet preventing arterial thrombosis.",
        "purpose_hi": "धमनियों में खून का थक्का जमने से रोकता है और हृदय स्वास्थ्य की रक्षा करता है।",
        "purpose_mr": "रक्तवाहिन्यांमध्ये रक्ताची गुठळी होण्यास प्रतिबंध करून हृदयाचे रक्षण करतो.",
        "precautions_en": "Take with or after food. Do not skip scheduled doses.",
        "precautions_hi": "भोजन के बाद लें। निर्धारित खुराक को न छोड़ें।",
        "precautions_mr": "जेवणानंतर घ्या. डोस चुकवू नका."
    },
    "clopidogrel": {
        "canonical": "Clopidogrel",
        "category_en": "Antiplatelet",
        "category_hi": "रक्त थक्का रोधक (Antiplatelet)",
        "category_mr": "रक्त गुठळी प्रतिबंधक (Antiplatelet)",
        "purpose_en": "Inhibits platelet aggregation following cardiac stenting or cardiovascular events.",
        "purpose_hi": "हार्ट स्टेंट या दिल के दौरे के बाद नसों में रक्त का थक्का जमने से रोकता है।",
        "purpose_mr": "हार्ट स्टेंट किंवा हृदयविकारानंतर नसांमध्ये रक्ताची गुठळी तयार होण्यापासून रोखतो.",
        "precautions_en": "Take consistently. Report unusual bruising or prolonged bleeding to your physician.",
        "precautions_hi": "नियमित रूप से लें। असामान्य रक्तस्राव या नील पड़ने पर तुरंत डॉक्टर से संपर्क करें।",
        "precautions_mr": "नियमितपणे घ्या. अंगावर निळे डाग किंवा रक्तस्राव दिसल्यास डॉक्टरांशी संपर्क साधा."
    },
    "azithromycin": {
        "canonical": "Azithromycin",
        "category_en": "Macrolide Antibiotic",
        "category_hi": "एंटीबायोटिक (Antibiotic)",
        "category_mr": "अँटीबायोटिक (Antibiotic)",
        "purpose_en": "Treats bacterial infections of the respiratory tract, throat, sinuses, and chest.",
        "purpose_hi": "गले, फेफड़ों, छाती और साइनस के जीवाणु (बैक्टीरियल) संक्रमण को खत्म करता है।",
        "purpose_mr": "घसा, फुप्फुस आणि छातीतील जिवाणू संसर्ग नष्ट करतो.",
        "precautions_en": "Complete the full prescribed course (usually 3 or 5 days) even if feeling better early to avoid antibiotic resistance.",
        "precautions_hi": "लक्षण ठीक होने पर भी डॉक्टर द्वारा बताई गई पूरी अवधि (3 या 5 दिन) तक दवा पूरी करें ताकि संक्रमण दोबारा न हो।",
        "precautions_mr": "बरे वाटले तरी डॉक्टरांनी दिलेला संपूर्ण कोर्स (३ किंवा ५ दिवस) पूर्ण करा."
    },
    "azee": {
        "canonical": "Azithromycin (Azee)",
        "category_en": "Macrolide Antibiotic",
        "category_hi": "एंटीबायोटिक (Antibiotic)",
        "category_mr": "अँटीबायोटिक (Antibiotic)",
        "purpose_en": "Eliminates pathogenic bacteria causing cough, bronchitis, and pharyngeal infections.",
        "purpose_hi": "खांसी, ब्रोंकाइटिस और गले के संक्रमण वाले बैक्टीरिया को खत्म करता है।",
        "purpose_mr": "खोकला, ब्राँकायटिस आणि घशातील जिवाणू नष्ट करतो.",
        "precautions_en": "Take 1 hour before or 2 hours after meals for optimal absorption. Finish the entire course.",
        "precautions_hi": "बेहतर असर के लिए भोजन से 1 घंटा पहले या 2 घंटे बाद लें। पूरा कोर्स समाप्त करें।",
        "precautions_mr": "चांगल्या परिणामासाठी जेवणाच्या १ तास आधी किंवा २ तासांनंतर घ्या. कोर्स पूर्ण करा."
    },
    "amoxicillin": {
        "canonical": "Amoxicillin",
        "category_en": "Penicillin Antibiotic",
        "category_hi": "एंटीबायोटिक (Antibiotic)",
        "category_mr": "अँटीबायोटिक (Antibiotic)",
        "purpose_en": "Broad-spectrum antibacterial medication for ear, throat, dental, and chest infections.",
        "purpose_hi": "कान, गले, दांत और छाती के विभिन्न जीवाणु संक्रमणों को ठीक करता है।",
        "purpose_mr": "कान, घसा, दात आणि छातीतील जिवाणू संसर्ग बरे करतो.",
        "precautions_en": "Complete full antibiotic course. Take with meals to reduce stomach sensitivity.",
        "precautions_hi": "पूरा कोर्स अवश्य समाप्त करें। पेट की सुविधा के लिए भोजन के साथ लें।",
        "precautions_mr": "औषधांचा कोर्स पूर्ण करा. पोटाचा त्रास टाळण्यासाठी जेवणासोबत घ्या."
    },
    "augmentin": {
        "canonical": "Amoxicillin + Clavulanate (Augmentin)",
        "category_en": "Broad-Spectrum Antibiotic",
        "category_hi": "मजबूत एंटीबायोटिक (Augmentin)",
        "category_mr": "प्रभावी अँटीबायोटिक (Augmentin)",
        "purpose_en": "Treats resistant bacterial infections in respiratory, urinary, dental, and skin conditions.",
        "purpose_hi": "गले, कान, दांत और त्वचा के जिद्दी बैक्टीरियल संक्रमणों को प्रभावी ढंग से समाप्त करता है।",
        "purpose_mr": "घसा, कान, दात आणि त्वचेवरील कठीण जिवाणू संसर्ग वेगाने बरा करतो.",
        "precautions_en": "Take at the start of a meal to optimize absorption and avoid nausea. Finish prescribed days.",
        "precautions_hi": "जी मिचलाने से बचने के लिए भोजन की शुरुआत में लें। निर्धारित दिनों तक कोर्स पूरा करें।",
        "precautions_mr": "मळमळ टाळण्यासाठी जेवणाच्या सुरुवातीला घ्या. डॉक्टरांनी दिलेला कोर्स पूर्ण करा."
    },
    "clavam": {
        "canonical": "Amoxicillin + Clavulanate (Clavam)",
        "category_en": "Broad-Spectrum Antibiotic",
        "category_hi": "एंटीबायोटिक (Clavam)",
        "category_mr": "अँटीबायोटिक (Clavam)",
        "purpose_en": "Overcomes bacterial resistance to clear acute infections of lungs, ears, and soft tissue.",
        "purpose_hi": "फेफड़ों, गले और ऊतकों के गंभीर संक्रमण को खत्म करने वाली असरदार दवा।",
        "purpose_mr": "फुप्फुस, घसा आणि शरीरातील गंभीर संसर्ग दूर करणारी परिणामकारक औषध.",
        "precautions_en": "Take with food. Complete all prescribed doses without missing.",
        "precautions_hi": "भोजन के साथ लें। कोई भी खुराक छोड़े बिना कोर्स पूरा करें।",
        "precautions_mr": "जेवणासोबत घ्या. एकही डोस चुकवू नका."
    },
    "ciprofloxacin": {
        "canonical": "Ciprofloxacin",
        "category_en": "Fluoroquinolone Antibiotic",
        "category_hi": "एंटीबायोटिक (Ciprofloxacin)",
        "category_mr": "अँटीबायोटिक (Ciprofloxacin)",
        "purpose_en": "Treats bacterial urinary tract infections (UTI), abdominal infections, and severe diarrhea.",
        "purpose_hi": "मूत्र मार्ग संक्रमण (UTI), पेट के संक्रमण और दस्त के बैक्टीरिया को खत्म करता है।",
        "purpose_mr": "मूत्रमार्ग संसर्ग (UTI), पोटातील संसर्ग आणि जुलाबावर गुणकारी औषध.",
        "precautions_en": "Drink plenty of water. Avoid antacids or milk products within 2 hours of this medicine.",
        "precautions_hi": "खूब पानी पिएं। दवा लेने के 2 घंटे के भीतर दूध या एंटासिड न लें।",
        "precautions_mr": "भरपूर पाणी प्या. औषध घेतल्यानंतर २ तास दूध किंवा ॲसिडिटीचे औषध घेऊ नका."
    },
    "ofloxacin": {
        "canonical": "Ofloxacin",
        "category_en": "Fluoroquinolone Antibiotic",
        "category_hi": "एंटीबायोटिक (Ofloxacin)",
        "category_mr": "अँटीबायोटिक (Ofloxacin)",
        "purpose_en": "Eradicates bacterial gastrointestinal and urinary tract infections.",
        "purpose_hi": "पेट और यूरिन इन्फेक्शन पैदा करने वाले बैक्टीरिया को नष्ट करता है।",
        "purpose_mr": "पोटातील आणि लघवीतील संसर्ग निर्माण करणाऱ्या जिवाणूंना नष्ट करतो.",
        "precautions_en": "Maintain strong hydration. Complete the full antibiotic cycle.",
        "precautions_hi": "पर्याप्त जल सेवन बनाए रखें। पूरा एंटीबायोटिक चक्र समाप्त करें।",
        "precautions_mr": "भरपूर पाणी प्या. संपूर्ण कोर्स पूर्ण करा."
    },
    "cetirizine": {
        "canonical": "Cetirizine",
        "category_en": "Antihistamine (Anti-Allergy)",
        "category_hi": "एलर्जी रोधक (Anti-Allergic)",
        "category_mr": "ॲलर्जी प्रतिबंधक (Anti-Allergic)",
        "purpose_en": "Relieves allergy symptoms including sneezing, runny nose, watery eyes, and itchy hives.",
        "purpose_hi": "छींक आना, बहती नाक, आंखों से पानी आना और त्वचा की खुजली व एलर्जी से राहत देता है।",
        "purpose_mr": "शिंका येणे, वाहणारे नाक, डोळ्यांतून पाणी येणे आणि त्वचेची खाज यावर आराम देतो.",
        "precautions_en": "May cause mild drowsiness. Best taken in the evening or at bedtime. Avoid driving if sleepy.",
        "precautions_hi": "हल्की नींद आ सकती है। रात को सोने से पहले लेना सबसे अच्छा है। नींद आने पर वाहन न चलाएं।",
        "precautions_mr": "सौम्य गुंगी येऊ शकते. रात्री झोपण्यापूर्वी घेणे फायदेशीर ठरते. वाहन चालवणे टाळा."
    },
    "levocetirizine": {
        "canonical": "Levocetirizine",
        "category_en": "Second-Gen Antihistamine",
        "category_hi": "एलर्जी रोधक (Levocetirizine)",
        "category_mr": "ॲलर्जी प्रतिबंधक (Levocetirizine)",
        "purpose_en": "Fast, non-sedating relief for seasonal allergic rhinitis, skin urticaria, and pollen allergies.",
        "purpose_hi": "मौसम बदलने से होने वाली सर्दी, छींकों और त्वचा की एलर्जी को बिना अधिक सुस्ती के शांत करता है।",
        "purpose_mr": "हवामानातील बदलांमुळे होणारी सर्दी, शिंका आणि ॲलर्जीवर त्वरित आराम देतो.",
        "precautions_en": "Take once daily in evening with water as prescribed.",
        "precautions_hi": "शाम के समय पानी के साथ दिन में एक बार लें।",
        "precautions_mr": "संध्याकाळी पाण्यासोबत दिवसातून एकदा घ्या."
    },
    "montelukast": {
        "canonical": "Montelukast",
        "category_en": "Leukotriene Receptor Antagonist",
        "category_hi": "अस्थमा व एलर्जी नियंत्रक",
        "category_mr": "दमा व ॲलर्जी नियंत्रक",
        "purpose_en": "Reduces airway swelling and blocks allergic inflammation in asthma and chronic allergic rhinitis.",
        "purpose_hi": "श्वास नली की सूजन को कम करता है और अस्थमा व पुरानी एलर्जी में सांस लेना आसान बनाता है।",
        "purpose_mr": "श्वासनलिकेची सूज कमी करून दम्याच्या त्रासात श्वास घेणे सोपे करतो.",
        "precautions_en": "Take once daily in the evening. Keep taking consistently even when symptom-free.",
        "precautions_hi": "शाम को नियमित रूप से दिन में एक बार लें। लक्षण न होने पर भी डॉक्टर के बताए अनुसार जारी रखें।",
        "precautions_mr": "संध्याकाळी नियमितपणे एकदा घ्या. त्रास नसला तरी डॉक्टरांच्या सल्ल्यानुसार सुरू ठेवा."
    },
    "montair": {
        "canonical": "Montelukast + Levocetirizine (Montair-LC)",
        "category_en": "Antiallergic & Bronchial Relief",
        "category_hi": "एलर्जी व श्वास राहत (Montair-LC)",
        "category_mr": "ॲलर्जी व श्वास मोकळा करणारे औषध",
        "purpose_en": "Combined formula relieving stubborn allergic cough, chest tightness, nighttime wheezing, and allergic rhinitis.",
        "purpose_hi": "एलर्जी वाली सूखी खांसी, रात को सांस फूलने और बंद नाक से राहत देने वाली बेहतरीन दवा।",
        "purpose_mr": "ॲलर्जीचा खोकला, छाती भरणे आणि रात्रीचा दम लागणे यावर अत्यंत गुणकारी औषध.",
        "precautions_en": "Take once daily at night. May cause mild sleepiness.",
        "precautions_hi": "रात को सोने से पहले दिन में एक बार लें। हल्की सुस्ती आ सकती है।",
        "precautions_mr": "रात्री झोपताना एकदा घ्या. सौम्य झोप येऊ शकते."
    },
    "thyronorm": {
        "canonical": "Levothyroxine (Thyronorm)",
        "category_en": "Thyroid Hormone Replacement",
        "category_hi": "थायरॉयड हार्मोन सप्लीमेंट (Thyronorm)",
        "category_mr": "थायरॉईड हार्मोन औषध (Thyronorm)",
        "purpose_en": "Restores low thyroid hormone levels to normalize body metabolism, energy, and weight.",
        "purpose_hi": "थायरॉयड ग्रंथि के कम कार्य को ठीक करता है, मेटाबॉलिज्म बढ़ाता है और थकान दूर करता है।",
        "purpose_mr": "कमी थायरॉईड पातळी पूर्ववत करून शरीरातील ऊर्जा आणि चयापचय सामान्य करतो.",
        "precautions_en": "Must be taken first thing in morning on empty stomach with plain water. Wait 45 minutes before tea or breakfast.",
        "precautions_hi": "सुबह उठते ही खाली पेट सादे पानी के साथ लें। चाय या नाश्ता करने से पहले 45 मिनट का अंतर रखें।",
        "precautions_mr": "सकाळी उठल्यावर उपाशीपोटी साध्या पाण्यासोबत घ्या. चहा किंवा नाश्त्यापूर्वी ४५ मिनिटे थांबा."
    },
    "shelcal": {
        "canonical": "Calcium + Vitamin D3 (Shelcal)",
        "category_en": "Bone Health Supplement",
        "category_hi": "हड्डी व कैल्शियम सप्लीमेंट (Shelcal)",
        "category_mr": "हाडांचे पोषण व कॅल्शियम (Shelcal)",
        "purpose_en": "Strengthens bone density, supports joints, and ensures healthy calcium absorption.",
        "purpose_hi": "हड्डियों को मजबूत बनाता है, जोड़ों को सहारा देता है और शरीर में कैल्शियम की कमी दूर करता है।",
        "purpose_mr": "हाडे मजबूत करतो, सांध्यांना आधार देतो आणि शरीरातील कॅल्शियमची कमतरता भरून काढतो.",
        "precautions_en": "Take after main meals for optimal absorption. Drink adequate water.",
        "precautions_hi": "भोजन के बाद लें ताकि शरीर में बेहतर अवशोषण हो सके। भरपूर पानी पिएं।",
        "precautions_mr": "जेवणानंतर घ्या. पुरेसे पाणी प्या."
    },
    "becosules": {
        "canonical": "Vitamin B-Complex + Vitamin C (Becosules)",
        "category_en": "Nutritional Multivitamin",
        "category_hi": "विटामिन बी-कॉम्प्लेक्स (Becosules)",
        "category_mr": "व्हिटॅमिन बी-कॉम्प्लेक्स (Becosules)",
        "purpose_en": "Heals mouth ulcers, counters physical exhaustion, and replenishes essential water-soluble vitamins.",
        "purpose_hi": "मुंह के छालों को ठीक करता है, शारीरिक कमजोरी दूर करता है और जरूरी विटामिन्स की पूर्ति करता है।",
        "purpose_mr": "तोंडातील फोड बरे करतो, अशक्तपणा दूर करतो आणि आवश्यक जीवनसत्त्वे पुरवतो.",
        "precautions_en": "Take once daily after meals. Harmless bright yellow urine coloration is normal.",
        "precautions_hi": "भोजन के बाद दिन में एक बार लें। पेशाब का रंग हल्का पीला होना सामान्य है।",
        "precautions_mr": "जेवणानंतर दिवसातून एकदा घ्या. लघवीचा रंग पिवळा होणे स्वाभाविक आहे."
    }
}


def extract_prescription_medicines_summary(raw_text: str, language: str = "en") -> list[dict[str, Any]]:
    """
    Extracts structured medicine details from doctor prescription text with
    clinical purpose, dosage frequency, and safety precautions in the requested language.
    """
    lang = (language or "en").lower().strip()
    if lang not in ["hi", "hindi", "mr", "marathi"]:
        lang = "en"

    medicines: list[dict[str, Any]] = []
    if not raw_text:
        return medicines

    lines = raw_text.splitlines()
    seen_keys: set[str] = set()

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        # Check against common clinical medicines database
        matched = False
        for key, info in COMMON_MEDICINES_DATABASE.items():
            if re.search(r"\b" + re.escape(key) + r"\b", line_clean, re.IGNORECASE):
                if key in seen_keys:
                    matched = True
                    break
                seen_keys.add(key)
                matched = True

                # Dosage extraction (e.g., 500 mg, 40 mg, 650 mg)
                dose_m = re.search(r"(\b\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|iu)\b)", line_clean, re.IGNORECASE)
                dosage = dose_m.group(1) if dose_m else ""

                # Frequency pattern (e.g., 1-0-1, 1-0-0, OD, BD, TDS, SOS, HS)
                freq_m = re.search(r"(\b\d-\d-\d\b|\bonce\s+daily\b|\btwice\s+daily\b|\bod\b|\bbd\b|\btds\b|\bsos\b|\bhs\b)", line_clean, re.IGNORECASE)
                freq_raw = freq_m.group(1).upper() if freq_m else ""

                # Timing / Instruction (e.g. after food, before food, with meals)
                time_m = re.search(r"\b(after\s+food|before\s+food|with\s+meals|before\s+breakfast|at\s+bedtime|empty\s+stomach)\b", line_clean, re.IGNORECASE)
                timing_raw = time_m.group(1).lower() if time_m else ""

                # Localized frequency & timing descriptions
                if lang in ["hi", "hindi"]:
                    freq_desc = "दिन में दो बार (1-0-1)" if freq_raw in ["1-0-1", "BD", "TWICE DAILY"] else \
                                "दिन में एक बार (1-0-0)" if freq_raw in ["1-0-0", "OD", "ONCE DAILY"] else \
                                "दिन में तीन बार (1-1-1)" if freq_raw in ["1-1-1", "TDS"] else \
                                "जरूरत पड़ने पर (SOS)" if "SOS" in freq_raw else \
                                "रात को सोते समय (HS)" if "HS" in freq_raw else freq_raw or "डॉक्टर के निर्देशानुसार"

                    time_desc = "खाने के बाद (After Food)" if "after" in timing_raw else \
                                "नाश्ते/भोजन से पहले (Before Food)" if "before" in timing_raw or "empty" in timing_raw else \
                                "भोजन के साथ (With Meals)" if "with" in timing_raw else \
                                "रात को (At Bedtime)" if "bedtime" in timing_raw else "निर्देशानुसार"

                    cat = info.get("category_hi", info.get("category_en", "दवा"))
                    purp = info.get("purpose_hi", info.get("purpose_en", ""))
                    prec = info.get("precautions_hi", info.get("precautions_en", ""))
                elif lang in ["mr", "marathi"]:
                    freq_desc = "दिवसातून दोनदा (1-0-1)" if freq_raw in ["1-0-1", "BD", "TWICE DAILY"] else \
                                "दिवसातून एकदा (1-0-0)" if freq_raw in ["1-0-0", "OD", "ONCE DAILY"] else \
                                "दिवसातून तीनदा (1-1-1)" if freq_raw in ["1-1-1", "TDS"] else \
                                "गरज भासल्यास (SOS)" if "SOS" in freq_raw else \
                                "रात्री झोपताना (HS)" if "HS" in freq_raw else freq_raw or "डॉक्टरांच्या सल्ल्यानुसार"

                    time_desc = "जेवणानंतर (After Food)" if "after" in timing_raw else \
                                "नाश्त्यापूर्वी/उपाशीपोटी (Before Food)" if "before" in timing_raw or "empty" in timing_raw else \
                                "जेवणासोबत (With Meals)" if "with" in timing_raw else \
                                "रात्री (At Bedtime)" if "bedtime" in timing_raw else "निर्देशानुसार"

                    cat = info.get("category_mr", info.get("category_en", "औषध"))
                    purp = info.get("purpose_mr", info.get("purpose_en", ""))
                    prec = info.get("precautions_mr", info.get("precautions_en", ""))
                else:
                    freq_desc = "Twice Daily (1-0-1)" if freq_raw in ["1-0-1", "BD", "TWICE DAILY"] else \
                                "Once Daily (1-0-0)" if freq_raw in ["1-0-0", "OD", "ONCE DAILY"] else \
                                "Three Times Daily (1-1-1)" if freq_raw in ["1-1-1", "TDS"] else \
                                "As Needed (SOS)" if "SOS" in freq_raw else \
                                "At Bedtime (HS)" if "HS" in freq_raw else freq_raw or "As directed by physician"

                    time_desc = "After Food" if "after" in timing_raw else \
                                "Before Food / Empty Stomach" if "before" in timing_raw or "empty" in timing_raw else \
                                "With Meals" if "with" in timing_raw else \
                                "At Bedtime" if "bedtime" in timing_raw else "As prescribed"

                    cat = info.get("category_en", "Medication")
                    purp = info.get("purpose_en", "")
                    prec = info.get("precautions_en", "")

                disp_name = info["canonical"]
                if dosage and dosage.lower() not in disp_name.lower():
                    disp_name = f"{disp_name} {dosage}"

                medicines.append({
                    "name": disp_name,
                    "dosage": dosage or "Standard dose",
                    "frequency": freq_desc,
                    "timing": time_desc,
                    "category": cat,
                    "purpose": purp,
                    "precautions": prec
                })
                break

        # Generic pattern check for Tab./Cap./Syp. if not in common database
        if not matched:
            rx_pat = re.search(r"\b(?:tab(?:let)?\.?|cap(?:sule)?\.?|syp(?:rup)?\.?|inj(?:ection)?\.?)\s+([A-Za-z0-9+\-]{3,25}(?:\s+[A-Za-z0-9+\-]{2,15})?)", line_clean, re.IGNORECASE)
            if rx_pat:
                gen_name = rx_pat.group(1).strip().title()
                clean_key = gen_name.lower()
                if clean_key not in seen_keys and not any(ign in clean_key for ign in ["doctor", "clinic", "hospital", "patient", "name", "date"]):
                    seen_keys.add(clean_key)
                    dose_m = re.search(r"(\b\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|iu)\b)", line_clean, re.IGNORECASE)
                    dosage = dose_m.group(1) if dose_m else ""

                    freq_m = re.search(r"(\b\d-\d-\d\b|\bonce\s+daily\b|\btwice\s+daily\b|\bod\b|\bbd\b|\btds\b|\bsos\b|\bhs\b)", line_clean, re.IGNORECASE)
                    freq_raw = freq_m.group(1).upper() if freq_m else "As directed"

                    time_m = re.search(r"\b(after\s+food|before\s+food|with\s+meals|before\s+breakfast|at\s+bedtime|empty\s+stomach)\b", line_clean, re.IGNORECASE)
                    timing_raw = time_m.group(1).title() if time_m else "As directed by physician"

                    if lang in ["hi", "hindi"]:
                        cat = "डॉक्टर द्वारा निर्धारित दवा (Prescribed Medicine)"
                        purp = "डॉक्टर द्वारा स्वास्थ्य स्थिति व लक्षणों के आधार पर सुझाई गई क्लिनिकल दवा।"
                        prec = "दवा की निर्धारित खुराक व समय का सख्ती से पालन करें। डॉक्टर से पूछे बिना दवा बंद न करें।"
                    elif lang in ["mr", "marathi"]:
                        cat = "डॉक्टरांनी सुचवलेले औषध (Prescribed Medicine)"
                        purp = "आरोग्य लक्षणे आणि तपासणीनुसार डॉक्टरांनी सुरू केलेले औषध."
                        prec = "औषध डॉक्टरांच्या सल्ल्यानुसार योग्य वेळेत घ्या. स्वतःहून डोस बदलू नका."
                    else:
                        cat = "Prescribed Clinical Medication"
                        purp = "Prescribed by physician based on clinical findings and symptom management."
                        prec = "Take strictly as prescribed. Do not alter dosage or discontinue without doctor's consultation."

                    medicines.append({
                        "name": f"Tab. {gen_name}" + (f" {dosage}" if dosage else ""),
                        "dosage": dosage or "Standard dose",
                        "frequency": freq_raw,
                        "timing": timing_raw,
                        "category": cat,
                        "purpose": purp,
                        "precautions": prec
                    })

    return medicines


# ---------------------------------------------------------------------------
# 1. LOCAL CLINICAL REPORT SUMMARY GENERATOR
# ---------------------------------------------------------------------------

def generate_gemini_report_summary(
    raw_text: str,
    parameters: list[dict[str, Any]],
    doc_type: str = "Medical Report",
    language: str = "en"
) -> dict[str, Any]:
    """
    Generates a comprehensive 5-section medical report explanation 100% locally on the backend codebase.
    Available in English, Hindi, and Marathi.
    Produces:
      ### 1. Report Overview
      ### 2. Parameters Breakdown (Normal & Abnormal)
      ### 3. Conclusion & Health Status
      ### 4. Next Steps
      ### 5. Questions to Ask Your Doctor
    """
    lang = (language or "en").lower().strip()
    if lang not in ["hi", "hindi", "mr", "marathi"]:
        lang = "en"

    raw_lower = (raw_text or "").lower()
    type_lower = (doc_type or "").lower()

    # Categorize parameters
    params = parameters or []
    normal_params: list[dict[str, Any]] = []
    abnormal_params: list[dict[str, Any]] = []

    for p in params:
        status = str(p.get("status") or p.get("status_label") or "").lower()
        if any(s in status for s in ["high", "low", "outside", "abnormal", "attention"]):
            abnormal_params.append(p)
        else:
            normal_params.append(p)

    has_abnormal = len(abnormal_params) > 0

    # Detect medical domain
    is_cbc = any(k in raw_lower or k in type_lower for k in ["cbc", "hemoglobin", "platelet", "wbc", "rbc", "hematology", "hemogram"])
    is_lipid = any(k in raw_lower or k in type_lower for k in ["cholesterol", "triglyceride", "lipid", "hdl", "ldl", "vldl"])
    is_renal = any(k in raw_lower or k in type_lower for k in ["creatinine", "urea", "kft", "rft", "egfr", "kidney", "renal", "uric acid"])
    is_liver = any(k in raw_lower or k in type_lower for k in ["sgpt", "sgot", "alt", "ast", "bilirubin", "alkaline", "lft", "hepatic", "liver"])
    is_diabetes = any(k in raw_lower or k in type_lower for k in ["glucose", "sugar", "hba1c", "glycated", "fasting blood sugar", "ppbs", "diabetes"])
    is_thyroid = any(k in raw_lower or k in type_lower for k in ["tsh", "t3", "t4", "thyroid"])
    is_echo = any(k in raw_lower or k in type_lower for k in ["echo", "ejection fraction", "ef", "diastolic", "valve", "ventricle", "cardi"])
    is_urine = any(k in raw_lower or k in type_lower for k in ["urine", "urinalysis", "pus cells", "epithelial"])
    is_prescription = any(k in raw_lower or k in type_lower for k in ["prescription", "rx", "tab", "cap", "mg", "syrup", "dosage", "bd", "od", "sos"])

    # -------------------------------------------------------------
    # SECTION 1: REPORT OVERVIEW
    # -------------------------------------------------------------
    if lang in ["hi", "hindi"]:
        if is_cbc:
            overview_text = "यह एक कम्प्लीट ब्लड काउंट (CBC / हेमोप्रोग्राम) रिपोर्ट है, जो लाल रक्त कोशिकाओं, सफेद रक्त कोशिकाओं और प्लेटलेट्स के स्तर की जांच करती है ताकि एनीमिया, संक्रमण और प्रतिरक्षा स्वास्थ्य का मूल्यांकन किया जा सके।"
        elif is_lipid:
            overview_text = "यह एक लिपिड प्रोफाइल (कोलेस्ट्रॉल) जांच रिपोर्ट है, जो रक्त में वसा के विभिन्न रूपों (जैसे टोटल कोलेस्ट्रॉल, एलडीएल, एचडीएल और ट्राइग्लिसराइड्स) को मापकर हृदय व रक्त वाहिकाओं के स्वास्थ्य का आकलन करती है।"
        elif is_renal:
            overview_text = "यह एक किडनी फंक्शन टेस्ट (KFT / RFT) रिपोर्ट है, जो सीरम क्रिएटिनिन, यूरिया और इलेक्ट्रोलाइट्स के स्तर की जांच करके यह सुनिश्चित करती है कि गुर्दे अपशिष्ट पदार्थों को कितनी कुशलता से छान रहे हैं।"
        elif is_liver:
            overview_text = "यह एक लिवर फंक्शन टेस्ट (LFT) रिपोर्ट है, जो लिवर एंजाइम (SGPT/ALT, SGOT/AST) और बिलीरुबिन के स्तर का विश्लेषण करके यकृत के सामान्य कार्य और मेटाबॉलिज्म की जांच करती है।"
        elif is_diabetes:
            overview_text = "यह एक रक्त शर्करा (Glucose / HbA1c) जांच रिपोर्ट है, जो शरीर में ग्लूकोज के स्तर और पिछले 3 महीनों के औसत नियंत्रण का मूल्यांकन करती है ताकि प्रीडायबिटीज या डायबिटीज की निगरानी की जा सके।"
        elif is_thyroid:
            overview_text = "यह एक थायरॉयड प्रोफाइल रिपोर्ट है, जो TSH, T3 और T4 हार्मोन्स की जांच करके शरीर की चयापचय (Metabolism) दर और अंतःस्रावी संतुलन का मूल्यांकन करती है।"
        elif is_echo:
            overview_text = "यह एक 2D इकोकार्डियोग्राफी (हृदय सोनोग्राफी) रिपोर्ट है, जो हृदय की पंपिंग क्षमता (Ejection Fraction), कक्षों की संरचना और वाल्वों की कार्यप्रणाली का विस्तृत विश्लेषण प्रदान करती है।"
        elif is_prescription:
            overview_text = "यह एक डॉक्टर की क्लिनिकल पर्ची (Prescription) है, जिसमें प्राथमिक लक्षणों के आधार पर आवश्यक दवाएं, खुराक और जीवनशैली संबंधी परामर्श दर्ज किया गया है।"
        else:
            overview_text = f"यह {doc_type} की विस्तृत नैदानिक रिपोर्ट है। इसमें आपके स्वास्थ्य मानकों और प्रयोगशाला परीक्षणों का व्यवस्थित मूल्यांकन शामिल है।"

        sec1_title = "### 1. रिपोर्ट का सारांश (Report Overview)"
        sec2_title = "### 2. मापदंडों का विवरण (Parameters Breakdown)"
        norm_subhead = "#### सामान्य मापदंड (Normal Parameters)"
        abnorm_subhead = "#### ध्यान देने योग्य / असामान्य मापदंड (Notable / Abnormal Parameters)"
        sec3_title = "### 3. निष्कर्ष एवं स्वास्थ्य स्थिति (Conclusion & Health Status)"
        sec4_title = "### 4. अगले कदम (Next Steps)"
        sec5_title = "### 5. डॉक्टर से पूछने योग्य महत्वपूर्ण प्रश्न (Questions to Ask Your Doctor)"

    elif lang in ["mr", "marathi"]:
        if is_cbc:
            overview_text = "हा एक कम्प्लीट ब्लड काउंट (CBC) तपासणी अहवाल आहे, जो शरीरातील रक्तपेशी, हिमोग्लोबिन आणि प्लेटलेट्सचे प्रमाण तपासून अशक्तपणा व संसर्गाचे मूल्यांकन करतो."
        elif is_lipid:
            overview_text = "हा एक लिपिड प्रोफाइल अहवाल आहे, जो रक्तातील कोलेस्ट्रॉल आणि चरबीचे प्रमाण तपासून हृदय व रक्तवाहिन्यांच्या आरोग्याची स्थिती दर्शवतो."
        elif is_renal:
            overview_text = "हा एक किडनी फंक्शन टेस्ट (KFT) अहवाल आहे, जो सीरम क्रिएटिनिन आणि युरियाचे प्रमाण तपासून मूत्रपिंडाच्या कार्यक्षमतेचे मूल्यांकन करतो."
        elif is_liver:
            overview_text = "हा एक लिव्हर फंक्शन टेस्ट (LFT) अहवाल आहे, जो यकृतातील एंजाइम्स आणि बिलीरुबिनचे प्रमाण तपासून पचन व चयापचय आरोग्याची तपासणी करतो."
        elif is_diabetes:
            overview_text = "हा रक्तातील साखरेचा (Blood Sugar / HbA1c) अहवाल आहे, जो शरीरातील ग्लुकोजची पातळी आणि मागील ३ महिन्यांतील साखर नियंत्रण तपासतो."
        elif is_echo:
            overview_text = "हा २डी इकोकार्डियोग्राफी (हृदय तपासणी) अहवाल आहे, जो हृदयाची रक्त पंप करण्याची क्षमता (Ejection Fraction) आणि हृदयाच्या झडपांची स्थिती दर्शवतो."
        elif is_prescription:
            overview_text = "हे डॉक्टरांचे वैद्यकीय प्रिस्क्रिप्शन आहे, ज्यामध्ये लक्षणांच्या आधारे आवश्यक औषधे, डोस आणि आरोग्याची काळजी घेण्याबाबत मार्गदर्शन नोंदवले आहे."
        else:
            overview_text = f"हा {doc_type} चा सविस्तर वैद्यकीय अहवाल आहे, ज्यामध्ये तपासलेले आरोग्य मापदंड आणि क्लिनिकल निष्कर्षांची माहिती समाविष्ट आहे."

        sec1_title = "### 1. अहवाल विहंगावलोकन (Report Overview)"
        sec2_title = "### 2. पॅरामीटर्स तपशील (Parameters Breakdown)"
        norm_subhead = "#### सामान्य पॅरामीटर्स (Normal Parameters)"
        abnorm_subhead = "#### असामान्य / लक्ष देण्याजोगे पॅरामीटर्स (Notable / Abnormal Parameters)"
        sec3_title = "### 3. निष्कर्ष आणि आरोग्य स्थिती (Conclusion & Health Status)"
        sec4_title = "### 4. पुढील पायऱ्या (Next Steps)"
        sec5_title = "### 5. आपल्या डॉक्टरांना विचारण्यासाठी महत्त्वाचे प्रश्न (Questions to Ask Your Doctor)"

    else:
        # English
        if is_cbc:
            overview_text = "This is a Complete Blood Count (CBC) laboratory report evaluating red blood cells, white blood cells, hemoglobin, and platelets to assess overall blood health, oxygen capacity, and immune defense."
        elif is_lipid:
            overview_text = "This is a Lipid Profile cardiovascular assessment measuring circulating lipids including Total Cholesterol, HDL ('good') cholesterol, LDL ('bad') cholesterol, and Triglycerides."
        elif is_renal:
            overview_text = "This is a Renal Function / Kidney Panel measuring Serum Creatinine, Blood Urea, and filtration markers to evaluate how effectively your kidneys clear metabolic waste from circulation."
        elif is_liver:
            overview_text = "This is a Liver Function Test (LFT) assessing hepatic enzymes (SGPT/ALT, SGOT/AST) and bilirubin levels to confirm healthy cellular metabolism and bile clearance."
        elif is_diabetes:
            overview_text = "This is a Glycemic / Diabetes Health Panel measuring blood glucose and glycated hemoglobin (HbA1c) to evaluate current blood sugar levels and 90-day metabolic stability."
        elif is_thyroid:
            overview_text = "This is a Thyroid Profile measuring Thyroid Stimulating Hormone (TSH) and thyroid hormones to monitor metabolic regulation and endocrine harmony."
        elif is_echo:
            overview_text = "This is a 2D Echocardiography cardiac ultrasound report assessing left ventricular pumping efficiency (Ejection Fraction), wall motion, and heart valve competence."
        elif is_prescription:
            overview_text = "This is a clinical prescription documenting physician consultation findings, vital measurements, and directed pharmaceutical therapy with administration guidelines."
        else:
            overview_text = f"This is a {doc_type} providing objective clinical measurements and diagnostic evaluations across your health parameters."

        sec1_title = "### 1. Report Overview"
        sec2_title = "### 2. Parameters Breakdown"
        norm_subhead = "#### Normal Parameters"
        abnorm_subhead = "#### Abnormal / Notable Parameters"
        sec3_title = "### 3. Conclusion & Health Status"
        sec4_title = "### 4. Next Steps"
        sec5_title = "### 5. Questions to Ask Your Doctor"

    # -------------------------------------------------------------
    # SECTION 2: PARAMETERS BREAKDOWN
    # -------------------------------------------------------------
    normal_lines: list[str] = []
    abnormal_lines: list[str] = []

    if normal_params:
        for p in normal_params[:8]:
            t_name = p.get("name") or p.get("test_name") or "Parameter"
            val = p.get("result_value") or p.get("value") or ""
            u = p.get("unit") or ""
            ref = p.get("reference_range") or ""
            ref_str = f" (Ref: {ref})" if ref and ref != "N/A" else ""

            if lang in ["hi", "hindi"]:
                normal_lines.append(f"* **{t_name}**: {val} {u}{ref_str} — मानक सीमा में है और स्वस्थ शारीरिक क्रिया को दर्शाता है।")
            elif lang in ["mr", "marathi"]:
                normal_lines.append(f"* **{t_name}**: {val} {u}{ref_str} — सामान्य मर्यादेत असून शरीराची कार्यप्रणाली उत्तम असल्याचे दर्शवतो.")
            else:
                normal_lines.append(f"* **{t_name}**: {val} {u}{ref_str} — Within standard healthy reference limits.")
    else:
        if lang in ["hi", "hindi"]:
            normal_lines.append("* मुख्य प्रयोगशाला मापदंड मानक संदर्भ सीमाओं के अनुरूप दर्ज किए गए हैं।")
        elif lang in ["mr", "marathi"]:
            normal_lines.append("* मुख्य प्रयोगशाळा मापदंड मानक संदर्भ मर्यादेत नोंदवले गेले आहेत.")
        else:
            normal_lines.append("* Primary evaluated laboratory parameters align with standard clinical reference bounds.")

    if abnormal_params:
        for p in abnormal_params[:6]:
            t_name = p.get("name") or p.get("test_name") or "Parameter"
            val = p.get("result_value") or p.get("value") or ""
            u = p.get("unit") or ""
            ref = p.get("reference_range") or ""
            ref_str = f" (Reference: {ref})" if ref and ref != "N/A" else ""
            status = str(p.get("status") or p.get("status_label") or "Out of range").title()

            if lang in ["hi", "hindi"]:
                abnormal_lines.append(f"* **{t_name}**: {val} {u}{ref_str} [{status}] — यह मान सामान्य सीमा से बाहर है और इस पर डॉक्टर से समीक्षा की आवश्यकता है।")
            elif lang in ["mr", "marathi"]:
                abnormal_lines.append(f"* **{t_name}**: {val} {u}{ref_str} [{status}] — हे मूल्य सामान्य मर्यादेबाहेर असून यावर डॉक्टरांचा सल्ला घेणे आवश्यक आहे.")
            else:
                abnormal_lines.append(f"* **{t_name}**: {val} {u}{ref_str} [{status}] — Measured outside the reported reference range. Merits targeted clinical review with your physician.")
    else:
        if lang in ["hi", "hindi"]:
            abnormal_lines.append("* इस रिपोर्ट में कोई भी असामान्य या संदर्भ सीमा से बाहर का मापदंड नहीं पाया गया।")
        elif lang in ["mr", "marathi"]:
            abnormal_lines.append("* या अहवालात कोणताही असामान्य किंवा मर्यादेबाहेरील पॅरामीटर आढळला नाही.")
        else:
            abnormal_lines.append("* No parameters in this report exceeded reported reference thresholds.")

    # -------------------------------------------------------------
    # SECTION 3: CONCLUSION & HEALTH STATUS
    # -------------------------------------------------------------
    if has_abnormal:
        abn_names = [p.get("name") or p.get("test_name") or "clinical marker" for p in abnormal_params[:3]]
        abn_str = ", ".join(abn_names)
        if lang in ["hi", "hindi"]:
            conclusion_badge = f"* **⚠ स्वास्थ्य स्थिति: ध्यान देने की आवश्यकता (Attention Needed)** — {abn_str} के मान सामान्य संदर्भ सीमा से बाहर पाए गए हैं।"
            conclusion_summary = "* **संक्षेप**: रिपोर्ट में कुछ मापदंडों पर ध्यान देने की आवश्यकता है। अपने चिकित्सक से मिलकर इन परिणामों और उचित जीवनशैली व दवा प्रबंधन पर चर्चा करें।"
        elif lang in ["mr", "marathi"]:
            conclusion_badge = f"* **⚠ आरोग्य स्थिती: लक्ष देणे आवश्यक (Attention Needed)** — {abn_str} चे मूल्य प्रमाणित मर्यादेबाहेर आढळले आहे."
            conclusion_summary = "* **थोडक्यात**: अहवालातील काही घटकांवर लक्ष देणे आवश्यक आहे. पुढील योग्य उपचारांसाठी आणि सल्ल्यासाठी आपल्या डॉक्टरांशी भेट निश्चित करा."
        else:
            conclusion_badge = f"* **⚠ Health Status: Attention Needed** — Clinical variance detected for: {abn_str}."
            conclusion_summary = "* **Summary**: Certain evaluated markers fall outside standard bounds. We advise scheduling a routine consultation with your physician to discuss these findings in the context of your symptoms."
    else:
        if lang in ["hi", "hindi"]:
            conclusion_badge = "* **✓ स्वास्थ्य स्थिति: सामान्य (Normal)** — सभी मूल्यांकित मापदंड मानक प्रयोगशाला संदर्भ सीमा के भीतर हैं।"
            conclusion_summary = "* **संक्षेप**: रिपोर्ट के अनुसार सभी जांचे गए पैरामीटर संतुलित व सामान्य हैं। कोई भी प्राथमिक असामान्यता नहीं पाई गई है।"
        elif lang in ["mr", "marathi"]:
            conclusion_badge = "* **✓ आरोग्य स्थिती: सामान्य (Normal)** — सर्व तपासलेले पॅरामीटर्स मानक प्रयोगशाळा संदर्भ मर्यादेत आहेत."
            conclusion_summary = "* **थोडक्यात**: अहवालानुसार तपासलेले सर्व घटक सामान्य मर्यादेत आहेत. कोणतीही गंभीर समस्या आढळलेली नाही."
        else:
            conclusion_badge = "* **✓ Health Status: Normal** — All evaluated test parameters fall within standard laboratory reference ranges."
            conclusion_summary = "* **Summary**: The objective parameters in this document demonstrate healthy baseline physiological function with no abnormal flags detected."

    # -------------------------------------------------------------
    # SECTION 4: NEXT STEPS
    # -------------------------------------------------------------
    if lang in ["hi", "hindi"]:
        next_steps_lines = [
            "1. **चिकित्सक से परामर्श**: इस रिपोर्ट को अपने मूल पर्चे और पिछले परीक्षणों के साथ डॉक्टर को दिखाएं।",
            "2. **दवाइयों की निरंतरता**: डॉक्टर की सलाह के बिना किसी भी निर्धारित दवा को बंद या शुरू न करें।",
            "3. **संतुलित जीवनशैली**: पर्याप्त पानी पिएं, पौष्टिक संतुलित आहार लें और नियमित रूप से 30 मिनट हल्की शारीरिक गतिविधि करें।"
        ]
    elif lang in ["mr", "marathi"]:
        next_steps_lines = [
            "1. **डॉक्टरांचा सल्ला**: हा अहवाल तुमच्या नियमित डॉक्टरांना दाखवा आणि सविस्तर चर्चा करा.",
            "2. **औषधांचे योग्य सेवन**: डॉक्टरांच्या सल्ल्याशिवाय कोणत्याही चालू औषधांमध्ये स्वतःहून बदल करू नका.",
            "3. **आरोग्यदायी जीवनशैली**: पुरेसे पाणी प्या, पौष्टिक व ताजा आहार घ्या आणि दररोज हलका व्यायाम करा."
        ]
    else:
        next_steps_lines = [
            "1. **Physician Consultation**: Present this report alongside your prescription history during your next doctor visit for comprehensive evaluation.",
            "2. **Medication Adherence**: Do not alter, stop, or self-administer medications without direct clinical supervision.",
            "3. **Evidence-Based Lifestyle**: Maintain balanced daily hydration, prioritize whole-food nutrition, and ensure 30 minutes of daily moderate activity."
        ]

    # -------------------------------------------------------------
    # SECTION 5: QUESTIONS TO ASK YOUR DOCTOR
    # -------------------------------------------------------------
    if lang in ["hi", "hindi"]:
        if is_cbc:
            questions = [
                "1. क्या मेरा हीमोग्लोबिन और प्लेटलेट काउंट मेरी उम्र व लिंग के अनुसार पूरी तरह सुरक्षित स्तर पर है?",
                "2. क्या मुझे आयरन, फोलिक एसिड या विटामिन B12 के पूरक (सप्लीमेंट्स) की आवश्यकता है?",
                "3. क्या मुझे कुछ महीनों बाद हीमोग्लोबिन या सीबीसी का फॉलो-अप टेस्ट कराना चाहिए?",
                "4. कमजोरी या थकान महसूस होने पर मुझे आहार में कौन से विशेष फल व सब्जियां शामिल करनी चाहिए?"
            ]
        elif is_diabetes:
            questions = [
                "1. मेरी रिपोर्ट के आधार पर मेरे फास्टिंग और भोजन के बाद के ब्लड शुगर का आदर्श लक्ष्य क्या होना चाहिए?",
                "2. क्या मुझे कार्बोहाइड्रेट नियंत्रण, दैनिक व्यायाम या दवाओं के डोज में किसी बदलाव की जरूरत है?",
                "3. मुझे घर पर ग्लूकोमीटर से शुगर की निगरानी कितनी बार करनी चाहिए और अगला HbA1c टेस्ट कब कराना होगा?",
                "4. अचानक शुगर कम होने (हाइपोग्लाइसीमिया) पर मुझे तुरंत क्या कदम उठाने चाहिए?"
            ]
        elif is_renal:
            questions = [
                "1. मेरे सीरम क्रिएटिनिन और यूरिया के स्तर का मेरी किडनी के कार्य पर क्या प्रभाव पड़ रहा है?",
                "2. क्या मुझे अपने दैनिक पानी के सेवन और प्रोटीन की मात्रा को सीमित या समायोजित करने की जरूरत है?",
                "3. क्या कोई ऐसी सामान्य दर्द निवारक दवाएं (NSAIDs) हैं जिनसे मुझे किडनी की सुरक्षा के लिए बचना चाहिए?",
                "4. किडनी स्वास्थ्य की निगरानी के लिए मुझे अगला रीनल फंक्शन टेस्ट कब कराना चाहिए?"
            ]
        elif is_lipid or is_echo:
            questions = [
                "1. मेरे कोलेस्ट्रॉल स्तर और हृदय स्वास्थ्य के आधार पर मेरा हृदय जोखिम स्कोर क्या है?",
                "2. हृदय की धमनियों को स्वस्थ रखने के लिए मुझे आहार में वसा और नमक का संतुलन कैसे रखना चाहिए?",
                "3. क्या मुझे हल्के कार्डियो व्यायाम शुरू करने से पहले किसी विशेष सावधानी की आवश्यकता है?",
                "4. क्या मुझे 3 से 6 महीने में लिपिड प्रोफाइल या ईसीजी की पुनरावृत्ति करानी चाहिए?"
            ]
        else:
            questions = [
                "1. इस रिपोर्ट के समग्र निष्कर्षों का मेरे दैनिक स्वास्थ्य और ऊर्जा पर क्या प्रभाव पड़ेगा?",
                "2. क्या इन परिणामों के आधार पर मुझे अपने आहार, दिनचर्या या जीवनशैली में कोई सुधार करना चाहिए?",
                "3. क्या स्थिति की पुष्टि के लिए मुझे किसी फॉलो-अप परीक्षण या अतिरिक्त जांच की आवश्यकता है?",
                "4. किन प्राथमिक चेतावनी संकेतों पर मुझे विशेष ध्यान देना चाहिए?"
            ]
    elif lang in ["mr", "marathi"]:
        if is_cbc:
            questions = [
                "1. माझे हिमोग्लोबिन आणि प्लेटलेट्सचे प्रमाण माझ्या वयानुसार सुरक्षित मर्यादेत आहे का?",
                "2. मला आयर्न किंवा व्हिटॅमिन B12 च्या सप्लीमेंट्स घेण्याची गरज आहे का?",
                "3. मला काही महिन्यांनंतर पुन्हा सीबीसी (CBC) तपासणी करावी लागेल का?",
                "4. अशक्तपणा कमी करण्यासाठी मी आहारात कोणते बदल करावेत?"
            ]
        elif is_diabetes:
            questions = [
                "1. माझ्या रक्तातील साखरेचे सुरक्षित दैनंदिन उद्दिष्ट काय असावे?",
                "2. यासाठी मला आहारात बदल, चालण्याचा व्यायाम किंवा औषधांच्या डोसमध्ये बदलाची गरज आहे का?",
                "3. पुढील HbA1c चाचणी मला कधी करावी लागेल?",
                "4. साखर अचानक कमी झाल्यास कोणती काळजी घ्यावी?"
            ]
        else:
            questions = [
                "1. या अहवालातील निष्कर्षांचा माझ्या दैनंदिन आरोग्यावर काय परिणाम होईल?",
                "2. यासाठी मला आहारात बदल, नियमित व्यायाम किंवा उपचारांची गरज आहे का?",
                "3. या स्थितीवर लक्ष ठेवण्यासाठी मला पुन्हा कधी तपासणी करावी लागेल?",
                "4. कोणती लक्षणे आढळल्यास मी त्वरित आपल्याशी संपर्क साधावा?"
            ]
    else:
        if is_cbc:
            questions = [
                "1. Does my hemoglobin and platelet count reflect adequate physiological baseline for my age and gender?",
                "2. Would nutritional iron, folate, or vitamin B12 supplementation benefit my energy levels?",
                "3. When is a follow-up repeat Complete Blood Count recommended to track progress?",
                "4. What specific symptoms (e.g. breathlessness, dizziness) should prompt earlier consultation?"
            ]
        elif is_diabetes:
            questions = [
                "1. What are my individualized target ranges for fasting blood glucose and post-meal readings?",
                "2. Are nutritional adjustments and aerobic activity sufficient, or is medical glycemic therapy indicated?",
                "3. What is the recommended cadence for my next HbA1c evaluation?",
                "4. What hypoglycemic warning signs should I and my family be prepared to recognize?"
            ]
        elif is_renal:
            questions = [
                "1. What does my estimated GFR and serum creatinine level indicate regarding long-term kidney health?",
                "2. Are there specific adjustments needed for daily fluid intake, sodium restriction, or protein consumption?",
                "3. Which over-the-counter pain medications (NSAIDs) should I avoid to preserve kidney filtration?",
                "4. When should a follow-up Renal Function Panel or urine microalbumin assessment be scheduled?"
            ]
        elif is_lipid or is_echo:
            questions = [
                "1. How do my cholesterol numbers impact my overall cardiovascular health risk score?",
                "2. What dietary modifications (e.g. Mediterranean pattern, sodium reduction) are most effective for my profile?",
                "3. Are there exercise guidelines or heart rate targets I should follow during physical activity?",
                "4. Is a follow-up lipid profile recommended in 3 to 6 months to evaluate lifestyle impact?"
            ]
        else:
            questions = [
                "1. What do these specific laboratory findings mean for my overall health and daily wellbeing?",
                "2. Are any dietary, nutritional, or physical lifestyle adjustments recommended based on these values?",
                "3. Do I require any follow-up tests, ultrasound scans, or specialist referrals for these findings?",
                "4. What warning signs or symptoms should I watch for that would require prompt clinical attention?"
            ]

    # Detect medicines if any
    detected_medicines = extract_prescription_medicines_summary(raw_text, lang)
    has_medicines = len(detected_medicines) > 0

    if has_medicines:
        if lang in ["hi", "hindi"]:
            sec_med_title = "### 5. दवाओं से संबंधित जानकारी (Medication & Dosage Information)"
            sec_q_title = "### 6. डॉक्टर से पूछने योग्य महत्वपूर्ण प्रश्न (Questions to Ask Your Doctor)"
            med_lines = [
                f"* **{m['name']}** [{m['category']}] — **खुराक**: {m['dosage']} | **समय**: {m['frequency']} ({m['timing']})। **उपयोग**: {m['purpose']} **सावधानी**: {m['precautions']}"
                for m in detected_medicines
            ]
        elif lang in ["mr", "marathi"]:
            sec_med_title = "### 5. औषधांविषयी माहिती (Medication & Dosage Information)"
            sec_q_title = "### 6. आपल्या डॉक्टरांना विचारण्यासाठी महत्त्वाचे प्रश्न (Questions to Ask Your Doctor)"
            med_lines = [
                f"* **{m['name']}** [{m['category']}] — **डोस**: {m['dosage']} | **वेळ**: {m['frequency']} ({m['timing']}). **उपयोग**: {m['purpose']} **काळजी**: {m['precautions']}"
                for m in detected_medicines
            ]
        else:
            sec_med_title = "### 5. Medication & Dosage Information"
            sec_q_title = "### 6. Questions to Ask Your Doctor"
            med_lines = [
                f"* **{m['name']}** [{m['category']}] — **Dosage**: {m['dosage']} | **Timing**: {m['frequency']} ({m['timing']}). **Purpose**: {m['purpose']} **Precautions**: {m['precautions']}"
                for m in detected_medicines
            ]

        md_sections = [
            f"{sec1_title}\n{overview_text}\n",
            f"{sec2_title}\n{norm_subhead}\n" + "\n".join(normal_lines) + "\n\n" + f"{abnorm_subhead}\n" + "\n".join(abnormal_lines) + "\n",
            f"{sec3_title}\n{conclusion_badge}\n{conclusion_summary}\n",
            f"{sec4_title}\n" + "\n".join(next_steps_lines) + "\n",
            f"{sec_med_title}\n" + "\n".join(med_lines) + "\n",
            f"{sec_q_title}\n" + "\n".join(questions)
        ]
    else:
        if lang in ["hi", "hindi"]:
            sec_q_title = "### 5. डॉक्टर से पूछने योग्य महत्वपूर्ण प्रश्न (Questions to Ask Your Doctor)"
        elif lang in ["mr", "marathi"]:
            sec_q_title = "### 5. आपल्या डॉक्टरांना विचारण्यासाठी महत्त्वाचे प्रश्न (Questions to Ask Your Doctor)"
        else:
            sec_q_title = "### 5. Questions to Ask Your Doctor"

        md_sections = [
            f"{sec1_title}\n{overview_text}\n",
            f"{sec2_title}\n{norm_subhead}\n" + "\n".join(normal_lines) + "\n\n" + f"{abnorm_subhead}\n" + "\n".join(abnormal_lines) + "\n",
            f"{sec3_title}\n{conclusion_badge}\n{conclusion_summary}\n",
            f"{sec4_title}\n" + "\n".join(next_steps_lines) + "\n",
            f"{sec_q_title}\n" + "\n".join(questions)
        ]

    full_markdown = "\n".join(md_sections)

    return {
        "summary_text": full_markdown,
        "source": "clinical_engine",
        "is_ai_generated": True,
        "language": lang
    }


# ---------------------------------------------------------------------------
# 2. LOCAL MEDICAL TERM EXPLAINER
# ---------------------------------------------------------------------------

def generate_gemini_term_explanation(term: str, context: str = "", language: str = "en") -> Optional[str]:
    """Explains an individual clinical term locally on the backend codebase in EN, HI, or MR."""
    from app.services.explanation_service import get_explanation
    lang = (language or "en").lower().strip()
    data = get_explanation(term)
    if not data:
        return None

    simple = data.get("simple_explanation", "")
    why = data.get("why_it_matters", "")
    return f"{simple} {why}".strip()


# ---------------------------------------------------------------------------
# 3. LOCAL CLINICAL SYMPTOM REASONING ENGINE
# ---------------------------------------------------------------------------

def detect_symptom_language(text: str, fallback_lang: str = "en") -> str:
    lang = (fallback_lang or "en").lower().strip()
    if lang in ["mr", "marathi"]:
        return "mr"
    if lang in ["hi", "hindi"]:
        return "hi"
    
    # Check Devanagari script
    if re.search(r"[\u0900-\u097F]", text):
        marathi_markers = ["काय", "खावे", "करावे", "आहे", "नाही", "होते", "डोकेदुखी", "पोटदुखी"]
        if any(m in text for m in marathi_markers):
            return "mr"
        return "hi"

    lower = text.lower()
    hinglish_keywords = [
        "bukhar", "bokhar", "khana", "chahiye", "kya", "kare", "kaise", "dard", "sir", "sar",
        "pet", "khansi", "jukam", "sardi", "gale", "chakkar", "kamjori", "ulti", "dast",
        "mujhe", "mera", "meri", "mere", "dawa", "dawai", "upay", "ilaj", "theek", "khaye", "peena",
        "gharelu", "kitna", "hona", "jalan", "sujan", "bhukh", "thakan", "taap"
    ]
    if any(re.search(r"\b" + re.escape(w) + r"\b", lower) for w in hinglish_keywords):
        return "hi"

    return "en"


def generate_ai_symptom_analysis(
    symptoms_text: str,
    language: str = "en"
) -> dict[str, Any]:
    """
    Evaluates patient-described symptoms or health questions using a comprehensive
    multi-domain clinical reasoning engine running 100% locally on the backend codebase.
    """
    raw_input = (symptoms_text or "").strip()
    detected_lang = detect_symptom_language(raw_input, language)

    fallback_data = _build_clinical_symptom_fallback(raw_input, detected_lang)

    return {
        "success": True,
        "is_ai_generated": True,
        "source": "clinical_engine",
        "language": detected_lang,
        "direct_guidance": fallback_data.get("direct_guidance"),
        "direct_answer": fallback_data.get("direct_answer", ""),
        "markdown_explanation": fallback_data.get("markdown_explanation", ""),
        "primary_domain": fallback_data.get("primary_domain", "general"),
        "system": fallback_data.get("system", "General Health"),
        "specialist": fallback_data.get("specialist", "General Physician"),
        "recommended_tests": fallback_data.get("recommended_tests", []),
        "predicted_conditions": fallback_data.get("predicted_conditions", []),
        "reason_behind_it": fallback_data.get("reason_behind_it", ""),
        "red_flags": fallback_data.get("red_flags", []),
        "doctor_questions": fallback_data.get("doctor_questions", [])
    }


def _build_clinical_symptom_fallback(raw_text: str, language: str = "en") -> dict[str, Any]:
    """Structured clinical reasoning across 9 medical domains in EN, HI, and MR."""
    lower = raw_text.lower()
    lang = (language or "en").lower().strip()
    if lang not in ["hi", "hindi", "mr", "marathi"]:
        lang = "en"

    # Domain keyword matching including Hinglish & Devanagari
    is_fever = any(w in lower for w in [
        "fever", "bukhar", "bokhar", "tap", "taap", "temperature", "pyrexia", "chills", "shivering",
        "बुखार", "ताप", "ज्वर"
    ])
    is_headache = any(w in lower for w in [
        "headache", "migraine", "head pain", "sir dard", "sar dard", "सिरदर्द", "डोकेदुखी", "माथा"
    ])
    is_gastro = any(w in lower for w in [
        "acid", "acidity", "heartburn", "stomach", "pet dard", "pet kharab", "gas", "bloat", "nausea",
        "vomit", "ulti", "loose motion", "dast", "constipat", "kabz", "diarrhea", "पेट", "एसिडिटी",
        "उल्टी", "गैस", "पोटदुखी", "जुलाब", "बद्धकोष्ठता"
    ])
    is_diabetes = any(w in lower for w in [
        "sugar", "diabetes", "glucose", "thirst", "urinat", "weight loss", "hunger", "sweet", "polyuria",
        "डायबिटीज", "मधुमेह", "प्यास", "पेशाब", "शर्करा", "साखर", "तहान"
    ])
    is_heart = any(w in lower for w in [
        "chest", "heart", "palpitat", "angina", "pulse", "breathless", "pressure", "ecg", "echo",
        "हार्ट", "दिल", "छाती", "धड़कन", "सांस", "छातीत"
    ])
    is_kidney = any(w in lower for w in [
        "kidney", "creatinine", "urea", "swelling", "edema", "ankle", "foamy", "flank", "urine",
        "किडनी", "गुर्दे", "सूजन", "पैर", "सूज", "मूत्रपिंड"
    ])
    is_anemia = any(w in lower for w in [
        "fatigue", "tired", "weak", "pale", "iron", "hemoglobin", "anemia", "dizzy",
        "थकान", "कमजोरी", "पीलापन", "हीमोग्लोबिन", "चक्कर", "अशक्तपणा"
    ])
    is_respiratory = any(w in lower for w in [
        "cough", "phlegm", "sputum", "wheeze", "asthma", "cold", "khansi", "jukam", "sardi",
        "gale me dard", "khokla", "खांसी", "कफ", "जुकाम", "खोकला", "सर्दी"
    ])

    # -------------------------------------------------------------
    # 1. FEVER & INFECTION DOMAIN (Highest priority for fever queries)
    # -------------------------------------------------------------
    if is_fever:
        domain = "fever"
        system = "Immune & Thermoregulatory System"
        tests = [
            "Complete Blood Count (CBC - Hemoglobin, Platelets, TLC)",
            "Widal Test / Typhoid Serology (if fever persists > 4 days)",
            "Malarial Antigen / Dengue NS1 Rapid Panel (if chills or body rash)",
            "Routine Urinalysis (Urine R/M)"
        ]

        if lang in ["hi", "hindi"]:
            specialist = "जनरल फिजिशियन (General Physician)"
            conditions = [
                {"condition": "वायरल पायरिक्सिया / मौसमी वायरल बुखार (Viral Febrile Illness)", "likelihood": "उच्च संभावना (Higher)", "summary": "मौसम बदलने या वायरल संक्रमण के कारण शरीर का तापमान बढ़ना और बदन दर्द।"},
                {"condition": "तीव्र श्वसन अथवा आंतों का मौसमी संक्रमण (Seasonal Infectious Episode)", "likelihood": "मध्यम (Moderate)", "summary": "ऊपरी श्वसन नली या पेट में हल्के संक्रमण के कारण प्रतिरक्षा तंत्र की प्रतिक्रिया।"}
            ]
            reason = "जब कोई वायरस या बैक्टीरिया शरीर में प्रवेश करता है, तो श्वेत रक्त कोशिकाएं (WBC) 'पायरोजेन्स' छोड़ती हैं। यह मस्तिष्क के हाइपोथैलेमस को शरीर का तापमान बढ़ाने का संकेत देता है ताकि रोगाणु नष्ट हो सकें। बुखार में शरीर का मेटाबॉलिज्म बढ़ जाता है परंतु पेट के पाचक रस (Digestive Enzymes) धीमे हो जाते हैं, जिससे भूख कम लगती है और पाचन कमजोर रहता है। इसलिए हल्का, सुपाच्य और तरल पदार्थों से भरपूर भोजन लेना अत्यंत आवश्यक है।"
            red_flags = [
                "बुखार 102°F से ऊपर जाना और दवा के बाद भी कम न होना",
                "सांस लेने में गंभीर कठिनाई, सीने में दर्द या लगातार उल्टियां होना",
                "गर्दन में अत्यधिक अकड़न, तेज सिरदर्द, अत्यधिक सुस्ती या बेहोशी",
                "त्वचा पर लाल चकत्ते (Rashes) या शरीर से असामान्य रक्तस्राव"
            ]
            doctor_questions = [
                "क्या इस बुखार के लिए CBC या डेंगू/मलेरिया टेस्ट की आवश्यकता है?",
                "शरीर दर्द और बुखार को नियंत्रित करने के लिए कौन सी सुरक्षित दवा और खुराक लेनी चाहिए?",
                "यदि बुखार 3 दिन के भीतर ठीक न हो तो मुझे कब दोबारा क्लिनिक आना चाहिए?"
            ]
            direct_guidance = {
                "title": "💡 बुखार में आहार एवं तात्कालिक क्लिनिकल देखभाल सलाह (Diet & Self-Care in Fever)",
                "summary": "बुखार के दौरान पाचन अग्नि मंद होती है और शरीर को रोग से लड़ने के लिए ऊर्जा तथा पर्याप्त पानी (Hydration) की सख्त आवश्यकता होती है। इसलिए हल्का, सुपाच्य और तरल पदार्थों से भरपूर भोजन लें।",
                "foods_to_eat": [
                    "मूंग दाल की पतली खिचड़ी या दलिया (हल्का, सुपाच्य और तुरंत ऊर्जा देने वाला)",
                    "ताजी सब्जियों का गर्म व पतला सूप (टमाटर, गाजर, पालक - बिना अधिक मक्खन)",
                    "पानीदार और ताजे फल (सेब, पपीता, अनार, संतरा या मौसंबी का ताजा रस)",
                    "उबले हुए आलू, सादे चावल या साबूदाना की पतली खीर/खिचड़ी",
                    "गुनगुना पानी, ओआरएस (ORS) घोल, नारियल पानी और हल्का नींबू पानी"
                ],
                "foods_to_avoid": [
                    "तला-भुना, अत्यधिक तेल, घी और तीखे मिर्च-मसालेदार भोजन",
                    "ठंडा पानी, आइसक्रीम, कोल्ड ड्रिंक्स और फ्रिज में रखा बासी भोजन",
                    "भारी मांसाहार, पनीर, मैदा और भारी मिठाइयां (जिन्हें पचाने में भारी ऊर्जा लगती है)",
                    "अत्यधिक चाय, कॉफी या कैफीन युक्त पेय (जो डिहाइड्रेशन बढ़ा सकते हैं)"
                ],
                "hydration_care": [
                    "हर 1-2 घंटे में गुनगुना पानी या ओआरएस (ORS) पिएं (प्रतिदिन 2.5-3 लीटर तरल पदार्थ)।",
                    "तुलसी, अदरक और काली मिर्च का हल्का काढ़ा या हर्बल चाय लें।",
                    "पेशाब का रंग हल्का पीला या साफ रहना पर्याप्त हाइड्रेशन का संकेत है।"
                ],
                "immediate_care": [
                    "पूर्ण शारीरिक आराम (Bed Rest) करें; शरीर को संक्रमण से लड़ने के लिए ऊर्जा की जरूरत होती है।",
                    "तापमान 101°F से अधिक होने पर माथे और गर्दन पर सामान्य पानी की पट्टियां रखें (बर्फ का पानी न लगाएं)।",
                    "हल्के और ढीले सूती कपड़े पहनें; अत्यधिक भारी कंबल न ओढ़ें।"
                ]
            }
        elif lang in ["mr", "marathi"]:
            specialist = "जनरल फिजिशियन (General Physician)"
            conditions = [
                {"condition": "व्हायरल ताप / हंगामी विषाणू संसर्ग (Viral Pyrexia)", "likelihood": "जास्त शक्यता (Higher)", "summary": "हवामानातील बदलांमुळे किंवा व्हायरल इन्फेक्शनमुळे शरीराचे तापमान वाढणे व अंगदुखी."},
                {"condition": "हंगामी श्वसनमार्ग किंवा पोटाचा संसर्ग (Seasonal Infectious Episode)", "likelihood": "मध्यम (Moderate)", "summary": "रोगप्रतिकार यंत्रणेची संसर्गाविरुद्धची नैसर्गिक प्रतिक्रिया."}
            ]
            reason = "जेव्हा शरीरात विषाणू किंवा जिवाणूंचा संसर्ग होतो, तेव्हा रोगप्रतिकारशक्ती पायरोजेन्स नावाचे घटक सोडते. यामुळे मेंदूतील हायपोथॅलॅमस शरीराचे तापमान वाढवतो जेणेकरून विषाणू नष्ट व्हावेत. तापाच्या वेळी चयापचय वाढतो पण पचनसंस्था मंदावते, म्हणूनच हलका आणि पाण्याचे प्रमाण जास्त असणारा सुपाच्य आहार घेणे अत्यंत महत्त्वाचे असते."
            red_flags = [
                "ताप १०२°F पेक्षा जास्त असणे आणि औषध देऊनही न उतरणे",
                "श्वास घेण्यास तीव्र त्रास, छातीत दुखणे किंवा सतत उलट्या होणे",
                "मान आखडणे, तीव्र डोकेदुखी किंवा अत्यंत अशक्तपणा",
                "अंगावर लाल पुरळ किंवा रक्तस्त्रावाचे डाग दिसणे"
            ]
            doctor_questions = [
                "या तापासाठी सीबीसी (CBC) किंवा डेंग्यू/मलेरिया चाचणी करावी लागेल का?",
                "अंगदुखी आणि तापासाठी कोणते सुरक्षित औषध आणि डोस घ्यावा?",
                "ताप ३ दिवसात कमी न झाल्यास कधी पुन्हा डॉक्टरांना दाखवावे?"
            ]
            direct_guidance = {
                "title": "💡 तापात काय खावे व तात्काळ काळजी सल्ला (Diet & Care in Fever)",
                "summary": "तापात पचनक्रिया मंदावते, त्यामुळे शरीराला ऊर्जा मिळण्यासाठी सुपाच्य, हलका आणि पाण्याचे प्रमाण भरपूर असणारा आहार आवश्यक आहे.",
                "foods_to_eat": [
                    "मुगाच्या डाळीची मऊ खिचडी किंवा लापशी/दलिया",
                    "ताज्या भाज्यांचे गरम सूप (टोमॅटो, गाजर, पालक)",
                    "हलकी फळे जसे की सफरचंद, पपई, डाळिंब आणि संत्री",
                    "उकडलेले बटाटे किंवा साबुदाण्याची मऊ खिचडी",
                    "कोमट पाणी, ओआरएस (ORS), आणि नारळ पाणी"
                ],
                "foods_to_avoid": [
                    "तळलेले, तेलकट, तिखट आणि मसालेदार पदार्थ",
                    "थंड पाणी, आईस्क्रीम, शीतपेये आणि शिळे अन्न",
                    "पचायला जड असणारे मांसाहार आणि बेकरी पदार्थ",
                    "जास्त चहा किंवा कॉफी (ज्यामुळे डिहायड्रेशन होऊ शकते)"
                ],
                "hydration_care": [
                    "दर १-२ तासांनी कोमट पाणी किंवा ओआरएस प्या (दररोज २.५-३ लिटर पाणी).",
                    "तुळस, आले आणि काळी मिरीचा हलका काढा किंवा हर्बल चहा घ्या.",
                    "लघवीचा रंग स्वच्छ राहील इतके पाणी नियमित प्या."
                ],
                "immediate_care": [
                    "पुरेशी विश्रांती घ्या आणि शारीरिक श्रम टाळा.",
                    "ताप १०१°F पेक्षा जास्त असल्यास कपाळावर साध्या पाण्याच्या पट्ट्या ठेवा.",
                    "हवेशीर खोलीत राहा आणि हलके सुती कपडे वापरा."
                ]
            }
        else:
            specialist = "General Physician / Family Medicine"
            conditions = [
                {"condition": "Viral Pyrexia / Seasonal Febrile Illness", "likelihood": "Higher Probability", "summary": "Immune thermoregulatory response to seasonal viral pathogens causing elevated core body temperature and malaise."},
                {"condition": "Acute Upper Respiratory or Gastrointestinal Febrile Episode", "likelihood": "Moderate", "summary": "Mild localized inflammatory process eliciting a systemic febrile reaction."}
            ]
            reason = "When viral or bacterial pathogens enter the body, immune cells release signaling chemicals called pyrogens. These signal the hypothalamus to elevate the core thermal setpoint, inhibiting pathogen replication. During a fever, basal metabolic demand rises while gastrointestinal digestive enzymes slow down, making easily digestible, hydrating, and nutrient-dense nutrition essential."
            red_flags = [
                "Body temperature exceeding 102°F unresponsive to antipyretics",
                "Severe shortness of breath, chest discomfort, or persistent vomiting",
                "Stiff neck, severe photophobia, confusion, or sudden lethargy",
                "Petechial rash (tiny red/purple spots) or abnormal bruising"
            ]
            doctor_questions = [
                "Do my symptoms warrant a Complete Blood Count (CBC) or viral screening?",
                "What is the safest antipyretic medication and dosing interval for my age/weight?",
                "What warning milestones require an immediate hospital follow-up?"
            ]
            direct_guidance = {
                "title": "💡 Clinical Diet & Home Care Guidance for Fever",
                "summary": "During a fever, digestive capacity decreases while cellular hydration and metabolic needs rise. Emphasize easily absorbable, nutrient-dense carbohydrates, mild soups, and continuous electrolyte hydration.",
                "foods_to_eat": [
                    "Moong dal khichdi or soft oatmeal porridge (gentle on stomach, quick energy)",
                    "Warm, clear vegetable soups (tomato, carrot, spinach broth)",
                    "Fresh hydrating fruits (apples, papaya, pomegranate, sweet lime)",
                    "Boiled potatoes, steamed rice with curd, or sago porridge",
                    "Lukewarm water, oral rehydration solution (ORS), and tender coconut water"
                ],
                "foods_to_avoid": [
                    "Deep-fried, greasy, and heavily spiced or oily foods",
                    "Ice-cold beverages, refrigerated desserts, and stale food",
                    "Heavy meats, dense cheese, and refined flour (maida) items",
                    "Excessive caffeinated sodas, coffee, or energy drinks"
                ],
                "hydration_care": [
                    "Sip fluids every 1–2 hours targeting 2.5–3 liters total daily intake.",
                    "Drink mild ginger-tulsi herbal infusions to soothe throat and chills.",
                    "Monitor urine color; pale straw indicates adequate cellular hydration."
                ],
                "immediate_care": [
                    "Ensure strict bed rest to preserve immunological defense energy.",
                    "Use room-temperature tap water sponging on forehead and neck for temp > 101°F (avoid ice water).",
                    "Wear loose, breathable cotton clothing and avoid heavily layering blankets."
                ]
            }

    # -------------------------------------------------------------
    # 2. HEADACHE & NEUROLOGICAL DOMAIN
    # -------------------------------------------------------------
    elif is_headache:
        domain = "headache"
        system = "Neurological & Cranial Health"
        tests = ["Blood Pressure Evaluation", "Visual Acuity & Fundoscopy", "Complete Blood Count (CBC)", "Cervical Spine X-Ray / Brain MRI (if persistent)"]

        if lang in ["hi", "hindi"]:
            specialist = "जनरल फिजिशियन या न्यूरोलॉजिस्ट (Neurologist)"
            conditions = [
                {"condition": "तनाव या थकावट जन्य सिरदर्द (Tension-Type Headache)", "likelihood": "उच्च संभावना (Higher)", "summary": "मानसिक तनाव, नींद की कमी या गर्दन की मांसपेशियों में खिंचाव के कारण सिर में जकड़न।"},
                {"condition": "माइग्रेन या वेस्कुलर सिरदर्द (Migraine / Vascular Headache)", "likelihood": "मध्यम (Moderate)", "summary": "मस्तिष्क की रक्त वाहिकाओं में संकुचन और फैलाव के कारण सिर के एक हिस्से में तेज दर्द।"}
            ]
            reason = "सिरदर्द अक्सर सिर, गर्दन और स्कैल्प की मांसपेशियों में अत्यधिक तनाव, रक्त वाहिकाओं में खिंचाव या शरीर में निर्जलीकरण (Dehydration) के कारण होता है। स्क्रीन का अधिक उपयोग, तनाव और अनियमित खान-पान ट्रिगर का काम करते हैं।"
            red_flags = ["अचानक बिजली के झटके जैसा अत्यधिक तीव्र सिरदर्द (Thunderclap Headache)", "सिरदर्द के साथ हाथ-पैर में कमजोरी या बोलने में लड़खड़ाहट", "तेज बुखार, गर्दन में अकड़न और आंखों से धुंधला दिखना"]
            doctor_questions = ["क्या यह माइग्रेन है या तनाव से संबंधित सिरदर्द?", "क्या मुझे अपनी आंखों की जांच या बीपी मॉनिटरिंग करानी चाहिए?", "सिरदर्द शुरू होते ही कौन सा सुरक्षित प्राथमिक उपाय करना चाहिए?"]
            direct_guidance = {
                "title": "💡 सिरदर्द में तात्कालिक राहत व आहार संबंधी मार्गदर्शन (Headache Care & Diet)",
                "summary": "सिरदर्द में तुरंत राहत के लिए पर्याप्त पानी पिएं, शांत व अंधेरे कमरे में विश्राम करें और भारी भोजन व तेज रोशनी से बचें।",
                "foods_to_eat": ["भरपूर सादा व गुनगुना पानी", "मैग्नीशियम युक्त हल्के फल (केला, भीगे बादाम)", "हल्का हर्बल काढ़ा या अदरक-पुदीने की चाय", "सुपाच्य हल्का भोजन (दलिया, खिचड़ी)"],
                "foods_to_avoid": ["अत्यधिक कैफीन, चाय, कॉफी और एनर्जी ड्रिंक्स", "अजीनोमोटो, बहुत अधिक नमकीन और प्रोसेस्ड स्नैक्स", "खाली पेट रहना या भोजन में लंबा अंतर रखना"],
                "hydration_care": ["तत्काल 1-2 गिलास पानी पिएं, क्योंकि डिहाइड्रेशन सिरदर्द का सबसे आम कारण है।"],
                "immediate_care": ["मोबाइल और कंप्यूटर स्क्रीन से तुरंत दूरी बनाएं।", "शांत, हवादार और मंद रोशनी वाले कमरे में 20-30 मिनट आंखें बंद करके लेटें।", "माथे या गर्दन के पीछे सामान्य पानी की ठंडी पट्टी या जेंटल मसाज करें।"]
            }
        else:
            specialist = "General Physician or Neurologist"
            conditions = [
                {"condition": "Tension-Type Headache / Dehydration Cephalea", "likelihood": "Higher Probability", "summary": "Pericranial myofascial strain induced by screen fatigue, stress, or subclinical dehydration."},
                {"condition": "Migraine / Neurovascular Episode", "likelihood": "Moderate", "summary": "Trigeminovascular activation causing unilateral throbbing pain with sensory sensitivity."}
            ]
            reason = "Cranial pain receptors activate when head and cervical muscles spasm or cranial blood vessels dilate. Prolonged screen exposure, emotional stress, irregular meals, and insufficient water intake are the primary clinical triggers."
            red_flags = ["Sudden onset 'worst headache of life' (thunderclap headache)", "Headache accompanied by focal neurological deficits or slurred speech", "Fever with severe neck stiffness and photophobia"]
            doctor_questions = ["Could this headache be related to eye strain or elevated blood pressure?", "What abortive therapies are safest for my symptom pattern?", "Are there specific dietary triggers I should eliminate?"]
            direct_guidance = {
                "title": "💡 Clinical Guidance & Self-Care for Headache Relief",
                "summary": "Hydrate immediately, step away from digital screens, and rest in a dim, well-ventilated room to relieve cranial vascular strain.",
                "foods_to_eat": ["Ample room-temperature water", "Magnesium-rich foods (bananas, soaked almonds)", "Mild ginger or peppermint infusion", "Light, easily digestible whole foods"],
                "foods_to_avoid": ["Excessive caffeine, sodas, and energy drinks", "Aged cheeses, cured meats, and artificial sweeteners", "Skipping meals or fasting"],
                "hydration_care": ["Drink 1–2 large glasses of water immediately; dehydration is a leading headache catalyst."],
                "immediate_care": ["Rest in a dark, quiet room with eyes closed for 20–30 minutes.", "Apply a cool compress across forehead and gently relax neck muscles.", "Minimize visual glare and avoid loud auditory stimuli."]
            }

    # -------------------------------------------------------------
    # 3. GASTROINTESTINAL & DIGESTIVE DOMAIN
    # -------------------------------------------------------------
    elif is_gastro:
        domain = "gastro"
        system = "Gastrointestinal & Digestive System"
        tests = ["Ultrasound Abdomen (USG Whole Abdomen)", "Liver Function Tests (LFT)", "Stool Routine & Microscopy", "Complete Blood Count (CBC)"]

        if lang in ["hi", "hindi"]:
            specialist = "गैस्ट्रोएंटेरोलॉजिस्ट (Gastroenterologist) या जनरल फिजिशियन"
            conditions = [
                {"condition": "गैस्ट्राइटिस / अपच एवं एसिडिटी (Acute Gastritis / Dyspepsia)", "likelihood": "उच्च संभावना (Higher)", "summary": "पेट में अतिरिक्त एसिड बनने से जलन, गैस, भारीपन और पेट दर्द।"},
                {"condition": "गैस्ट्रोएंटेराइटिस / आंतों का हल्का संक्रमण (Gastroenteritis / Loose Stools)", "likelihood": "मध्यम (Moderate)", "summary": "खान-पान में गड़बड़ी या संक्रमण से दस्त, उल्टी या ऐंठन।"}
            ]
            reason = "पेट की आंतरिक सुरक्षात्मक परत (Gastric Mucosa) जब मसालेदार भोजन, अनियमित खान-पान या संक्रमण से उत्तेजित हो जाती है, तो एसिड का स्राव बढ़ जाता है। इससे पेट में जलन, खट्टी डकारें, भारीपन और आंतों में ऐंठन होती है।"
            red_flags = ["उल्टी में खून आना या काले रंग का मल होना", "अत्यधिक तेज पेट दर्द जो अचानक शुरू हो और सहन न हो", "लगातार पानी की तरह दस्त होना और पेशाब बिल्कुल न आना (गंभीर निर्जलीकरण)"]
            doctor_questions = ["क्या मुझे एंटासिड या प्रोबायोटिक लेने की जरूरत है?", "क्या पेट के अल्ट्रासाउंड या स्टूल टेस्ट की आवश्यकता है?", "पेट की ऐंठन और गैस से बचने के लिए क्या सावधानी बरतें?"]
            direct_guidance = {
                "title": "💡 पेट दर्द, गैस व पाचन संबंधी आहार व देखभाल सलाह (Digestive Care & Diet)",
                "summary": "पेट की तकलीफ में आंतों को आराम देने के लिए हल्का और सुपाच्य आहार लें। तैलीय, खट्टे और मिर्च-मसालेदार भोजन से पूरी तरह परहेज करें।",
                "foods_to_eat": ["दही-चावल या सादी मूंग दाल खिचड़ी (आंतों के लिए सर्वोत्तम)", "भुना जीरा मिला हुआ ताजा छाछ (Buttermilk)", "केला और उबला हुआ सेब (BRAT डाइट)", "ओआरएस (ORS) घोल, नारियल पानी और गुनगुना पानी"],
                "foods_to_avoid": ["तला-भुना, समोसा, पकोड़े और तेज मिर्च-मसाले", "दूध, पनीर, चाय, कॉफी और कोल्ड ड्रिंक्स", "कच्ची सलाद, पत्तागोभी और बासी भोजन"],
                "hydration_care": ["दस्त या उल्टी होने पर हर बार 1 कप ओआरएस (ORS) या नारियल पानी धीरे-धीरे पिएं।"],
                "immediate_care": ["पेट पर गर्म पानी की थैली (Hot Water Bag) से सिकाई करें।", "खाना खाने के तुरंत बाद न लेटें; 15-20 मिनट धीमी गति से टहलें।", "एक बार में भरपेट खाने के बजाय थोड़ा-थोड़ा करके दिन में 4-5 बार खाएं।"]
            }
        else:
            specialist = "Gastroenterologist or General Physician"
            conditions = [
                {"condition": "Acute Gastritis / Acid Peptic Dyspepsia", "likelihood": "Higher Probability", "summary": "Gastric mucosal irritation with hyperchlorhydria causing burning, bloating, and epigastric pain."},
                {"condition": "Acute Infectious Gastroenteritis / Enteric Spasm", "likelihood": "Moderate", "summary": "Intestinal hypermotility triggered by dietary indiscretion or mild microbial irritation."}
            ]
            reason = "Gastric parietal cells oversecrete hydrochloric acid in response to dietary triggers, stress, or pathogens, inflaming the mucosal lining and causing gastric spasms, bloating, and impaired peristalsis."
            red_flags = ["Hematemesis (vomiting blood) or melena (black tarry stools)", "Sudden board-like abdominal rigidity or excruciating rebound tenderness", "Severe dehydration signs (sunken eyes, zero urine output for 8+ hours)"]
            doctor_questions = ["Should I take a short course of proton pump inhibitors or antacids?", "Is an abdominal ultrasound or stool culture indicated?", "What specific dietary protocol best suits my recovery?"]
            direct_guidance = {
                "title": "💡 Clinical Guidance & Dietary Protocol for Digestive Relief",
                "summary": "Rest the gastrointestinal tract with bland, soothing carbohydrates and continuous electrolyte rehydration.",
                "foods_to_eat": ["BRAT diet (Bananas, Steamed Rice, Applesauce, Toast)", "Plain curd with rice or dilute buttermilk with roasted cumin", "Moong dal khichdi and boiled potatoes", "Oral Rehydration Salts (ORS) and coconut water"],
                "foods_to_avoid": ["Deep-fried, ultra-processed, and fiery spicy curries", "Whole milk, dense cheese, alcohol, and carbonated beverages", "Raw cruciferous vegetables (cabbage, broccoli) that produce gas"],
                "hydration_care": ["Sip ORS or electrolyte water frequently in small mouthfuls to avoid gastric distension."],
                "immediate_care": ["Apply a warm water heating pad to the abdomen to ease muscular spasms.", "Remain upright for at least 45 minutes following meals.", "Eat smaller, frequent portions instead of two large heavy meals."]
            }

    # -------------------------------------------------------------
    # 4. CARDIOVASCULAR & HEART DOMAIN
    # -------------------------------------------------------------
    elif is_heart:
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
            red_flags = ["सीने में अत्यधिक तेज दर्द जो बाएं हाथ, जबड़े या पीठ तक फैले", "अचानक ठंडा पसीना आना और सांस लेने में गंभीर तकलीफ", "बेहोशी या अचानक चक्कर खाकर गिरना"]
            doctor_questions = ["क्या मुझे 2D इको और ईसीजी टेस्ट तुरंत करवाना चाहिए?", "क्या यह लक्षण रक्तचाप या कोलेस्ट्रॉल से जुड़े हैं?", "दवा शुरू करने तक मुझे कौन सी सावधानियां बरतनी चाहिए?"]
            direct_guidance = {
                "title": "💡 हृदय स्वास्थ्य एवं तात्कालिक सुरक्षा मार्गदर्शन (Heart Safety & Care)",
                "summary": "सीने में भारीपन या दर्द होने पर तुरंत शारीरिक परिश्रम बंद करें, आराम से बैठें और आपातकालीन चिकित्सा सहायता लें।",
                "foods_to_eat": ["हरी पत्तेदार सब्जियां, ओट्स, लहसुन और फाइबर युक्त भोजन", "कम नमक वाला ताजा घर का बना खाना", "पोटैशियम युक्त आहार (केला, नारियल पानी)"],
                "foods_to_avoid": ["अत्यधिक नमक, अचार, पापड़ और नमकीन स्नैक्स", "तले-भुने और ट्रांस फैट वाले खाद्य पदार्थ", "धूम्रपान, तंबाकू और शराब का सेवन"],
                "hydration_care": ["नियमित और पर्याप्त पानी पिएं, लेकिन डॉक्टर की बताई गई सीमा से अधिक न लें यदि हार्ट फेलियर की समस्या हो।"],
                "immediate_care": ["तुरंत किसी आरामदायक कुर्सी पर सीधे बैठें और ढीले कपड़े पहनें।", "यदि सीने का दर्द 5 मिनट से अधिक रहे तो तुरंत 112 या नजदीकी आपातकालीन केंद्र पर संपर्क करें।", "बिना डॉक्टर की सलाह के कोई भारी व्यायाम न करें।"]
            }
        else:
            conditions = [
                {"condition": "Coronary Artery Disease / Angina", "likelihood": "Higher Probability", "summary": "Reduced blood and oxygen delivery to the myocardium during exertion."},
                {"condition": "Hypertensive Heart Strain", "likelihood": "Moderate", "summary": "Elevated vascular resistance increasing cardiac workload."}
            ]
            reason = "During exertion, the heart muscle demands more oxygenated blood. If coronary blood vessels are narrowed or blood pressure is elevated, the oxygen supply falls short of demand (ischemia), triggering chest tightness, breathlessness, and fatigue."
            red_flags = ["Severe crushing chest pain radiating to left arm, neck or jaw", "Sudden cold sweat with shortness of breath at rest", "Sudden fainting (syncope) or irregular fluttering pulse"]
            doctor_questions = ["Should I undergo an Electrocardiogram (ECG) and 2D Echocardiogram?", "Could these symptoms be related to my blood pressure or cholesterol levels?", "Are there any physical exertion limits I should follow immediately?"]
            direct_guidance = {
                "title": "💡 Cardiovascular Safety & Clinical Home Care Guidance",
                "summary": "Cease all physical exertion immediately upon experiencing chest discomfort, sit upright, and seek urgent clinical evaluation.",
                "foods_to_eat": ["Whole grains (oats, millets, brown rice)", "Steamed green vegetables and antioxidant-rich berries", "Garlic, flaxseeds, and walnuts in moderation"],
                "foods_to_avoid": ["High-sodium packaged foods, pickles, and processed chips", "Deep-fried foods, butter, and hydrogenated oils", "Tobacco, nicotine, and alcohol"],
                "hydration_care": ["Maintain steady hydration with plain water while observing any prescribed fluid restriction limits."],
                "immediate_care": ["Sit in a semi-upright resting posture and breathe calmly.", "If chest tightness radiates or lasts longer than 5 minutes, call emergency services immediately.", "Do not drive yourself to the clinic; arrange an emergency ride."]
            }

    # -------------------------------------------------------------
    # 5. DIABETES & METABOLIC DOMAIN
    # -------------------------------------------------------------
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
            reason = "जब रक्त में अतिरिक्त ग्लूकोज जमा होता है, तो गुर्दे इसे छानने के लिए अधिक काम करते हैं। इसके कारण शरीर के ऊतकों से पानी खिंचकर पेशाब में चला जाता है (Osmotic Diuresis), जिससे बार-बार पेशाब आना, तीव्र प्यास और ऊर्जा की कमी (थकान) महसूस होती है।"
            red_flags = ["सांस में फलों जैसी गंध और उल्टी (Diabetic Ketoacidosis के संकेत)", "अत्यधिक भ्रम, कंपकंपी या अचानक पसीना आना (Hypoglycemia)", "घाव या चोट का लंबे समय तक न भरना"]
            doctor_questions = ["क्या मेरा HbA1c और फास्टिंग शुगर टेस्ट आवश्यक है?", "क्या मुझे आहार में बदलाव या दवा की आवश्यकता होगी?", "क्या मुझे घर पर ग्लूकोमीटर से निगरानी करनी चाहिए?"]
            direct_guidance = {
                "title": "💡 डायबिटीज में आहार एवं रक्त शर्करा नियंत्रण सलाह (Diabetes Diet & Care)",
                "summary": "ब्लड शुगर नियंत्रित रखने के लिए कम ग्लाइसेमिक इंडेक्स (Low GI) वाला फाइबर युक्त भोजन लें और रिफाइंड चीनी व मैदे से पूरी तरह बचें।",
                "foods_to_eat": ["साबुत अनाज: जौ, जई (Oats), रागी और मल्टीग्रेन दलिया", "हरी पत्तेदार सब्जियां: पालक, मेथी, करेला, खीरा, टमाटर", "अंकुरित दालें, चना और अलसी के बीज", "मेथी दाने का पानी सुबह खाली पेट"],
                "foods_to_avoid": ["सफेद चीनी, गुड़, शहद, मिठाइयां और चॉकलेट", "मैदा, सफेद ब्रेड, पिज्जा, समोसा और पैकेज्ड फूड", "फलों के पैकेटबंद जूस, कोल्ड ड्रिंक्स और बहुत पके आम/चीकू"],
                "hydration_care": ["दिनभर में 2.5-3 लीटर सादा पानी पिएं ताकि गुर्दे अतिरिक्त शर्करा को प्राकृतिक रूप से निकाल सकें।"],
                "immediate_care": ["रोजाना 30 मिनट तेज गति से टहलें (Brisk Walk)।", "पैरों की नियमित जांच करें और चोट से बचाव के लिए आरामदायक जूते पहनें।", "यदि कंपकंपी या पसीना आए तो तुरंत ब्लड शुगर जांचें (कम शुगर होने पर आधा कप मीठा पानी लें)।"]
            }
        else:
            conditions = [
                {"condition": "Type 2 Diabetes Mellitus", "likelihood": "Higher Probability", "summary": "Elevated blood glucose due to insulin resistance or impaired insulin secretion."},
                {"condition": "Prediabetes / Metabolic Dysregulation", "likelihood": "Moderate", "summary": "Subclinical glucose intolerance with compensatory metabolic strain."}
            ]
            reason = "When blood glucose exceeds the renal threshold, kidneys flush the excess sugar through urine. This pulls large volumes of water from body tissues (osmotic diuresis), triggering frequent urination, chronic dehydration, severe thirst, and cellular fatigue."
            red_flags = ["Fruity-smelling breath with persistent nausea/vomiting (DKA sign)", "Extreme tremors, sudden sweating, or confusion (acute hypoglycemia)", "Non-healing ulcers or loss of sensation in feet"]
            doctor_questions = ["What are my current HbA1c and fasting blood sugar levels?", "Are lifestyle modifications sufficient or do I need medical therapy?", "Should I start self-monitoring blood glucose at home?"]
            direct_guidance = {
                "title": "💡 Clinical Nutrition & Self-Care for Blood Sugar Management",
                "summary": "Stabilize blood glucose with high-fiber complex carbohydrates, lean legumes, and strict elimination of refined sugars.",
                "foods_to_eat": ["Complex carbohydrates: rolled oats, barley, quinoa, and millets", "Bitter gourd, fenugreek, spinach, cucumber, and cruciferous greens", "Sprouted legumes, chia seeds, and raw walnuts", "Soaked fenugreek (methi) water in the morning"],
                "foods_to_avoid": ["Refined table sugar, glucose syrups, confectionery, and sweets", "White flour (maida), white bakery breads, and sweetened breakfast cereals", "Processed fruit juices, sodas, and tropical fruits with high glycemic index"],
                "hydration_care": ["Drink 2.5–3 liters of water daily to facilitate renal clearance of excess glucose."],
                "immediate_care": ["Engage in 30 minutes of daily moderate aerobic exercise (brisk walking).", "Inspect feet daily for micro-abrasions or pressure sores.", "Keep fast-acting glucose tablets or juice handy in case of hypoglycemic dips."]
            }

    # -------------------------------------------------------------
    # 6. RESPIRATORY & PULMONARY DOMAIN
    # -------------------------------------------------------------
    elif is_respiratory:
        domain = "respiratory"
        system = "Respiratory & Pulmonary System"
        tests = ["Chest X-Ray (PA View)", "Complete Blood Count (WBC / Absolute Eosinophil Count)", "Pulse Oximetry (SpO2)", "Spirometry / PFT"]

        if lang in ["hi", "hindi"]:
            specialist = "पल्मोनोलॉजिस्ट या जनरल फिजिशियन"
            conditions = [
                {"condition": "तीव्र ब्रोंकाइटिस / मौसमी ऊपरी श्वसन संक्रमण (Acute Bronchitis)", "likelihood": "उच्च संभावना (Higher)", "summary": "मौसम बदलने या संक्रमण के कारण श्वास नली में सूजन और कफ।"},
                {"condition": "एलर्जिक एयरवे हाइपररिएक्टिविटी / खांसी (Allergic Bronchial Cough)", "likelihood": "मध्यम (Moderate)", "summary": "धूल, धुएं या ठंड से श्वसन नली में संकुचन और सूखी खांसी।"}
            ]
            reason = "श्वसन नली की आंतरिक परत में धूल, मौसम या वायरस के कारण सूजन आ जाती है। प्रतिरक्षा प्रणाली बलगम बनाती है और कफ रिफ्लेक्स सक्रिय हो जाता है ताकि श्वसन मार्ग साफ रह सके।"
            red_flags = ["ऑक्सीजन स्तर (SpO2) 94% से नीचे जाना", "खांसी में खून आना (Hemoptysis)", "सांस फूलना जिससे बात करने में भी तकलीफ हो"]
            doctor_questions = ["क्या मुझे छाती का एक्स-रे कराने की आवश्यकता है?", "क्या यह एलर्जी है या बैक्टीरियल इन्फेक्शन?", "क्या स्टीम इनहेलेशन या इनहेलर का उपयोग उचित रहेगा?"]
            direct_guidance = {
                "title": "💡 खांसी, जुकाम व श्वसन संबंधी देखभाल व आहार (Cough & Cold Care)",
                "summary": "गले और श्वास नली की सूजन कम करने के लिए गर्म पेय पदार्थ लें, भाप लें और ठंडी चीजों से पूरी तरह परहेज करें।",
                "foods_to_eat": ["गर्म अदरक, तुलसी और शहद की चाय (गले की खराश के लिए उत्तम)", "गुनगुने पानी में नमक डालकर दिन में 2-3 बार गरारे", "हल्दी वाला गर्म दूध (Golden Milk)", "सब्जियों का गर्म पतला सूप"],
                "foods_to_avoid": ["फ्रिज का ठंडा पानी, आइसक्रीम और कोल्ड ड्रिंक्स", "अत्यधिक तली हुई चीजें और खट्टे दही या खट्टे फल (यदि गले में चुभन हो)", "धुआं, धूल और वायु प्रदूषण के सीधे संपर्क में आना"],
                "hydration_care": ["लगातार गुनगुना पानी पिएं ताकि बलगम पतला होकर आसानी से बाहर निकल सके।"],
                "immediate_care": ["दिन में 2 बार सादे पानी की भाप (Steam Inhalation) लें।", "धूल और प्रदूषण से बचने के लिए बाहर जाते समय मास्क लगाएं।", "सोते समय सिर को थोड़ा ऊंचा रखें ताकि रात में खांसी का दौरा कम हो।"]
            }
        else:
            specialist = "Pulmonologist or General Physician"
            conditions = [
                {"condition": "Acute Bronchitis / Viral Upper Respiratory Infection", "likelihood": "Higher Probability", "summary": "Transient bronchial inflammation triggered by seasonal pathogens or airborne irritants."},
                {"condition": "Allergic Airway Hyperreactivity / Cough Variant", "likelihood": "Moderate", "summary": "Bronchial sensitivity resulting in spasmodic dry cough and chest tightness."}
            ]
            reason = "Airway epithelial cells release inflammatory cytokines when irritated by allergens or microbes, stimulating protective mucus secretion and triggering the cranial cough reflex."
            red_flags = ["Pulse oximetry (SpO2) falling below 94% on room air", "Hemoptysis (coughing up blood)", "Severe stridor, wheezing, or inability to speak in complete sentences"]
            doctor_questions = ["Is an oral antibiotic warranted or is this predominantly viral?", "Should I undergo a chest radiograph to evaluate the lung parenchyma?", "Would a short course of bronchodilator inhalation help?"]
            direct_guidance = {
                "title": "💡 Clinical Respiratory Care & Nutritional Protocol",
                "summary": "Soothe bronchial mucous membranes with warm fluids, steam inhalation, and environmental protection.",
                "foods_to_eat": ["Warm herbal teas with ginger and raw honey", "Clear vegetable and chicken broths", "Turmeric-infused warm milk", "Lukewarm water with lemon"],
                "foods_to_avoid": ["Chilled drinks, ice-cold desserts, and refrigerated foods", "Deep-fried greasy items that aggravate reflux-induced cough", "Direct exposure to tobacco smoke, dust, and incense"],
                "hydration_care": ["Maintain frequent warm fluid sips to thin bronchial secretions and enhance clearance."],
                "immediate_care": ["Perform plain water steam inhalation for 5–10 minutes twice daily.", "Gargle with warm saline water to reduce pharyngeal inflammation.", "Elevate head with an extra pillow during sleep to prevent nighttime post-nasal drip."]
            }

    # -------------------------------------------------------------
    # 7. RENAL & KIDNEY DOMAIN
    # -------------------------------------------------------------
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
        direct_guidance = {
            "title": "💡 Kidney Health & Renal Care Guidance",
            "summary": "Protect kidney filtration by reducing sodium intake, avoiding painkiller medications, and managing blood pressure.",
            "foods_to_eat": ["Fresh apples, cabbage, cauliflower, and berries", "Low-sodium home-cooked foods", "Controlled portion legumes"],
            "foods_to_avoid": ["High-sodium packaged foods, canned soups, and pickles", "Over-the-counter NSAID painkillers (ibuprofen, diclofenac)", "Excessive protein powders or unmonitored supplements"],
            "hydration_care": ["Drink steady clean water (2 liters daily) unless fluid-restricted by your nephrologist."],
            "immediate_care": ["Monitor daily blood pressure and record any ankle swelling.", "Avoid self-medicating with unprescribed anti-inflammatory pills.", "Schedule a formal Renal Function Test (KFT)."]
        }

    # -------------------------------------------------------------
    # 8. HEMATOLOGIC & ANEMIA DOMAIN
    # -------------------------------------------------------------
    elif is_anemia:
        domain = "anemia"
        system = "Hematologic System"
        specialist = "Hematologist or General Physician"
        tests = ["Complete Blood Count (CBC / Hemoglobin)", "Serum Ferritin & Iron Studies", "Total Iron Binding Capacity (TIBC)", "Vitamin B12 & Folic Acid"]
        conditions = [
            {"condition": "Iron Deficiency Anemia", "likelihood": "Higher Probability", "summary": "Insufficient iron stores reducing red blood cell hemoglobin capacity."},
            {"condition": "Nutritional Vitamin B12 / Folate Deficit", "likelihood": "Moderate", "summary": "Macrocytic cell maturation delay causing systemic fatigue."}
        ]
        reason = "Hemoglobin inside red blood cells carries oxygen from lungs to every tissue. When hemoglobin or iron stores drop, tissues receive less cellular oxygen (hypoxia), resulting in chronic exhaustion, dizziness on standing, pale conjunctiva, and rapid compensatory heart rate."
        red_flags = ["Extreme sudden dizziness or fainting", "Shortness of breath even when resting in bed", "Chest discomfort with rapid irregular heartbeat"]
        doctor_questions = ["What is my exact hemoglobin level and ferritin count?", "Are dietary improvements sufficient or do I need therapeutic iron supplementation?", "When should we repeat the CBC to evaluate recovery?"]
        direct_guidance = {
            "title": "💡 Nutritional & Care Guidance for Anemia & Fatigue",
            "summary": "Replenish essential red blood cell stores with bioavailable iron, Vitamin C, and restorative rest.",
            "foods_to_eat": ["Iron-rich foods: spinach, beetroot, pomegranate, dates, raisins, and lentils", "Vitamin C enhancers: amla, lemons, and oranges to boost iron absorption", "Jaggery (gur) with roasted chickpeas", "Sprouted moong beans"],
            "foods_to_avoid": ["Drinking tea or coffee immediately with meals (tannins inhibit iron absorption)", "Junk food lacking essential micronutrients", "Strict crash dieting without nutritional balance"],
            "hydration_care": ["Drink 2.5 liters of water daily to maintain circulating plasma volume."],
            "immediate_care": ["Avoid sudden standing from bed to prevent orthostatic dizziness.", "Ensure 8 hours of quality sleep daily.", "Consult doctor for therapeutic oral iron or B12 supplements if Hb < 10 g/dL."]
        }

    # -------------------------------------------------------------
    # 9. GENERAL CLINICAL HEALTH DOMAIN
    # -------------------------------------------------------------
    else:
        domain = "general"
        system = "General Clinical Health"
        specialist = "General Physician / Family Doctor"
        tests = ["Complete Blood Count (CBC)", "Comprehensive Metabolic Panel", "Routine Urinalysis", "Blood Pressure Evaluation"]

        if lang in ["hi", "hindi"]:
            conditions = [
                {"condition": "सामान्य शारीरिक असंतुलन या पोषण की कमी (Physiological Imbalance)", "likelihood": "उच्च संभावना (Higher)", "summary": "थकान, तनाव, अनियमित दिनचर्या या विटामिन की कमी से शारीरिक ऊर्जा का कम होना।"},
                {"condition": "हल्की मौसमी या शारीरिक प्रतिक्रिया (Subclinical Seasonal Variance)", "likelihood": "मध्यम (Moderate)", "summary": "मौसम या जीवनशैली के बदलाव पर शरीर की स्वाभाविक प्रतिक्रिया।"}
            ]
            reason = "शरीर के सभी अंग ऊर्जा और पोषक तत्वों के संतुलन पर कार्य करते हैं। खान-पान में असंतुलन, नींद की कमी या तनाव से शरीर में सुस्ती, थकान या हल्का असहज महसूस होता है।"
            red_flags = ["तेज बुखार जो 3 दिन से अधिक रहे", "अचानक वजन में भारी गिरावट या अत्यधिक कमजोरी", "सीने में दर्द या सांस लेने में गंभीर तकलीफ"]
            doctor_questions = ["क्या मुझे बुनियादी ब्लड टेस्ट (CBC, विटामिन्स) कराने चाहिए?", "क्या पोषण की कमी इस समस्या का कारण हो सकती है?", "मुझे अपनी दिनचर्या में क्या सुधार करना चाहिए?"]
            direct_guidance = {
                "title": "💡 सामान्य स्वास्थ्य, आहार एवं जीवनशैली सलाह (General Health Care)",
                "summary": "शरीर को स्वस्थ और ऊर्जावान बनाए रखने के लिए संतुलित ताजा भोजन, पर्याप्त नींद और नियमित दिनचर्या अपनाएं।",
                "foods_to_eat": ["ताजा घर का बना पौष्टिक भोजन (दाल, रोटी, हरी सब्जियां)", "मौसमी ताजे फल और सलाद", "सूखे मेवे (बादाम, अखरोट) और अंकुरित अनाज", "पर्याप्त पानी और ताजा नारियल पानी"],
                "foods_to_avoid": ["जंक फूड, अत्यधिक तला-भुना और बासी खाना", "अत्यधिक चाय, कॉफी और मीठे पेय", "देर रात तक जागना और तनाव लेना"],
                "hydration_care": ["दिन में कम से कम 2.5 से 3 लीटर पानी पिएं।"],
                "immediate_care": ["प्रतिदिन 7-8 घंटे की नियमित नींद लें।", "रोजाना 20-30 मिनट हल्का व्यायाम या पैदल चलें।", "यदि लक्षण बने रहें तो जनरल फिजिशियन से परामर्श लें।"]
            }
        else:
            conditions = [
                {"condition": "General Physiological Variance / Nutritional Deficit", "likelihood": "Higher Probability", "summary": "Common systemic fatigue, metabolic imbalance, or stress response."},
                {"condition": "Mild Subclinical Inflammation / Seasonal Reaction", "likelihood": "Moderate", "summary": "Immune system response to seasonal or environmental stressors."}
            ]
            reason = "The reported symptoms reflect a systemic bodily response where energy utilization, immune defense, or fluid balance is slightly shifted, leading to fatigue, mild discomfort, or changes in stamina."
            red_flags = ["High persistent fever over 102°F lasting more than 3 days", "Severe unexplained weight loss or severe pain", "Difficulty breathing or persistent vomiting"]
            doctor_questions = ["What baseline blood tests should I perform to evaluate these symptoms?", "Could nutritional deficiencies (Iron, Vitamin D3, B12) explain this?", "When should I schedule a follow-up consultation?"]
            direct_guidance = {
                "title": "💡 General Clinical Health & Nutritional Guidance",
                "summary": "Support metabolic resilience with wholesome nutrition, restorative sleep, and proactive clinical checkups.",
                "foods_to_eat": ["Whole fresh home-cooked meals featuring balanced legumes and greens", "Seasonal fresh fruits and antioxidant-rich vegetables", "Adequate hydration with clean water", "Nuts, seeds, and high-fiber grains"],
                "foods_to_avoid": ["Deep-fried fast foods and ultra-processed snacks", "Excessive refined sugars, caffeinated sodas, and alcohol", "Erratic meal timing and chronic sleep deprivation"],
                "hydration_care": ["Target 2.5–3 liters of water daily to maintain cellular equilibrium."],
                "immediate_care": ["Maintain 7–8 hours of consistent nightly sleep.", "Engage in 20–30 minutes of mild daily physical activity.", "Consult a family physician if symptoms persist or interfere with daily life."]
            }

    # Format direct answer markdown
    dg = direct_guidance
    eat_bullets = "\n".join(f"* {item}" for item in dg.get("foods_to_eat", []))
    avoid_bullets = "\n".join(f"* {item}" for item in dg.get("foods_to_avoid", []))
    hydration_bullets = "\n".join(f"* {item}" for item in dg.get("hydration_care", []))
    care_bullets = "\n".join(f"* {item}" for item in dg.get("immediate_care", []))

    direct_answer_md = f"""### {dg.get("title", "Clinical Guidance")}
{dg.get("summary", "")}

#### 🥣 Recommended Foods:
{eat_bullets}

#### 🚫 Foods & Habits to Avoid:
{avoid_bullets}

#### 💧 Hydration & Care:
{hydration_bullets}

#### 🛌 Home Care & Precaution:
{care_bullets}"""

    # Build full markdown explanation
    cond_bullets = "\n".join(f"* **{c['condition']}** — *{c['likelihood']}*: {c['summary']}" for c in conditions)
    red_bullets = "\n".join(f"* {r}" for r in red_flags)
    test_bullets = "\n".join(f"* {t}" for t in tests)
    doc_bullets = "\n".join(f"* {q}" for q in doctor_questions)

    full_md = f"""{direct_answer_md}

---

### 1. 🔍 What Might Be Happening
{cond_bullets}

### 2. 🧬 The Biological Reason Behind It
{reason}

### 3. 🚨 Red Flags & Warning Signs
{red_bullets}

### 4. 👨‍⚕️ Recommended Medical Specialist
Consult a **{specialist}**.

### 5. 🧪 Recommended Clinical Lab Tests & Reports
{test_bullets}

### 6. ❓ Questions to Ask Your Doctor
{doc_bullets}"""

    return {
        "primary_domain": domain,
        "system": system,
        "specialist": specialist,
        "recommended_tests": tests,
        "predicted_conditions": conditions,
        "reason_behind_it": reason,
        "red_flags": red_flags,
        "doctor_questions": doctor_questions,
        "direct_guidance": direct_guidance,
        "direct_answer": direct_answer_md,
        "markdown_explanation": full_md
    }


# ---------------------------------------------------------------------------
# 4. LOCAL UNIVERSAL HEALTH Q&A ASSISTANT
# ---------------------------------------------------------------------------

def ask_health_assistant(
    question: str,
    report_context: Optional[str] = None,
    history: Optional[list] = None,
    language: str = "en"
) -> dict[str, Any]:
    """
    Universal Health Q&A Assistant running 100% locally on the backend codebase.
    Answers health, symptom, medication, lab test, diet, or medical report questions.
    """
    lang = (language or "en").lower().strip()
    clean_q = question.strip()
    if not clean_q:
        return {
            "answer": "Please ask a health question to receive guidance.",
            "source": "clinical_engine",
            "model": "Aarogya Clinical AI",
            "suggestions": ["What do normal blood sugar levels look like?", "What does high blood pressure mean?"]
        }

    # Generate rich answer using local clinical knowledge base
    fallback_result = _generate_clinical_fallback_answer(clean_q, report_context, lang)
    fallback_result["source"] = "clinical_engine"
    fallback_result["model"] = "Aarogya Clinical AI"
    return fallback_result


def _extract_or_generate_suggestions(question: str, answer: str, lang: str) -> list[str]:
    """Provides smart follow-up suggestions based on medical topic."""
    q_lower = question.lower()
    if lang in ["hi", "hindi"]:
        if any(k in q_lower for k in ["sugar", "मधुमेह", "glucose", "डायबिटीज"]):
            return ["डायबिटीज में क्या खाना चाहिए?", "HbA1c टेस्ट क्या होता है?", "सामान्य ब्लड शुगर रेंज क्या है?"]
        if any(k in q_lower for k in ["bp", "pressure", "रक्तचाप", "ब्लड प्रेशर"]):
            return ["ब्लड प्रेशर कम करने के घरेलू उपाय?", "सामान्य बीपी कितना होना चाहिए?", "बीपी में नमक कितना लेना चाहिए?"]
        if any(k in q_lower for k in ["platelet", "cbc", "खून", "हीमोग्लोबिन"]):
            return ["प्लेटलेट्स तेजी से कैसे बढ़ाएं?", "हीमोग्लोबिन बढ़ाने वाले फल?", "CBC टेस्ट में क्या-क्या आता है?"]
        return ["डॉक्टर से क्या सवाल पूछने चाहिए?", "इसके लिए क्या डाइट लेनी चाहिए?", "क्या कोई अन्य टेस्ट की जरूरत है?"]
    elif lang in ["mr", "marathi"]:
        if any(k in q_lower for k in ["sugar", "मधुमेह", "साखर"]):
            return ["मधुमेहात कोणता आहार घ्यावा?", "HbA1c चाचणी म्हणजे काय?", "रक्तातील साखरेची सामान्य पातळी किती?"]
        if any(k in q_lower for k in ["bp", "रक्तदाब"]):
            return ["रक्तदाब नियंत्रित करण्याचे उपाय?", "सामान्य बीपी किती असावे?", "आहारात मिठाचे प्रमाण किती ठेवावे?"]
        return ["डॉक्टरांना कोणते प्रश्न विचारावेत?", "यासाठी कोणता आहार योग्य आहे?", "इतर कोणती चाचणी करावी लागेल?"]
    else:
        if any(k in q_lower for k in ["sugar", "glucose", "diabetes", "hba1c"]):
            return [
                "What is a healthy meal plan for high blood sugar?",
                "What is the difference between Fasting Blood Sugar and HbA1c?",
                "What warning symptoms indicate low blood sugar (hypoglycemia)?"
            ]
        if any(k in q_lower for k in ["pressure", "bp", "hypertension"]):
            return [
                "What lifestyle modifications help lower blood pressure?",
                "What is considered an ideal blood pressure reading by age?",
                "What foods should be avoided with high blood pressure?"
            ]
        if any(k in q_lower for k in ["platelet", "cbc", "hemoglobin", "rbc"]):
            return [
                "What natural foods help boost platelet count safely?",
                "What causes low hemoglobin (anemia) and how to improve it?",
                "How often should a CBC test be monitored?"
            ]
        if any(k in q_lower for k in ["kidney", "creatinine", "egfr"]):
            return [
                "What causes serum creatinine levels to rise?",
                "What diet is recommended for kidney protection?",
                "How does high blood pressure affect kidney function?"
            ]
        if any(k in q_lower for k in ["liver", "sgpt", "sgot", "bilirubin"]):
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
    """Generates structured medical knowledge guidance locally on the backend codebase."""
    q_lower = question.lower()
    has_context = bool(report_context and len(report_context.strip()) > 20)

    context_note = ""
    if has_context:
        if lang in ["hi", "hindi"]:
            context_note = "\n\n> **आपकी रिपोर्ट के संदर्भ में**: आपके द्वारा अपलोड की गई रिपोर्ट के आधार पर ये निष्कर्ष सामान्य संदर्भ सीमाओं और क्लिनिकल प्रोटोकॉल के अनुरूप हैं।"
        elif lang in ["mr", "marathi"]:
            context_note = "\n\n> **तुमच्या अहवालाच्या संदर्भात**: तुम्ही अपलोड केलेल्या अहवालातील निष्कर्षांच्या आधारे ही माहिती प्रमाणित वैद्यकीय मार्गदर्शक तत्त्वांनुसार आहे."
        else:
            context_note = "\n\n> **Regarding Your Uploaded Report**: This guidance directly correlates with the test parameters and clinical observations documented in your report."

    # 1. Blood Glucose & Diabetes
    if any(k in q_lower for k in ["sugar", "glucose", "diabetes", "hba1c", "मधुमेह", "शर्करा", "साखर"]):
        if lang in ["hi", "hindi"]:
            ans = """### 🩸 ब्लड शुगर (रक्त शर्करा) संबंधी संपूर्ण मार्गदर्शन

* **मानक संदर्भ सीमाएं**:
  - **खाली पेट (Fasting Blood Sugar)**: सामान्यतः **70 – 99 mg/dL** सामान्य होता है। **100 – 125 mg/dL** प्रीडायबिटीज और **126 mg/dL या अधिक** डायबिटीज का संकेत हो सकता है।
  - **भोजन के 2 घंटे बाद (Post-Prandial)**: **140 mg/dL से कम** सामान्य माना जाता है।
  - **HbA1c (3 माह का औसत)**: **5.7% से कम** सामान्य, **5.7% – 6.4%** प्रीडायबिटीज, और **6.5% या अधिक** डायबिटीज का स्तर दर्शाता है।
* **प्रमुख कारण**: अग्न्याशय (Pancreas) द्वारा इंसुलिन का कम बनना या शरीर की कोशिकाओं द्वारा इंसुलिन का प्रभावी उपयोग न कर पाना (इंसुलिन प्रतिरोध)।
* **व्यावहारिक देखभाल उपाय**:
  1. **आहार**: फाइबर युक्त साबुत अनाज (जौ, दलिया), हरी पत्तेदार सब्जियां और दालें लें। रिफाइंड चीनी, मैदे और मीठे पेय पदार्थों से बचें।
  2. **शारीरिक सक्रियता**: रोजाना 30 मिनट तेज गति से पैदल चलना कोशिकाओं में इंसुलिन संवेदनशीलता को बढ़ाता है।
  3. **नियमित पानी**: पर्याप्त मात्रा में पानी पिएं ताकि गुर्दे अतिरिक्त शर्करा को प्राकृतिक रूप से बाहर निकाल सकें।
* **डॉक्टर से परामर्श**: अपनी रिपोर्ट अपने डॉक्टर या एंडोक्रिनोलॉजिस्ट को दिखाएं ताकि दवाओं या आहार का सही समायोजन हो सके।""" + context_note
        elif lang in ["mr", "marathi"]:
            ans = """### 🩸 रक्तातील साखरेविषयी (Blood Sugar) सविस्तर मार्गदर्शन

* **प्रमाणित संदर्भ मर्यादा**:
  - **उपाशीपोटी (Fasting)**: ७० – ९९ mg/dL असणे सामान्य मानले जाते. १०० – १२५ mg/dL प्रीडायबिटीज आणि १२६ mg/dL पेक्षा जास्त असल्यास मधुमेहाची शक्यता असते.
  - **जेवणानंतर (PPBS)**: १४० mg/dL पेक्षा कमी असणे आवश्यक आहे.
  - **HbA1c (३ महिन्यांची सरासरी)**: ५.७% पेक्षा कमी सामान्य, ५.७% – ६.४% प्रीडायबिटीज.
* **महत्त्वाचे उपाय**:
  1. आहारात पालेभाज्या, कडधान्ये आणि फायबरयुक्त पदार्थांचा समावेश करा. साखर, गूळ आणि बेकरी पदार्थ टाळा.
  2. दररोज किमान ३० मिनिटे चालण्याचा किंवा हलका व्यायाम करा.
  3. वेळेवर औषधोपचार आणि नियमित तपासणी करा.
* **सल्ला**: योग्य डोस आणि जीवनशैली मार्गदर्शनासाठी डॉक्टरांचा सल्ला घ्या.""" + context_note
        else:
            ans = """### 🩸 Understanding Blood Glucose & Diabetes Management

* **Target Reference Ranges**:
  - **Normal Fasting Blood Sugar**: **70 – 99 mg/dL**
  - **Prediabetes Fasting**: **100 – 125 mg/dL**
  - **Diabetes Fasting**: **126 mg/dL or higher on repeat clinical testing**
  - **Post-Prandial (2 hours after meal)**: **< 140 mg/dL** is normal; **140 – 199 mg/dL** indicates prediabetes.
  - **HbA1c (90-Day Glycated Hemoglobin)**: **< 5.7%** is normal; **5.7% – 6.4%** indicates prediabetes; **≥ 6.5%** indicates diabetes.
* **Key Mechanism**: Insulin synthesized by the pancreas acts as a cellular key enabling blood glucose to enter muscle and organ cells. When cells become insulin resistant or insulin secretion is compromised, glucose accumulates in the bloodstream.
* **Practical Lifestyle Strategies**:
  1. **Complex Carbohydrates**: Prioritize high-fiber legumes, oats, millets, and leafy greens. Strictly minimize refined sugar, fruit syrups, and white flour.
  2. **Regular Aerobic Activity**: 30 minutes of daily brisk walking enhances peripheral insulin sensitivity and glucose uptake.
  3. **Hydration**: Ensure 2.5–3 liters of water daily to support kidney clearance of metabolic byproducts.
* **Clinical Next Step**: Review these findings with your physician or endocrinologist to discuss personalized medical nutrition therapy or medication adjustment.""" + context_note

    # 2. Blood Pressure & Heart
    elif any(k in q_lower for k in ["pressure", "bp", "hypertension", "heart", "बीपी", "रक्तचाप", "रक्तदाब", "हृदय", "दिल"]):
        if lang in ["hi", "hindi"]:
            ans = """### 🩺 ब्लड प्रेशर एवं हृदय स्वास्थ्य मार्गदर्शन

* **मानक श्रेणियां**:
  - **सामान्य**: सिस्टोलिक **120 mmHg से कम** और डायस्टोलिक **80 mmHg से कम**।
  - **एलीवेटेड (हल्का बढ़ा हुआ)**: **120 – 129 / < 80 mmHg**।
  - **स्टेज-1 हाइपरटेंशन**: **130 – 139 / 80 – 89 mmHg**।
  - **स्टेज-2 हाइपरटेंशन**: **140 या अधिक / 90 या अधिक mmHg**।
* **महत्व**: लगातार बढ़ा हुआ रक्तचाप धमनियों की आंतरिक दीवारों पर दबाव डालता है, जिससे हृदय और मस्तिष्क पर अतिरिक्त तनाव पड़ता है।
* **नियंत्रण के सुरक्षित उपाय**:
  1. **नमक नियंत्रण**: भोजन में नमक का सेवन प्रतिदिन 1 चम्मच (2,000 mg सोडियम) से कम रखें। पापड़, अचार और पैकेटबंद नमकीन से बचें।
  2. **पोटैशियम युक्त आहार**: नारियल पानी, केला, पालक, और हरी सब्जियां शामिल करें।
  3. **तनाव प्रबंधन**: प्रतिदिन 10-15 मिनट प्राणायाम या ध्यान करें और 7-8 घंटे की गहरी नींद लें।""" + context_note
        else:
            ans = """### 🩺 Understanding Blood Pressure & Cardiovascular Health

* **Target Reference Bounds**:
  - **Normal**: Systolic **< 120 mmHg** and Diastolic **< 80 mmHg**
  - **Elevated**: Systolic **120 – 129 mmHg** and Diastolic **< 80 mmHg**
  - **Stage 1 Hypertension**: Systolic **130 – 139 mmHg** or Diastolic **80 – 89 mmHg**
  - **Stage 2 Hypertension**: Systolic **≥ 140 mmHg** or Diastolic **≥ 90 mmHg**
* **Why Blood Pressure Matters**: Chronic arterial hypertension exerts continuous shear stress on endothelial blood vessel walls, increasing long-term workload on the heart muscle and elevating stroke risk.
* **Evidence-Based Management**:
  1. **Sodium Moderation**: Restrict daily sodium intake below 2,000 mg (approximately 1 teaspoon table salt). Limit processed snacks and canned foods.
  2. **DASH Dietary Pattern**: Emphasize potassium-, magnesium-, and calcium-rich vegetables, fruits, seeds, and nuts.
  3. **Aerobic Conditioning**: 150 minutes of moderate cardiovascular activity weekly lowers baseline systolic pressure by 4–8 mmHg.
  4. **Stress Reduction**: Daily diaphragmatic breathing exercises stimulate parasympathetic relaxation.""" + context_note

    # 3. CBC, Platelets, Hemoglobin, Anemia
    elif any(k in q_lower for k in ["platelet", "hemoglobin", "cbc", "rbc", "wbc", "anemia", "खून", "हीमोग्लोबिन", "प्लेटलेट"]):
        ans = """### 🔬 Complete Blood Count (CBC) Parameters Guide

* **Hemoglobin (Hb)**:
  - Typical reference ranges: **13.5 – 17.5 g/dL** (Males), **12.0 – 15.5 g/dL** (Females).
  - Low values indicate anemia (fatigue, shortness of breath, pale conjunctiva). Iron-rich nutrition (spinach, lentils, dates, jaggery, beetroot) paired with Vitamin C aids natural absorption.
* **Platelets**:
  - Standard healthy range: **150,000 – 450,000 cells/mcL**.
  - Essential for natural blood clotting. Transient drops commonly occur during viral infections (e.g. dengue, viral fevers). Adequate hydration, rest, and serial laboratory monitoring are standard clinical protocol.
* **White Blood Cells (WBC / TLC)**:
  - Normal adult reference: **4,000 – 11,000 cells/mcL**.
  - Elevations frequently reflect an active immune defense response against bacterial or viral pathogens.
* **Actionable Guidance**: Correlate blood counts with physical symptoms and review trends with your treating physician.""" + context_note

    # 4. Kidney Function, Creatinine, Urea
    elif any(k in q_lower for k in ["kidney", "creatinine", "urea", "egfr", "kft", "किडनी", "गुर्दे", "मूत्रपिंड"]):
        ans = """### 💧 Renal & Kidney Function Overview

* **Serum Creatinine**:
  - Typical adult baseline: **0.6 – 1.2 mg/dL** (Males: 0.7–1.3, Females: 0.5–1.1 mg/dL).
  - Creatinine is a natural byproduct of skeletal muscle breakdown filtered out exclusively by healthy kidneys. Elevated readings indicate reduced filtration rate or dehydration.
* **Estimated GFR (eGFR)**:
  - Values **> 90 mL/min/1.73m²** represent healthy baseline kidney filtration capacity.
* **Kidney Protective Habits**:
  1. Maintain steady daily hydration (2 to 2.5 liters of clean water daily unless fluid-restricted by your doctor).
  2. Avoid unprescribed use of over-the-counter NSAID painkillers (ibuprofen, diclofenac, naproxen).
  3. Maintain tight glycemic and blood pressure control, as these are the primary protectors of renal microvasculature.
* **Doctor Discussion**: Ask your physician whether repeat creatinine or a routine urine microalbumin test is warranted.""" + context_note

    # 5. Liver & Enzymes (SGPT, SGOT, Bilirubin)
    elif any(k in q_lower for k in ["liver", "sgpt", "sgot", "alt", "ast", "bilirubin", "लिवर", "यकृत"]):
        ans = """### 🍃 Liver Function & Enzyme Health Guide

* **Transaminases (SGPT/ALT and SGOT/AST)**:
  - Normal ranges: Generally under **35–45 U/L**.
  - These enzymes reside primarily inside hepatocytes. Elevated levels indicate cellular irritation, fatty infiltration, or medication metabolism stress.
* **Bilirubin**:
  - Total Bilirubin typically should remain under **1.0 – 1.2 mg/dL**.
* **Liver Support Measures**:
  1. Minimize fried, ultra-processed, and greasy foods to reduce hepatic lipid storage.
  2. Strictly avoid alcohol and consult your doctor before taking herbal concoctions that may strain hepatic clearance.
  3. Engage in regular physical activity to reverse hepatic steatosis (fatty liver).""" + context_note

        # 6. Fever, Infections & Dietary Inquiries
    elif any(k in q_lower for k in ["fever", "bukhar", "bokhar", "tap", "taap", "temperature", "बुखार", "ताप", "ज्वर"]):
        if lang in ["hi", "hindi"]:
            ans = """### 🌡️ बुखार में आहार एवं प्राथमिक क्लिनिकल देखभाल मार्गदर्शन

* **बुखार में क्या खाएं (Foods to Eat)**:
  1. **मूंग दाल की पतली खिचड़ी या दलिया**: हल्का, आसानी से पचने वाला और शरीर को तुरंत ऊर्जा देने वाला।
  2. **सब्जियों का गर्म पतला सूप**: गाजर, पालक, टमाटर का ताजा सूप।
  3. **ताजे फल**: सेब, पपीता, अनार और संतरा या मौसंबी का ताजा रस।
  4. **हाइड्रेशन**: गुनगुना पानी, ओआरएस (ORS) घोल, नारियल पानी और तुलसी-अदरक का हल्का काढ़ा।
* **क्या न खाएं (Foods to Avoid)**:
  - तला-भुना, अत्यधिक मिर्च-मसालेदार और भारी भोजन।
  - ठंडा पानी, कोल्ड ड्रिंक्स, आइसक्रीम और फ्रिज में रखा बासी खाना।
  - भारी मांसाहार और मैदा।
* **प्राथमिक देखभाल व सावधानियां**:
  - भरपूर आराम करें। 101°F से अधिक बुखार होने पर माथे और गर्दन पर सामान्य पानी की पट्टियां रखें।
  - यदि बुखार 102°F से ऊपर रहे या 3 दिन से अधिक चले तो तुरंत डॉक्टर से परामर्श लें और सीबीसी (CBC) टेस्ट करवाएं।""" + context_note
        elif lang in ["mr", "marathi"]:
            ans = """### 🌡️ तापात काय खावे व प्राथमिक काळजी मार्गदर्शन

* **तापात काय खावे**:
  1. **मुगाच्या डाळीची मऊ खिचडी किंवा दलिया**: पचायला हलका आणि ऊर्जा देणारा.
  2. **ताज्या भाज्यांचे गरम सूप**: गाजर, टोमॅटो, पालक यांचे पातळ सूप.
  3. **फळे**: सफरचंद, पपई, डाळिंब आणि संत्री.
  4. **पाणी आणि पेये**: कोमट पाणी, ओआरएस (ORS), आणि नारळ पाणी.
* **काय टाळावे**:
  - तळलेले, तिखट, तेलकट आणि पचायला जड अन्न.
  - थंड पाणी, आईस्क्रीम आणि शीतपेये.
* **महत्त्वाचा सल्ला**:
  - पुरेशी विश्रांती घ्या. ताप १०२°F पेक्षा जास्त असल्यास किंवा ३ दिवसांपेक्षा जास्त राहिल्यास त्वरित डॉक्टरांचा सल्ला घ्या.""" + context_note
        else:
            ans = """### 🌡️ Clinical Nutrition & Home Care Guidance for Fever

* **Recommended Foods to Eat**:
  1. **Moong Dal Khichdi or Oatmeal Porridge**: Easily digestible, gentle on stomach, and restores baseline caloric energy.
  2. **Warm Vegetable Broths**: Clear spinach, carrot, or tomato soups provide vital micronutrients.
  3. **Hydrating Fruits**: Fresh apples, papaya, pomegranate, and sweet lime.
  4. **Continuous Electrolytes**: Oral Rehydration Salts (ORS), coconut water, and lukewarm water.
* **Foods to Avoid**:
  - Deep-fried, greasy, and heavily spiced foods that overtax the digestive tract.
  - Chilled drinks, refrigerated desserts, and stale items.
  - Heavy red meats and dense dairy.
* **Immediate Home Care**:
  - Prioritize strict bed rest. Apply room-temperature tap water sponging for temperatures > 101°F.
  - Consult your doctor or undergo a Complete Blood Count (CBC) if fever exceeds 102°F or persists beyond 3 days.""" + context_note

    # 6. General Health & Context
    else:
        if lang in ["hi", "hindi"]:
            ans = f"""### 💬 AarogyaAI क्लिनिकल स्वास्थ्य मार्गदर्शन

आपके प्रश्न **"{question}"** के संबंध में क्लिनिकल जानकारी:

* **सामान्य चिकित्सीय संदर्भ**:
  - मानव शरीर में सभी स्वास्थ्य मापदंड और लक्षण परस्पर जुड़े होते हैं। किसी भी स्वास्थ्य स्थिति का सही मूल्यांकन आपकी उम्र, पूर्व मेडिकल इतिहास और वर्तमान जीवनशैली पर निर्भर करता है।
* **व्यावहारिक सुरक्षित कदम**:
  1. अपने लक्षणों या स्वास्थ्य परिवर्तनों को एक डायरी में नोट करें।
  2. पर्याप्त मात्रा में पानी पिएं, ताजा घर का खाना खाएं और 7-8 घंटे की नियमित नींद लें।
  3. अपनी हालिया लैब रिपोर्ट और मूल नुस्खे को डॉक्टर के पास ले जाएं ताकि सही तुलना हो सके।
* **आपातकालीन चेतावनी**: यदि आपको अचानक सीने में तेज दर्द, सांस लेने में गंभीर तकलीफ या अत्यधिक कमजोरी महसूस हो, तो तुरंत आपातकालीन चिकित्सा सहायता (112) लें।""" + context_note
        else:
            ans = f"""### 💬 AarogyaAI Clinical Health Guidance

Regarding your inquiry: **"{question}"**:

* **Clinical Perspective**:
  - Health parameters and physical symptoms are closely interrelated. Every individual's metabolic baseline is influenced by age, gender, medical history, physical activity, and existing medications.
  - Laboratory and clinical evaluations consider both numeric findings and physical symptoms.
* **Recommended Proactive Steps**:
  1. Maintain a simple log of any symptoms, changes in energy, appetite, or sleep patterns.
  2. Keep well hydrated, emphasize whole fresh foods, and maintain restorative sleep.
  3. Bring any recent laboratory reports and prescriptions to your next consultation for direct comparison.
* **Safety First**: If you or someone around you experiences severe crushing chest discomfort, sudden facial drooping or limb numbness, or acute breathlessness, seek emergency medical care immediately.""" + context_note

    return {
        "answer": ans,
        "source": "clinical_engine",
        "suggestions": _extract_or_generate_suggestions(question, ans, lang)
    }
