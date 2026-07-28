"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Calendar, Clock, ChevronRight, X,
  Video, History as HistoryIcon, Brain, Mic, Eye,
  MessageSquare, TrendingUp, Heart, Star, AlertCircle,
  CheckCircle2, Sparkles, ArrowRight, BarChart2, Target,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface Session {
  id: number;
  date: string;
  time: string;
  type: string;
  anxiety: string;
  confidence: number;
  stress: number;
  duration: string;
  voiceClarity?: number;
  eyeContact?: number;
  communication?: number;
}

interface FullReport {
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
}

const STRENGTHS: Record<string, string[]> = {
  hr: ["Structured and clear communication.", "Demonstrated empathy and active listening.", "Maintained professional tone throughout."],
  technical: ["Logically structured technical explanations.", "Strong problem-solving approach.", "Confident delivery on complex segments."],
  behavioral: ["Specific, example-driven answers.", "Composure maintained under pressure.", "Strong self-awareness and reflection."],
};
const IMPROVEMENTS: Record<string, string[]> = {
  hr: ["Add more quantifiable achievements.", "Reduce filler words for polished delivery.", "Maintain more eye contact with the camera."],
  technical: ["Explain reasoning before jumping to solutions.", "Slow down on complex technical details.", "Summarise answers with a concise conclusion."],
  behavioral: ["Use the full STAR format consistently.", "Add business impact context to answers.", "Vary pacing to emphasise key points."],
};
const MOTIVATION: Record<string, string> = {
  Low: "Outstanding composure! You showed real readiness for a live interview. Keep this momentum going.",
  Medium: "Good effort! A little more practice with breathing and pacing will take you to the next level.",
  High: "Every expert was once a beginner. Each session builds your resilience — keep showing up.",
};

function anxietyColor(a: string) {
  return a === "Low" ? "#34d399" : a === "Medium" ? "#fbbf24" : "#f87171";
}
function anxietyBg(a: string) {
  return a === "Low" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : a === "Medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-bold text-white">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
      </div>
    </div>
  );
}

/* ── Report Modal ── */
function ReportModal({ session, report, onClose }: { session: Session; report: FullReport | null; onClose: () => void }) {
  const role = report?.role ?? "hr";
  const strengths = STRENGTHS[role] ?? STRENGTHS.hr;
  const improvements = IMPROVEMENTS[role] ?? IMPROVEMENTS.hr;
  const motivation = MOTIVATION[session.anxiety] ?? MOTIVATION.Low;
  const overall = report
    ? Math.round((report.confidence + report.voiceClarity + report.eyeContact + report.communication) / 4)
    : session.confidence;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        onClick={e => e.stopPropagation()}
        className="glass max-w-2xl w-full rounded-[36px] border border-white/10 overflow-y-auto max-h-[90vh] relative"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#080c16]/90 backdrop-blur-xl px-8 pt-8 pb-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Brain size={13} /> AI Interview Report
            </div>
            <h2 className="text-2xl font-black">{session.type}</h2>
            <p className="text-slate-500 text-sm">{session.date} · {session.time} · {session.duration}</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-7 space-y-6">
          {/* Score row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Overall Score</p>
              <p className="text-3xl font-black text-white">{overall}<span className="text-slate-500 text-sm font-semibold">/100</span></p>
              <p className="text-xs text-slate-500 mt-0.5">{overall >= 85 ? "Excellent" : overall >= 70 ? "Good" : "Developing"}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Anxiety Level</p>
              <p className="text-3xl font-black" style={{ color: anxietyColor(session.anxiety) }}>{session.anxiety}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {session.anxiety === "Low" ? "Calm and composed." : session.anxiety === "Medium" ? "Mild stress detected." : "Elevated stress detected."}
              </p>
            </div>
          </div>

          {/* Performance bars */}
          <div className="rounded-2xl bg-white/5 border border-white/5 p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-sm mb-2"><BarChart2 size={16} className="text-blue-400" /> Performance Scores</h3>
            <ScoreBar label="Confidence" value={session.confidence} color="#3b82f6" />
            <ScoreBar label="Voice Clarity" value={session.voiceClarity ?? 0} color="#10b981" />
            <ScoreBar label="Eye Contact" value={session.eyeContact ?? 0} color="#8b5cf6" />
            <ScoreBar label="Communication" value={session.communication ?? 0} color="#f59e0b" />
            <ScoreBar label="Stress Control" value={100 - session.stress} color="#06b6d4" />
          </div>

          {/* Behaviour & Voice */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><Mic size={11} /> Voice Analysis</p>
              <p className="text-2xl font-black text-emerald-400">{session.voiceClarity ?? "—"}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Clarity & projection</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><Eye size={11} /> Eye Contact</p>
              <p className="text-2xl font-black text-violet-400">{session.eyeContact ?? "—"}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Camera-facing score</p>
            </div>
          </div>

          {/* Strengths */}
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/15 p-6">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2 mb-4 text-sm"><CheckCircle2 size={15} /> Strengths</h3>
            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Star size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-300">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/15 p-6">
            <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-4 text-sm"><AlertCircle size={15} /> Areas for Improvement</h3>
            <div className="space-y-2">
              {improvements.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Target size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-300">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="rounded-2xl bg-blue-500/5 border border-blue-500/15 p-6">
            <h3 className="font-bold text-blue-400 flex items-center gap-2 mb-4 text-sm"><Sparkles size={15} /> AI Suggestions</h3>
            <div className="space-y-2">
              {["Practice the STAR method with a 2-minute timer per answer.",
                "Record yourself and review posture and tone.",
                "Focus on eliminating filler words — pause silently instead.",
                "Run 2 more mock interviews this week for consistency."].map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 rounded px-1.5 py-0.5 flex-shrink-0">0{i + 1}</span>
                  <p className="text-sm text-slate-300">{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600/10 to-violet-600/5 border border-blue-500/10 p-6 flex items-start gap-4">
            <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <Brain size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">AI Motivation</p>
              <p className="text-sm text-slate-300 leading-relaxed">{motivation}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <Link href="/interview" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-center shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
              <Video size={15} /> New Interview <ArrowRight size={14} />
            </Link>
            <Link href="/coach" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 font-bold text-sm text-center hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Sparkles size={15} /> AI Training
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Page ── */
export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reports, setReports] = useState<Record<string, FullReport>>({});
  const [search, setSearch] = useState("");
  const [anxietyFilter, setAnxietyFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "confidence" | "anxiety">("date");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("calmhire_history");
    const rawReports = localStorage.getItem("calmhire_reports");
    const all: Session[] = raw ? JSON.parse(raw) : [];
    // Only show mock interview sessions (not training entries)
    setSessions(all.filter(s => s.type.startsWith("Mock Interview")));
    setReports(rawReports ? JSON.parse(rawReports) : {});
    setLoaded(true);
  }, []);

  const filtered = useMemo(() => {
    let list = [...sessions];
    if (search) list = list.filter(s => s.type.toLowerCase().includes(search.toLowerCase()) || s.date.includes(search));
    if (anxietyFilter !== "All") list = list.filter(s => s.anxiety === anxietyFilter);
    if (sortBy === "confidence") list.sort((a, b) => b.confidence - a.confidence);
    else if (sortBy === "anxiety") {
      const rank = { Low: 0, Medium: 1, High: 2 };
      list.sort((a, b) => rank[a.anxiety as keyof typeof rank] - rank[b.anxiety as keyof typeof rank]);
    }
    // default: already newest-first from localStorage
    return list;
  }, [sessions, search, anxietyFilter, sortBy]);

  const avgConf = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.confidence, 0) / sessions.length) : 0;
  const bestConf = sessions.length ? Math.max(...sessions.map(s => s.confidence)) : 0;
  const lowAnxiety = sessions.filter(s => s.anxiety === "Low").length;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Sidebar />
      <main className="flex-1 w-full lg:pl-72">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">

          {/* Header */}
          <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
              <HistoryIcon size={13} /> Interview History
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Session History</h1>
                <p className="text-slate-400 mt-1 text-sm">Review your past performances and AI feedback.</p>
              </div>
              {sessions.length > 0 && (
                <Link href="/interview"
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-sm shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95">
                  <Video size={16} /> New Interview
                </Link>
              )}
            </div>
          </motion.header>

          {/* Summary cards */}
          {sessions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Interviews", value: sessions.length.toString(), color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Avg Confidence", value: `${avgConf}%`, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                { label: "Low Anxiety Sessions", value: `${lowAnxiety}`, color: "text-violet-400", bg: "bg-violet-400/10" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="glass rounded-[24px] p-6 border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                  <p className={cn("text-3xl font-black", color)}>{value}</p>
                </div>
              ))}
            </motion.div>
          )}

          {!loaded ? null : sessions.length === 0 ? (
            /* ── Empty State ── */
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-28 text-center">
              <div className="relative mb-8">
                <div className="h-32 w-32 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/10">
                  <HistoryIcon size={52} />
                </div>
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl" />
              </div>
              <h2 className="text-3xl font-black mb-3 tracking-tight">No Interview History</h2>
              <p className="text-slate-400 text-base mb-8 max-w-md mx-auto leading-relaxed">
                You haven't completed any interviews yet. Complete your first mock interview to start tracking your progress.
              </p>
              <Link href="/interview"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95">
                <Video size={18} /> Start Mock Interview <ChevronRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <>
              {/* ── Search / Filter / Sort ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input type="text" placeholder="Search by type or date…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-colors" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                  <Filter size={15} className="text-slate-500" />
                  <select value={anxietyFilter} onChange={e => setAnxietyFilter(e.target.value)}
                    className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer">
                    <option value="All">All Anxiety</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                  <TrendingUp size={15} className="text-slate-500" />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                    className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer">
                    <option value="date">Sort: Newest</option>
                    <option value="confidence">Sort: Confidence</option>
                    <option value="anxiety">Sort: Anxiety</option>
                  </select>
                </div>
              </motion.div>

              {/* ── Session Timeline ── */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-slate-600 mb-4">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No sessions found</h3>
                  <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[27px] top-0 bottom-0 w-px bg-white/5 hidden sm:block" />

                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {filtered.map((session, i) => (
                        <motion.div key={session.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-5 group"
                        >
                          {/* Timeline dot */}
                          <div className="hidden sm:flex flex-col items-center pt-5 flex-shrink-0">
                            <div className={cn(
                              "h-[14px] w-[14px] rounded-full border-2 flex-shrink-0 transition-all group-hover:scale-125",
                              session.anxiety === "Low" ? "border-emerald-400 bg-emerald-400/20"
                                : session.anxiety === "Medium" ? "border-amber-400 bg-amber-400/20"
                                : "border-rose-400 bg-rose-400/20"
                            )} />
                          </div>

                          {/* Card */}
                          <div className="flex-1 glass rounded-[28px] border border-white/5 hover:border-blue-500/25 hover:bg-blue-500/[0.03] transition-all p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                              {/* Left: meta */}
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  <Video size={20} />
                                </div>
                                <div>
                                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{session.type}</h3>
                                  <div className="flex items-center gap-3 mt-0.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Calendar size={10} /> {session.date}</span>
                                    <span className="flex items-center gap-1"><Clock size={10} /> {session.time}</span>
                                    <span>{session.duration}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Middle: scores */}
                              <div className="flex flex-wrap items-center gap-5">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Anxiety</p>
                                  <span className={cn("text-xs font-black px-2.5 py-1 rounded-full border", anxietyBg(session.anxiety))}>
                                    {session.anxiety}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Confidence</p>
                                  <p className="text-sm font-black text-blue-400">{session.confidence}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Communication</p>
                                  <p className="text-sm font-black text-amber-400">{session.communication ?? "—"}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Overall</p>
                                  <p className="text-sm font-black text-white">
                                    {session.voiceClarity
                                      ? Math.round((session.confidence + session.voiceClarity + (session.eyeContact ?? 0) + (session.communication ?? 0)) / 4)
                                      : session.confidence}%
                                  </p>
                                </div>
                              </div>

                              {/* Right: View Report */}
                              <button onClick={() => setSelectedSession(session)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white font-bold text-xs transition-all hover:scale-[1.02] active:scale-95 flex-shrink-0">
                                View Report <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {selectedSession && (
          <ReportModal
            session={selectedSession}
            report={reports[String(selectedSession.id)] ?? null}
            onClose={() => setSelectedSession(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
