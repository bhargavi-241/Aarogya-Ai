import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle, AlertTriangle, Loader2, X,
  Sparkles, BookOpen, ShieldCheck, ArrowRight, RefreshCw, Lock, FileCheck2,
  Ban, Code2, ChevronDown, ChevronUp, Cpu, GitCompare, HelpCircle, Activity,
  Stethoscope, Info, CheckCircle2, TrendingUp, TrendingDown, Pill, AlertOctagon,
  ClipboardList, ImageOff
} from 'lucide-react';
import {
  uploadDocument,
  validateDocument,
  performOCR,
  explainTerms,
  checkReport,
  summarizeReport
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import WorkflowStepper from '../components/WorkflowStepper';
import OCRResultPanel from '../components/OCRResultPanel';
import ExplanationPanel from '../components/ExplanationPanel';
import FormattedExplanation from '../components/FormattedExplanation';
import CheckReportModal from '../components/CheckReportModal';
import ReportComparisonModal from '../components/ReportComparisonModal';
import MedicalTermModal from '../components/MedicalTermModal';
import ManualEntryModal from '../components/ManualEntryModal';
import ReportQuestionWidget from '../components/ReportQuestionWidget';

export default function UnderstandPage() {
  const location = useLocation();
  const { t, tText, language, setLanguage } = useLanguage();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState(1);

  // Upload & Validation States
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showDevDebug, setShowDevDebug] = useState(false);

  // OCR & Analysis States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [summaryCache, setSummaryCache] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Explanations State
  const [explanations, setExplanations] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState(null);

  // Modals States
  const [checkReportOpen, setCheckReportOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [activeTermExplanation, setActiveTermExplanation] = useState(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  // Detect if OCR result is too low quality to be useful
  const isLowQualityOCR = (data) => {
    if (!data) return false;
    const text = (data.raw_text || '').trim();
    const params = data.parameters || [];
    const conf = data.confidence_scores?.overall ?? data.confidence_scores?.ocr_confidence ?? 100;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Low quality if: very little text AND no parameters extracted, OR very low confidence
    return (wordCount < 15 && params.length === 0) || conf < 30;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('compare') === 'true') {
      setCompareModalOpen(true);
    }
  }, [location.search]);

  // Auto-process file uploaded from the Home page hero upload button
  useEffect(() => {
    const heroFileId = sessionStorage.getItem('heroUploadFileId');
    const heroFileName = sessionStorage.getItem('heroUploadFileName');
    if (!heroFileId) return;

    // Clear immediately so back-navigation doesn't re-trigger
    sessionStorage.removeItem('heroUploadFileId');
    sessionStorage.removeItem('heroUploadFileName');

    const fid = parseInt(heroFileId, 10);
    if (isNaN(fid)) return;

    // Mark as already uploaded + validated (medical), skip upload form entirely
    setUploadResult({ file_id: fid, original_filename: heroFileName || 'medical_report' });
    setValidationResult({ is_medical: true, status: 'medical', document_label: 'Medical Document' });
    setFile({ name: heroFileName || 'medical_report' }); // dummy so filename shows
    setStep(3); // jump straight to OCR

    // Auto-trigger OCR using already-imported performOCR
    setOcrLoading(true);
    setError(null);
    performOCR(fid, 'en')
      .then((ocrRes) => {
        setOcrData(ocrRes.data);
        const initialExp = ocrRes.data.simple_explanation || ocrRes.data.report_summary || ocrRes.data.summary;
        if (initialExp) setSummaryCache({ en: initialExp });
        setStep(6);
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'OCR processing failed. Please try again.');
        setStep(1);
      })
      .finally(() => setOcrLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const MAX_MB = 10;

  const handleFileSelect = (selectedFile) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Unsupported file format. Please upload a JPG, PNG, or PDF file.');
      return;
    }
    if (selectedFile.size > MAX_MB * 1024 * 1024) {
      setError(`File exceeds maximum size limit of ${MAX_MB}MB.`);
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    setValidationResult(null);
    setOcrData(null);
    setSummaryCache({});
    setExplanations(null);
    setStep(1);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  // STEP 1 & 2: Upload File & Run Medical Document Validation
  const handleUploadAndValidate = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setStep(1);

    try {
      // 1. Upload to backend
      const upRes = await uploadDocument(file);
      setUploadResult(upRes.data);

      // 2. Validate document classification with multi-signal weighted scoring
      setUploading(false);
      setValidating(true);
      setStep(2);

      const valRes = await validateDocument(upRes.data.file_id);
      setValidationResult(valRes.data);

      // Fast-track pipeline: if confirmed medical document, auto-advance immediately to OCR and analysis!
      if (valRes.data?.is_medical === true) {
        setValidating(false);
        setOcrLoading(true);
        setStep(3);

        const ocrRes = await performOCR(upRes.data.file_id, language);
        setOcrData(ocrRes.data);
        const initialExp = ocrRes.data.simple_explanation || ocrRes.data.report_summary || ocrRes.data.summary;
        if (initialExp) {
          setSummaryCache({ [language]: initialExp });
        }
        setStep(6);
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Processing failed. Please try again.';
      setError(msg);
      setStep(1);
    } finally {
      setUploading(false);
      setValidating(false);
      setOcrLoading(false);
    }
  };

  // STEP 3 & 4: Run OCR & Universal Analysis with user's selected language
  const handleContinueAnalysis = async () => {
    if (!uploadResult?.file_id) return;
    setOcrLoading(true);
    setError(null);
    setStep(3); // Preprocessing & OCR

    try {
      const ocrRes = await performOCR(uploadResult.file_id, language);
      setOcrData(ocrRes.data);
      const initialExp = ocrRes.data.simple_explanation || ocrRes.data.report_summary || ocrRes.data.summary;
      if (initialExp) {
        setSummaryCache({ [language]: initialExp });
      }
      setStep(6); // Human Verification & Structured Dashboard
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'OCR processing failed.';
      setError(msg);
    } finally {
      setOcrLoading(false);
    }
  };

  // Helper to re-generate / translate summary on-demand for specific language
  const fetchSummaryForLang = async (targetLang) => {
    if (!ocrData?.raw_text) return;
    setSummaryLoading(true);
    try {
      const res = await summarizeReport({
        rawText: ocrData.raw_text,
        parameters: ocrData.parameters,
        docType: ocrData.document_type,
        fileId: uploadResult?.file_id,
        language: targetLang,
      });
      if (res.data?.summary) {
        setSummaryCache((prev) => ({ ...prev, [targetLang]: res.data.summary }));
        setOcrData((prev) => ({
          ...prev,
          simple_explanation: res.data.summary,
          report_summary: res.data.summary,
          summary: res.data.summary,
        }));
      }
    } catch (err) {
      console.error('Failed to summarize in language:', targetLang, err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleLanguageSwitch = async (newLang) => {
    setLanguage(newLang);
    if (summaryCache[newLang]) {
      setOcrData((prev) => ({
        ...prev,
        simple_explanation: summaryCache[newLang],
        report_summary: summaryCache[newLang],
        summary: summaryCache[newLang],
      }));
    } else if (ocrData?.raw_text) {
      await fetchSummaryForLang(newLang);
    }
  };

  // STEP 7 & 8: Human Verification Done -> Generate Explanations
  const handleVerificationDone = async (verifiedItems) => {
    setStep(7);
    setExplaining(true);
    try {
      const termsToExplain = [];
      if (Array.isArray(verifiedItems)) {
        verifiedItems.forEach((item) => {
          if (item.test_name) termsToExplain.push(item.test_name);
          else if (item.medicine_name) termsToExplain.push(item.medicine_name);
          else if (item.value) termsToExplain.push(item.value.split(':')[0].trim());
        });
      }

      if (termsToExplain.length === 0 && ocrData?.parameters) {
        ocrData.parameters.forEach((p) => termsToExplain.push(p.test_name));
      }

      if (termsToExplain.length > 0) {
        const expRes = await explainTerms(termsToExplain.slice(0, 10), ocrData?.raw_text || '', uploadResult?.file_id, false, language);
        setExplanations(expRes.data.explanations);
      } else {
        const expRes = await explainTerms(['Hemoglobin', 'Total Leukocyte Count', 'Serum Creatinine', 'Fasting Glucose'], ocrData?.raw_text || '', uploadResult?.file_id, false, language);
        setExplanations(expRes.data.explanations);
      }
      setStep(8);
    } catch (err) {
      console.error('Explanation fetch failed:', err);
    } finally {
      setExplaining(false);
    }
  };

  const handleExplainSpecificTerm = async (term) => {
    try {
      const expRes = await explainTerms([term], ocrData?.raw_text || '', uploadResult?.file_id, false, language);
      if (expRes.data?.explanations && expRes.data.explanations.length > 0) {
        setActiveTermExplanation(expRes.data.explanations[0]);
      }
    } catch (err) {
      console.error('Term lookup error:', err);
    }
  };

  const handleResetUpload = () => {
    setFile(null);
    setPreview(null);
    setUploadResult(null);
    setValidationResult(null);
    setOcrData(null);
    setSummaryCache({});
    setSummaryLoading(false);
    setExplanations(null);
    setError(null);
    setStep(1);
    setManualEntryOpen(false);
  };

  // Handle manual entry submission — build synthetic OCR data and jump to analysis
  const handleManualSubmit = ({ parameters, rawText, patientName, reportDate, doctorName }) => {
    setManualEntryOpen(false);
    const syntheticOcrData = {
      raw_text: rawText,
      parameters: parameters,
      document_type: 'laboratory_report',
      document_label: 'Manually Entered Report',
      patient_information: {
        name: patientName || 'Not provided',
        date: reportDate || '',
        doctor: doctorName || '',
      },
      simple_explanation: null,
      report_summary: null,
      summary: null,
      confidence_scores: { overall: 100, source: 'manual_entry' },
      low_confidence_fields: [],
      key_findings: [],
      measurements: parameters,
      is_manual_entry: true,
    };
    setOcrData(syntheticOcrData);
    setStep(6);
  };

  // Quick Demo Samples Loader
  const handleLoadQuickSample = (sampleKey) => {
    setError(null);
    if (sampleKey === 'cbc') {
      handleManualSubmit({
        patientName: 'Demo Patient (CBC Panel)',
        reportDate: '2026-09-01',
        doctorName: 'Dr. A. Sharma (Pathologist)',
        rawText: `Complete Blood Count (CBC)
Hemoglobin: 10.2 g/dL (12.0 - 16.0)
Total Leukocyte Count: 12500 cells/cumm (4000 - 11000)
Platelet Count: 210000 cells/cumm (150000 - 450000)
Packed Cell Volume (PCV): 32 % (36 - 48)
RBC Count: 3.8 mill/cumm (4.0 - 5.5)
Neutrophils: 74 % (40 - 70)
Lymphocytes: 20 % (20 - 40)`,
        parameters: [
          { test_name: 'Hemoglobin', value: '10.2', unit: 'g/dL', reference_range: '12.0 - 16.0', status: 'low', confidence: 98 },
          { test_name: 'Total Leukocyte Count', value: '12500', unit: 'cells/cumm', reference_range: '4000 - 11000', status: 'high', confidence: 96 },
          { test_name: 'Platelet Count', value: '210000', unit: 'cells/cumm', reference_range: '150000 - 450000', status: 'normal', confidence: 97 },
          { test_name: 'Packed Cell Volume (PCV)', value: '32', unit: '%', reference_range: '36 - 48', status: 'low', confidence: 95 },
          { test_name: 'RBC Count', value: '3.8', unit: 'mill/cumm', reference_range: '4.0 - 5.5', status: 'low', confidence: 94 },
          { test_name: 'Neutrophils', value: '74', unit: '%', reference_range: '40 - 70', status: 'high', confidence: 95 },
        ]
      });
    } else if (sampleKey === 'diabetes') {
      handleManualSubmit({
        patientName: 'Demo Patient (Metabolic Panel)',
        reportDate: '2026-09-02',
        doctorName: 'Dr. V. Patel (Endocrinologist)',
        rawText: `Diabetes & Glycemic Profile
Fasting Blood Sugar: 148 mg/dL (70 - 99)
Post Prandial Blood Glucose: 205 mg/dL (70 - 140)
HbA1c: 7.9 % (4.0 - 5.6)
Average Blood Glucose: 180 mg/dL (70 - 120)`,
        parameters: [
          { test_name: 'Fasting Blood Sugar', value: '148', unit: 'mg/dL', reference_range: '70 - 99', status: 'high', confidence: 99 },
          { test_name: 'Post Prandial Blood Glucose', value: '205', unit: 'mg/dL', reference_range: '70 - 140', status: 'high', confidence: 97 },
          { test_name: 'HbA1c', value: '7.9', unit: '%', reference_range: '4.0 - 5.6', status: 'high', confidence: 98 },
          { test_name: 'Average Blood Glucose', value: '180', unit: 'mg/dL', reference_range: '70 - 120', status: 'high', confidence: 95 },
        ]
      });
    } else if (sampleKey === 'kidney') {
      handleManualSubmit({
        patientName: 'Demo Patient (Renal Panel)',
        reportDate: '2026-09-03',
        doctorName: 'Dr. R. Gupta (Nephrologist)',
        rawText: `Renal Function Test (KFT)
Serum Creatinine: 1.7 mg/dL (0.6 - 1.2)
Blood Urea: 54 mg/dL (15 - 45)
Serum Sodium: 139 mmol/L (135 - 145)
Serum Potassium: 4.6 mmol/L (3.5 - 5.0)
Uric Acid: 7.8 mg/dL (3.5 - 7.2)`,
        parameters: [
          { test_name: 'Serum Creatinine', value: '1.7', unit: 'mg/dL', reference_range: '0.6 - 1.2', status: 'high', confidence: 98 },
          { test_name: 'Blood Urea', value: '54', unit: 'mg/dL', reference_range: '15 - 45', status: 'high', confidence: 97 },
          { test_name: 'Serum Sodium', value: '139', unit: 'mmol/L', reference_range: '135 - 145', status: 'normal', confidence: 96 },
          { test_name: 'Serum Potassium', value: '4.6', unit: 'mmol/L', reference_range: '3.5 - 5.0', status: 'normal', confidence: 96 },
          { test_name: 'Uric Acid', value: '7.8', unit: 'mg/dL', reference_range: '3.5 - 7.2', status: 'high', confidence: 95 },
        ]
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Medical Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Page Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 rounded-lg px-3 py-1 text-xs font-bold text-teal-800 mb-2">
            <FileText className="h-3.5 w-3.5 text-teal-600" />
            <span>Universal Medical Document Analysis Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Understand Your Medical Report
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Upload any medical laboratory report, blood test, prescription, or diagnostic scan. Our pipeline automatically identifies the document type, compares findings with printed reference ranges, and translates complex terminology into simple, compassionate language.
          </p>
        </div>

        {/* Compare Reports Quick Launcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all hover:border-teal-300"
          >
            <GitCompare className="h-4 w-4 text-teal-600" />
            <span>Compare 2 Reports</span>
          </button>
        </div>
      </div>

      {/* 8-Stage Workflow Stepper */}
      <WorkflowStepper currentStep={step} />

      {/* Error alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm flex items-start gap-3 animate-in fade-in-50">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* ⚠️ LOW QUALITY / UNCLEAR DOCUMENT BANNER */}
      {ocrData && isLowQualityOCR(ocrData) && !ocrData.is_manual_entry && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-amber-500 text-white p-3 rounded-2xl shrink-0">
            <ImageOff className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-amber-900 text-base">
              ⚠️ Document Image is Not Clear
            </h3>
            <p className="text-sm text-amber-800 mt-0.5 leading-relaxed">
              The uploaded image quality is too low for the AI to reliably read the values.
              Very little or no text could be extracted. You can enter the report values
              manually and still get a full AI analysis.
            </p>
          </div>
          <button
            onClick={() => setManualEntryOpen(true)}
            className="shrink-0 flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition-all text-sm cursor-pointer whitespace-nowrap"
          >
            <ClipboardList className="h-4 w-4" />
            Enter Details Manually
          </button>
        </div>
      )}

      {/* STAGE 1: UPLOAD BOX */}
      {!validationResult && !ocrData && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => document.getElementById('medical-file-input').click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                dragging
                  ? 'border-teal-500 bg-teal-50/50'
                  : file
                  ? 'border-teal-300 bg-teal-50/20'
                  : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                id="medical-file-input"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="space-y-4">
                  {preview ? (
                    <div className="relative inline-block max-w-xs mx-auto">
                      <img
                        src={preview}
                        alt="Document Preview"
                        className="max-h-60 rounded-xl border border-slate-200 shadow-sm object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-teal-100/50 rounded-2xl inline-block text-teal-800">
                      <FileText className="h-14 w-14" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-base">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {file.type.toUpperCase() || 'DOCUMENT'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg"
                  >
                    <X className="h-3.5 w-3.5" /> Choose different document
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-teal-50 text-teal-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Drop any medical document, lab report, or prescription here
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Click to browse from your computer. Supports JPG, PNG, and PDF files up to 10 MB.
                  </p>
                  <div className="pt-3 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">• Blood Test (CBC, Electrolytes)</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">• Diabetes & Lipid Profile</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">• Liver (LFT) & Kidney (KFT)</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">• Doctor Prescriptions</span>
                  </div>

                  {/* One-Click Quick Sample Loaders */}
                  <div className="pt-4 border-t border-slate-100 mt-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      ⚡ Quick Test With Preloaded Clinical Reports (No file required):
                    </span>
                    <div className="flex flex-wrap justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadQuickSample('cbc');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100/90 text-teal-800 border border-teal-200 text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1.5"
                      >
                        🩸 Sample CBC Blood Report
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadQuickSample('diabetes');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1.5"
                      >
                        🍬 Sample Diabetes & Sugar Panel
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadQuickSample('kidney');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100/90 text-purple-900 border border-purple-200 text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1.5"
                      >
                        🫘 Sample Renal (KFT) Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Trigger Button */}
            {file && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUploadAndValidate}
                  disabled={uploading || validating}
                  className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading Document...</span>
                    </>
                  ) : validating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Classifying Document Type & Validating Content...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      <span>Upload & Validate Medical Document</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Privacy & Supported Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
              <FileCheck2 className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block mb-0.5">Universal Medical Document Support:</strong>
                <p className="text-slate-500 leading-relaxed">
                  Automated analysis for CBC, Diabetes, Lipids, LFT, KFT, Thyroid, Electrolytes, Vitamins, Urine tests, Prescriptions, Ultrasound, X-Ray, and ECG reports.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
              <Lock className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block mb-0.5">Privacy First:</strong>
                <p className="text-slate-500 leading-relaxed">
                  Your uploaded health documents are processed securely in your local environment and are never shared publicly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: VALIDATION RESULT CARD */}
      {validationResult && !ocrData && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* STATE 1: ACCEPTED MEDICAL DOCUMENT */}
          {(validationResult.status === 'medical' || validationResult.is_medical === true) && (
            <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-200 pb-5 mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-xs">
                    <CheckCircle className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      ✓ Validation Check: Passed
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                      ✓ Medical Document Detected
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-emerald-800 mt-0.5">
                      Document type: <span className="underline">{validationResult.document_label || validationResult.document_type || 'Laboratory Report'}</span>
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 shadow-2xs">
                  Confidence: <span className="text-emerald-600 font-extrabold text-sm">{Math.round(validationResult.confidence * 100)}%</span>
                  {validationResult.medical_score !== undefined && (
                    <span className="text-slate-400 font-normal ml-2">Score: {validationResult.medical_score}/100</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                  {validationResult.message || 'Medical structure and clinical terminology detected. The document is ready for automated extraction.'}
                </p>

                <div className="bg-white/90 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Identified Document Type:</span>
                    <span className="font-bold text-emerald-800 capitalize">
                      {validationResult.document_label || validationResult.document_type}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">File Name:</span>
                    <span className="font-mono text-slate-800">{file?.name}</span>
                  </div>
                  {validationResult.matched_indicators && validationResult.matched_indicators.length > 0 && (
                    <div className="pt-2 border-t border-emerald-100">
                      <span className="text-slate-500 block mb-1.5 font-semibold">Matched Medical & Clinical Parameters:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {validationResult.matched_indicators.map((ind, i) => (
                          <span key={i} className="bg-emerald-100/90 text-emerald-900 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            ✓ {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={handleResetUpload}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Upload Another Document
                  </button>

                  <button
                    onClick={handleContinueAnalysis}
                    disabled={ocrLoading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50"
                  >
                    {ocrLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Running OCR & Clinical Extraction...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span>Analyze Report</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: UNCERTAIN DOCUMENT (MEDIUM CONFIDENCE / LOW OCR CLARITY) */}
          {(validationResult.status === 'uncertain' || validationResult.is_medical === null) && (
            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200 pb-5 mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-xs">
                    <AlertTriangle className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      ⚠ Validation Check: Review Needed
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
                      ⚠ Document Could Not Be Classified Confidently
                    </h3>
                  </div>
                </div>
                <div className="bg-white border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold text-amber-900 shadow-2xs">
                  Confidence: <span className="text-amber-600 font-extrabold text-sm">{Math.round(validationResult.confidence * 100)}%</span>
                  {validationResult.medical_score !== undefined && (
                    <span className="text-slate-400 font-normal ml-2">Score: {validationResult.medical_score}/100</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-amber-950 font-medium leading-relaxed">
                  We could not reliably determine whether this is a medical document. You can try a clearer image, or proceed directly with extraction.
                </p>

                <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
                  <p className="font-semibold text-amber-900">
                    Why is this uncertain?
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Some document patterns or partial text were detected, but the image contrast or text density is low. You can still run automated extraction and manually confirm the findings.
                  </p>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">File Name:</span>
                    <span className="font-mono text-slate-800">{file?.name}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleUploadAndValidate}
                      disabled={validating}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${validating ? 'animate-spin' : ''}`} />
                      <span>Retry</span>
                    </button>
                    <button
                      onClick={handleResetUpload}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 font-semibold border border-slate-200 rounded-xl text-xs"
                    >
                      Upload Another Document
                    </button>
                  </div>

                  <button
                    onClick={handleContinueAnalysis}
                    disabled={ocrLoading}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50"
                  >
                    {ocrLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Extracting Content...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Proceed with Analysis Anyway</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: REJECTED NON-MEDICAL DOCUMENT */}
          {(validationResult.status === 'non_medical' || validationResult.is_medical === false) && (
            <div className="bg-rose-50/90 border-2 border-rose-300 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-rose-200 pb-5 mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="bg-rose-600 text-white p-3 rounded-2xl shadow-xs">
                    <Ban className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full">
                      ✕ Validation Check: Rejected
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-rose-950 mt-1">
                      ✕ Not a Medical Document
                    </h3>
                  </div>
                </div>
                <div className="bg-white border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold text-rose-900 shadow-2xs">
                  Rejection Confidence: <span className="text-rose-600 font-extrabold text-sm">{Math.round(validationResult.confidence * 100)}%</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-rose-950 font-medium leading-relaxed">
                  This file does not appear to be a medical prescription, laboratory report, diagnostic report, or other medical document.
                </p>

                <div className="bg-white/90 border border-rose-200 rounded-2xl p-4 text-xs space-y-2 text-rose-900">
                  <p className="font-semibold text-rose-950">
                    Why was this document rejected?
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {validationResult.reason || 'Our multi-signal validator identified non-medical characteristics without clinical terminology, laboratory reference ranges, or prescription structures.'}
                  </p>
                  <div className="bg-rose-100/50 p-3 rounded-xl border border-rose-200 text-rose-900 text-xs">
                    <strong>Accepted Document Types:</strong> Medical prescriptions, laboratory blood reports (CBC, Electrolytes, Glucose, Lipids, LFT, KFT), pathology reports, diagnostic imaging tests, or hospital discharge summaries.
                  </div>
                </div>

                <div className="pt-3 flex flex-wrap gap-3">
                  <button
                    onClick={handleResetUpload}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs text-xs sm:text-sm flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" /> Upload Valid Document
                  </button>
                  <button
                    onClick={handleResetUpload}
                    className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-xl text-xs sm:text-sm flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Developer Diagnostics Panel */}
          {validationResult.debug && (
            <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <button
                onClick={() => setShowDevDebug(!showDevDebug)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-teal-400" />
                  <span>Developer Validation Diagnostics Panel</span>
                </div>
                {showDevDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showDevDebug && (
                <div className="p-4 border-t border-slate-800 text-xs font-mono space-y-3 bg-slate-950">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">OCR Text Found:</span>
                      <span className="font-bold text-white">
                        {validationResult.debug.ocr_text_length > 0 ? `YES (${validationResult.debug.ocr_text_length} chars)` : 'NO'}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">OCR Confidence:</span>
                      <span className="font-bold text-teal-400">{validationResult.debug.ocr_confidence}%</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Medical Keywords:</span>
                      <span className="font-bold text-white">{validationResult.debug.medical_keywords_count} detected</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Medical Score:</span>
                      <span className="font-bold text-emerald-400">{validationResult.debug.raw_medical_score} / 100</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STAGE 3 & BEYOND: UNIVERSAL MEDICAL DOCUMENT DASHBOARD */}
      {ocrData && (
        <div className="space-y-8 animate-in fade-in-50">
          {/* SECTION 14: EMERGENCY WARNING BANNER (IF EXTREME OUTLIERS DETECTED) */}
          {ocrData.emergency_warning && (
            <div className="bg-rose-600 text-white rounded-3xl p-5 sm:p-6 shadow-lg flex items-start gap-4 animate-pulse">
              <AlertOctagon className="h-7 w-7 text-white flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-base sm:text-lg text-white">
                  Important Medical Evaluation Notice
                </h4>
                <p className="text-xs sm:text-sm text-rose-100 mt-1 leading-relaxed">
                  {ocrData.emergency_warning}
                </p>
              </div>
            </div>
          )}

          {/* SECTION: SHORT, CLEAN MEDICAL REPORT SUMMARY */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    {t('rep_badge_analyzed', '✓ Medical Report Analyzed')}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {t('rep_title_summary', 'Medical Report Summary')}
                  </h3>
                </div>
              </div>

              <div
                className={`px-4 py-2 rounded-2xl text-xs font-bold border shadow-2xs flex items-center gap-2 ${
                  ocrData.overall_status?.tone === 'emerald'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                {ocrData.overall_status?.tone === 'emerald' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <span>
                  {ocrData.overall_status?.label
                    ? tText(ocrData.overall_status.label)
                    : (ocrData.overall_status?.tone === 'emerald'
                        ? t('rep_status_mostly_normal', 'Mostly within reported ranges')
                        : t('rep_status_attention', 'Attention Needed — Health Issues / Out-of-Range Detected'))}
                </span>
              </div>
            </div>

            {/* Patient & Report Metadata Grid with Confidence Indicators & Full Demographics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">{t('rep_label_name', 'NAME')}</span>
                  {ocrData.patient_information?.confidence_badge && (
                    <span className="text-[9px] font-extrabold text-teal-800 bg-teal-100/90 border border-teal-200 px-2 py-0.5 rounded-md">
                      {tText(ocrData.patient_information.confidence_badge)}
                    </span>
                  )}
                </div>
                <strong className="text-slate-900 text-sm block">
                  {tText(ocrData.patient_information?.name || 'Not clearly available.')}
                </strong>
              </div>
              {ocrData.patient_information?.age_sex && ocrData.patient_information.age_sex !== 'Not clearly available.' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_age_sex', 'AGE / SEX')}</span>
                  <strong className="text-slate-900 text-sm block">
                    {tText(ocrData.patient_information.age_sex)}
                  </strong>
                </div>
              )}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_report', 'REPORT')}</span>
                <strong className="text-teal-900 text-sm block">
                  {tText(ocrData.patient_information?.report || ocrData.document_type || 'Doctor Prescription')}
                </strong>
              </div>
              {ocrData.patient_information?.clinic_name && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_clinic', 'CLINIC / CENTRE')}</span>
                  <strong className="text-slate-900 text-sm block">
                    {tText(ocrData.patient_information.clinic_name)}
                  </strong>
                </div>
              )}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_department', 'DEPARTMENT')}</span>
                <strong className="text-slate-900 text-sm block">
                  {tText(ocrData.patient_information?.department || 'General Medicine')}
                </strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_date', 'DATE')}</span>
                <strong className="text-slate-900 text-sm block">
                  {tText(ocrData.patient_information?.date || 'Not clearly available.')}
                </strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_ref_doctor', 'REF. DOCTOR')}</span>
                <strong className="text-slate-900 text-sm block">
                  {tText(ocrData.patient_information?.ref_doctor || 'Not clearly available.')}
                </strong>
              </div>
              {ocrData.patient_information?.mobile_no && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_mobile', 'MOBILE NO')}</span>
                  <strong className="text-slate-900 text-sm font-mono block">
                    {ocrData.patient_information.mobile_no}
                  </strong>
                </div>
              )}
              {ocrData.patient_information?.reg_id && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_reg_id', 'REG ID / UHID')}</span>
                  <strong className="text-slate-900 text-sm font-mono block">
                    {ocrData.patient_information.reg_id}
                  </strong>
                </div>
              )}
              {ocrData.patient_information?.occupation && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_occupation', 'OCCUPATION')}</span>
                  <strong className="text-slate-900 text-sm block">
                    {tText(ocrData.patient_information.occupation)}
                  </strong>
                </div>
              )}
              {ocrData.patient_information?.address && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 sm:col-span-2">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">{t('rep_label_address', 'ADDRESS')}</span>
                  <strong className="text-slate-900 text-sm block">
                    {tText(ocrData.patient_information.address)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* SECTION: REPORT FINDINGS (NUMBERED LIST WITH BOLD ABNORMAL/SIGNIFICANT FINDINGS) */}
          {ocrData.findings && ocrData.findings.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {t('findings_title', 'Report Findings')}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t('findings_desc', 'Sequential clinical findings extracted from the document.')}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                  {ocrData.findings.length} {t('findings_count_suffix', 'Findings')}
                </span>
              </div>

              <ol className="space-y-2.5 text-xs sm:text-sm">
                {ocrData.findings.map((f, idx) => {
                  const isAbnormal = !f.is_normal || f.finding.toLowerCase().includes('dysfunction');
                  return (
                    <li
                      key={idx}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                        isAbnormal
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950 font-bold'
                          : 'bg-slate-50/80 border-slate-200/80 text-slate-800 font-medium'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${
                          isAbnormal ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="mt-0.5">{tText(f.finding)}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* SECTION: CONCLUSION & HEALTH STATUS */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {t('conclusion_title', 'Conclusion & Health Status')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('conclusion_desc', 'Overall clinical impression and identified health status.')}
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              {((ocrData.parameters && ocrData.parameters.some(p => p.status === 'high' || p.status === 'low')) || (ocrData.findings && ocrData.findings.some(f => !f.is_normal))) ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold px-3.5 py-1.5 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>{t('conclusion_attention_badge', 'Attention Needed — Health Issues / Out-of-Range Detected')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{t('conclusion_normal_badge', 'Normal — All Evaluated Parameters Within Range')}</span>
                </span>
              )}
            </div>

            {/* Health Issue / Normal Breakdown Box */}
            {((ocrData.parameters && ocrData.parameters.some(p => p.status === 'high' || p.status === 'low')) || (ocrData.findings && ocrData.findings.some(f => !f.is_normal))) ? (
              <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  {t('conclusion_attention_findings_head', '⚠ Primary Health Findings Requiring Attention:')}
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(ocrData.parameters || []).filter(p => p.status === 'high' || p.status === 'low').map((p, pIdx) => (
                    <span key={pIdx} className="bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold px-3 py-1 rounded-xl">
                      <strong>{p.test_name}</strong>: {p.result_value} {p.unit} ({p.status_label ? tText(p.status_label) : (p.status === 'high' ? t('term_high', 'High') : t('term_low', 'Low'))})
                    </span>
                  ))}
                  {(ocrData.findings || []).filter(f => !f.is_normal).map((f, fIdx) => (
                    <span key={fIdx} className="bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold px-3 py-1 rounded-xl">
                      {tText(f.finding)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-emerald-200 font-medium">
                  <strong>{t('conclusion_normal_heading', 'Normal Health Indication:')}</strong> {t('conclusion_normal_body', 'All evaluated test parameters and clinical observations fall within standard laboratory reference ranges. No abnormal health flags were detected by this automated review.')}
                </p>
              </div>
            )}

            {/* Clinical Conclusion Text */}
            {ocrData.conclusion && (
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                {ocrData.conclusion.split('\n').map((line, cIdx) => (
                  line.trim() ? (
                    <p key={cIdx} className="text-sm sm:text-base text-teal-100 font-bold leading-relaxed">
                      {tText(line.trim())}
                    </p>
                  ) : null
                ))}
              </div>
            )}
          </div>

          {/* SECTION: SIMPLE EXPLANATION (LINE-BY-LINE MULTI-LINGUAL) */}
          <FormattedExplanation
            explanation={ocrData.simple_explanation || ocrData.report_summary || ocrData.summary}
            rawText={ocrData.raw_text}
            parameters={ocrData.parameters}
            docType={ocrData.document_type}
            prescription={ocrData.prescription}
            fileId={uploadResult?.file_id}
            currentLanguage={language}
            onLanguageChange={handleLanguageSwitch}
            onRefresh={() => fetchSummaryForLang(language)}
            loading={summaryLoading}
          />

          {/* SECTION 5 & 16: MEASUREMENTS TABLE */}
          {ocrData.measurements && ocrData.measurements.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {t('measurements_title', 'Measurements')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('measurements_desc', 'Measured values compared against the report reference range.')}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  {ocrData.measurements.length} {t('measurements_count_suffix', 'Measurements')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3.5 px-4">{t('th_parameter', 'Parameter')}</th>
                      <th className="py-3.5 px-4">{t('th_result', 'Result')}</th>
                      <th className="py-3.5 px-4">{t('th_reference', 'Reference')}</th>
                      <th className="py-3.5 px-4">{t('th_status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ocrData.measurements.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{m.parameter}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {m.value} <span className="font-normal text-xs text-slate-500">{m.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                          {m.reference_range} {m.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                              m.status === 'within_reported_range' || m.status === 'normal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.status === 'within_reported_range' || m.status === 'normal'
                              ? t('status_within_range', '✓ Within range')
                              : t('status_outside_range', '⚠ Outside range')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 6 & 16: REPORTED FINDINGS */}
          {ocrData.findings && ocrData.findings.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {t('findings_title', 'Reported Findings')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('findings_desc', 'Complete extracted clinical observations and descriptions from the document.')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                {ocrData.findings.map((f, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                      f.is_normal
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium'
                    }`}
                  >
                    {f.is_normal ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{tText(f.finding)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 8 & 16: MEDICAL TERMS EXPLAINED */}
          {ocrData.medical_terms_explained && ocrData.medical_terms_explained.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {t('terms_explained_title', 'Medical Terms Explained')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('terms_explained_desc', 'Plain-English explanations of clinical terminology found in this report.')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ocrData.medical_terms_explained.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <h4 className="font-extrabold text-sm text-teal-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                      {item.term}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {tText(item.explanation)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 9 & 16: REPORT REVIEW ("DOES THIS REPORT SHOW ANY ISSUE?") */}
          {ocrData.report_review && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {t('review_title', 'Report Review')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('review_desc', 'Summary of findings and items to discuss with your healthcare professional.')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {tText(ocrData.report_review.summary)}
                </div>

                {ocrData.report_review.findings_requiring_discussion && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-1 text-xs sm:text-sm">
                    <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      {t('review_discussion_title', 'Findings Requiring Discussion')}
                    </h4>
                    <p className="text-amber-900 leading-relaxed">
                      {tText(ocrData.report_review.findings_requiring_discussion)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4, 9, 10, 11, 15: STRUCTURED PARAMETERS / PRESCRIPTIONS & HUMAN VERIFICATION */}
          <OCRResultPanel
            ocrData={ocrData}
            fileId={uploadResult?.file_id}
            onVerificationComplete={handleVerificationDone}
            onExplainTerm={handleExplainSpecificTerm}
          />

          {/* SECTION 8: UNDERSTAND YOUR REPORT (PLAIN-ENGLISH EXPLANATIONS) */}
          {explaining && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="text-slate-800 font-bold text-sm">
                Generating patient-friendly medical explanations...
              </p>
              <p className="text-xs text-slate-400">
                Translating verified clinical entities into plain-language summaries
              </p>
            </div>
          )}

          {explanations && <ExplanationPanel explanations={explanations} />}

          {/* SECTION 10: REFERENCE RANGE SMALL INFORMATION NOTICE */}
          {ocrData.reference_range_check && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-center gap-2.5">
              <Info className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <span>
                <strong>Note:</strong> {tText(ocrData.reference_range_check.message) || 'Some values could not be automatically compared because a clear reference range was not available in the document.'}
              </span>
            </div>
          )}

          {/* INTERACTIVE REPORT-SPECIFIC HEALTH Q&A */}
          <ReportQuestionWidget reportData={ocrData} />

          {/* SECTION 11: "WHAT SHOULD I DO?" SAFE NEXT-STEP GUIDANCE */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {t('next_steps_title', 'What Should I Do?')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('next_steps_desc', 'Safe, responsible next-step guidance for your clinical consultation.')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {(ocrData.next_steps || []).map((stepText, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 font-medium leading-relaxed">{tText(stepText)}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span>{t('ready_another_doc', 'Ready for another document?')}</span>
              <button
                onClick={handleResetUpload}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors"
              >
                {t('upload_another_btn', 'Upload Another Medical Report')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Check My Report" Modal Dialog */}
      <CheckReportModal
        isOpen={checkReportOpen}
        onClose={() => setCheckReportOpen(false)}
        checkData={ocrData?.check_my_report}
        overallStatus={ocrData?.overall_status}
      />

      {/* "Compare Reports" Multi-Date Modal Dialog */}
      <ReportComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        initialCurrentText={ocrData?.raw_text || ''}
      />

      {/* Instant Medical Term Explanation Modal */}
      <MedicalTermModal
        isOpen={!!activeTermExplanation}
        onClose={() => setActiveTermExplanation(null)}
        explanation={activeTermExplanation}
      />

      {/* Manual Entry Modal — shown when document quality is too low */}
      {manualEntryOpen && (
        <ManualEntryModal
          fileName={file?.name || uploadResult?.original_filename}
          onSubmit={handleManualSubmit}
          onClose={() => setManualEntryOpen(false)}
        />
      )}
    </div>
  );
}
