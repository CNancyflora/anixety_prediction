"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reset_email');
    const storedToken = sessionStorage.getItem('reset_token');
    if (!storedEmail || !storedToken) {
      router.replace('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError("Please ensure your password meets all requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    
    try {
      const resetToken = sessionStorage.getItem('reset_token');
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword })
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Unexpected server response:", text);
        throw new Error("The password reset service returned an invalid response.");
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to reset password');
      
      setSuccess(true);
      sessionStorage.removeItem('reset_email');
      sessionStorage.removeItem('reset_token');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      if (err.message.includes('expired') || err.message.includes('Unauthorized')) {
        setTimeout(() => router.push('/forgot-password'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-name">CalmHire</div>
          <div className="auth-logo-tag">Prepare Better. Speak Confidently. Interview Ready.</div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "var(--text)" }}>
          {success ? "Password Reset Successful ✓" : "Create New Password"}
        </h2>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 20, color: "var(--green)", padding: 16, backgroundColor: "rgba(34, 197, 94, 0.1)", borderRadius: 8 }}>
              Your password has been updated successfully.
            </div>
            <Link href="/login" className="btn btn-primary btn-full btn-lg" style={{ textDecoration: "none", display: "inline-block" }}>
              Continue to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password" className="form-input" required
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password" className="form-input" required
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div style={{ marginBottom: 24, fontSize: 13, color: "var(--text-2)", backgroundColor: "var(--bg-2)", padding: 12, borderRadius: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>Password requirements:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ color: hasMinLength ? "var(--green)" : "var(--text-2)" }}>{hasMinLength ? "✓" : "○"}</span> At least 8 characters
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ color: hasLetter ? "var(--green)" : "var(--text-2)" }}>{hasLetter ? "✓" : "○"}</span> Contains a letter
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: hasNumber ? "var(--green)" : "var(--text-2)" }}>{hasNumber ? "✓" : "○"}</span> Contains a number
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Resetting…</> : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
