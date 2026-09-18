"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { HR_PRACTICE_QUESTIONS } from "@/lib/questions";
import { AudioAnalyzer, computeAudioMetrics, computeTranscriptMetrics, mergeMetrics, computeSpeakingConfidence, createSpeechRecognizer, isSpeechRecognitionAvailable, evaluateHRAnswer } from "@/lib/speechAnalysis";
import { savePractice, newId } from "@/lib/storage";
import type { SpeechMetrics } from "@/types";

type Stage = "setup" | "recording" | "reviewing" | "done" | "error";

export default function HRPracticePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("setup");
  const [qIndex, setQIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [sessionMetrics, setSessionMetrics] = useState<{ q: typeof HR_PRACTICE_QUESTIONS[0]; metrics: SpeechMetrics; elapsed: number }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const transcriptConfRef = useRef<number | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (u) setUid(u.uid); });
    return unsub;
  }, []);
  useEffect(() => () => { clearInterval(timerRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const question = HR_PRACTICE_QUESTIONS[qIndex];
  const isLast = qIndex === HR_PRACTICE_QUESTIONS.length - 1;

  const startRecording = async () => {
    setError(""); transcriptRef.current = ""; setTranscript(""); setElapsed(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const analyzer = new AudioAnalyzer();
      await analyzer.connect(stream);
      await analyzer.calibrate(1000);
      analyzerRef.current = analyzer;
      analyzer.startRecording();
      if (isSpeechRecognitionAvailable()) {
        const rec = createSpeechRecognizer();
        if (rec) {
          rec.onresult = (e: any) => { 
            let t = ""; 
            let c = 0;
            for (let i = 0; i < e.results.length; i++) {
              t += e.results[i][0].transcript + " "; 
              c += e.results[i][0].confidence;
            }
            transcriptRef.current = t.trim(); 
            setTranscript(t.trim()); 
            transcriptConfRef.current = e.results.length > 0 ? c / e.results.length : 0;
          };
          rec.start(); recognizerRef.current = rec;
        }
      }
      timerRef.current = setInterval(() => { setElapsed(e => e + 1); setVolume(analyzerRef.current?.getCurrentVolume() ?? 0); }, 1000);
      setStage("recording");
    } catch (err: any) {
      setError(err.name === "NotAllowedError" ? "Microphone permission is required for voice practice." : "Could not start recording. Check your microphone.");
      setStage("error");
    }
  };

  const stopRecording = async () => {
    clearInterval(timerRef.current);
    recognizerRef.current?.stop();
    const { samples, duration, noiseFloor } = analyzerRef.current?.stop() ?? { samples: [], duration: elapsed, noiseFloor: 5 };
    streamRef.current?.getTracks().forEach(t => t.stop());
    const audioM = computeAudioMetrics(samples, duration || elapsed, noiseFloor);
    const txM = transcriptRef.current ? computeTranscriptMetrics(transcriptRef.current, audioM.speechDuration ?? 0, transcriptConfRef.current) : null;
    const merged = mergeMetrics(audioM, txM);
    setSessionMetrics(prev => [...prev, { q: question, metrics: merged, elapsed }]);
    setShowCalculation(false);
    setStage("reviewing");
  };

  const nextQuestion = async () => {
    if (isLast) {
      // Save all as individual practice sessions
      if (uid) {
        setSaving(true);
        for (const sm of sessionMetrics) {
          const sci = computeSpeakingConfidence(sm.metrics);
          await savePractice(uid, { id: newId(), userId: uid, type: "hr", questionId: sm.q.id, questionText: sm.q.text, completedAt: new Date().toISOString(), duration: sm.elapsed, metrics: sm.metrics, speakingConfidenceIndicator: sci });
        }
        setSaving(false);
      }
      setStage("done");
    } else {
      setQIndex(i => i + 1);
      setStage("recording");
      startRecording();
    }
  };

  const lastM = sessionMetrics[sessionMetrics.length - 1];
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--text-3)" }}>← Dashboard</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>HR Question Practice</h1>
          <p className="page-subtitle">5 common HR questions · Record each answer</p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>Question {qIndex + 1} of {HR_PRACTICE_QUESTIONS.length}</span>
            <span style={{ color: "var(--text-3)" }}>{sessionMetrics.length} completed</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill progress-blue" style={{ width: `${(sessionMetrics.length / HR_PRACTICE_QUESTIONS.length) * 100}%` }} />
          </div>
        </div>

        {/* Setup (first question) */}
        {stage === "setup" && (
          <div className="card">
            <div className="card-body">
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                Your responses will be recorded for performance analysis. Answer each question as you would in a real interview.
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Questions in this session:</div>
              {HR_PRACTICE_QUESTIONS.map((q, i) => (
                <div key={q.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13.5, color: "var(--text-2)" }}>
                  <span style={{ fontWeight: 700, color: "var(--blue)", minWidth: 20 }}>{i + 1}.</span>
                  {q.text}
                </div>
              ))}
              <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 20 }} onClick={startRecording}>
                Start Session → (Q1)
              </button>
            </div>
          </div>
        )}

        {/* Recording */}
        {stage === "recording" && (
          <div className="card">
            <div className="card-body">
              <div className="question-card" style={{ marginBottom: 20 }}>
                <div className="question-num">Question {qIndex + 1} of {HR_PRACTICE_QUESTIONS.length}</div>
                <div className="question-text">{question.text}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div className="rec-indicator"><div className="rec-dot" /> Recording</div>
                <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(elapsed)}</div>
              </div>
              <div style={{ height: 36, background: "var(--bg)", borderRadius: 8, display: "flex", alignItems: "center", padding: "0 8px", gap: 2, marginBottom: 16 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} style={{ width: 5, borderRadius: 2, background: "var(--blue-light)", height: `${Math.max(4, (volume / 255) * 28 * (0.3 + Math.random() * 0.7))}px`, transition: "height 0.15s" }} />
                ))}
              </div>
              {transcript && <div style={{ background: "var(--bg)", borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, maxHeight: 60, overflow: "auto" }}><span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>Transcript · </span>{transcript}</div>}
              <button className="btn btn-danger btn-full" onClick={stopRecording}>Finish Answer</button>
            </div>
          </div>
        )}

        {/* Reviewing */}
        {stage === "reviewing" && lastM && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="section-title">HR Answer Performance</span></div>
            <div className="card-body">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--text-2)", padding: "10px", background: "var(--bg)", borderRadius: 8 }}>
                Question: {lastM.q.text}
              </div>
              
              {(() => {
                const evalResult = evaluateHRAnswer(lastM.q, lastM.metrics);
                
                if (evalResult.status !== "valid" || !evalResult.scores) {
                  return (
                    <div style={{ padding: "20px", background: "var(--amber-bg)", borderRadius: 8, marginBottom: 20, textAlign: "center", border: "1px solid var(--amber-border)" }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--amber)", marginBottom: 8 }}>{evalResult.statusMessage}</h3>
                      <p style={{ fontSize: 14, color: "var(--text-2)" }}>Unable to calculate a reliable result because there isn't enough usable answer data.</p>
                    </div>
                  );
                }

                const s = evalResult.scores;
                const f = evalResult.feedback!;
                const m = lastM.metrics;
                
                return (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 13, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 4 }}>Answer Quality</div>
                      <div style={{ fontSize: 48, fontWeight: 800, color: (s.overall ?? 0) >= 70 ? "var(--green)" : (s.overall ?? 0) >= 50 ? "var(--amber)" : "var(--red)", lineHeight: 1 }}>
                        {s.overall !== null ? s.overall : "--"}<span style={{ fontSize: 20, color: "var(--text-3)" }}>%</span>
                      </div>
                    </div>

                    <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
                      <div>
                        <div className="label-cap" style={{ marginBottom: 12 }}>Content</div>
                        <MetricRow label="Relevance" value={s.relevance !== null ? `${s.relevance}%` : "N/A"} />
                        <MetricRow label="Completeness" value={s.completeness !== null ? `${s.completeness}%` : "N/A"} />
                        <MetricRow label="Content Quality" value={s.contentQuality !== null ? `${s.contentQuality}%` : "N/A"} />
                        <MetricRow label="Structure" value={s.structure !== null ? `${s.structure}%` : "N/A"} />
                        <MetricRow label="Specificity" value={s.specificity !== null ? `${s.specificity}%` : "N/A"} />
                      </div>
                      <div>
                        <div className="label-cap" style={{ marginBottom: 12 }}>Speaking</div>
                        <MetricRow label="Speaking Rate" value={m.wordsPerMinute ? `${m.wordsPerMinute} WPM` : "N/A"} />
                        <MetricRow label="Filler Words" value={m.fillerWordCount !== null ? String(m.fillerWordCount) : "N/A"} />
                        <MetricRow label="Long Pauses" value={String(m.longPauseCount)} />
                        <MetricRow label="Speech Duration" value={fmt(Math.round(m.speechDuration))} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <div className="label-cap" style={{ color: "var(--green)", marginBottom: 8 }}>What You Did Well</div>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
                        {f.strengths.map((str, i) => <li key={i}>{str}</li>)}
                      </ul>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <div className="label-cap" style={{ color: "var(--red)", marginBottom: 8 }}>What Needs Improvement</div>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
                        {f.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>

                    <div style={{ marginBottom: 24, padding: 16, background: "var(--bg)", borderRadius: 8 }}>
                      <div className="label-cap" style={{ color: "var(--blue)", marginBottom: 6 }}>How to Improve</div>
                      <div style={{ fontSize: 14, color: "var(--text-2)" }}>{f.actionable}</div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setShowCalculation(!showCalculation)} style={{ width: "100%", justifyContent: "space-between" }}>
                        How was this score calculated? <span>{showCalculation ? "▲" : "▼"}</span>
                      </button>
                      
                      {showCalculation && (
                        <div style={{ marginTop: 12, background: "var(--bg)", borderRadius: 8, padding: 16, fontSize: 13, fontFamily: "monospace" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Relevance</span><span>{s.relevance !== null ? `${s.relevance} × 25% = ${(s.relevance * 0.25).toFixed(1)}` : 'N/A'}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Completeness</span><span>{s.completeness !== null ? `${s.completeness} × 20% = ${(s.completeness * 0.20).toFixed(1)}` : 'N/A'}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Content</span><span>{s.contentQuality !== null ? `${s.contentQuality} × 20% = ${(s.contentQuality * 0.20).toFixed(1)}` : 'N/A'}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Structure</span><span>{s.structure !== null ? `${s.structure} × 15% = ${(s.structure * 0.15).toFixed(1)}` : 'N/A'}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Clarity</span><span>{s.clarity !== null ? `${s.clarity} × 10% = ${(s.clarity * 0.10).toFixed(1)}` : 'N/A'}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Specificity</span><span>{s.specificity !== null ? `${s.specificity} × 10% = ${(s.specificity * 0.10).toFixed(1)}` : 'N/A'}</span></div>
                          <div style={{ borderTop: "1px dashed var(--border)", margin: "8px 0", paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                            <span>Final Score</span><span>{s.overall !== null ? s.overall.toFixed(1) : 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              <button className="btn btn-primary btn-full btn-lg" onClick={nextQuestion} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving…</> : isLast ? "Finish Session →" : `Next Question →`}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {stage === "error" && (
          <div className="card"><div className="card-body">
            <div className="alert alert-danger" style={{ marginBottom: 16 }}><span>{error}</span></div>
            <button className="btn btn-outline" onClick={() => setStage("setup")}>← Back</button>
          </div></div>
        )}

        {/* Done */}
        {stage === "done" && (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>HR Practice Complete</h2>
              <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 24 }}>{sessionMetrics.length} of {HR_PRACTICE_QUESTIONS.length} questions answered and saved.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <Link href="/dashboard" className="btn btn-outline">Dashboard</Link>
                <Link href="/interview/setup" className="btn btn-primary">Start Mock Interview →</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: "ok" | "warn" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 13.5, color: highlight === "ok" ? "var(--green)" : highlight === "warn" ? "var(--amber)" : "var(--text)" }}>{value}</span>
    </div>
  );
}
