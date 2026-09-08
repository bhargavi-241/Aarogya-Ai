import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Stethoscope,
  Info,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Globe,
  FileText,
  ListOrdered,
  Activity,
  Heart,
  HelpCircle,
  MessageSquareQuote,
  CheckSquare,
  Square
} from 'lucide-react';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';

/**
 * Helper to render inline markdown like **bold** and *italic* cleanly as React elements
 */
function renderInlineFormatted(text) {
  if (!text) return null;
  
  const parts = [];
  let remaining = text;
  let keyIdx = 0;

  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/;

  while (remaining) {
    const match = remaining.match(tokenRegex);
    if (!match) {
      parts.push(<span key={keyIdx++}>{remaining}</span>);
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      parts.push(<span key={keyIdx++}>{remaining.substring(0, matchIndex)}</span>);
    }

    const matchText = match[0];
    if (matchText.startsWith('**') && matchText.endsWith('**')) {
      const boldContent = matchText.slice(2, -2);
      parts.push(
        <strong key={keyIdx++} className="font-bold text-white tracking-wide">
          {boldContent}
        </strong>
      );
    } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
      const italicContent = matchText.slice(1, -1);
      parts.push(
        <em key={keyIdx++} className="italic text-teal-200">
          {italicContent}
        </em>
      );
    }

    remaining = remaining.substring(matchIndex + matchText.length);
  }

  return parts;
}

/**
 * Smart automatic generator for report-tailored doctor questions if section was not returned
 */
function generateTailoredDoctorQuestions(parameters = [], rawText = '', docType = '', language = 'en', isAttention = false) {
  const lang = (language || 'en').toLowerCase().trim();
  const textLower = (rawText || '').toLowerCase();
  const docLower = (docType || '').toLowerCase();

  // Check condition signatures
  const isCardiac = docLower.includes('echo') || docLower.includes('cardio') || textLower.includes('ejection fraction') || textLower.includes('diastolic') || textLower.includes('valve') || textLower.includes('ecg');
  const isDiabetes = docLower.includes('diabetes') || docLower.includes('glucose') || textLower.includes('hba1c') || textLower.includes('glucose') || textLower.includes('fasting blood sugar') || textLower.includes('ppbs');
  const isKidney = docLower.includes('kidney') || docLower.includes('renal') || docLower.includes('kft') || textLower.includes('creatinine') || textLower.includes('urea') || textLower.includes('egfr');
  const isBlood = docLower.includes('cbc') || docLower.includes('hemato') || textLower.includes('hemoglobin') || textLower.includes('platelet') || textLower.includes('wbc') || textLower.includes('tlc');

  if (lang === 'hi' || lang === 'hindi') {
    if (isCardiac) {
      return [
        { q: 'मेरी इकोकार्डियोग्राफी / हृदय रिपोर्ट के निष्कर्षों (जैसे पंपिंग क्षमता या डायस्टोलिक स्थिति) का मेरे दैनिक स्वास्थ्य पर क्या प्रभाव पड़ता है?', category: 'परिणाम' },
        { q: 'क्या मुझे अपने रक्तचाप (BP) की अधिक बार जांच करने या किसी विशेष हृदय-सुरक्षा दवा की आवश्यकता है?', category: 'उपचार' },
        { q: 'हृदय की मांसपेशियों को स्वस्थ रखने के लिए मुझे किस प्रकार का हल्का व्यायाम और आहार (जैसे कम नमक) अपनाना चाहिए?', category: 'आहार व दिनचर्या' },
        { q: 'क्या मुझे कुछ महीनों बाद किसी फॉलो-अप इको टेस्ट (2D Echo) या अतिरिक्त जांच की आवश्यकता होगी?', category: 'फॉलो-अप' },
      ];
    }
    if (isDiabetes) {
      return [
        { q: 'मेरी रिपोर्ट के आधार पर मेरे फास्टिंग और भोजन के बाद के ब्लड शुगर का सुरक्षित दैनिक लक्ष्य क्या होना चाहिए?', category: 'परिणाम' },
        { q: 'क्या मुझे अपने आहार (कार्बोहाइड्रेट नियंत्रण), शारीरिक गतिविधि या दवाओं की खुराक में किसी बदलाव की आवश्यकता है?', category: 'आहार व उपचार' },
        { q: 'मुझे घर पर ब्लड शुगर की निगरानी कितनी बार करनी चाहिए और अगला HbA1c टेस्ट कब कराना होगा?', category: 'फॉलो-अप' },
        { q: 'ब्लड शुगर कम (Hypoglycemia) या अधिक होने पर मुझे किन शुरुआती लक्षणों पर ध्यान देना चाहिए?', category: 'सावधानियां' },
      ];
    }
    if (isKidney) {
      return [
        { q: 'मेरी किडनी फंक्शन रिपोर्ट (सीरम क्रिएटिनिन / यूरिया) के अनुसार मुझे अपने दैनिक पानी और प्रोटीन सेवन में क्या सावधानियां रखनी चाहिए?', category: 'परिणाम व आहार' },
        { q: 'क्या कोई ऐसी सामान्य दर्द निवारक (Painkillers) या दवाएं हैं जिनसे मुझे अपनी किडनी की सुरक्षा के लिए बचना चाहिए?', category: 'दवा सुरक्षा' },
        { q: 'किडनी के स्वास्थ्य को बनाए रखने के लिए मुझे रक्तचाप (BP) और शुगर का स्तर किस सीमा में रखना चाहिए?', category: 'उपचार' },
        { q: 'क्या मुझे किडनी स्वास्थ्य की प्रगति जानने के लिए 3 से 6 महीने में दोबारा रीनल टेस्ट (KFT) कराना चाहिए?', category: 'फॉलो-अप' },
      ];
    }
    if (isBlood) {
      return [
        { q: 'मेरा हीमोग्लोबिन / ब्लड काउंट स्तर सामान्य से भिन्न है, क्या यह आयरन की कमी, संक्रमण या किसी अन्य कारण से है?', category: 'परिणाम' },
        { q: 'क्या मुझे आयरन, विटामिन B12, या फोलिक एसिड सप्लीमेंट लेने की आवश्यकता है या आहार में बदलाव पर्याप्त होगा?', category: 'उपचार व पोषण' },
        { q: 'थकान, कमजोरी या सांस फूलने जैसे लक्षणों को कम करने के लिए मुझे क्या सावधानियां बरतनी चाहिए?', category: 'सावधानियां' },
        { q: 'उपचार या पोषण सुधार के बाद मुझे हीमोग्लोबिन की पुनः जांच (Repeat CBC) कब करानी चाहिए?', category: 'फॉलो-अप' },
      ];
    }
    return [
      { q: 'इस रिपोर्ट के समग्र निष्कर्षों का मेरे दीर्घकालिक स्वास्थ्य और दिनचर्या पर क्या अर्थ है?', category: 'परिणाम' },
      { q: 'क्या मुझे इन परिणामों के आधार पर अपनी जीवनशैली, आहार या व्यायाम में कोई विशेष सुधार करने की आवश्यकता है?', category: 'आहार व जीवनशैली' },
      { q: 'क्या मुझे अपनी स्थिति की नियमित निगरानी के लिए आगे कोई फॉलो-अप टेस्ट कराने की जरूरत है?', category: 'फॉलो-अप' },
      { q: 'किन लक्षणों पर मुझे विशेष ध्यान देने की जरूरत है जिसके लिए तुरंत डॉक्टर से संपर्क करना चाहिए?', category: 'सावधानियां' },
    ];
  }

  if (lang === 'mr' || lang === 'marathi') {
    if (isCardiac) {
      return [
        { q: 'माझ्या इकोकार्डियोग्राफी / हृदय अहवालातील निष्कर्षांचा माझ्या दैनंदिन आरोग्यावर काय परिणाम होईल?', category: 'निकाल' },
        { q: 'मला रक्तदाब (BP) तपासणी, औषधांमध्ये बदल किंवा विशेष खबरदारी घेण्याची गरज आहे का?', category: 'उपचार' },
        { q: 'हृदय निरोगी ठेवण्यासाठी मी कोणत्या प्रकारचा आहार (उदा. कमी मीठ) व हलका व्यायाम करावा?', category: 'आहार व जीवनशैली' },
        { q: 'मला काही महिन्यांनंतर पुन्हा फॉलो-अप तपासणी (2D Echo) करण्याची गरज आहे का?', category: 'फॉलो-अप' },
      ];
    }
    if (isDiabetes) {
      return [
        { q: 'माझ्या अहवालानुसार रक्तातील साखर (Blood Sugar / HbA1c) नियंत्रित ठेवण्यासाठी माझे दैनंदिन उद्दिष्ट काय असावे?', category: 'निकाल' },
        { q: 'यासाठी मला आहारात बदल, नियमित व्यायाम किंवा औषधोपचारांची आवश्यकता आहे का?', category: 'आहार व उपचार' },
        { q: 'मला पुढील लॅब तपासणी कधी करावी लागेल आणि घरच्या घरी साखरेची तपासणी कशी करावी?', category: 'फॉलो-अप' },
        { q: 'साखर अचानक कमी किंवा जास्त झाल्यास कोणती लक्षणे दिसतात आणि काय खबरदारी घ्यावी?', category: 'सावधानता' },
      ];
    }
    return [
      { q: 'या अहवालातील निष्कर्षांचा माझ्या दैनंदिन आरोग्यावर आणि कार्यक्षमतेवर काय परिणाम होईल?', category: 'निकाल' },
      { q: 'यासाठी मला आहारात बदल, व्यायाम किंवा उपचारांची गरज आहे का?', category: 'आहार व जीवनशैली' },
      { q: 'या स्थितीवर लक्ष ठेवण्यासाठी मला पुन्हा कधी फॉलो-अप तपासणी करावी लागेल?', category: 'फॉलो-अप' },
      { q: 'मला कोणती लक्षणे आढळल्यास त्वरित वैद्यकीय सल्ला घ्यावा?', category: 'काळजी' },
    ];
  }

  // Default English
  if (isCardiac) {
    return [
      { q: 'What do these specific echocardiography findings (such as pumping function or diastolic relaxation) mean for my day-to-day heart health?', category: 'Results' },
      { q: 'Should I monitor my blood pressure more closely or consider any adjustments to my current medications?', category: 'Treatment' },
      { q: 'What heart-healthy dietary habits (e.g. low sodium) and safe exercise routines do you recommend for my heart muscle?', category: 'Diet & Life' },
      { q: 'Will I need a repeat echocardiogram or follow-up cardiovascular checkup in the coming months?', category: 'Follow-up' },
    ];
  }
  if (isDiabetes) {
    return [
      { q: 'What should be my target fasting and post-meal blood sugar numbers based on these report results?', category: 'Results' },
      { q: 'Do you recommend any adjustments to my medication schedule or carbohydrate-conscious meal planning?', category: 'Diet & Care' },
      { q: 'How often should I monitor my blood glucose at home, and when should we schedule the next HbA1c test?', category: 'Follow-up' },
      { q: 'What specific symptoms or warning signs of low/high blood sugar should I be prepared to address?', category: 'Symptoms' },
    ];
  }
  if (isKidney) {
    return [
      { q: 'Based on my kidney function markers (Creatinine / Urea / eGFR), what is my ideal daily fluid and protein intake?', category: 'Diet & Intake' },
      { q: 'Are there any over-the-counter medications (especially NSAID painkillers) I should strictly avoid to protect my kidneys?', category: 'Safety' },
      { q: 'What blood pressure target should I maintain to minimize any long-term strain on my renal system?', category: 'Treatment' },
      { q: 'When should we repeat this kidney panel to monitor and ensure stable numbers?', category: 'Follow-up' },
    ];
  }
  if (isBlood) {
    return [
      { q: 'What is the primary factor behind my out-of-range blood count (e.g. iron deficiency, infection, or vitamin absorption)?', category: 'Results' },
      { q: 'Would you recommend starting an iron, Vitamin B12, or folate supplement, or are dietary adjustments sufficient?', category: 'Nutrition' },
      { q: 'Are there specific fatigue or weakness warning signs I should track and report back to you?', category: 'Symptoms' },
      { q: 'When should we repeat the Complete Blood Count (CBC) to verify improvement?', category: 'Follow-up' },
    ];
  }

  return [
    { q: 'What do these specific report findings mean for my overall daily health and long-term wellness?', category: 'Results' },
    { q: 'Are there any dietary, exercise, or lifestyle modifications recommended based on these values?', category: 'Diet & Life' },
    { q: 'Do I need any follow-up tests, re-evaluations, or medication adjustments for this condition?', category: 'Follow-up' },
    { q: 'What warning signs or symptoms should I watch out for that would require immediate clinical attention?', category: 'Symptoms' },
  ];
}

/**
 * Parser that cleans up unformatted or single-line markdown text and structures it into sections
 */
function parseExplanationSections(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      overview: [],
      normalParams: [],
      abnormalParams: [],
      conclusion: { status: 'unspecified', lines: [] },
      nextSteps: [],
      doctorQuestions: [],
      rawLines: []
    };
  }

  // Normalize text: ensure newlines before major delimiter markers even if they were squashed into 1 line
  let normalized = rawText
    .replace(/---/g, '\n\n')
    .replace(/(#{1,4}\s+)/g, '\n\n$1')
    .replace(/(\n|^)\s*\*\s*\*\*/g, '\n* **')
    .replace(/(\n|^)\s*(\d+\.)\s+\*\*/g, '\n$2 **');

  const rawLines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const overview = [];
  const normalParams = [];
  const abnormalParams = [];
  const nextSteps = [];
  const doctorQuestions = [];
  const conclusionLines = [];
  let conclusionStatus = 'normal';

  let currentSection = 'overview';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lower = line.toLowerCase();

    // Section 1 Header detection (Overview / सारांश / विहंगावलोकन)
    if (
      lower.includes('1.') ||
      lower.includes('report overview') ||
      lower.includes('रिपोर्ट का सारांश') ||
      lower.includes('अहवाल विहंगावलोकन') ||
      lower.includes('overview')
    ) {
      if (line.startsWith('#')) {
        currentSection = 'overview';
        continue;
      }
    }

    // Section 2 Header detection (Parameters Breakdown / मापदंडों का विवरण / पॅरामीटर्स तपशील)
    if (
      lower.includes('2.') ||
      lower.includes('parameters breakdown') ||
      lower.includes('मापदंडों का') ||
      lower.includes('पॅरामीटर्स')
    ) {
      if (line.startsWith('#')) {
        currentSection = 'params_normal';
        continue;
      }
    }

    // Sub-header: Normal parameters
    if (
      lower.includes('normal parameters') ||
      lower.includes('सामान्य मापदंड') ||
      lower.includes('सामान्य पॅरामीटर्स') ||
      lower.includes("what's normal")
    ) {
      currentSection = 'params_normal';
      continue;
    }

    // Sub-header: Abnormal parameters
    if (
      lower.includes('abnormal') ||
      lower.includes('notable') ||
      lower.includes('असामान्य') ||
      lower.includes('ध्यान देने योग्य') ||
      lower.includes('लक्ष देण्याजोगे') ||
      lower.includes('out-of-range')
    ) {
      currentSection = 'params_abnormal';
      continue;
    }

    // Section 3 Header detection (Conclusion / निष्कर्ष)
    if (
      lower.includes('3.') ||
      lower.includes('conclusion') ||
      lower.includes('health status') ||
      lower.includes('निष्कर्ष') ||
      lower.includes('आरोग्य स्थिती')
    ) {
      if (line.startsWith('#') || lower.includes('health status') || lower.includes('स्वास्थ्य स्थिति')) {
        currentSection = 'conclusion';
        if (line.startsWith('#')) continue;
      }
    }

    // Section 4 Header detection (Next Steps / अगले कदम / पुढील पायऱ्या)
    if (
      lower.includes('4.') ||
      lower.includes('next steps') ||
      lower.includes('अगले कदम') ||
      lower.includes('पुढील पायऱ्या') ||
      lower.includes('what to do next')
    ) {
      if (line.startsWith('#')) {
        currentSection = 'next_steps';
        continue;
      }
    }

    // Section 5 Header detection (Questions to Ask Your Doctor / डॉक्टर से पूछने योग्य प्रश्न)
    if (
      lower.includes('5.') ||
      lower.includes('questions to ask your doctor') ||
      lower.includes('questions to ask') ||
      lower.includes('डॉक्टर से पूछने') ||
      lower.includes('विचारण्यासाठी प्रश्न') ||
      lower.includes('doctor questions') ||
      lower.includes('questions for your doctor')
    ) {
      if (line.startsWith('#') || lower.includes('question') || lower.includes('प्रश्न')) {
        currentSection = 'doctor_questions';
        if (line.startsWith('#')) continue;
      }
    }

    // Skip generic markdown headers
    if (line.startsWith('###') || line.startsWith('####')) {
      continue;
    }

    let cleanText = line.replace(/^[\*\-\•]\s+/, '').trim();

    if (currentSection === 'overview') {
      if (cleanText) overview.push(cleanText);
    } else if (currentSection === 'params_normal') {
      if (cleanText) normalParams.push(cleanText);
    } else if (currentSection === 'params_abnormal') {
      if (cleanText) abnormalParams.push(cleanText);
    } else if (currentSection === 'conclusion') {
      if (
        lower.includes('attention') ||
        lower.includes('issue') ||
        lower.includes('out-of-range') ||
        lower.includes('ध्यान देने') ||
        lower.includes('असामान्य') ||
        lower.includes('लक्ष देणे आवश्यक') ||
        lower.includes('⚠') ||
        lower.includes('warning')
      ) {
        conclusionStatus = 'attention';
      }
      if (cleanText) conclusionLines.push(cleanText);
    } else if (currentSection === 'next_steps') {
      if (cleanText) nextSteps.push(cleanText);
    } else if (currentSection === 'doctor_questions') {
      if (cleanText) doctorQuestions.push(cleanText);
    } else {
      if (cleanText) overview.push(cleanText);
    }
  }

  if (
    overview.length === 0 &&
    normalParams.length === 0 &&
    abnormalParams.length === 0 &&
    conclusionLines.length === 0 &&
    nextSteps.length === 0 &&
    doctorQuestions.length === 0
  ) {
    return {
      overview: rawLines,
      normalParams: [],
      abnormalParams: [],
      conclusion: { status: 'unspecified', lines: [] },
      nextSteps: [],
      doctorQuestions: [],
      rawLines
    };
  }

  return {
    overview,
    normalParams,
    abnormalParams,
    conclusion: {
      status: conclusionStatus,
      lines: conclusionLines
    },
    nextSteps,
    doctorQuestions,
    rawLines
  };
}

export default function FormattedExplanation({
  explanation = '',
  rawText = '',
  parameters = [],
  docType = 'Medical Report',
  fileId = null,
  currentLanguage = 'en',
  onLanguageChange = null,
  onRefresh = null,
  loading = false,
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const [copiedSingleQ, setCopiedSingleQ] = useState(null);
  const [checkedQuestions, setCheckedQuestions] = useState({});

  const parsed = useMemo(() => {
    return parseExplanationSections(explanation);
  }, [explanation]);

  const isAttention = parsed.conclusion.status === 'attention';

  // Final doctor questions: parsed from Gemini or synthesized specifically for the patient's report
  const doctorQuestionsList = useMemo(() => {
    if (parsed.doctorQuestions && parsed.doctorQuestions.length >= 2) {
      return parsed.doctorQuestions.map((q, idx) => ({
        q: q.replace(/^\d+\.\s*/, '').trim(),
        category: idx === 0 ? 'Results' : idx === 1 ? 'Care & Diet' : idx === 2 ? 'Follow-up' : 'Safety'
      }));
    }
    return generateTailoredDoctorQuestions(parameters, rawText, docType, currentLanguage, isAttention);
  }, [parsed.doctorQuestions, parameters, rawText, docType, currentLanguage, isAttention]);

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllQuestions = () => {
    if (!doctorQuestionsList || doctorQuestionsList.length === 0) return;
    const textToCopy = doctorQuestionsList
      .map((item, idx) => `${idx + 1}. ${item.q.replace(/\*\*/g, '')}`)
      .join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2500);
  };

  const handleCopySingleQuestion = (text, idx) => {
    const clean = text.replace(/\*\*/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedSingleQ(idx);
    setTimeout(() => setCopiedSingleQ(null), 2000);
  };

  const toggleQuestionChecked = (idx) => {
    setCheckedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (!explanation && !loading) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 space-y-6 relative overflow-hidden transition-all animate-in fade-in-50">
      {/* Background Subtle Glows */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar with Language Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-teal-800/60 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/20 border border-teal-400/30 text-teal-300 rounded-2xl shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {t('simple_exp_title', 'Simple Language Medical Explanation')}
              </h3>
              <span className="inline-flex items-center gap-1.5 bg-teal-500/20 border border-teal-400/40 text-teal-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="h-3 w-3 text-teal-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{t('simple_exp_powered', 'Powered by Gemini AI')}</span>
              </span>
            </div>
            <p className="text-xs text-teal-200/80 mt-0.5 font-medium">
              Line-by-line clinical interpretation in simple, patient-friendly language
            </p>
          </div>
        </div>

        {/* Action Controls: Language Switcher Tabs & Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector Pill Tabs */}
          <div className="bg-slate-800/90 border border-teal-700/50 p-1 rounded-2xl flex items-center gap-1 shadow-xs">
            {LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onLanguageChange && onLanguageChange(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={`Switch explanation to ${lang.nativeLabel}`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Refresh / Copy / Print */}
          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-teal-300 border border-teal-700/40 rounded-xl text-xs transition-colors"
                title="Regenerate explanation"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-teal-300 border border-teal-700/40 rounded-xl text-xs transition-colors flex items-center gap-1"
              title="Copy explanation text"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-teal-300 border border-teal-700/40 rounded-xl text-xs transition-colors"
              title="Print summary"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay when re-generating language */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-flex p-3 bg-teal-500/20 rounded-2xl animate-pulse">
            <Sparkles className="h-8 w-8 text-teal-300 animate-spin" />
          </div>
          <p className="font-bold text-sm text-teal-100">
            Translating & generating medical explanation in selected language...
          </p>
          <p className="text-xs text-teal-300/70">
            Converting parameters and findings line-by-line
          </p>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          {/* SECTION 1: REPORT OVERVIEW */}
          {parsed.overview.length > 0 && (
            <div className="bg-slate-800/70 border border-teal-700/40 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-extrabold uppercase tracking-wider">
                <FileText className="h-4 w-4" />
                <span>1. {t('section_overview', 'Report Overview')}</span>
              </div>
              <div className="space-y-2 text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
                {parsed.overview.map((line, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {renderInlineFormatted(line)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: PARAMETERS BREAKDOWN (NORMAL & ABNORMAL CARDS) */}
          {(parsed.normalParams.length > 0 || parsed.abnormalParams.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-extrabold uppercase tracking-wider">
                <Activity className="h-4 w-4" />
                <span>2. {t('section_params', 'Parameters Breakdown')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Normal Parameters Column */}
                {parsed.normalParams.length > 0 && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider pb-2 border-b border-emerald-800/40">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span>{t('section_normal_params', 'Normal Parameters')}</span>
                      <span className="ml-auto text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-200 font-bold">
                        {parsed.normalParams.length} {t('findings_count_suffix', 'Items')}
                      </span>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                      {parsed.normalParams.map((paramLine, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2.5 bg-emerald-900/20 p-2.5 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div className="leading-snug">{renderInlineFormatted(paramLine)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Abnormal / Notable Parameters Column */}
                {parsed.abnormalParams.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider pb-2 border-b border-amber-800/40">
                      <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <span>{t('section_abnormal_params', 'Notable / Out-of-Range Parameters')}</span>
                      <span className="ml-auto text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-200 font-bold">
                        {parsed.abnormalParams.length} {t('findings_count_suffix', 'Items')}
                      </span>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                      {parsed.abnormalParams.map((paramLine, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2.5 bg-amber-900/20 p-2.5 rounded-xl border border-amber-500/20">
                          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="leading-snug">{renderInlineFormatted(paramLine)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: CONCLUSION & HEALTH STATUS CARD */}
          <div
            className={`rounded-2xl p-5 sm:p-6 border shadow-md space-y-3 transition-all ${
              isAttention
                ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-amber-500/50 text-amber-100'
                : 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border-emerald-500/50 text-emerald-100'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
                <Heart className="h-4 w-4 text-teal-300" />
                <span className="text-white">3. {t('conclusion_title', 'Conclusion & Health Status')}</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                  isAttention
                    ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                    : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                }`}
              >
                {isAttention ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>{t('conclusion_attention_badge', 'Attention Needed — Findings Identified')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t('conclusion_normal_badge', 'Normal — Within Reference Limits')}</span>
                  </>
                )}
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-100">
              {parsed.conclusion.lines.length > 0 ? (
                parsed.conclusion.lines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    <p className="leading-relaxed">{renderInlineFormatted(line)}</p>
                  </div>
                ))
              ) : (
                <p className="leading-relaxed">
                  {isAttention
                    ? t('conclusion_attention_fallback', 'Some evaluated clinical parameters or observations fall outside standard ranges. Please review with your doctor.')
                    : t('conclusion_normal_body', 'All evaluated test parameters and clinical observations fall within standard laboratory reference ranges.')}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 4: NEXT STEPS (ACTIONABLE CHECKLIST) */}
          {parsed.nextSteps.length > 0 && (
            <div className="bg-slate-800/70 border border-teal-700/40 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-extrabold uppercase tracking-wider">
                <ListOrdered className="h-4 w-4" />
                <span>4. {t('next_steps_title', 'What Should I Do? (Actionable Next Steps)')}</span>
              </div>
              <ol className="space-y-2.5 text-xs sm:text-sm text-slate-100">
                {parsed.nextSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 transition-all hover:border-teal-500/50"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-lg bg-teal-600/30 text-teal-300 font-bold text-xs border border-teal-500/40">
                      {idx + 1}
                    </span>
                    <div className="leading-relaxed mt-0.5">{renderInlineFormatted(step)}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* SECTION 5: QUESTIONS TO ASK YOUR DOCTOR (AUTOMATICALLY GENERATED BASED ON REPORT & HEALTH) */}
          {doctorQuestionsList.length > 0 && (
            <div className="bg-gradient-to-br from-teal-950/70 via-slate-900 to-slate-950 border-2 border-teal-500/40 rounded-3xl p-5 sm:p-7 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-800/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-600/30 text-teal-300 border border-teal-400/40 rounded-2xl shadow-xs">
                    <MessageSquareQuote className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-black text-white">
                        5. {t('questions_to_ask_title', 'Questions to Ask Your Doctor')}
                      </h4>
                      <span className="hidden sm:inline-flex items-center gap-1 bg-teal-500/20 text-teal-200 border border-teal-400/40 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                        {t('questions_to_ask_badge', 'Clinical Consultation Prep')}
                      </span>
                    </div>
                    <p className="text-xs text-teal-200/80 mt-0.5 leading-relaxed">
                      {t('questions_to_ask_desc', 'Take these tailored, report-specific questions to your consultation for a clear, empowering clinical discussion.')}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons for Doctor Questions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyAllQuestions}
                    className="px-3.5 py-2 bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 hover:text-white border border-teal-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                    title="Copy all questions to clipboard"
                  >
                    {copiedQuestions ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{t('copied_all_questions', 'Copied!')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{t('copy_all_questions', 'Copy All Questions')}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-xl text-xs transition-colors"
                    title="Print Questions"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3 pt-1">
                {doctorQuestionsList.map((item, qIdx) => {
                  const isChecked = !!checkedQuestions[qIdx];
                  return (
                    <div
                      key={qIdx}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isChecked
                          ? 'bg-slate-900/40 border-slate-800 opacity-60'
                          : 'bg-slate-900/80 border-teal-700/40 hover:border-teal-400/60 shadow-xs'
                      }`}
                    >
                      {/* Checkbox toggle for patient appointment prep */}
                      <button
                        type="button"
                        onClick={() => toggleQuestionChecked(qIdx)}
                        className="mt-0.5 text-teal-400 hover:text-teal-300 transition-colors flex-shrink-0"
                        title={isChecked ? 'Mark as unasked' : 'Mark as asked'}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-500 hover:text-teal-400" />
                        )}
                      </button>

                      {/* Numbered Pill */}
                      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-400/30">
                        {qIdx + 1}
                      </span>

                      {/* Question Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isChecked ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {renderInlineFormatted(item.q)}
                        </p>
                        {item.category && (
                          <span className="inline-block mt-1.5 text-[10px] font-semibold text-teal-300/80 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Individual Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopySingleQuestion(item.q, qIdx)}
                        className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-teal-300 hover:text-white rounded-lg text-xs border border-slate-700 transition-colors flex-shrink-0"
                        title="Copy this question"
                      >
                        {copiedSingleQ === qIdx ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Helpful Tip */}
              <div className="bg-teal-950/50 border border-teal-800/50 rounded-xl p-3 text-[11px] text-teal-200/90 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span>
                  <strong>Tip:</strong> You can print or copy these questions on your mobile phone and read them directly to your doctor or cardiologist during your appointment.
                </span>
              </div>
            </div>
          )}

          {/* FOOTER NOTICE */}
          <div className="text-[11px] text-teal-200/70 pt-3 border-t border-teal-800/60 flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-teal-400" />
              <span>{t('simple_exp_disclaimer', 'This is an AI-assisted explanation of the uploaded report and is not a medical diagnosis.')}</span>
            </span>
            <span className="font-semibold text-teal-300 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-teal-700/30">
              {t('simple_exp_model', 'Model: Gemini 3.6 Flash')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
