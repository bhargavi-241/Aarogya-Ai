import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                An unexpected interface error occurred. You can reload the application to restore your session.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="bg-slate-100 rounded-xl p-3 text-left font-mono text-[11px] text-slate-700 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
