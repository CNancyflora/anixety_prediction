import type { InterviewQuestion } from '@/types';

// ── HR Questions ─────────────────────────────────────────
const HR_QUESTIONS: InterviewQuestion[] = [
  { id: 'hr1', text: 'Tell me about yourself.', category: 'hr', difficulty: 'beginner', expectedPoints: ['Introduction', 'Education or background', 'Key skills', 'Relevant experience or project', 'Career goal'], timeRecommendation: 90 },
  { id: 'hr2', text: 'What are your greatest strengths?', category: 'hr', difficulty: 'beginner', expectedPoints: ['Named strength', 'Specific example or evidence', 'Relevance to the role'], timeRecommendation: 60 },
  { id: 'hr3', text: 'What is one weakness you are currently working to improve?', category: 'hr', difficulty: 'beginner', expectedPoints: ['Honest weakness', 'Awareness of it', 'Steps being taken to improve'], timeRecommendation: 60 },
  { id: 'hr4', text: 'Why should we hire you?', category: 'hr', difficulty: 'intermediate', expectedPoints: ['Specific skill match', 'Value you bring', 'Enthusiasm for the role'], timeRecommendation: 75 },
  { id: 'hr5', text: 'Where do you see yourself in five years?', category: 'hr', difficulty: 'intermediate', expectedPoints: ['Clear direction', 'Aligned with role', 'Shows ambition and focus'], timeRecommendation: 60 },
  { id: 'hr6', text: 'Why do you want this role?', category: 'hr', difficulty: 'beginner', expectedPoints: ['Interest in the work', 'Company knowledge', 'Personal motivation'], timeRecommendation: 60 },
  { id: 'hr7', text: 'Tell me about a challenge you faced and how you handled it.', category: 'hr', difficulty: 'intermediate', expectedPoints: ['Specific situation', 'Challenge described', 'Your action', 'Result or outcome'], timeRecommendation: 90 },
  { id: 'hr8', text: 'How do you handle pressure or tight deadlines?', category: 'hr', difficulty: 'intermediate', expectedPoints: ['Strategy described', 'Example given', 'Positive outcome'], timeRecommendation: 60 },
  { id: 'hr9', text: 'How do you handle conflict with a teammate?', category: 'hr', difficulty: 'advanced', expectedPoints: ['Calm approach', 'Communication used', 'Resolution', 'What you learnt'], timeRecommendation: 90 },
  { id: 'hr10', text: 'Tell me about a time you showed leadership.', category: 'hr', difficulty: 'advanced', expectedPoints: ['Situation described', 'Your leadership role', 'Team outcome', 'What you learnt'], timeRecommendation: 90 },
];

// ── Behavioral Questions ─────────────────────────────────
const BEHAVIORAL_QUESTIONS: InterviewQuestion[] = [
  { id: 'beh1', text: 'Give an example of a goal you set and how you achieved it.', category: 'behavioral', difficulty: 'beginner', expectedPoints: ['Goal stated', 'Steps taken', 'Outcome'], timeRecommendation: 75 },
  { id: 'beh2', text: 'Describe a situation where you had to adapt to a significant change.', category: 'behavioral', difficulty: 'intermediate', expectedPoints: ['Change described', 'Your response', 'Outcome', 'What you learnt'], timeRecommendation: 90 },
  { id: 'beh3', text: 'Tell me about a time you had to manage competing priorities.', category: 'behavioral', difficulty: 'intermediate', expectedPoints: ['Context', 'How you prioritised', 'Result'], timeRecommendation: 75 },
  { id: 'beh4', text: 'Describe a time you took initiative to solve a problem.', category: 'behavioral', difficulty: 'intermediate', expectedPoints: ['Problem identified', 'Initiative taken', 'Outcome'], timeRecommendation: 75 },
  { id: 'beh5', text: 'Tell me about a time you received critical feedback.', category: 'behavioral', difficulty: 'advanced', expectedPoints: ['Feedback described', 'Your reaction', 'Steps taken', 'Improvement shown'], timeRecommendation: 90 },
  { id: 'beh6', text: 'Describe a time you influenced others without direct authority.', category: 'behavioral', difficulty: 'advanced', expectedPoints: ['Situation', 'Approach used', 'Outcome'], timeRecommendation: 90 },
];

// ── Technical Questions (General) ────────────────────────
const TECHNICAL_QUESTIONS: InterviewQuestion[] = [
  { id: 'tech1', text: 'Walk me through a complex technical challenge you recently solved.', category: 'technical', difficulty: 'intermediate', expectedPoints: ['Problem described', 'Approach', 'Tools used', 'Solution', 'Outcome'], timeRecommendation: 120 },
  { id: 'tech2', text: 'How do you ensure code quality and maintainability?', category: 'technical', difficulty: 'intermediate', expectedPoints: ['Practices mentioned (testing, reviews)', 'Specific examples', 'Tools used'], timeRecommendation: 75 },
  { id: 'tech3', text: 'Explain time complexity and give an example.', category: 'technical', difficulty: 'intermediate', expectedPoints: ['Big-O notation explained', 'Example given', 'Practical relevance'], timeRecommendation: 90 },
  { id: 'tech4', text: 'How would you design a scalable system for a high-traffic application?', category: 'technical', difficulty: 'advanced', expectedPoints: ['Architecture approach', 'Scalability considerations', 'Trade-offs discussed'], timeRecommendation: 120 },
  { id: 'tech5', text: 'Describe your debugging approach for a production issue.', category: 'technical', difficulty: 'intermediate', expectedPoints: ['Systematic approach', 'Tools used', 'Root cause analysis', 'Fix and prevention'], timeRecommendation: 90 },
  { id: 'tech6', text: 'What testing strategies do you follow?', category: 'technical', difficulty: 'beginner', expectedPoints: ['Types of testing mentioned', 'Tools used', 'Importance explained'], timeRecommendation: 60 },
];

// ── Situational Questions ────────────────────────────────
const SITUATIONAL_QUESTIONS: InterviewQuestion[] = [
  { id: 'sit1', text: 'If you discovered a major bug in production an hour before release, what would you do?', category: 'situational', difficulty: 'intermediate', expectedPoints: ['Calm approach', 'Escalation decision', 'Communication', 'Resolution plan'], timeRecommendation: 90 },
  { id: 'sit2', text: 'If a team member is consistently missing deadlines, how would you handle it?', category: 'situational', difficulty: 'intermediate', expectedPoints: ['Empathy first', 'Direct communication', 'Escalation if needed', 'Team impact considered'], timeRecommendation: 75 },
  { id: 'sit3', text: 'If you disagreed with your manager\'s technical decision, what would you do?', category: 'situational', difficulty: 'advanced', expectedPoints: ['Respectful approach', 'Data or evidence used', 'Accepting final decision', 'Professionalism'], timeRecommendation: 75 },
  { id: 'sit4', text: 'How would you onboard yourself into a codebase you have never seen before?', category: 'situational', difficulty: 'beginner', expectedPoints: ['Documentation first', 'Running the project', 'Reading core files', 'Asking questions'], timeRecommendation: 60 },
];

// ── Self Introduction Practice Questions ────────────────
export const SELF_INTRO_QUESTIONS = [
  { id: 'si1', text: 'Tell me about yourself.' },
  { id: 'si2', text: 'Give me a brief introduction about your background and what you do.' },
  { id: 'si3', text: 'Describe yourself in 2 minutes.' },
];

// ── Speaking Confidence Practice Questions ───────────────
export const SPEAKING_QUESTIONS = [
  { id: 'sp1', text: 'What are your top three strengths and how have they helped you?' },
  { id: 'sp2', text: 'Describe your ideal work environment.' },
  { id: 'sp3', text: 'What motivates you to do your best work?' },
  { id: 'sp4', text: 'What is one professional skill you are proud of?' },
];

// ── HR Practice Questions ────────────────────────────────
export const HR_PRACTICE_QUESTIONS = HR_QUESTIONS.slice(0, 5);

// ── Question selection for mock interview ────────────────
export function selectQuestions(
  type: string,
  difficulty: string,
  count: number
): InterviewQuestion[] {
  let pool: InterviewQuestion[] = [];

  switch (type) {
    case 'hr': pool = HR_QUESTIONS; break;
    case 'technical': pool = TECHNICAL_QUESTIONS; break;
    case 'behavioral': pool = BEHAVIORAL_QUESTIONS; break;
    case 'situational': pool = SITUATIONAL_QUESTIONS; break;
    default: pool = [...HR_QUESTIONS, ...BEHAVIORAL_QUESTIONS];
  }

  // Filter by difficulty (include beginner always, then add higher)
  const diffOrder = ['beginner', 'intermediate', 'advanced'];
  const diffIndex = diffOrder.indexOf(difficulty);
  const eligible = pool.filter(q => diffOrder.indexOf(q.difficulty) <= diffIndex);

  // Prioritize: take harder questions first for harder difficulty
  const sorted = [...eligible].sort((a, b) => {
    if (difficulty === 'advanced') return diffOrder.indexOf(b.difficulty) - diffOrder.indexOf(a.difficulty);
    if (difficulty === 'beginner') return diffOrder.indexOf(a.difficulty) - diffOrder.indexOf(b.difficulty);
    return 0;
  });

  // Return requested count (shuffle slightly by taking from distributed positions)
  const step = Math.max(1, Math.floor(sorted.length / count));
  const selected: InterviewQuestion[] = [];
  for (let i = 0; i < sorted.length && selected.length < count; i += step) {
    selected.push(sorted[i]);
  }

  // Fill up if needed
  for (const q of sorted) {
    if (selected.length >= count) break;
    if (!selected.find(s => s.id === q.id)) selected.push(q);
  }

  return selected.slice(0, count);
}
