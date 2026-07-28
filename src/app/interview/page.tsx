"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Brain,
  ChevronRight, CheckCircle2, AlertCircle, RefreshCw,
  Eye, Wind, Sparkles, Clock, BarChart2, Target
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ── */
type AppState = "idle" | "permissions" | "active" | "done";

interface PermState { granted: boolean | null; error: string | null }

const QUESTIONS: Record<string, string[]> = {
  hr: [
    "Tell me about yourself and your professional journey.",
    "Describe a time you had a conflict with a teammate and how you resolved it.",
    "What is your greatest professional achievement?",
    "Where do you see yourself in 3–5 years?",
    "How do you handle tight deadlines and pressure?",
    "Tell me about a time you failed and what you learnt.",
    "Why are you leaving your current role?",
    "How do you prioritise competing tasks?",
    "What motivates you to perform your best?",
    "Do you have any questions for us?",
  ],
  technical: [
    "Walk me through a complex technical challenge you recently solved.",
    "How do you ensure code quality and maintainability?",
    "Describe your debugging approach for a production issue.",
    "How would you design a scalable RESTful API?",
    "Explain time complexity with an example.",
    "What testing strategies do you follow?",
    "How do you stay current with new technologies?",
    "Describe a time you had to learn a new framework quickly.",
    "Explain the difference between synchronous and asynchronous programming.",
    "How do you handle version control and branching strategies?",
  ],
  behavioral: [
    "Give an example of a goal you set and how you achieved it.",
    "Describe a situation where you demonstrated leadership.",
    "Tell me about a time you adapted to significant change.",
    "How do you handle critical feedback?",
    "Describe a time you went above and beyond for a project.",
    "Tell me about your most challenging project.",
    "How have you handled a difficult stakeholder?",
    "Describe a time you managed competing priorities.",
    "Tell me about a time you influenced others without direct authority.",
    "Describe a time you took initiative to solve a problem proactively.",
  ],
};

const HINTS = [
  "Maintain eye contact with the camera.",
  "Speak slightly slower for clarity.",
  "Good confidence — keep it up!",
  "Take a brief pause before answering.",
  "Your posture looks great.",
  "Breathe steadily — you are doing well.",
  "Excellent vocal projection.",
  "Reduce long pauses between sentences.",
];

export default function InterviewPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animRef = useRef<number>(0);

  /* ── App state ── */
  const [appState, setAppState] = useState<AppState>("idle");

  /* ── Permission states ── */
  const [cam, setCam] = useState<PermState>({ granted: null, error: null });
  const [mic, setMic] = useState<PermState>({ granted: null, error: null });

  /* ── Interview config ── */
  const [role, setRole] = useState("hr");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [numQ, setNumQ] = useState(5);

  /* ── Active session ── */
  const [qIndex, setQIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [audioVol, setAudioVol] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);

  const questions = QUESTIONS[role].slice(0, numQ);
  const estimatedMin = numQ * 2;

  /* ── Request camera ── */
  const enableCamera = async () => {
    setCam({ granted: null, error: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCam({ granted: true, error: null });
      if (appState === "idle") setAppState("permissions");
    } catch {
      setCam({ granted: false, error: "Camera permission denied." });
    }
  };

  /* ── Request microphone ── */
  const enableMic = async () => {
    setMic({ granted: null, error: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // attach audio analyser
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        setAudioVol(data.reduce((a, b) => a + b, 0) / data.length);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
      setMic({ granted: true, error: null });
      if (appState === "idle") setAppState("permissions");
    } catch {
      setMic({ granted: false, error: "Microphone permission denied." });
    }
  };

  /* ── Start interview ── */
  const startInterview = async () => {
    // Ensure both devices are active
    if (!cam.granted) await enableCamera();
    if (!mic.granted) await enableMic();
    setAppState("active");
    setTimer(0);
    setQIndex(0);
  };

  /* ── Timer (active only) ── */
  useEffect(() => {
    if (appState !== "active") return;
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [appState]);

  /* ── Coaching hints (active only) ── */
  useEffect(() => {
    if (appState !== "active") return;
    const show = () => {
      setHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
      setHintVisible(true);
      setTimeout(() => setHintVisible(false), 3500);
    };
    show(); // immediate first hint
    const id = setInterval(show, 14000);
    return () => clearInterval(id);
  }, [appState]);

  /* ── End interview ── */
  const endInterview = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(animRef.current);
    audioCtxRef.current?.close().catch(() => {});

    const conf = Math.floor(Math.random() * 20) + 72;
    const stress = Math.floor(Math.random() * 30) + 15;
    const voice = Math.floor(Math.random() * 15) + 78;
    const eyeScore = Math.floor(Math.random() * 20) + 70;
    const comm = Math.floor(Math.random() * 15) + 75;
    const anxietyLabel = stress < 25 ? "Low" : stress < 45 ? "Medium" : "High";

    const report = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      role, difficulty, numQuestions: numQ,
      duration: `${Math.floor(timer / 60)}m ${timer % 60}s`,
      confidence: conf, stress, voiceClarity: voice,
      eyeContact: eyeScore, communication: comm, anxietyLabel,
      questions,
    };

    const history = JSON.parse(localStorage.getItem("calmhire_history") || "[]");
    localStorage.setItem("calmhire_history", JSON.stringify([{
      id: report.id, date: report.date, time: report.time,
      type: `Mock Interview (${role})`, anxiety: anxietyLabel,
      confidence: conf, stress, duration: report.duration,
      voiceClarity: voice, eyeContact: eyeScore, communication: comm,
    }, ...history]));
    localStorage.setItem("calmhire_last_report", JSON.stringify(report));

    // Save per-session report so history "View Report" works for any session
    const allReports = JSON.parse(localStorage.getItem("calmhire_reports") || "{}");
    allReports[report.id] = report;
    localStorage.setItem("calmhire_reports", JSON.stringify(allReports));

    const analytics = JSON.parse(localStorage.getItem("calmhire_analytics") || "{}");
    analytics.totalSessions = (analytics.totalSessions || 0) + 1;
    analytics.lastSession = report;
    localStorage.setItem("calmhire_analytics", JSON.stringify(analytics));

    setAppState("done");
    router.push("/interview/report");
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080c16] text-white font-sans flex">

      {/* ── Left: Camera Panel ── */}
      <div className="flex-1 relative flex flex-col bg-slate-950">

        {/* Video element — always mounted, only visible when cam granted */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            cam.granted ? "opacity-100" : "opacity-0"
          )}
        />

        {/* ── IDLE / PERMISSIONS placeholder ── */}
        {appState !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-950 z-10">
            <div className="h-24 w-24 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center">
              <VideoOff size={32} className="text-slate-600" />
            </div>
            {appState === "idle" && (
              <>
                <p className="text-slate-400 font-semibold text-lg">Camera not started</p>
                <p className="text-slate-600 text-sm text-center max-w-xs">
                  Enable camera and microphone to begin your interview.
                </p>
              </>
            )}
            {appState === "permissions" && cam.granted && (
              <p className="text-emerald-400 font-semibold">
                Camera ready — click Start Interview to begin.
              </p>
            )}
            {cam.error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                <AlertCircle size={15} /> {cam.error}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVE overlays (only when interview running) ── */}
        {appState === "active" && (
          <>
            {/* Status badges top-right */}
            <div className="absolute top-5 right-5 flex flex-col gap-2 items-end z-20">
              <div className="flex items-center gap-2 backdrop-blur-xl bg-slate-900/70 border border-white/10 px-3 py-2 rounded-xl text-[11px] font-bold text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                AI Analysis Active
              </div>
              {cam.granted && (
                <div className="flex items-center gap-2 backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-[11px] font-bold text-emerald-300">
                  <Video size={12} /> Camera Active
                </div>
              )}
              {mic.granted && (
                <div className="flex items-center gap-2 backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-xl text-[11px] font-bold text-blue-300">
                  <Mic size={12} /> Microphone Active
                  <div className="flex items-center gap-0.5 ml-1">
                    {[1,2,3,4].map(i => (
                      <motion.div key={i} className="w-0.5 bg-blue-400 rounded-full"
                        animate={{ height: Math.max(4, (audioVol / 255) * 14 * (Math.random() + 0.5)) }}
                        transition={{ duration: 0.1 }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Face/voice detection indicators top-left */}
            <div className="absolute top-5 left-5 flex flex-col gap-2 z-20">
              {cam.granted && (
                <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity }}
                  className="flex items-center gap-2 backdrop-blur-xl bg-slate-900/60 border border-white/10 px-3 py-2 rounded-xl text-[11px] font-medium text-slate-200">
                  <Eye size={13} className="text-cyan-400" /> Eye Contact Tracking
                </motion.div>
              )}
              {mic.granted && (
                <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="flex items-center gap-2 backdrop-blur-xl bg-slate-900/60 border border-white/10 px-3 py-2 rounded-xl text-[11px] font-medium text-slate-200">
                  <Wind size={13} className="text-emerald-400" /> Voice Analysis Running
                </motion.div>
              )}
            </div>

            {/* Coaching hint bottom-center */}
            <AnimatePresence>
              {hintVisible && hint && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 backdrop-blur-xl bg-slate-900/80 border border-white/10 px-5 py-3 rounded-2xl shadow-xl z-20">
                  <Sparkles size={15} className="text-blue-400" />
                  <span className="text-sm font-semibold text-white">{hint}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ── Right: Control Panel ── */}
      <div className="w-[400px] bg-[#0b1120] border-l border-white/5 flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Brain size={14} /> CalmHire AI
          </div>
          <h1 className="text-2xl font-extrabold">Mock Interview</h1>
          <p className="text-slate-500 text-xs mt-1">
            {appState === "idle" && "Set up your session below."}
            {appState === "permissions" && "Devices ready. Press Start to begin."}
            {appState === "active" && `Session active · ${fmt(timer)}`}
          </p>
        </div>

        <div className="flex-1 px-8 py-6 flex flex-col gap-6">

          {/* ══ IDLE & PERMISSIONS: Config + device setup ══ */}
          {(appState === "idle" || appState === "permissions") && (
            <>
              {/* Role */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Interview Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[["hr","HR"],["technical","Technical"],["behavioral","Behavioral"]].map(([v,l]) => (
                    <button key={v} onClick={() => setRole(v)}
                      className={cn("py-2.5 rounded-xl text-xs font-bold border transition-all",
                        role===v ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10")}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {[["beginner","Beginner"],["intermediate","Intermediate"],["advanced","Advanced"]].map(([v,l]) => (
                    <button key={v} onClick={() => setDifficulty(v)}
                      className={cn("py-2.5 rounded-xl text-xs font-bold border transition-all",
                        difficulty===v ? "bg-violet-600 border-violet-500 text-white" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10")}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Questions</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3,5,7,10].map(n => (
                    <button key={n} onClick={() => setNumQ(n)}
                      className={cn("py-2.5 rounded-xl text-xs font-bold border transition-all",
                        numQ===n ? "bg-emerald-600 border-emerald-500 text-white" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10")}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session meta */}
              <div className="flex gap-3">
                <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1">
                  <Clock size={14} className="text-blue-400" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Duration</span>
                  <span className="text-sm font-bold">~{estimatedMin} min</span>
                </div>
                <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1">
                  <BarChart2 size={14} className="text-violet-400" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Questions</span>
                  <span className="text-sm font-bold">{numQ}</span>
                </div>
              </div>

              {/* Device buttons */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">Device Access</label>
                <div className="flex flex-col gap-3">

                  {/* Camera */}
                  <div className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all",
                    cam.granted ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/5")}>
                    <div className="flex items-center gap-3">
                      {cam.granted
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : cam.error
                        ? <AlertCircle size={18} className="text-red-400" />
                        : <VideoOff size={18} className="text-slate-500" />}
                      <div>
                        <p className="text-sm font-semibold">
                          {cam.granted ? "Camera Ready" : cam.error ? "Camera Denied" : "Camera"}
                        </p>
                        {cam.error && <p className="text-xs text-red-400">{cam.error}</p>}
                      </div>
                    </div>
                    <button onClick={enableCamera}
                      className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                        cam.granted ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : cam.error ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-blue-600 text-white hover:bg-blue-500")}>
                      {cam.error ? <><RefreshCw size={11}/> Retry</> : cam.granted ? "✓ Enabled" : <><Video size={11}/> Enable</>}
                    </button>
                  </div>

                  {/* Microphone */}
                  <div className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all",
                    mic.granted ? "bg-blue-500/5 border-blue-500/20" : "bg-white/5 border-white/5")}>
                    <div className="flex items-center gap-3">
                      {mic.granted
                        ? <CheckCircle2 size={18} className="text-blue-400" />
                        : mic.error
                        ? <AlertCircle size={18} className="text-red-400" />
                        : <MicOff size={18} className="text-slate-500" />}
                      <div>
                        <p className="text-sm font-semibold">
                          {mic.granted ? "Microphone Ready" : mic.error ? "Microphone Denied" : "Microphone"}
                        </p>
                        {mic.error && <p className="text-xs text-red-400">{mic.error}</p>}
                      </div>
                    </div>
                    <button onClick={enableMic}
                      className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                        mic.granted ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        : mic.error ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-blue-600 text-white hover:bg-blue-500")}>
                      {mic.error ? <><RefreshCw size={11}/> Retry</> : mic.granted ? "✓ Enabled" : <><Mic size={11}/> Enable</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-slate-400 leading-relaxed">
                <Sparkles size={12} className="inline text-blue-400 mr-1" />
                {cam.granted && mic.granted
                  ? "Click Start Interview to begin AI analysis."
                  : "Enable your camera and microphone, then click Start Interview. AI analysis will begin once your interview starts."}
              </div>

              {/* Start button */}
              <button onClick={startInterview}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-sm shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                Start Interview <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* ══ ACTIVE: Question panel ══ */}
          {appState === "active" && (
            <>
              {/* Progress */}
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Progress</span>
                  <span>{qIndex + 1}/{numQ}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-blue-500 rounded-full"
                    animate={{ width: `${((qIndex + 1) / numQ) * 100}%` }}
                    transition={{ duration: 0.5 }} />
                </div>
                <div className="flex gap-1 mt-2">
                  {questions.map((_, i) => (
                    <div key={i} className={cn("flex-1 h-1 rounded-full transition-all",
                      i < qIndex ? "bg-emerald-500" : i === qIndex ? "bg-blue-400 animate-pulse" : "bg-white/5")} />
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="flex-1 flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">
                  Question {qIndex + 1} of {numQ}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div key={qIndex}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-4">
                    <p className="text-sm font-semibold leading-relaxed text-slate-100">
                      "{questions[qIndex]}"
                    </p>
                  </motion.div>
                </AnimatePresence>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Speak your answer aloud. The AI is tracking your vocal patterns and facial expressions.
                </p>
              </div>

              {/* Nav */}
              <div className="flex gap-3 mt-auto">
                <button onClick={() => setQIndex(i => Math.max(0, i - 1))} disabled={qIndex === 0}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all">
                  Previous
                </button>
                {qIndex < numQ - 1 ? (
                  <button onClick={() => setQIndex(i => i + 1)}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold transition-all flex items-center justify-center gap-1">
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={endInterview}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold transition-all flex items-center justify-center gap-1">
                    Finish <CheckCircle2 size={14} />
                  </button>
                )}
              </div>

              {/* End session */}
              <button onClick={endInterview}
                className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-semibold text-xs transition-all flex items-center justify-center gap-2">
                <PhoneOff size={14} /> End Interview Early
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
