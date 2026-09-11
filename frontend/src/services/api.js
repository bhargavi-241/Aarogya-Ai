import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Response interceptor to catch and clarify network/server connectivity errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      const enhancedMessage =
        'Unable to connect to the backend server. Please make sure the backend is running on http://127.0.0.1:8000.';
      const netError = new Error(enhancedMessage);
      netError.isNetworkError = true;
      netError.originalError = error;
      return Promise.reject(netError);
    }
    return Promise.reject(error);
  }
);

export const uploadDocument = (file, language = 'en') => {
  const formData = new FormData();
  formData.append('file', file);
  if (language) {
    formData.append('language', language);
  }
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const validateDocument = (fileId) => {
  return api.post('/validate-document', { file_id: fileId });
};

export const performOCR = (fileId, language = 'en', cachedText = null) => {
  return api.post('/ocr', { file_id: fileId, language, cached_text: cachedText });
};

export const verifyOCR = (fileId, verifiedFields) => {
  return api.post('/verify', { file_id: fileId, verified_fields: verifiedFields });
};

export const checkReport = ({ fileId, rawText, parameters } = {}) => {
  return api.post('/check-report', {
    file_id: fileId,
    raw_text: rawText,
    parameters: parameters,
  });
};

export const compareReports = ({ fileIdA, fileIdB, rawTextA, rawTextB, labelA, labelB } = {}) => {
  return api.post('/compare-reports', {
    file_id_a: fileIdA,
    file_id_b: fileIdB,
    raw_text_a: rawTextA,
    raw_text_b: rawTextB,
    label_a: labelA || 'Previous Report',
    label_b: labelB || 'Current Report',
  });
};

export const summarizeReport = ({ rawText, parameters, docType, fileId, language = 'en' } = {}) => {
  return api.post('/summarize-report', {
    raw_text: rawText,
    parameters: parameters,
    doc_type: docType || 'Medical Report',
    file_id: fileId,
    language,
  });
};

export const analyzeSymptoms = ({ symptoms, language = 'en' } = {}) => {
  return api.post('/analyze-symptoms', {
    symptoms,
    language,
  });
};

export const explainTerms = (terms, textContext = '', reportId = null, useLlm = false, language = 'en') => {
  return api.post('/explain', {
    terms,
    text_context: textContext,
    report_id: reportId,
    use_llm: useLlm,
    language,
  });
};

export const predictDiabetes = (inputs) => {
  return api.post('/predict/diabetes', inputs);
};

export const predictHeart = (inputs) => {
  return api.post('/predict/heart', inputs);
};

export const predictKidney = (inputs) => {
  return api.post('/predict/kidney', inputs);
};

export const getModelMetrics = () => {
  return api.get('/model-metrics');
};

export const getHistory = () => {
  return api.get('/history');
};

export const checkHealth = () => {
  return api.get('/health');
};

export const submitFeedback = (data) => {
  return api.post('/feedback', data);
};

export const getFeedbackList = () => {
  return api.get('/feedback');
};

export const verifyAdminPasscode = (passcode) => {
  return api.post('/feedback/verify-admin', { passcode });
};

export const deleteFeedback = (feedbackId, adminKey) => {
  return api.delete(`/feedback/${feedbackId}`, {
    headers: {
      'X-Admin-Key': adminKey,
    },
  });
};

export const askHealthQuestion = ({ question, reportContext, history, language = 'en' } = {}) => {
  return api.post('/ask', {
    question,
    report_context: reportContext,
    history,
    language,
  });
};

export const getPatientVoiceGuide = ({ patientSpokenText, language = 'en' } = {}) => {
  return api.post('/patient-voice-guide', {
    patient_spoken_text: patientSpokenText,
    language,
  });
};

export default api;
