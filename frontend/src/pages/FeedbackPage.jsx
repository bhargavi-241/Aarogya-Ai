import React, { useState, useEffect } from 'react';
import {
  Star, Heart, MessageSquareHeart, CheckCircle2, Sparkles,
  Loader2, AlertCircle, Tag, Filter, User, Calendar, RefreshCw,
  Trash2, ShieldCheck, Lock, Unlock, ShieldAlert, X
} from 'lucide-react';
import { submitFeedback, getFeedbackList, deleteFeedback } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import AdminAuthModal from '../components/AdminAuthModal';

const CATEGORIES = [
  'All',
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

export default function FeedbackPage() {
  const { t } = useLanguage();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General Feedback');
  const [selectedTags, setSelectedTags] = useState([]);
  const [comments, setComments] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Reviews list & stats
  const [reviewsData, setReviewsData] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');

  // Admin Mode State
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('ai_health_admin_key') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [adminNotice, setAdminNotice] = useState(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

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
      setError('Please provide a comment or suggestion.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        rating,
        category,
        comment: comments.trim(),
        page: 'Feedback Page',
        user_name: userName.trim() || undefined,
        email: email.trim() || undefined,
        tags: selectedTags,
      });

      setSubmitted(true);
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
    setCategory('General Feedback');
    setSelectedTags([]);
    setComments('');
    setUserName('');
    setEmail('');
    setError(null);
  };

  // Admin Controls
  const handleAdminUnlocked = (key) => {
    setAdminKey(key);
    setAdminNotice('Admin Mode enabled. You can now delete or moderate feedback.');
    setTimeout(() => setAdminNotice(null), 5000);
    if (pendingDeleteTarget) {
      setItemToDelete(pendingDeleteTarget);
      setPendingDeleteTarget(null);
    }
  };

  const handleExitAdmin = () => {
    sessionStorage.removeItem('ai_health_admin_key');
    setAdminKey('');
    setAdminNotice('Exited Admin Mode.');
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const handleRequestDelete = (fb) => {
    if (!adminKey) {
      setPendingDeleteTarget(fb);
      setShowAuthModal(true);
      return;
    }
    setItemToDelete(fb);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !adminKey) return;
    setDeleting(true);
    try {
      await deleteFeedback(itemToDelete.id, adminKey);
      setAdminNotice(`Feedback #${itemToDelete.id} successfully deleted.`);
      setTimeout(() => setAdminNotice(null), 4000);
      setItemToDelete(null);
      fetchReviews();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to delete feedback.';
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        sessionStorage.removeItem('ai_health_admin_key');
        setAdminKey('');
        setShowAuthModal(true);
      }
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Filter reviews
  const filteredFeedbacks = (reviewsData?.feedbacks || []).filter((fb) => {
    if (selectedFilterCategory === 'All') return true;
    return fb.category?.toLowerCase() === selectedFilterCategory.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <DisclaimerBanner />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 rounded-full px-3.5 py-1 text-xs font-semibold text-teal-200">
            <MessageSquareHeart className="h-3.5 w-3.5" />
            <span>{t('feedback_page_badge', 'User Feedback & Community Voice')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t('feedback_page_title', 'Help Improve AarogyaAI')}
          </h1>

          <p className="text-sm sm:text-base text-teal-100/80 leading-relaxed">
            {t(
              'feedback_page_desc',
              'Your thoughts guide our clinical OCR decoding models, disease-risk explainability, and multilingual translations. Share your feedback below or browse reviews from others.'
            )}
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      {reviewsData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
              <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Rating</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{reviewsData.average_rating || '5.0'}</span>
                <span className="text-sm text-slate-400">/ 5.0</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
              <MessageSquareHeart className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reviews</p>
              <span className="text-3xl font-black text-slate-900">{reviewsData.total_count || 0}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Heart className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Satisfaction Rate</p>
              <span className="text-3xl font-black text-slate-900">
                {reviewsData.total_count > 0
                  ? `${Math.round(((reviewsData.distribution?.[5] || 0) + (reviewsData.distribution?.[4] || 0)) / reviewsData.total_count * 100)}%`
                  : '100%'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Feedback Form */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                ✍️ {t('feedback_form_title', 'Submit Your Experience')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('feedback_form_desc', 'Whether it is OCR accuracy, symptom explanations, or design feedback — we appreciate every review.')}
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-10 space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {t('feedback_thanks_title', 'Thank You for Your Feedback!')}
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  {t('feedback_thanks_desc', 'Your input directly guides our medical understanding algorithms and design enhancements.')}
                </p>
                <button
                  onClick={handleResetForm}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  + Submit Another Review
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
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
                              isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
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
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
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

                {/* Comments */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('feedback_comments_label', 'Your Comments & Suggestions *')}
                  </label>
                  <textarea
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={t(
                      'feedback_placeholder',
                      'Tell us what worked well or what can be improved (e.g. clarity of explanations, symptom questions, scan quality)...'
                    )}
                    className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
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
                      placeholder="e.g. Ravi Kumar"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {t('feedback_email_label', 'Email (Optional)')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ravi@example.com"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !comments.trim()}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Feedback...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>{t('feedback_submit_btn', 'Submit Feedback')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Community Reviews List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              💬 {t('feedback_reviews_title', 'Recent Community Feedback')}
            </h2>
            <div className="flex items-center gap-2">
              {adminKey ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-xl text-xs font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Admin Mode Active</span>
                  <button
                    onClick={handleExitAdmin}
                    className="ml-1 text-[11px] text-slate-500 hover:text-rose-600 underline font-normal cursor-pointer"
                    title="Exit admin mode"
                  >
                    Exit
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Unlock admin deletion controls"
                >
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Admin Mode</span>
                </button>
              )}
              <button
                onClick={fetchReviews}
                disabled={loadingReviews}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
                title="Refresh reviews"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingReviews ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Admin Notice Banner */}
          {adminNotice && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                <span>{adminNotice}</span>
              </div>
              <button onClick={() => setAdminNotice(null)} className="text-teal-600 hover:text-teal-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Admin Info Callout */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
              <strong>Moderation Security:</strong> Deleting feedback is strictly restricted to authorized administrators only.
              </span>
            </div>
            {!adminKey && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="shrink-0 text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
              >
                Unlock Admin Mode
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                  selectedFilterCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Reviews Stream */}
          {loadingReviews ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-teal-600" />
              <p className="text-xs">Loading community feedback...</p>
            </div>
          ) : filteredFeedbacks.length > 0 ? (
            <div className="space-y-3">
              {filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2.5 transition-all hover:border-teal-200 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                        {(fb.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          {fb.user_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {fb.submitted_at ? new Date(fb.submitted_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200/80 px-2 py-0.5 rounded-md font-medium">
                        {fb.category}
                      </span>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Admin Delete Button */}
                      <button
                        onClick={() => handleRequestDelete(fb)}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                          adminKey
                            ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                        title={adminKey ? 'Permanently Delete this review (Admin)' : 'Admin authentication required to delete'}
                      >
                        <Trash2 className="h-3 w-3" />
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
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
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
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-xs">
              No feedback found for this category yet. Be the first to submit one!
            </div>
          )}
        </div>
      </div>

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingDeleteTarget(null);
        }}
        onSuccess={handleAdminUnlocked}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Feedback?</h3>
                <p className="text-xs text-slate-500">Permanently remove this review from the system</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{itemToDelete.user_name}</span>
                <span className="text-amber-500">{'★'.repeat(itemToDelete.rating)}</span>
              </div>
              <p className="text-slate-600 line-clamp-2 italic">"{itemToDelete.comment}"</p>
            </div>

            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200/80">
              ⚠️ Warning: This action cannot be undone. Only authorized administrators should delete feedback.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
