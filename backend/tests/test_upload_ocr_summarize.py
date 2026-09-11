import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app

client = TestClient(app)
FIXTURES_DIR = BACKEND_DIR / "test_fixtures"


class TestUploadOcrSummarize(unittest.TestCase):
    def test_upload_lab_report(self):
        lab_file = FIXTURES_DIR / "test_lab_report.png"
        self.assertTrue(lab_file.exists())
        with open(lab_file, "rb") as f:
            response = client.post(
                "/api/upload",
                files={"file": ("test_lab_report.png", f, "image/png")},
                data={"language": "en"}
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("\n[Lab Report Upload]: is_medical=", data.get("is_medical"), "category=", data.get("document_category"))
        self.assertTrue(data.get("is_medical"))
        self.assertEqual(data.get("document_category"), "Medical Report")
        self.assertIsNotNone(data.get("summary"))
        self.assertIn("Report Overview", data.get("summary", ""))

    def test_upload_doctor_prescription(self):
        rx_file = FIXTURES_DIR / "test_prescription.png"
        self.assertTrue(rx_file.exists())
        with open(rx_file, "rb") as f:
            response = client.post(
                "/api/upload",
                files={"file": ("test_prescription.png", f, "image/png")},
                data={"language": "en"}
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("\n[Doctor Prescription Upload]: is_medical=", data.get("is_medical"), "category=", data.get("document_category"))
        self.assertTrue(data.get("is_medical"))
        self.assertEqual(data.get("document_category"), "Doctor Prescription")
        self.assertIsNotNone(data.get("summary"))
        self.assertIn("Prescription Overview", data.get("summary", ""))

    def test_upload_doctor_prescription_hindi(self):
        rx_file = FIXTURES_DIR / "test_prescription.png"
        with open(rx_file, "rb") as f:
            response = client.post(
                "/api/upload",
                files={"file": ("test_prescription.png", f, "image/png")},
                data={"language": "hi"}
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("document_category"), "Doctor Prescription")
        summary = data.get("summary", "")
        self.assertTrue("डॉक्टर पर्ची" in summary or "Prescription Overview" in summary)

    def test_upload_non_medical_invoice_rejected(self):
        inv_file = FIXTURES_DIR / "test_invoice.png"
        self.assertTrue(inv_file.exists())
        with open(inv_file, "rb") as f:
            response = client.post(
                "/api/upload",
                files={"file": ("test_invoice.png", f, "image/png")},
                data={"language": "en"}
            )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print("\n[Invoice Upload]: is_medical=", data.get("is_medical"), "category=", data.get("document_category"))
        self.assertFalse(data.get("is_medical"))
        self.assertEqual(data.get("document_category"), "Non-Medical")


if __name__ == "__main__":
    unittest.main()
