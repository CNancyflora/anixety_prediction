"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDashboardData, loadProfile } from "@/lib/storage";
import type { Assessment, InterviewSession, UserProfile } from "@/types";

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Hello");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latest, setLatest] = useState<Assessment | null>(null);
  const [lastInterview, setLastInterview] = useState<InterviewSession | null>(null);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [totalPractices, setTotalPractices] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const data = getDashboardData();
      setLatest(data.latestAssessment);
      setLastInterview(data.latestInterview);
      setTotalInterviews(data.totalInterviews);
      setTotalPractices(data.totalPractices);
      const p = await loadProfile(user.uid);
      setProfile(p);
      setLoaded(true);
    });
    return unsub;
  }, []);

  const name = profile?.fullName?.split(" ")[0] || "there";
  const scores = latest?.scores;

  return (
    <AppLayout>
      <div className="page-wrap">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-title">{greeting}, {name} 👋</h1>
          <p className="page-subtitle">Let's prepare you for your next interview.</p>
        </div>

        {!loaded ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
              <MetricCard
                label="Interview Readiness"
                value={scores ? `${scores.overallReadiness}%` : null}
                subValue={scores ? `Based on your assessment` : null}
                color={scores ? scoreColor(scores.overallReadiness) : undefined}
                empty="No assessment yet"
              />
              <MetricCard
                label="Confidence"
                value={scores ? `${scores.confidence}%` : null}
                subValue={scores ? confidenceLabel(scores.confidence) : null}
                color={scores ? scoreColor(scores.confidence) : undefined}
                empty="No assessment yet"
              />
              <MetricCard
                label="Anxiety Level"
                value={scores ? scores.anxietyLevel : null}
                subValue={scores ? `${scores.anxiety}% score` : null}
                color={scores ? anxietyColor(scores.anxiety) : undefined}
                empty="No assessment yet"
              />
              <MetricCard
                label="Practice Sessions"
                value={totalPractices + totalInterviews > 0 ? String(totalPractices + totalInterviews) : null}
                subValue={totalInterviews > 0 ? `${totalInterviews} mock interview${totalInterviews !== 1 ? "s" : ""}` : null}
                color="var(--blue-light)"
                empty="No sessions yet"
              />
            </div>

            {/* Assessment CTA or Summary */}
            {!latest ? (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 4 0M9 12h6M9 16h4" /></svg>
                  </div>
                  <h3>No assessment completed yet</h3>
                  <p>Take your first assessment to understand your anxiety level, confidence, and readiness — and get a personalized practice plan.</p>
                  <Link href="/assessment" className="btn btn-primary">Take Your First Assessment</Link>
                </div>
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <span className="section-title">Latest Assessment Results</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>{formatDate(latest.completedAt)}</span>
                </div>
                <div className="card-body">
                  <div className="grid-3" style={{ gap: 16 }}>
                    <ScoreBar label="Confidence" score={scores!.confidence} color="var(--blue-light)" />
                    <ScoreBar label="Readiness" score={scores!.readiness} color="var(--green)" />
                    <ScoreBar label="Communication" score={scores!.communication} color="var(--amber)" />
                  </div>
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                      Based on your results, we recommend starting with:{" "}
                    </span>
                    {latest.recommendations.slice(0, 2).map(r => (
                      <Link key={r.id} href={r.href} className="tag" style={{ margin: "0 4px" }}>{r.title}</Link>
                    ))}
                  </div>
                </div>
                <div className="card-footer">
                  <Link href="/assessment" className="btn btn-outline btn-sm">Retake Assessment</Link>
                </div>
              </div>
            )}

            <div className="grid-2">
              {/* Recommended Actions */}
              <div className="card">
                <div className="card-header"><span className="section-title">Recommended for You</span></div>
                <div className="card-body">
                  {latest?.recommendations?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {latest.recommendations.map(r => (
                        <div key={r.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{r.title}</div>
                            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{r.duration} · {r.reason.slice(0, 80)}…</div>
                          </div>
                          <Link href={r.href} className="btn btn-sm btn-primary" style={{ flexShrink: 0 }}>Start</Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: 24 }}>
                      <p style={{ marginBottom: 12 }}>Complete an assessment to get personalised recommendations.</p>
                      <Link href="/assessment" className="btn btn-sm btn-outline">Take Assessment</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Interview */}
              <div className="card">
                <div className="card-header"><span className="section-title">Last Mock Interview</span></div>
                <div className="card-body">
                  {lastInterview ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{lastInterview.type} Interview</div>
                          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{formatDate(lastInterview.completedAt)} · {lastInterview.difficulty}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {lastInterview.overallScore !== null ? (
                            <div style={{ fontSize: 26, fontWeight: 800, color: scoreColor(lastInterview.overallScore) }}>
                              {lastInterview.overallScore}%
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Score N/A</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link href={`/interview/report/${lastInterview.id}`} className="btn btn-sm btn-outline">View Report</Link>
                        <Link href="/interview/setup" className="btn btn-sm btn-primary">New Interview</Link>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: 24 }}>
                      <p style={{ marginBottom: 12 }}>You haven't completed a mock interview yet.</p>
                      <Link href="/interview/setup" className="btn btn-sm btn-primary">Start Mock Interview</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: 24 }}>
              <div className="section-title" style={{ marginBottom: 14 }}>Quick Start</div>
              <div className="grid-4">
                {[
                  { label: "Take Assessment", href: "/assessment", desc: "Measure readiness & anxiety" },
                  { label: "Self Introduction", href: "/practice/self-intro", desc: "Practice your intro" },
                  { label: "HR Questions", href: "/practice/hr", desc: "5 common HR questions" },
                  { label: "Mock Interview", href: "/interview/setup", desc: "Full interview session" },
                ].map(a => (
                  <Link key={a.href} href={a.href} className="card" style={{ padding: 16, display: "block", textDecoration: "none", transition: "box-shadow 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{a.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>{a.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, subValue, color, empty }: { label: string; value: string | null; subValue: string | null; color?: string; empty: string }) {
  return (
    <div className="card metric-card">
      <div className="metric-label">{label}</div>
      {value !== null ? (
        <>
          <div className="metric-value" style={{ color: color || "var(--text)", fontSize: 26 }}>{value}</div>
          {subValue && <div className="metric-sub">{subValue}</div>}
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>{empty}</div>
      )}
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{score}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function scoreColor(s: number): string {
  if (s >= 67) return "var(--green)";
  if (s >= 34) return "var(--amber)";
  return "var(--red)";
}
function anxietyColor(s: number): string {
  if (s <= 33) return "var(--green)";
  if (s <= 66) return "var(--amber)";
  return "var(--red)";
}
function confidenceLabel(s: number): string {
  if (s >= 70) return "Strong";
  if (s >= 40) return "Developing";
  return "Needs work";
}
function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
