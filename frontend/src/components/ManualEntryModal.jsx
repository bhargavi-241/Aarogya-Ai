/**
 * ManualEntryModal.jsx
 * Shown when uploaded document quality is too low for reliable OCR.
 */
import React, { useState } from 'react';
import {
  X, Plus, Trash2, FlaskConical, CheckCircle2,
  ClipboardList, ArrowRight, Info
} from 'lucide-react';

const COMMON_TESTS = [
  { name: 'Hemoglobin', unit: 'g/dL' },
  { name: 'WBC (Total Count)', unit: 'cells/cumm' },
  { name: 'Platelet Count', unit: 'lakhs/cumm' },
  { name: 'Fasting Blood Sugar', unit: 'mg/dL' },
  { name: 'HbA1c', unit: '%' },
  { name: 'Serum Creatinine', unit: 'mg/dL' },
  { name: 'Blood Urea', unit: 'mg/dL' },
  { name: 'Sodium (Na+)', unit: 'mEq/L' },
  { name: 'Potassium (K+)', unit: 'mEq/L' },
  { name: 'Total Cholesterol', unit: 'mg/dL' },
  { name: 'Triglycerides', unit: 'mg/dL' },
  { name: 'HDL Cholesterol', unit: 'mg/dL' },
  { name: 'LDL Cholesterol', unit: 'mg/dL' },
  { name: 'SGOT / AST', unit: 'U/L' },
  { name: 'SGPT / ALT', unit: 'U/L' },
  { name: 'TSH', unit: 'mIU/L' },
  { name: 'Vitamin D', unit: 'ng/mL' },
  { name: 'Vitamin B12', unit: 'pg/mL' },
];

const emptyRow = () => ({ test_name: '', value: '', unit: '', reference_range: '' });

export default function ManualEntryModal({ onSubmit, onClose, fileName }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [patientName, setPatientName] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const updateRow = (idx, field, val) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (idx) => rows.length > 1 && setRows(prev => prev.filter((_, i) => i !== idx));

  const applyPreset = (preset) => {
    setRows(prev => {
      const exists = prev.some(r => r.test_name.toLowerCase() === preset.name.toLowerCase());
      if (exists) return prev;
      const lastEmpty = prev.findIndex(r => !r.test_name && !r.value);
      if (lastEmpty !== -1) return prev.map((r, i) => i === lastEmpty ? { ...r, test_name: preset.name, unit: preset.unit } : r);
      return [...prev, { test_name: preset.name, value: '', unit: preset.unit, reference_range: '' }];
    });
  };

  const handleSubmit = () => {
    const validRows = rows.filter(r => r.test_name.trim() && r.value.trim());
    if (!validRows.length) return;
    const parameters = validRows.map(r => ({
      test_name: r.test_name.trim(), value: r.value.trim(),
      unit: r.unit.trim(), reference_range: r.reference_range.trim(),
      status: 'manual_entry', flag: '',
    }));
    const rawText = [
      patientName && `Patient Name: ${patientName}`,
      reportDate && `Report Date: ${reportDate}`,
      doctorName && `Doctor: ${doctorName}`,
      '', 'MANUALLY ENTERED TEST PARAMETERS:',
      ...parameters.map(p => `${p.test_name}: ${p.value} ${p.unit}${p.reference_range ? ' (Ref: ' + p.reference_range + ')' : ''}`)
    ].filter(Boolean).join('\n');
    setSubmitted(true);
    setTimeout(() => onSubmit({ parameters, rawText, patientName, reportDate, doctorName }), 500);
  };

  const validCount = rows.filter(r => r.test_name.trim() && r.value.trim()).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500 text-white p-2.5 rounded-2xl shrink-0">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Enter Report Details Manually</h2>
              <p className="text-sm text-slate-500 mt-0.5">Document too unclear for auto-scan — type your values below.</p>
              {fileName && <p className="text-xs text-amber-700 font-medium mt-1 bg-amber-100 px-2 py-0.5 rounded-md inline-block">📄 {fileName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 leading-relaxed">
              The uploaded image could not be clearly read. Type the test names and values from your report — AI will analyse them just like a scanned document.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-600">Patient Info <span className="text-xs font-normal text-slate-400">(optional)</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[['Patient Name','text',patientName,setPatientName,'e.g. Ravi Kumar'],['Report Date','date',reportDate,setReportDate,''],['Doctor / Lab','text',doctorName,setDoctorName,'e.g. Dr. Sharma']].map(([label,type,val,setter,ph])=>(
                <div key={label}>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">{label}</label>
                  <input type={type} value={val} onChange={e=>setter(e.target.value)} placeholder={ph} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><FlaskConical className="h-4 w-4 text-teal-600"/>Quick Add Common Tests</h3>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TESTS.map(p=>(
                <button key={p.name} onClick={()=>applyPreset(p)} className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer">+ {p.name}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-500"/>Test Parameters
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{validCount} entered</span>
              </h3>
            </div>
            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide px-1 mb-1">
              <div className="col-span-4">Test Name *</div><div className="col-span-2">Value *</div>
              <div className="col-span-2">Unit</div><div className="col-span-3">Ref Range</div><div className="col-span-1"></div>
            </div>
            <div className="space-y-2">
              {rows.map((row,idx)=>(
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4"><input type="text" value={row.test_name} onChange={e=>updateRow(idx,'test_name',e.target.value)} placeholder="e.g. Hemoglobin" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300"/></div>
                  <div className="col-span-2"><input type="text" value={row.value} onChange={e=>updateRow(idx,'value',e.target.value)} placeholder="13.5" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300"/></div>
                  <div className="col-span-2"><input type="text" value={row.unit} onChange={e=>updateRow(idx,'unit',e.target.value)} placeholder="g/dL" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300"/></div>
                  <div className="col-span-3"><input type="text" value={row.reference_range} onChange={e=>updateRow(idx,'reference_range',e.target.value)} placeholder="12.0 - 17.5" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300"/></div>
                  <div className="col-span-1 flex justify-center"><button onClick={()=>removeRow(idx)} disabled={rows.length===1} className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-20 cursor-pointer"><Trash2 className="h-4 w-4"/></button></div>
                </div>
              ))}
            </div>
            <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-900 font-semibold bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2 rounded-xl cursor-pointer">
              <Plus className="h-4 w-4"/>Add Another Test
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={validCount===0||submitted}
            className={`px-6 py-3 font-bold rounded-xl text-sm flex items-center gap-2 transition-all ${submitted?'bg-emerald-600 text-white':validCount===0?'bg-slate-200 text-slate-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'}`}>
            {submitted?<><CheckCircle2 className="h-4 w-4"/><span>Submitted!</span></>:<><span>Analyse {validCount} Test{validCount!==1?'s':''} with AI</span><ArrowRight className="h-4 w-4"/></>}
          </button>
        </div>
      </div>
    </div>
  );
}
