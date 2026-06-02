"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Video, 
  Sparkles, 
  BarChart3, 
  History, 
  FileText, 
  Settings, 
  LogOut,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { icon: Video, label: "AI Interview Session", href: "/interview" },
  { icon: Sparkles, label: "Real-Time Coaching", href: "/coach" },
  { icon: BarChart3, label: "Confidence Tracking", href: "/analytics" },
  { icon: History, label: "Anxiety Insights", href: "/history" },
];

const secondaryNavItems = [
  { icon: FileText, label: "Resume Analyzer", href: "/resume" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Simple redirect to login or home
    router.push("/login");
  };

  return (
    <header className="relative w-full border-b border-white/5 bg-[#020617]/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-start gap-6">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 w-full justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
              >
                <Brain size={22} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">CalmHire</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-500/80">AI Analysis</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col w-full gap-2">
            <Link
              href="/dashboard"
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300",
                pathname === "/dashboard" 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              Overview
            </Link>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-300 border",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 border-blue-600" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"
                  )}
                >
                  <item.icon size={16} className={cn(
                    "transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"
                  )} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Section */}
          <div className="flex w-full items-center justify-between gap-4 pt-4 border-t border-white/5">
            {/* Secondary Tools */}
            <div className="flex items-center gap-1 border-r border-white/5 pr-4 mr-2">
              {secondaryNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 border",
                      isActive 
                        ? "bg-blue-600/10 text-blue-400 border-blue-600/20 shadow-inner" 
                        : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"
                    )}
                  >
                    <item.icon size={18} className={cn(
                      "transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"
                    )} />
                  </Link>
                );
              })}
            </div>

            {/* Profile Dropdown or simple logout icon */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 text-white">
                <UserCircle size={20} />
              </div>
              <button 
                onClick={handleLogout}
                className="group flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
                title="Logout"
              >
                <LogOut size={18} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
