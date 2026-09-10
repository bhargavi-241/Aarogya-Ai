import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, PhoneCall } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3 text-white font-black text-xl tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center">
                <img src="/logo-icon.png" alt="Aarogya-Ai" className="w-full h-full object-contain" />
              </div>
              <span>{t('nav_brand_title', 'Aarogya')} <span className="text-teal-400">{t('nav_brand_highlight', 'AI')}</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              {t('footer_desc', 'An AI-powered healthcare assistant designed to help patients understand complex medical prescriptions, lab reports, and health parameters in simple, compassionate language.')}
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-teal-300 font-medium">
              <Sparkles className="h-4 w-4 text-teal-400 shrink-0" />
              <span>{t('footer_philosophy', 'Core Philosophy: "AI assists the user; the user remains in control."')}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
              <span className="bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg">🛡️ 100% Private & Local</span>
              <span className="bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg">⚡ Multi-Engine OCR</span>
              <span className="bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg">🩺 Scikit-Learn Classifiers</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3.5 tracking-wide uppercase text-xs text-slate-400">{t('footer_capabilities', 'Capabilities')}</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link to="/understand" className="hover:text-teal-300 transition-colors flex items-center gap-1.5">1. {t('nav_understand', 'Understand Report')}</Link>
              </li>
              <li>
                <Link to="/voice-assistant" className="hover:text-teal-300 transition-colors flex items-center gap-1.5 font-bold text-teal-300">2. 🎙️ Voice Health Assistant</Link>
              </li>
              <li>
                <Link to="/predict" className="hover:text-teal-300 transition-colors flex items-center gap-1.5">3. {t('nav_predict', 'Health Risk Prediction')}</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-teal-300 transition-colors flex items-center gap-1.5">4. {t('nav_dashboard', 'Central Dashboard')}</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-teal-300 transition-colors flex items-center gap-1.5">5. {t('nav_about', 'Design Thinking & About')}</Link>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-teal-300 transition-colors text-teal-400 font-semibold flex items-center gap-1.5">★ {t('nav_feedback', 'Feedback & Reviews')}</Link>
              </li>
            </ul>
          </div>

          {/* Emergency & Safety */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3.5 tracking-wide uppercase text-xs text-slate-400">{t('footer_safety_notice', 'Safety Notice')}</h4>
            <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
              {t('footer_safety_desc', 'If you are experiencing severe chest pain, shortness of breath, or sudden weakness, seek emergency medical care immediately.')}
            </p>
            <div className="flex items-center gap-2.5 text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl shadow-2xs">
              <PhoneCall className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{t('footer_emergency', 'Emergency Helpline: 112 / 911')}</span>
            </div>
          </div>
        </div>


        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 text-center">
          <p>© {new Date().getFullYear()} {t('footer_copyright', 'AarogyaAI. AI-Powered Healthcare Assistant.')}</p>
          <p className="text-[11px] text-slate-500">Universal Medical Document Understanding & Risk Indication</p>
        </div>
      </div>
    </footer>
  );
}

