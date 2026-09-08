import React from 'react';
import { BookOpen, X, CheckCircle, Info, ExternalLink, HelpCircle } from 'lucide-react';

export default function MedicalTermModal({ isOpen, onClose, explanation }) {
  if (!isOpen || !explanation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="bg-teal-50 text-teal-700 p-3 rounded-2xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              Medical Terminology Guide
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {explanation.term}
            </h3>
          </div>
        </div>

        {/* What This Means */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            What Does This Mean?
          </span>
          <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 text-sm text-slate-800 font-medium leading-relaxed">
            {explanation.simple_explanation}
          </div>
        </div>

        {/* Why It Matters */}
        {explanation.why_it_matters && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Why It Matters For Your Health:
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {explanation.why_it_matters}
            </p>
          </div>
        )}

        {/* Reference Context */}
        {explanation.reference_info && (
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
            <strong className="block mb-0.5">Reference Context:</strong>
            {explanation.reference_info}
          </div>
        )}

        {/* Important Points */}
        {explanation.important_points && explanation.important_points.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Key Patient Takeaways:
            </span>
            <ul className="space-y-1.5">
              {explanation.important_points.map((pt, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs"
          >
            Got it, thanks!
          </button>
          <span className="text-[11px] text-slate-400 italic">
            Educational explanation only.
          </span>
        </div>
      </div>
    </div>
  );
}
