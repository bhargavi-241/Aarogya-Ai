import React, { useState, useEffect } from 'react';
import {
  X, Star, Heart, CheckCircle2, MessageSquare, Sparkles,
  Loader2, AlertCircle, Tag, ThumbsUp, MessageSquareHeart,
  Trash2, Lock, ShieldCheck
} from 'lucide-react';
import { submitFeedback, getFeedbackList, deleteFeedback } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import AdminAuthModal from './AdminAuthModal';

const CATEGORIES = [
  'General Feedback',
  'Report Analysis / OCR',
  'Health Risk Prediction',
  'Symptom Checker',
  'Multilingual Support',
  'Bug / Issue Report'
];

const QUICK_TAGS = [
  'Accurate OCR',
  'Easy to Understand',
  'Loved Hindi/Marathi',
  'Fast Analysis',
  'Helpful Symptom Guide',
  'Clean Interface',
  'Need More Tests',
  'Needs Improvement'
];

const RATING_LABELS = {
  1: 'Needs Improvement ⚠️',
  2: 'Fair / Satisfactory 🙂',
  3: 'Good Experience 👍',
  4: 'Very Good & Helpful 🌟',
  5: 'Outstanding Healthcare Tool! 💖'
};

export default function FeedbackModal({ isOpen, onClose, defaultPage = 'General' }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'reviews'
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comments, setComments] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Community reviews state
  const [reviewsData, setReviewsData] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Admin Mode state
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('ai_health_admin_key') || '');
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [adminNotice, setAdminNotice] = useState(null);

  useEffect(() => {
    if (isOpen && activeTab === 'reviews') {
      fetchReviews();
    }
  }, [isOpen, activeTab]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await getFeedbackList();
      setReviewsData(res.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Please provide a brief comment or suggestion.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        rating,
        category,
        comment: comments.trim(),
        page: defaultPage,
        user_name: userName.trim() || undefined,
        email: email.trim() || undefined,
        tags: selectedTags,
      });

      setSubmitted(true);
      // Refresh reviews data
      fetchReviews();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setRating(5);
    setCategory(CATEGORIES[0]);
    setSelectedTags([]);
    setComments('');
    setUserName('');
    setEmail('');
    setError(null);
  };

  const handleAdminSuccess = (key) => {
    setAdminKey(key);
    setAdminNotice('Admin mode unlocked.');
    setTimeout(() => setAdminNotice(null), 4000);
    if (pendingDeleteId) {
      executeDelete(pendingDeleteId, key);
      setPendingDeleteId(null);
    }
  };

  const executeDelete = async (id, key) => {
    setDeletingId(id);
    try {
      await deleteFeedback(id, key);
      fetchReviews();
      setAdminNotice(`Feedback #${id} deleted.`);
      setTimeout(() => setAdminNotice(null), 3000);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        sessionStorage.removeItem('ai_health_admin_key');
        setAdminKey('');
        setShowAdminAuthModal(true);
      }
      alert(err?.response?.data?.detail || 'Failed to delete feedback.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteFeedback = (id) => {
    if (!adminKey) {
      setPendingDeleteId(id);
      setShowAdminAuthModal(true);
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete feedback #${id}?`)) {
      executeDelete(id, adminKey);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-6 relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 border border-teal-400/30 rounded-2xl text-teal-300">
              <MessageSquareHeart className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {t('feedback_modal_title', 'Share Your Feedback')}
                <span className="text-xs bg-teal-500/30 text-teal-200 px-2 py-0.5 rounded-full border border-teal-400/30 font-medium">
                  {t('feedback_tag', 'Community Voice')}
                </span>
              </h2>
              <p className="text-xs text-teal-100/80 mt-0.5">
                {t('feedback_modal_subtitle', 'Help us enhance health report clarity, AI accuracy, and patient experience.')}
              </p>
            </div>
          </div>

          {/* Navigation Tabs inside header */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => setActiveTab('write')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'write'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'bg-teal-900/50 text-teal-200 hover:bg-teal-900/80'
              }`}
            >
              ✍️ {t('feedback_tab_write', 'Give Feedback')}
            </button>
            <button
              onClick={() => {
                setActiveTab('reviews');
                fetchReviews();
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'reviews'
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'bg-teal-900/50 text-teal-200 hover:bg-teal-900/80'
              }`}
            >
              💬 {t('feedback_tab_community', 'Community Reviews')}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'write' ? (
            submitted ? (
              /* Success State */
              <div className="text-center py-10 space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">
                    {t('feedback_thanks_title', 'Thank You for Your Feedback!')}
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    {t('feedback_thanks_desc', 'Your input directly guides our medical understanding algorithms and design enhancements.')}
                  </p>
                </div>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                  >
                    View Community Reviews
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Rating Stars */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t('feedback_rate_experience', 'How would you rate your experience?')}
                  </label>
                  <div className="flex justify-center items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-bold text-teal-700 mt-2">
                    {RATING_LABELS[hoverRating || rating]}
                  </p>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t('feedback_category_label', 'Select Topic / Category')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          category === cat
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Tags */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-teal-600" />
                    {t('feedback_tags_label', 'Quick Tags (Optional)')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                            isSelected
                              ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comments / Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('feedback_comments_label', 'Your Comments & Suggestions *')}
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={t(
                      'feedback_placeholder',
                      'Tell us what worked well or what can be improved (e.g. clarity of explanations, symptom questions, scan quality)...'
                    )}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Name & Email (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {t('feedback_name_label', 'Your Name (Optional)')}
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Dr. Patel or Anonymous"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {t('feedback_email_label', 'Email (Optional, for follow-up)')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Footer Submit */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !comments.trim()}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>{t('feedback_submit_btn', 'Submit Feedback')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Community Reviews Tab */
            <div className="space-y-4">
              {loadingReviews ? (
                <div className="text-center py-12 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-600" />
                  <p className="text-xs">Loading community feedback...</p>
                </div>
              ) : reviewsData ? (
                <div className="space-y-4">
                  {/* Rating Overview */}
                  <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-teal-900">
                        {reviewsData.average_rating || '5.0'}
                      </span>
                      <div>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${
                                s <= Math.round(reviewsData.average_rating || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-teal-700 font-semibold mt-0.5">
                          {reviewsData.total_count || 0} Total Reviews
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {adminKey ? (
                        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>Admin</span>
                          <button
                            onClick={() => {
                              sessionStorage.removeItem('ai_health_admin_key');
                              setAdminKey('');
                            }}
                            className="ml-1 text-slate-400 hover:text-rose-600 underline font-normal"
                          >
                            Exit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAdminAuthModal(true)}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Admin login"
                        >
                          <Lock className="h-3 w-3 text-slate-400" />
                          <span>Admin</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleResetForm();
                          setActiveTab('write');
                        }}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        + Write Review
                      </button>
                    </div>
                  </div>

                  {adminNotice && (
                    <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded-xl flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span>{adminNotice}</span>
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviewsData.feedbacks && reviewsData.feedbacks.length > 0 ? (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {reviewsData.feedbacks.map((fb) => (
                        <div
                          key={fb.id}
                          className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                                {(fb.user_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-xs text-slate-800">
                                {fb.user_name}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                {fb.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${
                                    s <= fb.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                              <button
                                onClick={() => handleDeleteFeedback(fb.id)}
                                disabled={deletingId === fb.id}
                                className={`ml-2 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                  adminKey
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                }`}
                                title={adminKey ? 'Delete Feedback (Admin)' : 'Admin login required to delete'}
                              >
                                {deletingId === fb.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                <span>Delete (Admin)</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {fb.comment}
                          </p>

                          {fb.tags && fb.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {fb.tags.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-md"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No feedback submitted yet. Be the first to share your thoughts!
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => {
          setShowAdminAuthModal(false);
          setPendingDeleteId(null);
        }}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
}
