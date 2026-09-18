"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveProfile } from "@/lib/storage";
import type { UserProfile } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !loading) {
        router.replace("/dashboard");
      }
    });
    return unsub;
  }, [router, loading]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.fullName });
      
      // Initialize profile with default values, they can edit later
      const profile: UserProfile = {
        uid: cred.user.uid,
        fullName: form.fullName,
        email: form.email,
        education: "",
        college: "",
        targetRole: "General",
        experienceLevel: "fresher",
        interviewGoal: "",
        createdAt: new Date().toISOString(),
      };
      await saveProfile(cred.user.uid, profile);
      
      router.replace("/dashboard");
    } catch (err: any) {
      const code = err.code || "";
      if (code.includes("email-already-in-use")) setError("An account with this email already exists.");
      else if (code.includes("invalid-email")) setError("Please enter a valid email address.");
      else setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-name">CalmHire</div>
          <div className="auth-logo-tag">Create your account to get started</div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" required value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Your full name" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" required value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" required value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 6 characters" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" className="form-input" required value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Repeat password" />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 24 }}>
            {loading ? <><span className="spinner" /> Creating account…</> : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)", marginTop: 20 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--blue)", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
