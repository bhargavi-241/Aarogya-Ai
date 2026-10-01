import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Heart, Activity, Moon, Brain, Droplets,
  HelpCircle, Check, ThumbsUp, ThumbsDown, X,
  ChevronDown, ChevronUp, AlertTriangle, Stethoscope,
  Copy, MessageCircle, Sliders, RefreshCw, ShieldCheck,
  CheckCircle2, Info
} from 'lucide-react';
import { getWellnessSuggestions, submitWellnessFeedback } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const CATEGORY_META = {
  'Yoga & Relaxation': {
    icon: '🧘',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cardBorder: 'border-emerald-100 hover:border-emerald-300',
    accentText: 'text-emerald-700',
  },
  'Physical Activity': {
    icon: '🚶',
    color: 'teal',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    cardBorder: 'border-teal-100 hover:border-teal-300',
    accentText: 'text-teal-700',
  },
  'Healthy Lifestyle': {
    icon: '🥗',
    color: 'green',
    badgeBg: 'bg-green-50 text-green-800 border-green-200',
    cardBorder: 'border-green-100 hover:border-green-300',
    accentText: 'text-green-700',
  },
  'Sleep & Recovery': {
    icon: '😴',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    cardBorder: 'border-indigo-100 hover:border-indigo-300',
    accentText: 'text-indigo-700',
  },
  'Stress Management': {
    icon: '🧠',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    cardBorder: 'border-amber-100 hover:border-amber-300',
    accentText: 'text-amber-700',
  },
  'General Daily Habits': {
    icon: '💧',
    color: 'sky',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    cardBorder: 'border-sky-100 hover:border-sky-300',
    accentText: 'text-sky-700',
  },
};

export default function PersonalizedWellnessSuggestions({
  reportData,
  fileId,
  initialSuggestions,
  initialWellnessData,
  bpReading: externalBp,
  previousBpReading: externalPrevBp,
  symptoms: externalSymptoms,
  lifestyle: externalLifestyle,
  mlRisk: externalMlRisk,
  comparisonDelta: externalDelta,
  onAddDoctorQuestion,
  onAskChatQuestion,
  className = '',
}) {
  const { language = 'en', tText } = useLanguage();

  // Primary suggestions state
  const [wellnessData, setWellnessData] = useState(() => {
    if (initialWellnessData) return initialWellnessData;
    if (initialSuggestions && initialSuggestions.length > 0) {
      return { wellness_suggestions: initialSuggestions };
    }
    if (reportData?.wellness_data) return reportData.wellness_data;
    if (reportData?.wellness_suggestions) {
      return { wellness_suggestions: reportData.wellness_suggestions };
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedWhy, setExpandedWhy] = useState({});
  const [feedbackState, setFeedbackState] = useState({}); // { [id]: 'useful' | 'not_useful' }
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [copiedQuestionId, setCopiedQuestionId] = useState(null);

  // Optional Lifestyle & BP Drawer State
  const [showFactorsDrawer, setShowFactorsDrawer] = useState(false);
  const [factors, setFactors] = useState({
    bpReading: externalBp || '',
    previousBpReading: externalPrevBp || '',
    stress: externalLifestyle?.stress || '',
    physicalActivity: externalLifestyle?.physical_activity || '',
    sleepHours: externalLifestyle?.sleep_hours || '',
    waterIntake: externalLifestyle?.water_intake || '',
  });

  // Extract suggestions array
  const suggestions = useMemo(() => {
    const list = wellnessData?.wellness_suggestions || [];
    return list.filter((s) => !dismissedIds.has(s.id));
  }, [wellnessData, dismissedIds]);

  // Available categories in the current suggestions
  const availableCategories = useMemo(() => {
    const cats = new Set();
    suggestions.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [suggestions]);

  // Filtered list based on active category tab
  const filteredSuggestions = useMemo(() => {
    if (activeCategory === 'All') return suggestions;
    return suggestions.filter((s) => s.category === activeCategory);
  }, [suggestions, activeCategory]);

  // Sync when initial props change
  useEffect(() => {
    if (initialWellnessData) {
      setWellnessData(initialWellnessData);
    } else if (reportData?.wellness_data) {
      setWellnessData(reportData.wellness_data);
    } else if (reportData?.wellness_suggestions) {
      setWellnessData({ wellness_suggestions: reportData.wellness_suggestions });
    }
  }, [initialWellnessData, reportData]);

  // Fetch or re-generate suggestions if needed
  const handleRefreshSuggestions = async (customFactors = null) => {
    setLoading(true);
    try {
      const activeFactors = customFactors || factors;
      const res = await getWellnessSuggestions({
        fileId: fileId || reportData?.file_id,
        reportData: reportData,
        bpReading: activeFactors.bpReading || externalBp,
        previousBpReading: activeFactors.previousBpReading || externalPrevBp,
        symptoms: externalSymptoms,
        lifestyle: {
          stress: activeFactors.stress,
          physical_activity: activeFactors.physicalActivity,
          sleep_hours: activeFactors.sleepHours,
          water_intake: activeFactors.waterIntake,
        },
        mlRisk: externalMlRisk,
        comparisonDelta: externalDelta,
        language: language || 'en',
      });

      if (res.data?.success) {
        setWellnessData(res.data);
      }
    } catch (err) {
      console.warn('Could not refresh wellness suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  // User control: Useful / Not Useful feedback
  const handleFeedback = async (suggestion, isUseful) => {
    const status = isUseful ? 'useful' : 'not_useful';
    setFeedbackState((prev) => ({ ...prev, [suggestion.id]: status }));

    try {
      await submitWellnessFeedback({
        suggestionId: suggestion.id,
        category: suggestion.category,
        isUseful: isUseful,
        reportId: fileId || reportData?.file_id,
      });
    } catch (err) {
      console.warn('Feedback submit error:', err);
    }
  };

  // User control: Dismiss card
  const handleDismiss = (id) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Toggle "Why am I seeing this?"
  const toggleWhy = (id) => {
    setExpandedWhy((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy doctor question to clipboard
  const handleCopyDoctorQuestion = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedQuestionId(id);
    setTimeout(() => setCopiedQuestionId(null), 2500);

    if (onAddDoctorQuestion) {
      onAddDoctorQuestion(text);
    }
  };

  // If there are no suggestions and no data, don't show empty widget unless factors drawer is open
  if (!suggestions.length && !loading && !showFactorsDrawer) {
    // If we have reportData, offer button to generate wellness suggestions
    if (reportData || externalBp || externalMlRisk || externalDelta) {
      return (
        <div className={`bg-gradient-to-r from-emerald-50/60 to-teal-50/60 border border-teal-200/80 rounded-3xl p-6 sm:p-8 text-center space-y-3 ${className}`}>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Personalized Wellness Suggestions
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              Explore safe, non-prescriptive lifestyle, relaxation, and physical activity practices tailored to your reported health information.
            </p>
          </div>
          <button
            onClick={() => handleRefreshSuggestions()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate Wellness Suggestions
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 ${className}`}>
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" role="img" aria-label="sprout">🌿</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Personalized Wellness Suggestions
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Based on the information available in your report, vitals, and reported health data
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Lifestyle factors tweak button */}
          <button
            onClick={() => setShowFactorsDrawer(!showFactorsDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              showFactorsDrawer
                ? 'bg-teal-50 border-teal-300 text-teal-800'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Adjust BP readings or reported lifestyle factors"
          >
            <Sliders className="h-3.5 w-3.5 text-teal-600" />
            <span>Lifestyle & BP Factors</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={() => handleRefreshSuggestions()}
            disabled={loading}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
            title="Re-calculate suggestions"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ===================== OPTIONAL FACTORS DRAWER ===================== */}
      {showFactorsDrawer && (
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Sliders className="h-4 w-4 text-teal-600" />
              <span>Personalize Input Factors (BP, Activity, Stress, Sleep)</span>
            </div>
            <span className="text-[11px] text-slate-500">Values used to tailor category guidance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Current Blood Pressure (mmHg)
              </label>
              <input
                type="text"
                placeholder="e.g. 138/88"
                value={factors.bpReading}
                onChange={(e) => setFactors({ ...factors, bpReading: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Previous BP (for trend)
              </label>
              <input
                type="text"
                placeholder="e.g. 142/90"
                value={factors.previousBpReading}
                onChange={(e) => setFactors({ ...factors, previousBpReading: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Reported Stress Level
              </label>
              <select
                value={factors.stress}
                onChange={(e) => setFactors({ ...factors, stress: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Auto-detected / Not specified</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Physical Activity Level
              </label>
              <select
                value={factors.physicalActivity}
                onChange={(e) => setFactors({ ...factors, physicalActivity: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Auto-detected / Not specified</option>
                <option value="low">Sedentary / Low</option>
                <option value="moderate">Moderate (Walking / Light)</option>
                <option value="active">Active / Regular Fitness</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Average Sleep Duration
              </label>
              <select
                value={factors.sleepHours}
                onChange={(e) => setFactors({ ...factors, sleepHours: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Auto-detected / Not specified</option>
                <option value="<6 hours">Less than 6 hours</option>
                <option value="6-7 hours">6 - 7 hours</option>
                <option value="7-8 hours">7 - 8 hours</option>
                <option value="8+ hours">8+ hours</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => handleRefreshSuggestions(factors)}
                disabled={loading}
                className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Apply & Update Suggestions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONFIDENCE / UNCERTAINTY ALERT ===================== */}
      {wellnessData?.has_uncertain_data && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">Verification Recommended:</p>
            <p className="leading-relaxed">
              {wellnessData.uncertainty_warning ||
                'Some information from this document could not be read confidently. Please verify the extracted information before using personalized wellness suggestions.'}
            </p>
          </div>
        </div>
      )}

      {/* ===================== RENAL / KIDNEY SAFETY ALERT ===================== */}
      {wellnessData?.kidney_safety_guard && (
        <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 text-xs text-sky-950 flex items-start gap-3">
          <Droplets className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-sky-900">Kidney & Fluid Precaution:</p>
            <p className="leading-relaxed text-sky-900/90">
              Your clinical findings indicate renal function parameters. To protect your kidneys, avoid aggressive workouts, high-protein supplements, or excessive hydration changes without specific advice from your physician.
            </p>
          </div>
        </div>
      )}

      {/* ===================== CATEGORY FILTER PILLS ===================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            activeCategory === 'All'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          All Categories ({suggestions.length})
        </button>

        {availableCategories.map((cat) => {
          const meta = CATEGORY_META[cat] || { icon: '🌿' };
          const count = suggestions.filter((s) => s.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{cat}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ===================== SUGGESTION CARDS GRID ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuggestions.map((item) => {
          const meta = CATEGORY_META[item.category] || {
            icon: '🌿',
            badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
            cardBorder: 'border-slate-200',
            accentText: 'text-teal-700',
          };
          const isWhyOpen = !!expandedWhy[item.id];
          const feedback = feedbackState[item.id];

          return (
            <div
              key={item.id}
              className={`bg-slate-50/60 rounded-2xl border ${meta.cardBorder} p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xs`}
            >
              {/* Card Top: Category Badge, Confidence, and Dismiss Button */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${meta.badgeBg}`}
                  >
                    <span>{meta.icon}</span>
                    <span>{item.category}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.confidence && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.confidence === 'high'
                            ? 'bg-emerald-100/70 text-emerald-800'
                            : 'bg-amber-100/70 text-amber-800'
                        }`}
                        title="Confidence score based on directly extracted findings"
                      >
                        {item.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    )}

                    {/* Dismiss Button */}
                    <button
                      onClick={() => handleDismiss(item.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                      title="Dismiss this suggestion"
                      aria-label="Dismiss suggestion"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                {item.title && (
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                    {item.title}
                  </h4>
                )}

                {/* Suggestion Text */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {tText(item.suggestion)}
                </p>
              </div>

              {/* Card Middle: Expandable "Why am I seeing this?" */}
              <div className="space-y-2 border-t border-slate-200/60 pt-3">
                <button
                  type="button"
                  onClick={() => toggleWhy(item.id)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-teal-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
                    Why am I seeing this?
                  </span>
                  {isWhyOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {isWhyOpen && (
                  <div className="bg-white/90 border border-slate-200 rounded-xl p-3 text-xs space-y-2 animate-in fade-in-50">
                    <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">
                      Suggested because your report contains:
                    </p>
                    {item.reasons_list && item.reasons_list.length > 0 ? (
                      <ul className="space-y-1 text-slate-700">
                        {item.reasons_list.map((r, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-1.5">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>{tText(r)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-700 leading-relaxed">{tText(item.reason)}</p>
                    )}
                  </div>
                )}

                {/* Doctor Discussion Integration */}
                {item.doctor_discussion && (
                  <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-900">
                        <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                        <span>Question to Ask Your Doctor</span>
                      </div>
                      <button
                        onClick={() => handleCopyDoctorQuestion(item.id, item.doctor_discussion)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-teal-200 transition-colors"
                        title="Copy question"
                      >
                        {copiedQuestionId === item.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-teal-950 italic leading-snug">
                      "{tText(item.doctor_discussion)}"
                    </p>
                  </div>
                )}
              </div>

              {/* Card Bottom: User Control Actions (Useful / Not Useful, Ask Chat) */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(item, true)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      feedback === 'useful'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
                    }`}
                    title="Mark suggestion as useful"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span>Useful</span>
                  </button>
                  <button
                    onClick={() => handleFeedback(item, false)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      feedback === 'not_useful'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200'
                    }`}
                    title="Mark suggestion as not useful"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    <span>Not Useful</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const query = `Can you explain more about this wellness suggestion: "${item.suggestion}"?`;
                    if (onAskChatQuestion) {
                      onAskChatQuestion(query);
                    } else {
                      window.dispatchEvent(
                        new CustomEvent('open-health-chat', { detail: { question: query } })
                      );
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50/50 hover:bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 transition-colors"
                  title="Ask a follow-up question about this suggestion in Health Chat"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Ask in Chat</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================== MANDATORY DISCLAIMER ===================== */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>General Wellness Information Only:</strong> These suggestions are not a diagnosis, treatment plan, or substitute for professional medical advice. Always discuss personalized exercise, dietary, or lifestyle adjustments with a qualified healthcare professional before implementation.
        </p>
      </div>
    </div>
  );
}
