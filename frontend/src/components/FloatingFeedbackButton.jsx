import React, { useState } from 'react';
import { MessageSquareHeart } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useLanguage } from '../context/LanguageContext';

export default function FloatingFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm cursor-pointer border border-white/20 group"
        title="Share your feedback or suggestions"
        aria-label="Give Feedback"
      >
        <MessageSquareHeart className="h-4 w-4 transition-transform group-hover:scale-110" />
        <span className="hidden sm:inline">{t('feedback_btn_label', 'Feedback')}</span>
      </button>

      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultPage="Global Floating Button"
      />
    </>
  );
}
