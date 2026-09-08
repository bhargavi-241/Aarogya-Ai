import React from 'react';
import { BookOpen, Sparkles, AlertCircle, PhoneForwarded, CheckCircle, Info, ExternalLink } from 'lucide-react';

export default function ExplanationPanel({ explanations = [] }) {
  if (!explanations || explanations.length === 0) return null;

  return (
    <div className="space-y-6 mt-8">
      {/* Header Banner */}
      <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
        <div className="bg-teal-600 text-white p-2.5 rounded-xl shadow-xs">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            Simple Language Medical Explanations
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Complex clinical terminology and lab parameters converted into compassionate, patient-friendly guidance.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {explanations.map((item, idx) => (
          <div
            key={idx}
            className="bg-white border-2 border-teal-100/90 rounded-2xl p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                    Medical Concept
                  </span>
                  <h4 className="text-lg font-bold text-slate-800 mt-1">{item.term}</h4>
                </div>
                <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg">
                  <Info className="h-4 w-4" />
                </div>
              </div>

              {/* Simple Meaning */}
              <div className="mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  What This Means (In Simple Words)
                </span>
                <p className="text-sm text-slate-800 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {item.simple_explanation}
                </p>
              </div>

              {/* Why It Matters */}
              {item.why_it_matters && (
                <div className="mb-3">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block mb-1">
                    Why It Matters For Your Health
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.why_it_matters}
                  </p>
                </div>
              )}

              {/* Reference Info */}
              {item.reference_info && (
                <div className="mb-3 bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-xs text-blue-900 leading-relaxed">
                  <span className="font-semibold block mb-0.5">Reference Context:</span>
                  {item.reference_info}
                </div>
              )}

              {/* Safety points */}
              {item.important_points && item.important_points.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                    Things To Keep In Mind:
                  </span>
                  <ul className="space-y-1">
                    {item.important_points.map((pt, pIdx) => (
                      <li key={pIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
              Always discuss with your doctor before changing medication routines.
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Educational Disclaimer:</strong> These explanations are for educational and informational purposes only. They are not a substitute for professional medical advice, clinical interpretation, or treatment.
        </div>
      </div>

      {/* Consultation Action CTA */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-base text-white">Have questions about your report?</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Prepare your questions and take this summary to discuss with your healthcare professional.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" /> Print / Save Explanation Summary
        </button>
      </div>
    </div>
  );
}
