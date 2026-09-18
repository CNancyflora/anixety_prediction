import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:math';
import 'package:permission_handler/permission_handler.dart';

class VoicePracticeScreen extends StatefulWidget {
  final VoidCallback onCompleted;
  const VoicePracticeScreen({super.key, required this.onCompleted});

  @override
  State<VoicePracticeScreen> createState() => _VoicePracticeScreenState();
}

class _VoicePracticeScreenState extends State<VoicePracticeScreen> {
  final List<String> _items = [
    "Professionalism",
    "Synergize",
    "Strategic Collaboration",
    "Organizational Behavior",
    "Cross-functional Teams",
    "I thrive in dynamic environments.",
    "My approach is driven by data.",
    "Effective communication is key to success.",
    "I continuously seek opportunities for growth.",
    "I am confident in my leadership abilities."
  ];
  
  int _currentIndex = 0;
  bool _isRecording = false;
  bool _isAnalyzing = false;
  bool _hasMicPermission = false;
  int? _lastScore;
  
  final Random _rnd = Random();

  void _listen() {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Playing pronunciation audio...')));
  }

  Future<void> _startPractice() async {
    final status = await Permission.microphone.request();
    setState(() {
      _hasMicPermission = status.isGranted;
      _lastScore = null;
    });

    if (_hasMicPermission) {
      setState(() => _isRecording = true);
      
      // Simulate recording for 3 seconds
      await Future.delayed(const Duration(seconds: 3));
      
      if (!mounted) return;
      setState(() {
        _isRecording = false;
        _isAnalyzing = true;
      });

      // Simulate analysis delay
      await Future.delayed(const Duration(seconds: 2));
      
      if (!mounted) return;
      setState(() {
        _isAnalyzing = false;
        // Generate a realistic score between 75 and 98
        _lastScore = 75 + _rnd.nextInt(24);
      });
    }
  }

  void _next() {
    setState(() {
      _lastScore = null;
    });
    
    if (_currentIndex < _items.length - 1) {
      setState(() => _currentIndex++);
    } else {
      widget.onCompleted();
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        title: const Text('Voice & Pronunciation', style: TextStyle(color: Colors.white, fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Word / Sentence ${_currentIndex + 1} of ${_items.length}', style: const TextStyle(color: Colors.grey, fontSize: 16)),
              const SizedBox(height: 32),
              Text(
                _items[_currentIndex],
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 48),
              
              if (_isRecording)
                const Column(
                  children: [
                    Icon(Icons.mic, color: Colors.red, size: 64),
                    SizedBox(height: 16),
                    Text('Recording...', style: TextStyle(color: Colors.red, fontSize: 16)),
                  ],
                )
              else if (_isAnalyzing)
                const Column(
                  children: [
                    CircularProgressIndicator(color: Colors.blue),
                    SizedBox(height: 16),
                    Text('Analyzing Speech...', style: TextStyle(color: Colors.blue, fontSize: 16)),
                  ],
                )
              else if (_lastScore != null)
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: _lastScore! >= 85 ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: _lastScore! >= 85 ? Colors.green : Colors.orange),
                      ),
                      child: Column(
                        children: [
                          Text('Pronunciation Score: $_lastScore%', style: TextStyle(color: _lastScore! >= 85 ? Colors.green : Colors.orange, fontSize: 24, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text(
                            _lastScore! >= 85 ? 'Excellent pronunciation!' : 'Needs a bit more clarity. Try again!',
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: _startPractice,
                      icon: const Icon(Icons.refresh, color: Colors.white),
                      label: const Text('Retry', style: TextStyle(color: Colors.white)),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.white.withOpacity(0.1)),
                    ),
                  ],
                )
              else
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _listen,
                      icon: const Icon(Icons.volume_up, color: Colors.white),
                      label: const Text('Listen', style: TextStyle(color: Colors.white)),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.withOpacity(0.3)),
                    ),
                    const SizedBox(width: 16),
                    ElevatedButton.icon(
                      onPressed: _startPractice,
                      icon: const Icon(Icons.mic, color: Colors.white),
                      label: const Text('Speak', style: TextStyle(color: Colors.white)),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
                    ),
                  ],
                ),
                
              if (!_hasMicPermission && !_isRecording && !_isAnalyzing && _lastScore == null)
                 const Padding(
                  padding: EdgeInsets.only(top: 16.0),
                  child: Text('Microphone permission is required for analysis.', style: TextStyle(color: Colors.red, fontSize: 12)),
                ),
                
              const Spacer(),
              ElevatedButton(
                onPressed: _next,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _lastScore != null ? const Color(0xFF2563EB) : Colors.white.withOpacity(0.1),
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: Text(_currentIndex < _items.length - 1 ? 'Next' : 'Finish', style: const TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
