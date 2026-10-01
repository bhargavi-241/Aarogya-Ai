"""
test_wellness_suggestions.py - Comprehensive Unit & Integration Tests for Personalized Wellness Suggestions
"""

import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.services.wellness_suggestion_service import (
    generate_wellness_suggestions,
    WELLNESS_DISCLAIMER
)

client = TestClient(app)


class TestWellnessSuggestions(unittest.TestCase):
    def test_bp_reading_wellness_generation(self):
        """Verify high BP reading produces non-prescriptive, safe wellness suggestions across categories."""
        result = generate_wellness_suggestions(
            bp_reading="138/88 mmHg",
            lifestyle={"stress": "high", "physical_activity": "low"},
            language="en"
        )

        self.assertTrue(result["success"])
        suggestions = result["wellness_suggestions"]
        self.assertGreaterEqual(len(suggestions), 3)

        categories = [s["category"] for s in suggestions]
        self.assertIn("Physical Activity", categories)
        self.assertIn("Stress Management", categories)

        # Safety checks: Must not claim to diagnose or cure hypertension
        all_text = " ".join([s["suggestion"] + " " + s["reason"] for s in suggestions]).lower()
        self.assertNotIn("cure", all_text)
        self.assertNotIn("diagnose", all_text)
        self.assertNotIn("you must take", all_text)
        self.assertNotIn("stop taking", all_text)

        # Transparency check: Reasons list should mention the BP reading and stress
        reasons = [r for s in suggestions for r in s.get("reasons_list", [])]
        self.assertTrue(any("138/88" in r for r in reasons))
        self.assertTrue(any("stress" in r.lower() for r in reasons))

    def test_bp_trend_analysis(self):
        """Verify comparison of previous vs current BP produces appropriate trend context."""
        result = generate_wellness_suggestions(
            bp_reading="128/82",
            previous_bp_reading="145/92",
            language="en"
        )

        suggestions = result["wellness_suggestions"]
        reasons = [r for s in suggestions for r in s.get("reasons_list", [])]
        self.assertTrue(any("favorable" in r.lower() or "decreased" in r.lower() or "trend" in r.lower() for r in reasons))

    def test_kidney_safety_guardrails(self):
        """Ensure renal findings trigger safety guardrails against aggressive workouts and fluid overload."""
        sample_report_data = {
            "parameters": [
                {"parameter": "Serum Creatinine", "value": "2.1", "reference_range": "0.6 - 1.2", "status": "high"},
                {"parameter": "Blood Urea", "value": "58", "reference_range": "15 - 45", "status": "high"}
            ],
            "patient_information": {
                "vitals": {"blood_pressure": "130/85"}
            }
        }

        result = generate_wellness_suggestions(
            report_data=sample_report_data,
            language="en"
        )

        self.assertTrue(result["kidney_safety_guard"])
        suggestions = result["wellness_suggestions"]

        for s in suggestions:
            sugg_text = s["suggestion"].lower()
            self.assertNotIn("heavy lifting", sugg_text)
            self.assertNotIn("drink 4 liters", sugg_text)
            self.assertNotIn("high protein", sugg_text)

        doc_questions = [s.get("doctor_discussion", "") for s in suggestions if s.get("doctor_discussion")]
        self.assertTrue(any("renal" in q.lower() or "kidney" in q.lower() or "fluid" in q.lower() for q in doc_questions))

    def test_diabetes_lifestyle_suggestions(self):
        """Ensure diabetes risk indication produces general activity & meal pacing guidance, not medication changes."""
        result = generate_wellness_suggestions(
            ml_risk={"disease": "diabetes", "risk_level": "High", "prediction": 1},
            report_data={
                "parameters": [
                    {"parameter": "Fasting Blood Sugar", "value": "156", "reference_range": "70 - 99", "status": "high"},
                    {"parameter": "HbA1c", "value": "7.4", "reference_range": "4.0 - 5.6", "status": "high"}
                ]
            },
            language="en"
        )

        suggestions = result["wellness_suggestions"]
        self.assertGreater(len(suggestions), 0)
        all_text = " ".join([s["suggestion"] for s in suggestions]).lower()
        self.assertNotIn("insulin dosage", all_text)
        self.assertNotIn("stop medication", all_text)
        self.assertTrue(any(w in all_text for w in ["walk", "post-meal", "movement"]))

    def test_confidence_awareness(self):
        """When OCR has low confidence, system must flag uncertainty and avoid speculative guidance."""
        sample_report = {
            "parameters": [],
            "confidence_scores": {"overall": 35},
            "low_confidence_fields": [{"field": "medicine_name", "value": "unknown"}]
        }

        result = generate_wellness_suggestions(
            report_data=sample_report,
            language="en"
        )

        self.assertTrue(result["has_uncertain_data"])
        self.assertIn("uncertainty_warning", result)
        self.assertIn("verify", result["uncertainty_warning"].lower())

    def test_wellness_api_endpoints(self):
        """Integration test for POST /api/wellness-suggestions and POST /api/wellness-feedback."""
        payload = {
            "bp_reading": "136/86",
            "lifestyle": {"stress": "high", "physical_activity": "low"},
            "language": "en"
        }

        # 1. Test POST /api/wellness-suggestions
        res = client.post("/api/wellness-suggestions", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("wellness_suggestions", data)
        self.assertGreater(len(data["wellness_suggestions"]), 0)

        first_suggestion = data["wellness_suggestions"][0]
        suggestion_id = first_suggestion["id"]
        category = first_suggestion["category"]

        # 2. Test POST /api/wellness-feedback
        fb_payload = {
            "suggestion_id": suggestion_id,
            "category": category,
            "is_useful": True,
            "comment": "Very helpful guidance"
        }
        fb_res = client.post("/api/wellness-feedback", json=fb_payload)
        self.assertEqual(fb_res.status_code, 200)
        fb_data = fb_res.json()
        self.assertTrue(fb_data["success"])
        self.assertIsNotNone(fb_data["saved_id"])


if __name__ == "__main__":
    unittest.main()
