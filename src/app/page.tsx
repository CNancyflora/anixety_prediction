"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Camera, Mic, Shield, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 1 }}
      >
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <Brain size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">CalmHire AI</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">

          <Link href="/coach" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Real-Time Coaching</Link>
          <Link href="/analytics" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Confidence Tracking</Link>
          <Link href="/history" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Anxiety Insights</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/10">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            Next-Gen AI Behavioral Analysis
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            Master Your Interviews with <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CalmHire AI
            </span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-secondary md:text-xl">
            Real-time anxiety prediction and behavioral analytics. Build confidence, 
            perfect your delivery, and land your dream job with AI-driven coaching.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link 
              href="/dashboard"
              className="rounded-xl bg-primary px-12 py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            { icon: Brain, title: "Emotion Recognition", desc: "Advanced facial analysis tracks real-time stress and micro-expressions." },
            { icon: Mic, title: "Voice Confidence", desc: "AI-powered voice tone and speech pattern analysis for perfect delivery." },
            { icon: Camera, title: "Posture Analysis", desc: "Maintain a professional stance with real-time body language feedback." },
            { icon: TrendingUp, title: "Growth Analytics", desc: "Detailed tracking of your confidence and communication improvements." },
            { icon: Shield, title: "Privacy First", desc: "Enterprise-grade security ensuring your session data remains confidential." },
            { icon: Users, title: "HR Simulations", desc: "Practice with industry-specific assessments tailored to your resume." }
          ].map((feature, i) => (
            <div 
              key={i}
              className="glass group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:border-primary/50"
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <feature.icon size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-secondary">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
    </motion.div>
    </>
  );
}
