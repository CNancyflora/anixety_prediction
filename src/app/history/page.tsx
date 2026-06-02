"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Zap, 
  Target, 
  MessageSquare,
  History as HistoryIcon,
  Video
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const mockSessions = [
  {
    id: 1,
    date: "2024-05-10",
    time: "14:30",
    type: "Technical Interview",
    anxiety: "Low",
    confidence: 88,
    stress: 24,
    duration: "45m",
    feedback: "Excellent technical knowledge. Eye contact was steady throughout."
  },
  {
    id: 2,
    date: "2024-05-08",
    time: "10:15",
    type: "HR Interview",
    anxiety: "Medium",
    confidence: 72,
    stress: 45,
    duration: "30m",
    feedback: "Solid communication, but showed signs of stress during salary negotiations."
  },
  {
    id: 3,
    date: "2024-05-05",
    time: "16:45",
    type: "System Design",
    anxiety: "Low",
    confidence: 85,
    stress: 30,
    duration: "60m",
    feedback: "Very structured thinking. Voice tone remained calm even during complex parts."
  },
  {
    id: 4,
    date: "2024-05-02",
    time: "11:00",
    type: "Mock Screening",
    anxiety: "High",
    confidence: 55,
    stress: 78,
    duration: "20m",
    feedback: "Fast speech rate detected. Recommendation: Practice controlled breathing."
  }
];

export default function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("calmhire_history");
    if (savedHistory) {
      setSessions(JSON.parse(savedHistory));
    } else {
      setSessions([]);
    }
  }, []);

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.type.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || s.anxiety === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Sidebar />

      <main className="flex-1 w-full lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Session History</h1>
              <p className="text-slate-400 mt-1">Review your past performances and AI feedback.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text"
                  placeholder="Search interviews..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-64 rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <Filter size={18} className="text-slate-500" />
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Levels</option>
                  <option value="Low">Low Anxiety</option>
                  <option value="Medium">Medium Anxiety</option>
                  <option value="High">High Anxiety</option>
                </select>
              </div>
            </div>
          </header>

          {sessions.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="h-32 w-32 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 mb-8 border border-blue-600/20 shadow-lg shadow-blue-500/10">
                <HistoryIcon size={48} />
              </div>
              <h3 className="text-3xl font-black mb-3">No Interview History Yet</h3>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Complete your first mock interview to start tracking your progress.
              </p>
              <Link 
                href="/assessment" 
                className="group flex items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Video size={20} />
                Start Mock Interview
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Sessions List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedSession(session)}
                    className="glass group cursor-pointer rounded-[32px] p-6 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Video size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors">{session.type}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {session.date}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {session.time}</span>
                            <span className="text-slate-700">•</span>
                            <span>{session.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 px-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Anxiety</p>
                          <span className={cn(
                            "text-sm font-black",
                            session.anxiety === "Low" ? "text-emerald-400" : 
                            session.anxiety === "Medium" ? "text-amber-400" : "text-red-400"
                          )}>
                            {session.anxiety}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Confidence</p>
                          <span className="text-sm font-black text-blue-400">{session.confidence}%</span>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Stress Score</p>
                          <span className="text-sm font-black text-white">{session.stress}/100</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500 group-hover:text-white transition-colors">
                        <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">View Report</span>
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center text-slate-600 mb-6">
                    <HistoryIcon size={48} />
                  </div>
                  <h3 className="text-2xl font-bold">No sessions found</h3>
                  <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </>
          )}
        </div>
      </main>

      {/* Detail Modal (Simple Implementation) */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass max-w-2xl w-full rounded-[40px] p-10 border border-white/10 relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedSession(null)}
                className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                  <Zap size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black">{selectedSession.type}</h2>
                  <p className="text-slate-400 font-bold">{selectedSession.date} at {selectedSession.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="rounded-3xl bg-white/5 p-6 border border-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Anxiety Analysis</p>
                  <p className={cn(
                    "text-2xl font-black",
                    selectedSession.anxiety === "Low" ? "text-emerald-400" : "text-amber-400"
                  )}>{selectedSession.anxiety} Risk</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-6 border border-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Confidence Level</p>
                  <p className="text-2xl font-black text-blue-400">{selectedSession.confidence}% High</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <MessageSquare size={16} /> AI Feedback Summary
                  </h4>
                  <div className="rounded-2xl bg-blue-600/10 border border-blue-600/20 p-6 text-slate-300 leading-relaxed italic">
                    "{selectedSession.feedback}"
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-4 font-bold transition-all hover:bg-white/10 flex items-center justify-center gap-2">
                    Download Report
                  </button>
                  <button className="flex-1 rounded-2xl bg-blue-600 py-4 font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95">
                    Practice Similar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
