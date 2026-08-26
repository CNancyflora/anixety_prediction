"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { SPEAKING_QUESTIONS } from "@/lib/questions";
import { AudioAnalyzer, computeAudioMetrics, computeTranscriptMetrics, mergeMetrics, computeSpeakingConfidence, createSpeechRecognizer, isSpeechRecognitionAvailable, computePerformanceBreakdown } from "@/lib/speechAnalysis";
import { savePractice, newId } from "@/lib/storage";
import type { SpeechMetrics } from "@/types";

type Stage = "setup" | "consent" | "calibrating" | "recording" | "done" | "error";

export default function SpeakingPracticePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("setup");
  const [qIndex, setQIndex] = useState(0);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [metrics, setMetrics] = useState<SpeechMetrics | null>(null);
  const [sci, setSci] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const transcriptConfRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (u) setUid(u.uid); });
    return unsub;
  }, []);
  useEffect(() => () => { clearInterval(timerRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const question = SPEAKING_QUESTIONS[qIndex];
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    setError(""); transcriptRef.current = ""; setTranscript(""); setElapsed(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const analyzer = new AudioAnalyzer();
      await analyzer.connect(stream);
      setStage("calibrating");
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
      setError(err.name === "NotAllowedError" ? "Microphone permission is required for speaking practice." : "Could not start recording. Check your microphone and try again.");
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
    const indicator = computeSpeakingConfidence(merged);
    setMetrics(merged);
    setSci(indicator);
    if (uid) {
      setSaving(true);
      await savePractice(uid, { id: newId(), userId: uid, type: "speaking", questionId: question.id, questionText: question.text, completedAt: new Date().toISOString(), duration: elapsed, metrics: merged, speakingConfidenceIndicator: indicator });
      setSaving(false);
    }
    setStage("done");
  };

  const reset = () => { setStage("setup"); setMetrics(null); setSci(null); setTranscript(""); setElapsed(0); };

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--text-3)" }}>← Dashboard</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>Speaking Performance Practice</h1>
          <p className="page-subtitle">Record your answer and get an objective Speaking Performance Indicator.</p>
        </div>

        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          <span>The <strong>Speaking Performance Indicator</strong> is calculated from measurable speech characteristics in your recording (speech-to-silence ratio, long pauses, speaking rate). This does not measure emotions or psychological confidence.</span>
        </div>

        {/* Setup */}
        {stage === "setup" && (
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Choose a Question</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SPEAKING_QUESTIONS.map((q, i) => (
                    <div key={q.id} onClick={() => setQIndex(i)} className={`radio-opt${qIndex === i ? " sel" : ""}`}>
                      <div className="radio-dot" />
                      <span style={{ fontSize: 14 }}>{q.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "var(--bg)", borderRadius: 8, padding: 14, marginBottom: 20 }}>
                <div className="label-cap" style={{ marginBottom: 8 }}>What will be measured:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Speaking duration", "Speech-to-silence ratio", "Pause count & long pauses", "Words per minute (where available)", "Filler word count (where available)"].map(m => (
                    <div key={m} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "var(--text-2)" }}>
                      <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> {m}
                    </div>
                  ))}
                </div>
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
              <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 20 }}>
                Your voice will be recorded to calculate audio metrics locally. No recording is stored on a server or shared publicly. You may stop at any time.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setStage("setup")}>Back</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={startRecording}>Allow & Start Recording</button>
              </div>
            </div>
          </div>
        )}

        {/* Calibrating */}
        {stage === "calibrating" && (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div className="spinner" style={{ margin: "0 auto 16px", display: "block" }} />
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Calibrating Microphone...</h2>
              <p style={{ fontSize: 14, color: "var(--text-2)" }}>Please stay quiet for a moment while we measure background noise.</p>
            </div>
          </div>
        )}

        {/* Recording */}
        {stage === "recording" && (
          <div className="card">
            <div className="card-body">
              <div className="question-card" style={{ marginBottom: 20 }}>
                <div className="question-num">Speaking Question</div>
                <div className="question-text">{question.text}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div className="rec-indicator"><div className="rec-dot" /> Recording</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(elapsed)}</div>
              </div>
              <div style={{ height: 44, background: "var(--bg)", borderRadius: 8, display: "flex", alignItems: "center", padding: "0 8px", gap: 2, marginBottom: 16 }}>
                {Array.from({ length: 22 }).map((_, i) => (
                  <div key={i} style={{ width: 5, borderRadius: 2, background: "var(--blue-light)", height: `${Math.max(4, (volume / 255) * 36 * (0.4 + Math.random() * 0.6))}px`, transition: "height 0.15s" }} />
                ))}
              </div>
              {transcript && (
                <div style={{ background: "var(--bg)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, maxHeight: 80, overflow: "auto" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live transcript · </span>
                  {transcript}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-danger btn-full btn-lg" onClick={stopRecording}>⬛ Stop Recording</button>
              </div>
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
        {stage === "done" && metrics && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="section-title">Speaking Performance Indicator</span>
                {saving && <span className="spinner" />}
              </div>
              <div className="card-body">
                {/* SCI score */}
                {sci !== null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 0 20px", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
                    <div style={{ textAlign: "center", minWidth: 100 }}>
                      <div style={{ fontSize: 54, fontWeight: 800, color: sciColor(sci), lineHeight: 1 }}>{sci}<span style={{ fontSize: 22, color: "var(--text-3)" }}>%</span></div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{sci >= 70 ? "Strong" : sci >= 45 ? "Developing" : "Needs Work"}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="label-cap" style={{ marginBottom: 6 }}>Speaking Performance Indicator</div>
                      <div className="progress-bar" style={{ height: 10, marginBottom: 12 }}>
                        <div className="progress-fill" style={{ width: `${sci}%`, background: sciColor(sci) }} />
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{sciExplain(sci, metrics)}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "20px", background: "var(--amber-bg)", borderRadius: 8, marginBottom: 20, textAlign: "center", border: "1px solid var(--amber-border)" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--amber)", marginBottom: 8 }}>NO SPEECH DETECTED</h3>
                    <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 12 }}>We couldn't detect enough spoken audio to calculate a reliable speaking analysis.</p>
                    <div className="label-cap" style={{ color: "var(--text-3)" }}>Speaking Performance Indicator: Not Available</div>
                    <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={reset}>Record Again</button>
                  </div>
                )}

                {/* Breakdown metrics */}
                {sci !== null && (
                  <>
                    <div className="label-cap" style={{ marginBottom: 10 }}>Performance Evidence</div>
                    <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
                      <MetricRow label="🗣️ Speaking Rate" value={metrics.wordsPerMinute ? `${metrics.wordsPerMinute} WPM` : "N/A"} highlight={metrics.wordsPerMinute && metrics.wordsPerMinute >= 120 && metrics.wordsPerMinute <= 160 ? "ok" : "warn"} />
                      <MetricRow label="🔊 Voice Clarity" value={metrics.transcriptConfidence ? `${Math.round(metrics.transcriptConfidence * 100)}%` : "N/A"} highlight={metrics.transcriptConfidence && metrics.transcriptConfidence > 0.8 ? "ok" : "warn"} />
                      <MetricRow label="✨ Fluency" value={`${Math.round(Math.max(0, Math.min(100, 50 + (metrics.speechToSilenceRatio - 0.5) * 100)))}%`} highlight={metrics.speechToSilenceRatio > 0.6 ? "ok" : "warn"} />
                      <MetricRow label="⏸️ Long Pauses" value={String(metrics.longPauseCount)} highlight={metrics.longPauseCount > 3 ? "warn" : "ok"} />
                      <MetricRow label="💬 Filler Words" value={metrics.fillerWordCount !== null ? String(metrics.fillerWordCount) : "N/A"} highlight={metrics.fillerWordCount !== null && metrics.fillerWordCount > 5 ? "warn" : "ok"} />
                      <MetricRow label="📢 Volume Stability" value={`${metrics.volumeStability}%`} highlight={metrics.volumeStability > 80 ? "ok" : "warn"} />
                    </div>
                  </>
                )}

                {/* Audio measurements */}
                <div className="label-cap" style={{ marginBottom: 10 }}>Measured Audio Timing</div>
                <div className="grid-2" style={{ gap: 12 }}>
                  <MetricRow label="Total Duration" value={`${metrics.totalDuration.toFixed(0)}s`} />
                  <MetricRow label="Speech Duration" value={`${metrics.speechDuration.toFixed(0)}s`} />
                  <MetricRow label="Silence Duration" value={`${metrics.silenceDuration.toFixed(0)}s`} />
                  <MetricRow label="Speech / Total Ratio" value={`${(metrics.speechToSilenceRatio * 100).toFixed(0)}%`} highlight={metrics.speechToSilenceRatio >= 0.65 ? "ok" : "warn"} />
                </div>

                {/* Filler breakdown */}
                {metrics.fillerWords && metrics.fillerWords.length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, background: "var(--amber-bg)", borderRadius: 8, border: "1px solid var(--amber-border)" }}>
                    <div className="label-cap" style={{ color: "var(--amber)", marginBottom: 6 }}>Filler Words Detected</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {metrics.fillerWords.map(f => <span key={f} className="tag" style={{ background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)" }}>{f}</span>)}
                    </div>
                  </div>
                )}

                {/* Transcript */}
                {metrics.transcript && (
                  <div style={{ marginTop: 16 }}>
                    <div className="label-cap" style={{ marginBottom: 6 }}>Transcript</div>
                    <div style={{ background: "var(--bg)", borderRadius: 8, padding: 14, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7 }}>{metrics.transcript}</div>
                  </div>
                )}

                {!metrics.wordsPerMinute && !metrics.transcript && (
                  <div className="alert alert-warning" style={{ marginTop: 16 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
                    Transcript analysis is not available in this browser. The Speaking Performance Indicator is based on audio timing metrics only.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" onClick={reset}>Try Another Question</button>
              <Link href="/practice/hr" className="btn btn-primary">Next: HR Questions →</Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function sciColor(s: number) { return s >= 70 ? "var(--green)" : s >= 45 ? "var(--amber)" : "var(--red)"; }

function sciExplain(sci: number, m: SpeechMetrics): string {
  const bd = computePerformanceBreakdown(m);
  if (!bd) return "Not enough usable speech data.";

  const parts: string[] = [];
  if (bd.speakingRateScore >= 80) parts.push("speaking pace was comfortable");
  else if (m.wordsPerMinute && m.wordsPerMinute > 160) parts.push("speaking pace was very fast");
  else if (m.wordsPerMinute && m.wordsPerMinute < 120) parts.push("speaking pace was slow");

  if (bd.voiceClarityScore > 80) parts.push("voice was clear");
  else parts.push("voice clarity could be improved");

  if (m.longPauseCount === 0) parts.push("no noticeable long pauses");
  else parts.push(`had ${m.longPauseCount} noticeable pauses`);

  if (bd.fillerControlScore < 70) parts.push("some hesitation with filler words");
  
  if (parts.length === 0) return "Your speaking performance was evaluated from the audio measurements.";
  
  // Format nicely
  return `Your ${parts[0]} and your ${parts[1] ?? "speech was recorded"}. You ${parts[2] ?? "maintained continuity"}${parts[3] ? ` and ${parts[3]}` : ""}.`;
}

function MetricRow({ label, value, highlight, note }: { label: string; value: string; highlight?: "ok" | "warn"; note?: string }) {
  return (
    <div style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: highlight === "ok" ? "var(--green)" : highlight === "warn" ? "var(--amber)" : "var(--text)" }}>{value}</span>
      </div>
      {note && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{note}</div>}
    </div>
  );
}
