"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Eye,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────
interface PredictionResult {
  id: string;
  prediction: number;
  probability: number;
  status: string;
  featureBreakdown: Array<{
    name: string;
    value: number;
    unit: string;
    high: boolean;
    optimal: boolean;
  }>;
}

interface FormData {
  pregnancies: string;
  glucose: string;
  bloodPressure: string;
  skinThickness: string;
  insulin: string;
  bmi: string;
  diabetesPedigree: string;
  age: string;
}

// ─── Field Definitions ────────────────────────────────────────
const FIELDS = [
  { key: "pregnancies", label: "Pregnancies", unit: "", min: 0, max: 20, step: 1, placeholder: "Number of times" },
  { key: "insulin", label: "Insulin", unit: "mu U/ml", min: 0, max: 850, step: 1, placeholder: "2-Hour serum" },
  { key: "glucose", label: "Glucose", unit: "mg/dL", min: 0, max: 300, step: 1, placeholder: "Plasma glucose concentration" },
  { key: "bmi", label: "BMI", unit: "kg/m²", min: 0, max: 70, step: 0.1, placeholder: "Body mass index" },
  { key: "bloodPressure", label: "Blood Pressure", unit: "mm Hg", min: 0, max: 200, step: 1, placeholder: "Diastolic" },
  { key: "diabetesPedigree", label: "Diabetes Pedigree", unit: "", min: 0, max: 3, step: 0.001, placeholder: "Function" },
  { key: "skinThickness", label: "Skin Thickness", unit: "mm", min: 0, max: 100, step: 1, placeholder: "Triceps skin fold" },
  { key: "age", label: "Age", unit: "Years", min: 1, max: 120, step: 1, placeholder: "Age" },
] as const;

// ─── Risk Gauge Component for Modal ──────────────────────────────────────
function RiskGauge({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100);
  const data = [
    { value: pct, name: "Risk" },
    { value: 100 - pct, name: "Safe" },
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={56}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="#3b82f6" />
              <Cell fill="#e0e7ff" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{pct}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 font-medium mt-2">Risk Probability</p>
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"manual" | "batch">("manual");
  const [formData, setFormData] = useState<FormData>({
    pregnancies: "", glucose: "", bloodPressure: "", skinThickness: "",
    insulin: "", bmi: "", diabetesPedigree: "", age: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [submitError, setSubmitError] = useState("");

  // Batch state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchResults, setBatchResults] = useState<PredictionResult[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Recent activity
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/history?limit=5")
      .then(res => res.json())
      .then(data => {
        if (data.predictions) {
          setRecentActivities(data.predictions);
        }
      })
      .catch(console.error);
  }, [result]); // Refresh when a new diagnostic is run

  // ── Validation ──────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    FIELDS.forEach(({ key, label }) => {
      const val = formData[key as keyof FormData];
      if (val === "" || val === undefined) {
        newErrors[key as keyof FormData] = `${label} is required`;
      } else if (isNaN(Number(val)) || Number(val) < 0) {
        newErrors[key as keyof FormData] = `${label} must be a valid positive number`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Manual Submit ───────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregnancies: Number(formData.pregnancies),
          glucose: Number(formData.glucose),
          bloodPressure: Number(formData.bloodPressure),
          skinThickness: Number(formData.skinThickness),
          insulin: Number(formData.insulin),
          bmi: Number(formData.bmi),
          diabetesPedigree: Number(formData.diabetesPedigree),
          age: Number(formData.age),
          patientIdentifier: `PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Prediction failed. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setSubmitError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Batch Drop Zone ─────────────────────────────────────────
  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setBatchFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    maxFiles: 1,
  });

  const handleDownloadReport = () => {
    if (!result) return;

    const dateStr = new Date().toLocaleString();
    const userId = session?.user?.email || "Unknown";

    // Create a print container that will only be visible when printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #000; padding: 40px; line-height: 1.5; max-width: 800px; margin: 0 auto; background: white;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 30px; font-weight: bold; margin: 30px;">Diabetes Diagnostic AI</h1>
          <div style="margin-top: 10px; font-size: 14px; text-align: left;">
            <p><strong>Patient ID:</strong> ${(result as any).patientIdentifier || result.id || 'Manual Entry'}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Clinician:</strong> Dr. ${session?.user?.name || 'Anya Sharma'} (Email ID: ${userId})</p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 24px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 15px; text-align:center;">Diagnostic Result</h2>
          <p style="font-size: 17px; margin-bottom: 10px;">
            <strong>Outcome:</strong> <span style="font-weight: bold;">${result.prediction === 1 ? 'Elevated Risk (Diabetes Indicated)' : 'Negative Risk (No Diabetes Indicated)'}</span>
            </br> <strong>Confidence / Probability:</strong> ${(result.probability * 100).toFixed(1)}%
          
          </p>
          
            
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 20px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 15px;">Feature Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px; background-color: #f0f0f0;">Biomarker</th>
                <th style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px; background-color: #f0f0f0;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${result.featureBreakdown.map(f => `
                <tr>
                  <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${f.name}</td>
                  <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${f.value} ${f.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 50px; font-size: 12px; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
          <p>This report is generated automatically by Diabetes Diagnostic AI. For clinical reference only.</p>
        </div>
      </div>
    `;

    // Append to body
    document.body.appendChild(printContainer);

    // Add a style tag to hide everything else during print
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body > *:not(#print-container) {
          display: none !important;
        }
        #print-container {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    // Wait for the injected DOM to render
    setTimeout(() => {
      window.print();
      // Cleanup after browser print dialog captures the page
      setTimeout(() => {
        document.body.removeChild(printContainer);
        document.head.removeChild(style);
      }, 500);
    }, 100);
  };

  const handleBatchSubmit = async () => {
    if (!batchFile) return;
    setBatchLoading(true);
    setBatchResults([]);
    setBatchProgress(0);

    try {
      const buffer = await batchFile.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, number>>(ws);

      const results: PredictionResult[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pregnancies: row["Pregnancies"] ?? row["pregnancies"] ?? 0,
            glucose: row["Glucose"] ?? row["glucose"] ?? 0,
            bloodPressure: row["BloodPressure"] ?? row["blood_pressure"] ?? 0,
            skinThickness: row["SkinThickness"] ?? row["skin_thickness"] ?? 0,
            insulin: row["Insulin"] ?? row["insulin"] ?? 0,
            bmi: row["BMI"] ?? row["bmi"] ?? 0,
            diabetesPedigree: row["DiabetesPedigreeFunction"] ?? row["diabetes_pedigree"] ?? 0,
            age: row["Age"] ?? row["age"] ?? 0,
            patientIdentifier: `PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          results.push(data);
        }
        setBatchProgress(Math.round(((i + 1) / rows.length) * 100));
      }
      setBatchResults(results);
    } catch (err) {
      console.error("Batch error:", err);
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl text-gray-900 font-bold">
          Welcome back, Dr. {session?.user?.name}. Let's begin the assessment.
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 pt-4 gap-6">
              {(["manual", "batch"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setResult(null); }}
                  className={`pb-3 text-sm font-medium transition-all ${activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  {tab === "manual" ? "Manual Entry" : "Upload Data"}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ── Manual Entry Tab ── */}
              {activeTab === "manual" && (
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {FIELDS.map(({ key, label, unit, min, max, step, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                          {label} {unit && <span className="text-gray-400 font-normal">({unit})</span>}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min={min}
                            max={max}
                            step={step}
                            value={formData[key as keyof FormData]}
                            onChange={(e) => {
                              setFormData({ ...formData, [key]: e.target.value });
                              if (errors[key as keyof FormData]) {
                                setErrors({ ...errors, [key]: undefined });
                              }
                            }}
                            placeholder={placeholder}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 ${errors[key as keyof FormData]
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                              }`}
                          />
                        </div>
                        {errors[key as keyof FormData] && (
                          <p className="text-xs text-red-600">{errors[key as keyof FormData]}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Submit Error */}
                  {submitError && (
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {submitError}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all shadow-sm text-sm flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Run Diagnostic
                    </button>
                  </div>
                </form>
              )}

              {/* ── Batch Upload Tab ── */}
              {activeTab === "batch" && (
                <div className="space-y-6">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive
                      ? "border-blue-400 bg-blue-50"
                      : batchFile
                        ? "border-green-400 bg-green-50"
                        : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                  >
                    <input {...getInputProps()} />
                    {batchFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <FileSpreadsheet className="w-12 h-12 text-green-600" />
                        <p className="font-semibold text-gray-900">{batchFile.name}</p>
                        <p className="text-sm text-gray-500">{(batchFile.size / 1024).toFixed(1)} KB</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setBatchFile(null); }}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <UploadCloud className={`w-12 h-12 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} />
                        <div>
                          <p className="font-semibold text-gray-700">
                            {isDragActive ? "Drop the file here" : "Drag & Drop File or Click to Upload"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Accepts CSV or Excel (.xlsx) files</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {batchFile && (
                    <button
                      onClick={handleBatchSubmit}
                      disabled={batchLoading}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm text-sm"
                    >
                      {batchLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Run Batch Diagnostic
                    </button>
                  )}

                  {/* Batch progress bar */}
                  {batchLoading && (
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${batchProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Batch Results Table */}
                  {batchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-700">
                          Batch Results — {batchResults.length} predictions
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Row</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {batchResults.map((r, i) => {
                              const pct = Math.round(r.probability * 100);
                              const isPositive = r.prediction === 1;
                              return (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-gray-600 font-medium">{(r as any).patientIdentifier || `Row ${i + 1}`}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                                      }`}>
                                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                      {isPositive ? "Diabetes" : "No Diabetes"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-700 font-medium">{pct}%</td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => setResult(r)}
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h3>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((act) => {
                  const isPositive = act.predictionResult === 1;
                  return (
                    <div key={act.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{act.patientIdentifier || "Manual Entry"}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(act.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isPositive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                        {isPositive ? "Elevated Risk" : "Negative Risk"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No recent activity.</p>
            )}
          </div>

        </div>
      </div>

      {/* ── Risk Modal Overlay ── */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setResult(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">

              <div className="flex items-start justify-between mb-8">
                <div className={`px-5 py-2.5 rounded-lg border ${result.prediction === 1 ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-600"
                  }`}>
                  <h2 className="text-2xl font-bold">
                    {result.prediction === 1 ? "Elevated Risk" : "Negative Risk"}
                  </h2>
                </div>
                <RiskGauge probability={result.probability} />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Feature Breakdown</h3>
                <div className="space-y-2">
                  {result.featureBreakdown.map((f) => (
                    <div key={f.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex gap-1 items-center">
                        <span className="text-sm text-gray-700 min-w-[140px]">{f.name}</span>
                        <span className="text-sm font-medium text-gray-900">{f.value} {f.unit}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${f.high
                        ? "bg-red-50 text-red-600"
                        : f.optimal
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-600"
                        }`}>
                        {f.high ? "High" : f.optimal ? "Optimal" : "Normal"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 justify-center">
                <button
                  onClick={handleDownloadReport}
                  className="bg-[#4aa0e0] hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Download Report
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
