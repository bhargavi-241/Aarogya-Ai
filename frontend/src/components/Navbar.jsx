import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Activity, LayoutDashboard, History, Info, Menu, X, Mic, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { to: '/', label: t('nav_home', 'Home'), icon: Heart },
    { to: '/voice-assistant', label: t('nav_voice', 'Voice Assistant'), icon: Mic },
    { to: '/predict', label: t('nav_predict', 'Health Risk'), icon: Activity },
    { to: '/dashboard', label: t('nav_dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/history', label: t('nav_history', 'History'), icon: History },
    { to: '/about', label: t('nav_about', 'About'), icon: Info },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-50 shadow-soft-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-soft-xs ring-1 ring-slate-200/80 p-1 flex items-center justify-center group-hover:ring-teal-400 group-hover:shadow-teal-glow transition-all">
                <img
                  src="/logo-icon.png"
                  alt="Aarogya-Ai"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-slate-900 tracking-tight">
                  {t('nav_brand_title', 'Aarogya')}{' '}
                  <span className="text-teal-600 font-black">{t('nav_brand_highlight', 'AI')}</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-teal-50 text-teal-700 border border-teal-200 tracking-wider">
                  CLINICAL AI
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 block tracking-wider uppercase">
                {t('nav_brand_sub', 'AI-Powered Healthcare Assistant')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/60">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-white text-teal-800 shadow-soft-xs border border-slate-200/80 ring-1 ring-teal-500/10'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{label}</span>
                </Link>
              );
            })}

            {/* Language Selector */}
            <div className="ml-1 pl-2 border-l border-slate-300/80">
              <LanguageSelector variant="header" />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageSelector variant="header" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-1.5 shadow-soft-lg animate-in slide-in-from-top-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive(to)
                  ? 'bg-teal-50 text-teal-800 border border-teal-200/80'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive(to) ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{label}</span>
              </div>
            </Link>
          ))}

          <div className="pt-2 border-t border-slate-100">
            <LanguageSelector variant="mobile" />
          </div>
        </div>
      )}
    </nav>
  );
}
