import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Activity, Clock, ShieldCheck, ArrowRight,
  TrendingUp, TrendingDown, RefreshCw, AlertCircle
} from 'lucide-react';
import { getHistory, getModelMetrics } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import ModelMetricsCard from '../components/ModelMetricsCard';

export default function ResultsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getHistory();
      setHistory(res.data?.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <DisclaimerBanner />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 rounded-lg px-3 py-1 text-xs font-semibold text-teal-800 mb-2">
            <BarChart3 className="h-3.5 w-3.5 text-teal-600" />
            <span>{t('results_badge', 'Consolidated Analytics & History')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('results_title', 'Prediction History & Model Performance')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('results_desc', 'Review past disease-risk indications and inspect verified model metrics on test data.')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/predict"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Activity className="h-4 w-4" /> {t('run_new_prediction', 'Run New Prediction')}
          </Link>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t('prediction_records', 'Prediction Records')}</h3>
              <p className="text-xs text-slate-500">{t('prediction_records_sub', 'Persistent SQLite storage of past risk indications')}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-teal-700 rounded-lg text-xs font-medium flex items-center gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('refresh', 'Refresh')}
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            {t('loading_history', 'Loading history records...')}
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium text-sm">{t('no_history', 'No historical predictions recorded.')}</p>
            <p className="text-xs mt-1">{t('try_assessment', 'Try running an assessment in the Health Risk tab.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{t('th_timestamp', 'Timestamp')}</th>
                  <th className="py-3 px-4">{t('th_disease_module', 'Disease Module')}</th>
                  <th className="py-3 px-4">{t('th_classifier', 'Classifier Used')}</th>
                  <th className="py-3 px-4">{t('th_indication', 'Indication Result')}</th>
                  <th className="py-3 px-4">{t('th_score', 'Statistical Score')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => {
                  const isHigher = h.result?.toLowerCase().includes('higher');
                  return (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {h.created_at ? new Date(h.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 capitalize">
                        {h.disease_type}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {h.model_name || 'RandomForest'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${
                            isHigher ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isHigher ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {h.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">
                        {h.confidence_percent ? `${h.confidence_percent}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Performance Deep-Dive */}
      <ModelMetricsCard />
    </div>
  );
}

