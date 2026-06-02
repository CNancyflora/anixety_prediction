"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings, MessageSquare,
  Sparkles, CheckCircle2, TrendingUp, Brain, Heart, Activity, Wind,
  AlertCircle, Send, X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mini Sparkline Graph Component
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const max = Math.max(...data) + 10;
  const min = Math.min(...data) - 10;
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-12 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,100 ${points} 100,100`}
        fill={`url(#grad-${color.replace('#', '')})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-md"
      />
    </svg>
  );
};

// Animated Audio Waveform Component
const AudioWaveform = ({ isActive, volume }: { isActive: boolean, volume: number }) => {
  return (
    <div className="flex items-center gap-1 h-4 ml-2">
      {[1, 2, 3, 4].map((i) => {
        const height = isActive 
          ? Math.max(4, Math.min(16, (volume / 255) * 30 * (Math.random() * 0.5 + 0.5))) 
          : 4;
        return (
          <motion.div 
            key={i}
            className={cn("w-1 rounded-full", isActive ? "bg-blue-400" : "bg-slate-600")}
            animate={{ height }}
            transition={{ type: "tween", duration: 0.1 }}
          />
        );
      })}
    </div>
  );
};

export default function InterviewPage() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  
  const [anxietyLevel, setAnxietyLevel] = useState(18);
  const [confidenceLevel, setConfidenceLevel] = useState(82);
  const [timer, setTimer] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);

  const [anxietyHistory, setAnxietyHistory] = useState<number[]>([25, 24, 22, 20, 19, 18]);
  const [confidenceHistory, setConfidenceHistory] = useState<number[]>([75, 76, 78, 80, 81, 82]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hello! Welcome to your CalmHire mock interview session. Remember to take your time with your answers. We are evaluating your thought process, not just correctness." }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChat]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "I noted your response. Keep maintaining your pacing and eye contact." 
      }]);
    }, 1500);
  };

  const questions = [
    "Can you walk me through a complex technical challenge you recently faced, how you approached it, and the ultimate outcome?",
    "Describe a time when you had a disagreement with a team member. How did you resolve it?",
    "What is your approach to learning a new technology or framework quickly?",
    "Where do you see your technical career heading in the next 3 to 5 years?",
    "How do you handle tight deadlines and high-pressure situations?",
    "Tell me about a time you had to pivot your strategy completely in the middle of a project.",
    "What's the most innovative solution you've ever implemented?",
    "Describe a situation where you had to lead a project without having direct authority over the team.",
    "How do you ensure quality and maintainability in your code?",
    "What is your proudest professional achievement to date?"
  ];

  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera Stream Logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;
    
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!isActive) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable.", err);
        if (isActive) setIsCameraOn(false);
      }
    };

    if (isCameraOn) {
      startCamera();
    }

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  // Mic Stream & Audio Analysis Logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let animationId: number;
    let isActive = true;

    const startMic = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isActive) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        stream = mediaStream;
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const drawWaveform = () => {
          if (!isActive) return;
          animationId = requestAnimationFrame(drawWaveform);
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          setAudioVolume(avg);
        };
        drawWaveform();
      } catch (err) {
        console.error("Mic access denied or unavailable.", err);
        if (isActive) setIsMicOn(false);
      }
    };

    if (isMicOn) {
      startMic();
    } else {
      setAudioVolume(0);
    }

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isMicOn]);

  // AI Analysis Simulation (Only runs when devices are active)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCameraOn) {
        setAnxietyLevel(prev => {
          const change = Math.floor(Math.random() * 5) - 2; 
          const next = Math.min(Math.max(prev + change, 10), 50);
          setAnxietyHistory(h => [...h.slice(-10), next]);
          return next;
        });
      }
      
      if (isMicOn) {
        setConfidenceLevel(prev => {
          const change = Math.floor(Math.random() * 5) - 2;
          const next = Math.min(Math.max(prev + change, 60), 95);
          setConfidenceHistory(h => [...h.slice(-10), next]);
          return next;
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isCameraOn, isMicOn]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getAnxietyState = (score: number) => {
    if (!isCameraOn) return { label: "Paused", status: "Camera Required", color: "text-slate-500", hex: "#64748b" };
    if (score < 25) return { label: "Low", status: "Stable & Calm", color: "text-blue-400", hex: "#60a5fa" };
    if (score < 40) return { label: "Moderate", status: "Slightly Elevated", color: "text-indigo-400", hex: "#818cf8" };
    return { label: "High", status: "Experiencing Stress", color: "text-purple-400", hex: "#c084fc" };
  };

  const getConfidenceState = (score: number) => {
    if (!isMicOn) return { label: "Paused", status: "Mic Required", color: "text-slate-500", hex: "#64748b" };
    if (score > 80) return { label: "Excellent", status: "Strong Delivery", color: "text-emerald-400", hex: "#34d399" };
    if (score > 65) return { label: "Good", status: "Building Poise", color: "text-teal-400", hex: "#2dd4bf" };
    return { label: "Fair", status: "Needs Support", color: "text-cyan-400", hex: "#22d3ee" };
  };

  const anxietyState = getAnxietyState(anxietyLevel);
  const confidenceState = getConfidenceState(confidenceLevel);

  return (
    <div className="flex h-screen flex-col bg-[#0b0f19] text-white overflow-hidden font-sans">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-200">CalmHire Coach</h2>
            <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", (isCameraOn || isMicOn) ? "bg-emerald-400" : "bg-slate-500")}></span>
                <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", (isCameraOn || isMicOn) ? "bg-emerald-500" : "bg-slate-500")}></span>
              </span>
              {(isCameraOn || isMicOn) ? "Session Active" : "Session Paused"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Time Elapsed</span>
            <div className="text-[15px] font-mono font-medium text-slate-200">{formatTime(timer)}</div>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="relative flex flex-1 overflow-hidden px-8 pb-28 gap-8">
        
        {/* Left Section: Camera & Question */}
        <div className="relative flex-1 flex flex-col gap-6">
          
          <div className="relative flex-1 overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl border border-white/[0.04]">
            
            {/* Real Web Camera Feed */}
            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className={cn(
                  "w-full h-full object-cover transition-all duration-700", 
                  isCameraOn ? "opacity-100 scale-100" : "opacity-0 scale-110"
                )}
              />
              
              {!isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4 bg-slate-950/80 backdrop-blur-sm z-0">
                  <div className="h-20 w-20 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 shadow-2xl">
                    <VideoOff size={28} />
                  </div>
                  <p className="text-sm font-medium">Camera Disabled</p>
                </div>
              )}
            </div>

            {/* Media Status Badges (Top Right) */}
            <div className="absolute top-6 right-6 flex flex-col gap-3 items-end z-20">
              <div className={cn(
                "backdrop-blur-xl px-4 py-2 rounded-2xl border shadow-lg flex items-center gap-2.5 transition-colors duration-300", 
                isCameraOn ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100" : "bg-red-500/10 border-red-500/20 text-red-100"
              )}>
                {isCameraOn ? <Video size={14} className="text-emerald-400" /> : <VideoOff size={14} className="text-red-400" />}
                <span className="text-[11px] font-bold tracking-wide uppercase">{isCameraOn ? "Camera Active" : "Camera Disabled"}</span>
              </div>

              <div className={cn(
                "backdrop-blur-xl px-4 py-2 rounded-2xl border shadow-lg flex items-center gap-2 transition-colors duration-300", 
                isMicOn ? "bg-blue-500/10 border-blue-500/20 text-blue-100" : "bg-red-500/10 border-red-500/20 text-red-100"
              )}>
                {isMicOn ? <Mic size={14} className="text-blue-400" /> : <MicOff size={14} className="text-red-400" />}
                <span className="text-[11px] font-bold tracking-wide uppercase">{isMicOn ? "Mic Active" : "Mic Muted"}</span>
                <AudioWaveform isActive={isMicOn} volume={audioVolume} />
              </div>
            </div>

            {/* Soft AI Facial Analysis (Human-Friendly) */}
            <AnimatePresence>
              {isCameraOn && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none z-10"
                >
                  {/* Subtle soft gradient tracking */}
                  <motion.div 
                    className="absolute top-[25%] left-[40%] w-[20%] h-[30%] rounded-full bg-blue-500/10 blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Soft Floating Badges */}
                  <div className="absolute top-8 left-8 flex flex-col gap-3">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="backdrop-blur-xl bg-slate-900/40 px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg flex items-center gap-2.5"
                    >
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="text-xs font-medium text-slate-100">Eye Contact Strong</span>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="backdrop-blur-xl bg-slate-900/40 px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg flex items-center gap-2.5"
                    >
                      <Wind size={16} className="text-blue-400" />
                      <span className="text-xs font-medium text-slate-100">Calm & Focused</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Current Question Panel (Clean & Modern) */}
          <div className="h-[140px] shrink-0 rounded-[2.5rem] bg-gradient-to-b from-slate-900 to-slate-900/50 p-7 border border-white/[0.04] flex flex-col justify-center relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-indigo-500/10">
                    Question {currentQuestion + 1} of 10
                  </span>
                  <div className="flex gap-1.5 mr-2">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={cn("h-1.5 rounded-full", i < currentQuestion ? "bg-indigo-500 w-5" : i === currentQuestion ? "bg-indigo-400 w-5 animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]" : "bg-slate-800 w-2")} />
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentQuestion(prev => Math.min(prev + 1, 9))}
                  disabled={currentQuestion === 9}
                  className="text-[11px] font-semibold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next Question
                </button>
             </div>
             
             <AnimatePresence mode="wait">
               <motion.p 
                 key={currentQuestion}
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -5 }}
                 transition={{ duration: 0.3 }}
                 className="text-lg font-medium leading-relaxed text-slate-200 relative z-10"
               >
                 "{questions[currentQuestion]}"
               </motion.p>
             </AnimatePresence>
          </div>

        </div>

        {/* Right Section: AI Interview Insights */}
        <div className="w-[420px] flex flex-col gap-6 overflow-y-auto pb-2 pr-2 custom-scrollbar">
          
          {/* AI Coach Assistant Banner */}
          <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-7 relative overflow-hidden shadow-lg shadow-indigo-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex items-center gap-2 mb-5 relative z-10">
              <Sparkles size={20} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-indigo-100">AI Coach Insights</h3>
            </div>
            
            <ul className="space-y-4 relative z-10">
              {isMicOn ? (
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 rounded-full bg-emerald-500/20 p-1.5 border border-emerald-500/10">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  </div>
                  <p className="text-[13px] text-slate-300 leading-snug">Your confidence is steadily improving as you speak. Great projection!</p>
                </li>
              ) : (
                <li className="flex gap-3 items-start opacity-50">
                  <div className="mt-0.5 rounded-full bg-slate-500/20 p-1.5 border border-slate-500/10">
                    <MicOff size={12} className="text-slate-400" />
                  </div>
                  <p className="text-[13px] text-slate-400 leading-snug">Microphone is muted. Unmute for vocal coaching.</p>
                </li>
              )}
              
              {isCameraOn ? (
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 rounded-full bg-blue-500/20 p-1.5 border border-blue-500/10">
                    <CheckCircle2 size={12} className="text-blue-400" />
                  </div>
                  <p className="text-[13px] text-slate-300 leading-snug">Great eye contact maintained. You appear calm and confident.</p>
                </li>
              ) : (
                <li className="flex gap-3 items-start opacity-50">
                  <div className="mt-0.5 rounded-full bg-slate-500/20 p-1.5 border border-slate-500/10">
                    <VideoOff size={12} className="text-slate-400" />
                  </div>
                  <p className="text-[13px] text-slate-400 leading-snug">Camera is disabled. Turn on video for posture coaching.</p>
                </li>
              )}
            </ul>
          </div>

          {/* Confidence Level */}
          <div className="rounded-[2.5rem] bg-slate-900 border border-white/[0.04] p-7 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-slate-400 flex items-center gap-2">
                <TrendingUp size={16} /> Confidence Level
              </h3>
              <span className={cn("text-[11px] font-medium px-3 py-1 rounded-xl border transition-colors", confidenceState.color, confidenceState.color.replace('text-', 'bg-').concat('/10'), confidenceState.color.replace('text-', 'border-').concat('/20'))}>
                {confidenceState.status}
              </span>
            </div>
            <div className="flex items-end gap-3 mb-6">
              <span className={cn("text-5xl font-light tracking-tight transition-colors", confidenceState.color)}>
                {isMicOn ? `${confidenceLevel}%` : "--"}
              </span>
            </div>
            
            <div className={cn("h-14 w-full mt-2 relative transition-opacity", isMicOn ? "opacity-100" : "opacity-30")}>
               <Sparkline data={confidenceHistory} color={confidenceState.hex} />
            </div>
          </div>

          {/* Anxiety Level */}
          <div className="rounded-[2.5rem] bg-slate-900 border border-white/[0.04] p-7 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-slate-400 flex items-center gap-2">
                <Heart size={16} /> Calmness
              </h3>
              <span className={cn("text-[11px] font-medium px-3 py-1 rounded-xl border transition-colors", anxietyState.color, anxietyState.color.replace('text-', 'bg-').concat('/10'), anxietyState.color.replace('text-', 'border-').concat('/20'))}>
                {anxietyState.status}
              </span>
            </div>
            <div className="flex items-end gap-3 mb-6">
              <span className={cn("text-5xl font-light tracking-tight transition-colors", anxietyState.color)}>
                {isCameraOn ? anxietyState.label : "--"}
              </span>
              <span className="text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Stress Level</span>
            </div>
            
            <div className={cn("h-14 w-full mt-2 relative transition-opacity", isCameraOn ? "opacity-100" : "opacity-30")}>
               <Sparkline data={anxietyHistory} color={anxietyState.hex} />
            </div>
          </div>

          {/* Communication Quality */}
          <div className="rounded-[2.5rem] bg-slate-900 border border-white/[0.04] p-7 shadow-xl">
             <h3 className="text-[13px] font-semibold text-slate-400 flex items-center gap-2 mb-6">
                <Activity size={16} /> Communication Quality
             </h3>
             
             <div className="space-y-5 opacity-100 transition-opacity">
                {/* Clarity */}
                <div>
                  <div className="flex justify-between text-[13px] font-medium mb-2.5 text-slate-300">
                    <span>Speaking Clarity</span>
                    <span className={isMicOn ? "text-emerald-400" : "text-slate-500"}>{isMicOn ? "92%" : "Paused"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: isMicOn ? '92%' : '0%' }} className="h-full bg-emerald-400 rounded-full transition-all duration-1000" />
                  </div>
                </div>

                {/* Fluency */}
                <div>
                  <div className="flex justify-between text-[13px] font-medium mb-2.5 text-slate-300">
                    <span>Fluency</span>
                    <span className={isMicOn ? "text-blue-400" : "text-slate-500"}>{isMicOn ? "88%" : "Paused"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: isMicOn ? '88%' : '0%' }} className="h-full bg-blue-400 rounded-full transition-all duration-1000" />
                  </div>
                </div>

                {/* Pacing */}
                <div>
                  <div className="flex justify-between text-[13px] font-medium mb-2.5 text-slate-300">
                    <span>Pacing</span>
                    <span className={isMicOn ? "text-indigo-400" : "text-slate-500"}>{isMicOn ? "Optimal" : "Paused"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden relative">
                    {/* Optimal Range Indicator */}
                    <div className="absolute left-[35%] right-[35%] top-0 bottom-0 bg-indigo-500/20" />
                    <motion.div initial={{ left: 0, opacity: 0 }} animate={{ left: '50%', opacity: isMicOn ? 1 : 0 }} className="absolute top-0 bottom-0 w-2.5 bg-indigo-400 rounded-full -translate-x-1/2 shadow-[0_0_8px_rgba(129,140,248,0.8)] transition-all duration-500" />
                  </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Floating Control Bar */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-30">
        <button 
          onClick={() => setIsMicOn(!isMicOn)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
            isMicOn ? "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white" : "bg-red-500/10 text-red-400"
          )}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button 
          onClick={() => setIsCameraOn(!isCameraOn)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
            isCameraOn ? "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white" : "bg-red-500/10 text-red-400"
          )}
        >
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        
        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        <button 
          onClick={() => { setShowChat(!showChat); setShowSettings(false); }}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
            showChat ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <MessageSquare size={20} />
        </button>
        <button 
          onClick={() => { setShowSettings(!showSettings); setShowChat(false); }}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
            showSettings ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <Settings size={20} />
        </button>
        
        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        <Link 
          href="/dashboard"
          className="flex h-12 px-6 items-center gap-2 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-medium text-[13px]"
        >
          <PhoneOff size={18} />
          End Session
        </Link>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 z-40"
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Settings size={16} className="text-indigo-400" /> Device Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Camera</label>
                <select className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors">
                  <option>Integrated Camera (Default)</option>
                  <option>OBS Virtual Camera</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Microphone</label>
                <select className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors">
                  <option>System Default Mic</option>
                  <option>External USB Microphone</option>
                </select>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-6 w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] font-semibold py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">Done</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[400px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-5 z-40 flex flex-col h-[450px]"
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare size={16} className="text-indigo-400" /> Interviewer Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2 flex flex-col">
              <div className="flex flex-col gap-4 mt-auto">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={cn("flex flex-col gap-1", msg.sender === 'ai' ? "items-start" : "items-end")}>
                    <span className={cn("text-[10px] font-semibold", msg.sender === 'ai' ? "text-indigo-400 ml-1" : "text-slate-400 mr-1")}>
                      {msg.sender === 'ai' ? "AI HR Coach" : "You"}
                    </span>
                    <div className={cn(
                      "border rounded-2xl p-3 max-w-[85%]",
                      msg.sender === 'ai' 
                        ? "bg-indigo-500/10 border-indigo-500/20 rounded-tl-sm text-indigo-100" 
                        : "bg-white/10 border-white/5 rounded-tr-sm text-slate-200"
                    )}>
                      <p className="text-[13px] leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>
            <div className="relative shrink-0">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..." 
                className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-4 pr-12 py-3 text-[13px] text-white focus:outline-none focus:border-indigo-500/50 transition-colors" 
              />
              <button 
                onClick={handleSendMessage}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white transition-colors shadow-lg"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
