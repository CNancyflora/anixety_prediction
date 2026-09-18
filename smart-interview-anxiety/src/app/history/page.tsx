"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import type { InterviewSession } from "@/types";

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, "users", user.uid, "interviews"),
            orderBy("createdAt", "desc")
          );
          const snap = await getDocs(q);
          const data = snap.docs.map(doc => doc.data() as InterviewSession);
          setInterviews(data);
        } catch (e) {
          console.error("Failed to fetch interview history:", e);
          setInterviews([]);
        } finally {
          setLoaded(true);
        }
      } else {
        setInterviews([]);
        setLoaded(true);
      }
    });

    return () => unsub();
  }, []);

  if (!loaded) return <AppLayout><div className="page-wrap"><div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><div className="spinner spinner-lg" /></div></div></AppLayout>;

  return (
    <AppLayout>
      <div className="page-wrap">
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-title">Interview History</h1>
          <p className="page-subtitle">Review your past mock interview sessions and performance reports.</p>
        </div>

        {interviews.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5M12 7v5l4 2" /></svg>
              </div>
              <h3>You haven't completed an interview yet.</h3>
              <p>Complete a mock interview to start building your history.</p>
              <Link href="/interview/setup" className="btn btn-primary">Start Mock Interview</Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Questions</th>
                    <th>Overall Score</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map(session => {
                    const d = new Date(session.completedAt);
                    const dur = Math.round((d.getTime() - new Date(session.startedAt).getTime()) / 1000);
                    const durStr = `${Math.floor(dur / 60)}m ${dur % 60}s`;
                    const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    
                    return (
                      <tr key={session.id}>
                        <td style={{ fontWeight: 500 }}>{dateStr}</td>
                        <td style={{ textTransform: "capitalize" }}>{session.type} <span style={{ color: "var(--text-3)", fontSize: 12 }}>({session.difficulty})</span></td>
                        <td>{durStr}</td>
                        <td>{session.responses.length}/{session.questions.length} completed</td>
                        <td>
                          {session.overallScore !== null ? (
                            <span className={scoreBadgeClass(session.overallScore)}>{session.overallScore}%</span>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--text-3)" }}>N/A</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link href={`/interview/report/${session.id}`} className="btn btn-outline btn-sm">View Report</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function scoreBadgeClass(s: number) {
  if (s >= 75) return "badge badge-green";
  if (s >= 50) return "badge badge-amber";
  return "badge badge-red";
}
