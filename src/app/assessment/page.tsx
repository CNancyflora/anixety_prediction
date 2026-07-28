"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ChevronRight, 
  ChevronLeft, 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Zap
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Question = {
  id: number;
  text: string;
  type: "scale" | "choice";
  options?: string[];
  minLabel?: string;
  maxLabel?: string;
};

const questions: Question[] = [
  { id: 1, text: "How stressed do you feel before an interview?", type: "scale", minLabel: "Very Calm", maxLabel: "Extremely Stressed" },
  { id: 2, text: "How confident do you feel about attending this interview?", type: "scale", minLabel: "Not Confident", maxLabel: "Very Confident" },
  { id: 3, text: "How many hours did you sleep last night?", type: "choice", options: ["Less than 4 hours", "4–6 hours", "6–8 hours", "More than 8 hours"] },
  { id: 4, text: "How many interviews have you attended before?", type: "choice", options: ["0", "1–3", "4–10", "More than 10"] },
  { id: 5, text: "How much time did you prepare for this interview?", type: "choice", options: ["Less than 1 hour", "1–3 hours", "1 day", "More than 1 day"] },
  { id: 6, text: "Are you comfortable introducing yourself in front of interviewers?", type: "choice", options: ["Yes", "Sometimes", "No"] },
  { id: 7, text: "Can you maintain eye contact while speaking?", type: "choice", options: ["Easily", "Sometimes", "Difficult"] },
  { id: 8, text: "How comfortable are you answering unexpected questions?", type: "scale", minLabel: "Anxious", maxLabel: "Comfortable" },
  { id: 9, text: "Do you feel nervous when speaking in English or technical discussions?", type: "choice", options: ["Always", "Sometimes", "Never"] },
  { id: 10, text: "Do your hands shake, voice crack, or heart beat faster during interviews?", type: "choice", options: ["Often", "Sometimes", "Never"] },
  { id: 11, text: "Can you explain your projects confidently?", type: "choice", options: ["Yes", "Somewhat", "No"] },
  { id: 12, text: "How well do you handle pressure situations?", type: "scale", minLabel: "Poorly", maxLabel: "Excellent" },
];

type Recommendation = {
  icon: string;
  title: string;
  desc: string;
};

type ResultInfo = {
  level: string;
  color: string;
  bg: string;
  border: string;
  motivational: string;
  anxietyScore: number;
  confidenceScore: number;
  readinessScore: number;
  recommendations: Recommendation[];
  nextSession: string;
};

const RESULT_DATA: Record<"low" | "medium" | "high", ResultInfo> = {
  low: {
    level: "Low Anxiety",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    motivational: "You are interview-ready and performing confidently.",
    anxietyScore: 24,
    confidenceScore: 88,
    readinessScore: 92,
    recommendations: [
      { icon: "🚀", title: "Improve technical depth", desc: "Focus on advanced algorithms and system design to challenge yourself." },
      { icon: "👔", title: "Practice advanced HR questions", desc: "Prepare for behavioral questions involving complex workplace scenarios." },
      { icon: "👁️", title: "Maintain eye contact", desc: "Your speaking clarity is great, just ensure consistent eye contact." }
    ],
    nextSession: "Advanced Technical Session"
  },
  medium: {
    level: "Medium Anxiety",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    motivational: "You are improving steadily with every practice session. Nervousness is normal — preparation builds confidence.",
    anxietyScore: 55,
    confidenceScore: 62,
    readinessScore: 70,
    recommendations: [
      { icon: "🗣️", title: "Practice self-introduction", desc: "Rehearse your intro daily to build a strong opening foundation." },
      { icon: "📹", title: "Attend more practice sessions", desc: "Familiarity reduces anxiety. Schedule another session soon." },
      { icon: "💪", title: "Improve speaking confidence", desc: "Try to reduce hesitation by taking short pauses before answering." },
      { icon: "⏳", title: "Reduce hesitation", desc: "Structure your thoughts using the STAR method before speaking." }
    ],
    nextSession: "Behavioral Practice Session"
  },
  high: {
    level: "High Anxiety",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    motivational: "Every expert was once nervous too. Confidence grows step by step. You are capable of improving with practice.",
    anxietyScore: 82,
    confidenceScore: 35,
    readinessScore: 45,
    recommendations: [
      { icon: "🧘", title: "Breathing exercises", desc: "Practice box breathing before interviews to calm your nervous system." },
      { icon: "🌱", title: "Beginner practice sessions", desc: "Start with low-pressure, beginner-friendly practice sessions." },
      { icon: "💤", title: "Improve sleep routine", desc: "Ensure you get 8 hours of sleep to improve cognitive function and reduce stress." },
      { icon: "🐢", title: "Speak slowly and clearly", desc: "Don't rush your answers. Take your time to articulate your thoughts." }
    ],
    nextSession: "Beginner AI Coach Exercise"
  }
};

export default function AssessmentPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [resultType, setResultType] = useState<"low" | "medium" | "high">("low");

  const handleAnswer = (val: any) => {
    setAnswers({ ...answers, [questions[step].id]: val });
  };

  const nextStep = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsCalculating(true);
      
      let stressScore = 0;
      stressScore += (answers[1] || 5);
      stressScore += (11 - (answers[2] || 5));
      stressScore += (11 - (answers[8] || 5));
      stressScore += (11 - (answers[12] || 5));
      
      let type: "low" | "medium" | "high" = "low";
      if (stressScore >= 26) type = "high";
      else if (stressScore >= 18) type = "medium";
      else type = "low";
      
      setResultType(type);

      // Save to Firebase
      try {
        if (auth.currentUser) {
          const assessmentsRef = collection(db, "users", auth.currentUser.uid, "assessments");
          await addDoc(assessmentsRef, {
            answers,
            stressScore,
            anxietyLevel: type,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Failed to save assessment:", error);
      }

      // Save to localStorage for Dashboard/Coach features
      const history = JSON.parse(localStorage.getItem("calmhire_history") || "[]");
      const newAssessment = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "Initial Assessment",
        anxiety: type === "low" ? "Low" : type === "medium" ? "Medium" : "High",
        confidence: RESULT_DATA[type].confidenceScore,
        stress: stressScore,
        duration: "10m",
        feedback: RESULT_DATA[type].motivational
      };
      localStorage.setItem("calmhire_history", JSON.stringify([newAssessment, ...history]));

      setTimeout(() => {
        setIsCalculating(false);
        setShowResults(true);
      }, 1500);
    }
  };

  const progress = ((step + 1) / questions.length) * 100;
  const readinessScore = 85;

  if (isCalculating) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#020617] text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-8"
        >
          <Brain size={64} className="text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight">AI Analysis in Progress...</h2>
        <p className="mt-2 text-secondary">Processing your behavioral patterns and stress indicators.</p>
      </main>
    );
  }

  if (showResults) {
    const data = RESULT_DATA[resultType];

    return (
      <main className="flex min-h-screen flex-col items-center bg-[#020617] p-6 text-white overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl w-full py-12"
        >
          {/* Results Header */}
          <div className="glass rounded-[40px] p-10 mb-8 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles size={120} />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h2 className="text-4xl font-extrabold tracking-tight mb-4">Assessment <span className="text-primary">Complete</span></h2>
                <p className="text-lg text-slate-400 mb-6">{data.motivational}</p>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className={cn("rounded-2xl border px-6 py-3", data.bg, data.border)}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", data.color)}>Anxiety Level</p>
                    <p className={cn("text-xl font-bold", data.color)}>{data.level}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Anxiety Score</p>
                    <p className="text-2xl font-bold">{data.anxietyScore}%</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Confidence Score</p>
                    <p className="text-2xl font-bold">{data.confidenceScore}%</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative h-56 w-56">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle className="text-white/5 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                    <motion.circle 
                      initial={{ strokeDashoffset: 251 }}
                      animate={{ strokeDashoffset: 251 - (251 * data.readinessScore / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-primary stroke-current" 
                      strokeWidth="8" 
                      strokeDasharray="251" 
                      fill="transparent" 
                      r="40" cx="50" cy="50" 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-white">{data.readinessScore}%</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary mt-1">Readiness</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Grid */}
          <h3 className="text-xl font-bold mb-6 px-4 flex items-center gap-2">
            <Zap size={20} className="text-amber-400" /> Actionable Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data.recommendations.map((tip, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl p-6 border border-white/10 transition-all hover:scale-[1.02] hover:border-white/20"
              >
                <span className="text-3xl mb-4 block">{tip.icon}</span>
                <h4 className="text-lg font-bold mb-2">{tip.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{tip.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="glass rounded-3xl p-8 border border-white/10 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-bold mb-1">Recommended Next Step</h4>
              <p className="text-slate-400 text-sm">Start your practice session tailored to your current level.</p>
            </div>
            <div className="text-right">
              <p className="text-primary font-bold text-lg">{data.nextSession}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/dashboard"
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-5 text-center font-bold transition-all hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
            <Link 
              href="/coach"
              className="flex-1 rounded-2xl bg-primary py-5 text-center font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              Start Recommended Session <ChevronRight size={20} />
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  const currentQ = questions[step];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#020617] p-6 text-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold">
                {step + 1}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary block">Question</span>
                <span className="text-sm font-bold text-white">of {questions.length}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary block">Progress</span>
              <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="glass rounded-[40px] p-10 md:p-14 border border-white/10"
          >
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold mb-12 leading-tight tracking-tight text-white"
            >
              {currentQ.text}
            </motion.h2>

            <div className="mt-8">
              {currentQ.type === "scale" ? (
                <div className="space-y-12">
                  <div className="relative pt-6">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={answers[currentQ.id] || 5}
                      onChange={(e) => handleAnswer(parseInt(e.target.value))}
                      className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                    />
                    <div className="flex justify-between mt-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      <span>{currentQ.minLabel}</span>
                      <span className="text-primary text-2xl font-black">{answers[currentQ.id] || 5}</span>
                      <span>{currentQ.maxLabel}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {currentQ.options?.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(option)}
                      className={cn(
                        "group flex items-center justify-between rounded-3xl border-2 p-6 text-left transition-all duration-300",
                        answers[currentQ.id] === option 
                          ? "border-primary bg-primary/10 text-primary shadow-xl shadow-primary/10" 
                          : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      )}
                    >
                      <span className="text-lg font-bold">{option}</span>
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                        answers[currentQ.id] === option ? "border-primary bg-primary" : "border-white/20"
                      )}>
                        {answers[currentQ.id] === option && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="mt-12 flex items-center justify-between px-2">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
            )}
          >
            <ChevronLeft size={28} />
          </button>
          
          <button
            onClick={nextStep}
            disabled={!answers[currentQ.id] && currentQ.type === "choice"}
            className={cn(
              "group flex items-center gap-4 rounded-3xl bg-primary px-10 py-5 text-lg font-black shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
              (!answers[currentQ.id] && currentQ.type === "choice") && "grayscale opacity-30"
            )}
          >
            {step === questions.length - 1 ? "Analyze Results" : "Continue"}
            <ChevronRight size={24} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </main>
  );
}
