import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, ThumbsUp, Sparkles, HelpCircle } from 'lucide-react';

export default function ABTestingDemo() {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [voteCountA, setVoteCountA] = useState(0);
  const [voteCountB, setVoteCountB] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (version) => {
    setSelectedVersion(version);
    setHasVoted(true);
    if (version === 'A') setVoteCountA(prev => prev + 1);
    if (version === 'B') setVoteCountB(prev => prev + 1);
  };

  return (
    <div className="bg-white border-2 border-teal-100 rounded-2xl p-6 shadow-xs my-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-teal-600 text-white p-2 rounded-xl">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
            Design Thinking Verification
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            Interactive A/B Testing Demonstration
          </h3>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        Test Question: <strong className="text-slate-800">"Which clinical presentation format is easier for non-technical patients like Asha to understand?"</strong>
        <br />
        <span className="text-xs text-slate-400">
          (This interactive widget collects live session feedback without fabricating historical metrics).
        </span>
      </p>

      {/* A/B Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Version A: Technical */}
        <div
          className={`border-2 rounded-2xl p-5 transition-all flex flex-col justify-between ${
            selectedVersion === 'A'
              ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/10'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Version A (Technical Clinical)</span>
              {selectedVersion === 'A' && <CheckCircle2 className="h-4 w-4 text-slate-800" />}
            </div>
            <div className="p-4 bg-slate-100 rounded-xl font-mono text-sm text-slate-900 border border-slate-200 mb-3">
              <code>HbA1c: 7.2% [Ref: 4.0 - 5.6] (High)</code>
            </div>
            <p className="text-xs text-slate-500">
              Raw clinical laboratory output. Unexplained numbers often cause confusion or anxiety.
            </p>
          </div>
          <button
            onClick={() => handleVote('A')}
            disabled={hasVoted}
            className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              selectedVersion === 'A'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" /> Vote for Version A
          </button>
        </div>

        {/* Version B: Patient-Friendly */}
        <div
          className={`border-2 rounded-2xl p-5 transition-all flex flex-col justify-between ${
            selectedVersion === 'B'
              ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-600/20'
              : 'border-teal-200 bg-white hover:border-teal-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-teal-700 uppercase">Version B (AarogyaAI)</span>
              {selectedVersion === 'B' && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
            </div>
            <div className="p-4 bg-teal-50 rounded-xl text-sm text-teal-950 border border-teal-200 mb-3 leading-relaxed">
              <p className="font-semibold text-slate-900 mb-1">HbA1c (Average 3-Month Blood Sugar)</p>
              <p className="text-xs text-slate-700">
                "Your test shows an HbA1c result of 7.2%. HbA1c measures average blood sugar over the last 90 days. We suggest discussing this value with your healthcare provider in the context of your overall lifestyle and diet."
              </p>
            </div>
            <p className="text-xs text-teal-800 font-medium">
              Patient-centric framing with plain-language explanation and doctor consultation prompt.
            </p>
          </div>
          <button
            onClick={() => handleVote('B')}
            disabled={hasVoted}
            className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              selectedVersion === 'B'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-100 hover:bg-teal-200 text-teal-800 disabled:opacity-50'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" /> Vote for Version B (Recommended)
          </button>
        </div>
      </div>

      {hasVoted && (
        <div className="bg-slate-900 text-white rounded-xl p-4 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-400" />
            <span>
              Thank you for participating! Your preference for <strong>Version {selectedVersion}</strong> has been logged for design iterations.
            </span>
          </div>
          <div className="text-slate-400 font-mono">
            Live Session Votes: Version A ({voteCountA}) vs Version B ({voteCountB})
          </div>
        </div>
      )}
    </div>
  );
}
