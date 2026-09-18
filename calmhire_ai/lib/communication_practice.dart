import 'package:flutter/material.dart';
import 'dart:async';
import 'package:permission_handler/permission_handler.dart';

class CommunicationPracticeScreen extends StatefulWidget {
  final VoidCallback onCompleted;
  const CommunicationPracticeScreen({super.key, required this.onCompleted});

  @override
  State<CommunicationPracticeScreen> createState() => _CommunicationPracticeScreenState();
}

class _CommunicationPracticeScreenState extends State<CommunicationPracticeScreen> {
  int _currentActivity = 0;
  bool _isPracticing = false;
  bool _isFinished = false;
  int _timeSpent = 0;
  Timer? _timer;
  bool _hasMicPermission = false;

  final List<Map<String, String>> _activities = [
    {
      'title': 'A. Answer Clearly',
      'q': 'Tell me about a challenging situation you faced and how you solved it.',
      'inst': 'Answer in a clear and structured way using Situation → Action → Result.'
    },
    {
      'title': 'B. Professional Communication',
      'q': 'How would you explain a technical concept to a non-technical person?',
      'inst': 'Give a simple explanation without using unnecessary technical jargon.'
    },
    {
      'title': 'C. Confidence in Communication',
      'q': 'Why should we hire you for this position?',
      'inst': 'Give a confident 60-second answer focusing on your strengths and value.'
    }
  ];

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _startPractice() async {
    final status = await Permission.microphone.request();
    setState(() {
      _hasMicPermission = status.isGranted;
      _isPracticing = true;
      _timeSpent = 0;
    });
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _timeSpent++);
    });
  }

  void _nextActivity() {
    _timer?.cancel();
    if (_currentActivity < _activities.length - 1) {
      setState(() {
        _currentActivity++;
        _isPracticing = false;
      });
    } else {
      setState(() {
        _isPracticing = false;
        _isFinished = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isFinished) {
      return Scaffold(
        backgroundColor: const Color(0xFF020617),
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 80),
                const SizedBox(height: 24),
                const Text('Practice Completed', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Session Results:', style: TextStyle(color: Colors.grey, fontSize: 14)),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Responses completed', style: TextStyle(color: Colors.white, fontSize: 16)),
                          Text('${_activities.length}/${_activities.length}', style: const TextStyle(color: Colors.blue, fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text('AI Coach Suggestions', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _suggestionRow('Avoid repeating filler words.'),
                _suggestionRow('Maintain a clear and professional tone.'),
                const Spacer(),
                ElevatedButton(
                  onPressed: () {
                    widget.onCompleted();
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Done', style: TextStyle(color: Colors.white, fontSize: 16)),
                )
              ],
            ),
          ),
        ),
      );
    }

    final act = _activities[_currentActivity];

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        title: const Text('Communication Skills', style: TextStyle(color: Colors.white, fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(act['title']!, style: const TextStyle(color: Colors.blue, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text(act['q']!, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
              child: Text(act['inst']!, style: const TextStyle(color: Colors.grey, fontSize: 15)),
            ),
            const Spacer(),
            if (_isPracticing) ...[
              Center(
                child: Column(
                  children: [
                    Icon(_hasMicPermission ? Icons.mic : Icons.mic_off, color: _hasMicPermission ? Colors.red : Colors.grey, size: 64),
                    const SizedBox(height: 16),
                    Text('${_timeSpent}s', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                    if (!_hasMicPermission)
                      const Padding(
                        padding: EdgeInsets.only(top: 8.0),
                        child: Text('Microphone permission is required for voice analysis.', style: TextStyle(color: Colors.red, fontSize: 12)),
                      ),
                  ],
                ),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: _nextActivity,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Complete Answer', style: TextStyle(color: Colors.white, fontSize: 16)),
              )
            ] else
              ElevatedButton(
                onPressed: _startPractice,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Start Practice', style: TextStyle(color: Colors.white, fontSize: 16)),
              )
          ],
        ),
      ),
    );
  }

  Widget _suggestionRow(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.lightbulb_outline, color: Colors.amber, size: 20),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.grey, fontSize: 14))),
        ],
      ),
    );
  }
}
