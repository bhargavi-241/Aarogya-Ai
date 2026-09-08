import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import UnderstandPage from './pages/UnderstandPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import PredictPage from './pages/PredictPage';
import Dashboard from './pages/Dashboard';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import FeedbackPage from './pages/FeedbackPage';
import FloatingFeedbackButton from './components/FloatingFeedbackButton';

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/understand" element={<UnderstandPage />} />
              <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
              <Route path="/voice" element={<Navigate to="/voice-assistant" replace />} />
              <Route path="/voice-health" element={<Navigate to="/voice-assistant" replace />} />
              <Route path="/spoken" element={<Navigate to="/voice-assistant" replace />} />
              <Route path="/upload" element={<Navigate to="/understand" replace />} />
              <Route path="/ask" element={<Navigate to="/understand" replace />} />
              <Route path="/chat" element={<Navigate to="/understand" replace />} />
              <Route path="/predict" element={<PredictPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/history" element={<ResultsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <FloatingFeedbackButton />
        </div>
      </Router>
    </LanguageProvider>
  );
}

