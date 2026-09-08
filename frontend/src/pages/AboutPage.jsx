import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Users, Lightbulb, Target, Cpu, RefreshCw,
  CheckCircle2, Sparkles, AlertTriangle, ShieldCheck,
  Languages, Mic, Smartphone, Microscope, Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import ABTestingDemo from '../components/ABTestingDemo';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <DisclaimerBanner />

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 rounded-lg px-3 py-1 text-xs font-semibold text-teal-800 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t('about_badge', 'AI-Powered Healthcare Assistant')}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t('about_title', 'About AarogyaAI')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl leading-relaxed">
          {t('about_desc', 'A design-thinking AI + Machine Learning initiative created to bridge the health literacy gap between clinical reports and patients.')}
        </p>
      </div>

      {/* Problem & Solution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problem */}
        <div className="bg-rose-50/60 border-2 border-rose-200/80 rounded-3xl p-7 shadow-xs">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-2">
            {t('the_problem_badge', 'The Healthcare Problem')}
          </span>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            {t('the_problem_title', 'Patients Struggle to Understand Medical Documents')}
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed space-y-2">
            {t('the_problem_desc', 'Clinical prescriptions are frequently handwritten with Latin abbreviations (e.g., OD, BD, SOS), and laboratory test reports contain complex biochemical parameters (e.g., eGFR, HbA1c, SGPT). Patients often experience anxiety and misinterpretations when attempting to understand their health status.')}
          </p>
          <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center gap-2 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>{t('problem_takeaway', 'Health literacy gap leads to lower medication adherence.')}</span>
          </div>
        </div>

        {/* Solution */}
        <div className="bg-teal-50/60 border-2 border-teal-200/80 rounded-3xl p-7 shadow-xs">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-2">
            {t('the_solution_badge', 'The AI Companion Solution')}
          </span>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            {t('the_solution_title', 'Understand, Verify, and Predict')}
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {t('the_solution_desc', 'AarogyaAI integrates image preprocessing, optical character recognition (OCR), a human-in-the-loop verification dashboard, plain-language medical dictionaries, and scikit-learn disease-risk assessment models.')}
          </p>
          <div className="mt-4 pt-3 border-t border-teal-200/60 flex items-center gap-2 text-xs font-semibold text-teal-800">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>{t('solution_takeaway', 'Core Philosophy: "AI assists the user; the user remains in control."')}</span>
          </div>
        </div>
      </div>

      {/* Design Thinking Framework (5 Stages) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            {t('design_thinking_badge', 'Methodology')}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            {t('design_thinking_title', 'Design Thinking Framework')}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {t('design_thinking_desc', 'Built through user empathy, problem definition, ideation, prototyping, and rigorous testing.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              stage: '1. Empathize',
              icon: Users,
              title: 'Asha (Persona, 45)',
              desc: 'Empathized with Asha, a 45-year-old with basic digital skills who manages chronic conditions and struggles with technical medical terms.',
            },
            {
              stage: '2. Define',
              icon: Target,
              title: 'Problem Framing',
              desc: 'Framed the core HMW question: "How might we help patients understand their health documents and provide responsible AI risk indications?"',
            },
            {
              stage: '3. Ideate',
              icon: Lightbulb,
              title: 'Concept Selection',
              desc: 'Brainstormed 9 concepts. Selected AarogyaAI for high user value, technical feasibility, and responsible AI safety bounds.',
            },
            {
              stage: '4. Prototype',
              icon: Cpu,
              title: 'Full-Stack Build',
              desc: 'Built working React + FastAPI prototype with OpenCV, Tesseract OCR, SQLite, and 4 disease risk ML models.',
            },
            {
              stage: '5. Test',
              icon: RefreshCw,
              title: 'Iterative Testing',
              desc: 'Evaluated with wireframes, user observation interviews, interactive A/B testing, and model cross-validation.',
            },
          ].map((dt, idx) => {
            const Icon = dt.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="bg-teal-100 text-teal-800 p-2 rounded-xl w-fit mb-3">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                    {dt.stage}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">{dt.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{dt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Design Thinking Testing Methodology & Test Loop */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-900/50 border border-teal-700/50 px-3 py-1 rounded-full">
            Testing Protocol
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-3">
            Testing Methodology & Continuous Feedback Loop
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            In accordance with academic research standards, testing is structured across 5 distinct dimensions:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { name: 'Wireframe Evaluation', desc: 'Assessing navigation clarity with non-technical users.' },
            { name: 'User Observation', desc: 'Recording pain points during document upload & verification.' },
            { name: 'A/B Testing', desc: 'Comparing technical vs patient-friendly wording acceptance.' },
            { name: 'Functional Testing', desc: 'Verifying OCR extraction accuracy & error edge cases.' },
            { name: 'ML Model Evaluation', desc: 'Hold-out test metrics calculation (Accuracy, F1, ROC-AUC).' },
          ].map((tm, tIdx) => (
            <div key={tIdx} className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-xs space-y-1.5">
              <span className="font-bold text-teal-300 block">{tm.name}</span>
              <p className="text-slate-400 leading-relaxed">{tm.desc}</p>
            </div>
          ))}
        </div>

        {/* Test Loop diagram */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
            Design Thinking Test Loop
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-teal-200">
            <span className="bg-slate-700 px-3 py-1.5 rounded-lg">Prototype</span>
            <span>→</span>
            <span className="bg-slate-700 px-3 py-1.5 rounded-lg">User Test</span>
            <span>→</span>
            <span className="bg-slate-700 px-3 py-1.5 rounded-lg">Gather Feedback</span>
            <span>→</span>
            <span className="bg-slate-700 px-3 py-1.5 rounded-lg">Improve System</span>
            <span>→</span>
            <span className="bg-teal-600 text-white px-3 py-1.5 rounded-lg">Retest</span>
          </div>
        </div>
      </div>

      {/* Interactive A/B Testing Component */}
      <ABTestingDemo />

      {/* Future Scope */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            Roadmap
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            Future Scope & Research Directions
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Planned enhancements for translating this academic prototype into clinical research trial readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              title: 'Multilingual Support (Hindi + Marathi + English)',
              desc: 'Localized simple explanations and regional language translation for broader accessibility.',
              icon: Languages,
            },
            {
              title: 'Advanced Handwriting Recognition',
              desc: 'Deep learning vision transformers (TrOCR / PaddleOCR) specifically fine-tuned on doctor cursive styles.',
              icon: Microscope,
            },
            {
              title: 'Voice Health Assistant (Active Now)',
              desc: 'Speech-to-text input and voice audio readouts for senior citizens, visually impaired, or patients who prefer spoken advice with strict medical safety.',
              icon: Mic,
              isLive: true,
              link: '/voice-assistant',
            },
            {
              title: 'Mobile Application (PWA / React Native)',
              desc: 'Native mobile camera capture with edge preprocessing and document edge detection.',
              icon: Smartphone,
            },
            {
              title: 'Explainable AI (SHAP / LIME)',
              desc: 'Interactive feature contribution waterfalls showing exactly why parameters influenced predictions.',
              icon: Layers,
            },
            {
              title: 'Clinical Validation Studies',
              desc: 'Formal institutional review board (IRB) trials comparing patient recall before and after companion use.',
              icon: ShieldCheck,
            },
          ].map((fs, idx) => {
            const Icon = fs.icon;
            return (
              <div
                key={idx}
                className={`border rounded-2xl p-5 transition-all ${
                  fs.isLive
                    ? 'bg-teal-50/50 border-teal-300 ring-1 ring-teal-200'
                    : 'bg-slate-50 border-slate-200/90 hover:border-teal-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-teal-100 text-teal-800 p-2 rounded-xl w-fit">
                    <Icon className="h-5 w-5" />
                  </div>
                  {fs.isLive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      LIVE NOW
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">{fs.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{fs.desc}</p>
                {fs.link && (
                  <Link
                    to={fs.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
                  >
                    <span>Launch Voice Assistant</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
