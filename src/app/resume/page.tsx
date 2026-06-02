"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Target, 
  TrendingUp, 
  ShieldCheck,
  FileSearch,
  Briefcase,
  Code,
  LineChart,
  Palette,
  Cpu,
  ArrowRight,
  Download,
  Plus,
  Search,
  Check
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

// Mock roles
const jobRoles = [
  { id: "software-dev", title: "Software Developer", icon: Code },
  { id: "data-analyst", title: "Data Analyst", icon: LineChart },
  { id: "ui-ux", title: "UI/UX Designer", icon: Palette },
  { id: "ai-eng", title: "AI Engineer", icon: Cpu },
];

export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState(jobRoles[0]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const startAnalysis = () => {
    if (!file) return;
    setAnalyzing(true);
    setAnalyzingStep(1);

    // Simulate multi-step analysis
    const steps = [
      "Scanning document structure...",
      "Extracting technical competencies...",
      "Evaluating semantic professional wording...",
      "Checking ATS compatibility markers...",
      "Comparing with industry benchmarks..."
    ];

    let currentStep = 1;
    const interval = setInterval(() => {
      currentStep++;
      setAnalyzingStep(currentStep);
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          generateResults();
        }, 1000);
      }
    }, 1500);
  };

  const generateResults = () => {
    setResults({
      overallScore: 82,
      atsScore: 78,
      skillsMatch: 85,
      professionalism: 90,
      sections: [
        { name: "Profile Summary", score: 85, status: "good", feedback: "Strong opening, but could use more quantifiable achievements." },
        { name: "Work Experience", score: 72, status: "warning", feedback: "Use more action verbs like 'Architected' or 'Optimized' instead of 'Worked on'." },
        { name: "Technical Skills", score: 94, status: "excellent", feedback: "Excellent keyword density for modern tech stacks." },
        { name: "Projects", score: 80, status: "good", feedback: "Add links to GitHub or live demos to increase credibility." },
        { name: "Education", score: 100, status: "excellent", feedback: "Perfectly formatted." }
      ],
      missingKeywords: ["CI/CD Pipelines", "Unit Testing", "Microservices", "Cloud Architecture"],
      suggestions: [
        "Include more metrics (e.g., 'Reduced latency by 30%').",
        "Add a 'Certifications' section to highlight specialized knowledge.",
        "Ensure your contact info includes your LinkedIn profile link."
      ],
      roleMatch: 88
    });
    setAnalyzing(false);
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    setAnalyzing(false);
    setAnalyzingStep(0);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Sidebar />

      <main className="flex-1 w-full lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-blue-500 font-bold">
                <Sparkles size={18} />
                <span className="text-xs uppercase tracking-[0.2em]">Next-Gen Intelligence</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">AI Resume Analyzer</h1>
              <p className="text-slate-400 mt-1">Optimize your resume for ATS and human recruiters with real-time feedback.</p>
            </div>

            {results && (
              <button 
                onClick={reset}
                className="rounded-2xl bg-white/5 border border-white/10 px-6 py-3 font-bold hover:bg-white/10 transition-all"
              >
                Upload New Resume
              </button>
            )}
          </header>

          <AnimatePresence mode="wait">
            {!file && !results ? (
              <motion.div
                key="upload-zone"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "glass group relative flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed p-20 transition-all duration-500",
                  isDragging ? "border-blue-500 bg-blue-500/10 scale-[0.99]" : "border-white/10 hover:border-blue-500/30 hover:bg-white/5"
                )}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative mb-8 h-24 w-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
                  <Upload size={40} />
                </div>
                
                <h3 className="relative text-3xl font-black mb-4">Upload Your Resume</h3>
                <p className="relative text-slate-400 text-center max-w-md mb-10 leading-relaxed">
                  Drag and drop your PDF or DOCX file here. Our AI will analyze it against industry standards and 100+ recruiter benchmarks.
                </p>

                <label className="relative cursor-pointer rounded-2xl bg-white px-8 py-4 font-bold text-black shadow-xl transition-all hover:scale-105 active:scale-95">
                  Browse Files
                  <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                </label>

                <p className="mt-8 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Your privacy is protected. Files are processed securely.
                </p>
              </motion.div>
            ) : file && !results && !analyzing ? (
              <motion.div
                key="file-ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass rounded-[40px] p-12 border border-white/10 text-center">
                  <div className="mb-8 flex justify-center">
                    <div className="h-32 w-32 rounded-[32px] bg-slate-800 border border-white/10 flex items-center justify-center relative">
                      <FileText size={64} className="text-blue-500" />
                      <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-[#020617] text-white">
                        <Check size={20} />
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-black mb-2">{file.name}</h2>
                  <p className="text-slate-500 mb-10 font-medium">Ready for deep AI analysis</p>

                  <div className="mb-10 text-left">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 px-4">Select Target Role</p>
                    <div className="grid grid-cols-2 gap-4">
                      {jobRoles.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300",
                            selectedRole.id === role.id 
                              ? "border-blue-500 bg-blue-500/10 text-white" 
                              : "border-white/5 bg-white/5 text-slate-400 hover:border-white/20"
                          )}
                        >
                          <role.icon size={18} className={selectedRole.id === role.id ? "text-blue-400" : "text-slate-500"} />
                          <span className="text-sm font-bold">{role.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setFile(null)}
                      className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-5 font-bold transition-all hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={startAnalysis}
                      className="flex-1 rounded-2xl bg-blue-600 py-5 font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      Start Analysis <Sparkles size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : analyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl mx-auto py-20 text-center"
              >
                <div className="relative mb-12 inline-block">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="h-40 w-40 rounded-full border-4 border-dashed border-blue-500/30"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileSearch size={48} className="text-blue-500 animate-pulse" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-black mb-6">Analyzing Your Professional Profile</h2>
                <div className="max-w-md mx-auto space-y-4">
                  {[
                    "Document Structure Scan",
                    "Keyword Extraction",
                    "ATS Formatting Check",
                    "Language Professionalism",
                    "Industry Alignment"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 text-left">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                        analyzingStep > i 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : analyzingStep === i + 1 
                            ? "bg-blue-600 border-blue-600 text-white animate-pulse" 
                            : "bg-white/5 border-white/10 text-slate-500"
                      )}>
                        {analyzingStep > i ? <Check size={12} /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-sm font-bold transition-colors",
                        analyzingStep > i ? "text-white" : analyzingStep === i + 1 ? "text-blue-400" : "text-slate-600"
                      )}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Score Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {[
                    { label: "Overall Score", value: results.overallScore, color: "text-blue-400", bg: "bg-blue-400/10" },
                    { label: "ATS Compatibility", value: results.atsScore, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                    { label: "Skills Match", value: results.skillsMatch, color: "text-purple-400", bg: "bg-purple-400/10" },
                    { label: "Professionalism", value: results.professionalism, color: "text-amber-400", bg: "bg-amber-400/10" },
                  ].map((score, i) => (
                    <div key={i} className="glass rounded-[32px] p-8 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{score.label}</p>
                      <div className="flex items-end justify-between">
                        <span className={cn("text-5xl font-black", score.color)}>{score.value}%</span>
                        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
                          <TrendingUp size={20} className={score.color} />
                        </div>
                      </div>
                      <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${score.value}%` }}
                          className={cn("h-full", score.bg.replace('/10', ''))}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Section Analysis */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold px-2">Section-wise Analysis</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {results.sections.map((section: any, i: number) => (
                        <div key={i} className="glass group rounded-[24px] p-6 border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                section.status === "excellent" ? "bg-emerald-500/10 text-emerald-500" :
                                section.status === "good" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                              )}>
                                {section.status === "excellent" ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                              </div>
                              <div>
                                <h4 className="font-bold text-white">{section.name}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Score: {section.score}/100</p>
                              </div>
                            </div>
                            <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full",
                                  section.status === "excellent" ? "bg-emerald-500" :
                                  section.status === "good" ? "bg-blue-500" : "bg-amber-500"
                                )}
                                style={{ width: `${section.score}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed pl-14">{section.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart Suggestions & Matching */}
                  <div className="space-y-8">
                    {/* Role Match */}
                    <div className="glass rounded-[32px] p-8 border border-blue-500/20 bg-blue-500/5">
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                          <selectedRole.icon size={24} />
                        </div>
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Match Rating</span>
                      </div>
                      <h4 className="text-lg font-bold mb-1">Target: {selectedRole.title}</h4>
                      <div className="mt-8 flex items-center gap-6">
                        <div className="relative h-20 w-20">
                          <svg className="h-full w-full" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/5" strokeWidth="3" />
                            <motion.circle 
                              cx="18" cy="18" r="16" fill="none" 
                              className="stroke-blue-500" 
                              strokeWidth="3" 
                              strokeDasharray="100" 
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 100 - results.roleMatch }}
                              strokeLinecap="round" 
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-sm font-black">
                            {results.roleMatch}%
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-400 leading-relaxed italic">
                            "Strong alignment with technical requirements. Focus on adding more CI/CD keywords."
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div className="glass rounded-[32px] p-8 border border-white/5">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Target size={20} className="text-amber-500" />
                        Missing Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {results.missingKeywords.map((kw: string, i: number) => (
                          <span key={i} className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300">
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="glass rounded-[32px] p-8 border border-white/5">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-500" />
                        Smart Suggestions
                      </h3>
                      <div className="space-y-4">
                        {results.suggestions.map((s: string, i: number) => (
                          <div key={i} className="flex gap-3 items-start">
                            <div className="mt-1 h-5 w-5 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 flex-shrink-0">
                              <Check size={12} />
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col md:flex-row gap-6 pt-10 border-t border-white/5">
                  <div className="flex-1 flex items-center gap-6 glass rounded-3xl p-6 border border-white/5">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Briefcase size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold">Next Step: Interview Prep</h4>
                      <p className="text-xs text-slate-500">Practice questions generated from your resume.</p>
                    </div>
                    <Link href="/coach" className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-white transition-all hover:scale-105">
                      Start Coaching <ArrowRight size={16} />
                    </Link>
                  </div>
                  
                  <button className="rounded-3xl bg-white text-black px-10 py-6 font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95">
                    <Download size={20} />
                    Download Analysis Report
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Link({ href, children, className }: { href: string, children: React.ReactNode, className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
