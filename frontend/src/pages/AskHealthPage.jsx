import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  Heart,
  Bot,
  RefreshCw,
  Copy,
  Check,
  Activity,
  FileText,
  Pill,
  Apple,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { askHealthQuestion } from '../services/api';

const QUICK_PROMPTS = [
  {
    category: 'Lab Tests',
    icon: FileText,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
    questions: [
      'What does an elevated Platelet count mean in a CBC report?',
      'What is the difference between Fasting Blood Sugar and HbA1c?',
      'What do high SGPT and SGOT liver enzyme levels indicate?',
      'What is a healthy Serum Creatinine and eGFR range?'
    ]
  },
  {
    category: 'Medicines & Rx',
    icon: Pill,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
    questions: [
      'Can I take painkillers on an empty stomach?',
      'What does "OD" and "BD" mean on a doctor prescription?',
      'What should I do if I accidentally miss a medication dose?'
    ]
  },
  {
    category: 'Heart & BP',
    icon: Activity,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    questions: [
      'What lifestyle changes help naturally lower blood pressure?',
      'What are normal systolic and diastolic blood pressure readings by age?',
      'How does daily sodium intake affect hypertension?'
    ]
  },
  {
    category: 'Diet & Nutrition',
    icon: Apple,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    questions: [
      'What is the best dietary plan for someone with pre-diabetes?',
      'Which foods help naturally improve hemoglobin levels?',
      'What foods should be avoided with elevated uric acid?'
    ]
  }
];

export default function AskHealthPage() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        language === 'hi'
          ? 'नमस्ते! मैं AarogyaAI स्वास्थ्य सहायक हूँ। आप मुझसे किसी भी स्वास्थ्य विषय, दवा, मेडिकल रिपोर्ट, लैब टेस्ट, लक्षण या आहार संबंधी सवाल पूछ सकते हैं।'
          : language === 'mr'
          ? 'नमस्कार! मी AarogyaAI आरोग्य सहाय्यक आहे. आपण मला कोणत्याही आरोग्याविषयी, औषधांविषयी, लॅब रिपोर्टविषयी किंवा लक्षणांविषयी प्रश्न विचारू शकता.'
          : 'Hello! I am your AarogyaAI Health Assistant. Ask me any question about your medical reports, lab parameters, medications, symptoms, diet, or overall wellness.',
      suggestions: [
        'What does high fasting blood sugar mean?',
        'What are normal blood pressure ranges?',
        'How can I improve low hemoglobin safely?'
      ],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText = null) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || loading) return;

    const userMessage = {
      role: 'user',
      content: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setLoading(true);

    try {
      // Build history of prior turns (last 6 messages)
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await askHealthQuestion({
        question: q,
        history,
        language
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.data?.answer || 'I could not retrieve an answer at this moment. Please try again.',
        suggestions: res.data?.suggestions || [],
        source: res.data?.source,
        model: res.data?.model,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Failed to get answer. Please check backend connection.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          language === 'hi'
            ? 'बातचीत रीसेट हो गई है। आप कोई नया स्वास्थ्य सवाल पूछ सकते हैं।'
            : 'Conversation cleared. How can I help with your health questions today?',
        suggestions: [
          'What do normal blood sugar levels look like?',
          'What does high blood pressure mean?',
          'What are signs of iron deficiency?'
        ],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-white text-slate-800 pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-500 text-white shadow-sm ring-1 ring-teal-600/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Ask AarogyaAI Health Assistant
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ask any question regarding lab reports, medications, clinical terminology, symptoms, or preventive wellness.
              </p>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
            title="Start new conversation"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear Chat
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* Quick Topic Prompts Bar */}
        <div className="mb-6 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Explore Popular Health Questions:
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {QUICK_PROMPTS.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <span className={`p-1 rounded-md ${cat.color}`}>
                      <Icon className="h-3 w-3" />
                    </span>
                    <span>{cat.category}</span>
                  </div>
                  <div className="space-y-1">
                    {cat.questions.slice(0, 2).map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSend(q)}
                        disabled={loading}
                        className="w-full text-left text-[11px] text-slate-600 hover:text-teal-700 bg-slate-50 hover:bg-teal-50/70 border border-slate-200/70 hover:border-teal-200 p-2 rounded-xl transition-all line-clamp-2 leading-snug"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Stream Window */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Message Thread */}
          <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[620px]">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-9 w-9 rounded-2xl shrink-0 flex items-center justify-center shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-tr from-slate-800 to-slate-700 text-white'
                        : 'bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-500 text-white'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-5 w-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-bold text-slate-600">
                        {isUser ? 'You' : 'AarogyaAI Assistant'}
                      </span>
                      {msg.model && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          {msg.model}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {msg.time}
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-slate-900 text-white shadow-xs rounded-tr-xs'
                          : msg.isError
                          ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-xs'
                          : 'bg-slate-50/90 border border-slate-200/80 text-slate-800 shadow-2xs rounded-tl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line prose prose-slate max-w-none prose-sm">
                        {msg.content}
                      </div>

                      {/* Copy action for assistant responses */}
                      {!isUser && !msg.isError && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Verified Clinical AI Knowledge</span>
                          <button
                            onClick={() => handleCopy(msg.content, index)}
                            className="hover:text-teal-700 flex items-center gap-1 font-semibold transition-colors"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Follow-up Question Suggestion Chips */}
                    {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="pt-1.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                          Suggested Next Questions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSend(sug)}
                              disabled={loading}
                              className="text-[11px] font-medium text-teal-800 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200/80 px-2.5 py-1 rounded-xl transition-colors text-left"
                            >
                              💬 {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading / Thinking indicator */}
            {loading && (
              <div className="flex gap-3.5 items-start">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-500 text-white shrink-0 flex items-center justify-center shadow-xs">
                  <Bot className="h-5 w-5 animate-pulse" />
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl rounded-tl-xs shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                    <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                    <span>Analyzing medical question with clinical AI...</span>
                  </div>
                  <div className="h-1.5 w-48 bg-teal-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full animate-indeterminate" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask any health question (e.g., What causes elevated platelets? Safe foods for diabetes?)..."
                disabled={loading}
                className="flex-1 bg-white border border-slate-300/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 text-xs sm:text-sm rounded-2xl px-4 py-3 shadow-2xs outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || loading}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 text-white font-bold p-3 sm:px-5 sm:py-3 rounded-2xl shadow-xs transition-all flex items-center gap-2 text-xs sm:text-sm shrink-0"
              >
                <span>Ask AI</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>Responses are powered by Gemini clinical intelligence and medical knowledge.</span>
              <span>Available in English, हिन्दी, मराठी</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
