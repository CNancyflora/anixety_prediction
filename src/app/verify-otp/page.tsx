"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reset_email');
    if (!storedEmail) {
      router.replace('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (countdown === 0) {
      setError("This OTP has expired. Please request a new OTP.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });
      
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Unexpected server response:", text);
        throw new Error("The verification service returned an invalid response.");
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to verify OTP');
      
      router.push('/reset-password');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      
      if (err.message.includes('Too many incorrect attempts') || err.message.includes('expired')) {
        setTimeout(() => router.push('/forgot-password'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setError("");
    setResending(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Unexpected server response:", text);
        throw new Error("The password reset service returned an invalid response.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to resend OTP');
      
      setCountdown(300);
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while resending.');
    } finally {
      setResending(false);
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

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "var(--text)", textAlign: "center" }}>
          Verify OTP
        </h2>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24, textAlign: "center" }}>
            We've sent a 6-digit verification code to your registered email.
          </p>
          
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{ width: 44, height: 52, fontSize: 24, textAlign: "center", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", outline: "none" }}
              />
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: 24, fontSize: 14, color: countdown > 60 ? "var(--text-2)" : "var(--red)", fontWeight: 500 }}>
            {countdown > 0 ? (
              <>OTP expires in: <br/><span style={{ fontSize: 20, fontWeight: 700, marginTop: 4, display: "inline-block" }}>{formatTime(countdown)}</span></>
            ) : (
              "OTP Expired"
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || countdown === 0}>
            {loading ? <><span className="spinner" /> Verifying…</> : "Verify OTP"}
          </button>
          
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-2)" }}>
            Didn't receive the OTP? <br/>
            {resendCooldown > 0 ? (
              <span style={{ color: "var(--text-3)", marginTop: 8, display: "inline-block" }}>Resend OTP in {resendCooldown} seconds</span>
            ) : (
              <button type="button" onClick={handleResend} disabled={resending} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 600, cursor: "pointer", marginTop: 8, padding: 0 }}>
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
