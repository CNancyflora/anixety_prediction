"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, AlertCircle, Globe, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  // Form state
  const [email, setEmail] = useState("nancy.flora@example.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Please enter your email or username.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    // Simulated async login request
    setTimeout(() => {
      setIsLoading(false);
      // Simulate success for correct dummy credentials
      if (email === "nancy.flora@example.com" && password === "password123") {
        setIsSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setError("Invalid email or password.");
      }
    }, 2000);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-12">
      {/* Background visual flair */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="glass overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-1 shadow-xl backdrop-blur-2xl">
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent p-8 md:p-12">
            {/* Success overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-[#020617]/90 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  >
                    <CheckCircle2 size={80} className="text-emerald-400" />
                  </motion.div>
                  <motion.h3 className="mt-6 text-2xl font-bold text-white">Login Successful</motion.h3>
                  <motion.p className="mt-2 text-slate-400">Redirecting to your dashboard…</motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-10 text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-xl shadow-blue-500/20"
              >
                <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-[#020617]">
                  {/* Placeholder for app logo */}
                  <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l9 21H3L12 2z" /></svg>
                </div>
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400/80 mb-2">CalmHire AI</h2>
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Welcome Back, <span className="text-blue-400">Nancy Flora</span>
                </h1>
                <p className="mt-3 text-slate-400 text-lg font-medium">
                  Prepare smarter. Perform confidently.
                </p>
              </motion.div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-300">Email / Username</label>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nancy.flora@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-[15px] text-white outline-none transition-all focus:border-blue-500/50 focus:bg-blue-500/5 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-semibold text-slate-300">Password</label>
                  <Link href="/forgot-password" className="text-sm font-bold text-blue-400 hover:text-blue-300">Forgot Password?</Link>
                </div>
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-12 text-[15px] text-white outline-none transition-all focus:border-blue-500/50 focus:bg-blue-500/5 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-400"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/10 bg-white/5 checked:bg-blue-500 transition-all"
                  />
                  <CheckCircle2 className="absolute h-5 w-5 scale-0 text-white transition-transform peer-checked:scale-75 pointer-events-none" />
                  <label htmlFor="remember" className="text-sm font-medium text-slate-400 select-none cursor-pointer hover:text-slate-300">
                    Remember me for 30 days
                  </label>
                </div>
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-[15px] font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:shadow-blue-500/30 disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>Sign In <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" /></>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">or continue with</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Social Auth */}
            <div className="grid grid-cols-1 gap-4">
              <button 
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setIsSuccess(true);
                    setTimeout(() => router.push("/dashboard"), 1000);
                  }, 1000);
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20"
              >
                <Globe size={20} className="text-blue-400" />
                Continue with Google
              </button>
            </div>

            {/* Footer – Create Account */}
            <div className="mt-10 text-center">
              <p className="text-slate-400 font-medium text-sm">
                New to CalmHire AI?{' '}
                <Link href="/register" className="font-bold text-blue-400 transition-colors hover:text-blue-300 hover:underline underline-offset-4">
                  Create New Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
