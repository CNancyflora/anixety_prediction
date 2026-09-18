import 'dart:async';
import 'dart:math';
import 'dart:typed_data';

class SpeechMetrics {
  final double totalDuration;
  final double speechDuration;
  final double silenceDuration;
  final int pauseCount;
  final int longPauseCount;
  final double speechToSilenceRatio;
  final double avgVolume;

  SpeechMetrics({
    required this.totalDuration,
    required this.speechDuration,
    required this.silenceDuration,
    required this.pauseCount,
    required this.longPauseCount,
    required this.speechToSilenceRatio,
    required this.avgVolume,
  });
}

class AudioAnalyzer {
  double noiseFloor = 5.0;
  List<double> samples = [];
  int startTime = 0;
  bool isCalibrating = false;

  Future<void> calibrate(Stream<Uint8List> audioStream, {int durationMs = 1000}) async {
    isCalibrating = true;
    List<double> tempSamples = [];
    
    final subscription = audioStream.listen((data) {
      if (data.isEmpty) return;
      double rms = _calculateRms(data);
      tempSamples.add(rms);
    });

    await Future.delayed(Duration(milliseconds: durationMs));
    await subscription.cancel();
    
    if (tempSamples.isNotEmpty) {
      tempSamples.sort();
      final validSamples = tempSamples.sublist(0, (tempSamples.length * 0.8).floor());
      final avgNoise = validSamples.isEmpty ? 5.0 : validSamples.reduce((a, b) => a + b) / validSamples.length;
      noiseFloor = max(1.0, avgNoise + 2.0); // Adaptive margin
    }
    isCalibrating = false;
  }

  void processStreamData(Uint8List data) {
    if (isCalibrating || data.isEmpty) return;
    samples.add(_calculateRms(data));
  }

  double _calculateRms(Uint8List data) {
    double sum = 0;
    for (var byte in data) {
      // Very rough 8-bit PCM RMS approximation for demonstration
      double val = (byte - 128).abs().toDouble();
      sum += val * val;
    }
    return sqrt(sum / data.length);
  }

  SpeechMetrics computeMetrics(double durationInSeconds) {
    if (samples.isEmpty || durationInSeconds <= 0) {
      return SpeechMetrics(
        totalDuration: durationInSeconds,
        speechDuration: 0,
        silenceDuration: durationInSeconds,
        pauseCount: 0,
        longPauseCount: 0,
        speechToSilenceRatio: 0,
        avgVolume: 0,
      );
    }

    final SPEECH_THRESHOLD = max(2.0, noiseFloor);
    final MIN_SPEECH_DURATION = 0.15;
    final HANGOVER_DURATION = 0.45;
    final sampleInterval = durationInSeconds / samples.length;

    bool isSpeaking = false;
    double currentSpeechLen = 0.0;
    double currentSilenceLen = 0.0;
    
    double totalSpeech = 0.0;
    int pauses = 0;
    int longPauses = 0;
    double totalRms = 0.0;

    for (var rms in samples) {
      totalRms += rms;
      bool frameHasVoice = rms > SPEECH_THRESHOLD;

      if (frameHasVoice) {
        if (!isSpeaking) {
          if (currentSilenceLen > 0.0 && currentSilenceLen <= HANGOVER_DURATION) {
            // hangover bridge
            totalSpeech += currentSilenceLen;
          } else if (currentSilenceLen > HANGOVER_DURATION) {
            pauses++;
            if (currentSilenceLen > 1.5) longPauses++;
          }
        }
        isSpeaking = true;
        currentSpeechLen += sampleInterval;
        currentSilenceLen = 0.0;
      } else {
        if (isSpeaking) {
          totalSpeech += currentSpeechLen;
          currentSpeechLen = 0.0;
          isSpeaking = false;
        }
        currentSilenceLen += sampleInterval;
      }
    }
    
    if (isSpeaking && currentSpeechLen > MIN_SPEECH_DURATION) {
      totalSpeech += currentSpeechLen;
    }

    // "No Fake Scores" verification
    if (totalSpeech < 1.5) {
      // If there's less than 1.5 seconds of total speech, it's considered silent
      totalSpeech = 0;
    }

    double silence = durationInSeconds - totalSpeech;
    if (silence < 0) silence = 0;
    double ratio = totalSpeech / durationInSeconds;

    return SpeechMetrics(
      totalDuration: durationInSeconds,
      speechDuration: totalSpeech,
      silenceDuration: silence,
      pauseCount: pauses,
      longPauseCount: longPauses,
      speechToSilenceRatio: ratio,
      avgVolume: totalRms / samples.length,
    );
  }
}
