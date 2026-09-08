import React from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, AlertCircle, X, ExternalLink,
  HelpCircle, UserCheck, Stethoscope, ArrowRight
} from 'lucide-react';

export default function CheckReportModal({ isOpen, onClose, checkData, overallStatus }) {
  if (!isOpen) return null;

  const isAttention = checkData?.tone === 'amber' || overallStatus?.key === 'requires_attention';
  const isNormal = checkData?.tone === 'emerald' || overallStatus?.key === 'mostly_within_range';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close review"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3.5 rounded-2xl flex-shrink-0 ${
              isNormal
                ? 'bg-emerald-100 text-emerald-800'
                : isAttention
                ? 'bg-amber-100 text-amber-800'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            {isNormal ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-700" />
            ) : isAttention ? (
              <AlertTriangle className="h-7 w-7 text-amber-700" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-teal-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                Automated Review Assessment
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {checkData?.title || 'Report Review Summary'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Automated reference range consistency check
            </p>
          </div>
        </div>

        {/* Main Review Assessment Box */}
        <div
          className={`p-5 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap ${
            isNormal
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-medium'
              : isAttention
              ? 'bg-amber-50/80 border-amber-200 text-amber-950 font-medium'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          {checkData?.body ||
            'The values that could be reliably interpreted are within the reference ranges provided on the report.'}
        </div>

        {/* Key Health Reminders */}
        <div className="space-y-3 text-xs bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            <span>Important Medical Context:</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-600">
            <li>
              <strong>Not a medical diagnosis:</strong> Lab results must always be interpreted alongside clinical symptoms, age, and lifestyle by a doctor.
            </li>
            <li>
              <strong>Reference range variability:</strong> Different diagnostic laboratories may use differing instrument calibration benchmarks.
            </li>
            <li>
              <strong>Context matters:</strong> A slightly out-of-range value is not necessarily an indicator of disease.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
          >
            Close & Back to Dashboard
          </button>
          <span className="text-[11px] text-slate-400 text-center sm:text-right">
            Always consult a qualified healthcare professional.
          </span>
        </div>
      </div>
    </div>
  );
}
