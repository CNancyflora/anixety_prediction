import type { AssessmentQuestion, AssessmentResponse, AssessmentScores, Recommendation } from '@/types';

// ── 25 Assessment Questions (5 per category) ────────────
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // ANXIETY (higher answer = more anxious)
  { id: 'a1', category: 'anxiety', text: 'How nervous do you feel before an interview?' },
  { id: 'a2', category: 'anxiety', text: 'How worried are you about giving a wrong answer?' },
  { id: 'a3', category: 'anxiety', text: 'How uncomfortable do you feel when speaking to an interviewer?' },
  { id: 'a4', category: 'anxiety', text: 'How often do you hesitate while answering interview questions?' },
  { id: 'a5', category: 'anxiety', text: 'How stressed do you feel when asked an unexpected question?' },

  // CONFIDENCE (higher answer = more confident)
  { id: 'c1', category: 'confidence', text: 'I can introduce myself clearly and confidently.' },
  { id: 'c2', category: 'confidence', text: 'I can explain my projects and skills without difficulty.' },
  { id: 'c3', category: 'confidence', text: 'I feel comfortable answering HR questions.' },
  { id: 'c4', category: 'confidence', text: 'I can hold a professional conversation with new people.' },
  { id: 'c5', category: 'confidence', text: 'I can handle unexpected interview questions without panicking.' },

  // READINESS (higher answer = more prepared)
  { id: 'r1', category: 'readiness', text: 'How much time do you spend preparing for interviews?' },
  { id: 'r2', category: 'readiness', text: 'How familiar are you with common HR and behavioral questions?' },
  { id: 'r3', category: 'readiness', text: 'How prepared are you to explain your projects or work experience?' },
  { id: 'r4', category: 'readiness', text: 'How comfortable are you with the format of a structured interview?' },
  { id: 'r5', category: 'readiness', text: 'How often do you practice speaking or mock interviews?' },

  // EXPERIENCE (higher answer = more experience)
  { id: 'e1', category: 'experience', text: 'How many real interviews have you attended so far?' },
  { id: 'e2', category: 'experience', text: 'How familiar are you with behavioural questions (STAR method)?' },
  { id: 'e3', category: 'experience', text: 'How comfortable are you with group discussions or panel interviews?' },
  { id: 'e4', category: 'experience', text: 'How often have you received feedback after an interview?' },
  { id: 'e5', category: 'experience', text: 'How well do you know what interviewers typically evaluate?' },

  // COMMUNICATION (higher answer = more comfortable communicating)
  { id: 'co1', category: 'communication', text: 'I can speak clearly and at a comfortable pace.' },
  { id: 'co2', category: 'communication', text: 'I can organize my thoughts before speaking.' },
  { id: 'co3', category: 'communication', text: 'I avoid using filler words like "um" and "uh" frequently.' },
  { id: 'co4', category: 'communication', text: 'I can maintain a professional tone throughout a conversation.' },
  { id: 'co5', category: 'communication', text: 'I can give structured answers with a clear beginning and end.' },
];

const SCALE_LABELS: Record<number, string> = {
  1: 'Very Low / Strongly Disagree',
  2: 'Low / Disagree',
  3: 'Moderate / Neutral',
  4: 'High / Agree',
  5: 'Very High / Strongly Agree',
};
export { SCALE_LABELS };

// ── Score Calculation ────────────────────────────────────
export function calculateScores(responses: AssessmentResponse[]): AssessmentScores {
  const byCategory = (cat: string) =>
    ASSESSMENT_QUESTIONS.filter(q => q.category === cat).map(q => {
      const resp = responses.find(r => r.questionId === q.id);
      return resp ? resp.value : 3; // default to 3 if unanswered
    });

  const normalize = (values: number[]) => {
    const sum = values.reduce((a, b) => a + b, 0);
    const min = values.length * 1;
    const max = values.length * 5;
    return Math.round(((sum - min) / (max - min)) * 100);
  };

  const anxiety = normalize(byCategory('anxiety'));
  const confidence = normalize(byCategory('confidence'));
  const readiness = normalize(byCategory('readiness'));
  const experience = normalize(byCategory('experience'));
  const communication = normalize(byCategory('communication'));

  const anxietyLevel: 'Low' | 'Medium' | 'High' =
    anxiety <= 33 ? 'Low' : anxiety <= 66 ? 'Medium' : 'High';

  // Overall readiness: weighted combination
  // Anxiety is inverted (lower anxiety = better readiness)
  const overallReadiness = Math.round(
    confidence * 0.30 +
    readiness * 0.30 +
    communication * 0.20 +
    experience * 0.10 +
    (100 - anxiety) * 0.10
  );

  return { anxiety, confidence, readiness, experience, communication, anxietyLevel, overallReadiness };
}

// ── Dynamic Recommendations ──────────────────────────────
export function generateRecommendations(scores: AssessmentScores): Recommendation[] {
  const recs: Recommendation[] = [];

  // Self Introduction — low confidence or low communication
  if (scores.confidence < 50 || scores.communication < 50) {
    recs.push({
      id: 'self-intro',
      title: 'Self Introduction Practice',
      reason: scores.confidence < 50
        ? `Your confidence score (${scores.confidence}%) indicates difficulty introducing yourself. Regular practice builds a confident opener.`
        : `Your communication score (${scores.communication}%) suggests your verbal structure needs strengthening. Start with a structured self-introduction.`,
      duration: '2–3 minutes',
      href: '/practice/self-intro',
      priority: scores.confidence < 40 ? 1 : 2,
    });
  }

  // Speaking Confidence — high anxiety or low communication
  if (scores.anxiety > 50 || scores.communication < 60) {
    recs.push({
      id: 'speaking',
      title: 'Speaking Confidence Practice',
      reason: scores.anxiety > 60
        ? `Your anxiety score (${scores.anxiety}%) is elevated. Speaking exercises help reduce anxiety through repeated exposure.`
        : `Your communication score (${scores.communication}%) indicates room to improve vocal clarity and reduce filler words.`,
      duration: '5–8 minutes',
      href: '/practice/speaking',
      priority: scores.anxiety > 60 ? 1 : 3,
    });
  }

  // HR Questions — low readiness or low experience
  if (scores.readiness < 60 || scores.experience < 50) {
    recs.push({
      id: 'hr',
      title: 'HR Question Practice',
      reason: scores.readiness < 50
        ? `Your readiness score (${scores.readiness}%) suggests limited preparation for typical HR questions. Guided practice will help.`
        : `Your experience score (${scores.experience}%) indicates limited interview exposure. Practising HR questions builds familiarity.`,
      duration: '10–15 minutes',
      href: '/practice/hr',
      priority: scores.readiness < 40 ? 1 : 4,
    });
  }

  // If no specific weakness found, recommend a general mock interview
  if (recs.length === 0) {
    recs.push({
      id: 'interview',
      title: 'Full Mock Interview',
      reason: `Your scores are solid. A complete mock interview will help you apply your preparation in a realistic setting.`,
      duration: '10–15 minutes',
      href: '/interview/setup',
      priority: 1,
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

// ── Score label helpers ──────────────────────────────────
export function anxietyLabel(score: number): string {
  if (score <= 33) return 'Low';
  if (score <= 66) return 'Medium';
  return 'High';
}

export function scoreColor(score: number, inverted = false): string {
  const s = inverted ? 100 - score : score;
  if (s >= 67) return 'var(--green)';
  if (s >= 34) return 'var(--amber)';
  return 'var(--red)';
}

export function anxietyColor(score: number): string {
  // For anxiety: low = green, high = red
  if (score <= 33) return 'var(--green)';
  if (score <= 66) return 'var(--amber)';
  return 'var(--red)';
}

export function anxietyBadgeClass(level: string): string {
  if (level === 'Low') return 'badge badge-green';
  if (level === 'Medium') return 'badge badge-amber';
  return 'badge badge-red';
}

export function scoreBadgeClass(score: number): string {
  if (score >= 67) return 'badge badge-green';
  if (score >= 34) return 'badge badge-amber';
  return 'badge badge-red';
}

export function anxietyInsight(score: number): string {
  if (score <= 33) return 'Your responses indicate a lower level of interview anxiety. You appear relatively calm going into interviews.';
  if (score <= 66) return 'Your responses indicate a moderate level of interview anxiety. Some nervousness is normal and can be managed with practice.';
  return 'Your responses indicate a higher level of interview anxiety. Focused practice and preparation can significantly reduce this.';
}

export function confidenceInsight(score: number): string {
  if (score >= 70) return 'You report strong confidence in your ability to communicate and present yourself.';
  if (score >= 40) return 'You report moderate confidence. Targeted speaking exercises can help you communicate more effectively.';
  return 'Your responses indicate low confidence in interview settings. Regular structured practice is the most effective way to build this.';
}

export function readinessInsight(score: number): string {
  if (score >= 70) return 'Your preparation level appears strong. Focus on refining your delivery and performance.';
  if (score >= 40) return 'You have some preparation but there are gaps. Reviewing common question types will improve your readiness.';
  return 'Your responses suggest limited interview preparation. Structured practice sessions will make a significant difference.';
}
