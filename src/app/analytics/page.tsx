"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, Target, Zap, Eye, Mic, Brain,
  Sparkles, ArrowUpRight, ArrowDownRight,
  BarChart2, Video, ChevronRight, Activity,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface HistoryEntry {
  id: number;
  date: string;
  time: string;
  type: string;
  anxiety: string;
  confidence: number;
  stress: number;
  voiceClarity?: number;
  eyeContact?: number;
  communication?: number;
  duration: string;
}

interface DerivedStats {
  totalInterviews: number;
  avgConfidence: number;
  avgStress: number;
  avgVoice: number;
  avgEye: number;
  avgComm: number;
  anxietyBreakdown: { Low: number; Medium: number; High: number };
  trend: "up" | "down" | "flat";
  confidenceDelta: number;
  chartData: { label: string; confidence: number; stress: number; voice: number; eye: number; comm: number }[];
  weeklyData: { week: string; sessions: number; avgConf: number }[];
}

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 shadow-2xl text-xs">
      <p className="font-bold text-slate-300 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400 capitalize">{p.name}:</span>
          <span className="font-bold text-white">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

/* ── Derive stats from raw history ── */
function deriveStats(entries: HistoryEntry[]): DerivedStats {
  // Only mock interview entries
  const interviews = entries.filter(e => e.type.startsWith("Mock Interview"));
  const n = interviews.length;

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const avgConfidence = avg(interviews.map(e => e.confidence ?? 0));
  const avgStress = avg(interviews.map(e => e.stress ?? 0));
  const avgVoice = avg(interviews.map(e => e.voiceClarity ?? 0));
  const avgEye = avg(interviews.map(e => e.eyeContact ?? 0));
  const avgComm = avg(interviews.map(e => e.communication ?? 0));

  const anxietyBreakdown = { Low: 0, Medium: 0, High: 0 };
  interviews.forEach(e => {
    if (e.anxiety === "Low") anxietyBreakdown.Low++;
    else if (e.anxiety === "Medium") anxietyBreakdown.Medium++;
    else if (e.anxiety === "High") anxietyBreakdown.High++;
  });

  // Trend: compare latest vs earliest (if >= 2 sessions)
  let trend: "up" | "down" | "flat" = "flat";
  let confidenceDelta = 0;
  if (interviews.length >= 2) {
    const latest = interviews[0].confidence;
    const earliest = interviews[interviews.length - 1].confidence;
    confidenceDelta = latest - earliest;
    trend = confidenceDelta > 0 ? "up" : confidenceDelta < 0 ? "down" : "flat";
  }

  // Build chart data: show last 8 interviews in chronological order
  const chartData = [...interviews].reverse().slice(-8).map((e, i) => ({
    label: `#${i + 1}`,
    confidence: e.confidence ?? 0,
    stress: e.stress ?? 0,
    voice: e.voiceClarity ?? 0,
    eye: e.eyeContact ?? 0,
    comm: e.communication ?? 0,
  }));

  // Weekly data: group by ISO week
  const weekMap: Record<string, { sessions: number; confSum: number }> = {};
  interviews.forEach(e => {
    const d = new Date(e.date);
    const week = `W${getWeekNumber(d)}`;
    if (!weekMap[week]) weekMap[week] = { sessions: 0, confSum: 0 };
    weekMap[week].sessions++;
    weekMap[week].confSum += e.confidence ?? 0;
  });
  const weeklyData = Object.entries(weekMap).slice(-6).map(([week, v]) => ({
    week,
    sessions: v.sessions,
    avgConf: Math.round(v.confSum / v.sessions),
  }));

  return {
    totalInterviews: n,
    avgConfidence, avgStress, avgVoice, avgEye, avgComm,
    anxietyBreakdown, trend, confidenceDelta, chartData, weeklyData,
  };
}

function getWeekNumber(d: Date) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div className="relative mb-8">
        <div className="h-32 w-32 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/10">
          <BarChart2 size={52} />
        </div>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl"
        />
      </div>
      <h2 className="text-3xl font-black mb-3 tracking-tight">No Analytics Available</h2>
      <p className="text-slate-400 text-base mb-8 max-w-md mx-auto leading-relaxed">
        Complete your first assessment and mock interview to generate personalised performance analytics.
      </p>
      <Link
        href="/assessment"
        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
      >
        <Video size={18} /> Start Assessment <ChevronRight size={16} />
      </Link>
    </motion.div>
  );
}

/* ── Stat Card ── */
function StatCard({
  label, value, sub, icon: Icon, color, bg, delay = 0, trend, delta,
}: {
  label: string; value: string; sub: string;
  icon: any; color: string; bg: string;
  delay?: number; trend?: "up" | "down" | "flat"; delta?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-[28px] p-7 border border-white/5 hover:border-white/10 transition-colors group"
    >
      <div className="flex items-center justify-between mb-5">
        <div className={cn("rounded-2xl p-3 transition-transform group-hover:scale-110 shadow-lg", bg, color)}>
          <Icon size={22} />
        </div>
        {trend && delta !== undefined && delta !== 0 && (
          <span className={cn(
            "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
            trend === "up" ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
          )}>
            {trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function AnalyticsPage() {
  const [stats, setStats] = useState<DerivedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"confidence" | "stress" | "voice" | "eye" | "comm">("confidence");

  useEffect(() => {
    const raw = localStorage.getItem("calmhire_history");
    if (raw) {
      const parsed: HistoryEntry[] = JSON.parse(raw);
      const mockOnly = parsed.filter(e => e.type.startsWith("Mock Interview"));
      if (mockOnly.length > 0) {
        setStats(deriveStats(parsed));
      }
    }
    setLoading(false);
  }, []);

  const chartConfig: Record<string, { color: string; label: string }> = {
    confidence: { color: "#3b82f6", label: "Confidence" },
    stress:     { color: "#f87171", label: "Stress" },
    voice:      { color: "#10b981", label: "Voice Clarity" },
    eye:        { color: "#8b5cf6", label: "Eye Contact" },
    comm:       { color: "#f59e0b", label: "Communication" },
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Sidebar />
      <main className="flex-1 w-full lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
              <Activity size={14} /> Performance Analytics
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Your Progress</h1>
                <p className="text-slate-400 mt-1 text-sm">
                  Real-time insights generated from your completed mock interviews.
                </p>
              </div>
              {stats && (
                <div className="flex-shrink-0 glass rounded-2xl px-5 py-3 border border-white/5 flex items-center gap-3">
                  <Brain size={16} className="text-blue-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Interviews Analysed</p>
                    <p className="text-xl font-black text-white">{stats.totalInterviews}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.header>

          {loading ? null : !stats ? (
            <EmptyState />
          ) : (
            <>
              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
                <div className="xl:col-span-2">
                  <StatCard
                    label="Avg Confidence" value={`${stats.avgConfidence}%`}
                    sub="Across all sessions" icon={Zap}
                    color="text-blue-400" bg="bg-blue-400/10" delay={0}
                    trend={stats.trend} delta={stats.confidenceDelta}
                  />
                </div>
                <div className="xl:col-span-2">
                  <StatCard
                    label="Avg Voice Clarity" value={`${stats.avgVoice || "—"}%`}
                    sub="Speech projection & pace" icon={Mic}
                    color="text-emerald-400" bg="bg-emerald-400/10" delay={0.06}
                  />
                </div>
                <div className="xl:col-span-2">
                  <StatCard
                    label="Avg Eye Contact" value={`${stats.avgEye || "—"}%`}
                    sub="Camera-facing consistency" icon={Eye}
                    color="text-violet-400" bg="bg-violet-400/10" delay={0.12}
                  />
                </div>
                <div className="xl:col-span-2">
                  <StatCard
                    label="Avg Communication" value={`${stats.avgComm || "—"}%`}
                    sub="Verbal clarity & tone" icon={Brain}
                    color="text-amber-400" bg="bg-amber-400/10" delay={0.18}
                  />
                </div>
                <div className="xl:col-span-2">
                  <StatCard
                    label="Avg Stress Score" value={`${stats.avgStress}%`}
                    sub="Lower is better" icon={TrendingUp}
                    color="text-rose-400" bg="bg-rose-400/10" delay={0.24}
                  />
                </div>
                <div className="xl:col-span-2">
                  <StatCard
                    label="Sessions Completed" value={`${stats.totalInterviews}`}
                    sub="Total mock interviews" icon={Target}
                    color="text-cyan-400" bg="bg-cyan-400/10" delay={0.3}
                  />
                </div>
              </div>

              {/* ── Main Chart ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass rounded-[36px] p-8 border border-white/5 mb-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-bold mb-0.5">Performance Trend</h2>
                    <p className="text-xs text-slate-500">Last {stats.chartData.length} sessions · chronological order</p>
                  </div>
                  {/* Metric selector */}
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map(key => (
                      <button
                        key={key}
                        onClick={() => setActiveChart(key as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                          activeChart === key
                            ? "text-white border-transparent"
                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                        )}
                        style={activeChart === key ? { background: chartConfig[key].color + "33", borderColor: chartConfig[key].color + "55", color: chartConfig[key].color } : {}}
                      >
                        {chartConfig[key].label}
                      </button>
                    ))}
                  </div>
                </div>

                {stats.chartData.length < 2 ? (
                  <div className="h-[320px] flex flex-col items-center justify-center text-center">
                    <Sparkles size={28} className="text-slate-600 mb-3" />
                    <p className="text-slate-500 text-sm">Complete at least 2 mock interviews to view trend charts.</p>
                  </div>
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.chartData}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartConfig[activeChart].color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={chartConfig[activeChart].color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                        <XAxis dataKey="label" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                        <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dx={-8} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey={activeChart}
                          name={chartConfig[activeChart].label}
                          stroke={chartConfig[activeChart].color}
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#areaGrad)"
                          dot={{ fill: chartConfig[activeChart].color, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>

              {/* ── Bottom Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                {/* Anxiety Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42 }}
                  className="glass rounded-[32px] p-8 border border-white/5"
                >
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-rose-400" /> Anxiety Distribution
                  </h2>
                  <div className="space-y-5">
                    {[
                      { label: "Low Anxiety", count: stats.anxietyBreakdown.Low, color: "#34d399", bg: "bg-emerald-400/10" },
                      { label: "Medium Anxiety", count: stats.anxietyBreakdown.Medium, color: "#fbbf24", bg: "bg-amber-400/10" },
                      { label: "High Anxiety", count: stats.anxietyBreakdown.High, color: "#f87171", bg: "bg-rose-400/10" },
                    ].map(({ label, count, color, bg }) => {
                      const pct = stats.totalInterviews ? Math.round((count / stats.totalInterviews) * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                              <span className="text-slate-300 font-medium">{label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 text-xs">{count} session{count !== 1 ? "s" : ""}</span>
                              <span className="font-bold text-white">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Weekly Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.48 }}
                  className="glass rounded-[32px] p-8 border border-white/5"
                >
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <BarChart2 size={18} className="text-blue-400" /> Weekly Sessions
                  </h2>
                  {stats.weeklyData.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <p className="text-slate-500 text-sm">No weekly data yet.</p>
                    </div>
                  ) : (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.weeklyData} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                          <XAxis dataKey="week" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dx={-4} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="sessions" name="Sessions" radius={[8, 8, 0, 0]}>
                            {stats.weeklyData.map((_, i) => (
                              <Cell key={i} fill="#3b82f6" fillOpacity={0.7 + i * 0.05} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* ── All-metrics bar ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.54 }}
                className="glass rounded-[32px] p-8 border border-white/5 mb-8"
              >
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Sparkles size={18} className="text-violet-400" /> Average Performance Scores
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { label: "Confidence", value: stats.avgConfidence, color: "#3b82f6" },
                    { label: "Voice Clarity", value: stats.avgVoice || 0, color: "#10b981" },
                    { label: "Eye Contact", value: stats.avgEye || 0, color: "#8b5cf6" },
                    { label: "Communication", value: stats.avgComm || 0, color: "#f59e0b" },
                    { label: "Stress Control", value: 100 - stats.avgStress, color: "#06b6d4" },
                  ].map(({ label, value, color }, i) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400 font-medium">{label}</span>
                        <span className="font-bold text-white">{value}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ── AI insight box ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-[32px] p-7 border border-blue-500/15 bg-gradient-to-br from-blue-600/5 to-violet-600/5 flex items-start gap-5"
              >
                <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-xl">
                  <Brain size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">AI Summary</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {stats.trend === "up"
                      ? `Your confidence has improved by ${stats.confidenceDelta}% since your first session. Keep up the momentum — consistent practice is building measurable results.`
                      : stats.trend === "down"
                      ? `Your confidence has dipped by ${Math.abs(stats.confidenceDelta)}% recently. Try revisiting the AI Training modules and focus on breathing exercises before your next session.`
                      : `Your performance is consistent across sessions. Focus on voice clarity and eye contact to push your scores higher.`}
                    {` You've completed ${stats.totalInterviews} mock interview${stats.totalInterviews !== 1 ? "s" : ""}.`}
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
