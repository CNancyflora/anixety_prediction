"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "Inter, sans-serif" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0F2545", letterSpacing: "-0.5px" }}>CalmHire</div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ padding: "9px 20px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 14, fontWeight: 600, color: "#0F172A", textDecoration: "none" }}>Sign In</Link>
          <Link href="/register" style={{ padding: "9px 20px", borderRadius: 7, background: "#1D4ED8", fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "80px 24px 60px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1D4ED8", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 99, marginBottom: 20, border: "1px solid #DBEAFE" }}>
          Interview Preparation Platform
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1px", color: "#0F2545", marginBottom: 20 }}>
          Prepare Better.<br />Speak Confidently.<br />Interview Ready.
        </h1>
        <p style={{ fontSize: 18, color: "#475569", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 36px" }}>
          CalmHire helps you measure your interview readiness, practice with real recordings, and track your improvement through measurable performance data.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{ padding: "14px 32px", borderRadius: 9, background: "#1D4ED8", fontSize: 16, fontWeight: 700, color: "#fff", textDecoration: "none" }}>Start Preparing — It's Free</Link>
          <Link href="/login" style={{ padding: "14px 32px", borderRadius: 9, background: "#fff", border: "1px solid #E2E8F0", fontSize: 16, fontWeight: 600, color: "#0F172A", textDecoration: "none" }}>Sign In</Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ background: "#F8FAFC", padding: "60px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0F2545" }}>Everything you need to succeed</h2>
            <p style={{ fontSize: 15, color: "#475569", marginTop: 8 }}>Real practice. Real metrics. Real improvement.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: "📋", title: "Anxiety & Readiness Assessment", desc: "A structured questionnaire that calculates your real anxiety, confidence, and readiness scores — and generates a personalized practice plan." },
              { icon: "🎙️", title: "Practice with Real Recording", desc: "Record your answers to self-introduction, HR questions, and speaking exercises. Get actual audio metrics, not simulated scores." },
              { icon: "🎥", title: "Mock Interview Session", desc: "Full camera + microphone interview with real questions. Response time, speech rate, and filler words are actually measured." },
              { icon: "📊", title: "Measurable Performance Report", desc: "After every session, see your real speaking confidence indicator, pause count, WPM, and answer structure — with rule-based feedback." },
              { icon: "📈", title: "Progress Tracking", desc: "Track anxiety, confidence, and readiness trends across sessions. Every data point comes from your actual practice history." },
              { icon: "📄", title: "Resume Analyzer", desc: "Upload your resume and get a structured checklist review of sections, keywords, and completeness — no invented ATS scores." },
            ].map(f => (
              <div key={f.title} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0F2545", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "60px 24px", maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F2545", textAlign: "center", marginBottom: 40 }}>How CalmHire works</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { n: "1", title: "Take the Assessment", desc: "Answer 25 questions across anxiety, confidence, readiness, experience, and communication." },
            { n: "2", title: "Get Your Scores", desc: "Receive calculated scores for each area and a personalized practice recommendation." },
            { n: "3", title: "Practice Targeted Skills", desc: "Complete the recommended practice sessions — self-introduction, speaking, or HR questions." },
            { n: "4", title: "Attend a Mock Interview", desc: "Join a full mock interview session with camera and mic. Real questions, real recording." },
            { n: "5", title: "Review Your Report", desc: "See your speaking metrics, response time, filler word count, and structured feedback." },
            { n: "6", title: "Track & Improve", desc: "Monitor your anxiety and confidence trends across sessions as you improve over time." },
          ].map((s, i, arr) => (
            <div key={s.n} style={{ display: "flex", gap: 20, position: "relative", paddingBottom: i < arr.length - 1 ? 32 : 0 }}>
              {i < arr.length - 1 && <div style={{ position: "absolute", left: 19, top: 40, bottom: 0, width: 2, background: "#E2E8F0" }} />}
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1D4ED8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{s.n}</div>
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0F2545", marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0F2545", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 14 }}>Ready to improve your interviews?</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 28 }}>Create a free account and take your first assessment in minutes.</p>
        <Link href="/register" style={{ padding: "14px 36px", borderRadius: 9, background: "#3B82F6", fontSize: 16, fontWeight: 700, color: "#fff", textDecoration: "none", display: "inline-block" }}>Get Started Free</Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px", textAlign: "center", color: "#94A3B8", fontSize: 13, borderTop: "1px solid #E2E8F0" }}>
        © {new Date().getFullYear()} CalmHire · Interview Preparation Platform
      </footer>
    </div>
  );
}
