"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getInterview } from "@/lib/storage";
import type { InterviewSession } from "@/types";

export default function InterviewReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setSession(getInterview(id)); setLoaded(true); }, [id]);

  if (!loaded) return <AppLayout><div className="page-wrap"><div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><div className="spinner spinner-lg" /></div></div></AppLayout>;

  if (!session) return (
    <AppLayout><div className="page-wrap">
      <div className="empty-state"><h3>Report not found</h3><p>This session may have been deleted or the link is invalid.</p>
        <Link href="/history" className="btn btn-primary">View All Sessions</Link></div>
    </div></AppLayout>
  );

  const s = session.componentScores;
  const comp = session.completedAt;
  const dur = Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000);

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/history" style={{ fontSize: 13, color: "var(--text-3)" }}>← Interview History</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>Interview Report</h1>
          <p className="page-subtitle">{new Date(comp).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {session.type} · {session.difficulty} · {session.questions.length} questions</p>
        </div>

        {/* Overall Score */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ textAlign: "center", padding: "8px 24px", borderRight: "1px solid var(--border)" }}>
              <div className="label-cap" style={{ marginBottom: 6 }}>Overall Score</div>
              {session.overallScore !== null ? (
                <div style={{ fontSize: 52, fontWeight: 800, color: scoreColor(session.overallScore), lineHeight: 1 }}>{session.overallScore}<span style={{ fontSize: 22, color: "var(--text-3)" }}>%</span></div>
              ) : (
                <div style={{ fontSize: 14, color: "var(--text-3)" }}>Not available</div>
              )}
              {session.overallScore !== null && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{session.overallScore >= 75 ? "Good performance" : session.overallScore >= 50 ? "Developing" : "Needs practice"}</div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
              <Stat label="Duration" value={`${Math.floor(dur / 60)}m ${dur % 60}s`} />
              <Stat label="Questions" value={`${session.responses.length}/${session.questions.length}`} />
              <Stat label="Type" value={session.type} cap />
              <Stat label="Difficulty" value={session.difficulty} cap />
            </div>
          </div>
        </div>

        {/* Component Scores */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="section-title">Performance Breakdown</span></div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.6 }}>
              Scores are calculated from your actual recorded responses. "Not available" appears when a metric could not be measured.
            </p>
            <ComponentRow label="Communication" score={s.communication} desc="Speech-to-silence ratio and volume consistency." />
            <ComponentRow label="Speaking Confidence Indicator" score={s.speakingConfidence} desc="Composite of pause count, filler words, and WPM." />
            <ComponentRow label="Answer Structure" score={s.answerStructure} desc="Based on word count and response completeness (where available)." />
            <ComponentRow label="Voice Clarity" score={s.voiceClarity} desc="Speaking rate alignment with recommended 80–150 WPM." />
            <ComponentRow label="Response Time" score={s.responseTime} desc="Time from question display to speech start (optimal: 2–8 seconds)." />
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="section-title">Question-by-Question</span></div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>#</th><th>Question</th><th>Response Time</th><th>Duration</th><th>Pauses</th><th>WPM</th><th>Fillers</th></tr></thead>
              <tbody>
                {session.responses.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: "var(--text-3)" }}>{i + 1}</td>
                    <td style={{ maxWidth: 200, fontSize: 12 }}>{r.questionText}</td>
                    <td>{r.responseTime !== null ? `${r.responseTime.toFixed(1)}s` : <span style={{ color: "var(--text-3)" }}>N/A</span>}</td>
                    <td>{r.metrics ? `${r.metrics.totalDuration.toFixed(0)}s` : <span style={{ color: "var(--text-3)" }}>N/A</span>}</td>
                    <td>{r.metrics ? r.metrics.pauseCount : <span style={{ color: "var(--text-3)" }}>N/A</span>}</td>
                    <td>{r.metrics?.wordsPerMinute ?? <span style={{ color: "var(--text-3)" }}>N/A</span>}</td>
                    <td>{r.metrics?.fillerWordCount ?? <span style={{ color: "var(--text-3)" }}>N/A</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strengths */}
        {session.strengths.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="section-title" style={{ color: "var(--green)" }}>✓ Strengths</span></div>
            <div className="card-body">
              {session.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < session.strengths.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 14, color: "var(--text-2)" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvements */}
        {session.improvements.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="section-title" style={{ color: "var(--amber)" }}>Areas to Improve</span></div>
            <div className="card-body">
              {session.improvements.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < session.improvements.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ color: "var(--amber)", fontWeight: 700 }}>→</span>
                  <span style={{ fontSize: 14, color: "var(--text-2)" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {session.feedback.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="section-title">Detailed Feedback</span></div>
            <div className="card-body">
              {session.feedback.map((f, i) => (
                <div key={i} style={{ padding: "14px 0", borderBottom: i < session.feedback.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: f.type === "positive" ? "var(--green)" : f.type === "negative" ? "var(--amber)" : "var(--text-3)", marginBottom: 4 }}>{f.category}</div>
                  <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }}>{f.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/interview/setup" className="btn btn-primary">Practice Again</Link>
          <Link href="/progress" className="btn btn-outline">View Progress</Link>
          <Link href="/history" className="btn btn-outline">All Sessions</Link>
        </div>
      </div>
    </AppLayout>
  );
}

function scoreColor(s: number): string {
  if (s >= 67) return "var(--green)";
  if (s >= 34) return "var(--amber)";
  return "var(--red)";
}

function Stat({ label, value, cap }: { label: string; value: string; cap?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 14, textTransform: cap ? "capitalize" : "none" }}>{value}</div>
    </div>
  );
}

function ComponentRow({ label, score, desc }: { label: string; score: number | null; desc: string }) {
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{desc}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
          {score !== null ? (
            <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(score) }}>{score}%</span>
          ) : (
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>Not available</span>
          )}
        </div>
      </div>
      {score !== null && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${score}%`, background: scoreColor(score) }} />
        </div>
      )}
    </div>
  );
}
