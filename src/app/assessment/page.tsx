"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ASSESSMENT_QUESTIONS, SCALE_LABELS, calculateScores, generateRecommendations } from "@/lib/scoring";
import { saveAssessment, newId } from "@/lib/storage";
import type { AssessmentResponse } from "@/types";

const CATEGORIES = [
  { key: "anxiety", label: "Interview Anxiety", desc: "Rate how much each statement applies to you. 1 = Very Low, 5 = Very High." },
  { key: "confidence", label: "Self Confidence", desc: "How strongly do you agree with each statement? 1 = Strongly Disagree, 5 = Strongly Agree." },
  { key: "readiness", label: "Preparation & Readiness", desc: "Rate your preparation level for each area. 1 = Very Low, 5 = Very High." },
  { key: "experience", label: "Interview Experience", desc: "Rate your familiarity or exposure to each area. 1 = Very Low, 5 = Very High." },
  { key: "communication", label: "Communication Comfort", desc: "How strongly do you agree with each statement? 1 = Strongly Disagree, 5 = Strongly Agree." },
];

export default function AssessmentPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0 = intro, 1-5 = categories, 6 = submitting
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (u) setUid(u.uid); });
    return unsub;
  }, []);

  const currentCategory = CATEGORIES[step - 1];
  const currentQuestions = step >= 1 && step <= 5
    ? ASSESSMENT_QUESTIONS.filter(q => q.category === currentCategory.key)
    : [];

  const getResponse = (qid: string) => responses.find(r => r.questionId === qid)?.value ?? null;

  const setResponse = (qid: string, value: number) => {
    setResponses(prev => {
      const existing = prev.filter(r => r.questionId !== qid);
      return [...existing, { questionId: qid, value }];
    });
  };

  const canProceed = step === 0 || currentQuestions.every(q => getResponse(q.id) !== null);

  const handleNext = async () => {
    if (step < 5) { setStep(s => s + 1); return; }

    // Step 5 → Submit
    setSubmitting(true);
    const scores = calculateScores(responses);
    const recommendations = generateRecommendations(scores);
    const assessment = {
      id: newId(),
      userId: uid!,
      completedAt: new Date().toISOString(),
      responses,
      scores,
      recommendations,
    };
    await saveAssessment(uid!, assessment);
    router.push("/assessment/results");
  };

  const progress = step === 0 ? 0 : Math.round((step / 5) * 100);

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="page-title">Interview Readiness Assessment</h1>
          <p className="page-subtitle">25 questions across 5 categories · ~5 minutes</p>
        </div>

        {/* Progress */}
        {step > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{CATEGORIES[step - 1]?.label}</span>
              <span style={{ color: "var(--text-3)" }}>Section {step} of 5</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill progress-blue" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Intro */}
        {step === 0 && (
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Before you begin</h2>
              <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>
                This assessment measures your current interview readiness across five areas:
                <strong> Anxiety, Confidence, Readiness, Experience,</strong> and <strong>Communication.</strong>
              </p>
              <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>
                Each question uses a <strong>1–5 scale</strong> where 1 = Very Low / Strongly Disagree and 5 = Very High / Strongly Agree.
              </p>
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                Answer honestly. Your scores are calculated directly from your responses — there are no right or wrong answers.
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {CATEGORIES.map((c, i) => (
                  <li key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-2)" }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--blue-50)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    {c.label} — 5 questions
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary btn-lg btn-full" onClick={() => setStep(1)}>
                Begin Assessment →
              </button>
            </div>
          </div>
        )}

        {/* Question sections */}
        {step >= 1 && step <= 5 && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-title">{currentCategory.label}</div>
                <div className="section-subtitle">{currentCategory.desc}</div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {currentQuestions.map((q, qi) => {
                  const val = getResponse(q.id);
                  return (
                    <div key={q.id}>
                      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
                        <span style={{ color: "var(--text-3)", fontWeight: 700, marginRight: 6 }}>{qi + 1}.</span>
                        {q.text}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            className={`scale-btn${val === v ? " sel" : ""}`}
                            onClick={() => setResponse(q.id, v)}
                            title={SCALE_LABELS[v]}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11, color: "var(--text-3)" }}>
                        <span>Very Low / Strongly Disagree</span>
                        <span>Very High / Strongly Agree</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!canProceed || submitting}
              >
                {submitting ? <><span className="spinner" /> Calculating…</> : step === 5 ? "Submit Assessment" : "Next Section →"}
              </button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        {step > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
            {CATEGORIES.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < step ? "var(--blue)" : "var(--border)", transition: "background 0.2s" }} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
