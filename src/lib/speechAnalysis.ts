import type { SpeechMetrics, ComponentScores, FeedbackItem, InterviewResponse } from '@/types';

const FILLER_WORDS = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'right', 'so', 'well'];
const SILENCE_THRESHOLD = 15;   // RMS below this = silence
const PAUSE_GAP = 0.8;          // seconds of silence = pause
const LONG_PAUSE_GAP = 2.0;     // seconds = long pause

// ── Audio level sampling ─────────────────────────────────
export class AudioAnalyzer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private samples: { time: number; rms: number }[] = [];
  private animId = 0;
  private startTime = 0;

  async connect(stream: MediaStream) {
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.startTime = Date.now();
    this.samples = [];
    this.tick();
  }

  private tick = () => {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const rms = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);
    this.samples.push({ time: (Date.now() - this.startTime) / 1000, rms });
    this.animId = requestAnimationFrame(this.tick);
  };

  getCurrentVolume(): number {
    if (this.samples.length === 0) return 0;
    return this.samples[this.samples.length - 1].rms;
  }

  stop(): { samples: { time: number; rms: number }[]; duration: number } {
    cancelAnimationFrame(this.animId);
    this.ctx?.close().catch(() => {});
    const duration = this.samples.length > 0
      ? this.samples[this.samples.length - 1].time
      : 0;
    return { samples: this.samples, duration };
  }
}

// ── Compute metrics from audio samples ──────────────────
export function computeAudioMetrics(
  samples: { time: number; rms: number }[],
  totalDuration: number
): Partial<SpeechMetrics> {
  if (samples.length === 0) return { totalDuration };

  const sampleInterval = totalDuration / samples.length; // seconds per sample
  let speechDuration = 0;
  let silenceDuration = 0;
  let pauseCount = 0;
  let longPauseCount = 0;
  let silenceStart: number | null = null;
  let totalRms = 0;

  for (const s of samples) {
    totalRms += s.rms;
    const isSilent = s.rms < SILENCE_THRESHOLD;
    if (!isSilent) {
      if (silenceStart !== null) {
        const gapDuration = s.time - silenceStart;
        silenceDuration += gapDuration;
        if (gapDuration >= PAUSE_GAP) pauseCount++;
        if (gapDuration >= LONG_PAUSE_GAP) longPauseCount++;
        silenceStart = null;
      }
      speechDuration += sampleInterval;
    } else {
      if (silenceStart === null) silenceStart = s.time;
    }
  }

  // Handle trailing silence
  if (silenceStart !== null) {
    const gapDuration = totalDuration - silenceStart;
    silenceDuration += gapDuration;
    if (gapDuration >= PAUSE_GAP) pauseCount++;
    if (gapDuration >= LONG_PAUSE_GAP) longPauseCount++;
  }

  const avgVolume = samples.length > 0 ? totalRms / samples.length : 0;
  const speechToSilenceRatio = totalDuration > 0 ? speechDuration / totalDuration : 0;

  return {
    totalDuration,
    speechDuration: Math.round(speechDuration * 10) / 10,
    silenceDuration: Math.round(silenceDuration * 10) / 10,
    pauseCount,
    longPauseCount,
    speechToSilenceRatio: Math.round(speechToSilenceRatio * 100) / 100,
    avgVolume: Math.round(avgVolume),
  };
}

// ── Transcript-based metrics ─────────────────────────────
export function computeTranscriptMetrics(
  transcript: string,
  speechDuration: number
): Partial<SpeechMetrics> {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Words per minute (based on speech duration, not total duration)
  const wordsPerMinute = speechDuration > 0
    ? Math.round((wordCount / speechDuration) * 60)
    : null;

  // Filler word detection
  const lowerTranscript = transcript.toLowerCase();
  const foundFillers: string[] = [];
  let fillerCount = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerTranscript.match(regex) || [];
    if (matches.length > 0) {
      foundFillers.push(`${filler} (×${matches.length})`);
      fillerCount += matches.length;
    }
  }

  return {
    transcript,
    wordCount,
    wordsPerMinute,
    fillerWordCount: fillerCount,
    fillerWords: foundFillers.length > 0 ? foundFillers : null,
  };
}

// ── Merge audio + transcript metrics ────────────────────
export function mergeMetrics(
  audio: Partial<SpeechMetrics>,
  transcript: Partial<SpeechMetrics> | null
): SpeechMetrics {
  return {
    totalDuration: audio.totalDuration ?? 0,
    speechDuration: audio.speechDuration ?? 0,
    silenceDuration: audio.silenceDuration ?? 0,
    pauseCount: audio.pauseCount ?? 0,
    longPauseCount: audio.longPauseCount ?? 0,
    speechToSilenceRatio: audio.speechToSilenceRatio ?? 0,
    avgVolume: audio.avgVolume ?? 0,
    transcript: transcript?.transcript ?? null,
    wordCount: transcript?.wordCount ?? null,
    wordsPerMinute: transcript?.wordsPerMinute ?? null,
    fillerWordCount: transcript?.fillerWordCount ?? null,
    fillerWords: transcript?.fillerWords ?? null,
  };
}

// ── Speaking Confidence Indicator ────────────────────────
export function computeSpeakingConfidence(metrics: SpeechMetrics): number {
  let score = 50;

  // Speech-to-silence ratio contribution (0–25 pts)
  score += (metrics.speechToSilenceRatio - 0.5) * 50;

  // Long pause penalty (-5 per long pause, max -25)
  score -= Math.min(metrics.longPauseCount * 5, 25);

  // Filler word ratio penalty
  if (metrics.wordCount && metrics.fillerWordCount !== null) {
    const ratio = metrics.fillerWordCount / metrics.wordCount;
    if (ratio > 0.15) score -= 20;
    else if (ratio > 0.08) score -= 10;
    else if (ratio < 0.03) score += 5;
  }

  // WPM bonus/penalty
  if (metrics.wordsPerMinute !== null) {
    if (metrics.wordsPerMinute >= 100 && metrics.wordsPerMinute <= 150) score += 15;
    else if (metrics.wordsPerMinute > 170) score -= 10;
    else if (metrics.wordsPerMinute < 60) score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── Response time score ──────────────────────────────────
export function responseTimeScore(avgResponseTime: number): number {
  if (avgResponseTime < 2) return 85;         // too fast
  if (avgResponseTime <= 8) return 100;       // optimal
  if (avgResponseTime <= 15) return 70;       // slow
  return 45;                                   // too slow
}

// ── Overall interview score ──────────────────────────────
export function computeOverallScore(components: ComponentScores): number | null {
  const weights: { key: keyof ComponentScores; weight: number }[] = [
    { key: 'communication', weight: 0.25 },
    { key: 'speakingConfidence', weight: 0.20 },
    { key: 'answerStructure', weight: 0.25 },
    { key: 'voiceClarity', weight: 0.15 },
    { key: 'responseTime', weight: 0.15 },
  ];

  const available = weights.filter(w => components[w.key] !== null);
  if (available.length === 0) return null;

  // Redistribute weights proportionally
  const totalWeight = available.reduce((s, w) => s + w.weight, 0);
  const score = available.reduce((sum, w) => {
    const val = components[w.key] as number;
    return sum + val * (w.weight / totalWeight);
  }, 0);

  return Math.round(score);
}

// ── Generate rule-based feedback ─────────────────────────
export function generateFeedback(
  responses: InterviewResponse[],
  components: ComponentScores
): { feedback: FeedbackItem[]; strengths: string[]; improvements: string[] } {
  const feedback: FeedbackItem[] = [];
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Aggregate metrics
  const allMetrics = responses
    .map(r => r.metrics)
    .filter((m): m is SpeechMetrics => m !== null);

  if (allMetrics.length > 0) {
    // Average response time
    const avgRT = responses
      .filter(r => r.responseTime !== null)
      .reduce((sum, r, _, arr) => sum + (r.responseTime ?? 0) / arr.length, 0);

    if (avgRT > 0) {
      if (avgRT <= 8) {
        strengths.push(`Response time averaged ${avgRT.toFixed(1)}s — within the optimal range.`);
        feedback.push({ category: 'Response Time', message: `Your average response time was ${avgRT.toFixed(1)} seconds, which is within the target range of 2–8 seconds.`, type: 'positive' });
      } else {
        improvements.push('Slow response initiation — try structuring answers before speaking.');
        feedback.push({ category: 'Response Time', message: `Your average response time was ${avgRT.toFixed(1)} seconds, above the target range. Try taking a moment to mentally outline your answer before speaking.`, type: 'negative' });
      }
    }

    // Filler words
    const totalFillers = allMetrics.reduce((s, m) => s + (m.fillerWordCount ?? 0), 0);
    const totalWords = allMetrics.reduce((s, m) => s + (m.wordCount ?? 0), 0);
    if (totalWords > 0) {
      const ratio = totalFillers / totalWords;
      if (ratio > 0.12) {
        improvements.push('High filler word usage — replace with a short pause.');
        feedback.push({ category: 'Filler Words', message: `You used ${totalFillers} filler words across the interview. Replacing filler words with a brief pause sounds more polished.`, type: 'negative' });
      } else if (totalFillers < 5) {
        strengths.push('Low filler word usage throughout the interview.');
        feedback.push({ category: 'Filler Words', message: `You used only ${totalFillers} filler words — a strong indicator of composed delivery.`, type: 'positive' });
      }
    }

    // Long pauses
    const totalLongPauses = allMetrics.reduce((s, m) => s + m.longPauseCount, 0);
    if (totalLongPauses > 4) {
      improvements.push('Multiple long pauses detected — preparation reduces unplanned silence.');
      feedback.push({ category: 'Long Pauses', message: `${totalLongPauses} long pauses (>2s) were detected. Preparation and structured answers help reduce unplanned silences.`, type: 'negative' });
    } else if (totalLongPauses === 0) {
      strengths.push('No long pauses detected — smooth answer delivery.');
      feedback.push({ category: 'Long Pauses', message: `No long pauses detected across the interview. This indicates confident, well-prepared delivery.`, type: 'positive' });
    }

    // Speech rate
    const wpmValues = allMetrics.map(m => m.wordsPerMinute).filter((v): v is number => v !== null);
    if (wpmValues.length > 0) {
      const avgWpm = Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length);
      if (avgWpm > 170) {
        improvements.push('Speech rate was fast — slow down to improve clarity.');
        feedback.push({ category: 'Speaking Pace', message: `Your average speech rate was ${avgWpm} WPM, above the recommended 80–150 WPM. Slowing down slightly improves clarity.`, type: 'negative' });
      } else if (avgWpm >= 80 && avgWpm <= 150) {
        strengths.push(`Speech rate of ${avgWpm} WPM stayed within the recommended range.`);
        feedback.push({ category: 'Speaking Pace', message: `Your average speech rate was ${avgWpm} WPM — within the recommended range of 80–150 WPM.`, type: 'positive' });
      } else if (avgWpm < 80 && avgWpm > 0) {
        improvements.push('Speaking pace was slow — try speaking with slightly more energy.');
        feedback.push({ category: 'Speaking Pace', message: `Your average speech rate was ${avgWpm} WPM, below the recommended range. A slightly faster pace improves engagement.`, type: 'negative' });
      }
    }
  }

  if (components.answerStructure !== null) {
    if (components.answerStructure >= 70) {
      strengths.push('Answer structure covered most expected components.');
    } else {
      improvements.push('Answer structure incomplete — practice structured responses (e.g., STAR method).');
      feedback.push({ category: 'Answer Structure', message: `Your answers covered ${components.answerStructure}% of expected components. Practice using structured formats like STAR (Situation, Task, Action, Result).`, type: 'negative' });
    }
  }

  return { feedback, strengths, improvements };
}

// ── Compute component scores from responses ──────────────
export function computeComponentScores(responses: InterviewResponse[]): ComponentScores {
  const metrics = responses.map(r => r.metrics).filter((m): m is SpeechMetrics => m !== null);

  if (metrics.length === 0) {
    return { communication: null, speakingConfidence: null, answerStructure: null, voiceClarity: null, responseTime: null };
  }

  // Speaking Confidence (averaged across responses)
  const confScores = metrics.map(m => computeSpeakingConfidence(m));
  const speakingConfidence = Math.round(confScores.reduce((a, b) => a + b, 0) / confScores.length);

  // Voice Clarity: based on average WPM alignment and filler ratio
  const wpmScores = metrics.map((m): number | null => {
    if (!m.wordsPerMinute) return null;
    const wpm = m.wordsPerMinute;
    if (wpm >= 100 && wpm <= 150) return 100;
    if (wpm >= 80 && wpm < 100) return 85;
    if (wpm >= 60 && wpm < 80) return 70;
    if (wpm > 150 && wpm <= 170) return 85;
    if (wpm > 170) return 60;
    return 50;
  }).filter((v): v is number => v !== null);
  const voiceClarity = wpmScores.length > 0
    ? Math.round(wpmScores.reduce((a, b) => a + b, 0) / wpmScores.length)
    : null;

  // Communication: speech-to-silence ratio + volume
  const commScores = metrics.map(m => {
    let s = 60;
    s += (m.speechToSilenceRatio - 0.5) * 60;
    if (m.avgVolume > 20) s += 10;
    return Math.max(0, Math.min(100, Math.round(s)));
  });
  const communication = Math.round(commScores.reduce((a, b) => a + b, 0) / commScores.length);

  // Response time score
  const rtValues = responses.filter(r => r.responseTime !== null);
  const avgRT = rtValues.length > 0
    ? rtValues.reduce((s, r) => s + (r.responseTime ?? 0), 0) / rtValues.length
    : null;
  const rtScore = avgRT !== null ? responseTimeScore(avgRT) : null;

  // Answer structure — only if transcripts available
  const withTranscripts = metrics.filter(m => m.transcript && m.transcript.length > 20);
  const answerStructure = withTranscripts.length > 0
    ? Math.round(withTranscripts.reduce((s, m) => {
        // Simple heuristic: longer, more word-rich answers score higher
        const words = m.wordCount ?? 0;
        const ratio = Math.min(words / 80, 1); // 80 words = full score
        return s + ratio * 100;
      }, 0) / withTranscripts.length)
    : null;

  return {
    communication,
    speakingConfidence,
    answerStructure,
    voiceClarity,
    responseTime: rtScore,
  };
}

export function isSpeechRecognitionAvailable(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
}

export function createSpeechRecognizer(): any | null {
  if (typeof window === 'undefined') return null;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const rec: any = new SR();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = 'en-US';
  return rec;
}
