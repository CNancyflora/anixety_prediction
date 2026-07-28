"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles, Mic, Eye, MessageSquare, BookOpen,
  Users, Lock, CheckCircle2, PlayCircle, ChevronRight,
  Brain, ArrowRight, Clock, BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

/* ─── Module definitions (ordered) ─── */
const MODULES = [
  {
    id: "self-intro",
    title: "Self Introduction Practice",
    description: "Craft and rehearse a compelling personal introduction that sets the right first impression.",
    duration: "5–8 min",
    icon: Users,
    accent: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-blue-500/10" },
  },
  {
    id: "communication",
    title: "Communication Skills",
    description: "Strengthen verbal clarity, active listening, and professional tone through guided exercises.",
    duration: "8–12 min",
    icon: BookOpen,
    accent: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
  },
  {
    id: "voice-pronunciation",
    title: "Voice & Pronunciation Practice",
    description: "Improve articulation, pace, and vocal projection so every word lands with authority.",
    duration: "5–10 min",
    icon: Mic,
    accent: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
  },
  {
    id: "eye-contact",
    title: "Eye Contact Practice",
    description: "Build the habit of natural, confident eye contact during camera-facing interviews.",
    duration: "5–8 min",
    icon: Eye,
    accent: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "shadow-cyan-500/10" },
  },
  {
    id: "hr-interview",
    title: "HR Interview Practice",
    description: "Practise common behavioural HR questions using the STAR method for structured answers.",
    duration: "10–15 min",
    icon: MessageSquare,
    accent: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "shadow-violet-500/10" },
  },
  {
    id: "technical-interview",
    title: "Technical Interview Practice",
    description: "Work through domain-specific questions and articulate your thought process clearly.",
    duration: "15–20 min",
    icon: Brain,
    accent: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-rose-500/10" },
  },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];
type SessionState = "idle" | "practicing" | "done";
const STORAGE_KEY = "calmhire_training_completed";

/* ─── helpers ─── */
function loadCompleted(): ModuleId[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveCompleted(ids: ModuleId[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export default function CoachPage() {
  const [completed, setCompleted] = useState<ModuleId[]>([]);
  const [activeId, setActiveId] = useState<ModuleId | null>(null);
  const [session, setSession] = useState<SessionState>("idle");
  const [timeLeft, setTimeLeft] = useState(60);
  const [newlyUnlocked, setNewlyUnlocked] = useState<ModuleId | null>(null);

  /* Load from storage */
  useEffect(() => { setCompleted(loadCompleted()); }, []);

  /* Timer */
  useEffect(() => {
    if (session !== "practicing") return;
    if (timeLeft <= 0) { finishSession(); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [session, timeLeft]);

  const isCompleted = (id: ModuleId) => completed.includes(id);
  const isLocked = (index: number) => index > 0 && !isCompleted(MODULES[index - 1].id);
  const allDone = MODULES.every(m => completed.includes(m.id));

  const startModule = (id: ModuleId) => {
    setActiveId(id);
    setSession("practicing");
    setTimeLeft(60);
  };

  const finishSession = () => {
    if (!activeId) return;
    const alreadyDone = completed.includes(activeId);
    if (!alreadyDone) {
      const updated = [...completed, activeId] as ModuleId[];
      setCompleted(updated);
      saveCompleted(updated);

      // Find next module to mark as newly unlocked
      const idx = MODULES.findIndex(m => m.id === activeId);
      if (idx < MODULES.length - 1) {
        setNewlyUnlocked(MODULES[idx + 1].id);
        setTimeout(() => setNewlyUnlocked(null), 3000);
      }

      // Save to history
      const mod = MODULES.find(m => m.id === activeId)!;
      const history = JSON.parse(localStorage.getItem("calmhire_history") || "[]");
      localStorage.setItem("calmhire_history", JSON.stringify([{
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: `Training: ${mod.title}`,
        status: "Completed",
        duration: mod.duration,
      }, ...history]));
    }
    setSession("done");
  };

  const resetToLibrary = () => {
    setActiveId(null);
    setSession("idle");
  };

  const fmt = (s: number) => `00:${String(s).padStart(2, "0")}`;
  const progressPct = Math.round((completed.length / MODULES.length) * 100);
  const activeModule = MODULES.find(m => m.id === activeId);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:pl-72">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
              <Sparkles size={14} /> AI Training Center
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Training Modules</h1>
                <p className="text-slate-400 mt-1 text-sm max-w-lg">
                  Complete each module in sequence to unlock the next. Finish all modules to access Mock Interview.
                </p>
              </div>
              {/* Progress pill */}
              <div className="flex-shrink-0 glass rounded-2xl px-6 py-4 border border-white/5 min-w-[180px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Training Progress</p>
                <p className="text-xl font-black text-white mb-2">
                  {completed.length}
                  <span className="text-slate-500 text-sm font-semibold"> / {MODULES.length} Modules</span>
                </p>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-blue-500 rounded-full"
                    animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6 }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{progressPct}% complete</p>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">

            {/* ══ MODULE GRID (idle) ══ */}
            {session === "idle" && (
              <motion.div key="grid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                <div className="flex flex-col gap-4 mb-10">
                  {MODULES.map((mod, index) => {
                    const locked = isLocked(index);
                    const done = isCompleted(mod.id);
                    const isNext = !locked && !done;
                    const Icon = mod.icon;
                    const isNewUnlock = newlyUnlocked === mod.id;

                    return (
                      <motion.div
                        key={mod.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        className={cn(
                          "relative glass rounded-[28px] border transition-all duration-300",
                          done && "border-emerald-500/20 bg-emerald-500/[0.03]",
                          isNext && !done && "border-blue-500/20",
                          locked && "border-white/5 opacity-70",
                          isNewUnlock && "ring-2 ring-blue-500/40"
                        )}
                      >
                        {/* Newly unlocked glow */}
                        {isNewUnlock && (
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2.5 }}
                            className="absolute inset-0 rounded-[28px] bg-blue-500/5 pointer-events-none"
                          />
                        )}

                        <div className="flex items-center gap-5 p-6">
                          {/* Step number */}
                          <div className={cn(
                            "flex-shrink-0 h-8 w-8 rounded-full border text-xs font-black flex items-center justify-center",
                            done ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                            : locked ? "bg-white/5 border-white/10 text-slate-600"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          )}>
                            {done ? <CheckCircle2 size={14} /> : locked ? <Lock size={12} /> : index + 1}
                          </div>

                          {/* Icon */}
                          <div className={cn(
                            "flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                            locked ? "bg-white/5 text-slate-600" : cn(mod.accent.bg, mod.accent.text)
                          )}>
                            <Icon size={22} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h3 className={cn("font-bold", locked ? "text-slate-500" : "text-white")}>
                                {mod.title}
                              </h3>
                              {done && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                  Completed
                                </span>
                              )}
                              {isNewUnlock && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                  className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                  Unlocked!
                                </motion.span>
                              )}
                            </div>
                            <p className={cn("text-xs leading-relaxed",
                              locked ? "text-slate-600" : "text-slate-400")}>
                              {locked
                                ? "This module will unlock after completing the previous training."
                                : mod.description}
                            </p>
                          </div>

                          {/* Duration */}
                          <div className="flex-shrink-0 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Clock size={11} />
                            {mod.duration}
                          </div>

                          {/* Action */}
                          <div className="flex-shrink-0 ml-2">
                            {locked ? (
                              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-600 text-xs font-semibold">
                                <Lock size={12} /> Locked
                              </div>
                            ) : done ? (
                              <button onClick={() => startModule(mod.id)}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all">
                                <PlayCircle size={14} /> Practice Again
                              </button>
                            ) : (
                              <button onClick={() => startModule(mod.id)}
                                className={cn(
                                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95",
                                  "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                                )}>
                                <PlayCircle size={14} /> Start <ChevronRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mock Interview CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                  className={cn(
                    "glass rounded-[32px] p-8 border transition-all",
                    allDone ? "border-blue-500/20 bg-blue-500/5" : "border-white/5"
                  )}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className={cn(
                      "flex-shrink-0 h-16 w-16 rounded-2xl flex items-center justify-center",
                      allDone ? "bg-blue-600 shadow-xl shadow-blue-600/20" : "bg-white/5 border border-white/5"
                    )}>
                      {allDone ? <Mic size={30} /> : <Lock size={24} className="text-slate-600" />}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className={cn("text-xl font-bold mb-1", !allDone && "text-slate-500")}>
                        {allDone ? "Ready for Mock Interview" : "🔒 Mock Interview Locked"}
                      </h3>
                      <p className={cn("text-sm", allDone ? "text-slate-300" : "text-slate-600")}>
                        {allDone
                          ? "You have completed all required training modules. Start your AI-powered mock interview now."
                          : `Complete all required training modules before starting your interview. (${completed.length}/${MODULES.length} done)`}
                      </p>
                    </div>
                    {allDone ? (
                      <Link href="/interview"
                        className="flex-shrink-0 flex items-center gap-2 px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95">
                        <Mic size={18} /> Start Mock Interview <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <div className="flex-shrink-0 flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-600 font-semibold text-sm cursor-not-allowed">
                        <Lock size={16} /> Locked
                      </div>
                    )}
                  </div>

                  {/* Mini progress dots */}
                  {!allDone && (
                    <div className="mt-6 flex items-center gap-2">
                      {MODULES.map(m => (
                        <div key={m.id} className={cn(
                          "flex-1 h-1 rounded-full transition-all",
                          completed.includes(m.id) ? "bg-blue-500" : "bg-white/5"
                        )} />
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* ══ PRACTICING ══ */}
            {session === "practicing" && activeModule && (
              <motion.div key="practicing"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="glass rounded-[40px] p-12 border border-white/10 text-center max-w-2xl mx-auto">

                <div className="mb-8 flex flex-col items-center">
                  <div className="relative mb-6">
                    <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
                    <div className={cn("relative h-20 w-20 rounded-2xl flex items-center justify-center shadow-xl",
                      activeModule.accent.bg, activeModule.accent.text)}>
                      <activeModule.icon size={36} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black mb-1">{activeModule.title}</h2>
                  <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold">Session in progress</p>
                </div>

                {/* Timer */}
                <div className="bg-[#020617] rounded-3xl p-7 border border-white/5 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-0.5 bg-blue-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 60) * 100}%` }} />
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Time Remaining</p>
                    <p className="text-2xl font-mono font-black text-blue-400">{fmt(timeLeft)}</p>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{activeModule.description}</p>
                </div>

                <button onClick={finishSession}
                  className="w-full sm:w-auto px-10 rounded-2xl bg-blue-600 py-4 font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mx-auto">
                  <CheckCircle2 size={20} /> Mark as Complete
                </button>
              </motion.div>
            )}

            {/* ══ DONE ══ */}
            {session === "done" && activeModule && (
              <motion.div key="done"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto">

                <div className="glass rounded-[40px] p-10 border border-emerald-500/20 bg-emerald-500/5 mb-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="flex-shrink-0 h-18 w-18 h-16 w-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black mb-1">Module Complete!</h2>
                    <p className="text-emerald-400/80 font-semibold text-sm">
                      You finished <span className="text-white">{activeModule.title}</span>.
                    </p>
                  </div>
                </div>

                {/* Unlock notification */}
                {(() => {
                  const idx = MODULES.findIndex(m => m.id === activeModule.id);
                  const next = MODULES[idx + 1];
                  return next && completed.includes(activeModule.id) && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="glass rounded-[24px] p-5 border border-blue-500/20 bg-blue-500/5 mb-6 flex items-center gap-4">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        next.accent.bg, next.accent.text)}>
                        <next.icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Next Module Unlocked</p>
                        <p className="font-bold text-white text-sm">{next.title}</p>
                      </div>
                      <ChevronRight size={16} className="text-blue-400 ml-auto" />
                    </motion.div>
                  );
                })()}

                {/* AI note */}
                <div className="glass rounded-[24px] p-6 border border-white/5 mb-6 flex items-start gap-4">
                  <Sparkles size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-1">AI Analysis After Mock Interview</p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Confidence Score, Stress Level, Voice Clarity, Eye Contact Analysis and Personalised Suggestions are generated only after you complete a Mock Interview session.
                    </p>
                  </div>
                </div>

                {/* Progress summary */}
                <div className="glass rounded-[24px] p-5 border border-white/5 mb-6 flex items-center gap-4">
                  <BarChart2 size={18} className="text-violet-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">{completed.length}/{MODULES.length} modules completed</p>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-blue-500 rounded-full"
                        animate={{ width: `${Math.round((completed.length / MODULES.length) * 100)}%` }}
                        transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                  <p className="text-lg font-black text-white flex-shrink-0">
                    {Math.round((completed.length / MODULES.length) * 100)}%
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={resetToLibrary}
                    className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 transition-all">
                    Back to Training Library
                  </button>
                  {allDone ? (
                    <Link href="/interview"
                      className="flex-1 py-4 rounded-2xl bg-blue-600 font-bold text-sm shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                      <Mic size={16} /> Start Mock Interview <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <button onClick={resetToLibrary}
                      className="flex-1 py-4 rounded-2xl bg-blue-600 font-bold text-sm shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                      Continue Training <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
