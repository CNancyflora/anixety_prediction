"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  BarChart3,
  FileText,
  UserCircle,
  Brain
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: BarChart3, label: "Performance Insights", href: "/analytics" },
  { icon: FileText, label: "Resume Analyzer", href: "/resume" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Guest User";
  const displayEmail = user?.email || "Not signed in";

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-white/5 bg-[#020617]/80 backdrop-blur-2xl lg:block z-50">
      <div className="flex h-full flex-col px-6 py-8">
        {/* Logo Section */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
          >
            <Brain size={26} />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white">CalmHire</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/80">AI Analysis</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
          {/* Core Section */}
          <div>
            <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Core Dashboard</p>
            <nav className="space-y-1.5">
              {sidebarItems.slice(0, 4).map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-bold transition-all duration-300",
                    pathname === item.href 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(
                    "transition-transform duration-300 group-hover:scale-110",
                    pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-blue-400"
                  )} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Career Tools Section */}
          <div>
            <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Career Tools</p>
            <nav className="space-y-1.5">
              {sidebarItems.slice(4, 5).map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-bold transition-all duration-300",
                    pathname === item.href 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(
                    "transition-transform duration-300 group-hover:scale-110",
                    pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-blue-400"
                  )} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* System Section */}
          <div>
            <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">System</p>
            <nav className="space-y-1.5">
              {sidebarItems.slice(5).map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-bold transition-all duration-300",
                    pathname === item.href 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(
                    "transition-transform duration-300 group-hover:scale-110",
                    pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-blue-400"
                  )} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-white overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserCircle size={24} />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{displayName}</span>
              <span className="text-[11px] text-slate-500 truncate">{displayEmail}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-bold text-slate-400 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500">
            <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
