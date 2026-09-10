import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Activity, ShieldCheck, CheckCircle2, ArrowRight,
  Upload, BookOpen, AlertTriangle, Layers, Users, Stethoscope, Lock, Sparkles, Mic,
  Volume2, ShieldAlert, HeartPulse, Check, Cpu
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import SymptomCheckerSection from '../components/SymptomCheckerSection';

export default function HomePage() {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Top Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DisclaimerBanner />
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 border border-teal-900/60 shadow-soft-xl p-8 sm:p-14 lg:p-16 text-white">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -right-24 -top-24 w-[36rem] h-[36rem] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 bg-teal-500/15 border border-teal-400/30 rounded-full px-4 py-1.5 text-xs font-bold text-teal-200 shadow-soft-xs backdrop-blur-md">
                <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center shadow-xs">
                  <img src="/logo-icon.png" alt="Aarogya-Ai" className="w-full h-full object-contain" />
                </div>
                <span>{t('hero_badge', 'Aarogya-Ai • AI-Powered Healthcare Assistant')}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                {language === 'hi' ? (
                  <>
                    अपनी सेहत की जानकारी को <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">सरल भाषा में समझें</span>
                  </>
                ) : language === 'mr' ? (
                  <>
                    तुमची आरोग्य माहिती <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">सोप्या भाषेत समजून घ्या</span>
                  </>
                ) : (
                  <>
                    Understand Medical Reports In <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">Human Language</span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-teal-100/90 leading-relaxed font-normal max-w-2xl">
                {t('hero_desc', 'AarogyaAI empowers patients to understand complex prescriptions, decode medical lab reports in simple language, explore potential disease risks, and evaluate health symptoms with guided clinical insights.')}
              </p>

              {/* Hero Action CTAs */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {/* Voice Health Assistant (Spoken problem / Universal Accessibility) */}
                <Link
                  to="/voice-assistant"
                  className="px-6 py-3.5 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-extrabold rounded-2xl shadow-teal-glow transition-all flex items-center gap-2.5 text-sm cursor-pointer active:scale-95 border border-teal-400/30 group"
                >
                  <div className="p-1 rounded-lg bg-white/20">
                    <Mic className="h-4 w-4 shrink-0 text-white animate-pulse" />
                  </div>
                  <span>
                    {language === 'hi'
                      ? 'बोलकर स्वास्थ्य समस्या बताएं'
                      : language === 'mr'
                      ? 'बोलून आरोग्य समस्या सांगा'
                      : 'Voice Health Assistant'}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Upload Medical Report */}
                <Link
                  to="/understand"
                  className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold rounded-2xl shadow-teal-glow transition-all flex items-center gap-2.5 text-sm cursor-pointer active:scale-95 group"
                >
                  <Upload className="h-4 w-4 shrink-0 group-hover:-translate-y-0.5 transition-transform" />
                  <span>{t('hero_upload_btn', 'Upload Medical Report')}</span>
                </Link>

                {/* Check Health Risk */}
                <Link
                  to="/predict"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl transition-all flex items-center gap-2 text-sm cursor-pointer active:scale-95 backdrop-blur-md"
                >
                  <Activity className="h-4 w-4 text-teal-300 shrink-0" />
                  <span>{t('hero_predict_btn', 'Check Health Risk')}</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-teal-800/40 flex flex-wrap items-center gap-6 text-xs text-teal-200/90 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{t('free_open_source', 'Free & Open Access')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>{t('human_in_control', 'Clinical Safety Guardrails')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  <span>{t('privacy_first', '100% Privacy Focused')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Clinical Preview Badge */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-6 shadow-2xl relative space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs">
                      <img src="/logo-icon.png" alt="Aarogya-Ai" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Aarogya-Ai Clinical Engine</h4>
                      <p className="text-[10px] text-teal-300 font-semibold">Your Health • Our Intelligence</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ONLINE
                  </span>
                </div>

                {/* Voice Module Preview Item */}
                <Link
                  to="/voice-assistant"
                  className="block bg-slate-950/60 hover:bg-slate-950/90 border border-teal-500/30 rounded-2xl p-3.5 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-teal-500/20 text-teal-300">
                        <Mic className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-bold text-white">Spoken Voice Assistant</span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Try Audio &rarr;
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    "I have had a mild fever and cough for two days, and my throat hurts..."
                  </p>
                </Link>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">OCR Models</span>
                    <span className="text-sm font-black text-white">OpenCV + Tesseract</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Languages</span>
                    <span className="text-sm font-black text-white">EN • हिन्दी • मराठी</span>
                  </div>
                </div>

                {/* Doctor Closing Note Guarantee */}
                <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/60 flex items-start gap-2 text-[11px] text-teal-200">
                  <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Safe non-medicinal guidance. Never prescribes medications or diagnoses diseases.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Performance & Trust Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="clinical-card rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block tracking-tight">20+</span>
            <span className="text-xs font-bold text-slate-500">Medical Panels Supported</span>
          </div>
          <div className="clinical-card rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-teal-600 block tracking-tight">OpenCV + OCR</span>
            <span className="text-xs font-bold text-slate-500">Preprocessing Pipeline</span>
          </div>
          <div className="clinical-card rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block tracking-tight">3 ML Classifiers</span>
            <span className="text-xs font-bold text-slate-500">Diabetes, Heart, Kidney</span>
          </div>
          <div className="clinical-card rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block tracking-tight">&lt; 1s</span>
            <span className="text-xs font-bold text-slate-500">Inference Response Time</span>
          </div>
        </div>
      </section>

      {/* Voice Assistant Feature Spotlight Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-teal-800/80 shadow-soft-lg flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-3 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Mic className="h-3.5 w-3.5 text-teal-400" />
              <span>Accessibility Spotlight: Voice Health Assistant</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {language === 'hi'
                ? 'सिर्फ बोलकर पाएं आसान स्वास्थ्य मार्गदर्शन — पढ़ना-लिखना जरूरी नहीं'
                : language === 'mr'
                ? 'फक्त बोलून मिळवा सोपे आरोग्य मार्गदर्शन — वाचणे आवश्यक नाही'
                : 'Simple Spoken Health Guidance for Everyone — No Reading Required'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {language === 'hi'
                ? 'वरिष्ठ नागरिकों और हर उस मरीज के लिए विशेष, जो पढ़ने की जगह सुनना पसंद करते हैं। अपनी भाषा में बोलकर समस्या बताएं और 5 बिंदुओं में आसान बोलचाल वाली सलाह और ऑडियो सुनें।'
                : language === 'mr'
                ? 'ज्येष्ठ नागरिक आणि वाचण्याऐवजी ऐकणे पसंत करणाऱ्या प्रत्येकासाठी. आपल्या भाषेत बोलून समस्या सांगा आणि ५ सोप्या मुद्द्यांमध्ये योग्य सल्ला व ऑडिओ ऐका.'
                : 'Specially designed for senior citizens and anyone who prefers listening over reading. Simply speak your symptoms in everyday words and listen to simple spoken advice.'}
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10">
            <Link
              to="/voice-assistant"
              className="w-full sm:w-auto text-center px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold rounded-2xl shadow-teal-glow transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
            >
              <Mic className="h-4 w-4" />
              <span>Launch Voice Assistant</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Symptom Checker Section */}
      <SymptomCheckerSection />

      {/* Core Capabilities: UNDERSTAND, VOICE ASSIST, PREDICT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full">
            {t('core_arch_badge', 'Core Architecture')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
            Integrated Clinical Modules
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2 leading-relaxed">
            Engineered with a human-centric approach to address the barriers patients face with complex medical terminology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Understand */}
          <div className="clinical-card rounded-3xl p-8 flex flex-col justify-between group">
            <div>
              <div className="bg-teal-50 border border-teal-200/80 w-14 h-14 rounded-2xl flex items-center justify-center text-teal-700 mb-6 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-soft-xs">
                <FileText className="h-7 w-7" />
              </div>
              <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider block mb-1">
                Module 1
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">1. UNDERSTAND REPORT</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Extract medicines, lab tests, and clinical parameters from prescriptions and lab reports using OpenCV preprocessing and OCR.
              </p>
              <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Automatic lab report & prescription classification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Out-of-range parameter highlighting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Plain-language clinical summaries</span>
                </div>
              </div>
            </div>
            <Link
              to="/understand"
              className="text-teal-700 hover:text-teal-900 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all pt-4 border-t border-slate-100"
            >
              <span>{t('pillar1_action', 'Start Document OCR')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 2: Voice Assistant */}
          <div className="clinical-card rounded-3xl p-8 flex flex-col justify-between group">
            <div>
              <div className="bg-emerald-50 border border-emerald-200/80 w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-700 mb-6 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-soft-xs">
                <Mic className="h-7 w-7" />
              </div>
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider block mb-1">
                Module 2
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">2. VOICE ASSISTANT</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Speak health problems in your own words. Designed for everyone without needing to read or write, with live speech recognition and audio readouts.
              </p>
              <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Identifies mentioned symptoms clearly</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Safe non-medicinal home precautions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Read aloud via Text-to-Speech audio</span>
                </div>
              </div>
            </div>
            <Link
              to="/voice-assistant"
              className="text-emerald-700 hover:text-emerald-900 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all pt-4 border-t border-slate-100"
            >
              <span>Launch Voice Assistant</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 3: Predict */}
          <div className="clinical-card rounded-3xl p-8 flex flex-col justify-between group">
            <div>
              <div className="bg-purple-50 border border-purple-200/80 w-14 h-14 rounded-2xl flex items-center justify-center text-purple-700 mb-6 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-soft-xs">
                <Activity className="h-7 w-7" />
              </div>
              <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider block mb-1">
                Module 3
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">3. PREDICT RISK</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Explore machine-learning risk indications for Diabetes, Heart Disease, and Kidney Disease using transparent scikit-learn statistical classifiers.
              </p>
              <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>Random Forest, Logistic Regression, KNN</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>Model metrics: Accuracy, ROC-AUC, Precision</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>Transparent probability distributions</span>
                </div>
              </div>
            </div>
            <Link
              to="/predict"
              className="text-purple-700 hover:text-purple-900 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all pt-4 border-t border-slate-100"
            >
              <span>{t('pillar3_action', 'Assess Disease Risk')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/70 rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-soft-xs">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">How It Works</h2>
            <p className="text-slate-500 text-sm mt-2">
              A 4-step workflow designed for patients with basic digital skills.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Upload or Speak',
                desc: 'Upload a report/prescription image, or tap the microphone to speak your symptoms.',
              },
              {
                step: '02',
                title: 'AI Processing',
                desc: 'OpenCV extracts parameters, while our conversational engine analyzes symptoms.',
              },
              {
                step: '03',
                title: 'Plain-Language Advice',
                desc: 'View compassionate breakdowns and safe non-medicinal home precautions.',
              },
              {
                step: '04',
                title: 'Consult With Doctor',
                desc: 'Always share findings with your healthcare professional for proper medical decisions.',
              },
            ].map((st, sIdx) => (
              <div key={sIdx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft-xs relative card-hover">
                <span className="text-3xl font-black text-teal-100 block mb-2">{st.step}</span>
                <h4 className="font-black text-slate-900 text-base mb-2">{st.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Documents Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="clinical-card rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                Supported Clinical Formats
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 mb-4 tracking-tight">
                Supported Medical Documents & Tests
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Our dictionary and OCR pipeline recognize common printed prescriptions, pathology reports, and biochemical blood test panels.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 font-semibold">
                {[
                  'Printed Prescriptions',
                  'Complete Blood Count (CBC)',
                  'Fasting Blood Glucose / HbA1c',
                  'Lipid Profile (Cholesterol, LDL)',
                  'Renal Profile (Creatinine, Urea)',
                  'Thyroid Panel (TSH, T3, T4)',
                  'Liver Function Tests (ALT, AST)',
                  'Electrolyte Panels (Sodium, Potassium)',
                ].map((doc, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-soft-md border border-slate-800">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Stethoscope className="h-5 w-5" />
                <span>Patient Safety & Privacy Standard</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                We adhere to strict academic safety protocols:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>Files are processed locally and stored temporarily in your secure instance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>The application strictly provides statistical risk indications, never medical diagnoses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-3.5 w-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>Designed around patient empathy, clear audio readouts, and informed decisions.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
