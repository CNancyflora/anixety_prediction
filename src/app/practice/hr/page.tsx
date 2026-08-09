"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { HR_PRACTICE_QUESTIONS } from "@/lib/questions";
import { AudioAnalyzer, computeAudioMetrics, computeTranscriptMetrics, mergeMetrics, computeSpeakingConfidence, createSpeechRecognizer, isSpeechRecognitionAvailable } from "@/lib/speechAnalysis";
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
      analyzerRef.current = analyzer;
      if (isSpeechRecognitionAvailable()) {
        const rec = createSpeechRecognizer();
        if (rec) {
          rec.onresult = (e: any) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " "; transcriptRef.current = t.trim(); setTranscript(t.trim()); };
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
    const { samples, duration } = analyzerRef.current?.stop() ?? { samples: [], duration: elapsed };
    streamRef.current?.getTracks().forEach(t => t.stop());
    const audioM = computeAudioMetrics(samples, duration || elapsed);
    const txM = transcriptRef.current ? computeTranscriptMetrics(transcriptRef.current, audioM.speechDuration ?? 0) : null;
    const merged = mergeMetrics(audioM, txM);
    setSessionMetrics(prev => [...prev, { q: question, metrics: merged, elapsed }]);
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
          <div className="card">
            <div className="card-header"><span className="section-title">Answer Recorded ✓</span></div>
            <div className="card-body">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--text-2)" }}>{lastM.q.text}</div>
              <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
                <MetricRow label="Duration" value={`${lastM.elapsed}s`} />
                <MetricRow label="Speech Time" value={`${lastM.metrics.speechDuration.toFixed(0)}s`} />
                <MetricRow label="Pause Count" value={String(lastM.metrics.pauseCount)} />
                <MetricRow label="Long Pauses" value={String(lastM.metrics.longPauseCount)} highlight={lastM.metrics.longPauseCount > 2 ? "warn" : "ok"} />
                {lastM.metrics.wordsPerMinute !== null && <MetricRow label="Speaking Rate" value={`${lastM.metrics.wordsPerMinute} WPM`} highlight={lastM.metrics.wordsPerMinute >= 100 && lastM.metrics.wordsPerMinute <= 150 ? "ok" : "warn"} />}
                {lastM.metrics.fillerWordCount !== null && <MetricRow label="Filler Words" value={String(lastM.metrics.fillerWordCount)} highlight={lastM.metrics.fillerWordCount > 4 ? "warn" : "ok"} />}
              </div>
              {lastM.metrics.transcript && <div style={{ background: "var(--bg)", borderRadius: 8, padding: 12, fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>{lastM.metrics.transcript}</div>}
              <button className="btn btn-primary btn-full" onClick={nextQuestion} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving…</> : isLast ? "Finish Session →" : `Next: Q${qIndex + 2} →`}
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
