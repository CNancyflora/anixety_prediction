import type { Assessment, InterviewSession, PracticeSession, UserProfile } from '@/types';
import { db } from './firebase';
import {
  doc, setDoc, getDoc, collection, addDoc,
  query, orderBy, getDocs, serverTimestamp, Timestamp
} from 'firebase/firestore';

// ── Keys ──────────────────────────────────────────────────
const LS = {
  PROFILE: 'ch_profile',
  ASSESSMENTS: 'ch_assessments',
  INTERVIEWS: 'ch_interviews',
  PRACTICES: 'ch_practices',
};

// ── Helpers ───────────────────────────────────────────────
function ls_get<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function ls_set(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}
function ls_push<T extends { id: string }>(key: string, item: T) {
  const arr = ls_get<T>(key);
  const updated = [item, ...arr.filter(a => a.id !== item.id)];
  ls_set(key, updated);
}

// ── User Profile ──────────────────────────────────────────
export async function saveProfile(uid: string, profile: UserProfile) {
  ls_set(LS.PROFILE, profile);
  try {
    await setDoc(doc(db, 'users', uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { console.warn('Firestore profile save failed', e); }
}

export async function loadProfile(uid: string): Promise<UserProfile | null> {
  const cached = localStorage.getItem(LS.PROFILE);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      ls_set(LS.PROFILE, data);
      return data;
    }
  } catch (e) { console.warn('Firestore profile load failed', e); }
  return null;
}

// ── Assessments ───────────────────────────────────────────
export async function saveAssessment(uid: string, assessment: Assessment) {
  ls_push(LS.ASSESSMENTS, assessment);
  try {
    await setDoc(
      doc(db, 'users', uid, 'assessments', assessment.id),
      { ...assessment, createdAt: serverTimestamp() }
    );
  } catch (e) { console.warn('Firestore assessment save failed', e); }
}

export function getAssessments(): Assessment[] {
  return ls_get<Assessment>(LS.ASSESSMENTS);
}

export function getLatestAssessment(): Assessment | null {
  const list = getAssessments();
  return list.length > 0 ? list[0] : null;
}

// ── Interview Sessions ────────────────────────────────────
export async function saveInterview(uid: string, session: InterviewSession) {
  ls_push(LS.INTERVIEWS, session);
  try {
    await setDoc(
      doc(db, 'users', uid, 'interviews', session.id),
      { ...session, createdAt: serverTimestamp() }
    );
  } catch (e) { console.warn('Firestore interview save failed', e); }
}

export function getInterviews(): InterviewSession[] {
  return ls_get<InterviewSession>(LS.INTERVIEWS);
}

export function getInterview(id: string): InterviewSession | null {
  return getInterviews().find(s => s.id === id) ?? null;
}

// ── Practice Sessions ─────────────────────────────────────
export async function savePractice(uid: string, session: PracticeSession) {
  ls_push(LS.PRACTICES, session);
  try {
    await setDoc(
      doc(db, 'users', uid, 'practices', session.id),
      { ...session, createdAt: serverTimestamp() }
    );
  } catch (e) { console.warn('Firestore practice save failed', e); }
}

export function getPractices(): PracticeSession[] {
  return ls_get<PracticeSession>(LS.PRACTICES);
}

// ── ID generator ──────────────────────────────────────────
export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Resume Reports ────────────────────────────────────────
import type { ResumeReport } from '@/types';
const LS_RESUMES = 'ch_resumes';

export async function saveResumeReport(uid: string, report: ResumeReport) {
  ls_push(LS_RESUMES, report);
  try {
    await setDoc(
      doc(db, 'users', uid, 'resumes', report.id),
      { ...report, createdAt: serverTimestamp() }
    );
  } catch (e) { console.warn('Firestore resume save failed', e); }
}

export function getResumeReports(): ResumeReport[] {
  return ls_get<ResumeReport>(LS_RESUMES);
}

export function getResumeReport(id: string): ResumeReport | null {
  return getResumeReports().find(r => r.id === id) ?? null;
}

export function deleteResumeReport(id: string) {
  const arr = getResumeReports();
  const updated = arr.filter(r => r.id !== id);
  ls_set(LS_RESUMES, updated);
}

// ── Dashboard summary ─────────────────────────────────────
export function getDashboardData() {
  const latestAssessment = getLatestAssessment();
  const interviews = getInterviews();
  const practices = getPractices();

  return {
    latestAssessment,
    totalInterviews: interviews.length,
    totalPractices: practices.length,
    latestInterview: interviews[0] ?? null,
  };
}
