import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Heart,
  FileText,
  Stethoscope,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Send,
  HelpCircle,
  ShieldAlert,
  Info,
  Droplets,
  Wind,
  Flame,
  Zap,
  Loader2,
  Bot,
  Brain,
  Layers,
  HelpCircle as QuestionIcon,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { analyzeSymptoms } from '../services/api';

const PRESET_SYMPTOMS = [
  {
    id: 'diabetes',
    label: '💧 High Thirst, Frequent Urination & Fatigue',
    labelHi: '💧 अत्यधिक प्यास, बार-बार पेशाब और कमजोरी',
    labelMr: '💧 जास्त तहान, वारंवार लघवी आणि थकवा',
    text: 'Feeling unusually thirsty all the time, frequent urination (especially waking up at night), unexplained weight loss, constant fatigue, and occasional blurred vision.',
    textHi: 'असामान्य रूप से बहुत प्यास लगना, बार-बार पेशाब आना (विशेषकर रात में), वजन कम होना, लगातार थकान और कमजोरी महसूस होना।',
    textMr: 'सतत खूप तहान लागणे, वारंवार लघवी होणे (विशेषतः रात्री), वजन कमी होणे, तीव्र थकवा आणि अशक्तपणा जाणवणे.',
  },
  {
    id: 'heart',
    label: '🫀 Chest Tightness, Palpitations & Breathlessness',
    labelHi: '🫀 सीने में भारीपन, धड़कन तेज होना और सांस फूलना',
    labelMr: '🫀 छातीत जडपणा, हृदयाचे ठोके आणि धाप लागणे',
    text: 'Chest discomfort or pressure during physical exertion, shortness of breath when climbing stairs, occasional rapid heart fluttering, and mild dizziness.',
    textHi: 'शारीरिक परिश्रम या सीढ़ियां चढ़ते समय सीने में भारीपन या दबाव, सांस फूलना, दिल की धड़कन तेज होना और हल्का चक्कर आना।',
    textMr: 'चालताना किंवा पायऱ्या चढताना छातीत जडपणा किंवा दाब जाणवणे, धाप लागणे, हृदयाचे ठोके वेगाने पडणे आणि चक्कर येणे.',
  },
  {
    id: 'kidney',
    label: '🫘 Swollen Feet, Puffy Eyes & Foamy Urine',
    labelHi: '🫘 पैरों में सूजन, आंखों के नीचे भारीपन और झागदार पेशाब',
    labelMr: '🫘 पायांवर सूज, चेहऱ्यावर जडपणा आणि लघवीत फेस',
    text: 'Puffiness around the eyes in the morning, swelling around the ankles and feet in the evening, foamy urine, decreased appetite, and general weakness.',
    textHi: 'सुबह चेहरे और आंखों के नीचे सूजन, शाम को पैरों और टखनों में सूजन, पेशाब में झाग आना, भूख में कमी और लगातार कमजोरी।',
    textMr: 'सकाळी डोळ्यांखाली सूज, संध्याकाळी पायांवर आणि घोट्यांवर सूज येणे, लघवीमध्ये फेस येणे, भूक मंदावणे आणि थकवा जाणवणे.',
  },
  {
    id: 'anemia',
    label: '⚡ Severe Fatigue, Pale Skin & Cold Hands',
    labelHi: '⚡ अत्यधिक थकान, पीलापन और हाथ-पैर ठंडे रहना',
    labelMr: '⚡ तीव्र थकवा, फिकट त्वचा आणि हातपाय थंड पडणे',
    text: 'Chronic exhaustion even after adequate sleep, pale or yellowish skin, cold hands and feet, dizziness upon standing, and brittle fingernails.',
    textHi: 'पर्याप्त नींद के बाद भी लगातार अत्यधिक थकान, त्वचा में पीलापन, हाथ-पैर ठंडे रहना, अचानक खड़े होने पर चक्कर आना और कमजोरी।',
    textMr: 'पुरेशी झोप घेऊनही सतत तीव्र थकवा, फिकट त्वचा, हातपाय थंड पडणे, अचानक उठल्यावर चक्कर येणे आणि अशक्तपणा.',
  },
  {
    id: 'respiratory',
    label: '🫁 Persistent Cough, Wheezing & Chest Congestion',
    labelHi: '🫁 लगातार खांसी, सीने में जकड़न और सांस लेने में घरघराहट',
    labelMr: '🫁 सतत खोकला, छातीत कफ आणि धाप लागणे',
    text: 'Persistent cough lasting more than 2 weeks, chest congestion, wheezing sound while breathing, low-grade fever, and tightness in the chest.',
    textHi: 'दो हफ्ते से अधिक समय से लगातार खांसी, सीने में बलगम/जकड़न, सांस लेते समय सीटी जैसी आवाज आना और हल्का बुखार।',
    textMr: 'दोन आठवड्यांपेक्षा जास्त काळ खोकला, छातीत कफ, श्वास घेताना घरघर आवाज येणे आणि हलका ताप जाणवणे.',
  }
];

export default function SymptomCheckerSection() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [inputSymptom, setInputSymptom] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectPreset = (preset) => {
    setActivePreset(preset.id);
    let chosenText = preset.text;
    if (language === 'hi' || language === 'hindi') chosenText = preset.textHi;
    else if (language === 'mr' || language === 'marathi') chosenText = preset.textMr;

    setInputSymptom(chosenText);
    setError(null);
    runAnalysis(chosenText);
  };

  const runAnalysis = async (textToAnalyze) => {
    const text = textToAnalyze || inputSymptom;
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await analyzeSymptoms({
        symptoms: text,
        language: language || 'en'
      });
      setAnalysisResult({
        ...res.data,
        inputText: text
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNotes = () => {
    if (!analysisResult) return;
    const notes = `Clinical AI Symptom Assessment Summary:
Reported Symptoms: "${analysisResult.inputText}"
Primary System: ${analysisResult.system || 'General'}
Recommended Specialist: ${analysisResult.specialist || 'General Physician'}
Reason Behind It: ${analysisResult.reason_behind_it || 'Refer to clinical evaluation.'}
Recommended Lab Tests: ${(analysisResult.recommended_tests || []).join(', ')}

(Generated via AarogyaAI Diagnostic Reasoning Assistant)`;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="symptom-checker" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-12 shadow-xl border-2 border-teal-800/40 relative overflow-hidden space-y-8">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/40 rounded-full px-3.5 py-1 text-xs font-bold text-teal-300">
            <Bot className="h-4 w-4" />
            <span>AI Clinical Reasoning & Symptom Predictor</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Describe Symptoms & Health Issues You Face
          </h2>

          <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed font-normal">
            Type your symptoms or health complaints in simple words (English, हिन्दी, or मराठी). Our AI Clinical Reasoning Model analyzes what might be happening, explains the biological reason behind your symptoms, highlights red flags, and guides you on recommended specialists and lab tests.
          </p>
        </div>

        {/* Quick Symptom Selector Pills */}
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
            Quick Symptom Presets (Click to autofill & analyze):
          </span>
          <div className="flex flex-wrap gap-2.5">
            {PRESET_SYMPTOMS.map((preset) => {
              const isSelected = activePreset === preset.id;
              let label = preset.label;
              if (language === 'hi' || language === 'hindi') label = preset.labelHi;
              else if (language === 'mr' || language === 'marathi') label = preset.labelMr;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-md'
                      : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-teal-500/60'
                  }`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Text Area Box */}
        <div className="bg-slate-800/70 border border-teal-700/50 rounded-2xl p-4 sm:p-5 space-y-3 relative z-10 shadow-xs">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <label className="text-xs font-extrabold text-teal-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-400" />
              <span>Type Your Symptoms, Pain, or Discomfort:</span>
            </label>
            <span className="text-[11px] text-teal-300/80 font-medium">
              Write freely in English, हिन्दी, or मराठी
            </span>
          </div>

          <textarea
            rows={4}
            value={inputSymptom}
            onChange={(e) => {
              setInputSymptom(e.target.value);
              setActivePreset(null);
            }}
            placeholder="e.g., I have been feeling unusually thirsty for the past 2 weeks with frequent urination at night, sudden weight loss, and extreme fatigue..."
            className="w-full text-xs sm:text-sm bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-medium"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-teal-300/70 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
              <span>AI clinical assessment provides educational guidance, not a definitive medical diagnosis.</span>
            </p>

            <button
              type="button"
              onClick={() => runAnalysis(inputSymptom)}
              disabled={loading || !inputSymptom.trim()}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI Model Reasoning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Predict What & Why with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-700/60 text-rose-200 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ===================== AI CLINICAL REASONING RESULTS ===================== */}
        {analysisResult && (
          <div className="bg-slate-900/95 border-2 border-teal-500/60 rounded-3xl p-6 sm:p-9 space-y-6 shadow-2xl relative z-10 animate-in fade-in-50">
            {/* Top AI Model Badge & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-800/60 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 px-3 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>
                      {analysisResult.is_ai_generated ? 'Gemini Clinical AI Model' : 'Clinical Diagnostic Engine'}
                    </span>
                  </span>
                  <span className="text-xs text-teal-300 font-bold">
                    System: {analysisResult.system || 'General'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  AI Clinical Diagnostic & Reasoning Analysis
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCopyNotes}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-200 border border-teal-700/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                title="Copy doctor consultation summary"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied Report!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Doctor Summary</span>
                  </>
                )}
              </button>
            </div>

            {/* SECTION 1: What Might Be Happening (Predicted Conditions) */}
            {analysisResult.predicted_conditions && analysisResult.predicted_conditions.length > 0 && (
              <div className="bg-slate-800/80 border border-teal-700/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-black uppercase tracking-wider">
                  <Brain className="h-4 w-4 text-teal-400" />
                  <span>1. 🔍 What Might Be Happening (Predicted Conditions)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {analysisResult.predicted_conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-white text-sm">
                          {cond.condition}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-400/30 whitespace-nowrap">
                          {cond.likelihood}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {cond.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: The Reason Behind It (Pathophysiology / Biological Mechanism) */}
            {analysisResult.reason_behind_it && (
              <div className="bg-gradient-to-r from-teal-950/80 to-slate-900/90 border border-teal-600/50 rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-black uppercase tracking-wider">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>2. 🧬 The Biological Reason Behind It (Why This Happens)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  {analysisResult.reason_behind_it}
                </p>
              </div>
            )}

            {/* SECTION 3 & 4: Specialist & Red Flags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Specialist */}
              <div className="bg-slate-800/80 border border-teal-700/50 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-black uppercase tracking-wider">
                  <Stethoscope className="h-4 w-4 text-teal-400" />
                  <span>3. 👨‍⚕️ Recommended Medical Specialist</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white">
                  {analysisResult.specialist}
                </p>
                <p className="text-xs text-teal-200/80 pt-1 border-t border-slate-700 leading-relaxed">
                  Consulting this specialist ensures targeted diagnostic tests and personalized therapy.
                </p>
              </div>

              {/* Red Flags */}
              {analysisResult.red_flags && analysisResult.red_flags.length > 0 && (
                <div className="bg-rose-950/50 border border-rose-700/60 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-black uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <span>4. 🚨 Red Flags (Seek Immediate Care If)</span>
                  </div>
                  <ul className="space-y-1 text-xs text-rose-200/90 leading-relaxed pt-1">
                    {analysisResult.red_flags.map((flag, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* SECTION 5: Recommended Lab Tests & Reports */}
            {analysisResult.recommended_tests && analysisResult.recommended_tests.length > 0 && (
              <div className="bg-slate-800/80 border border-teal-700/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-black uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-teal-400" />
                  <span>5. 🧪 Recommended Clinical Lab Tests & Reports</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysisResult.recommended_tests.map((testName, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-xs bg-teal-500/20 border border-teal-400/40 text-teal-200 font-bold px-3 py-1.5 rounded-xl shadow-2xs"
                    >
                      ✓ {testName}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-teal-300/70 pt-1">
                  You can upload any of these existing lab reports in our <strong>Upload Medical Report</strong> tab for automated parameter extraction and plain-English translation.
                </p>
              </div>
            )}

            {/* SECTION 6: Questions to Ask Your Doctor */}
            {analysisResult.doctor_questions && analysisResult.doctor_questions.length > 0 && (
              <div className="bg-slate-800/80 border border-teal-700/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-black uppercase tracking-wider">
                  <QuestionIcon className="h-4 w-4 text-teal-400" />
                  <span>6. ❓ Questions to Ask Your Doctor</span>
                </div>
                <div className="space-y-2 pt-1">
                  {analysisResult.doctor_questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="bg-slate-900/80 border border-slate-700/80 p-3 rounded-xl text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <span className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                        {qIdx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Pathways */}
            <div className="bg-gradient-to-r from-teal-900/80 via-slate-900 to-teal-950 border border-teal-600/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-sm">
                  Ready to take action on these insights?
                </h4>
                <p className="text-xs text-teal-200/80">
                  Upload an existing lab report or run machine-learning disease risk scoring.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                <Link
                  to="/understand"
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md group cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>Upload Medical Report</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/predict"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity className="h-4 w-4 text-teal-300" />
                  <span>Check Disease Risk</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
