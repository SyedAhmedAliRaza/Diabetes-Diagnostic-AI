"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

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

interface Prediction {
  id: string;
  patientIdentifier: string | null;
  pregnancies: number;
  glucose: number;
  bloodPressure: number;
  skinThickness: number;
  insulin: number;
  bmi: number;
  diabetesPedigree: number;
  age: number;
  predictionResult: number;
  confidenceScore: number;
  createdAt: string;
}

interface HistoryResponse {
  predictions: Prediction[];
  total: number;
  page: number;
  totalPages: number;
}

function HistoryContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [sortField, setSortField] = useState<"createdAt" | "confidenceScore">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sync initialSearch if URL changes
  useEffect(() => {
    if (initialSearch !== search) {
      setSearch(initialSearch);
      setDebouncedSearch(initialSearch);
    }
  }, [initialSearch]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 on search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        search: debouncedSearch,
        sortField: sortField,
        sortOrder: sortOrder,
      });
      const res = await fetch(`/api/history?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sortField, sortOrder]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadReport = () => {
    if (!selectedPrediction) return;

    const dateStr = formatDate(selectedPrediction.createdAt);
    const userId = session?.user?.email || "Unknown";

    // Create a print container that will only be visible when printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #000; padding: 40px; line-height: 1.5; max-width: 800px; margin: 0 auto; background: white;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 30px; font-weight: bold; margin: 30px;">Diabetes Diagnostic AI</h1>
          <div style="margin-top: 10px; font-size: 14px; text-align: left;">
            <p><strong>Patient ID:</strong> ${selectedPrediction.patientIdentifier || selectedPrediction.id}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Clinician:</strong> Dr. ${session?.user?.name || 'Anya Sharma'} (Email ID: ${userId})</p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 24px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 15px; text-align:center;">Diagnostic Result</h2>
          <p style="font-size: 17px; margin-bottom: 10px;">
            <strong>Outcome:</strong> <span style="font-weight: bold;">${selectedPrediction.predictionResult === 1 ? 'Elevated Risk (Diabetes Indicated)' : 'Negative Risk (No Diabetes Indicated)'}</span>
            </br> <strong>Confidence / Probability:</strong> ${(selectedPrediction.confidenceScore * 100).toFixed(1)}%
          
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
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">Pregnancies</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${selectedPrediction.pregnancies} count</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">Glucose</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${selectedPrediction.glucose} mg/dL</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">Blood Pressure</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${selectedPrediction.bloodPressure} mm Hg</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">Skin Thickness</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${selectedPrediction.skinThickness} mm</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">Insulin</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${selectedPrediction.insulin} mu U/ml</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">BMI</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${selectedPrediction.bmi} kg/m²</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">Diabetes Pedigree</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${selectedPrediction.diabetesPedigree} score</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">Age</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px;">${selectedPrediction.age} years</td>
              </tr>
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

  // Data is now sorted by the backend API
  const sortedPredictions = data ? data.predictions : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prediction History</h1>
          <p className="text-gray-500 mt-1">
            All past diagnostic predictions — {data?.total ?? 0} total records
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-4 py-2 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Patient ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Sort by:</span>
            {["createdAt", "confidenceScore"].map((field) => (
              <button
                key={field}
                onClick={() => {
                  if (sortField === field) {
                    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
                  } else {
                    setSortField(field as "createdAt" | "confidenceScore");
                    setSortOrder("desc");
                  }
                }}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${sortField === field
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
              >
                {field === "createdAt" ? "Date" : "Confidence"}
                {sortField === field && (
                  sortOrder === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Features</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prediction</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm">Loading predictions...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedPredictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <TrendingUp className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No predictions found. Run your first diagnostic!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedPredictions.map((p, idx) => {
                  const isPositive = p.predictionResult === 1;
                  const pct = Math.round(p.confidenceScore * 100);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap text-xs">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {p.patientIdentifier ?? `#${p.id.slice(0, 6)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            Glc: {p.glucose}
                          </span>
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                            BMI: {p.bmi}
                          </span>
                          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                            Age: {p.age}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                          }`}>
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {isPositive ? "Diabetes" : "No Diabetes"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${isPositive ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedPrediction(p)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {data.page} of {data.totalPages} · {data.total} total records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-blue-300 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-blue-300 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedPrediction(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">

              <div className="flex items-start justify-between mb-8">
                <div className={`px-5 py-2.5 rounded-lg border ${selectedPrediction.predictionResult === 1 ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-600"
                  }`}>
                  <h2 className="text-2xl font-bold">
                    {selectedPrediction.predictionResult === 1 ? "Elevated Risk" : "Negative Risk"}
                  </h2>
                </div>
                <RiskGauge probability={selectedPrediction.confidenceScore} />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Feature Breakdown</h3>
                <div className="space-y-2">
                  {[
                    { label: "Pregnancies", value: selectedPrediction.pregnancies, unit: "count", high: selectedPrediction.pregnancies > 5, optimal: selectedPrediction.pregnancies <= 3 },
                    { label: "Glucose", value: selectedPrediction.glucose, unit: "mg/dL", high: selectedPrediction.glucose > 140, optimal: selectedPrediction.glucose <= 100 },
                    { label: "Blood Pressure", value: selectedPrediction.bloodPressure, unit: "mm Hg", high: selectedPrediction.bloodPressure > 90, optimal: selectedPrediction.bloodPressure <= 80 },
                    { label: "Skin Thickness", value: selectedPrediction.skinThickness, unit: "mm", high: selectedPrediction.skinThickness > 30, optimal: selectedPrediction.skinThickness <= 20 },
                    { label: "Insulin", value: selectedPrediction.insulin, unit: "mu U/ml", high: selectedPrediction.insulin > 160, optimal: selectedPrediction.insulin <= 100 },
                    { label: "BMI", value: selectedPrediction.bmi, unit: "kg/m²", high: selectedPrediction.bmi > 30, optimal: selectedPrediction.bmi <= 25 },
                    { label: "Diabetes Pedigree", value: selectedPrediction.diabetesPedigree, unit: "score", high: selectedPrediction.diabetesPedigree > 0.8, optimal: selectedPrediction.diabetesPedigree <= 0.4 },
                    { label: "Age", value: selectedPrediction.age, unit: "years", high: selectedPrediction.age > 50, optimal: selectedPrediction.age <= 30 },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex gap-1 items-center">
                        <span className="text-sm text-gray-700 min-w-[140px]">{f.label}</span>
                        <span className="text-sm font-medium text-gray-900">{f.value} <span className="text-gray-400 font-normal text-xs">{f.unit}</span></span>
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
                  onClick={() => setSelectedPrediction(null)}
                  className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-400 text-center">
                {formatDate(selectedPrediction.createdAt).replace(/,/g, ' -')} - ID: {selectedPrediction.patientIdentifier || selectedPrediction.id}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading history...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
