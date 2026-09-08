import React from 'react';
import { Upload, ShieldAlert, Eye, Cpu, Search, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';

export default function WorkflowStepper({ currentStep = 1 }) {
  const steps = [
    { num: 1, label: 'Upload File', icon: Upload },
    { num: 2, label: 'Medical Validation', icon: ShieldAlert },
    { num: 3, label: 'Image Preprocess', icon: Eye },
    { num: 4, label: 'OCR Recognition', icon: Cpu },
    { num: 5, label: 'Entity Extraction', icon: Search },
    { num: 6, label: 'Confidence Check', icon: CheckCircle2 },
    { num: 7, label: 'Human Verification', icon: ShieldCheck },
    { num: 8, label: 'Simple Explanation', icon: BookOpen },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-teal-50 text-teal-800 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border border-teal-200/80 tracking-wider">
              Diagnostic Pipeline
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">• Multi-Signal Processing Engine</span>
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
            Medical Document Understanding Workflow
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200/70 whitespace-nowrap">
            Stage {currentStep} / {steps.length}
          </span>
        </div>
      </div>

      {/* Responsive Horizontal Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = step.num < currentStep;
          const isCurrent = step.num === currentStep;

          return (
            <div
              key={step.num}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
                isCurrent
                  ? 'border-teal-500 bg-gradient-to-b from-teal-50/90 to-teal-50/40 ring-2 ring-teal-500/20 shadow-xs scale-[1.02]'
                  : isDone
                  ? 'border-emerald-200/90 bg-emerald-50/30 text-emerald-900'
                  : 'border-slate-100 bg-slate-50/60 text-slate-400 opacity-75'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl mb-2 transition-all ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-400/40'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold tracking-tight text-slate-800 leading-tight">
                {step.label}
              </span>
              <span
                className={`text-[9px] uppercase font-extrabold mt-1.5 px-1.5 py-0.5 rounded-md ${
                  isCurrent
                    ? 'bg-teal-100 text-teal-800'
                    : isDone
                    ? 'bg-emerald-100/80 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isCurrent ? 'Active' : isDone ? 'Done ✓' : `Step ${step.num}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
