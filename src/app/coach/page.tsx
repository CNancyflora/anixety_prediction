"use client";

import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Mic, 
  Activity, 
  Zap, 
  Eye, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Shield,
  MessageSquare,
  Brain,
  Video,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export default function CoachPage() {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<"idle" | "practicing" | "feedback">("idle");
  const [progress, setProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [lastScores, setLastScores] = useState({ confidence: 0, stress: 0, speaking: 0 });
  const [hasHistory, setHasHistory] = useState<boolean | null>(null);

  useEffect(() => {
    const savedProgress = localStorage.getItem("calmhire_coach_progress");
    const savedTasks = localStorage.getItem("calmhire_completed_tasks");
    const savedHistory = localStorage.getItem("calmhire_history");
    if (savedProgress) setProgress(parseInt(savedProgress));
    if (savedTasks) setCompletedTasks(JSON.parse(savedTasks));
    
    if (savedHistory && JSON.parse(savedHistory).length > 0) {
      setHasHistory(true);
    } else {
      setHasHistory(false);
    }
  }, []);

  const startTask = (task: string) => {
    setActiveTask(task);
    setSessionState("practicing");
    
    // Simulate real analysis duration
    setTimeout(() => {
      const conf = Math.floor(Math.random() * 20) + 75;
      const stress = Math.floor(Math.random() * 30) + 10;
      const speak = Math.floor(Math.random() * 15) + 80;
      
      setLastScores({ confidence: conf, stress, speaking: speak });
      setSessionState("feedback");
      
      // Save task completion
      if (!completedTasks.includes(task)) {
        const newTasks = [...completedTasks, task];
        setCompletedTasks(newTasks);
        localStorage.setItem("calmhire_completed_tasks", JSON.stringify(newTasks));
        
        // Calculate new progress (total tasks = 11 across categories)
        const totalTasks = trainingCategories.reduce((acc, cat) => acc + cat.tasks.length, 0);
        const newProgress = Math.min(Math.round((newTasks.length / totalTasks) * 100), 100);
        setProgress(newProgress);
        localStorage.setItem("calmhire_coach_progress", newProgress.toString());
      }

      // Save to global history
      const history = JSON.parse(localStorage.getItem("calmhire_history") || "[]");
      const newSession = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: `Coach: ${task}`,
        anxiety: stress > 35 ? "Medium" : "Low",
        confidence: conf,
        stress: stress,
        duration: "5m",
        feedback: `Your performance in ${task} was impressive. ${
          conf > 85 ? "Excellent confidence markers." : "Good effort, try to maintain more eye contact."
        } ${speak > 85 ? "Voice clarity was exceptionally high." : "Clear articulation observed."}`
      };
      localStorage.setItem("calmhire_history", JSON.stringify([newSession, ...history]));
      
      // Update global analytics data
      const analyticsData = JSON.parse(localStorage.getItem("calmhire_analytics") || "{}");
      analyticsData.lastSession = newSession;
      analyticsData.totalSessions = (analyticsData.totalSessions || 0) + 1;
      localStorage.setItem("calmhire_analytics", JSON.stringify(analyticsData));
    }, 4000);
  };

  const resetSession = () => {
    setSelectedCategory(null);
    setActiveTask(null);
    setSessionState("idle");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Sidebar />

      <main className="flex-1 w-full lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-blue-500 font-bold">
                <Sparkles size={18} />
                <span className="text-xs uppercase tracking-[0.2em]">Personal AI Coach</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">AI Training Module</h1>
              <p className="text-slate-400 mt-1">Accelerate your career growth with data-driven interview coaching.</p>
            </div>

            <div className="glass rounded-2xl px-6 py-4 border border-white/5 flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Progress</p>
                <p className="text-lg font-black text-white">{progress}%</p>
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-white/5 flex items-center justify-center p-1 overflow-hidden relative">
                <div 
                  className="absolute inset-0 bg-blue-600/20"
                  style={{ height: `${progress}%`, top: `${100 - progress}%` }}
                />
                <Target size={20} className={cn("relative z-10", progress === 100 ? "text-blue-400" : "text-slate-600")} />
              </div>
            </div>
          </header>

          {hasHistory === false ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="h-32 w-32 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 mb-8 border border-blue-600/20 shadow-lg shadow-blue-500/10">
                <Sparkles size={48} />
              </div>
              <h3 className="text-3xl font-black mb-3">Locked Feature</h3>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Complete your first assessment to unlock personalized coaching recommendations.
              </p>
            </motion.div>
          ) : hasHistory === true ? (
            <>
          <AnimatePresence mode="wait">
            {sessionState === "idle" ? (
              <motion.div 
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {trainingCategories.map((cat, i) => {
                  const catTasks = cat.tasks;
                  const completedInCat = catTasks.filter(t => completedTasks.includes(t)).length;
                  const catProgress = Math.round((completedInCat / catTasks.length) * 100);

                  return (
                    <div 
                      key={cat.id}
                      className="glass group rounded-[40px] p-10 border border-white/5 hover:border-blue-500/30 transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className={cn("flex h-16 w-16 items-center justify-center rounded-3xl transition-transform group-hover:scale-110", cat.bg, cat.color)}>
                          <cat.icon size={32} />
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-4">{cat.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1">{cat.desc}</p>
                      
                      <div className="mb-8">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          <span>Completion</span>
                          <span>{catProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${catProgress}%` }}
                            className={cn("h-full", catProgress === 100 ? "bg-emerald-500" : "bg-blue-500")}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedCategory(cat)}
                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 py-4 font-bold transition-all hover:bg-blue-600 hover:border-blue-600 active:scale-95"
                      >
                        Practice Now <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            ) : sessionState === "practicing" ? (
              <motion.div 
                key="practicing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass rounded-[40px] p-12 border border-white/10 text-center max-w-3xl mx-auto"
              >
                <div className="mb-10 flex flex-col items-center">
                  <div className="relative mb-8">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl"
                    />
                    <div className="relative h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                      <Mic size={40} className="animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black mb-2">Live Analysis Active</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Tracking voice modulation & facial micro-expressions</p>
                </div>

                <div className="bg-[#020617] rounded-3xl p-8 border border-white/5 mb-10">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Current Exercise</p>
                  <p className="text-2xl font-bold italic text-white">"{activeTask}"</p>
                  <p className="text-slate-500 text-sm mt-6 leading-relaxed">
                    The AI is monitoring your confidence markers. Speak clearly and maintain eye contact with the camera.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {[
                    { label: "Voice Clarity", icon: Activity, color: "text-emerald-500" },
                    { label: "Stability", icon: Zap, color: "text-blue-500" },
                    { label: "Focus Level", icon: Eye, color: "text-purple-500" },
                  ].map((m, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <m.icon className={cn("mb-3", m.color)} size={32} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-4xl mx-auto"
              >
                {/* Feedback Header */}
                <div className="glass rounded-[40px] p-10 border border-blue-500/20 bg-blue-500/5 mb-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                    <Target size={40} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-black mb-1 text-white">Session Optimized!</h2>
                    <p className="text-emerald-400/80 font-bold text-lg">Your focus on {activeTask} was exemplary.</p>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-center">
                      <p className="text-4xl font-black">{lastScores.confidence}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Confidence</p>
                    </div>
                    <div className="h-12 w-[1px] bg-white/10" />
                    <div className="text-center">
                      <p className="text-4xl font-black text-emerald-400">A+</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Grade</p>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="glass rounded-[32px] p-8 border border-white/5">
                    <h3 className="text-lg font-bold mb-8">Session Analytics</h3>
                    <div className="space-y-8">
                      {[
                        { label: "Confidence", val: lastScores.confidence, color: "bg-amber-400" },
                        { label: "Stress Control", val: 100 - lastScores.stress, color: "bg-emerald-400" },
                        { label: "Voice Clarity", val: lastScores.speaking, color: "bg-blue-400" },
                      ].map((s, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                            <span className="text-sm font-black">{s.val}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${s.val}%` }}
                              className={cn("h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]", s.color)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass rounded-[32px] p-8 border border-white/5">
                    <h3 className="text-lg font-bold mb-6">AI Behavioral Insights</h3>
                    <div className="space-y-4">
                      {[
                        "Pacing was stable during complex technical segments.",
                        "Eye contact maintained at 94% throughout the practice.",
                        "Suggestion: Use more power verbs during project intros."
                      ].map((tip, i) => (
                        <div key={i} className="flex gap-4 items-start rounded-2xl bg-white/5 p-5 border border-white/5 transition-colors hover:bg-white/10">
                          <div className="mt-1 text-blue-400"><Sparkles size={16} /></div>
                          <p className="text-sm text-slate-300 leading-relaxed font-medium">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={resetSession}
                    className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-5 font-bold transition-all hover:bg-white/10"
                  >
                    Return to Library
                  </button>
                  <button 
                    onClick={() => setSessionState("practicing")}
                    className="flex-1 rounded-2xl bg-blue-600 py-5 font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    Repeat Session <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task Modal */}
          <AnimatePresence>
            {selectedCategory && sessionState === "idle" && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-xl">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="glass max-w-2xl w-full rounded-[40px] p-12 border border-white/10 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                  
                  <div className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg", selectedCategory.bg, selectedCategory.color)}>
                        <selectedCategory.icon size={28} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black">{selectedCategory.title}</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Select an exercise to begin</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-12">
                    {selectedCategory.tasks.map((task: string, i: number) => {
                      const isDone = completedTasks.includes(task);
                      return (
                        <button
                          key={i}
                          onClick={() => startTask(task)}
                          className={cn(
                            "group flex items-center justify-between rounded-[24px] border p-6 text-left transition-all duration-300",
                            isDone 
                              ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" 
                              : "border-white/5 bg-white/5 hover:border-blue-500/30 hover:bg-blue-500/5"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                              isDone ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500" : "bg-white/5 border-white/10 text-slate-500 group-hover:text-blue-400"
                            )}>
                              {isDone ? <CheckCircle2 size={18} /> : <Play size={18} />}
                            </div>
                            <span className={cn("font-bold transition-colors", isDone ? "text-slate-300" : "text-white group-hover:text-blue-400")}>
                              {task}
                            </span>
                          </div>
                          {isDone && (
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">
                              Completed
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10">
                    <Activity size={16} className="text-blue-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.1em]">AI Engine v4.2 calibrated for real-time analysis</span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

const trainingCategories = [
  {
    id: "confidence",
    title: "Confidence Training",
    desc: "Master your body language, eye contact, and vocal presence to project authority.",
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    tasks: [
      "Self-introduction practice",
      "Speaking confidence exercises",
      "Eye contact detection",
      "Voice clarity analysis"
    ]
  },
  {
    id: "anxiety",
    title: "Anxiety Reduction",
    desc: "Scientific techniques to manage interview stress and high-pressure situations.",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    tasks: [
      "Mock pressure questions",
      "Stress management exercises",
      "Confidence-building tasks"
    ]
  },
  {
    id: "communication",
    title: "Communication Mastery",
    desc: "Structure your answers effectively and explain complex topics with clarity.",
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    tasks: [
      "Answer-building practice",
      "HR question practice",
      "Technical explanation practice",
      "Project explanation practice"
    ]
  }
];
