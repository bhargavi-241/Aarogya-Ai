import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ variant = 'header' }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'mobile') {
    return (
      <div className="pt-2 border-t border-slate-100 mt-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-teal-600" />
          <span>{t('language_select', 'Language')}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 px-1">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="text-sm leading-none mb-1">{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-teal-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Change language / भाषा बदलें / भाषा बदला"
      >
        <Globe className="h-3.5 w-3.5 text-teal-600" />
        <span className="font-semibold">{currentLang.nativeLabel}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-1.5 w-44 rounded-xl shadow-lg bg-white ring-1 ring-black/5 border border-slate-100 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
          role="menu"
        >
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {t('language_select', 'Language')}
          </div>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-teal-700'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang.flag}</span>
                  <div className="text-left">
                    <div className="leading-none">{lang.nativeLabel}</div>
                    {lang.label !== lang.nativeLabel && (
                      <span className="text-[10px] text-slate-400 font-normal">({lang.label})</span>
                    )}
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-teal-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
