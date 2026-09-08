"""
test_patient_voice.py - Unit tests for Patient Voice Health Assistant.
Verifies symptom extraction, safety precautions, urgent warnings,
safe boundaries (no diagnosis, no prescriptions), and closing phrase.
"""

import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.services.patient_voice_service import (
    identify_symptoms_from_text,
    generate_patient_voice_guide,
    _build_spoken_voice_fallback
)


class TestPatientVoiceService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_identify_symptoms_english(self):
        text = "I have had a mild fever and cough for two days, and my throat hurts when I swallow."
        symptoms = identify_symptoms_from_text(text, language="en")
        self.assertIn("fever", symptoms)
        self.assertIn("cough", symptoms)
        self.assertIn("sore throat / throat pain", symptoms)

    def test_identify_symptoms_hindi(self):
        text = "मुझे दो दिन से बुखार है और खांसी आ रही है, बदन में दर्द है।"
        symptoms = identify_symptoms_from_text(text, language="hi")
        self.assertTrue(any("बुखार" in s for s in symptoms))
        self.assertTrue(any("खांसी" in s for s in symptoms))
        self.assertTrue(any("दर्द" in s for s in symptoms))

    def test_identify_symptoms_marathi(self):
        text = "माझे डोके खूप दुखत आहे आणि कालपासून चक्कर येत आहे."
        symptoms = identify_symptoms_from_text(text, language="mr")
        self.assertTrue(any("डोकेदुखी" in s for s in symptoms))
        self.assertTrue(any("चक्कर" in s for s in symptoms))

    def test_voice_guide_structure_and_closing_english(self):
        text = "I have a running nose, sneezing, and light fever since yesterday."
        result = generate_patient_voice_guide(text, language="en")
        
        self.assertTrue(result["success"])
        self.assertIn("spoken_response", result)
        self.assertIn("symptoms_identified", result)
        self.assertIn("general_explanation", result)
        self.assertIn("precautions", result)
        self.assertIn("urgent_warning", result)
        self.assertEqual(result["doctor_closing"], "Please consult a doctor for proper checkup.")
        
        # Check that closing phrase is in spoken response
        spoken = result["spoken_response"]
        self.assertIn("Please consult a doctor for proper checkup.", spoken)

        # Strict safety checks: no prescriptions or definitive diagnosis
        banned_terms = ["paracetamol", "ibuprofen", "antibiotic", "mg", "tablet", "capsule", "syrup", "diagnosed with"]
        for term in banned_terms:
            self.assertNotIn(term, spoken.lower())

    def test_voice_guide_structure_hindi(self):
        text = "मुझे बहुत कमजोरी लग रही है और सिर में दर्द है।"
        result = generate_patient_voice_guide(text, language="hi")
        self.assertTrue(result["success"])
        self.assertTrue(len(result["symptoms_identified"]) > 0)
        self.assertIn("कृपया उचित जांच के लिए डॉक्टर से मिलें।", result["doctor_closing"])

    def test_api_endpoint_patient_voice_guide(self):
        payload = {
            "patient_spoken_text": "I feel very tired and have cold and cough for three days.",
            "language": "en"
        }
        response = self.client.post("/api/patient-voice-guide", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("Please consult a doctor for proper checkup.", data["spoken_response"])
        self.assertTrue(len(data["symptoms_identified"]) > 0)
        self.assertTrue(len(data["precautions"]) >= 2)

    def test_api_endpoint_empty_text_error(self):
        payload = {
            "patient_spoken_text": "   ",
            "language": "en"
        }
        response = self.client.post("/api/patient-voice-guide", json=payload)
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
