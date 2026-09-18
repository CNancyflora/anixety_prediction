"use client";

import { motion } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function CoachPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <Sidebar />
      <main className="flex-1 lg:pl-72 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/10">
                <Brain size={48} />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl bg-blue-500/10 blur-2xl"
              />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Track Your Progress
          </h1>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            View your performance analytics and confidence insights from your completed assessments.
          </p>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:scale-[1.03] active:scale-95 text-lg"
          >
            <Brain size={22} />
            View Analytics
            <ChevronRight size={20} />
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
