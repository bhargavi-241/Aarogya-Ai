import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, ChevronDown, User, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { askHealthQuestion } from '../services/api';

export default function FloatingHealthChat() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I am AarogyaAI. Ask me any question about your health, lab reports, or symptoms.',
      suggestions: ['What does high blood pressure mean?', 'Normal hemoglobin range?']
    }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (qText = null) => {
    const q = (qText || question).trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
      const res = await askHealthQuestion({ question: q, history, language });
      const botMsg = {
        role: 'assistant',
        content: res.data?.answer || 'I could not retrieve an answer right now.',
        suggestions: res.data?.suggestions || []
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Could not connect to health AI. Please check server.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-500 hover:from-teal-600 hover:to-teal-400 text-white px-4 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all ring-2 ring-white/60 transform hover:-translate-y-0.5"
          title="Ask AarogyaAI Health Question"
        >
          <Bot className="h-5 w-5" />
          <span className="text-xs font-extrabold tracking-wide pr-1">Ask Health AI</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
        </button>
      )}

      {/* Expanded Floating Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[520px] bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ring-1 ring-black/5">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold tracking-tight">AarogyaAI Assistant</h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-teal-100">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-teal-100">Ask any medical or wellness question</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/ask"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Open Full Screen Assistant"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs bg-slate-50/50">
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`h-7 w-7 rounded-xl shrink-0 flex items-center justify-center text-[10px] shadow-2xs ${
                      isUser ? 'bg-slate-800 text-white' : 'bg-teal-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className="max-w-[82%] space-y-1.5">
                    <div
                      className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200/80 text-slate-800 shadow-2xs rounded-tl-xs'
                      }`}
                    >
                      {m.content}
                    </div>

                    {!isUser && m.suggestions && m.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {m.suggestions.slice(0, 2).map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSend(sug)}
                            disabled={loading}
                            className="text-[10px] font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/70 px-2 py-0.5 rounded-lg transition-colors text-left"
                          >
                            💬 {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 items-center text-teal-700 bg-teal-50/80 border border-teal-200/80 p-2.5 rounded-2xl w-fit">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                <span className="text-[11px] font-semibold">Consulting AI knowledge base...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions bar */}
          {messages.length <= 2 && (
            <div className="px-3 py-1.5 bg-slate-100/80 border-t border-slate-200/60 flex gap-1.5 overflow-x-auto text-[10px] text-slate-600">
              <button
                onClick={() => handleSend('What do high platelets mean?')}
                className="whitespace-nowrap px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:text-teal-700"
              >
                High Platelets?
              </button>
              <button
                onClick={() => handleSend('Normal blood sugar range?')}
                className="whitespace-nowrap px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:text-teal-700"
              >
                Normal Sugar?
              </button>
              <button
                onClick={() => handleSend('Safe diet for high BP?')}
                className="whitespace-nowrap px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:text-teal-700"
              >
                Diet for BP?
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-2.5 bg-white border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask any health question..."
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white p-2 rounded-xl transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
