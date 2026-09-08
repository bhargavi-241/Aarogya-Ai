import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Loader2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { verifyAdminPasscode } from '../services/api';

export default function AdminAuthModal({ isOpen, onClose, onSuccess }) {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the admin passcode.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyAdminPasscode(passcode.trim());
      // Save in session storage
      sessionStorage.setItem('ai_health_admin_key', passcode.trim());
      onSuccess(passcode.trim());
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail || 'Invalid admin passcode. Access denied.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-400/30 rounded-2xl text-rose-300">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Admin Authentication</h3>
              <p className="text-xs text-slate-300">Moderator verification required</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Deleting community feedback is restricted to authorized administrators.
            Please enter your administrator passcode below to unlock deletion privileges.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrator Passcode *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Unlock Admin Controls</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
