"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !loading) {
        router.replace("/dashboard");
      }
    });
    return unsub;
  }, [router, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      const code = err.code || "";
      if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("Incorrect email or password.");
      } else if (code.includes("too-many-requests")) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Login failed. Please check your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-name">CalmHire</div>
          <div className="auth-logo-tag">Prepare Better. Speak Confidently. Interview Ready.</div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "var(--text)" }}>
          Sign in to your account
        </h2>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email" className="form-input" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" className="form-input" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password" autoComplete="current-password"
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}>
            <Link href="/forgot-password" style={{ fontSize: 13, color: "var(--blue)", fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in…</> : "Sign In"}
          </button>
        </form>

        <div className="divider-text" style={{ margin: "20px 0" }}>or</div>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-2)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--blue)", fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
