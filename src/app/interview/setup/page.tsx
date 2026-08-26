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
  const [camStatus, setCamStatus] = useState<"pending" | "requesting" | "ready" | "denied" | "not_found" | "in_use" | "black">("pending");
  const [micStatus, setMicStatus] = useState<"pending" | "ready" | "denied" | "not_found">("pending");
  const [permError, setPermError] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [micTested, setMicTested] = useState(false);
  const [testingMic, setTestingMic] = useState(false);
  const [micTestResult, setMicTestResult] = useState<"none" | "detected" | "not_detected">("none");

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

  // Attach stream to video when it changes
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      
      video.onloadedmetadata = () => {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          video.play().then(() => {
            setCamStatus("ready");
          }).catch(() => setCamStatus("black"));
        } else {
          setCamStatus("black");
        }
      };
    }
  }, [stream, stage]);

  const checkPermissions = async () => {
    setPermError(""); setCamStatus("requesting"); setMicStatus("pending");
    setStage("permissions");
    
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }, 
          video: true 
      });
      streamRef.current = s;
      setStream(s);
      
      const audioTracks = s.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].enabled && audioTracks[0].readyState === "live") {
        setMicStatus("ready");
      } else {
        setMicStatus("not_found");
        setPermError("Microphone unavailable.");
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setPermError("Camera permission was denied. Please allow camera access in your browser settings and try again.");
        setCamStatus("denied"); setMicStatus("denied");
      } else if (err.name === "NotFoundError") {
        setPermError("No camera was found. Please connect a camera and try again.");
        setCamStatus("not_found"); setMicStatus("not_found");
      } else if (err.name === "NotReadableError") {
        setPermError("The camera could not be accessed. It may already be in use by another application or browser tab. Close other applications using the camera and try again.");
        setCamStatus("in_use"); setMicStatus("in_use");
      } else {
        setPermError("Unable to start the camera. Please check your browser permissions.");
        setCamStatus("denied"); setMicStatus("denied");
      }
    }
  };

  const runMicTest = async () => {
    if (!streamRef.current) return;
    setTestingMic(true);
    setMicTestResult("none");
    const analyzer = new AudioAnalyzer();
    await analyzer.connect(streamRef.current);
    await analyzer.calibrate(500);
    analyzer.startRecording();
    
    setTimeout(() => {
      const { samples, duration, noiseFloor } = analyzer.stop();
      const metrics = computeAudioMetrics(samples, duration, noiseFloor);
      if (metrics.speechDuration && metrics.speechDuration > 0) {
        setMicTestResult("detected");
        setMicTested(true);
      } else {
        setMicTestResult("not_detected");
      }
      setTestingMic(false);
    }, 3000);
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
      await analyzer.calibrate(1000); // 1s ambient noise calibration
      analyzerRef.current = analyzer;
      analyzer.startRecording();
    }

    // Speech recognition
    if (isSpeechRecognitionAvailable()) {
      const rec = createSpeechRecognizer();
      if (rec) {
        rec.onresult = (e: any) => {
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
    const { samples, duration, noiseFloor } = analyzerRef.current?.stop() ?? { samples: [], duration: elapsed, noiseFloor: 5 };

    const audioM = computeAudioMetrics(samples, duration, noiseFloor);
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
        await a.calibrate(500); // quick recalibration
        analyzerRef.current = a;
        a.startRecording();
      }

      // Restart recognition
      recognizerRef.current?.stop();
      if (isSpeechRecognitionAvailable()) {
        const rec = createSpeechRecognizer();
        if (rec) {
          rec.onresult = (e: any) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " "; transcriptRef.current = t.trim(); };
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
                  <div className={`check-icon ${camStatus === "ready" ? "check-ok" : camStatus === "requesting" ? "check-pending" : "check-err"}`}>
                    {camStatus === "ready" ? "✓" : camStatus === "requesting" ? "…" : "✗"}
                  </div>
                  <span style={{ fontSize: 14 }}>
                    {camStatus === "ready" ? "Camera ready" : 
                     camStatus === "requesting" ? "Requesting camera access..." : 
                     camStatus === "denied" ? "Camera access denied" :
                     camStatus === "not_found" ? "No camera detected" :
                     camStatus === "in_use" ? "Camera unavailable" :
                     camStatus === "black" ? "Camera preview unavailable" :
                     "Camera permission required"}
                  </span>
                </div>
                <div className="checklist-item">
                  <div className={`check-icon ${micStatus === "ready" ? "check-ok" : micStatus === "pending" ? "check-pending" : "check-err"}`}>
                    {micStatus === "ready" ? "✓" : micStatus === "pending" ? "…" : "✗"}
                  </div>
                  <span style={{ fontSize: 14 }}>
                    {micStatus === "ready" ? "Microphone ready" : 
                     micStatus === "pending" ? "Microphone permission required" : "Microphone access denied"}
                  </span>
                </div>
              </div>

              <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", marginBottom: 20, height: 240, position: "relative" }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: camStatus === "ready" ? "block" : "none" }} />
                
                {camStatus !== "ready" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", padding: 20, textAlign: "center", fontSize: 14 }}>
                    {camStatus === "requesting" && "Requesting camera access..."}
                    {camStatus === "denied" && "Camera access is required for the mock interview."}
                    {camStatus === "not_found" && "No camera was detected on this device."}
                    {camStatus === "in_use" && "The camera could not be accessed. It may already be in use."}
                    {camStatus === "black" && "Camera preview is unavailable or completely black."}
                  </div>
                )}
              </div>

              {permError && <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                {permError}
              </div>}

              {(!camStatus || camStatus !== "ready" || micStatus !== "ready") && camStatus !== "requesting" && (
                <div style={{ fontSize: 13, color: "var(--amber)", marginBottom: 16, textAlign: "center", fontWeight: 600 }}>
                  Camera and microphone access are required to start the interview.
                </div>
              )}

              {camStatus === "ready" && micStatus === "ready" && (
                <div style={{ marginBottom: 20, padding: 16, background: "var(--bg)", borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Microphone Test</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>Please say a short sentence.</div>
                  
                  {micTestResult === "detected" && (
                    <div style={{ color: "var(--green)", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✓ Speech detected. Your microphone is working.</div>
                  )}
                  {micTestResult === "not_detected" && (
                    <div style={{ color: "var(--red)", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>No speech detected. Please try again.</div>
                  )}

                  {!testingMic && micTestResult !== "detected" && (
                    <button className="btn btn-outline btn-sm" onClick={runMicTest}>Start Test</button>
                  )}
                  {testingMic && (
                     <div style={{ fontSize: 13, color: "var(--blue)" }}>Listening for 3 seconds...</div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-outline" onClick={() => { setStage("setup"); streamRef.current?.getTracks().forEach(t => t.stop()); setStream(null); }}>← Back</button>
                {(camStatus !== "ready" || micStatus !== "ready") && camStatus !== "requesting" ? (
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={checkPermissions}>
                    Try Again
                  </button>
                ) : (
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={startInterview} disabled={camStatus !== "ready" || micStatus !== "ready" || !micTested}>
                    Start Interview →
                  </button>
                )}
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
