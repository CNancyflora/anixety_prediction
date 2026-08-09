"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { SELF_INTRO_QUESTIONS } from "@/lib/questions";
import { AudioAnalyzer, computeAudioMetrics, computeTranscriptMetrics, mergeMetrics, computeSpeakingConfidence, createSpeechRecognizer, isSpeechRecognitionAvailable } from "@/lib/speechAnalysis";
import { savePractice, newId } from "@/lib/storage";
import type { SpeechMetrics } from "@/types";

type Stage = "setup" | "consent" | "recording" | "done" | "error";

export default function SelfIntroPracticePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("setup");
  const [qIndex, setQIndex] = useState(0);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [metrics, setMetrics] = useState<SpeechMetrics | null>(null);
  const [saving, setSaving] = useState(false);

  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const recognizerRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (u) setUid(u.uid); });
    return unsub;
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const question = SELF_INTRO_QUESTIONS[qIndex];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // AudioAnalyzer
      const analyzer = new AudioAnalyzer();
      await analyzer.connect(stream);
      analyzerRef.current = analyzer;

      // MediaRecorder
      const recorder = new MediaRecorder(stream);
      recorder.start();
      recorderRef.current = recorder;

      // SpeechRecognition
      if (isSpeechRecognitionAvailable()) {
        const rec = createSpeechRecognizer();
        if (rec) {
          rec.onresult = (e) => {
            let t = "";
            for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
            transcriptRef.current = t.trim();
            setTranscript(t.trim());
          };
          rec.start();
          recognizerRef.current = rec;
        }
      }

      // Timer
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(e => e + 1);
        setVolume(analyzerRef.current?.getCurrentVolume() ?? 0);
      }, 1000);

      setStage("recording");
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission is required for voice practice. Please allow microphone access and try again.");
      } else {
        setError("We couldn't start recording. Please check your microphone and try again.");
      }
      setStage("error");
    }
  };

  const stopRecording = async () => {
    clearInterval(timerRef.current);
    recognizerRef.current?.stop();

    const { samples, duration } = analyzerRef.current?.stop() ?? { samples: [], duration: elapsed };
    streamRef.current?.getTracks().forEach(t => t.stop());

    const audioMetrics = computeAudioMetrics(samples, duration || elapsed);
    const txMetrics = transcriptRef.current
      ? computeTranscriptMetrics(transcriptRef.current, audioMetrics.speechDuration ?? 0)
      : null;

    const merged = mergeMetrics(audioMetrics, txMetrics);
    setMetrics(merged);

    if (uid) {
      setSaving(true);
      const sci = computeSpeakingConfidence(merged);
      await savePractice(uid, {
        id: newId(),
        userId: uid,
        type: "self-intro",
        questionId: question.id,
        questionText: question.text,
        completedAt: new Date().toISOString(),
        duration: elapsed,
        metrics: merged,
        speakingConfidenceIndicator: sci,
      });
      setSaving(false);
    }

    setStage("done");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--text-3)" }}>← Dashboard</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>Self Introduction Practice</h1>
          <p className="page-subtitle">Record your answer and review your speaking metrics.</p>
        </div>

        {/* Setup */}
        {stage === "setup" && (
          <div className="card">
            <div className="card-body">
              <div style={{ marginBottom: 20 }}>
                <div className="label-cap" style={{ marginBottom: 6 }}>Select Question</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SELF_INTRO_QUESTIONS.map((q, i) => (
                    <div key={q.id} onClick={() => setQIndex(i)} className={`radio-opt${qIndex === i ? " sel" : ""}`}>
                      <div className="radio-dot" />
                      <span style={{ fontSize: 14 }}>{q.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <span>Target duration: <strong>1–2 minutes</strong>. Speak naturally — avoid memorising a script.</span>
              </div>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => setStage("consent")}>Continue →</button>
            </div>
          </div>
        )}

        {/* Consent */}
        {stage === "consent" && (
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Recording Consent</h2>
              <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>
                Your response will be recorded for interview performance analysis. Audio data is processed locally for metrics calculation and is not shared publicly.
              </p>
              <div className="alert alert-info" style={{ marginBottom: 24 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                Transcript analysis requires a browser that supports the Web Speech API. If unavailable, audio metrics will still be calculated.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setStage("setup")}>Back</button>
                <button className="btn btn-primary btn-lg" onClick={startRecording} style={{ flex: 1 }}>Allow & Start Recording</button>
              </div>
            </div>
          </div>
        )}

        {/* Recording */}
        {stage === "recording" && (
          <div className="card">
            <div className="card-body">
              <div className="question-card" style={{ marginBottom: 20 }}>
                <div className="question-num">Question</div>
                <div className="question-text">{question.text}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div className="rec-indicator"><div className="rec-dot" /> Recording</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--text)" }}>{fmt(elapsed)}</div>
              </div>
              {/* Volume visualiser */}
              <div style={{ height: 40, background: "var(--bg)", borderRadius: 8, overflow: "hidden", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: "100%", padding: "4px 8px" }}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} style={{
                      width: 5, borderRadius: 2,
                      background: "var(--blue-light)",
                      height: `${Math.max(4, Math.min(36, (volume / 255) * 36 * (0.4 + Math.random() * 0.6)))}px`,
                      transition: "height 0.15s"
                    }} />
                  ))}
                </div>
              </div>
              {transcript && (
                <div style={{ background: "var(--bg)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, maxHeight: 80, overflow: "auto" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live transcript · </span>
                  {transcript}
                </div>
              )}
              <button className="btn btn-danger btn-full btn-lg" onClick={stopRecording}>
                ⬛ Stop Recording
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {stage === "error" && (
          <div className="card">
            <div className="card-body">
              <div className="alert alert-danger" style={{ marginBottom: 20 }}><span>{error}</span></div>
              <button className="btn btn-outline" onClick={() => setStage("setup")}>← Back</button>
            </div>
          </div>
        )}

        {/* Done */}
        {stage === "done" && metrics && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="section-title">Recording Complete ✓</span>
                {saving && <span className="spinner" />}
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 20, lineHeight: 1.6 }}>
                  The following metrics were calculated from your actual recording:
                </p>
                <div className="grid-2" style={{ gap: 16 }}>
                  <MetricRow label="Total Duration" value={`${metrics.totalDuration.toFixed(0)}s`} />
                  <MetricRow label="Speech Duration" value={`${metrics.speechDuration.toFixed(0)}s`} />
                  <MetricRow label="Pause Count" value={String(metrics.pauseCount)} />
                  <MetricRow label="Long Pauses (>2s)" value={String(metrics.longPauseCount)} highlight={metrics.longPauseCount > 3 ? "warn" : "ok"} />
                  <MetricRow label="Speech / Silence Ratio" value={`${(metrics.speechToSilenceRatio * 100).toFixed(0)}%`} />
                  {metrics.wordsPerMinute !== null && <MetricRow label="Speaking Rate" value={`${metrics.wordsPerMinute} WPM`} highlight={metrics.wordsPerMinute >= 100 && metrics.wordsPerMinute <= 150 ? "ok" : "warn"} />}
                  {metrics.wordCount !== null && <MetricRow label="Word Count" value={String(metrics.wordCount)} />}
                  {metrics.fillerWordCount !== null && <MetricRow label="Filler Words" value={String(metrics.fillerWordCount)} highlight={metrics.fillerWordCount > 5 ? "warn" : "ok"} />}
                </div>

                {metrics.transcript && (
                  <div style={{ marginTop: 20 }}>
                    <div className="label-cap" style={{ marginBottom: 6 }}>Transcript</div>
                    <div style={{ background: "var(--bg)", borderRadius: 8, padding: 14, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7 }}>
                      {metrics.transcript}
                    </div>
                  </div>
                )}

                {!metrics.wordsPerMinute && !metrics.transcript && (
                  <div className="alert alert-warning" style={{ marginTop: 16 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    Transcript analysis is not available in this browser. Audio timing metrics were still calculated.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => { setStage("setup"); setMetrics(null); setTranscript(""); setElapsed(0); }}>
                Practice Again
              </button>
              <Link href="/practice/speaking" className="btn btn-primary">Next: Speaking Confidence →</Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: "ok" | "warn" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 14, color: highlight === "ok" ? "var(--green)" : highlight === "warn" ? "var(--amber)" : "var(--text)" }}>{value}</span>
    </div>
  );
}
