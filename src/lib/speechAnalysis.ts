import type { SpeechMetrics, ComponentScores, FeedbackItem, InterviewResponse } from '@/types';

const FILLER_WORDS = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'right', 'so', 'well'];
const PAUSE_GAP = 0.8;          // seconds of silence = pause
const LONG_PAUSE_GAP = 2.0;     // seconds = long pause

// ── Audio level sampling ─────────────────────────────────
export class AudioAnalyzer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private samples: { time: number; rms: number }[] = [];
  private animId = 0;
  private startTime = 0;
  public noiseFloor = 15;

  async connect(stream: MediaStream) {
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    const source = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512; // better resolution
    this.analyser.smoothingTimeConstant = 0.5; // faster response to transients
    source.connect(this.analyser);
  }
  
  async calibrate(durationMs: number = 1000): Promise<number> {
    return new Promise((resolve) => {
      let tempSamples: number[] = [];
      const interval = setInterval(() => {
        if (!this.analyser || !this.ctx) return;
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        
        // Isolate speech frequencies (approx 300Hz to 3000Hz)
        const hzPerBin = (this.ctx.sampleRate / 2) / this.analyser.frequencyBinCount;
        const startBin = Math.floor(300 / hzPerBin);
        const endBin = Math.ceil(3000 / hzPerBin);
        
        let sum = 0;
        let count = 0;
        for (let i = startBin; i < endBin && i < data.length; i++) {
          sum += data[i] * data[i];
          count++;
        }
        
        const rms = count > 0 ? Math.sqrt(sum / count) : 0;
        tempSamples.push(rms);
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        // Sort to ignore sudden loud spikes during calibration
        tempSamples.sort((a, b) => a - b);
        const validSamples = tempSamples.slice(0, Math.floor(tempSamples.length * 0.8)); // take bottom 80%
        const avgNoise = validSamples.length > 0 ? validSamples.reduce((a, b) => a + b, 0) / validSamples.length : 5;
        this.noiseFloor = Math.max(5, avgNoise + 5); // higher minimum floor and margin
        resolve(this.noiseFloor);
      }, durationMs);
    });
  }
  
  startRecording() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.startTime = Date.now();
    this.samples = [];
    this.tick();
  }

  private tick = () => {
    if (!this.analyser || !this.ctx) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    
    const hzPerBin = (this.ctx.sampleRate / 2) / this.analyser.frequencyBinCount;
    const startBin = Math.floor(300 / hzPerBin);
    const endBin = Math.ceil(3000 / hzPerBin);
    
    let sum = 0;
    let count = 0;
    for (let i = startBin; i < endBin && i < data.length; i++) {
      sum += data[i] * data[i];
      count++;
    }
    
    const rms = count > 0 ? Math.sqrt(sum / count) : 0;
    this.samples.push({ time: (Date.now() - this.startTime) / 1000, rms });
    this.animId = requestAnimationFrame(this.tick);
  };

  getCurrentVolume(): number {
    if (this.samples.length === 0) return 0;
    return this.samples[this.samples.length - 1].rms;
  }

  stop(): { samples: { time: number; rms: number }[]; duration: number; noiseFloor: number } {
    cancelAnimationFrame(this.animId);
    this.ctx?.close().catch(() => {});
    const duration = this.samples.length > 0
      ? this.samples[this.samples.length - 1].time
      : 0;
    return { samples: this.samples, duration, noiseFloor: this.noiseFloor };
  }
}

// ── Compute metrics from audio samples ──────────────────
export function computeAudioMetrics(
  samples: { time: number; rms: number }[],
  totalDuration: number,
  noiseFloor: number = 5
): Partial<SpeechMetrics> {
  if (samples.length === 0) {
    return {
      totalDuration, speechDuration: 0, silenceDuration: totalDuration,
      pauseCount: 0, longPauseCount: 0, speechToSilenceRatio: 0, avgVolume: 0, volumeStability: 100
    };
  }

  const sampleInterval = totalDuration / samples.length; // seconds per sample
  let totalRms = 0;

  // Threshold must be sufficiently above noise floor to be considered human speech
  const SPEECH_THRESHOLD = Math.max(10, noiseFloor * 1.5); 
  const MIN_SPEECH_DURATION = 0.15; // 150ms of sustained volume to count as speech (prevent clicks)
  const HANGOVER_DURATION = 0.45; // 450ms of silence before ending speech segment (natural gaps)

  let isSpeaking = false;
  let currentSpeechLen = 0;
  let currentSilenceLen = 0;
  let speechSegments: {start: number, end: number}[] = [];
  let currentSegmentStart = -1;

  for (const s of samples) {
    totalRms += s.rms;
    const isAboveThreshold = s.rms > SPEECH_THRESHOLD;

    if (isAboveThreshold) {
      currentSpeechLen += sampleInterval;
      currentSilenceLen = 0;

      if (!isSpeaking && currentSpeechLen >= MIN_SPEECH_DURATION) {
        isSpeaking = true;
        currentSegmentStart = s.time - currentSpeechLen;
      }
    } else {
      currentSilenceLen += sampleInterval;
      currentSpeechLen = 0;

      if (isSpeaking && currentSilenceLen >= HANGOVER_DURATION) {
        isSpeaking = false;
        speechSegments.push({start: currentSegmentStart, end: s.time - currentSilenceLen});
        currentSegmentStart = -1;
      }
    }
  }

  // Handle end of recording
  if (isSpeaking && currentSegmentStart !== -1) {
    speechSegments.push({start: currentSegmentStart, end: samples[samples.length - 1].time});
  }

  let speechDuration = speechSegments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
  let silenceDuration = Math.max(0, totalDuration - speechDuration);
  
  let pauseCount = 0;
  let longPauseCount = 0;

  // Calculate pauses only BETWEEN verified speech segments
  for (let i = 1; i < speechSegments.length; i++) {
    const gap = speechSegments[i].start - speechSegments[i - 1].end;
    if (gap >= PAUSE_GAP) pauseCount++;
    if (gap >= LONG_PAUSE_GAP) longPauseCount++;
  }

  // Calculate Volume Stability
  let speechRmsVariances = [];
  let speechSamples = samples.filter(s => s.rms > SPEECH_THRESHOLD);
  let avgSpeechVolume = speechSamples.length > 0 ? speechSamples.reduce((a, b) => a + b.rms, 0) / speechSamples.length : 0;
  
  let volumeStability = 100;
  if (speechSamples.length > 0) {
    const variance = speechSamples.reduce((sum, s) => sum + Math.pow(s.rms - avgSpeechVolume, 2), 0) / speechSamples.length;
    const stdDev = Math.sqrt(variance);
    // Rough heuristic: higher standard deviation = lower stability
    volumeStability = Math.max(0, 100 - (stdDev * 2));
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
    volumeStability: Math.round(volumeStability)
  };
}

// ── Transcript-based metrics ─────────────────────────────
export function computeTranscriptMetrics(
  transcript: string,
  speechDuration: number,
  transcriptConfidence: number | null = null
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
    transcriptConfidence
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
    volumeStability: audio.volumeStability ?? 100,
    transcript: transcript?.transcript ?? null,
    transcriptConfidence: transcript?.transcriptConfidence ?? null,
    wordCount: transcript?.wordCount ?? null,
    wordsPerMinute: transcript?.wordsPerMinute ?? null,
    fillerWordCount: transcript?.fillerWordCount ?? null,
    fillerWords: transcript?.fillerWords ?? null,
  };
}

export interface PerformanceBreakdown {
  speakingRateScore: number | null;
  voiceClarityScore: number | null;
  fluencyScore: number;
  pauseControlScore: number;
  fillerControlScore: number | null;
  volumeStabilityScore: number;
  overallScore: number;
}

export function computePerformanceBreakdown(metrics: SpeechMetrics): PerformanceBreakdown | null {
  if (!metrics || metrics.speechDuration < 3) return null;

  // A. Speaking Rate — 20% (Target 120-160 WPM)
  let srScore: number | null = null;
  if (metrics.wordsPerMinute) {
    const wpm = metrics.wordsPerMinute;
    if (wpm >= 120 && wpm <= 160) srScore = 100;
    else if (wpm > 160 && wpm <= 180) srScore = 80;
    else if (wpm > 180) srScore = 60;
    else if (wpm >= 100 && wpm < 120) srScore = 80;
    else if (wpm < 100) srScore = 60;
  }

  // B. Voice Clarity — 25% (Speech recognition confidence)
  let vcScore: number | null = metrics.transcriptConfidence ? Math.round(metrics.transcriptConfidence * 100) : null;

  // C. Fluency — 20% (Speech-to-silence ratio & interruptions)
  let flScore = 50 + (metrics.speechToSilenceRatio - 0.5) * 100;
  flScore = Math.max(0, Math.min(100, flScore));

  // D. Pause Control — 15%
  let pcScore = 100 - (metrics.longPauseCount * 15);
  pcScore = Math.max(0, Math.min(100, pcScore));

  // E. Filler Words — 10%
  let fwScore: number | null = null;
  if (metrics.wordCount && metrics.wordCount > 0 && metrics.fillerWordCount !== null) {
    const fillerRate = (metrics.fillerWordCount / metrics.wordCount) * 100;
    if (fillerRate > 5) fwScore = 50;
    else if (fillerRate > 2) fwScore = 75;
    else if (fillerRate > 0) fwScore = 90;
    else fwScore = 100;
  }

  // F. Volume Stability — 10%
  let vsScore = metrics.volumeStability;

  // Overall Calculation
  const weights = [
    { score: srScore, weight: 0.20 },
    { score: vcScore, weight: 0.25 },
    { score: flScore, weight: 0.20 },
    { score: pcScore, weight: 0.15 },
    { score: fwScore, weight: 0.10 },
    { score: vsScore, weight: 0.10 }
  ];

  let totalWeight = 0;
  let weightedSum = 0;
  
  weights.forEach(w => {
    if (w.score !== null) {
      totalWeight += w.weight;
      weightedSum += w.score * w.weight;
    }
  });

  let overall = totalWeight > 0 ? (weightedSum / totalWeight) : 0;

  return {
    speakingRateScore: srScore !== null ? Math.round(srScore) : null,
    voiceClarityScore: vcScore !== null ? Math.round(vcScore) : null,
    fluencyScore: Math.round(flScore),
    pauseControlScore: Math.round(pcScore),
    fillerControlScore: fwScore !== null ? Math.round(fwScore) : null,
    volumeStabilityScore: Math.round(vsScore),
    overallScore: Math.round(overall)
  };
}

// ── Speaking Performance Indicator ───────────────────────
export function computeSpeakingConfidence(metrics: SpeechMetrics): number | null {
  const breakdown = computePerformanceBreakdown(metrics);
  return breakdown ? breakdown.overallScore : null;
}

// ── HR Answer Evaluation ─────────────────────────────────
export interface HRAnswerEvaluation {
  status: "valid" | "no_speech" | "insufficient_speech" | "off_topic" | "unintelligible";
  statusMessage?: string;
  scores?: {
    relevance: number | null;
    completeness: number | null;
    contentQuality: number | null;
    structure: number | null;
    clarity: number | null;
    specificity: number | null;
    overall: number | null;
  };
  feedback?: {
    strengths: string[];
    weaknesses: string[];
    actionable: string;
  };
}

export function evaluateHRAnswer(
  question: any,
  metrics: SpeechMetrics
): HRAnswerEvaluation {
  if (!metrics || metrics.speechDuration === 0) {
    return { status: "no_speech", statusMessage: "NO SPEECH DETECTED" };
  }
  if (metrics.speechDuration > 0 && metrics.speechDuration < 3) {
    return { status: "insufficient_speech", statusMessage: "INSUFFICIENT SPEECH DATA. Not enough speech was detected for a reliable speaking analysis." };
  }

  const hasTranscript = metrics.transcript && metrics.transcript.trim().length > 0;
  if (!hasTranscript) {
    return {
      status: "valid",
      statusMessage: "SPEECH ANALYSIS AVAILABLE",
      scores: {
        relevance: null,
        completeness: null,
        contentQuality: null,
        structure: null,
        clarity: null,
        specificity: null,
        overall: null
      },
      feedback: {
        strengths: ["You spoke for a sufficient duration."],
        weaknesses: ["Transcript is unavailable, so detailed content analysis cannot be performed."],
        actionable: "Ensure you are speaking clearly and your microphone is properly configured to improve transcription."
      }
    };
  }

  const words = metrics.transcript!.toLowerCase().match(/\b\w+\b/g) || [];
  if (words.length < 15) {
    return { status: "insufficient_speech", statusMessage: "Your response is too short to reliably evaluate content." };
  }

  const uniqueWords = new Set(words);
  if (uniqueWords.size < 5) {
    return { status: "unintelligible", statusMessage: "Not enough meaningful content was detected to evaluate the answer reliably." };
  }

  // 1. Relevance (25%)
  const qWords = (question.text.toLowerCase().match(/\b\w+\b/g) || []).filter((w: string) => w.length > 3);
  let relevanceScore = 0;
  const commonHRKeywords = ['work', 'job', 'role', 'experience', 'skill', 'team', 'project', 'company', 'career', 'learn', 'manager', 'manage', 'handle', 'situation'];
  let keywordMatches = 0;
  words.forEach(w => {
    if (qWords.includes(w) || commonHRKeywords.includes(w)) keywordMatches++;
  });
  relevanceScore = Math.min(100, (keywordMatches / (words.length * 0.1)) * 100);
  if (relevanceScore < 20) {
    return { status: "off_topic", statusMessage: "Your response does not sufficiently address the question." };
  }

  // 2. Completeness (20%)
  let compScore = 50;
  const expected = question.expectedPoints || [];
  if (expected.length > 0) {
    let matchedPoints = 0;
    expected.forEach((pt: string) => {
      const ptWords = pt.toLowerCase().match(/\b\w+\b/g) || [];
      const isMatched = ptWords.some(pw => pw.length > 3 && uniqueWords.has(pw));
      if (isMatched) matchedPoints++;
    });
    // Add bonus for covering points, but even without direct keyword match, length provides a baseline
    compScore = Math.min(100, 40 + (matchedPoints / expected.length) * 60);
  } else {
    compScore = Math.min(100, words.length); // fallback
  }

  // 3. Content Quality (20%)
  const actionVerbs = ['developed', 'managed', 'led', 'created', 'built', 'handled', 'worked', 'improved', 'increased', 'solved', 'achieved', 'coordinated', 'designed', 'implemented'];
  let actionVerbCount = 0;
  words.forEach(w => { if (actionVerbs.includes(w)) actionVerbCount++; });
  const contentScore = Math.min(100, 40 + (actionVerbCount * 15) + (words.length > 80 ? 20 : 0));

  // 4. Structure (15%)
  const structureWords = ['first', 'initially', 'during', 'when', 'then', 'next', 'however', 'because', 'so', 'finally', 'result', 'outcome', 'led to'];
  let structureMatches = 0;
  words.forEach(w => { if (structureWords.includes(w)) structureMatches++; });
  const structureScore = Math.min(100, 50 + (structureMatches * 10));

  // 5. Clarity (10%)
  const clarityScore = metrics.transcriptConfidence ? Math.round(metrics.transcriptConfidence * 100) : 75;

  // 6. Specificity (10%)
  // Look for numbers or specific metrics
  const hasNumbers = /\b\d+\b/.test(metrics.transcript) || /\b(one|two|three|four|five|six|seven|eight|nine|ten|months|years|percent|teams)\b/.test(metrics.transcript.toLowerCase());
  const specificityScore = hasNumbers ? Math.min(100, 70 + (actionVerbCount * 10)) : 50;

  // Final Overall Score
  const overall = (relevanceScore * 0.25) + (compScore * 0.20) + (contentScore * 0.20) + (structureScore * 0.15) + (clarityScore * 0.10) + (specificityScore * 0.10);

  // Generate Evidence-Based Feedback
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (contentScore >= 70 && actionVerbCount > 0) {
    strengths.push(`You used strong action-oriented language (e.g., "${words.find(w => actionVerbs.includes(w))}").`);
  }
  if (compScore >= 70 && expected.length > 0) {
    strengths.push(`Your answer comprehensively addressed the key points expected for this question.`);
  } else if (compScore < 60 && expected.length > 0) {
    weaknesses.push(`Your response missed some expected components like: ${expected[Math.floor(Math.random() * expected.length)]}.`);
  }

  if (specificityScore >= 70) {
    strengths.push("You provided specific details or measurable elements in your response.");
  } else {
    weaknesses.push("Your answer lacked specific examples, metrics, or detailed evidence.");
  }

  if (structureScore < 60) {
    weaknesses.push("Your answer lacked clear structural transitions (e.g., Situation, Action, Result).");
  } else if (structureScore >= 80) {
    strengths.push("You structured your response with clear transitional phrases.");
  }

  // Fallbacks if empty
  if (strengths.length === 0) strengths.push("You provided a relevant response to the question.");
  if (weaknesses.length === 0) weaknesses.push("Consider expanding your answer with more in-depth examples.");

  let actionable = "Try to use the STAR method (Situation, Task, Action, Result) to give your examples more structure and impact.";
  if (specificityScore < 60) actionable = "Focus on adding concrete numbers, outcomes, or specific project names to make your answer more believable.";
  if (compScore < 60) actionable = "Make sure to thoroughly address all parts of the question rather than giving a brief overview.";

  return {
    status: "valid",
    scores: {
      relevance: Math.round(relevanceScore),
      completeness: Math.round(compScore),
      contentQuality: Math.round(contentScore),
      structure: Math.round(structureScore),
      clarity: Math.round(clarityScore),
      specificity: Math.round(specificityScore),
      overall: Math.round(overall)
    },
    feedback: {
      strengths: strengths.slice(0, 2),
      weaknesses: weaknesses.slice(0, 2),
      actionable
    }
  };
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
  // Only consider responses with actual detected speech (> 1.5 seconds)
  const validMetrics = responses
    .map(r => r.metrics)
    .filter((m): m is SpeechMetrics => m !== null && m.speechDuration >= 1.5);

  if (validMetrics.length === 0) {
    return { communication: null, speakingConfidence: null, answerStructure: null, voiceClarity: null, responseTime: null };
  }

  // Speaking Confidence (averaged across valid responses)
  const confScores = validMetrics.map(m => computeSpeakingConfidence(m)).filter((s): s is number => s !== null);
  const speakingConfidence = confScores.length > 0 ? Math.round(confScores.reduce((a, b) => a + b, 0) / confScores.length) : null;

  // Voice Clarity: based on average WPM alignment and filler ratio
  const wpmScores = validMetrics.map((m): number | null => {
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
  const commScores = validMetrics.map(m => {
    let s = 60;
    s += (m.speechToSilenceRatio - 0.5) * 60;
    if (m.avgVolume > 20) s += 10;
    return Math.max(0, Math.min(100, Math.round(s)));
  });
  const communication = commScores.length > 0 
    ? Math.round(commScores.reduce((a, b) => a + b, 0) / commScores.length)
    : null;

  // Response time score - only for valid responses
  const validResponsesWithRT = responses.filter(r => r.responseTime !== null && r.metrics && r.metrics.speechDuration >= 1.5);
  const avgRT = validResponsesWithRT.length > 0
    ? validResponsesWithRT.reduce((s, r) => s + (r.responseTime ?? 0), 0) / validResponsesWithRT.length
    : null;
  const rtScore = avgRT !== null ? responseTimeScore(avgRT) : null;

  // Answer structure — only if transcripts available
  const withTranscripts = validMetrics.filter(m => m.transcript && m.transcript.length > 20);
  const answerStructure = withTranscripts.length > 0
    ? Math.round(withTranscripts.reduce((s, m) => {
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
