"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLatestAssessment } from "@/lib/storage";
import { anxietyInsight, confidenceInsight, readinessInsight, anxietyColor, scoreColor } from "@/lib/scoring";
import type { Assessment } from "@/types";

export default function AssessmentResultsPage() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => { setAssessment(getLatestAssessment()); }, []);

  if (!assessment) return (
    <AppLayout>
      <div className="page-wrap">
        <div className="empty-state">
          <h3>No assessment found</h3>
          <p>Please complete an assessment first.</p>
          <Link href="/assessment" className="btn btn-primary">Take Assessment</Link>
        </div>
      </div>
    </AppLayout>
  );

  const s = assessment.scores;

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <h1 className="page-title">Assessment Complete</h1>
          <p className="page-subtitle">
            Completed {new Date(assessment.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Score Summary */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="section-title">Your Scores</span></div>
          <div className="card-body">
            <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
              <ScoreCard label="Anxiety Level" score={s.anxiety} level={s.anxietyLevel} colorFn={anxietyColor} invertedBadge />
              <ScoreCard label="Confidence" score={s.confidence} level={s.confidence >= 67 ? "High" : s.confidence >= 34 ? "Medium" : "Low"} colorFn={scoreColor} />
              <ScoreCard label="Readiness" score={s.readiness} level={s.readiness >= 67 ? "High" : s.readiness >= 34 ? "Medium" : "Low"} colorFn={scoreColor} />
            </div>
            <div className="grid-2" style={{ gap: 16 }}>
              <ScoreCard label="Experience" score={s.experience} level={s.experience >= 67 ? "High" : s.experience >= 34 ? "Medium" : "Low"} colorFn={scoreColor} small />
              <ScoreCard label="Communication" score={s.communication} level={s.communication >= 67 ? "High" : s.communication >= 34 ? "Medium" : "Low"} colorFn={scoreColor} small />
            </div>

            {/* Overall Readiness */}
            <div style={{ marginTop: 20, padding: "16px 20px", background: "var(--navy)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Overall Interview Readiness</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Weighted from all 5 categories</div>
              </div>
              <div style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>{s.overallReadiness}<span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>%</span></div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="section-title">What Your Scores Mean</span></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InsightRow label="Anxiety" color={anxietyColor(s.anxiety)} text={anxietyInsight(s.anxiety)} />
            <InsightRow label="Confidence" color={scoreColor(s.confidence)} text={confidenceInsight(s.confidence)} />
            <InsightRow label="Readiness" color={scoreColor(s.readiness)} text={readinessInsight(s.readiness)} />
          </div>
        </div>

        {/* Recommended Practice */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="section-title">Recommended for You</span></div>
          <div className="card-body">
            <p style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 20, lineHeight: 1.6 }}>
              These recommendations are based on your assessment responses. The areas listed below are where focused practice will have the most impact.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {assessment.recommendations.map((r, i) => (
                <div key={r.id} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px", border: "1px solid var(--border)", borderRadius: 9 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--blue-50)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 8 }}>{r.reason}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>Estimated duration: {r.duration}</div>
                  </div>
                  <Link href={r.href} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Start Practice</Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/dashboard" className="btn btn-outline">← Back to Dashboard</Link>
          <Link href="/progress" className="btn btn-outline">View Progress</Link>
          <Link href="/assessment" className="btn btn-primary">Retake Assessment</Link>
        </div>
      </div>
    </AppLayout>
  );
}

function ScoreCard({ label, score, level, colorFn, invertedBadge, small }: {
  label: string; score: number; level: string; colorFn: (n: number) => string; invertedBadge?: boolean; small?: boolean;
}) {
  const color = invertedBadge ? (score <= 33 ? "var(--green)" : score <= 66 ? "var(--amber)" : "var(--red)") : colorFn(score);
  const badgeClass = invertedBadge
    ? (score <= 33 ? "badge badge-green" : score <= 66 ? "badge badge-amber" : "badge badge-red")
    : (score >= 67 ? "badge badge-green" : score >= 34 ? "badge badge-amber" : "badge badge-red");
  return (
    <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 9, background: "var(--card)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: small ? 28 : 36, fontWeight: 800, color, lineHeight: 1 }}>{score}<span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)" }}>%</span></div>
        <span className={badgeClass} style={{ marginBottom: 4 }}>{level}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function InsightRow({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 4, borderRadius: 99, background: color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }}>{text}</div>
      </div>
    </div>
  );
}
