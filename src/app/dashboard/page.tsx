"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  ShieldAlert, 
  Video, 
  Clock, 
  History, 
  TrendingUp,
  ChevronRight
} from "lucide-react";

export default function DashboardPage() {
  const pathname = usePathname();
  const [hasHistory, setHasHistory] = useState<boolean | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("calmhire_history");
    if (savedHistory && JSON.parse(savedHistory).length > 0) {
      setHasHistory(true);
    } else {
      setHasHistory(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 w-full lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Welcome back, Nancy</h1>
              <p className="text-slate-400 mt-1">Ready to ace your next technical interview?</p>
            </div>
            <Link 
              href="/interview"
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 sm:self-center"
            >
              <Video size={20} />
              Start Mock Interview
            </Link>
          </header>

          {/* Stats Grid */}
          <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Overall Score", value: hasHistory ? "84/100" : "0", trend: hasHistory ? "+5.2%" : "-", icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: "Anxiety Level", value: hasHistory ? "Low" : "-", trend: hasHistory ? "Stable" : "-", icon: ShieldAlert, color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { label: "Total Sessions", value: hasHistory ? "12" : "0", trend: hasHistory ? "+2 this week" : "-", icon: Video, color: "text-indigo-400", bg: "bg-indigo-400/10" },
              { label: "Focus Time", value: hasHistory ? "8.4h" : "0h", trend: hasHistory ? "+1.2h" : "-", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
            ].map((stat, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="glass rounded-[32px] p-8 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className={cn("rounded-2xl p-3 shadow-lg transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                    {stat.trend}
                  </span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-black">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Recent Sessions */}
            <div className="lg:col-span-2">
              <div className="glass overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/5 p-6">
                  <h3 className="text-xl font-bold">Recent Mock Interviews</h3>
                  <button className="text-sm font-medium text-primary hover:underline">View All</button>
                </div>
                <div className="divide-y divide-white/5">
                  {[].map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-6 transition-colors hover:bg-white/5">
                      {/* Empty state handled below */}
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-secondary">
                      <History size={32} />
                    </div>
                    <p className="font-semibold text-white">No Recent Assessments</p>
                    <p className="mt-1 text-sm text-secondary">Complete your first analysis to see your history here.</p>
                    <Link 
                      href="/assessment" 
                      className="mt-6 rounded-xl bg-primary/10 px-6 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
                    >
                      Start First Analysis
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div>
              <div className="glass rounded-2xl p-6 h-full">
                <h3 className="mb-6 text-xl font-bold">AI Insights</h3>
                
                {hasHistory ? (
                  <div className="space-y-6">
                  <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                    <p className="mb-2 text-sm font-bold text-primary flex items-center gap-2">
                      <Zap size={16} /> Key Strength
                    </p>
                    <p className="text-sm text-secondary">Your eye contact remains consistent even during complex technical questions.</p>
                  </div>
                  <div className="rounded-xl bg-orange-500/5 p-4 border border-orange-500/10">
                    <p className="mb-2 text-sm font-bold text-orange-500 flex items-center gap-2">
                      <TrendingUp size={16} /> Area for Improvement
                    </p>
                    <p className="text-sm text-secondary">Try reducing speech pauses when explaining architectural decisions.</p>
                  </div>
                  <div className="pt-4">
                    <p className="mb-4 text-sm font-semibold">Anxiety Trend</p>
                    <div className="h-2 w-full rounded-full bg-white/5">
                      <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-green-500 to-primary" />
                    </div>
                    <p className="mt-2 text-xs text-secondary text-center">30% reduction in stress levels over last 5 sessions</p>
                  </div>
                </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[250px] text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-500">
                      <TrendingUp size={24} />
                    </div>
                    <p className="text-sm font-semibold text-white">No Insights Yet</p>
                    <p className="mt-1 text-xs text-slate-500 px-4">Complete your first assessment to unlock personalized AI behavioral analysis.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
