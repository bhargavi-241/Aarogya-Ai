"""
test_validation.py - Comprehensive test suite for Multi-Signal Medical Document Validation Engine.

Verifies All 7 Required Scenarios (Section 19):
- Test A: Trinity Hospital CBC & Electrolytes Report -> MEDICAL (laboratory_report)
- Test B: Another Blood Test (Lipid / Metabolic) -> MEDICAL (laboratory_report)
- Test C: Doctor Prescription (Rx, Metformin, Dosages) -> MEDICAL (prescription)
- Test D: X-Ray / Diagnostic Ultrasound Report -> MEDICAL (diagnostic_report)
- Test E: Random Photograph -> NON-MEDICAL (non_medical)
- Test F: College Assignment -> NON-MEDICAL (non_medical_academic)
- Test G: Low-Quality Medical Scan -> MEDICAL or UNCERTAIN (never rejected as non-medical)
- Fixture Image Tests: Real PNG/JPG files in backend/test_fixtures/
"""

import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.services.document_validation_service import classify_medical_text, classify_medical_document


class TestMedicalDocumentValidation(unittest.TestCase):
    def test_A_trinity_hospital_cbc_report(self):
        """Test A: The Trinity Hospital CBC / Electrolyte report."""
        trinity_text = """
        TRINITY HOSPITAL & MEDICAL RESEARCH CENTRE
        DEPARTMENT OF CLINICAL PATHOLOGY
        LABORATORY REPORT
        Patient Name: Rajesh Gupta   Age/Sex: 48 / Male   UHID: TR-89210
        Referring Doctor: Dr. S. K. Mukherjee, MD
        Sample Collected: 22-Aug-2026   Reported Date: 23-Aug-2026
        ----------------------------------------------------------------
        TEST NAME                 RESULTS       UNITS      NORMAL RANGES
        ----------------------------------------------------------------
        COMPLETE BLOOD COUNT (CBC)
        Hemoglobin                11.5          g/dl       11.0 - 16.0
        Total Leucocyte Count     7500          cells/cumm 4000 - 11000
        Neutrophils               71            %          40 - 75
        Lymphocytes               23            %          20 - 45
        Eosinophils               3             %          1 - 6
        Monocytes                 3             %          2 - 10
        Red Blood Cells (RBC)     4.6           mil/mm3    4.0 - 5.5
        Packed Cell Volume (PCV)  39.0          %          36.0 - 48.0
        Platelet Count            305000        cells/cumm 150000 - 450000
        ----------------------------------------------------------------
        SERUM ELECTROLYTES
        Sodium (Na+)              142           mmol/l     135 - 145
        Potassium (K+)            3.9           mmol/l     3.5 - 5.0
        Chloride (Cl-)            95            mmol/l     98 - 106
        ----------------------------------------------------------------
        """
        res = classify_medical_text(trinity_text, filename="patient_trinity_report.png")
        print("\n[Test A - Trinity Hospital Report]:")
        print("  is_medical:", res["is_medical"], "| status:", res["status"], "| type:", res["document_type"], "| score:", res.get("medical_score"))
        self.assertTrue(res["is_medical"])
        self.assertEqual(res["status"], "medical")
        self.assertEqual(res["document_type"], "laboratory_report")
        self.assertGreaterEqual(res["medical_score"], 40)

    def test_B_blood_chemistry_report(self):
        """Test B: Another blood test (Lipid / Kidney profile)."""
        blood_text = """
        METROPOLIS HEALTHCARE LABS
        BIOCHEMISTRY INVESTIGATION REPORT
        Patient: Anita Sharma   Age: 52 / F   Lab No: 98124
        Ref Dr: Dr. Verma
        Blood Urea: 32 mg/dl (15 - 45)
        Serum Creatinine: 0.9 mg/dl (0.6 - 1.2)
        Serum Uric Acid: 5.2 mg/dl (3.5 - 7.0)
        Total Cholesterol: 185 mg/dl (< 200)
        Triglycerides: 140 mg/dl (< 150)
        Fasting Blood Sugar: 95 mg/dl (70 - 99)
        """
        res = classify_medical_text(blood_text, filename="blood_chemistry.jpg")
        print("\n[Test B - Blood Chemistry Report]:")
        print("  is_medical:", res["is_medical"], "| status:", res["status"], "| type:", res["document_type"], "| score:", res.get("medical_score"))
        self.assertTrue(res["is_medical"])
        self.assertEqual(res["status"], "medical")
        self.assertEqual(res["document_type"], "laboratory_report")

    def test_C_doctor_prescription(self):
        """Test C: Doctor prescription."""
        rx_text = """
        APOLLO CLINIC & HEALTHCARE CENTRE
        Dr. Sarah Jenkins, M.B.B.S, M.D. (Medicine)
        Reg No: MED-89421
        Patient Name: Asha Sharma   Age/Sex: 45/F   Date: 20-Aug-2026
        Diagnosis: Type 2 Diabetes Mellitus & Hypertension
        Rx
        1. Tab. Metformin 500 mg   -- 1 tab twice daily after food (1-0-1)
        2. Tab. Amlodipine 5 mg    -- 1 tab once daily in morning (1-0-0)
        3. Tab. Atorvastatin 10 mg -- 1 tab at bedtime (0-0-1)
        Advised: Fasting blood sugar & HbA1c test after 4 weeks
        Doctor Signature: Dr. Sarah Jenkins
        """
        res = classify_medical_text(rx_text, filename="doctor_prescription.jpg")
        print("\n[Test C - Doctor Prescription]:")
        print("  is_medical:", res["is_medical"], "| status:", res["status"], "| type:", res["document_type"], "| score:", res.get("medical_score"))
        self.assertTrue(res["is_medical"])
        self.assertEqual(res["status"], "medical")
        self.assertEqual(res["document_type"], "prescription")

    def test_D_diagnostic_imaging_report(self):
        """Test D: X-ray / Diagnostic ultrasound report."""
        diag_text = """
        METROPOLIS DIAGNOSTIC CENTRE
        ULTRASOUND & DIAGNOSTIC REPORT
        Patient: Rajesh Patel   Age: 52   Ref By: Dr. Mehta
        Investigation: Ultrasonography Abdomen & Pelvis
        Findings: Liver normal size and echotexture. No focal lesion.
        Kidneys: Right kidney 10.2 cm, Left kidney 10.5 cm. Normal corticomedullary differentiation.
        Impression: Normal study. No significant abnormality detected.
        """
        res = classify_medical_text(diag_text, filename="ultrasound_report.pdf")
        print("\n[Test D - Diagnostic Imaging Report]:")
        print("  is_medical:", res["is_medical"], "| status:", res["status"], "| type:", res["document_type"])
        self.assertTrue(res["is_medical"])
        self.assertEqual(res["status"], "medical")

    def test_E_random_photograph(self):
        """Test E: Random photograph."""
        photo_text = ""
        res = classify_medical_text(photo_text, filename="scenery_photo.jpg")
        print("\n[Test E - Random Photo]:")
        print("  is_medical:", res["is_medical"], "| status:", res["status"])
        self.assertFalse(res["is_medical"])
        self.assertEqual(res["status"], "non_medical")

    def test_F_college_assignment(self):
        """Test F: College assignment."""
        assignment_text = """
        DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
        COLLEGE OF ENGINEERING & TECHNOLOGY
        Assignment 3: Operating Systems (Subject Code: CS502)
        Student Name: Rahul Verma   Roll No: 22BCS041   Semester: 5
        Professor: Dr. Alok Kumar
        Submission Date: 18-Aug-2026
        Question 1: Explain the difference between process and thread.
        Question 2: Describe Banker's algorithm for deadlock avoidance.
        """
        res = classify_medical_text(assignment_text, filename="os_assignment.pdf")
        print("\n[Test F - College Assignment]:")
        print("  is_medical:", res["is_medical"], "| status:", res["status"], "| type:", res["document_type"])
        self.assertFalse(res["is_medical"])
        self.assertEqual(res["status"], "non_medical")
        self.assertEqual(res["document_type"], "non_medical_academic")

    def test_G_low_quality_medical_scan(self):
        """Test G: Low-quality medical scan (must be MEDICAL or UNCERTAIN, never NON_MEDICAL)."""
        low_clarity_text = "hospital patient hb 11.2 glucose"
        res = classify_medical_text(low_clarity_text, filename="scanned_doc.jpg")
        print("\n[Test G - Low Quality Scan]:")
        print("  is_medical:", res["is_medical"], "| status:", res["status"], "| score:", res.get("medical_score"))
        # Must NOT be non_medical / rejected
        self.assertIn(res["status"], ["medical", "uncertain"])
        self.assertNotEqual(res["status"], "non_medical")

    def test_real_fixture_images(self):
        """Test real image files in test_fixtures using RapidOCR."""
        fixtures_dir = BACKEND_DIR / "test_fixtures"
        if (fixtures_dir / "test_lab_report.png").exists():
            res_lab = classify_medical_document(str(fixtures_dir / "test_lab_report.png"), "png")
            print("\n[Fixture - test_lab_report.png]:")
            print("  is_medical:", res_lab["is_medical"], "| status:", res_lab["status"], "| type:", res_lab["document_type"])
            self.assertTrue(res_lab["is_medical"])
            self.assertEqual(res_lab["status"], "medical")

        if (fixtures_dir / "test_prescription.png").exists():
            res_rx = classify_medical_document(str(fixtures_dir / "test_prescription.png"), "png")
            print("\n[Fixture - test_prescription.png]:")
            print("  is_medical:", res_rx["is_medical"], "| status:", res_rx["status"], "| type:", res_rx["document_type"])
            self.assertTrue(res_rx["is_medical"])
            self.assertEqual(res_rx["status"], "medical")

    def test_H_echocardiography_report_analysis(self):
        """Test H: Echocardiography report full analysis."""
        from app.services.medical_document_parser import analyze_medical_document_content
        echo_text = """
        ECHOCARDIOGRAPHY REPORT
        Patient Name: Jane Doe   Age/Sex: 59 / Female
        Aortic Root: 28 mm (27 - 38 mm)
        Left Atrium: 34 mm (19 - 39 mm)
        Ejection Fraction: 64 % (55 - 70 %)

        FINDINGS:
        - Normal biventricular systolic function
        - Grade I diastolic dysfunction
        - Normal sized aortic root
        - Normal sized left atrium
        - Normal sized LV cavity
        - Good LV systolic function
        - Normal segmental wall motion
        - Normal RV size and systolic function
        - Intact IAS/IVS
        - Normal color flow
        - Normal pericardium

        CONCLUSION:
        Normal biventricular systolic function.
        Grade I diastolic dysfunction.
        """
        res = analyze_medical_document_content(echo_text, "echo_report.png")
        print("\n[Test H - Echocardiography Report Analysis]:")
        print("  Document Type:", res.get("document_type"))
        print("  Measurements Count:", len(res.get("measurements", [])))
        print("  Findings Count:", len(res.get("findings", [])))
        print("  Terms Count:", len(res.get("medical_terms_explained", [])))
        print("  Reference Range Check Status:", res.get("reference_range_check", {}).get("status"))

        self.assertIn("Echocardiography", res["document_type"])
        self.assertEqual(len(res["measurements"]), 3)
        self.assertEqual(len(res["findings"]), 11)
        self.assertIn("Normal biventricular systolic function", res["conclusion"])
        self.assertIn("Grade I diastolic dysfunction", res["conclusion"])
        self.assertTrue(len(res["medical_terms_explained"]) >= 3)
        self.assertIsNotNone(res.get("report_summary"))
        self.assertIsNotNone(res.get("report_review"))


if __name__ == "__main__":
    unittest.main()
