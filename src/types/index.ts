// ── Assessment ──────────────────────────────────────────
export interface AssessmentQuestion {
  id: string;
  category: 'anxiety' | 'confidence' | 'readiness' | 'experience' | 'communication';
  text: string;
  reversed?: boolean; // if true, high answer = less of that category
}

export interface AssessmentResponse {
  questionId: string;
  value: number; // 1–5
}

export interface AssessmentScores {
  anxiety: number;       // 0–100, higher = more anxious
  confidence: number;    // 0–100, higher = more confident
  readiness: number;     // 0–100, higher = more prepared
  experience: number;    // 0–100, higher = more experience
  communication: number; // 0–100, higher = more comfortable
  anxietyLevel: 'Low' | 'Medium' | 'High';
  overallReadiness: number; // weighted composite
}

export interface Assessment {
  id: string;
  userId: string;
  completedAt: string; // ISO date
  responses: AssessmentResponse[];
  scores: AssessmentScores;
  recommendations: Recommendation[];
}

// ── Recommendations ─────────────────────────────────────
export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  duration: string;
  href: string;
  priority: number; // lower = higher priority
}

// ── Practice Sessions ────────────────────────────────────
export type PracticeType = 'self-intro' | 'speaking' | 'hr';

export interface SpeechMetrics {
  totalDuration: number;       // seconds
  speechDuration: number;      // seconds above audio threshold
  silenceDuration: number;     // seconds
  pauseCount: number;          // gaps > 0.8s
  longPauseCount: number;      // gaps > 2s
  speechToSilenceRatio: number; // 0–1
  avgVolume: number;           // 0–255 RMS average
  transcript: string | null;
  wordCount: number | null;
  wordsPerMinute: number | null;
  fillerWordCount: number | null;
  fillerWords: string[] | null;
}

export interface PracticeSession {
  id: string;
  userId: string;
  type: PracticeType;
  questionId: string;
  questionText: string;
  completedAt: string;
  duration: number; // seconds
  metrics: SpeechMetrics;
  speakingConfidenceIndicator: number | null; // 0–100
}

// ── Interview ────────────────────────────────────────────
export type InterviewType = 'hr' | 'technical' | 'behavioral' | 'situational';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface InterviewQuestion {
  id: string;
  text: string;
  category: InterviewType;
  difficulty: Difficulty;
  expectedPoints: string[];
  timeRecommendation: number; // seconds
}

export interface InterviewResponse {
  questionId: string;
  questionText: string;
  displayedAt: number;       // timestamp ms
  speechStartedAt: number | null; // timestamp ms
  finishedAt: number;        // timestamp ms
  responseTime: number | null; // seconds (speechStartedAt - displayedAt)
  metrics: SpeechMetrics | null;
}

export interface ComponentScores {
  communication: number | null;
  speakingConfidence: number | null;
  answerStructure: number | null;
  voiceClarity: number | null;
  responseTime: number | null;
}

export interface InterviewSession {
  id: string;
  userId: string;
  type: InterviewType;
  difficulty: Difficulty;
  startedAt: string;
  completedAt: string;
  targetRole: string;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  overallScore: number | null;
  componentScores: ComponentScores;
  feedback: FeedbackItem[];
  strengths: string[];
  improvements: string[];
}

// ── Feedback ─────────────────────────────────────────────
export interface FeedbackItem {
  category: string;
  message: string;
  type: 'positive' | 'negative' | 'neutral';
}

// ── User Profile ─────────────────────────────────────────
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  education: string;
  college: string;
  targetRole: string;
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior';
  interviewGoal: string;
  photoURL?: string;
  createdAt: string;
}

// ── Progress ─────────────────────────────────────────────
export interface ProgressDataPoint {
  date: string;
  type?: "assessment" | "interview";
  anxiety?: number;
  confidence?: number;
  readiness?: number;
  overallScore?: number;
}

// ── Resume Analyzer ───────────────────────────────────────
export interface ResumeReport {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  targetRole: string;
  uploadDate: string;
  resumeValidationResult: string;
  detectedSections: Record<string, 'PRESENT' | 'MISSING' | 'PARTIALLY DETECTED'>;
  contactInformation: Record<string, boolean>;
  keywordMatches: {
    targetKeywords: string[];
    detectedKeywords: string[];
    missingKeywords: string[];
    matchPercentage: number;
  };
  formattingFindings: { label: string; ok: boolean; warn: boolean; desc: string }[];
  atsScore: number;
  scoreBreakdown: {
    contactInformation: number; // /10
    structure: number; // /15
    sectionHeadings: number; // /10
    textExtractability: number; // /15
    formatting: number; // /15
    targetKeywords: number; // /15
    experienceProjects: number; // /10
    readability: number; // /10
  };
  strengths: string[];
  improvements: string[];
}

