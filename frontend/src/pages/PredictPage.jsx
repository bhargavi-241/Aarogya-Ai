import React, { useState } from 'react';
import {
  Activity, Heart, Droplet, Cpu, Sparkles, AlertCircle,
  HelpCircle, ArrowRight, Loader2, RefreshCw, BarChart2
} from 'lucide-react';
import { predictDiabetes, predictHeart, predictKidney } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';
import RiskResultCard from '../components/RiskResultCard';
import ModelMetricsCard from '../components/ModelMetricsCard';

function InputField({ label, name, value, onChange, min, max, step = 1, helper, unit }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold text-slate-700 block">
          {label} {unit && <span className="text-slate-400 font-normal">({unit})</span>}
        </label>
        {helper && (
          <span className="text-[10px] text-slate-400" title={helper}>
            {helper}
          </span>
        )}
      </div>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-2xs"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, helper }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 block mb-1">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-2xs"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PredictPage() {
  const [activeTab, setActiveTab] = useState('diabetes');
  const [selectedModel, setSelectedModel] = useState('RandomForest');
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  // Forms
  const [diabetesForm, setDiabetesForm] = useState({
    pregnancies: 1,
    glucose: 125,
    blood_pressure: 72,
    skin_thickness: 23,
    insulin: 95,
    bmi: 28.5,
    diabetes_pedigree: 0.45,
    age: 45,
  });

  const [heartForm, setHeartForm] = useState({
    age: 54,
    sex: 1,
    cp: 0,
    trestbps: 132,
    chol: 245,
    fbs: 0,
    restecg: 0,
    thalach: 148,
    exang: 0,
    oldpeak: 1.2,
    slope: 1,
    ca: 0,
    thal: 2,
  });

  const [kidneyForm, setKidneyForm] = useState({
    bp: 80,
    sg: 1.020,
    al: 0,
    su: 0,
    bgr: 115,
    bu: 36,
    sc: 1.1,
    sod: 138,
    pot: 4.4,
    hemo: 13.8,
    pcv: 42,
    wc: 7800,
    rc: 4.8,
  });

  const handleDiabetesChange = (e) => {
    const val = parseFloat(e.target.value);
    setDiabetesForm(prev => ({ ...prev, [e.target.name]: isNaN(val) ? 0 : val }));
  };

  const handleHeartChange = (e) => {
    const val = parseFloat(e.target.value);
    setHeartForm(prev => ({ ...prev, [e.target.name]: isNaN(val) ? 0 : val }));
  };

  const handleKidneyChange = (e) => {
    const val = parseFloat(e.target.value);
    setKidneyForm(prev => ({ ...prev, [e.target.name]: isNaN(val) ? 0 : val }));
  };

  const handleRunPrediction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPredictionResult(null);

    try {
      let res;
      if (activeTab === 'diabetes') {
        res = await predictDiabetes({ ...diabetesForm, model_name: selectedModel });
      } else if (activeTab === 'heart') {
        res = await predictHeart({ ...heartForm, model_name: selectedModel });
      } else if (activeTab === 'kidney') {
        res = await predictKidney({ ...kidneyForm, model_name: selectedModel });
      }
      setPredictionResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Prediction failed. Please ensure the backend is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Disclaimer */}
      <DisclaimerBanner />

      {/* Page Title */}
      <div>
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 rounded-lg px-3 py-1 text-xs font-semibold text-teal-800 mb-2">
          <Activity className="h-3.5 w-3.5 text-teal-600" />
          <span>Capability 3 • Machine Learning Risk Prediction</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          AI + Machine Learning Disease Risk Prediction
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Input your measured health parameters to receive a potential risk indication. The models are trained on clinically validated public datasets using scikit-learn.
        </p>
      </div>

      {/* Tabs & Model Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Disease Module Switcher */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'diabetes', label: '🩸 Diabetes Module' },
            { id: 'heart', label: '❤️ Heart Disease Module' },
            { id: 'kidney', label: '🫘 Kidney Disease Module' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPredictionResult(null);
                setError(null);
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Classifier Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-teal-600" /> Classifier:
          </span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="RandomForest">Random Forest (Recommended Default)</option>
            <option value="LogisticRegression">Logistic Regression</option>
            <option value="DecisionTree">Decision Tree</option>
            <option value="KNN">K-Nearest Neighbors (KNN)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Form + Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Area */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Enter Clinical Parameters
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust values to match your recent clinical test results
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
              {activeTab.toUpperCase()}
            </span>
          </div>

          <form onSubmit={handleRunPrediction} className="space-y-5">
            {/* DIABETES FORM */}
            {activeTab === 'diabetes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Plasma Glucose"
                  name="glucose"
                  value={diabetesForm.glucose}
                  onChange={handleDiabetesChange}
                  min={40}
                  max={300}
                  unit="mg/dL"
                  helper="Normal fasting: 70-99"
                />
                <InputField
                  label="Body Mass Index (BMI)"
                  name="bmi"
                  value={diabetesForm.bmi}
                  onChange={handleDiabetesChange}
                  min={10}
                  max={65}
                  step={0.1}
                  unit="kg/m²"
                  helper="Healthy: 18.5 - 24.9"
                />
                <InputField
                  label="Age"
                  name="age"
                  value={diabetesForm.age}
                  onChange={handleDiabetesChange}
                  min={1}
                  max={120}
                  unit="years"
                />
                <InputField
                  label="Blood Pressure (Diastolic)"
                  name="blood_pressure"
                  value={diabetesForm.blood_pressure}
                  onChange={handleDiabetesChange}
                  min={40}
                  max={150}
                  unit="mm Hg"
                  helper="Target: < 80"
                />
                <InputField
                  label="2-Hour Serum Insulin"
                  name="insulin"
                  value={diabetesForm.insulin}
                  onChange={handleDiabetesChange}
                  min={0}
                  max={850}
                  unit="mu U/ml"
                />
                <InputField
                  label="Skin Fold Thickness"
                  name="skin_thickness"
                  value={diabetesForm.skin_thickness}
                  onChange={handleDiabetesChange}
                  min={0}
                  max={99}
                  unit="mm"
                />
                <InputField
                  label="Diabetes Pedigree Function"
                  name="diabetes_pedigree"
                  value={diabetesForm.diabetes_pedigree}
                  onChange={handleDiabetesChange}
                  min={0}
                  max={2.5}
                  step={0.01}
                  helper="Family history genetic score"
                />
                <InputField
                  label="Pregnancies"
                  name="pregnancies"
                  value={diabetesForm.pregnancies}
                  onChange={handleDiabetesChange}
                  min={0}
                  max={20}
                />
              </div>
            )}

            {/* HEART DISEASE FORM */}
            {activeTab === 'heart' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Age"
                  name="age"
                  value={heartForm.age}
                  onChange={handleHeartChange}
                  min={18}
                  max={100}
                  unit="years"
                />
                <SelectField
                  label="Biological Sex"
                  name="sex"
                  value={heartForm.sex}
                  onChange={handleHeartChange}
                  options={[
                    { value: 1, label: 'Male' },
                    { value: 0, label: 'Female' },
                  ]}
                />
                <SelectField
                  label="Chest Pain Type"
                  name="cp"
                  value={heartForm.cp}
                  onChange={handleHeartChange}
                  options={[
                    { value: 0, label: 'Typical Angina (0)' },
                    { value: 1, label: 'Atypical Angina (1)' },
                    { value: 2, label: 'Non-anginal Pain (2)' },
                    { value: 3, label: 'Asymptomatic (3)' },
                  ]}
                />
                <InputField
                  label="Resting Blood Pressure"
                  name="trestbps"
                  value={heartForm.trestbps}
                  onChange={handleHeartChange}
                  min={80}
                  max={220}
                  unit="mm Hg"
                />
                <InputField
                  label="Serum Cholesterol"
                  name="chol"
                  value={heartForm.chol}
                  onChange={handleHeartChange}
                  min={100}
                  max={580}
                  unit="mg/dL"
                  helper="Desirable: < 200"
                />
                <InputField
                  label="Maximum Heart Rate Achieved"
                  name="thalach"
                  value={heartForm.thalach}
                  onChange={handleHeartChange}
                  min={60}
                  max={220}
                  unit="bpm"
                />
                <SelectField
                  label="Fasting Blood Sugar > 120 mg/dL"
                  name="fbs"
                  value={heartForm.fbs}
                  onChange={handleHeartChange}
                  options={[
                    { value: 0, label: 'False (≤ 120 mg/dL)' },
                    { value: 1, label: 'True (> 120 mg/dL)' },
                  ]}
                />
                <SelectField
                  label="Exercise Induced Angina"
                  name="exang"
                  value={heartForm.exang}
                  onChange={handleHeartChange}
                  options={[
                    { value: 0, label: 'No' },
                    { value: 1, label: 'Yes' },
                  ]}
                />
                <InputField
                  label="ST Depression (Oldpeak)"
                  name="oldpeak"
                  value={heartForm.oldpeak}
                  onChange={handleHeartChange}
                  min={0}
                  max={8}
                  step={0.1}
                />
                <SelectField
                  label="Thalassemia Status"
                  name="thal"
                  value={heartForm.thal}
                  onChange={handleHeartChange}
                  options={[
                    { value: 1, label: 'Normal (1)' },
                    { value: 2, label: 'Fixed Defect (2)' },
                    { value: 3, label: 'Reversible Defect (3)' },
                  ]}
                />
              </div>
            )}

            {/* KIDNEY DISEASE FORM */}
            {activeTab === 'kidney' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Blood Pressure"
                  name="bp"
                  value={kidneyForm.bp}
                  onChange={handleKidneyChange}
                  min={50}
                  max={200}
                  unit="mm Hg"
                />
                <SelectField
                  label="Specific Gravity"
                  name="sg"
                  value={kidneyForm.sg}
                  onChange={handleKidneyChange}
                  options={[
                    { value: 1.005, label: '1.005' },
                    { value: 1.010, label: '1.010' },
                    { value: 1.015, label: '1.015' },
                    { value: 1.020, label: '1.020 (Normal)' },
                    { value: 1.025, label: '1.025' },
                  ]}
                />
                <InputField
                  label="Serum Creatinine"
                  name="sc"
                  value={kidneyForm.sc}
                  onChange={handleKidneyChange}
                  min={0.2}
                  max={20}
                  step={0.1}
                  unit="mg/dL"
                  helper="Normal: 0.6 - 1.2"
                />
                <InputField
                  label="Blood Urea"
                  name="bu"
                  value={kidneyForm.bu}
                  onChange={handleKidneyChange}
                  min={5}
                  max={350}
                  unit="mg/dL"
                  helper="Normal: 7 - 20"
                />
                <InputField
                  label="Hemoglobin"
                  name="hemo"
                  value={kidneyForm.hemo}
                  onChange={handleKidneyChange}
                  min={3}
                  max={20}
                  step={0.1}
                  unit="g/dL"
                />
                <InputField
                  label="Blood Glucose (Random)"
                  name="bgr"
                  value={kidneyForm.bgr}
                  onChange={handleKidneyChange}
                  min={50}
                  max={500}
                  unit="mg/dL"
                />
                <InputField
                  label="Serum Sodium"
                  name="sod"
                  value={kidneyForm.sod}
                  onChange={handleKidneyChange}
                  min={90}
                  max={170}
                  unit="mEq/L"
                />
                <InputField
                  label="Serum Potassium"
                  name="pot"
                  value={kidneyForm.pot}
                  onChange={handleKidneyChange}
                  min={2.0}
                  max={10.0}
                  step={0.1}
                  unit="mEq/L"
                />
                <SelectField
                  label="Albumin Level"
                  name="al"
                  value={kidneyForm.al}
                  onChange={handleKidneyChange}
                  options={[
                    { value: 0, label: '0 (Normal / None)' },
                    { value: 1, label: '1 (Trace)' },
                    { value: 2, label: '2 (Moderate)' },
                    { value: 3, label: '3 (High)' },
                    { value: 4, label: '4 (Severe)' },
                  ]}
                />
                <SelectField
                  label="Sugar Level"
                  name="su"
                  value={kidneyForm.su}
                  onChange={handleKidneyChange}
                  options={[
                    { value: 0, label: '0 (None)' },
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                    { value: 3, label: '3' },
                  ]}
                />
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Evaluating with {selectedModel}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Compute Potential {activeTab.toUpperCase()} Risk Indication</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-5 space-y-6">
          {predictionResult ? (
            <RiskResultCard result={predictionResult} disease={activeTab} />
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 h-full flex flex-col items-center justify-center space-y-3 min-h-[350px]">
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                <Activity className="h-10 w-10" />
              </div>
              <h4 className="font-bold text-slate-700 text-base">
                Ready For Assessment
              </h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Fill in the clinical parameters on the left and click Compute. The model will calculate a potential risk indication score.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Model Performance Metrics Card */}
      <ModelMetricsCard />
    </div>
  );
}
