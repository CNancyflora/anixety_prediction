"use client";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { selectQuestions } from "@/lib/questions";
import { AudioAnalyzer, computeAudioMetrics, computeTranscriptMetrics, mergeMetrics, computeComponentScores, computeOverallScore, generateFeedback, createSpeechRecognizer, isSpeechRecognitionAvailable } from "@/lib/speechAnalysis";
import { saveInterview, newId, loadProfile } from "@/lib/storage";
import type { InterviewType, Difficulty, InterviewQuestion, InterviewResponse, SpeechMetrics } from "@/types";

type Stage = "setup" | "permissions" | "active" | "processing" | "done";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("General");
  const [type, setType] = useState<InterviewType>("hr");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [numQ, setNumQ] = useState(5);
  const [stage, setStage] = useState<Stage>("setup");
  const [camOk, setCamOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [permError, setPermError] = useState("");

  // Interview state
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0);
  const [qDisplayTime, setQDisplayTime] = useState(0);
  const [speechStarted, setSpeechStarted] = useState(false);
  const [speechStartTime, setSpeechStartTime] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const timerRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const sessionIdRef = useRef(newId());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUid(u.uid);
        const profile = await loadProfile(u.uid);
        if (profile?.targetRole) setTargetRole(profile.targetRole);
      }
    });
    return unsub;
  }, []);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const checkPermissions = async () => {
    setPermError(""); setCamOk(null); setMicOk(null);
    setStage("permissions");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      setCamOk(true); setMicOk(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setPermError("Camera and microphone access are required for the mock interview. Please allow permissions and try again.");
        setCamOk(false); setMicOk(false);
      } else {
        // Try audio only
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicOk(true); setCamOk(false);
          setPermError("Camera access was denied. The interview will proceed with audio only.");
        } catch {
          setMicOk(false); setCamOk(false);
          setPermError("Microphone access is required for the mock interview.");
        }
      }
    }
  };

  const startInterview = async () => {
    const qs = selectQuestions(type, difficulty, numQ);
    setQuestions(qs);
    setQIdx(0);
    setResponses([]);
    setElapsed(0);
    setQDisplayTime(Date.now());
    setSpeechStarted(false); setSpeechStartTime(null);
    transcriptRef.current = "";

    // Start audio analyzer
    if (streamRef.current) {
      const analyzer = new AudioAnalyzer();
      await analyzer.connect(streamRef.current);
      analyzerRef.current = analyzer;
    }

    // Speech recognition
    if (isSpeechRecognitionAvailable()) {
      const rec = createSpeechRecognizer();
      if (rec) {
        rec.onresult = (e) => {
          let t = "";
          for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
          transcriptRef.current = t.trim();
        };
        rec.start();
        recognizerRef.current = rec;
      }
    }

    timerRef.current = setInterval(() => {
      const vol = analyzerRef.current?.getCurrentVolume() ?? 0;
      setVolume(vol);
      setElapsed(e => e + 1);
      // Detect speech start (first time volume goes above threshold)
      if (!speechStarted && vol > 20) {
        setSpeechStarted(true);
        setSpeechStartTime(Date.now());
      }
    }, 1000);

    setStage("active");
  };

  const finishAnswer = async () => {
    const now = Date.now();
    const rt = speechStartTime ? (speechStartTime - qDisplayTime) / 1000 : null;
    const { samples, duration } = analyzerRef.current?.stop() ?? { samples: [], duration: elapsed };

    const audioM = computeAudioMetrics(samples, duration);
    const txM = transcriptRef.current
      ? computeTranscriptMetrics(transcriptRef.current, audioM.speechDuration ?? 0)
      : null;
    const merged = mergeMetrics(audioM, txM);

    const response: InterviewResponse = {
      questionId: questions[qIdx].id,
      questionText: questions[qIdx].text,
      displayedAt: qDisplayTime,
      speechStartedAt: speechStartTime,
      finishedAt: now,
      responseTime: rt,
      metrics: merged,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (qIdx < questions.length - 1) {
      // Next question
      transcriptRef.current = "";
      setSpeechStarted(false); setSpeechStartTime(null);
      setQIdx(i => i + 1);
      setQDisplayTime(Date.now());

      // Restart analyzer
      if (streamRef.current) {
        const a = new AudioAnalyzer();
        await a.connect(streamRef.current);
        analyzerRef.current = a;
      }

      // Restart recognition
      recognizerRef.current?.stop();
      if (isSpeechRecognitionAvailable()) {
        const rec = createSpeechRecognizer();
        if (rec) {
          rec.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " "; transcriptRef.current = t.trim(); };
          rec.start();
          recognizerRef.current = rec;
        }
      }
    } else {
      // End interview
      clearInterval(timerRef.current);
      recognizerRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      setStage("processing");
      await processInterview(newResponses);
    }
  };

  const processInterview = async (finalResponses: InterviewResponse[]) => {
    const componentScores = computeComponentScores(finalResponses);
    const overallScore = computeOverallScore(componentScores);
    const { feedback, strengths, improvements } = generateFeedback(finalResponses, componentScores);

    const session = {
      id: sessionIdRef.current,
      userId: uid!,
      type,
      difficulty,
      startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      targetRole,
      questions,
      responses: finalResponses,
      overallScore,
      componentScores,
      feedback,
      strengths,
      improvements,
    };

    if (uid) await saveInterview(uid, session);
    router.push(`/interview/report/${sessionIdRef.current}`);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const currentQ = questions[qIdx];

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--text-3)" }}>← Dashboard</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>Mock Interview</h1>
        </div>

        {/* Setup */}
        {stage === "setup" && (
          <div className="card">
            <div className="card-header"><span className="section-title">Interview Configuration</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Interview Type</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["hr", "technical", "behavioral", "situational"] as InterviewType[]).map(t => (
                    <button key={t} onClick={() => setType(t)} className={`btn btn-sm ${type === t ? "btn-primary" : "btn-outline"}`} style={{ textTransform: "capitalize" }}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)} className={`btn btn-sm ${difficulty === d ? "btn-primary" : "btn-outline"}`} style={{ textTransform: "capitalize" }}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Number of Questions</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[3, 5, 7].map(n => (
                    <button key={n} onClick={() => setNumQ(n)} className={`btn btn-sm ${numQ === n ? "btn-primary" : "btn-outline"}`}>{n} questions</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input className="form-input" value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
              <button className="btn btn-primary btn-full btn-lg" onClick={checkPermissions}>
                Check Camera & Microphone →
              </button>
            </div>
          </div>
        )}

        {/* Permissions */}
        {stage === "permissions" && (
          <div className="card">
            <div className="card-header"><span className="section-title">Before We Begin</span></div>
            <div className="card-body">
              <div className="checklist" style={{ marginBottom: 24 }}>
                <div className="checklist-item">
                  <div className={`check-icon ${camOk === true ? "check-ok" : camOk === false ? "check-err" : "check-pending"}`}>
                    {camOk === true ? "✓" : camOk === false ? "✗" : "…"}
                  </div>
                  <span style={{ fontSize: 14 }}>Camera {camOk === true ? "detected" : camOk === false ? "not available" : "checking…"}</span>
                </div>
                <div className="checklist-item">
                  <div className={`check-icon ${micOk === true ? "check-ok" : micOk === false ? "check-err" : "check-pending"}`}>
                    {micOk === true ? "✓" : micOk === false ? "✗" : "…"}
                  </div>
                  <span style={{ fontSize: 14 }}>Microphone {micOk === true ? "detected" : micOk === false ? "not available" : "checking…"}</span>
                </div>
              </div>
              {camOk && <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", marginBottom: 20, height: 160 }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>}
              {permError && <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                {permError}
              </div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setStage("setup")}>← Back</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={startInterview} disabled={!micOk}>
                  Start Interview →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active */}
        {stage === "active" && currentQ && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>Question {qIdx + 1} of {questions.length}</div>
              <div style={{ fontWeight: 800, fontSize: 20, fontVariantNumeric: "tabular-nums" }}>{fmt(elapsed)}</div>
              <div className="rec-indicator"><div className="rec-dot" /> Recording</div>
            </div>
            <div className="progress-bar" style={{ marginBottom: 20 }}>
              <div className="progress-fill progress-blue" style={{ width: `${((qIdx) / questions.length) * 100}%` }} />
            </div>
            <div className="question-card" style={{ marginBottom: 20 }}>
              <div className="question-num">Question {qIdx + 1} · {currentQ.category} · {currentQ.difficulty}</div>
              <div className="question-text">{currentQ.text}</div>
            </div>
            {streamRef.current && videoRef.current && (
              <div className="camera-wrap" style={{ height: 180, marginBottom: 16 }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ height: 36, background: "var(--bg)", borderRadius: 8, display: "flex", alignItems: "center", padding: "0 8px", gap: 2, marginBottom: 16 }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{ width: 4, borderRadius: 2, background: "var(--blue-light)", height: `${Math.max(3, (volume / 255) * 28 * (0.3 + Math.random() * 0.7))}px`, transition: "height 0.12s" }} />
              ))}
            </div>
            {!speechStarted && <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              Take a moment to think, then start speaking. Response time is being measured.
            </div>}
            <button className="btn btn-primary btn-full btn-lg" onClick={finishAnswer}>
              {qIdx < questions.length - 1 ? "Finish Answer → Next Question" : "Finish Answer → End Interview"}
            </button>
          </div>
        )}

        {/* Processing */}
        {stage === "processing" && (
          <div className="card"><div className="card-body" style={{ textAlign: "center", padding: "60px 24px" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Analysing Your Session…</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14 }}>Calculating metrics from your recordings. This will take a moment.</p>
          </div></div>
        )}
      </div>
    </AppLayout>
  );
}
