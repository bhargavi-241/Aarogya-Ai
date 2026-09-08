import React, { createContext, useContext, useState } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', shortCode: 'EN', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', shortCode: 'HI', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', shortCode: 'MR', flag: '🇮🇳' },
];

export const translations = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_understand: 'Understand Report',
    nav_voice: 'Voice Assistant',
    nav_predict: 'Health Risk',
    nav_dashboard: 'Dashboard',
    nav_history: 'History',
    nav_about: 'About',
    nav_feedback: 'Feedback',
    nav_brand_title: 'Aarogya',
    nav_brand_highlight: 'AI',
    nav_brand_sub: 'AI-Powered Healthcare Assistant',
    nav_safety_badge: 'Informational Risk Indications Only',
    nav_mobile_disclaimer: 'Not a medical diagnosis tool. Consult your doctor for medical decisions.',
    language_select: 'Language',
    language_english: 'English',
    language_hindi: 'हिन्दी (Hindi)',
    language_marathi: 'मराठी (Marathi)',

    // Disclaimer
    disclaimer_title: 'Important Safety Notice',
    disclaimer_text_prefix: 'This tool provides ',
    disclaimer_text_strong1: 'informational risk indications only',
    disclaimer_text_middle: ' and is ',
    disclaimer_text_strong2: 'not a medical diagnosis',
    disclaimer_text_suffix: '. Always consult a qualified healthcare professional before making any medical or medication decisions.',
    dismiss_notice: 'Dismiss notice',

    // Home Page
    hero_badge: 'AI-Powered Healthcare Assistant',
    hero_title: 'Understand Your Health Information Better',
    hero_desc: 'AarogyaAI empowers patients to understand complex prescriptions, decode medical lab reports in simple language, and explore machine-learning potential disease-risk indications.',
    hero_upload_btn: 'Upload Medical Report',
    hero_predict_btn: 'Check Health Risk',
    hero_symptoms_btn: 'Describe Symptoms & Issues',
    free_open_source: 'Free & Open Source',
    human_in_control: 'Human in Control',
    privacy_first: 'Privacy First',

    core_arch_badge: 'Core Architecture',
    core_arch_title: 'Three Integrated Capabilities',
    core_arch_desc: 'Engineered with a human-centric approach to address the barriers patients face with complex medical terminology.',

    pillar1_badge: 'Pillar 1',
    pillar1_title: '1. UNDERSTAND',
    pillar1_desc: 'Extract medicines, lab tests, and clinical parameters from prescriptions and lab reports using OpenCV preprocessing and OCR. Convert complex terms into simple, compassionate language.',
    pillar1_action: 'Start Document OCR',

    pillar2_badge: 'Pillar 2',
    pillar2_title: '2. VERIFY',
    pillar2_desc: 'Review low-confidence OCR text in an interactive side-by-side verification table. Humans remain in complete control of their personal clinical data.',
    pillar2_action: 'Open Verification Tool',

    pillar3_badge: 'Pillar 3',
    pillar3_title: '3. PREDICT',
    pillar3_desc: 'Explore machine-learning risk indications for Diabetes, Heart Disease, Kidney Disease, and Stroke using transparent scikit-learn statistical classifiers.',
    pillar3_action: 'Assess Disease Risk',

    // Results / History Page
    results_badge: 'Consolidated Analytics & History',
    results_title: 'Prediction History & Model Performance',
    results_desc: 'Review past disease-risk indications and inspect verified model metrics on test data.',
    run_new_prediction: 'Run New Prediction',
    prediction_records: 'Prediction Records',
    prediction_records_sub: 'Persistent SQLite storage of past risk indications',
    refresh: 'Refresh',
    loading_history: 'Loading history records...',
    no_history: 'No historical predictions recorded.',
    try_assessment: 'Try running an assessment in the Health Risk tab.',
    th_timestamp: 'Timestamp',
    th_disease_module: 'Disease Module',
    th_classifier: 'Classifier Used',
    th_indication: 'Indication Result',
    th_score: 'Statistical Score',

    // About Page
    about_badge: 'AI-Powered Healthcare Assistant',
    about_title: 'About AarogyaAI',
    about_desc: 'A design-thinking AI + Machine Learning initiative created to bridge the health literacy gap between clinical reports and patients.',
    the_problem_badge: 'The Healthcare Problem',
    the_problem_title: 'Patients Struggle to Understand Medical Documents',
    the_problem_desc: 'Clinical prescriptions are frequently handwritten with Latin abbreviations (e.g., OD, BD, SOS), and laboratory test reports contain complex biochemical parameters (e.g., eGFR, HbA1c, SGPT). Patients often experience anxiety and misinterpretations when attempting to understand their health status.',
    problem_takeaway: 'Health literacy gap leads to lower medication adherence.',
    the_solution_badge: 'The AI Companion Solution',
    the_solution_title: 'Understand, Verify, and Predict',
    the_solution_desc: 'AarogyaAI integrates image preprocessing, optical character recognition (OCR), a human-in-the-loop verification dashboard, plain-language medical dictionaries, and scikit-learn disease-risk assessment models.',
    solution_takeaway: 'Core Philosophy: "AI assists the user; the user remains in control."',
    design_thinking_badge: 'Methodology',
    design_thinking_title: 'Design Thinking Framework',
    design_thinking_desc: 'Built through user empathy, problem definition, ideation, prototyping, and rigorous testing.',
    testing_protocol_badge: 'Testing Protocol',
    testing_protocol_title: 'Testing Methodology & Continuous Feedback Loop',
    testing_protocol_desc: 'In accordance with academic research standards, testing is structured across 5 distinct dimensions:',
    roadmap_badge: 'Roadmap',
    roadmap_title: 'Future Scope & Research Directions',
    roadmap_desc: 'Planned enhancements for translating this academic prototype into clinical research trial readiness.',

    // Footer
    footer_desc: 'An academic AI + Machine Learning healthcare project designed to help patients understand complex medical prescriptions, lab reports, and health parameters in simple language.',
    footer_philosophy: 'Core Philosophy: "AI assists the user; the user remains in control."',
    footer_capabilities: 'Capabilities',
    footer_safety_notice: 'Safety Notice',
    footer_safety_desc: 'If you are experiencing severe chest pain, shortness of breath, or sudden weakness, seek emergency medical care immediately.',
    footer_emergency: 'Emergency Helpline: 112 / 911',
    footer_disclaimer_title: 'MANDATORY MEDICAL & ACADEMIC DISCLAIMER',
    footer_disclaimer_desc: 'This web application is an educational, research, and design-thinking prototype. All statistical predictions, OCR extractions, and plain-language summaries are for informational purposes only. The application does not provide medical diagnoses, treatment plans, or emergency care recommendations. Always consult a qualified physician or registered healthcare provider for clinical evaluation.',
    footer_copyright: 'AarogyaAI. AI-Powered Healthcare Assistant.',
    footer_stack: 'Built with React, Vite, Tailwind CSS, FastAPI, and Scikit-Learn.',

    // Medical Report Summary Details
    rep_badge_analyzed: '✓ Medical Report Analyzed',
    rep_title_summary: 'Medical Report Summary',
    rep_label_name: 'NAME',
    rep_label_age_sex: 'AGE / SEX',
    rep_label_report: 'REPORT',
    rep_label_clinic: 'CLINIC / CENTRE',
    rep_label_department: 'DEPARTMENT',
    rep_label_date: 'DATE',
    rep_label_ref_doctor: 'REF. DOCTOR',
    rep_label_mobile: 'MOBILE NO',
    rep_label_reg_id: 'REG ID / UHID',
    rep_label_occupation: 'OCCUPATION',
    rep_label_address: 'ADDRESS',
    rep_not_available: 'Not clearly available.',
    rep_status_mostly_normal: 'Mostly within reported ranges',
    rep_status_attention: 'Attention Needed — Health Issues / Out-of-Range Detected',
    rep_status_normal: 'Normal — All Evaluated Parameters Within Range',

    // Conclusion & Health Status
    conclusion_title: 'Conclusion & Health Status',
    conclusion_desc: 'Overall clinical impression and identified health status.',
    conclusion_attention_badge: 'Attention Needed — Health Issues / Out-of-Range Detected',
    conclusion_normal_badge: 'Normal — All Evaluated Parameters Within Range',
    conclusion_attention_findings_head: '⚠ Primary Health Findings Requiring Attention:',
    conclusion_normal_heading: 'Normal Health Indication:',
    conclusion_normal_body: 'All evaluated test parameters and clinical observations fall within standard laboratory reference ranges. No abnormal health flags were detected by this automated review.',
    conclusion_unclear_notes: "The doctor's notes on diagnosis were not clearly legible in this scan — please confirm the details with your doctor or pharmacist.",

    // Report Findings
    findings_title: 'Report Findings',
    findings_desc: 'Sequential clinical findings extracted from the document.',
    findings_count_suffix: 'Findings',

    // Simple Explanation
    simple_exp_title: 'Simple Explanation',
    simple_exp_powered: 'Powered by Gemini AI',
    simple_exp_disclaimer: 'This is an AI-assisted explanation of the uploaded report and is not a medical diagnosis.',
    simple_exp_model: 'Model: Gemini 3.6 Flash',
    section_overview: 'Report Overview',
    section_params: 'Parameters Breakdown',
    section_normal_params: 'Normal Parameters',
    section_abnormal_params: 'Notable / Out-of-Range Parameters',
    conclusion_attention_fallback: 'Some evaluated clinical parameters or observations fall outside standard ranges. Please review with your doctor.',
    questions_to_ask_title: 'Questions to Ask Your Doctor',
    questions_to_ask_desc: 'Take these tailored, report-specific questions to your consultation for a clear, empowering clinical discussion.',
    questions_to_ask_badge: 'Clinical Consultation Prep',
    copy_all_questions: 'Copy All Questions',
    copied_all_questions: 'All Questions Copied!',
    print_questions: 'Print Questions Checklist',
    question_category_results: 'About My Results',
    question_category_lifestyle: 'Diet & Lifestyle',
    question_category_treatment: 'Follow-up & Treatment',
    question_category_symptoms: 'Symptoms & Warning Signs',

    // Measurements Table
    measurements_title: 'Measurements',
    measurements_desc: 'Measured values compared against the report reference range.',
    measurements_count_suffix: 'Measurements',
    th_parameter: 'Parameter',
    th_result: 'Result',
    th_reference: 'Reference',
    th_status: 'Status',
    status_within_range: '✓ Within range',
    status_outside_range: '⚠ Outside range',

    // Medical Terms Explained
    terms_explained_title: 'Medical Terms Explained',
    terms_explained_desc: 'Plain-English explanations of clinical terminology found in this report.',

    // Report Review
    review_title: 'Report Review',
    review_desc: 'Summary of findings and items to discuss with your healthcare professional.',
    review_discussion_title: 'Findings Requiring Discussion',

    // Safe Next Steps
    next_steps_title: 'What Should I Do?',
    next_steps_desc: 'Safe, responsible next-step guidance for your clinical consultation.',
    ready_another_doc: 'Ready for another document?',
    upload_another_btn: 'Upload Another Medical Report',

    // Common dynamic terms
    term_male: 'Male',
    term_female: 'Female',
    term_prescription: 'Doctor Prescription',
    term_cbc: 'Complete Blood Count (CBC)',
    term_general_med: 'General Medicine',
    term_pathology: 'Pathology / Hematology',
    term_high: 'High',
    term_low: 'Low',
    term_normal: 'Normal',
  },

  hi: {
    // Navigation
    nav_home: 'होम',
    nav_understand: 'रिपोर्ट समझें',
    nav_voice: 'आवाज सहायक',
    nav_predict: 'स्वास्थ्य जोखिम',
    nav_dashboard: 'डैशबोर्ड',
    nav_history: 'इतिहास',
    nav_about: 'हमारे बारे में',
    nav_feedback: 'फीडबैक',
    nav_brand_title: 'Aarogya',
    nav_brand_highlight: 'AI',
    nav_brand_sub: 'AI-संचालित स्वास्थ्य सहायक',
    nav_safety_badge: 'केवल सूचनात्मक जोखिम संकेत',
    nav_mobile_disclaimer: 'यह चिकित्सीय निदान उपकरण नहीं है। चिकित्सा निर्णयों के लिए अपने डॉक्टर से परामर्श लें।',
    language_select: 'भाषा',
    language_english: 'English (अंग्रेज़ी)',
    language_hindi: 'हिन्दी',
    language_marathi: 'मराठी',

    // Disclaimer
    disclaimer_title: 'महत्वपूर्ण सुरक्षा सूचना',
    disclaimer_text_prefix: 'यह उपकरण केवल ',
    disclaimer_text_strong1: 'सूचनात्मक जोखिम संकेत प्रदान करता है',
    disclaimer_text_middle: ' और यह ',
    disclaimer_text_strong2: 'चिकित्सीय निदान नहीं है',
    disclaimer_text_suffix: '। कोई भी चिकित्सीय या दवा संबंधी निर्णय लेने से पहले हमेशा किसी योग्य स्वास्थ्य पेशेवर से परामर्श लें।',
    dismiss_notice: 'सूचना हटाएं',

    // Home Page
    hero_badge: 'AI-संचालित स्वास्थ्य सहायक',
    hero_title: 'अपनी स्वास्थ्य जानकारी को बेहतर समझें',
    hero_desc: 'AarogyaAI मरीजों को जटिल पर्चियों को समझने, सरल भाषा में लैब रिपोर्ट को डिकोड करने और संभावित बीमारी के जोखिम संकेतों का पता लगाने में सक्षम बनाता है।',
    hero_upload_btn: 'मेडिकल रिपोर्ट अपलोड करें',
    hero_predict_btn: 'स्वास्थ्य जोखिम जांचें',
    hero_symptoms_btn: 'लक्षण व समस्याएं बताएं',
    free_open_source: 'निःशुल्क और ओपन सोर्स',
    human_in_control: 'मानव नियंत्रण में',
    privacy_first: 'गोपनीयता प्राथमिकता',

    core_arch_badge: 'मुख्य वास्तुकला',
    core_arch_title: 'तीन एकीकृत क्षमताएं',
    core_arch_desc: 'मरीजों को जटिल चिकित्सा शब्दावली से होने वाली कठिनाइयों को दूर करने के लिए मानव-केंद्रित दृष्टिकोण के साथ डिज़ाइन किया गया।',

    pillar1_badge: 'स्तंभ 1',
    pillar1_title: '1. समझें',
    pillar1_desc: 'OpenCV और OCR का उपयोग करके नुस्खों और लैब रिपोर्ट से दवाएं, परीक्षण और नैदानिक पैरामीटर निकालें। जटिल शब्दों को सरल भाषा में बदलें।',
    pillar1_action: 'दस्तावेज़ OCR शुरू करें',

    pillar2_badge: 'स्तंभ 2',
    pillar2_title: '2. सत्यापित करें',
    pillar2_desc: 'इंटरएक्टिव सत्यापन तालिका में कम आत्मविश्वास वाले OCR टेक्स्ट की समीक्षा करें। व्यक्तिगत डेटा पर मानव नियंत्रण बना रहता है।',
    pillar2_action: 'सत्यापन उपकरण खोलें',

    pillar3_badge: 'स्तंभ 3',
    pillar3_title: '3. अनुमान लगाएं',
    pillar3_desc: 'पारदर्शी scikit-learn सांख्यिकीय क्लासिफायर का उपयोग करके मधुमेह, हृदय रोग, गुर्दे की बीमारी और स्ट्रोक के जोखिम संकेतों का अन्वेषण करें।',
    pillar3_action: 'रोग जोखिम का आकलन करें',

    // Results / History Page
    results_badge: 'समेकित विश्लेषिकी और इतिहास',
    results_title: 'भविष्यवाणी इतिहास और मॉडल प्रदर्शन',
    results_desc: 'पिछले रोग-जोखिम संकेतों की समीक्षा करें और परीक्षण डेटा पर सत्यापित मॉडल मेट्रिक्स का निरीक्षण करें।',
    run_new_prediction: 'नया जोखिम आकलन चलाएं',
    prediction_records: 'भविष्यवाणी रिकॉर्ड',
    prediction_records_sub: 'पिछले जोखिम संकेतों का स्थायी SQLite संग्रहण',
    refresh: 'ताज़ा करें',
    loading_history: 'इतिहास रिकॉर्ड लोड हो रहे हैं...',
    no_history: 'कोई ऐतिहासिक भविष्यवाणी दर्ज नहीं की गई।',
    try_assessment: 'स्वास्थ्य जोखिम टैब में आकलन चलाने का प्रयास करें।',
    th_timestamp: 'समय',
    th_disease_module: 'रोग मॉड्यूल',
    th_classifier: 'प्रयुक्त क्लासिफायर',
    th_indication: 'संकेत परिणाम',
    th_score: 'सांख्यिकीय स्कोर',

    // About Page
    about_badge: 'AI-संचालित स्वास्थ्य सहायक',
    about_title: 'AarogyaAI के बारे में',
    about_desc: 'क्लीनिकल रिपोर्ट और मरीजों के बीच स्वास्थ्य साक्षरता के अंतर को पाटने के लिए बनाई गई एक डिज़ाइन-थिंकिंग AI + मशीन लर्निंग पहल।',
    the_problem_badge: 'स्वास्थ्य सेवा समस्या',
    the_problem_title: 'मरीजों को मेडिकल दस्तावेज़ समझने में कठिनाई होती है',
    the_problem_desc: 'क्लिनिकल पर्चियां अक्सर लैटिन संक्षिप्ताक्षरों (जैसे, OD, BD, SOS) के साथ हस्तलिखित होती हैं, और लैब परीक्षण रिपोर्टों में जटिल बायोकेमिकल पैरामीटर (जैसे, eGFR, HbA1c, SGPT) शामिल होते हैं।',
    problem_takeaway: 'स्वास्थ्य साक्षरता की कमी से दवा अनुपालन में कमी आती है।',
    the_solution_badge: 'AI कम्पैनियन समाधान',
    the_solution_title: 'समझें, सत्यापित करें और अनुमान लगाएं',
    the_solution_desc: 'AarogyaAI इमेज प्रीप्रोसेसिंग, OCR, मानव-सत्यापन डैशबोर्ड, सरल-भाषा शब्दकोश और scikit-learn बीमारी-जोखिम मॉडल को एकीकृत करता है।',
    solution_takeaway: 'मूल दर्शन: "AI उपयोगकर्ता की सहायता करता है; नियंत्रण उपयोगकर्ता के हाथ में रहता है।"',
    design_thinking_badge: 'पद्धति',
    design_thinking_title: 'डिज़ाइन थिंकिंग ढांचा',
    design_thinking_desc: 'उपयोगकर्ता सहानुभूति, समस्या परिभाषा, विचार, प्रोटोटाइपिंग और कठोर परीक्षण के माध्यम से निर्मित।',
    testing_protocol_badge: 'परीक्षण प्रोटोकॉल',
    testing_protocol_title: 'परीक्षण पद्धति और निरंतर फीडबैक लूप',
    testing_protocol_desc: 'शैक्षणिक अनुसंधान मानकों के अनुसार, परीक्षण को 5 अलग-अलग आयामों में संरचित किया गया है:',
    roadmap_badge: 'रोडमैप',
    roadmap_title: 'भविष्य का दायरा और अनुसंधान दिशाएं',
    roadmap_desc: 'इस शैक्षणिक प्रोटोटाइप को नैदानिक अनुसंधान परीक्षण के लिए तैयार करने हेतु नियोजित संवर्द्धन।',

    // Footer
    footer_desc: 'मरीजों को जटिल नुस्खों, लैब रिपोर्टों और स्वास्थ्य मापदंडों को सरल भाषा में समझने में मदद करने के लिए डिज़ाइन की गई शैक्षणिक AI + मशीन लर्निंग परियोजना।',
    footer_philosophy: 'मूल दर्शन: "AI उपयोगकर्ता की सहायता करता है; नियंत्रण उपयोगकर्ता के पास रहता है।"',
    footer_capabilities: 'क्षमताएं',
    footer_safety_notice: 'सुरक्षा सूचना',
    footer_safety_desc: 'यदि आपको सीने में गंभीर दर्द, सांस लेने में तकलीफ या अचानक कमजोरी महसूस हो रही है, तो तुरंत आपातकालीन चिकित्सा सहायता लें।',
    footer_emergency: 'आपातकालीन हेल्पलाइन: 112 / 911',
    footer_disclaimer_title: 'अनिवार्य चिकित्सा और शैक्षणिक अस्वीकरण',
    footer_disclaimer_desc: 'यह वेब एप्लिकेशन एक शैक्षिक, अनुसंधान और डिज़ाइन-थिंकिंग प्रोटोटाइप है। सभी सांख्यिकीय भविष्यवाणियां, OCR निष्कर्षण और सरल भाषा सारांश केवल सूचनात्मक उद्देश्यों के लिए हैं। एप्लिकेशन चिकित्सीय निदान प्रदान नहीं करता है। हमेशा किसी योग्य चिकित्सक से परामर्श लें।',
    footer_copyright: 'AarogyaAI। AI-संचालित स्वास्थ्य सहायक।',
    footer_stack: 'React, Vite, Tailwind CSS, FastAPI और Scikit-Learn से निर्मित।',

    // Medical Report Summary Details
    rep_badge_analyzed: '✓ मेडिकल रिपोर्ट विश्लेषित',
    rep_title_summary: 'मेडिकल रिपोर्ट सारांश',
    rep_label_name: 'नाम',
    rep_label_age_sex: 'आयु / लिंग',
    rep_label_report: 'रिपोर्ट प्रकार',
    rep_label_clinic: 'क्लिनिक / केंद्र',
    rep_label_department: 'विभाग',
    rep_label_date: 'दिनांक',
    rep_label_ref_doctor: 'संदर्भित डॉक्टर',
    rep_label_mobile: 'मोबाइल नंबर',
    rep_label_reg_id: 'पंजीकरण आईडी / UHID',
    rep_label_occupation: 'व्यवसाय',
    rep_label_address: 'पता',
    rep_not_available: 'स्पष्ट रूप से उपलब्ध नहीं।',
    rep_status_mostly_normal: 'अधिकतर रिपोर्ट की गई सीमा के भीतर',
    rep_status_attention: 'ध्यान देने की आवश्यकता — असामान्य मान पाए गए',
    rep_status_normal: 'सामान्य — सभी पैरामीटर मानक सीमा के भीतर',

    // Conclusion & Health Status
    conclusion_title: 'निष्कर्ष और स्वास्थ्य स्थिति',
    conclusion_desc: 'समग्र नैदानिक प्रभाव और पहचानी गई स्वास्थ्य स्थिति।',
    conclusion_attention_badge: 'ध्यान देने की आवश्यकता — स्वास्थ्य संबंधी असामान्यताएं पाई गईं',
    conclusion_normal_badge: 'सामान्य — सभी मूल्यांकित पैरामीटर सीमा के भीतर हैं',
    conclusion_attention_findings_head: '⚠ प्राथमिक स्वास्थ्य निष्कर्ष जिन पर ध्यान देने की आवश्यकता है:',
    conclusion_normal_heading: 'सामान्य स्वास्थ्य संकेत:',
    conclusion_normal_body: 'सभी मूल्यांकित परीक्षण पैरामीटर और नैदानिक अवलोकन मानक प्रयोगशाला संदर्भ सीमाओं के भीतर हैं। इस स्वचालित समीक्षा द्वारा कोई असामान्य स्वास्थ्य दोष नहीं पाया गया।',
    conclusion_unclear_notes: 'इस स्कैन में निदान पर डॉक्टर के नोट्स स्पष्ट रूप से पठनीय नहीं थे — कृपया अपने डॉक्टर या फार्मासिस्ट से विवरण की पुष्टि करें।',

    // Report Findings
    findings_title: 'रिपोर्ट के निष्कर्ष',
    findings_desc: 'दस्तावेज़ से निकाले गए अनुक्रमिक नैदानिक निष्कर्ष।',
    findings_count_suffix: 'निष्कर्ष',

    // Simple Explanation
    simple_exp_title: 'सरल स्पष्टीकरण',
    simple_exp_powered: 'Gemini AI द्वारा संचालित',
    simple_exp_disclaimer: 'यह अपलोड की गई रिपोर्ट का AI-सहायता प्राप्त स्पष्टीकरण है और यह चिकित्सीय निदान नहीं है।',
    simple_exp_model: 'मॉडल: Gemini 3.6 Flash',
    section_overview: 'रिपोर्ट का विवरण (Overview)',
    section_params: 'मापदंडों का विश्लेषण (Parameters)',
    section_normal_params: 'सामान्य मापदंड (Normal)',
    section_abnormal_params: 'ध्यान देने योग्य / असामान्य मापदंड (Notable / Attention)',
    conclusion_attention_fallback: 'कुछ मूल्यांकित मापदंड मानक सीमा से बाहर हैं। कृपया अपने डॉक्टर से परामर्श लें।',
    questions_to_ask_title: 'डॉक्टर से पूछने योग्य महत्वपूर्ण प्रश्न',
    questions_to_ask_desc: 'अपनी रिपोर्ट के आधार पर अपने डॉक्टर से स्पष्ट और सार्थक बातचीत करने के लिए इन प्रश्नों को साथ ले जाएं।',
    questions_to_ask_badge: 'डॉक्टर परामर्श तैयारी',
    copy_all_questions: 'सभी प्रश्न कॉपी करें',
    copied_all_questions: 'सभी प्रश्न कॉपी हो गए!',
    print_questions: 'प्रश्न सूची प्रिंट करें',
    question_category_results: 'रिपोर्ट के परिणामों के बारे में',
    question_category_lifestyle: 'आहार और दिनचर्या',
    question_category_treatment: 'फॉलो-अप और उपचार',
    question_category_symptoms: 'लक्षण और सावधानियां',

    // Measurements Table
    measurements_title: 'माप और परिणाम',
    measurements_desc: 'रिपोर्ट की संदर्भ सीमा के विरुद्ध मापे गए मान।',
    measurements_count_suffix: 'माप',
    th_parameter: 'पैरामीटर',
    th_result: 'परिणाम',
    th_reference: 'संदर्भ सीमा',
    th_status: 'स्थिति',
    status_within_range: '✓ सीमा के भीतर',
    status_outside_range: '⚠ सीमा से बाहर',

    // Medical Terms Explained
    terms_explained_title: 'चिकित्सा शब्दों की व्याख्या',
    terms_explained_desc: 'इस रिपोर्ट में पाए गए नैदानिक शब्दों का सरल भाषा में स्पष्टीकरण।',

    // Report Review
    review_title: 'रिपोर्ट समीक्षा',
    review_desc: 'निष्कर्षों का सारांश और स्वास्थ्य सेवा पेशेवर के साथ चर्चा करने योग्य बिंदु।',
    review_discussion_title: 'चर्चा योग्य निष्कर्ष',

    // Safe Next Steps
    next_steps_title: 'मुझे क्या करना चाहिए?',
    next_steps_desc: 'आपके नैदानिक परामर्श के लिए सुरक्षित, जिम्मेदार अगले कदम का मार्गदर्शन।',
    ready_another_doc: 'क्या दूसरा दस्तावेज़ जांचना चाहते हैं?',
    upload_another_btn: 'अन्य मेडिकल रिपोर्ट अपलोड करें',

    // Common dynamic terms
    term_male: 'पुरुष',
    term_female: 'महिला',
    term_prescription: 'डॉक्टर की पर्ची (प्रिस्क्रिप्शन)',
    term_cbc: 'पूर्ण रक्त गणना (Complete Blood Count)',
    term_general_med: 'सामान्य चिकित्सा (General Medicine)',
    term_pathology: 'पैथोलॉजी / हेमेटोलॉजी (Pathology)',
    term_high: 'उच्च (High)',
    term_low: 'निम्न (Low)',
    term_normal: 'सामान्य (Normal)',
  },

  mr: {
    // Navigation
    nav_home: 'मुख्यपृष्ठ',
    nav_understand: 'अहवाल समजून घ्या',
    nav_voice: 'आवाज सहाय्यक',
    nav_predict: 'आरोग्य जोखीम',
    nav_dashboard: 'डॅशबोर्ड',
    nav_history: 'इतिहास',
    nav_about: 'आमच्याबद्दल',
    nav_feedback: 'अभिप्राय (फीडबॅक)',
    nav_brand_title: 'Aarogya',
    nav_brand_highlight: 'AI',
    nav_brand_sub: 'AI-सक्षम आरोग्य सहाय्यक',
    nav_safety_badge: 'केवळ माहितीपर जोखीम निर्देशक',
    nav_mobile_disclaimer: 'हे वैद्यकीय निदान साधन नाही. वैद्यकीय निर्णयांसाठी डॉक्टरांचा सल्ला घ्या.',
    language_select: 'भाषा',
    language_english: 'English (इंग्रजी)',
    language_hindi: 'हिन्दी (हिंदी)',
    language_marathi: 'मराठी',

    // Disclaimer
    disclaimer_title: 'महत्त्वाची सुरक्षा सूचना',
    disclaimer_text_prefix: 'हे साधन केवळ ',
    disclaimer_text_strong1: 'माहितीपर जोखीम निर्देशक प्रदान करते',
    disclaimer_text_middle: ' आणि हे ',
    disclaimer_text_strong2: 'वैद्यकीय निदान नाही',
    disclaimer_text_suffix: '. कोणतेही वैद्यकीय किंवा औषधोपचार निर्णय घेण्यापूर्वी नेहमी पात्र आरोग्यसेवा व्यावसायिकांचा सल्ला घ्या.',
    dismiss_notice: 'सूचना बंद करा',

    // Home Page
    hero_badge: 'AI-सक्षम आरोग्य सहाय्यक',
    hero_title: 'तुमची आरोग्य माहिती अधिक चांगल्या प्रकारे समजून घ्या',
    hero_desc: 'AarogyaAI रुग्णांना कठीण वैद्यकीय प्रिस्क्रिप्शन समजून घेण्यास, साध्या भाषेत लॅब अहवाल डीकोड करण्यास आणि संभाव्य आजारांच्या जोखमीचे मूल्यांकन करण्यास सक्षम करते.',
    hero_upload_btn: 'वैद्यकीय अहवाल अपलोड करा',
    hero_predict_btn: 'आरोग्य जोखीम तपासा',
    hero_symptoms_btn: 'लक्षणे व समस्या सांगा',
    free_open_source: 'मोफत आणि ओपन सोर्स',
    human_in_control: 'मानवी नियंत्रण',
    privacy_first: 'गोपनीयतेला प्राधान्य',

    core_arch_badge: 'मुख्य रचना',
    core_arch_title: 'तीन एकात्मिक क्षमता',
    core_arch_desc: 'रुग्णांना कठीण वैद्यकीय शब्दांमुळे येणाऱ्या अडचणी दूर करण्यासाठी मानवकेंद्रित दृष्टीकोनातून तयार केलेले.',

    pillar1_badge: 'स्तंभ १',
    pillar1_title: '१. समजून घ्या',
    pillar1_desc: 'OpenCV आणि OCR चा वापर करून प्रिस्क्रिप्शन आणि लॅब रिपोर्ट्समधून औषधे, चाचण्या आणि वैद्यकीय घटक मिळवा. कठीण शब्द साध्या भाषेत रूपांतरित करा.',
    pillar1_action: 'दस्तऐवज OCR सुरू करा',

    pillar2_badge: 'स्तंभ २',
    pillar2_title: '२. पडताळणी करा',
    pillar2_desc: 'इंटरअॅक्टिव्ह पडताळणी तक्त्यामध्ये कमी अचूकतेच्या मजकुराचे पुनरावलोकन करा. वैयक्तिक क्लिनिकल डेटावर पूर्णपणे मानवी नियंत्रण राहते.',
    pillar2_action: 'पडताळणी साधन उघडा',

    pillar3_badge: 'स्तंभ ३',
    pillar3_title: '३. अंदाज लावा',
    pillar3_desc: 'पारदर्शक scikit-learn सांख्यिकी क्लासिफायर्सचा वापर करून मधुमेह, हृदयरोग, मूत्रपिंडाचे आजार आणि स्ट्रोकसाठी मशीन लर्निंग जोखीम संकेत शोधा.',
    pillar3_action: 'रोग जोखमीचे मूल्यांकन करा',

    // Results / History Page
    results_badge: 'एकत्रित विश्लेषण आणि इतिहास',
    results_title: 'अनुमान इतिहास आणि मॉडेल कामगिरी',
    results_desc: 'मागील रोग-जोखीम निर्देशकांचे पुनरावलोकन करा आणि चाचणी डेटावरील सत्यापित मॉडेल मेट्रिक्स तपासा.',
    run_new_prediction: 'नवीन अंदाज लावा',
    prediction_records: 'अनुमान नोंदी',
    prediction_records_sub: 'मागील जोखीम निर्देशकांचे SQLite मधील स्टोरेज',
    refresh: 'रिफ्रेश करा',
    loading_history: 'इतिहास नोंदी लोड होत आहेत...',
    no_history: 'कोणत्याही ऐतिहासिक नोंदी उपलब्ध नाहीत.',
    try_assessment: 'आरोग्य जोखीम टॅबमध्ये मूल्यांकन करून पहा.',
    th_timestamp: 'वेळ',
    th_disease_module: 'रोग विभाग',
    th_classifier: 'वापरलेले क्लासिफायर',
    th_indication: 'जोखीम निष्कर्ष',
    th_score: 'सांख्यिकीय गुण',

    // About Page
    about_badge: 'AI-सक्षम आरोग्य सहाय्यक',
    about_title: 'AarogyaAI बद्दल',
    about_desc: 'वैद्यकीय अहवाल आणि रुग्ण यांच्यातील आरोग्य साक्षरतेतील अंतर भरून काढण्यासाठी तयार केलेला एक डिझाइन-थिंकिंग AI + मशीन लर्निंग उपक्रम.',
    the_problem_badge: 'आरोग्य सेवेतील समस्या',
    the_problem_title: 'रुग्णांना वैद्यकीय कागदपत्रे समजणे कठीण जाते',
    the_problem_desc: 'क्लिनिकल प्रिस्क्रिप्शन्स बऱ्याचदा लॅटिन संक्षेपांसह (उदा. OD, BD, SOS) हाताने लिहिलेली असतात आणि लॅब चाचणी अहवालांमध्ये कठीण बायोकेमिकल घटक (उदा. eGFR, HbA1c, SGPT) असतात.',
    problem_takeaway: 'आरोग्य साक्षरतेच्या अभावामुळे औषधोपचारात अनियमितता येते.',
    the_solution_badge: 'AI कम्पैनियन उपाय',
    the_solution_title: 'समजून घ्या, पडताळणी करा आणि अंदाज लावा',
    the_solution_desc: 'AarogyaAI इमेज प्रीप्रोसेसिंग, OCR, ह्युमन-इन-द-लूप पडताळणी डॅशबोर्ड, साध्या भाषेतील वैद्यकीय शब्दकोश आणि scikit-learn रोग-जोखीम मॉडेल्स एकत्रित करते.',
    solution_takeaway: 'मूळ तत्त्वज्ञान: "AI वापरकर्त्याला मदत करते; नियंत्रण वापरकर्त्याच्या हाती राहते."',
    design_thinking_badge: 'पद्धती',
    design_thinking_title: 'डिझाइन थिंकिंग फ्रेमवर्क',
    design_thinking_desc: 'वापरकर्ता सहानुभूती, समस्या व्याख्या, विचारमंथन, प्रोटोटायपिंग आणि कठोर चाचणीद्वारे विकसित.',
    testing_protocol_badge: 'चाचणी प्रोटोकॉल',
    testing_protocol_title: 'चाचणी पद्धती आणि सतत फीडबॅक लूप',
    testing_protocol_desc: 'शैक्षणिक संशोधन मानकांनुसार, चाचणी ५ वेगवेगळ्या आयामांमध्ये विभागलेली आहे:',
    roadmap_badge: 'रोडमॅप',
    roadmap_title: 'भविष्यातील व्याप्ती आणि संशोधन दिशा',
    roadmap_desc: 'हा शैक्षणिक प्रोटोटाइप क्लिनिकल रिसर्च ट्रायलसाठी तयार करण्यासाठी नियोजित सुधारणा.',

    // Footer
    footer_desc: 'रुग्णांना कठीण वैद्यकीय प्रिस्क्रिप्शन, लॅब अहवाल आणि आरोग्य मापदंड साध्या भाषेत समजून घेण्यास मदत करण्यासाठी डिझाइन केलेला शैक्षणिक AI + मशीन लर्निंग प्रकल्प.',
    footer_philosophy: 'मूळ तत्त्वज्ञान: "AI वापरकर्त्याला मदत करते; नियंत्रण वापरकर्त्याकडे राहते."',
    footer_capabilities: 'वैशिष्ट्ये',
    footer_safety_notice: 'सुरक्षा सूचना',
    footer_safety_desc: 'जर तुम्हाला छातीत तीव्र वेदना, श्वास घेण्यास त्रास किंवा अचानक अशक्तपणा जाणवत असेल तर त्वरित आपत्कालीन वैद्यकीय मदत घ्या.',
    footer_emergency: 'आपत्कालीन हेल्पलाइन: 112 / 911',
    footer_disclaimer_title: 'वैद्यकीय आणि शैक्षणिक अस्वीकरण',
    footer_disclaimer_desc: 'हे वेब ॲप्लिकेशन एक शैक्षणिक, संशोधन आणि डिझाइन-थिंकिंग प्रोटोटाइप आहे. सर्व सांख्यिकीय अंदाज, OCR निष्कर्ष आणि साध्या भाषेतील सारांश केवळ माहितीच्या उद्देशाने आहेत. ॲप्लिकेशन वैद्यकीय निदान प्रदान करत नाही. वैद्यकीय तपासणीसाठी नेहमी पात्र डॉक्टरांचा सल्ला घ्या.',
    footer_copyright: 'AarogyaAI. AI-सक्षम आरोग्य सहाय्यक.',
    footer_stack: 'React, Vite, Tailwind CSS, FastAPI आणि Scikit-Learn द्वारे विकसित.',

    // Medical Report Summary Details
    rep_badge_analyzed: '✓ वैद्यकीय अहवाल विश्लेषित',
    rep_title_summary: 'वैद्यकीय अहवाल सारांश',
    rep_label_name: 'नाव',
    rep_label_age_sex: 'वय / लिंग',
    rep_label_report: 'अहवाल प्रकार',
    rep_label_clinic: 'क्लिनिक / केंद्र',
    rep_label_department: 'विभाग',
    rep_label_date: 'दिनांक',
    rep_label_ref_doctor: 'संदर्भित डॉक्टर',
    rep_label_mobile: 'मोबाइल नंबर',
    rep_label_reg_id: 'नोंदणी आयडी / UHID',
    rep_label_occupation: 'व्यवसाय',
    rep_label_address: 'पत्ता',
    rep_not_available: 'स्पष्टपणे उपलब्ध नाही.',
    rep_status_mostly_normal: 'बहुतांश मूल्ये सामान्य मर्यादेत',
    rep_status_attention: 'लक्ष देणे आवश्यक — मर्यादेबाहेरील मूल्ये आढळली',
    rep_status_normal: 'सामान्य — सर्व घटक प्रमाणित मर्यादेत',

    // Conclusion & Health Status
    conclusion_title: 'निष्कर्ष आणि आरोग्याची स्थिती',
    conclusion_desc: 'एकूण वैद्यकीय निष्कर्ष आणि ओळखलेली आरोग्याची स्थिती.',
    conclusion_attention_badge: 'लक्ष देणे आवश्यक — आरोग्यविषयक समस्या / मर्यादाबाहेर मूल्ये',
    conclusion_normal_badge: 'सामान्य — सर्व घटक सामान्य संदर्भ मर्यादेत आहेत',
    conclusion_attention_findings_head: '⚠ प्राथमिक आरोग्य निष्कर्ष ज्यांवर लक्ष देणे आवश्यक आहे:',
    conclusion_normal_heading: 'सामान्य आरोग्य संकेत:',
    conclusion_normal_body: 'सर्व मूल्यांकित चाचणी घटक आणि वैद्यकीय निरीक्षणे प्रयोगशाळेच्या प्रमाणित संदर्भ मर्यादेत आहेत. या स्वयंचलित पुनरावलोकनात कोणताही असामान्य आरोग्य दोष आढळला नाही.',
    conclusion_unclear_notes: 'या स्कॅनमध्ये डॉक्टरांच्या निदानाच्या नोंदी स्पष्टपणे वाचता येत नव्हत्या — कृपया आपल्या डॉक्टरांशी किंवा औषधविक्रेत्याशी तपशीलांची खात्री करा.',

    // Report Findings
    findings_title: 'अहवालातील निष्कर्ष',
    findings_desc: 'दस्तऐवजातून निष्कर्षित केलेले क्रमिक वैद्यकीय निष्कर्ष.',
    findings_count_suffix: 'निष्कर्ष',

    // Simple Explanation
    simple_exp_title: 'सोपे स्पष्टीकरण',
    simple_exp_powered: 'Gemini AI द्वारे समर्थित',
    simple_exp_disclaimer: 'हे अपलोड केलेल्या अहवालाचे AI-सहाय्यित स्पष्टीकरण आहे आणि हे वैद्यकीय निदान नाही.',
    simple_exp_model: 'मॉडेल: Gemini 3.6 Flash',
    section_overview: 'अहवाल विहंगावलोकन (Overview)',
    section_params: 'पॅरामीटर्स तपशील (Parameters)',
    section_normal_params: 'सामान्य पॅरामीटर्स (Normal)',
    section_abnormal_params: 'असामान्य / लक्ष देण्याजोगे पॅरामीटर्स (Notable / Attention)',
    conclusion_attention_fallback: 'काही तपासलेले पॅरामीटर्स सामान्य मर्यादेबाहेर आहेत. कृपया आपल्या डॉक्टरांचा सल्ला घ्या.',
    questions_to_ask_title: 'आपल्या डॉक्टरांना विचारण्यासाठी महत्त्वाचे प्रश्न',
    questions_to_ask_desc: 'आपल्या अहवालाच्या आधारे डॉक्टरांशी सविस्तर आणि प्रभावी चर्चा करण्यासाठी हे प्रश्न सोबत ठेवा.',
    questions_to_ask_badge: 'डॉक्टर सल्लामसलत तयारी',
    copy_all_questions: 'सर्व प्रश्न कॉपी करा',
    copied_all_questions: 'सर्व प्रश्न कॉपी झाले!',
    print_questions: 'प्रश्न यादी प्रिंट करा',
    question_category_results: 'अहवालाच्या निकालांबद्दल',
    question_category_lifestyle: 'आहार आणि जीवनशैली',
    question_category_treatment: 'उपचार आणि पुढील तपासणी',
    question_category_symptoms: 'लक्षणे आणि काळजी',

    // Measurements Table
    measurements_title: 'मोजमाप आणि परिणाम',
    measurements_desc: 'अहवालातील संदर्भ मर्यादेच्या तुलनेत मोजलेली मूल्ये.',
    measurements_count_suffix: 'घटक',
    th_parameter: 'घटक',
    th_result: 'निकाल',
    th_reference: 'संदर्भ मर्यादा',
    th_status: 'स्थिती',
    status_within_range: '✓ सामान्य मर्यादेत',
    status_outside_range: '⚠ मर्यादेबाहेर',

    // Medical Terms Explained
    terms_explained_title: 'वैद्यकीय संज्ञांचे स्पष्टीकरण',
    terms_explained_desc: 'या अहवालातील वैद्यकीय संज्ञांचे साध्या भाषेतील स्पष्टीकरण.',

    // Report Review
    review_title: 'अहवाल पुनरावलोकन',
    review_desc: 'तपासणीचा सारांश आणि आपल्या डॉक्टरांशी चर्चा करण्याचे मुद्दे.',
    review_discussion_title: 'चर्चेची आवश्यकता असलेले निष्कर्ष',

    // Safe Next Steps
    next_steps_title: 'मी काय करावे?',
    next_steps_desc: 'आपल्या वैद्यकीय सल्ल्यासाठी सुरक्षित आणि जबाबदार पुढील मार्गदर्शन.',
    ready_another_doc: 'दुसरा दस्तऐवज तपासण्यासाठी तयार आहात?',
    upload_another_btn: 'दुसरा वैद्यकीय अहवाल अपलोड करा',

    // Common dynamic terms
    term_male: 'पुरुष',
    term_female: 'महिला',
    term_prescription: 'डॉक्टरांचे प्रिस्क्रिप्शन',
    term_cbc: 'संपूर्ण रक्त गणना (Complete Blood Count)',
    term_general_med: 'सामान्य वैद्यकीय (General Medicine)',
    term_pathology: 'पॅथॉलॉजी / हेमॅटॉलॉजी (Pathology)',
    term_high: 'जास्त (High)',
    term_low: 'कमी (Low)',
    term_normal: 'सामान्य (Normal)',
  },
};

// Common clinical dictionary for smart dynamic translation of extracted text values
const CLINICAL_TRANSLATIONS = {
  hi: {
    'Not clearly available.': 'स्पष्ट रूप से उपलब्ध नहीं।',
    'Not clearly available': 'स्पष्ट रूप से उपलब्ध नहीं।',
    'Doctor Prescription': 'डॉक्टर की पर्ची (प्रिस्क्रिप्शन)',
    'Complete Blood Count': 'पूर्ण रक्त गणना (CBC)',
    'Complete Blood Count (CBC)': 'पूर्ण रक्त गणना (CBC)',
    'Pathology / Hematology': 'पैथोलॉजी / हेमेटोलॉजी',
    'General Medicine': 'सामान्य चिकित्सा',
    'High': 'उच्च',
    'Low': 'निम्न',
    'Normal': 'सामान्य',
    'Male': 'पुरुष',
    'Female': 'महिला',
    'High Confidence Extraction': 'उच्च सटीकता निष्कर्षण',
    'Medium Confidence Extraction': 'मध्यम सटीकता',
    'Low Confidence Extraction': 'कम सटीकता (सत्यापित करें)',
    'Mostly within reported ranges': 'अधिकतर रिपोर्ट की गई सीमा के भीतर',
    'Values outside reference range': 'संदर्भ सीमा से बाहर मान',
    'Normal — All Evaluated Parameters Within Range': 'सामान्य — सभी मूल्यांकित पैरामीटर सीमा के भीतर',
    'Attention Needed — Health Issues / Out-of-Range Detected': 'ध्यान देने की आवश्यकता — असामान्यताएं पाई गईं',
    'Within range': 'सीमा के भीतर',
    'Outside range': 'सीमा से बाहर',
    'Within reported range': 'रिपोर्ट की गई सीमा के भीतर',
    'Above reported range': 'रिपोर्ट की गई सीमा से अधिक',
    'Below reported range': 'रिपोर्ट की गई सीमा से कम',
    "The doctor's notes on diagnosis were not clearly legible in this scan — please confirm the details with your doctor or pharmacist.": 'इस स्कैन में निदान पर डॉक्टर के नोट्स स्पष्ट रूप से पठनीय नहीं थे — कृपया अपने डॉक्टर या फार्मासिस्ट से विवरण की पुष्टि करें।',
    "Schedule a follow-up appointment with your doctor to review these findings in clinical context.": 'इन निष्कर्षों की समीक्षा के लिए अपने डॉक्टर के साथ एक अनुवर्ती मुलाकात निर्धारित करें।',
    "Bring this report and your original prescription when you meet your physician.": 'जब आप अपने चिकित्सक से मिलें तो यह रिपोर्ट और अपना मूल नुस्खा साथ लाएं।',
    "Do not alter or discontinue any prescribed medications without consulting your doctor.": 'अपने डॉक्टर से परामर्श के बिना किसी भी निर्धारित दवा में बदलाव या बंद न करें।',
    "If you experience sudden dizziness, severe chest discomfort, or weakness, seek emergency medical care immediately.": 'यदि आपको अचानक चक्कर, सीने में गंभीर परेशानी या कमजोरी महसूस हो तो तुरंत आपातकालीन चिकित्सा सहायता लें।',
  },
  mr: {
    'Not clearly available.': 'स्पष्टपणे उपलब्ध नाही.',
    'Not clearly available': 'स्पष्टपणे उपलब्ध नाही.',
    'Doctor Prescription': 'डॉक्टरांचे प्रिस्क्रिप्शन',
    'Complete Blood Count': 'संपूर्ण रक्त गणना (CBC)',
    'Complete Blood Count (CBC)': 'संपूर्ण रक्त गणना (CBC)',
    'Pathology / Hematology': 'पॅथॉलॉजी / हेमॅटॉलॉजी',
    'General Medicine': 'सामान्य वैद्यकीय',
    'High': 'जास्त',
    'Low': 'कमी',
    'Normal': 'सामान्य',
    'Male': 'पुरुष',
    'Female': 'महिला',
    'High Confidence Extraction': 'उच्च अचूकता निष्कर्ष',
    'Medium Confidence Extraction': 'मध्यम अचूकता',
    'Low Confidence Extraction': 'कमी अचूकता (पडताळणी करा)',
    'Mostly within reported ranges': 'बहुतांश मूल्ये सामान्य मर्यादेत',
    'Values outside reference range': 'संदर्भ मर्यादेबाहेरील मूल्ये',
    'Normal — All Evaluated Parameters Within Range': 'सामान्य — सर्व घटक सामान्य संदर्भ मर्यादेत',
    'Attention Needed — Health Issues / Out-of-Range Detected': 'लक्ष देणे आवश्यक — मर्यादेबाहेरील मूल्ये आढळली',
    'Within range': 'सामान्य मर्यादेत',
    'Outside range': 'मर्यादेबाहेर',
    'Within reported range': 'नोंदवलेल्या मर्यादेत',
    'Above reported range': 'नोंदवलेल्या मर्यादेपेक्षा जास्त',
    'Below reported range': 'नोंदवलेल्या मर्यादेपेक्षा कमी',
    "The doctor's notes on diagnosis were not clearly legible in this scan — please confirm the details with your doctor or pharmacist.": 'या स्कॅनमध्ये डॉक्टरांच्या निदानाच्या नोंदी स्पष्टपणे वाचता येत नव्हत्या — कृपया आपल्या डॉक्टरांशी किंवा औषधविक्रेत्याशी तपशीलांची खात्री करा.',
    "Schedule a follow-up appointment with your doctor to review these findings in clinical context.": 'वैद्यकीय संदर्भात या निष्कर्षांचे पुनरावलोकन करण्यासाठी आपल्या डॉक्टरांशी भेट निश्चित करा.',
    "Bring this report and your original prescription when you meet your physician.": 'आपल्या डॉक्टरांना भेटताना हा अहवाल आणि आपले मूळ प्रिस्क्रिप्शन सोबत आणा.',
    "Do not alter or discontinue any prescribed medications without consulting your doctor.": 'आपल्या डॉक्टरांचा सल्ला घेतल्याशिवाय कोणत्याही औषधात बदल करू नका किंवा ते थांबवू नका.',
    "If you experience sudden dizziness, severe chest discomfort, or weakness, seek emergency medical care immediately.": 'जर तुम्हाला अचानक चक्कर येणे, छातीत तीव्र त्रास किंवा अशक्तपणा जाणवत असेल तर त्वरित आपत्कालीन वैद्यकीय मदत घ्या.',
  },
};

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback = '') => fallback,
  tText: (text) => text,
  languages: LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('ai_health_lang');
    if (saved && ['en', 'hi', 'mr'].includes(saved)) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (newLang) => {
    if (['en', 'hi', 'mr'].includes(newLang)) {
      setLanguageState(newLang);
      localStorage.setItem('ai_health_lang', newLang);
    }
  };

  const t = (key, fallback = '') => {
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    if (translations.en && translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return fallback || key;
  };

  // Smart helper to translate dynamic extracted clinical text / values
  const tText = (text) => {
    if (!text || typeof text !== 'string' || language === 'en') {
      return text;
    }
    const trimmed = text.trim();
    const dict = CLINICAL_TRANSLATIONS[language];
    if (dict && dict[trimmed]) {
      return dict[trimmed];
    }

    // Handle "Age / Male", "21 / Male", "35 / Female"
    if (trimmed.includes(' / Male')) {
      const prefix = trimmed.replace(' / Male', '');
      return `${prefix} / ${dict['Male'] || 'पुरुष'}`;
    }
    if (trimmed.includes(' / Female')) {
      const prefix = trimmed.replace(' / Female', '');
      return `${prefix} / ${dict['Female'] || 'महिला'}`;
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tText, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
