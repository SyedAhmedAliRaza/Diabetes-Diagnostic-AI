"use client";

import { Activity, Users, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Clock, Search, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Types
interface OverviewData {
  summary: {
    totalPredictions: number;
    highRiskCount: number;
    lowRiskCount: number;
    avgConfidence: number;
  };
  recentActivity: Array<{
    id: string;
    patientIdentifier: string | null;
    predictionResult: number;
    confidenceScore: number;
    createdAt: string;
  }>;
  trendData: Array<{
    month: string;
    total: number;
    highRisk: number;
  }>;
}

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const res = await fetch("/api/overview");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p>Loading clinical insights...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4 text-red-500 bg-red-50 p-6 rounded-2xl border border-red-100">
          <AlertTriangle className="w-8 h-8" />
          <p className="font-medium">Failed to load overview data.</p>
        </div>
      </div>
    );
  }

  // Find recent high risk cases for action items
  const actionItems = data.recentActivity
    .filter(a => a.predictionResult === 1 && a.confidenceScore >= 0.5)
    .slice(0, 3);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clinical Overview</h1>
        <p className="text-gray-500 mt-1">High-level insights and recent diagnostic activity across all patients.</p>
      </div>

      {/* Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="inline-block text-center">
                <p className="text-sm font-medium text-gray-500">Total Predictions</p>
                <h3 className="text-2xl font-bold text-gray-900">{data.summary.totalPredictions.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span className="text-blue-600 font-medium">All time</span>
            <span className="text-gray-400">historical volume</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="inline-block text-center">
                <p className="text-sm font-medium text-gray-500">High Risk Identified</p>
                <h3 className="text-2xl font-bold text-gray-900">{data.summary.highRiskCount.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span className="text-red-600 font-medium">Elevated risk</span>
            <span className="text-gray-400">cases flagged</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="inline-block text-center">
                <p className="text-sm font-medium text-gray-500">Low Risk Cleared</p>
                <h3 className="text-2xl font-bold text-gray-900">{data.summary.lowRiskCount.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span className="text-green-600 font-medium">Negative risk</span>
            <span className="text-gray-400">cases cleared</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="inline-block text-center">
                <p className="text-sm font-medium text-gray-500">Avg Confidence</p>
                <h3 className="text-2xl font-bold text-gray-900">{(data.summary.avgConfidence * 100).toFixed(1)}%</h3>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <span className="text-purple-600 font-medium">Model accuracy</span>
            <span className="text-gray-400">across network</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Long-Term Trend Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Risk Progress & Diagnostic Volume</h2>
              <p className="text-sm text-gray-500 mt-1">6-month trend analysis</p>
            </div>
          </div>
          <div className="p-6 h-[350px]">
            {data.trendData.length > 0 && data.trendData.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4A90E2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="total" name="Total Diagnostics" stroke="#4A90E2" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="highRisk" name="High Risk Cases" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorHighRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                Not enough data yet for trend analysis.
              </div>
            )}
          </div>
        </div>

        {/* Action Items Sidebar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Clinical Action Items</h2>
            <p className="text-sm text-gray-500 mt-1">Requires attention</p>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {actionItems.length > 0 ? (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-red-100 bg-red-50/50 flex items-start gap-3">
                    <div className="mt-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Urgent Follow-up: {item.patientIdentifier || `#${item.id.slice(0, 6)}`}</p>
                      <p className="text-xs text-gray-600 mt-1">High risk diagnostic returned ({(item.confidenceScore * 100).toFixed(1)}% confidence). Schedule consultation.</p>
                      <button onClick={() => router.push("/history")} className="text-xs font-semibold text-red-600 hover:text-red-700 mt-2 inline-block cursor-pointer text-left">
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-gray-400 text-center">No urgent action items.<br />All high-risk cases resolved.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Patient Activity</h2>
            <p className="text-sm text-gray-500 mt-1">Latest diagnostics run across the platform</p>
          </div>
          <button onClick={() => router.push("/history")} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">Patient ID</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">Risk Prediction</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-xs">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((act) => {
                  const isHighRisk = act.predictionResult === 1;
                  const confidence = Math.round(act.confidenceScore * 100);

                  return (
                    <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-medium text-gray-900">{act.patientIdentifier || `#${act.id.slice(0, 6)}`}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatDate(act.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isHighRisk ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                          }`}>
                          {isHighRisk ? "High Risk" : "Low Risk"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                            <div
                              className={`h-full rounded-full ${isHighRisk ? "bg-red-500" : "bg-green-500"
                                }`}
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
