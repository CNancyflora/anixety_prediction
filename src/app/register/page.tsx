"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple password strength (0‑4)
  const passwordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (passwordStrength() < 3) {
      setError("Choose a stronger password.");
      return;
    }
    if (!termsAccepted) {
      setError("You must accept the Terms & Conditions.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push("/assessment"), 1500);
    }, 1500);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#020617] px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-30" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md glass overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-2xl"
      >
        <div className="rounded-2xl bg-gradient-to-b from-white/5 to-transparent p-8">
          {/* Success overlay */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617]/80 backdrop-blur-md rounded-2xl"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 size={80} className="text-emerald-400" />
                </motion.div>
                <motion.h3 className="mt-4 text-2xl font-bold text-white">Account Created</motion.h3>
                <motion.p className="mt-2 text-slate-400">Redirecting…</motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl"
            >
              <User size={36} className="text-white" />
            </motion.div>
            <h2 className="mt-4 text-sm font-bold uppercase text-blue-400/80">CalmHire AI</h2>
            <h1 className="mt-2 text-2xl font-extrabold text-white">Create Your Account</h1>
            <p className="mt-2 text-slate-400">Start your interview confidence journey.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nancy Flora"
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nancy.flora@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-12 py-2 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 focus:ring-2 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Strength bar */}
              <div className="mt-1 flex space-x-1">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded ${i < passwordStrength() ? "bg-green-500" : "bg-gray-600"}`}
                  />
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-12 py-2 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-blue-500/5 focus:ring-2 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-white/5 checked:bg-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-300">
                I agree to the <a href="#" className="underline text-blue-400">Terms & Conditions</a> and <a href="#" className="underline text-blue-400">Privacy Policy</a>
              </label>
            </div>

            {/* Error alert */}
            <AnimatePresence>{error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400"
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}</AnimatePresence>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>
                Create Account <Globe size={18} />
              </>}
            </motion.button>

            {/* Alternate sign‑up */}
            <div className="text-center text-sm text-slate-400 mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 underline">Login</Link>
            </div>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
