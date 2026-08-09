"use client";
import AppLayout from "@/components/AppLayout";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveResumeReport, getResumeReports, deleteResumeReport, newId } from "@/lib/storage";
import type { ResumeReport } from "@/types";

type Stage = "upload" | "processing" | "result" | "history";

export default function ResumeAnalyzerPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("Software Developer");
  
  const [processStep, setProcessStep] = useState(0);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ResumeReport | null>(null);
  const [history, setHistory] = useState<ResumeReport[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) {
        setUid(u.uid);
        setHistory(getResumeReports());
      }
    });
    return unsub;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.name.endsWith(".pdf") || f.name.endsWith(".docx")) {
        setFile(f);
        setError("");
      } else {
        setError("Please upload a valid PDF or DOCX file.");
        setFile(null);
      }
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setStage("processing");
    setProcessStep(0);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetRole", targetRole);

      // Simulate step-by-step UI updates while the actual request runs
      const stepInterval = setInterval(() => {
        setProcessStep(s => Math.min(s + 1, 3));
      }, 800);

      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      clearInterval(stepInterval);
      setProcessStep(4);
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Analysis failed.");
        setStage("upload");
        return;
      }

      const finalReport: ResumeReport = {
        id: newId(),
        userId: uid || "guest",
        fileName: file.name,
        targetRole,
        uploadDate: new Date().toISOString(),
        ...data.report
      };

      setReport(finalReport);
      if (uid) {
        await saveResumeReport(uid, finalReport);
        setHistory(getResumeReports());
      }
      setStage("result");

    } catch (err) {
      setError("We couldn't complete the analysis. Please check your network and try again.");
      setStage("upload");
    }
  };

  const reset = () => {
    setFile(null);
    setReport(null);
    setError("");
    setStage("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadHistoryItem = (r: ResumeReport) => {
    setReport(r);
    setStage("result");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this resume report?")) {
      deleteResumeReport(id);
      setHistory(getResumeReports());
    }
  };

  return (
    <AppLayout>
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 className="page-title">Resume Analyzer</h1>
            <p className="page-subtitle">Actual ATS parsing logic based on deterministic rules.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`btn btn-sm ${stage === "upload" || stage === "result" ? "btn-primary" : "btn-outline"}`} onClick={() => stage === "result" ? reset() : setStage("upload")} disabled={stage === "processing"}>New Upload</button>
            <button className={`btn btn-sm ${stage === "history" ? "btn-primary" : "btn-outline"}`} onClick={() => setStage("history")} disabled={stage === "processing"}>History</button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <div>
              <div style={{ fontWeight: 700 }}>Analysis Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {stage === "upload" && (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center", padding: "40px 24px" }}>
              <div className="form-group" style={{ textAlign: "left", maxWidth: 300, margin: "0 auto 24px" }}>
                <label className="form-label">What job role are you targeting?</label>
                <input className="form-input" value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Software Developer" />
              </div>

              <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--blue-50)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Upload your resume</h3>
              <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
                Upload a PDF or DOCX file. The content will be extracted and evaluated against ATS rules.
              </p>
              
              <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} id="resume-upload" />
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                {!file ? (
                  <label htmlFor="resume-upload" className="btn btn-outline" style={{ cursor: "pointer" }}>Select PDF/DOCX File</label>
                ) : (
                  <>
                    <div style={{ padding: "10px 16px", background: "var(--bg)", borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--blue)" }}>📄</span> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>×</button>
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={startAnalysis}>Analyze Resume</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {stage === "processing" && (
          <div className="card">
            <div className="card-body" style={{ padding: "60px 40px" }}>
              <div style={{ maxWidth: 300, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  {processStep >= 0 ? <span style={{ color: "var(--green)" }}>✓</span> : <span className="spinner" />}
                  <span style={{ color: processStep >= 0 ? "var(--text)" : "var(--text-2)" }}>Uploading resume...</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  {processStep >= 1 ? <span style={{ color: "var(--green)" }}>✓</span> : processStep === 0 ? <span className="spinner" /> : <span style={{ width: 16 }}/>}
                  <span style={{ color: processStep >= 1 ? "var(--text)" : "var(--text-2)" }}>Extracting text...</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  {processStep >= 2 ? <span style={{ color: "var(--green)" }}>✓</span> : processStep === 1 ? <span className="spinner" /> : <span style={{ width: 16 }}/>}
                  <span style={{ color: processStep >= 2 ? "var(--text)" : "var(--text-2)" }}>Checking document type...</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  {processStep >= 3 ? <span style={{ color: "var(--green)" }}>✓</span> : processStep === 2 ? <span className="spinner" /> : <span style={{ width: 16 }}/>}
                  <span style={{ color: processStep >= 3 ? "var(--text)" : "var(--text-2)" }}>Analyzing structure & keywords...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {stage === "result" && report && (
          <div>
            {/* Score Card */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ textAlign: "center", padding: "16px 24px", borderRight: "1px solid var(--border)" }}>
                  <div className="label-cap" style={{ marginBottom: 6 }}>ATS Compatibility</div>
                  <div style={{ fontSize: 52, fontWeight: 800, color: report.atsScore >= 75 ? "var(--green)" : report.atsScore >= 60 ? "var(--amber)" : "var(--red)", lineHeight: 1 }}>
                    {report.atsScore}<span style={{ fontSize: 22, color: "var(--text-3)" }}>/100</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, fontWeight: 600 }}>
                    {report.atsScore >= 90 ? "Excellent" : report.atsScore >= 75 ? "Good" : report.atsScore >= 60 ? "Needs Improvement" : "Poor"}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{report.fileName}</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>Target Role: <strong>{report.targetRole}</strong></div>
                  <div style={{ fontSize: 13, color: "var(--text-2)" }}>Analyzed: {new Date(report.uploadDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Structure / Sections */}
                <div className="card">
                  <div className="card-header"><span className="section-title">Resume Sections</span></div>
                  <div className="card-body">
                    {Object.entries(report.detectedSections).map(([sec, status]) => (
                      <div key={sec} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontWeight: 700, color: status === "PRESENT" ? "var(--green)" : "var(--amber)" }}>{status === "PRESENT" ? "✓" : "⚠"}</span>
                        <span style={{ fontSize: 13.5, color: "var(--text)" }}>{sec}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="card">
                  <div className="card-header">
                    <span className="section-title">Role Keywords ({report.keywordMatches.matchPercentage}%)</span>
                  </div>
                  <div className="card-body">
                    <div className="label-cap" style={{ marginBottom: 8, color: "var(--green)" }}>Detected</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {report.keywordMatches.detectedKeywords.length > 0 ? report.keywordMatches.detectedKeywords.map(k => (
                        <span key={k} className="tag" style={{ background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)" }}>{k}</span>
                      )) : <span style={{ fontSize: 13, color: "var(--text-3)" }}>None detected</span>}
                    </div>

                    <div className="label-cap" style={{ marginBottom: 8, color: "var(--amber)" }}>Missing (Consider adding)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {report.keywordMatches.missingKeywords.length > 0 ? report.keywordMatches.missingKeywords.map(k => (
                        <span key={k} className="tag" style={{ background: "var(--bg)", color: "var(--text-2)", border: "1px solid var(--border)" }}>{k}</span>
                      )) : <span style={{ fontSize: 13, color: "var(--text-3)" }}>All targeted keywords detected!</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Findings / Format */}
                <div className="card">
                  <div className="card-header"><span className="section-title">Formatting Findings</span></div>
                  <div className="card-body">
                    {report.formattingFindings.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < report.formattingFindings.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <span style={{ fontWeight: 700, color: f.ok ? "var(--green)" : f.warn ? "var(--amber)" : "var(--red)" }}>
                          {f.ok ? "✓" : f.warn ? "⚠" : "✗"}
                        </span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{f.label}</div>
                          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div className="card">
                  <div className="card-header"><span className="section-title">Feedback</span></div>
                  <div className="card-body">
                    <div className="label-cap" style={{ marginBottom: 8, color: "var(--green)" }}>Strengths</div>
                    <ul style={{ paddingLeft: 20, margin: "0 0 16px 0", fontSize: 13.5, color: "var(--text-2)" }}>
                      {report.strengths.length > 0 ? report.strengths.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>) : <li>No specific strengths detected.</li>}
                    </ul>

                    <div className="label-cap" style={{ marginBottom: 8, color: "var(--amber)" }}>Areas to Improve</div>
                    <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13.5, color: "var(--text-2)" }}>
                      {report.improvements.length > 0 ? report.improvements.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>) : <li>No major issues found.</li>}
                    </ul>
                  </div>
                </div>

                {/* Breakdown Details */}
                <details style={{ fontSize: 13, color: "var(--text-2)" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--blue)" }}>How was my score calculated?</summary>
                  <div style={{ marginTop: 12, padding: 12, background: "var(--bg)", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Contact Info</span><span>{report.scoreBreakdown.contactInformation}/10</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Structure</span><span>{report.scoreBreakdown.structure}/15</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Section Headings</span><span>{report.scoreBreakdown.sectionHeadings}/10</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Extractability</span><span>{report.scoreBreakdown.textExtractability}/15</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Formatting</span><span>{report.scoreBreakdown.formatting}/15</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Keywords</span><span>{report.scoreBreakdown.targetKeywords}/15</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Exp/Projects</span><span>{report.scoreBreakdown.experienceProjects}/10</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Readability</span><span>{report.scoreBreakdown.readability}/10</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)", fontWeight: 700, color: "var(--text)" }}><span>TOTAL</span><span>{report.atsScore}/100</span></div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {stage === "history" && (
          <div className="card">
            <div className="card-header"><span className="section-title">Resume History</span></div>
            <div className="card-body">
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 14 }}>
                  No resume analysis history yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {history.map(r => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", border: "1px solid var(--border)", borderRadius: 8 }}>
                      <div style={{ fontSize: 24 }}>📄</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.fileName}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>{r.targetRole} · ATS: {r.atsScore}/100</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Analyzed: {new Date(r.uploadDate).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => loadHistoryItem(r)}>View</button>
                        <button className="btn btn-outline btn-sm" style={{ color: "var(--red)", borderColor: "var(--red-border)" }} onClick={(e) => handleDelete(r.id, e)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
