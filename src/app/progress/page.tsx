"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, getDocs } from "firebase/firestore";
import type { Assessment, InterviewSession, ProgressDataPoint } from "@/types";

export default function ProgressPage() {
  const [points, setPoints] = useState<ProgressDataPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const assessmentsQ = query(collection(db, "users", user.uid, "assessments"));
          const interviewsQ = query(collection(db, "users", user.uid, "interviews"));
          
          const [aSnap, iSnap] = await Promise.all([getDocs(assessmentsQ), getDocs(interviewsQ)]);
          
          const data: ProgressDataPoint[] = [];
          
          aSnap.docs.forEach(doc => {
            const a = doc.data() as Assessment;
            data.push({
              date: a.completedAt,
              type: "assessment",
              anxiety: a.scores.anxiety,
              confidence: a.scores.confidence,
              readiness: a.scores.readiness,
            });
          });

          iSnap.docs.forEach(doc => {
            const i = doc.data() as InterviewSession;
            if (i.overallScore !== null) {
              data.push({
                date: i.completedAt,
                type: "interview",
                overallScore: i.overallScore,
              });
            }
          });

          data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setPoints(data);
        } catch (e) {
          console.error("Failed to load progress data", e);
        } finally {
          setLoaded(true);
        }
      } else {
        setPoints([]);
        setLoaded(true);
      }
    });

    return () => unsub();
  }, []);

  if (!loaded) return <AppLayout><div className="page-wrap"><div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><div className="spinner spinner-lg" /></div></div></AppLayout>;

  const assessmentPoints = points.filter(p => p.type === "assessment");
  const interviewPoints = points.filter(p => p.type === "interview");

  return (
    <AppLayout>
      <div className="page-wrap">
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-title">My Progress</h1>
          <p className="page-subtitle">Track your anxiety, confidence, and readiness over time based on actual session data.</p>
        </div>

        {points.length <= 1 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>
              </div>
              <h3>Complete more sessions to see your progress.</h3>
              <p>Progress tracking requires multiple data points. Take another assessment or complete mock interviews to build your trends.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <Link href="/assessment" className="btn btn-outline">Take Assessment</Link>
                <Link href="/interview/setup" className="btn btn-primary">Start Mock Interview</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid-2">
            {/* Assessment Trends */}
            <div className="card">
              <div className="card-header"><span className="section-title">Assessment Trends</span></div>
              <div className="card-body">
                {assessmentPoints.length > 1 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {assessmentPoints.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div style={{ width: 60, fontSize: 12, color: "var(--text-3)", textAlign: "right" }}>
                          {new Date(p.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 60, fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>Anxiety</div>
                            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                              <div className="progress-fill" style={{ width: `${p.anxiety}%`, background: p.anxiety! > 66 ? "var(--red)" : p.anxiety! > 33 ? "var(--amber)" : "var(--green)" }} />
                            </div>
                            <div style={{ width: 30, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{p.anxiety}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 60, fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>Confidence</div>
                            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                              <div className="progress-fill" style={{ width: `${p.confidence}%`, background: "var(--blue)" }} />
                            </div>
                            <div style={{ width: 30, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{p.confidence}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 60, fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>Readiness</div>
                            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                              <div className="progress-fill" style={{ width: `${p.readiness}%`, background: "var(--green)" }} />
                            </div>
                            <div style={{ width: 30, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{p.readiness}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center", padding: "20px 0" }}>Take more assessments to view this trend.</div>
                )}
              </div>
            </div>

            {/* Interview Scores */}
            <div className="card">
              <div className="card-header"><span className="section-title">Mock Interview Scores</span></div>
              <div className="card-body">
                {interviewPoints.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {interviewPoints.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 60, fontSize: 12, color: "var(--text-3)", textAlign: "right" }}>
                          {new Date(p.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${p.overallScore}%`, background: p.overallScore! >= 75 ? "var(--green)" : p.overallScore! >= 50 ? "var(--amber)" : "var(--red)" }} />
                        </div>
                        <div style={{ width: 40, fontSize: 14, fontWeight: 700, textAlign: "right" }}>{p.overallScore}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center", padding: "20px 0" }}>Complete mock interviews to see your score trend.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
