import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Activity,
  CheckCircle2,
  Info,
  Stethoscope,
  ArrowRight,
  Copy,
  Check,
  Languages,
  ShieldCheck,
  Clock,
  Droplets,
  BedDouble,
  HandHeart,
  Thermometer
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getPatientVoiceGuide } from '../services/api';

const SPOKEN_PRESETS = [
  {
    id: 'fever_cough',
    title: '🌡️ Fever, Cough & Throat Pain',
    titleHi: '🌡️ बुखार, खांसी और गले में दर्द',
    titleMr: '🌡️ ताप, खोकला आणि घसा दुखणे',
    text: 'I have had a mild fever and cough for two days, and my throat hurts when I swallow.',
    textHi: 'मुझे दो दिन से बुखार आ रहा है और गले में बहुत दर्द हो रहा है, कुछ निगला नहीं जा रहा।',
    textMr: 'मला दोन दिवसांपासून हलका ताप आणि खोकला आहे, तसेच घास गिळताना घसा खूप दुखत आहे.',
  },
  {
    id: 'stomach_nausea',
    title: '🤢 Stomach Pain & Vomiting',
    titleHi: '🤢 पेट में दर्द और उल्टी की समस्या',
    titleMr: '🤢 पोटात दुखणे आणि उलटी होणे',
    text: 'My stomach has been hurting since morning and I feel like throwing up and cannot eat.',
    textHi: 'सुबह से मेरे पेट में बहुत दर्द हो रहा है और उल्टी जैसा लग रहा है, कुछ भी खाया नहीं जा रहा।',
    textMr: 'सकाळपासून माझ्या पोटात तीव्र वेदना होत आहेत आणि उलट्या आल्यासारखे वाटत आहे.',
  },
  {
    id: 'weakness_headache',
    title: '⚡ Severe Headache & Weakness',
    titleHi: '⚡ तेज सिरदर्द और अत्यधिक कमजोरी',
    titleMr: '⚡ तीव्र डोकेदुखी आणि अशक्तपणा',
    text: 'I have a heavy headache and my whole body feels very weak and tired since yesterday.',
    textHi: 'कल से मेरा सिर बहुत भारी हो रहा है, पूरे बदन में दर्द है और बहुत ज्यादा कमजोरी लग रही है।',
    textMr: 'कालपासून माझे डोके खूप दुखत आहे, संपूर्ण अंग दुखत आहे आणि प्रचंड थकवा जाणवत आहे.',
  },
  {
    id: 'chest_breath',
    title: '🫀 Chest Heaviness & Breathlessness',
    titleHi: '🫀 सीने में भारीपन और सांस फूलना',
    titleMr: '🫀 छातीत जडपणा आणि धाप लागणे',
    text: 'My chest feels heavy and tight and I feel out of breath when I walk or climb stairs.',
    textHi: 'चलने या सीढ़ियां चढ़ने पर मेरे सीने में भारीपन लगता है और सांस बहुत तेजी से फूलने लगती है।',
    textMr: 'चालताना किंवा पायऱ्या चढताना छातीत जड वाटत आहे आणि श्वास घेण्यास खूप त्रास होत आहे.',
  }
];

export default function VoiceAssistantPage() {
  const { language } = useLanguage();

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  const [loading, setLoading] = useState(false);
  const [guideResult, setGuideResult] = useState(null);
  const [error, setError] = useState(null);

  // Text to speech playback states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.9); // Default slightly slower for clarity
  const [copied, setCopied] = useState(false);

  const synthRef = useRef(window.speechSynthesis || null);
  const utteranceRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set recognition language based on active UI language
    if (language === 'hi' || language === 'hindi') {
      recognition.lang = 'hi-IN';
    } else if (language === 'mr' || language === 'marathi') {
      recognition.lang = 'mr-IN';
    } else {
      recognition.lang = 'en-IN';
    }

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setInputText(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setRecognitionInstance(recognition);

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [language]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionInstance) return;

    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionInstance.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const handleSelectPreset = (preset) => {
    let chosen = preset.text;
    if (language === 'hi' || language === 'hindi') chosen = preset.textHi;
    else if (language === 'mr' || language === 'marathi') chosen = preset.textMr;
    setInputText(chosen);
    setError(null);
  };

  const handleSubmit = async (textToProcess = null) => {
    const query = (textToProcess || inputText || '').trim();
    if (!query) {
      setError(
        language === 'hi'
          ? 'कृपया अपनी समस्या बोलें या लिखें।'
          : language === 'mr'
          ? 'कृपया तुमची समस्या बोला किंवा लिहा.'
          : 'Please speak or type your health problem.'
      );
      return;
    }

    // Stop recording if running
    if (isListening && recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
    }

    // Stop any existing TTS playback
    stopAudio();

    setLoading(true);
    setError(null);

    try {
      const resp = await getPatientVoiceGuide({
        patientSpokenText: query,
        language: language || 'en',
      });
      setGuideResult(resp.data);
      // Automatically prepare speech utterance
    } catch (err) {
      console.error('Error fetching patient voice guide:', err);
      setError(
        language === 'hi'
          ? 'स्वास्थ्य सलाह प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।'
          : language === 'mr'
          ? 'आरोग्य मार्गदर्शन मिळवण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.'
          : 'Could not generate voice guidance. Please check server connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Text-to-Speech Controls
  const playAudio = () => {
    if (!synthRef.current || !guideResult?.spoken_response) return;

    if (isPausedAudio) {
      synthRef.current.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
      return;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(guideResult.spoken_response);
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.0;

    // Set voice language
    if (language === 'hi' || language === 'hindi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'mr' || language === 'marathi') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Select suitable voice if available
    const voices = synthRef.current.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(utterance.lang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const pauseAudio = () => {
    if (synthRef.current && isPlayingAudio) {
      synthRef.current.pause();
      setIsPausedAudio(true);
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (isPlayingAudio) {
      stopAudio();
      setTimeout(playAudio, 100);
    }
  };

  const handleCopy = () => {
    if (!guideResult?.spoken_response) return;
    navigator.clipboard.writeText(guideResult.spoken_response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    stopAudio();
    setInputText('');
    setGuideResult(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Banner / Title */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-3 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
          <span>
            {language === 'hi'
              ? 'मरीजों के लिए बोलकर स्वास्थ्य सहायक'
              : language === 'mr'
              ? 'रुग्णांसाठी बोलणारा आरोग्य सहाय्यक'
              : 'Voice Health Assistant for Spoken Health Problems'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {language === 'hi' ? (
            <>
              अपनी बात <span className="text-teal-600">बोलकर बताएं</span>, सरल भाषा में समझें
            </>
          ) : language === 'mr' ? (
            <>
              तुमची समस्या <span className="text-teal-600">बोलून सांगा</span>, सोप्या भाषेत मार्गदर्शन मिळवा
            </>
          ) : (
            <>
              Speak In Your Own Words,{' '}
              <span className="text-teal-600">Listen In Simple Language</span>
            </>
          )}
        </h1>

        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
          {language === 'hi'
            ? 'पढ़ना-लिखना जरूरी नहीं — कोई भी मरीज अपनी आम बोलचाल में बीमारी या तकलीफ बता सकता है। हमारा AI लक्षणों को समझकर सुरक्षित घरेलू सावधानियां और डॉक्टर को दिखाने के जरूरी संकेत आसान आवाज में पढ़कर सुनाता है।'
            : language === 'mr'
            ? 'वाचण्याची किंवा लिहिण्याची गरज नाही — कोणताही रुग्ण आपल्या रोजच्या बोलण्यात समस्या सांगू शकतो. आमची AI प्रणाली लक्षणे समजून सुरक्षित घरगुती काळजी आणि डॉक्टरांकडे जाण्याचे संकेत सोप्या आवाजात वाचून दाखवते.'
            : 'No reading or writing required — simply speak your health symptoms in everyday words. Our AI identifies symptoms, suggests safe home precautions, and highlights urgent doctor alerts with clear audio readouts.'}
        </p>
      </div>

      {/* Main Interactive Card */}
      <div className="clinical-card rounded-3xl overflow-hidden mb-8 border border-slate-200/80 shadow-soft-lg">
        {/* Voice Input Section */}
        <div className="p-6 sm:p-10 bg-gradient-to-b from-teal-50/50 via-white to-white">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Big Mic Button */}
            <div className="relative mb-5">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-teal-500/25 animate-ping"></div>
                  <div className="absolute -inset-4 rounded-full bg-teal-500/15 animate-pulse"></div>
                </>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all active:scale-95 ${
                  isListening
                    ? 'bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-600 text-white shadow-teal-glow ring-4 ring-teal-300'
                    : 'bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 text-white hover:opacity-95 shadow-teal-glow ring-4 ring-teal-100 hover:ring-teal-200'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-10 w-10 sm:h-11 sm:w-11" />
                    <span className="text-[11px] font-black mt-1 tracking-wider uppercase">
                      {language === 'hi' ? 'रोकें' : language === 'mr' ? 'थांबवा' : 'Stop'}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="h-10 w-10 sm:h-11 sm:w-11" />
                    <span className="text-[11px] font-black mt-1 tracking-wider uppercase">
                      {language === 'hi' ? 'बोलें' : language === 'mr' ? 'बोला' : 'Speak'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Live Audio Equalizer Wave when listening */}
            {isListening && (
              <div className="flex items-center gap-1.5 h-7 justify-center mb-3">
                <span className="w-1.5 bg-teal-500 rounded-full animate-soundwave-1"></span>
                <span className="w-1.5 bg-teal-500 rounded-full animate-soundwave-2"></span>
                <span className="w-1.5 bg-teal-500 rounded-full animate-soundwave-3"></span>
                <span className="w-1.5 bg-teal-500 rounded-full animate-soundwave-4"></span>
                <span className="w-1.5 bg-teal-500 rounded-full animate-soundwave-5"></span>
              </div>
            )}

            {/* Status Label */}
            <p className="text-sm font-semibold text-slate-700 mb-2">
              {isListening ? (
                <span className="text-teal-700 flex items-center justify-center gap-2 font-bold animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-teal-600"></span>
                  {language === 'hi'
                    ? 'सुन रहे हैं... कृपया अपनी समस्या स्पष्ट बोलें'
                    : language === 'mr'
                    ? 'ऐकत आहोत... कृपया तुमची समस्या स्पष्ट बोला'
                    : 'Listening... Please speak your health problem clearly'}
                </span>
              ) : (
                <span className="text-slate-500 font-medium">
                  {language === 'hi'
                    ? 'माइक दबाकर अपनी तकलीफ बोलें या नीचे दिए उदाहरण पर क्लिक करें'
                    : language === 'mr'
                    ? 'माइक बटण दाबून बोला किंवा खालील उदाहरणावर क्लिक करा'
                    : 'Tap microphone to speak or choose a spoken example below'}
                </span>
              )}
            </p>

            {!speechSupported && (
              <p className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 mt-2 font-medium">
                ⚠️ Browser speech recognition is not supported in this browser. You can type or paste your spoken words in the text box below.
              </p>
            )}
          </div>

          {/* Transcribed text box */}
          <div className="mt-5 max-w-2xl mx-auto">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>
                {language === 'hi'
                  ? 'मरीज के बोले गए शब्द (Transcribed Text):'
                  : language === 'mr'
                  ? 'रुग्णाने उच्चारलेले शब्द (Transcribed Text):'
                  : 'Patient Spoken Words (Transcribed Text):'}
              </span>
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold"
                >
                  {language === 'hi' ? 'साफ करें' : language === 'mr' ? 'साफ करा' : 'Clear text'}
                </button>
              )}
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'जैसे: "मुझे दो दिन से बुखार है और गले में बहुत दर्द हो रहा है..."'
                  : language === 'mr'
                  ? 'उदा: "मला दोन दिवसांपासून ताप आहे आणि घसा खूप दुखत आहे..."'
                  : 'e.g. "I have had a mild fever and cough for two days, and my throat hurts when I swallow..."'
              }
              className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs transition-all"
            />
          </div>

          {/* Preset Buttons */}
          <div className="mt-4 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {language === 'hi'
                ? 'या इनमें से कोई उदाहरण चुनें:'
                : language === 'mr'
                ? 'किंवा यापैकी एक उदाहरण निवडा:'
                : 'Or try a patient spoken sample:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SPOKEN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="text-left px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-teal-50/70 hover:border-teal-300 transition-all text-xs font-semibold text-slate-700 shadow-2xs flex items-center justify-between group"
                >
                  <span className="truncate pr-2">
                    {language === 'hi'
                      ? preset.titleHi
                      : language === 'mr'
                      ? preset.titleMr
                      : preset.title}
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 text-center">
            <button
              type="button"
              disabled={loading || !inputText.trim()}
              onClick={() => handleSubmit()}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {language === 'hi'
                      ? 'सलाह तैयार हो रही है...'
                      : language === 'mr'
                      ? 'मार्गदर्शन तयार होत आहे...'
                      : 'Preparing Spoken Guidance...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>
                    {language === 'hi'
                      ? 'सरल भाषा में सलाह प्राप्त करें'
                      : language === 'mr'
                      ? 'सोप्या भाषेत मार्गदर्शन मिळवा'
                      : 'Get Simple Spoken Guidance'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 max-w-2xl mx-auto p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Area */}
        {guideResult && (
          <div className="border-t border-slate-200 p-6 sm:p-8 bg-slate-50/50">
            {/* Audio Readout Player Bar */}
            <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 border border-teal-500/30 rounded-3xl p-6 text-white shadow-soft-xl mb-8 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-soft-sm">
                    <Volume2 className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                      <h3 className="font-black text-lg text-white">
                        {language === 'hi'
                          ? 'बोलकर सुनें (Audio Readout)'
                          : language === 'mr'
                          ? 'आवाजात ऐका (Audio Readout)'
                          : 'Listen Aloud (Audio Readout)'}
                      </h3>
                      {isPlayingAudio && (
                        <div className="flex items-center gap-1 h-5">
                          <span className="w-1 bg-teal-400 rounded-full animate-soundwave-1"></span>
                          <span className="w-1 bg-teal-400 rounded-full animate-soundwave-2"></span>
                          <span className="w-1 bg-teal-400 rounded-full animate-soundwave-3"></span>
                          <span className="w-1 bg-teal-400 rounded-full animate-soundwave-4"></span>
                          <span className="w-1 bg-teal-400 rounded-full animate-soundwave-5"></span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-teal-200/80 font-medium mt-0.5">
                      {language === 'hi'
                        ? 'वरिष्ठ नागरिकों व हर मरीज के लिए — बिना पढ़ने की जरूरत, सिर्फ सुनें'
                        : language === 'mr'
                        ? 'ज्येष्ठ नागरिक व सर्व रुग्णांसाठी — वाचण्याची गरज नाही, फक्त ऐका'
                        : 'Designed for senior citizens and anyone who prefers listening over reading'}
                    </p>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-2.5 flex-wrap justify-center">
                  {!isPlayingAudio ? (
                    <button
                      type="button"
                      onClick={playAudio}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs transition-all shadow-teal-glow active:scale-95 cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>{isPausedAudio ? 'Resume' : 'Play Audio'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pauseAudio}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs transition-all shadow-soft-sm cursor-pointer"
                    >
                      <Pause className="h-4 w-4 fill-current" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopAudio}
                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs border border-white/10"
                    title="Stop Audio"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/10 text-xs font-bold">
                    <span className="text-teal-300 text-[10px] uppercase px-2">Speed:</span>
                    {[0.8, 1.0].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => changeSpeed(s)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                          playbackSpeed === s
                            ? 'bg-teal-400 text-slate-950 shadow-soft-xs'
                            : 'text-white hover:text-teal-200'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Copy Text Button */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs border border-white/10"
                    title="Copy Spoken Advice"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Breakdown Cards (The 5 exact requirements) */}
            <div className="space-y-6">
              {/* Point 1: Identified Symptoms */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {language === 'hi'
                        ? '1. पहचाने गए लक्षण (Identified Symptoms)'
                        : language === 'mr'
                        ? '१. ओळखलेली लक्षणे (Identified Symptoms)'
                        : '1. Identified Symptoms Mentioned'}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {language === 'hi'
                        ? 'मरीज की आवाज से निकाले गए प्रमुख लक्षण'
                        : language === 'mr'
                        ? 'रुग्णाच्या बोलण्यातून काढलेली प्रमुख लक्षणे'
                        : 'Extracted from the patient spoken problem'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {guideResult.symptoms_identified && guideResult.symptoms_identified.length > 0 ? (
                    guideResult.symptoms_identified.map((sym, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200"
                      >
                        <Thermometer className="h-3.5 w-3.5 text-sky-600" />
                        {sym}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No specific symptoms identified</span>
                  )}
                </div>
              </div>

              {/* Point 2: Simple Everyday Explanation */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                    <Info className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {language === 'hi'
                        ? '2. इसका सामान्य अर्थ क्या है (Simple Explanation)'
                        : language === 'mr'
                        ? '२. याचा सोपा अर्थ काय आहे (Simple Explanation)'
                        : '2. General Explanation In Everyday Language'}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {language === 'hi'
                        ? 'सरल और आम बोलचाल की भाषा में'
                        : language === 'mr'
                        ? 'साध्या आणि सोप्या घरगुती भाषेत'
                        : 'What these symptoms commonly indicate'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  {guideResult.general_explanation}
                </p>
              </div>

              {/* Point 3: Safe Basic Precautions (NO medication) */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-2xs">
                <div className="flex items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <HandHeart className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {language === 'hi'
                          ? '3. सुरक्षित प्राथमिक सावधानियां (Basic Precautions)'
                          : language === 'mr'
                          ? '३. सुरक्षित प्राथमिक काळजी (Basic Precautions)'
                          : '3. Basic & Safe Precautions at Home'}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {language === 'hi'
                          ? 'आराम, पानी और स्वच्छता (बिना किसी दवा के)'
                          : language === 'mr'
                          ? 'विश्रांती, पाणी आणि स्वच्छता (कोणत्याही औषधांशिवाय)'
                          : 'Rest, hydration & hygiene (strictly non-medicinal)'}
                      </span>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="h-3 w-3" />
                    No Medicines Prescribed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {guideResult.precautions &&
                    guideResult.precautions.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/80 flex items-start gap-2 text-xs font-medium text-slate-800"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Point 4: Urgent Doctor Warning (Red flags) */}
              <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
                    <ShieldAlert className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-950">
                      {language === 'hi'
                        ? '4. तुरंत डॉक्टर को कब दिखाना जरूरी है (Urgent Doctor Warnings)'
                        : language === 'mr'
                        ? '४. तातडीने डॉक्टरांकडे कधी जावे (Urgent Doctor Warnings)'
                        : '4. When You Should See a Doctor Urgently'}
                    </h4>
                    <span className="text-[11px] text-amber-800 font-medium">
                      {language === 'hi'
                        ? 'खतरे के लक्षण दिखने पर बिना देरी किए डॉक्टर से मिलें'
                        : language === 'mr'
                        ? 'धोक्याची लक्षणे दिसल्यास विलंब न करता डॉक्टरांना भेटा'
                        : 'Red-flag warnings requiring immediate medical attention'}
                    </span>
                  </div>
                </div>
                <div className="bg-white/90 rounded-xl p-3.5 border border-amber-200 text-xs sm:text-sm text-amber-950 font-semibold leading-relaxed">
                  ⚠️ {guideResult.urgent_warning}
                </div>
              </div>

              {/* Point 5: Strict Safety Guarantee & Final Doctor Closing */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-teal-600 text-white shadow-sm flex-shrink-0">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm sm:text-base">
                      {guideResult.doctor_closing}
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      {language === 'hi'
                        ? 'यह प्रणाली किसी भी बीमारी का पक्का निदान नहीं करती और न ही दवा लिखती है।'
                        : language === 'mr'
                        ? 'ही प्रणाली कोणताही निश्चित आजार निदान करत नाही किंवा औषधे सुचवत नाही.'
                        : 'This assistant strictly does not diagnose specific diseases or prescribe medications.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-teal-800 bg-white border border-teal-300 hover:bg-teal-100/50 transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>
                    {language === 'hi'
                      ? 'नई समस्या पूछें'
                      : language === 'mr'
                      ? 'नवीन समस्या विचारा'
                      : 'Ask Another Question'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Safety & Educational Footnote */}
      <div className="max-w-2xl mx-auto text-center text-xs text-slate-400 font-medium">
        <p>
          {language === 'hi'
            ? 'AarogyaAI आवाज सहायक केवल स्वास्थ्य जागरूकता के लिए है। किसी भी चिकित्सीय निर्णय के लिए हमेशा डॉक्टर से मिलें।'
            : language === 'mr'
            ? 'AarogyaAI आवाज सहाय्यक केवळ आरोग्य जनजागृतीसाठी आहे. वैद्यकीय निर्णयांसाठी डॉक्टरांचा सल्ला घ्या.'
            : 'AarogyaAI Voice Health Assistant provides educational risk guidance only and never replaces clinical evaluation by a medical doctor.'}
        </p>
      </div>
    </div>
  );
}
