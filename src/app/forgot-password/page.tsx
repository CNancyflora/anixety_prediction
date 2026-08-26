"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const formattedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formattedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formattedEmail })
      });
      
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Unexpected server response:", text);
        throw new Error("The password reset service returned an invalid response.");
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to send OTP');
      
      sessionStorage.setItem('reset_email', formattedEmail);
      router.push('/verify-otp');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
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
          Forgot Password?
        </h2>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>
            Enter the email address registered with your CalmHire account.
          </p>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="text" className="form-input" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Sending…</> : "Send OTP"}
          </button>
          
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href="/login" style={{ fontSize: 14, color: "var(--text-2)", textDecoration: "none" }}>
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
