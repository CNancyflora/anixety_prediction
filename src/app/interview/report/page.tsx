"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain, TrendingUp, Heart, Mic, Eye, MessageSquare,
  CheckCircle2, AlertCircle, Sparkles, ArrowRight,
  Star, Target, BarChart2, Clock, Video
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

interface Report {
  id: number;
  date: string;
  time: string;
  role: string;
  difficulty: string;
  numQuestions: number;
  duration: string;
  confidence: number;
  stress: number;
  voiceClarity: number;
  eyeContact: number;
  communication: number;
  anxietyLabel: string;
  questions: string[];
}

const STRENGTHS: Record<string, string[]> = {
  hr: [
    "Structured and clear communication throughout the session.",
    "Demonstrated empathy and active listening skills.",
    "Maintained professional tone and positive body language.",
  ],
  technical: [
    "Logically structured technical explanations.",
    "Showed strong problem-solving approach.",
    "Confident delivery during complex answer segments.",
  ],
  behavioral: [
    "Provided specific, example-driven answers.",
    "Maintained composure under pressure.",
    "Demonstrated strong self-awareness and reflection.",
  ],
};

const IMPROVEMENTS: Record<string, string[]> = {
  hr: [
    "Include more quantifiable achievements in your answers.",
    "Reduce filler words (um, uh, like) for a more polished delivery.",
    "Maintain slightly more eye contact with the camera.",
  ],
  technical: [
    "Explain your reasoning before jumping to solutions.",
    "Slow down slightly when covering complex technical details.",
    "Summarise your answer with a concise conclusion.",
  ],
  behavioral: [
    "Use the full STAR format consistently across all answers.",
    "Add more context about the business impact of your actions.",
    "Vary your pacing to emphasise key points.",
  ],
};

const RECOMMENDATIONS = [
  "Practice the STAR method daily with a timer set to 2 minutes per answer.",
  "Record yourself answering questions and review your posture and tone.",
  "Complete the Breathing & Relaxation module before your next session.",
  "Focus on eliminating filler words — try pausing silently instead.",
  "Run two more mock interviews this week to build consistency.",
];

function ScoreRing({ value, color, size = 100 }: { value: number; color: string; size?: number }) {
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={7} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
    </svg>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
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
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("calmhire_last_report");
    if (saved) {
      setReport(JSON.parse(saved));
    } else {
      router.push("/interview");
    }
  }, [router]);

  if (!report) {
    return (
      <div className="min-h-screen bg-[#080c16] flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading report…</div>
      </div>
    );
  }

  const anxietyColor =
    report.anxietyLabel === "Low" ? "#34d399"
    : report.anxietyLabel === "Medium" ? "#fbbf24"
    : "#f87171";

  const overallScore = Math.round(
    (report.confidence + report.voiceClarity + report.eyeContact + report.communication) / 4
  );

  const role = report.role as keyof typeof STRENGTHS;
  const strengths = STRENGTHS[role] || STRENGTHS.hr;
  const improvements = IMPROVEMENTS[role] || IMPROVEMENTS.hr;

  const motivationMap: Record<string, string> = {
    Low: "Outstanding composure! You showed real readiness for a live interview. Keep this momentum going.",
    Medium: "Good effort! A little more practice with breathing and pacing will take you to the next level.",
    High: "Every expert was once a beginner. Each session builds your resilience — keep showing up.",
  };
  const motivation = motivationMap[report.anxietyLabel] || motivationMap.Low;

  return (
    <div className="min-h-screen bg-[#080c16] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:pl-72">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
              <Brain size={14} /> AI Interview Analysis
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Interview Report</h1>
                <p className="text-slate-400 mt-1 text-sm">
                  {report.date} · {report.time} · {report.role.charAt(0).toUpperCase() + report.role.slice(1)} Interview ·&nbsp;
                  <span className="capitalize">{report.difficulty}</span> · {report.numQuestions} questions · {report.duration}
                </p>
              </div>
              <Link href="/interview"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                New Interview <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Overall Score + Anxiety */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">

            {/* Overall ring */}
            <div className="sm:col-span-1 glass rounded-[28px] p-8 border border-white/5 flex flex-col items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Overall Score</p>
              <div className="relative">
                <ScoreRing value={overallScore} color="#3b82f6" size={110} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-black text-white">{overallScore}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">/ 100</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {overallScore >= 85 ? "Excellent" : overallScore >= 70 ? "Good" : "Developing"}
              </p>
            </div>

            {/* Anxiety level */}
            <div className="glass rounded-[28px] p-8 border border-white/5 flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Heart size={14} /> Anxiety Level
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black" style={{ color: anxietyColor }}>
                  {report.anxietyLabel}
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: anxietyColor }}
                  initial={{ width: 0 }}
                  animate={{ width: report.anxietyLabel === "Low" ? "28%" : report.anxietyLabel === "Medium" ? "58%" : "85%" }}
                  transition={{ duration: 1 }} />
              </div>
              <p className="text-xs text-slate-500">
                {report.anxietyLabel === "Low" ? "Calm and composed throughout." :
                  report.anxietyLabel === "Medium" ? "Mild stress detected — manageable." :
                  "Elevated stress detected — practice recommended."}
              </p>
            </div>

            {/* Session meta */}
            <div className="glass rounded-[28px] p-8 border border-white/5 flex flex-col gap-4 justify-center">
              {[
                { icon: Clock, label: "Duration", value: report.duration },
                { icon: Target, label: "Questions", value: `${report.numQuestions} answered` },
                { icon: Video, label: "Mode", value: `${report.role.charAt(0).toUpperCase() + report.role.slice(1)} · ${report.difficulty.charAt(0).toUpperCase() + report.difficulty.slice(1)}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                    <Icon size={15} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-bold text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Score breakdown */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

            {/* Bar scores */}
            <div className="glass rounded-[28px] p-8 border border-white/5">
              <h2 className="font-bold mb-6 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-400" /> Performance Scores
              </h2>
              <div className="space-y-5">
                <StatBar label="Confidence Score" value={report.confidence} color="#3b82f6" />
                <StatBar label="Voice Clarity" value={report.voiceClarity} color="#10b981" />
                <StatBar label="Eye Contact" value={report.eyeContact} color="#8b5cf6" />
                <StatBar label="Communication" value={report.communication} color="#f59e0b" />
                <StatBar label="Stress Control" value={100 - report.stress} color="#06b6d4" />
              </div>
            </div>

            {/* Score rings row */}
            <div className="glass rounded-[28px] p-8 border border-white/5">
              <h2 className="font-bold mb-6 flex items-center gap-2">
                <Sparkles size={18} className="text-violet-400" /> AI Behavioural Analysis
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Confidence", value: report.confidence, color: "#3b82f6", icon: TrendingUp },
                  { label: "Voice Clarity", value: report.voiceClarity, color: "#10b981", icon: Mic },
                  { label: "Eye Contact", value: report.eyeContact, color: "#8b5cf6", icon: Eye },
                  { label: "Communication", value: report.communication, color: "#f59e0b", icon: MessageSquare },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <ScoreRing value={value} color={color} size={78} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon size={16} style={{ color }} />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 text-center">{label}</p>
                    <p className="text-sm font-black text-white">{value}%</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Strengths & Improvements */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

            <div className="glass rounded-[28px] p-8 border border-emerald-500/10">
              <h2 className="font-bold mb-5 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={18} /> Strengths
              </h2>
              <div className="space-y-3">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                    <Star size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-300 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[28px] p-8 border border-amber-500/10">
              <h2 className="font-bold mb-5 flex items-center gap-2 text-amber-400">
                <AlertCircle size={18} /> Areas for Improvement
              </h2>
              <div className="space-y-3">
                {improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                    <Target size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-300 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            className="glass rounded-[28px] p-8 border border-blue-500/10 mb-8">
            <h2 className="font-bold mb-5 flex items-center gap-2 text-blue-400">
              <Sparkles size={18} /> Personalised Recommendations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RECOMMENDATIONS.map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                  <span className="text-[11px] font-black text-blue-400 bg-blue-500/10 rounded-lg px-2 py-0.5 flex-shrink-0 mt-0.5">
                    0{i + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Motivation message */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            className="glass rounded-[28px] p-8 border border-white/5 bg-gradient-to-br from-blue-600/10 to-violet-600/5 flex flex-col sm:flex-row items-center gap-6 mb-8">
            <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-xl">
              <Brain size={30} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">AI Motivation</p>
              <p className="text-base font-semibold text-slate-100 leading-relaxed">{motivation}</p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
            className="flex flex-col sm:flex-row gap-4">
            <Link href="/history"
              className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-center hover:bg-white/10 transition-all text-sm">
              View Interview History
            </Link>
            <Link href="/coach"
              className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-center hover:bg-white/10 transition-all text-sm">
              Go to AI Training
            </Link>
            <Link href="/interview"
              className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-center transition-all shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 text-sm flex items-center justify-center gap-2">
              Start New Interview <ArrowRight size={16} />
            </Link>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
