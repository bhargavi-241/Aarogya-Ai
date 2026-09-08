import React from 'react';
import { AlertCircle, TrendingUp, TrendingDown, ShieldCheck, Cpu, ExternalLink, Activity, Info } from 'lucide-react';

export default function RiskResultCard({ result, disease }) {
  if (!result) return null;

  const isHigher = result.risk_level === 'higher' || result.result?.toLowerCase().includes('higher');
  const isError = result.result === 'Evaluation Error' || result.model_loaded === false;

  const diseaseNames = {
    diabetes: 'Diabetes Mellitus',
    heart: 'Cardiovascular / Heart Disease',
    kidney: 'Chronic Kidney Disease (CKD)',
  };

  const diseaseIcons = {
    diabetes: '🩸',
    heart: '❤️',
    kidney: '🫘',
  };

  const probabilityPct = result.confidence_percent !== null && result.confidence_percent !== undefined
    ? result.confidence_percent
    : (result.probability ? (result.probability * 100).toFixed(1) : null);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm transition-all animate-in fade-in-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{diseaseIcons[disease] || '🏥'}</span>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full">
              ML Potential Risk Indication
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {diseaseNames[disease] || disease.toUpperCase()} Assessment
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
          <Cpu className="h-3.5 w-3.5 text-teal-600" />
          <span>Model: {result.model_used || 'RandomForest'}</span>
        </div>
      </div>

      {isError ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Evaluation Notice:</strong> {result.message || 'Model calculation error. Please review your inputs.'}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Primary Result Banner */}
          <div
            className={`p-5 rounded-2xl border flex items-center gap-4 ${
              isHigher
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}
          >
            <div
              className={`p-3 rounded-xl text-white shadow-xs ${
                isHigher ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
            >
              {isHigher ? <TrendingUp className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                Calculated Indication
              </span>
              <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {isHigher ? 'Higher Potential Risk Indication' : 'Low Potential Risk Indication'}
              </h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {isHigher
                  ? 'The model indicates elevated statistical patterns based on your clinical inputs.'
                  : 'The model indicates low statistical patterns based on your clinical inputs.'}
              </p>
            </div>
          </div>

          {/* Visual Probability Meter */}
          {probabilityPct !== null && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Statistical Risk Score: {probabilityPct}%</span>
                <span className={isHigher ? 'text-rose-600' : 'text-emerald-600'}>
                  {isHigher ? 'Elevated Range (≥ 50%)' : 'Standard Range (< 50%)'}
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isHigher ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(Math.max(probabilityPct, 5), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                <span>0% (Lowest Risk)</span>
                <span>50% Decision Threshold</span>
                <span>100% (Highest Risk)</span>
              </div>
            </div>
          )}

          {/* Non-Diagnostic Clarification Notice */}
          <div className="bg-amber-50/90 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs leading-relaxed flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Non-Diagnostic Clarification:</strong> {result.disclaimer}
            </div>
          </div>

          {/* Consultation Recommendation CTA */}
          <div className="pt-2">
            <button
              onClick={() => window.print()}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Discuss These Results with a Qualified Healthcare Professional
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Share these parameters with your doctor during your next clinical appointment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
