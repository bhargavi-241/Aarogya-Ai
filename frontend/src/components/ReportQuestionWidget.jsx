import React, { useState } from 'react';
import { MessageSquarePlus, Send, Bot, User, Sparkles, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { askHealthQuestion } from '../services/api';

export default function ReportQuestionWidget({ reportData }) {
  const { language } = useLanguage();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [qaList, setQaList] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!reportData) return null;

  // Build report summary context for the AI
  const buildReportContext = () => {
    const parts = [];
    if (reportData.document_label || reportData.document_type) {
      parts.push(`Document: ${reportData.document_label || reportData.document_type}`);
    }
    if (reportData.patient_information?.patient_name) {
      parts.push(`Patient: ${reportData.patient_information.patient_name}, Age: ${reportData.patient_information.age || 'N/A'}`);
    }
    if (reportData.overall_status) {
      parts.push(`Overall Status: ${reportData.overall_status}`);
    }
    if (reportData.parameters && reportData.parameters.length > 0) {
      const paramList = reportData.parameters
        .slice(0, 15)
        .map((p) => `${p.name || p.parameter}: ${p.value} ${p.unit || ''} (Ref: ${p.reference_range || p.normal_range || 'N/A'}, Status: ${p.status || 'Normal'})`)
        .join('; ');
      parts.push(`Evaluated Parameters: ${paramList}`);
    }
    if (reportData.key_findings && reportData.key_findings.length > 0) {
      parts.push(`Key Findings: ${reportData.key_findings.join(', ')}`);
    }
    if (reportData.raw_text) {
      parts.push(`Raw Document Excerpt: ${reportData.raw_text.slice(0, 1200)}`);
    }
    return parts.join('\n');
  };

  const sampleReportQuestions = [
    'Are any of my out-of-range parameters concerning?',
    'What foods should I eat or avoid based on this report?',
    'What specific questions should I ask my doctor about these results?',
    'Could fasting or dehydration have affected these test numbers?'
  ];

  const handleAsk = async (textToAsk = null) => {
    const q = (textToAsk || question).trim();
    if (!q || loading) return;

    const reportContext = buildReportContext();
    const newQa = { question: q, answer: null, loading: true };
    setQaList((prev) => [newQa, ...prev]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await askHealthQuestion({
        question: q,
        reportContext,
        language
      });

      setQaList((prev) =>
        prev.map((item, idx) =>
          idx === 0
            ? {
                ...item,
                answer: res.data?.answer || 'No response generated.',
                suggestions: res.data?.suggestions || [],
                model: res.data?.model,
                loading: false
              }
            : item
        )
      );
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to answer question. Please try again.';
      setQaList((prev) =>
        prev.map((item, idx) =>
          idx === 0
            ? { ...item, answer: `⚠️ Error: ${msg}`, isError: true, loading: false }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-white border border-teal-200/80 rounded-3xl shadow-sm overflow-hidden mt-8 transition-all">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-r from-teal-50/90 via-slate-50 to-teal-50/60 p-5 sm:px-6 flex items-center justify-between cursor-pointer border-b border-teal-100"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-xs">
            <MessageSquarePlus className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Ask Questions About This Report
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-800 border border-teal-200">
                Context-Aware AI
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Type any question or select a suggestion to get instant personalized explanations of your lab values.
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Quick Suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Suggested Questions for this report:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleReportQuestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(sug)}
                  disabled={loading}
                  className="text-xs font-medium text-slate-700 hover:text-teal-800 bg-slate-50 hover:bg-teal-50/90 border border-slate-200/80 hover:border-teal-300 px-3 py-1.5 rounded-xl transition-all text-left shadow-2xs"
                >
                  💡 {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What does my platelet count mean? Is my creatinine level safe?"
              disabled={loading}
              className="flex-1 bg-slate-50/80 border border-slate-300/80 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs sm:text-sm rounded-2xl px-4 py-3 shadow-2xs outline-none transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 text-white font-bold px-4 sm:px-6 py-3 rounded-2xl shadow-xs transition-all flex items-center gap-2 text-xs sm:text-sm shrink-0"
            >
              <span>Ask</span>
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Q&A Stream History */}
          {qaList.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {qaList.map((qa, index) => (
                <div
                  key={index}
                  className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs"
                >
                  {/* User Question */}
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-white shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {qa.question}
                    </span>
                  </div>

                  {/* Assistant Answer */}
                  <div className="flex items-start gap-2.5 pl-1 pt-1">
                    <div className="p-1.5 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {qa.loading ? (
                        <div className="space-y-2 py-1">
                          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                            <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                            <span>Analyzing report data & preparing answer...</span>
                          </div>
                          <div className="h-1.5 w-48 bg-teal-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-600 rounded-full animate-indeterminate" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                            {qa.answer}
                          </div>

                          {!qa.isError && (
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                              <span>Report-specific clinical guidance</span>
                              <button
                                onClick={() => handleCopy(qa.answer, index)}
                                className="hover:text-teal-700 flex items-center gap-1 font-semibold transition-colors"
                              >
                                {copiedIdx === index ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
