"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Eye, 
  Mic, 
  Calendar,
  ChevronDown,
  Info,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

const weeklyData = [
  { day: "Mon", anxiety: 65, confidence: 45, stress: 70 },
  { day: "Tue", anxiety: 58, confidence: 52, stress: 62 },
  { day: "Wed", anxiety: 45, confidence: 60, stress: 50 },
  { day: "Thu", anxiety: 40, confidence: 75, stress: 42 },
  { day: "Fri", anxiety: 32, confidence: 82, stress: 35 },
  { day: "Sat", anxiety: 28, confidence: 88, stress: 30 },
  { day: "Sun", anxiety: 25, confidence: 90, stress: 25 },
];

const performanceMetrics = [
  { name: "Eye Contact", score: 85, color: "#3B82F6" },
  { name: "Voice Tone", score: 78, color: "#8B5CF6" },
  { name: "Body Language", score: 92, color: "#10B981" },
  { name: "Speech Rate", score: 70, color: "#F59E0B" },
  { name: "Confidence", score: 88, color: "#EC4899" },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("Weekly");
  const [chartData, setChartData] = useState(weeklyData);
  const [metrics, setMetrics] = useState(performanceMetrics);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    stress: "88%",
    eyeContact: "92%",
    voice: "75%",
    goal: "64%"
  });

  useEffect(() => {
    const savedHistory = localStorage.getItem("calmhire_history");
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      if (history.length > 0) {
        setHasData(true);
        // Calculate average metrics from history
        const avgConfidence = Math.round(history.reduce((acc: number, s: any) => acc + (s.confidence || 0), 0) / history.length);
        const avgStress = Math.round(history.reduce((acc: number, s: any) => acc + (s.stress || 0), 0) / history.length);
        
        // Update metrics display
        const newMetrics = [...performanceMetrics];
        newMetrics[4].score = avgConfidence;
        setMetrics(newMetrics);
        
        // Update summary stats
        setSummaryStats({
          stress: `${100 - avgStress}%`,
          eyeContact: "92%", // Keeping some placeholders for now as we don't track all details yet
          voice: "85%",
          goal: `${Math.min(100, history.length * 10)}%`
        });
      } else {
        setHasData(false);
      }
    } else {
      setHasData(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Sidebar />

      <main className="flex-1 w-full lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Performance Insights</h1>
              <p className="text-slate-400 mt-1">Deep-dive into your behavioral growth and AI analytics.</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5">
              <Calendar size={18} className="text-slate-500" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer pr-2"
              >
                <option value="Weekly">Last 7 Days</option>
                <option value="Monthly">Last 30 Days</option>
                <option value="Yearly">Yearly Progress</option>
              </select>
            </div>
          </header>

          {hasData === false ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="h-32 w-32 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 mb-8 border border-blue-600/20 shadow-lg shadow-blue-500/10">
                <Target size={48} />
              </div>
              <h3 className="text-3xl font-black mb-3">No Analytics Available Yet</h3>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Complete an interview session to generate performance insights.
              </p>
            </motion.div>
          ) : hasData === true ? (
            <>
          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Growth Overview */}
            <div className="lg:col-span-2 glass rounded-[40px] p-8 border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    Growth Trends
                  </h3>
                  <p className="text-sm text-slate-500">Anxiety vs. Confidence improvement</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confidence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Anxiety</span>
                  </div>
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAnxiety" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px" }}
                      itemStyle={{ fontWeight: "bold" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#3B82F6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorConfidence)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="anxiety" 
                      stroke="#10B981" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorAnxiety)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="glass rounded-[40px] p-8 border border-white/10">
              <h3 className="text-xl font-bold mb-8">Performance Scores</h3>
              <div className="space-y-8">
                {metrics.map((metric, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-300">{metric.name}</span>
                      <span className="text-sm font-black" style={{ color: metric.color }}>{metric.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.score}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: metric.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 rounded-3xl bg-blue-600/10 border border-blue-600/20 p-6">
                <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                  <Sparkles size={18} />
                  <span className="text-sm uppercase tracking-widest">AI Insight</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "Your body language has improved by 15% this week. Maintaining this level will boost your interviewer trust score significantly."
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Stress Control", value: summaryStats.stress, icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
              { label: "Eye Contact", value: summaryStats.eyeContact, icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: "Voice Clarity", value: summaryStats.voice, icon: Mic, color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { label: "Goal Progress", value: summaryStats.goal, icon: Target, color: "text-purple-400", bg: "bg-purple-400/10" },
            ].map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="glass rounded-[32px] p-8 border border-white/5"
              >
                <div className={cn("mb-6 flex h-14 w-14 items-center justify-center rounded-2xl", card.bg, card.color)}>
                  <card.icon size={24} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{card.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black">{card.value}</span>
                  <ArrowUpRight className="text-emerald-500" size={20} />
                </div>
              </motion.div>
            ))}
          </div>
          </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
