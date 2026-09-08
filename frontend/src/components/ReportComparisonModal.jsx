import React, { useState, useRef } from 'react';
import {
  GitCompare, X, ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
  Loader2, RefreshCw, CheckCircle2, TrendingUp, TrendingDown, HelpCircle,
  Sparkles, FileText, Activity, AlertTriangle, ArrowRight, ShieldCheck,
  Upload, Ban, Check, FileCheck, RefreshCcw
} from 'lucide-react';
import { compareReports, uploadDocument, validateDocument, performOCR } from '../services/api';

const SAMPLE_PRESETS = [
  {
    name: '🩸 CBC & Blood Count (Anemia & Recovery)',
    labelA: 'Report (Jan 2026)',
    labelB: 'Report (Aug 2026)',
    textA: `Complete Blood Count (CBC)
Hemoglobin: 10.2 g/dL (12.0 - 16.0)
Total Leukocyte Count: 8900 cells/cumm (4000 - 11000)
Platelet Count: 180000 cells/cumm (150000 - 450000)
Packed Cell Volume (PCV): 32 % (36 - 48)
RBC Count: 3.8 mill/cumm (4.0 - 5.5)`,
    textB: `Complete Blood Count (CBC)
Hemoglobin: 12.8 g/dL (12.0 - 16.0)
Total Leukocyte Count: 6800 cells/cumm (4000 - 11000)
Platelet Count: 240000 cells/cumm (150000 - 450000)
Packed Cell Volume (PCV): 39 % (36 - 48)
RBC Count: 4.5 mill/cumm (4.0 - 5.5)`
  },
  {
    name: '🍬 Diabetes & Blood Sugar Trajectory',
    labelA: 'Report (3 Months Ago)',
    labelB: 'Report (Today)',
    textA: `Diabetes & Metabolic Profile
Fasting Blood Sugar: 142 mg/dL (70 - 99)
Post Prandial Glucose: 198 mg/dL (70 - 140)
HbA1c: 7.8 % (4.0 - 5.6)
Serum Creatinine: 1.0 mg/dL (0.6 - 1.2)`,
    textB: `Diabetes & Metabolic Profile
Fasting Blood Sugar: 108 mg/dL (70 - 99)
Post Prandial Glucose: 138 mg/dL (70 - 140)
HbA1c: 6.4 % (4.0 - 5.6)
Serum Creatinine: 0.9 mg/dL (0.6 - 1.2)`
  },
  {
    name: '🫘 Kidney & Renal Function (KFT)',
    labelA: 'Baseline (June 2026)',
    labelB: 'Follow-up (August 2026)',
    textA: `Renal Function Test (KFT)
Serum Creatinine: 1.5 mg/dL (0.6 - 1.2)
Blood Urea: 48 mg/dL (15 - 45)
Serum Sodium: 138 mmol/L (135 - 145)
Serum Potassium: 4.6 mmol/L (3.5 - 5.0)`,
    textB: `Renal Function Test (KFT)
Serum Creatinine: 1.1 mg/dL (0.6 - 1.2)
Blood Urea: 32 mg/dL (15 - 45)
Serum Sodium: 140 mmol/L (135 - 145)
Serum Potassium: 4.2 mmol/L (3.5 - 5.0)`
  },
  {
    name: '🫀 Lipid & Cholesterol Profile',
    labelA: 'Previous Lipid Panel',
    labelB: 'Current Lipid Panel',
    textA: `Lipid Profile Panel
Total Cholesterol: 240 mg/dL (125 - 200)
Triglycerides: 210 mg/dL (50 - 150)
Fasting Glucose: 95 mg/dL (70 - 99)`,
    textB: `Lipid Profile Panel
Total Cholesterol: 185 mg/dL (125 - 200)
Triglycerides: 145 mg/dL (50 - 150)
Fasting Glucose: 90 mg/dL (70 - 99)`
  }
];

export default function ReportComparisonModal({ isOpen, onClose, initialCurrentText = '' }) {
  // Mode per report: 'upload' or 'text'
  const [modeA, setModeA] = useState('upload');
  const [modeB, setModeB] = useState('upload');

  // Text & Label State
  const [reportAText, setReportAText] = useState('');
  const [reportBText, setReportBText] = useState(initialCurrentText || '');
  const [labelA, setLabelA] = useState('Previous Report (Report 1)');
  const [labelB, setLabelB] = useState('Current Report (Report 2)');

  // File Upload & OCR State for Report A
  const [fileA, setFileA] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [validationA, setValidationA] = useState(null);
  const [errorA, setErrorA] = useState(null);

  // File Upload & OCR State for Report B
  const [fileB, setFileB] = useState(null);
  const [loadingB, setLoadingB] = useState(false);
  const [validationB, setValidationB] = useState(null);
  const [errorB, setErrorB] = useState(null);

  // Comparison State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null);

  if (!isOpen) return null;

  // Process file upload and run medical validation + OCR
  const handleFileUpload = async (selectedFile, target) => {
    if (!selectedFile) return;

    if (target === 'A') {
      setFileA(selectedFile);
      setLoadingA(true);
      setErrorA(null);
      setValidationA(null);
      setReportAText('');
    } else {
      setFileB(selectedFile);
      setLoadingB(true);
      setErrorB(null);
      setValidationB(null);
      setReportBText('');
    }

    try {
      // 1. Upload File
      const upRes = await uploadDocument(selectedFile);
      const fileId = upRes.data.file_id;

      // 2. Validate Medical Document
      const valRes = await validateDocument(fileId);
      const isMed = valRes.data?.is_medical;
      const docType = valRes.data?.document_type || 'Medical Document';

      if (target === 'A') setValidationA(valRes.data);
      else setValidationB(valRes.data);

      // 3. If NOT a medical document, trigger strict warning
      if (isMed === false) {
        const warnMsg = `Non-Medical File Warning: "${selectedFile.name}" was identified as a ${docType}. It does not contain valid clinical lab tests or medical report data. Please upload a genuine medical report.`;
        if (target === 'A') {
          setErrorA(warnMsg);
          setLoadingA(false);
        } else {
          setErrorB(warnMsg);
          setLoadingB(false);
        }
        return;
      }

      // 4. If Medical Report, extract OCR content
      const ocrRes = await performOCR(fileId);
      const extractedText = ocrRes.data?.raw_text || '';
      const detectedLabel = ocrRes.data?.document_type || selectedFile.name.replace(/\.[^/.]+$/, '');

      if (target === 'A') {
        setReportAText(extractedText);
        setLabelA(detectedLabel);
      } else {
        setReportBText(extractedText);
        setLabelB(detectedLabel);
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to process and validate document.';
      if (target === 'A') setErrorA(msg);
      else setErrorB(msg);
    } finally {
      if (target === 'A') setLoadingA(false);
      else setLoadingB(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setModeA('text');
    setModeB('text');
    setReportAText(preset.textA);
    setReportBText(preset.textB);
    setLabelA(preset.labelA);
    setLabelB(preset.labelB);
    setErrorA(null);
    setErrorB(null);
    setValidationA(null);
    setValidationB(null);
    setFileA(null);
    setFileB(null);
    setResult(null);
    setError(null);
  };

  const handleRunComparison = async () => {
    if (errorA) {
      setError('Report 1 contains a non-medical document warning. Please upload a valid medical report.');
      return;
    }
    if (errorB) {
      setError('Report 2 contains a non-medical document warning. Please upload a valid medical report.');
      return;
    }
    if (!reportAText.trim() || !reportBText.trim()) {
      setError('Please provide content or upload files for both Report 1 and Report 2.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await compareReports({
        rawTextA: reportAText,
        rawTextB: reportBText,
        labelA: labelA,
        labelB: labelB,
      });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to compare reports. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Summary Metrics from comparison
  const summaryMetrics = result?.comparison_table ? {
    total: result.comparison_table.length,
    increased: result.comparison_table.filter(r => r.trend === 'increased').length,
    decreased: result.comparison_table.filter(r => r.trend === 'decreased').length,
    stable: result.comparison_table.filter(r => r.trend === 'stable').length,
  } : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 text-white p-3.5 rounded-2xl shadow-sm">
            <GitCompare className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-800 bg-teal-100 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Multi-Date Progression Engine
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Universal Medical Comparison
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Compare 2 Medical Reports & Track Changes
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Upload two medical reports (JPG, PNG, PDF) or paste text side-by-side to track changes, parameter trends, and health progression over time.
            </p>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Quick Test Presets (Click to load sample reports):
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs bg-white hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Comparison Inputs (Report 1 vs Report 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ===================== REPORT A (PREVIOUS) ===================== */}
          <div className="bg-slate-50/90 border border-slate-200 p-5 rounded-3xl space-y-3 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Previous Report
                </label>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setModeA('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    modeA === 'upload' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModeA('text')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    modeA === 'text' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>Paste Text</span>
                </button>
              </div>
            </div>

            {/* Label Input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold flex-shrink-0">Label / Date:</span>
              <input
                type="text"
                value={labelA}
                onChange={(e) => setLabelA(e.target.value)}
                placeholder="e.g. Previous Report (Jan 2026)"
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium w-full focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Upload File Box for Report A */}
            {modeA === 'upload' ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRefA}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.webp"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'A')}
                />
                <div
                  onClick={() => fileInputRefA.current && fileInputRefA.current.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    loadingA
                      ? 'bg-teal-50/50 border-teal-400'
                      : errorA
                      ? 'bg-rose-50/40 border-rose-300 hover:bg-rose-50/60'
                      : validationA?.is_medical
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/20'
                  }`}
                >
                  {loadingA ? (
                    <div className="py-4 space-y-2">
                      <Loader2 className="h-6 w-6 text-teal-600 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-teal-800">Validating medical document & extracting data...</p>
                    </div>
                  ) : errorA ? (
                    <div className="space-y-2 py-2">
                      <AlertTriangle className="h-7 w-7 text-rose-500 mx-auto" />
                      <p className="text-xs font-bold text-rose-800">Non-Medical Document Warning</p>
                      <p className="text-[11px] text-rose-700 leading-relaxed px-2">{errorA}</p>
                      <span className="inline-block mt-1 text-[11px] font-bold text-rose-800 underline">
                        Click here to upload another report
                      </span>
                    </div>
                  ) : validationA?.is_medical ? (
                    <div className="space-y-1 py-2 text-emerald-900">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold">✓ Medical Report Verified</p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {fileA?.name} ({validationA.document_type || 'Report'})
                      </p>
                      <span className="inline-block mt-1 text-[11px] text-teal-700 underline font-semibold">
                        Click to change file
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 py-3 text-slate-600">
                      <Upload className="h-7 w-7 text-teal-600 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Click to upload Report 1</p>
                        <p className="text-[11px] text-slate-500">Supports JPG, PNG, PDF, WEBP up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {reportAText && !errorA && (
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 max-h-24 overflow-y-auto text-[11px] font-mono text-slate-600">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Extracted OCR Text Preview:</span>
                    {reportAText.slice(0, 200)}...
                  </div>
                )}
              </div>
            ) : (
              /* Paste Text Box for Report A */
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={reportAText}
                  onChange={(e) => setReportAText(e.target.value)}
                  placeholder="Paste text or parameters from previous lab report..."
                  className="w-full text-xs font-mono border border-slate-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* ===================== REPORT B (CURRENT) ===================== */}
          <div className="bg-teal-50/40 border border-teal-200 p-5 rounded-3xl space-y-3 relative">
            <div className="flex items-center justify-between border-b border-teal-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <label className="text-xs font-black text-teal-950 uppercase tracking-wide">
                  Current Report
                </label>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-teal-100/80 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setModeB('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    modeB === 'upload' ? 'bg-white text-teal-800 shadow-xs' : 'text-teal-700 hover:text-teal-950'
                  }`}
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModeB('text')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    modeB === 'text' ? 'bg-white text-teal-800 shadow-xs' : 'text-teal-700 hover:text-teal-950'
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>Paste Text</span>
                </button>
              </div>
            </div>

            {/* Label Input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-teal-800 font-semibold flex-shrink-0">Label / Date:</span>
              <input
                type="text"
                value={labelB}
                onChange={(e) => setLabelB(e.target.value)}
                placeholder="e.g. Current Report (Aug 2026)"
                className="text-xs border border-teal-300 rounded-lg px-2.5 py-1 bg-white font-medium w-full focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Upload File Box for Report B */}
            {modeB === 'upload' ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRefB}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.webp"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'B')}
                />
                <div
                  onClick={() => fileInputRefB.current && fileInputRefB.current.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    loadingB
                      ? 'bg-teal-50/50 border-teal-400'
                      : errorB
                      ? 'bg-rose-50/40 border-rose-300 hover:bg-rose-50/60'
                      : validationB?.is_medical
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'border-teal-300 bg-white hover:border-teal-500 hover:bg-teal-50/40'
                  }`}
                >
                  {loadingB ? (
                    <div className="py-4 space-y-2">
                      <Loader2 className="h-6 w-6 text-teal-600 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-teal-800">Validating medical document & extracting data...</p>
                    </div>
                  ) : errorB ? (
                    <div className="space-y-2 py-2">
                      <AlertTriangle className="h-7 w-7 text-rose-500 mx-auto" />
                      <p className="text-xs font-bold text-rose-800">Non-Medical Document Warning</p>
                      <p className="text-[11px] text-rose-700 leading-relaxed px-2">{errorB}</p>
                      <span className="inline-block mt-1 text-[11px] font-bold text-rose-800 underline">
                        Click here to upload another report
                      </span>
                    </div>
                  ) : validationB?.is_medical ? (
                    <div className="space-y-1 py-2 text-emerald-900">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold">✓ Medical Report Verified</p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {fileB?.name} ({validationB.document_type || 'Report'})
                      </p>
                      <span className="inline-block mt-1 text-[11px] text-teal-700 underline font-semibold">
                        Click to change file
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 py-3 text-slate-600">
                      <Upload className="h-7 w-7 text-teal-600 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Click to upload Report 2</p>
                        <p className="text-[11px] text-slate-500">Supports JPG, PNG, PDF, WEBP up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {reportBText && !errorB && (
                  <div className="bg-white border border-teal-200 rounded-xl p-2.5 max-h-24 overflow-y-auto text-[11px] font-mono text-slate-600">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Extracted OCR Text Preview:</span>
                    {reportBText.slice(0, 200)}...
                  </div>
                )}
              </div>
            ) : (
              /* Paste Text Box for Report B */
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={reportBText}
                  onChange={(e) => setReportBText(e.target.value)}
                  placeholder="Paste text or parameters from current lab report..."
                  className="w-full text-xs font-mono border border-teal-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>

        {/* Global Error Notice if Non-Medical or Missing */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Compare Action Button */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <p className="text-xs text-slate-500">
            {reportAText && reportBText
              ? 'Both reports ready! Click below to compute changes and trends.'
              : 'Upload or paste two medical reports above to start comparison.'}
          </p>
          <button
            onClick={handleRunComparison}
            disabled={loading || !reportAText.trim() || !reportBText.trim() || !!errorA || !!errorB}
            className="px-7 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2.5 text-xs sm:text-sm disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Computing Comparison...</span>
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4" />
                <span>Compare & Show What Changed</span>
              </>
            )}
          </button>
        </div>

        {/* ===================== COMPARISON RESULTS ===================== */}
        {result && (
          <div className="space-y-6 pt-5 border-t-2 border-slate-100 animate-in fade-in-50">
            {/* Key Changes Summary Metrics */}
            {summaryMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-2xl text-center">
                  <span className="text-xs font-bold text-slate-500 block">Matched Parameters</span>
                  <span className="text-xl font-black text-slate-900">{summaryMetrics.total}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-center">
                  <span className="text-xs font-bold text-amber-700 block flex items-center justify-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> Increased
                  </span>
                  <span className="text-xl font-black text-amber-900">{summaryMetrics.increased}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-center">
                  <span className="text-xs font-bold text-blue-700 block flex items-center justify-center gap-1">
                    <TrendingDown className="h-3.5 w-3.5" /> Decreased
                  </span>
                  <span className="text-xl font-black text-blue-900">{summaryMetrics.decreased}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-center">
                  <span className="text-xs font-bold text-emerald-700 block flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Stable / Normal
                  </span>
                  <span className="text-xl font-black text-emerald-900">{summaryMetrics.stable}</span>
                </div>
              </div>
            )}

            {/* Progression Comparison Table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  <span>Side-by-Side Parameter Trajectory Table</span>
                </h4>
                <span className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl">
                  {result.report_a_title} → {result.report_b_title}
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Parameter</th>
                      <th className="py-3.5 px-4">{result.report_a_title}</th>
                      <th className="py-3.5 px-4">{result.report_b_title}</th>
                      <th className="py-3.5 px-4">Change (Delta Δ)</th>
                      <th className="py-3.5 px-4">Direction / Trend</th>
                      <th className="py-3.5 px-4">Standard Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.comparison_table.map((row, idx) => {
                      const isInc = row.trend === 'increased';
                      const isDec = row.trend === 'decreased';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {row.test_name}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {row.previous_value} {row.previous_value !== '—' ? row.unit : ''}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 bg-teal-50/20">
                            {row.current_value} {row.current_value !== '—' ? row.unit : ''}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                                row.change.startsWith('+')
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : row.change.startsWith('-')
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {row.change}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                isInc
                                  ? 'bg-amber-50 text-amber-800'
                                  : isDec
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'bg-slate-50 text-slate-600'
                              }`}
                            >
                              {isInc ? (
                                <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                              ) : isDec ? (
                                <TrendingDown className="h-3.5 w-3.5 text-blue-600" />
                              ) : (
                                <Minus className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              <span>{row.trend_label}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                            {row.reference_range}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Informational Guidance Box */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 sm:p-5 text-xs text-teal-950 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-bold text-teal-900 text-xs uppercase tracking-wider">
                  Clinical Progression Review Guidance:
                </h5>
                <p className="leading-relaxed text-teal-900/90">
                  {result.guidance}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            AarogyaAI • Multi-Date Report Analyzer & Progression Tracker
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
