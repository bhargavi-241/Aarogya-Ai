import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, GitCompare, ShieldCheck, BookOpen, Activity, Sparkles,
  BarChart3, Clock, CheckCircle2, AlertCircle, ArrowRight, Cpu, Mic
} from 'lucide-react';
import { checkHealth, getHistory } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';
import ReportComparisonModal from '../components/ReportComparisonModal';

export default function Dashboard() {
  const [healthData, setHealthData] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      checkHealth().catch(() => ({ data: null })),
      getHistory().catch(() => ({ data: { history: [] } })),
    ]).then(([healthRes, histRes]) => {
      setHealthData(healthRes.data);
      setHistoryItems(histRes.data?.history || []);
      setLoading(false);
    });
  }, []);

  const actionCards = [
    {
      title: 'Upload Medical Report',
      desc: 'Upload a prescription or lab report (JPG, PNG, PDF) for automated OCR extraction.',
      icon: Upload,
      color: 'teal',
      to: '/understand',
      tag: 'Step 1'
    },
    {
      title: 'Compare 2 Medical Reports',
      desc: 'Compare two past & present reports side-by-side to track changes, parameter trends, and health progression over time.',
      icon: GitCompare,
      color: 'blue',
      isModal: true,
      onClick: () => setCompareModalOpen(true),
      tag: 'Compare & Track'
    },
    {
      title: 'Voice Health Assistant',
      desc: 'Speak health symptoms in your own words with real-time speech recognition & audio readouts.',
      icon: Mic,
      color: 'emerald',
      to: '/voice-assistant',
      tag: 'Voice & Speech'
    },
    {
      title: 'Explain Report',
      desc: 'Convert complex medical terms into compassionate, patient-friendly guidance in your language.',
      icon: BookOpen,
      color: 'indigo',
      to: '/understand',
      tag: 'Step 4'
    },
    {
      title: 'Enter Health Parameters',
      desc: 'Directly input glucose, blood pressure, creatinine, or cholesterol values.',
      icon: Activity,
      color: 'purple',
      to: '/predict',
      tag: 'Step 5'
    },
    {
      title: 'Predict Disease Risk',
      desc: 'Run scikit-learn ML models for Diabetes, Heart Disease, and Kidney Disease.',
      icon: Cpu,
      color: 'rose',
      to: '/predict',
      tag: 'Step 6'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <DisclaimerBanner />

      {/* Hero Welcome */}
      <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 border border-teal-900/60 text-white rounded-3xl p-8 sm:p-12 shadow-soft-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 px-3.5 py-1 rounded-full text-xs font-bold text-teal-200 shadow-soft-xs">
            <Sparkles className="h-3.5 w-3.5" /> Central Clinical Dashboard
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            AarogyaAI Control Hub
          </h1>
          <p className="text-sm text-teal-100/90 leading-relaxed font-normal">
            Welcome! Select any module below to upload clinical documents, speak symptoms in your own words, compare reports across dates, or compute machine learning disease risk indications.
          </p>
        </div>

        {/* Live System Status Pill */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-xs space-y-2.5 min-w-[240px] shadow-soft-md relative z-10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            System Live Readiness
          </span>
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-slate-300 font-medium">Backend API:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Diabetes ML Model:</span>
            <span className={healthData?.models_loaded?.diabetes ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {healthData?.models_loaded?.diabetes ? 'Loaded ✓' : 'Standby'}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Heart ML Model:</span>
            <span className={healthData?.models_loaded?.heart ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {healthData?.models_loaded?.heart ? 'Loaded ✓' : 'Standby'}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Kidney ML Model:</span>
            <span className={healthData?.models_loaded?.kidney ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {healthData?.models_loaded?.kidney ? 'Loaded ✓' : 'Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Core Capability Actions</h2>
          <span className="text-xs font-semibold text-slate-400">Select any module to begin</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {actionCards.map((card, idx) => {
            const Icon = card.icon;
            
            if (card.isModal) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={card.onClick}
                  className="clinical-card rounded-3xl p-6 flex flex-col justify-between group text-left w-full cursor-pointer shadow-soft-xs hover:shadow-soft-md border border-slate-200/80"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all shadow-soft-xs">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] uppercase font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                        {card.tag}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-base mb-1.5 group-hover:text-teal-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 w-full">
                    <span>Open Comparison Tool</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                to={card.to}
                className="clinical-card rounded-3xl p-6 flex flex-col justify-between group shadow-soft-xs hover:shadow-soft-md border border-slate-200/80"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all shadow-soft-xs">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1.5 group-hover:text-teal-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
                  <span>Open Module</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent History Preview */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Prediction Activity</h3>
              <p className="text-xs text-slate-500">Historical records stored locally in SQLite</p>
            </div>
          </div>
          <Link
            to="/history"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            View Full History <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {historyItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No previous predictions recorded yet.</p>
            <p className="text-xs mt-1">Run an ML risk assessment in the Health Risk tab to see results here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyItems.slice(0, 5).map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 capitalize">{item.disease_type} Module</span>
                  <span className="text-slate-400">({item.model_name || 'RandomForest'})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full ${
                      item.result?.toLowerCase().includes('higher')
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.result}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      <ReportComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
      />
    </div>
  );
}
