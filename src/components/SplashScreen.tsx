"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Brain, Sparkles } from "lucide-react";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 0: Logo appears (0-1.5s)
    // Stage 1: App Name appears (1.5-3s)
    // Stage 2: Tagline appears (3-4.5s)
    // Stage 3: Ready to transition (4.5s+)
    
    const timers = [
      setTimeout(() => setStage(1), 1500),
      setTimeout(() => setStage(2), 3000),
      setTimeout(() => setStage(3), 4500),
      setTimeout(() => onComplete(), 5500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#020617]">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: stage >= 1 ? -40 : 0
          }}
          transition={{ duration: 1, ease: "circOut" }}
          className="relative"
        >
          {/* Logo Glow */}
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-blue-500/30 blur-3xl"
          />
          
          <div className="relative flex h-28 w-28 items-center justify-center rounded-[32px] bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-[0_20px_50px_rgba(37,99,235,0.3)]">
            <div className="flex h-full w-full items-center justify-center rounded-[31px] bg-[#020617]">
              <Brain size={56} className="text-white" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles size={24} className="text-blue-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* App Name Section */}
        <div className="mt-8 flex flex-col items-center">
          <AnimatePresence>
            {stage >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <h1 className="text-5xl font-black tracking-tighter text-white md:text-7xl">
                  CalmHire <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">AI</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {stage >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <p className="text-xl font-bold tracking-[0.2em] text-slate-500 uppercase">
                  Stay Calm. Speak Confidently. Get Hired.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Loader */}
        <div className="absolute bottom-[-160px] flex flex-col items-center gap-6 w-[280px]">
          <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 4.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
            />
          </div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-3"
          >
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">
              Calibrating Intelligence
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
