import React, { useState } from 'react';
import {
  CheckCircle2, AlertCircle, Edit3, Check, X, ShieldCheck,
  ChevronDown, ChevronUp, Sparkles, FileText, Pill, HelpCircle,
  Stethoscope, Info, AlertTriangle
} from 'lucide-react';
import { verifyOCR } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

function ConfidenceBadge({ confidence }) {
  const { t, tText } = useLanguage();
  if (confidence === undefined || confidence === null) return null;
  const num = typeof confidence === 'number' ? confidence : parseFloat(confidence) || 0;

  if (num >= 80) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> {num.toFixed(0)}% {t('term_high', 'High')}
      </span>
    );
  }
  if (num >= 60) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
        <AlertCircle className="h-3 w-3" /> {num.toFixed(0)}% Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full animate-pulse">
      <AlertCircle className="h-3 w-3" /> {num.toFixed(0)}% {t('term_low', 'Low')} ({t('pillar2_title', 'Verify')})
    </span>
  );
}

function StatusBadge({ status, statusLabel }) {
  const { t, tText } = useLanguage();
  if (status === 'normal') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
        {statusLabel ? tText(statusLabel) : t('status_within_range', '✓ Within reported range')}
      </span>
    );
  }
  if (status === 'high') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">
        {statusLabel ? tText(statusLabel) : '⚠ ' + t('term_high', 'Above reported range')}
      </span>
    );
  }
  if (status === 'low') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg">
        {statusLabel ? tText(statusLabel) : '⚠ ' + t('term_low', 'Below reported range')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
      {statusLabel ? tText(statusLabel) : '? Unable to determine'}
    </span>
  );
}

function SeverityBadge({ severity }) {
  if (!severity || severity === 'Normal') {
    return (
      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        Normal
      </span>
    );
  }
  if (severity === 'Mildly Outside Range') {
    return (
      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
        Mildly Outside
      </span>
    );
  }
  if (severity === 'Significantly Outside Range') {
    return (
      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
        Significantly Outside
      </span>
    );
  }
  return (
    <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
      {severity}
    </span>
  );
}

export default function OCRResultPanel({
  ocrData,
  fileId,
  onVerificationComplete,
  onExplainTerm
}) {
  // Check if document has parsed structured parameters or prescription
  const initialParams = ocrData?.parameters || [];
  const initialPrescription = ocrData?.prescription?.medicines || [];

  const [parameters, setParameters] = useState(() =>
    initialParams.map((p, idx) => ({ ...p, uniqueId: idx }))
  );
  const [medicines, setMedicines] = useState(() =>
    initialPrescription.map((m, idx) => ({ ...m, uniqueId: idx }))
  );

  const [editingParamId, setEditingParamId] = useState(null);
  const [editParamVal, setEditParamVal] = useState('');
  const [confirmedParamIds, setConfirmedParamIds] = useState(new Set());

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'attention' | 'normal'
  const [showRaw, setShowRaw] = useState(false);
  const [savingVerify, setSavingVerify] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  if (!ocrData) return null;

  const rawText = ocrData.raw_text || '';
  const isPrescriptionDoc =
    ocrData.document_category === 'Doctor Prescription' ||
    ocrData.document_type?.toLowerCase().includes('prescription');

  const handleStartEditParam = (item) => {
    setEditingParamId(item.uniqueId);
    setEditParamVal(item.result_value);
  };

  const handleSaveEditParam = (idx) => {
    const updated = [...parameters];
    const num = parseFloat(editParamVal);
    updated[idx].result_value = editParamVal;
    updated[idx].result_num = !isNaN(num) ? num : null;
    updated[idx].needs_verification = false;
    setParameters(updated);
    setConfirmedParamIds((prev) => new Set(prev).add(idx));
    setEditingParamId(null);
  };

  const handleConfirmParam = (idx) => {
    setConfirmedParamIds((prev) => new Set(prev).add(idx));
  };

  const handleSaveVerification = async () => {
    setSavingVerify(true);
    try {
      const payloadToSave = isPrescriptionDoc ? medicines : parameters;
      await verifyOCR(fileId, payloadToSave);
      setVerifiedSuccess(true);
      if (onVerificationComplete) {
        onVerificationComplete(payloadToSave);
      }
    } catch (err) {
      console.error('Failed to save verification:', err);
    } finally {
      setSavingVerify(false);
    }
  };

  // Filter parameters
  const filteredParams = parameters.filter((p) => {
    if (filterTab === 'attention') return p.status === 'high' || p.status === 'low';
    if (filterTab === 'normal') return p.status === 'normal';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Human in control verification banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-teal-500/20 border border-teal-400/40 p-2.5 rounded-2xl">
            <ShieldCheck className="h-7 w-7 text-teal-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white">
              Human-in-the-Loop Verification
            </h3>
            <p className="text-xs text-teal-100/90 mt-0.5">
              "AI assists the user; the user remains in control." Inspect, confirm, or edit any detected value.
            </p>
          </div>
        </div>
        <div className="bg-slate-800/90 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200">
          Document Quality: <span className="text-teal-400 font-black">{ocrData.confidence_scores?.overall || 85}%</span>
        </div>
      </div>

      {/* PRESCRIPTION VIEW (when document is a prescription) */}
      {isPrescriptionDoc ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                Doctor Prescription Analysis
              </span>
              <h4 className="text-lg font-black text-slate-900 mt-1">
                Extracted Prescribed Medications ({medicines.length})
              </h4>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Doctor: <span className="font-bold text-slate-800">{ocrData.prescription?.doctor_name || 'Clinician'}</span>
            </div>
          </div>

          {medicines.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <Pill className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No standard medication names clearly identified.</p>
              <p className="text-xs mt-1">Please inspect the raw text below.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicines.map((med, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4.5 space-y-3 hover:border-teal-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-base">
                          {med.medicine_name}
                        </h5>
                        <span className="text-xs text-teal-700 font-bold">
                          {med.dosage}
                        </span>
                      </div>
                    </div>
                    <ConfidenceBadge confidence={med.confidence} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Frequency</span>
                      <span className="font-bold text-slate-800">{med.frequency}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Duration</span>
                      <span className="font-bold text-slate-800">{med.duration}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Instructions</span>
                      <span className="font-medium text-slate-700">{med.instructions}</span>
                    </div>
                  </div>

                  {med.warning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{med.warning}</span>
                    </div>
                  )}

                  {onExplainTerm && (
                    <button
                      onClick={() => onExplainTerm(med.medicine_name)}
                      className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>What does this medicine do?</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* LABORATORY PARAMETERS TABLE */
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
          {/* Table Header with Filter Tabs */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Extracted Medical Parameters & Reference Ranges
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare numerical results against the printed laboratory reference range.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({parameters.length})
              </button>
              <button
                onClick={() => setFilterTab('attention')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  filterTab === 'attention'
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Outside Range (
                {parameters.filter((p) => p.status === 'high' || p.status === 'low').length}
                )
              </button>
              <button
                onClick={() => setFilterTab('normal')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  filterTab === 'normal'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Within Range ({parameters.filter((p) => p.status === 'normal').length})
              </button>
            </div>
          </div>

          {filteredParams.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-sm text-slate-700">No parameters matching filter.</p>
              <p className="text-xs text-slate-400 mt-1">Select 'All' to view all extracted measurements.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Test Parameter</th>
                    <th className="py-3.5 px-4">Observed Result</th>
                    <th className="py-3.5 px-4">Report Reference Range</th>
                    <th className="py-3.5 px-4">Evaluation Status</th>
                    <th className="py-3.5 px-4">Severity Level</th>
                    <th className="py-3.5 px-4">OCR Confidence</th>
                    <th className="py-3.5 px-4 text-right">Human Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParams.map((item, idx) => {
                    const isEditing = editingParamId === item.uniqueId;
                    const isConfirmed = confirmedParamIds.has(item.uniqueId);
                    const isLowConf = item.confidence < 70;
                    const isOutside = item.status === 'high' || item.status === 'low';

                    return (
                      <tr
                        key={item.uniqueId || idx}
                        className={`transition-colors ${
                          isOutside
                            ? 'bg-amber-50/40 hover:bg-amber-50/70'
                            : isLowConf && !isConfirmed
                            ? 'bg-rose-50/40 hover:bg-rose-50/70'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Test Parameter & "What does this mean?" */}
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div>
                            <span className="text-slate-900 block">{item.test_name}</span>
                            {onExplainTerm && (
                              <button
                                onClick={() => onExplainTerm(item.test_name)}
                                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 mt-0.5"
                              >
                                <HelpCircle className="h-3 w-3" /> What does this mean?
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Result Value */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editParamVal}
                                onChange={(e) => setEditParamVal(e.target.value)}
                                className="w-24 border border-teal-400 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-mono"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditParam(item.uniqueId)}
                                className="p-1 bg-teal-600 text-white rounded hover:bg-teal-700"
                                title="Save correction"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingParamId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <span className="text-sm">
                                {item.result_value}{' '}
                                <span className="text-slate-500 text-xs font-normal font-sans">
                                  {item.unit}
                                </span>
                              </span>
                              {isLowConf && !isConfirmed && (
                                <p className="text-[10px] text-amber-700 mt-0.5">
                                  ⚠ Low confidence — verify with original document.
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Reference Range */}
                        <td className="py-4 px-4 font-mono text-slate-600 text-xs">
                          {item.reference_range} {item.unit}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <StatusBadge status={item.status} statusLabel={item.status_label} />
                        </td>

                        {/* Severity Level */}
                        <td className="py-4 px-4">
                          <SeverityBadge severity={item.severity} />
                        </td>

                        {/* Confidence */}
                        <td className="py-4 px-4">
                          <ConfidenceBadge confidence={item.confidence} />
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="h-3 w-3" /> Confirmed
                            </span>
                          ) : isLowConf ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleConfirmParam(item.uniqueId)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs"
                              >
                                YES
                              </button>
                              <button
                                onClick={() => handleStartEditParam(item)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-2xs"
                              >
                                EDIT
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditParam(item)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <Edit3 className="h-3 w-3" /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Raw Text Collapsible Drawer */}
      {rawText && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span>Inspect Raw OCR Text Output</span>
            </div>
            {showRaw ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showRaw && (
            <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs border-t border-slate-800 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {rawText}
            </div>
          )}
        </div>
      )}

      {/* Submit Verification Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-500">
          Once satisfied with all fields, confirm verification to generate simple explanations.
        </p>
        <button
          onClick={handleSaveVerification}
          disabled={savingVerify || verifiedSuccess}
          className={`px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 ${
            verifiedSuccess
              ? 'bg-emerald-600 text-white cursor-default'
              : 'bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50'
          }`}
        >
          {savingVerify ? (
            'Saving verification...'
          ) : verifiedSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Verification Saved & Confirmed
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" /> Submit Verified Information
            </>
          )}
        </button>
      </div>
    </div>
  );
}
