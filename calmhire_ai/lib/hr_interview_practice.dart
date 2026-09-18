import 'package:flutter/material.dart';
import 'dart:async';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

class HrInterviewPracticeScreen extends StatefulWidget {
  final VoidCallback onCompleted;
  const HrInterviewPracticeScreen({super.key, required this.onCompleted});

  @override
  State<HrInterviewPracticeScreen> createState() => _HrInterviewPracticeScreenState();
}

class _HrInterviewPracticeScreenState extends State<HrInterviewPracticeScreen> {
  final List<String> _questions = [
    "Tell me about yourself.",
    "What are your greatest strengths?",
    "What is one weakness you are currently working to improve?",
    "Why should we hire you for this position?",
    "Where do you see yourself in the next 3 to 5 years?"
  ];
  
  int _currentIndex = 0;
  bool _isPracticing = false;
  bool _isFinished = false;
  int _timeSpent = 0;
  Timer? _timer;
  CameraController? _cameraController;
  bool _hasCameraPermission = false;
  bool _hasMicPermission = false;
  bool _showRecordDot = false;
  Timer? _dotTimer;

  @override
  void dispose() {
    _timer?.cancel();
    _dotTimer?.cancel();
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _initMedia() async {
    final camStatus = await Permission.camera.request();
    final micStatus = await Permission.microphone.request();
    
    setState(() {
      _hasCameraPermission = camStatus.isGranted;
      _hasMicPermission = micStatus.isGranted;
    });

    if (_hasCameraPermission) {
      try {
        final cameras = await availableCameras();
        if (cameras.isNotEmpty) {
          final frontCam = cameras.firstWhere((c) => c.lensDirection == CameraLensDirection.front, orElse: () => cameras.first);
          _cameraController = CameraController(frontCam, ResolutionPreset.high);
          await _cameraController!.initialize();
          if (mounted) setState(() {});
        }
      } catch (e) {
        debugPrint('Camera init error: $e');
      }
    }
  }

  void _startPractice() async {
    await _initMedia();
    setState(() {
      _isPracticing = true;
      _timeSpent = 0;
    });
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _timeSpent++);
    });
    
    _dotTimer = Timer.periodic(const Duration(milliseconds: 800), (timer) {
      setState(() => _showRecordDot = !_showRecordDot);
    });
  }

  void _next() {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _timeSpent = 0; // Reset timer for each question
      });
    } else {
      _timer?.cancel();
      _dotTimer?.cancel();
      _cameraController?.dispose();
      _cameraController = null;
      setState(() {
        _isPracticing = false;
        _isFinished = true;
      });
    }
  }

  String get _formattedTime {
    int m = _timeSpent ~/ 60;
    int s = _timeSpent % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isFinished) {
      return _buildCompletionScreen();
    }

    if (!_isPracticing) {
      return _buildStartScreen();
    }

    // ONLINE INTERVIEW LAYOUT
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Camera Feed (Background)
          if (_hasCameraPermission && _cameraController != null && _cameraController!.value.isInitialized)
            FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: _cameraController!.value.previewSize!.height,
                height: _cameraController!.value.previewSize!.width,
                child: CameraPreview(_cameraController!),
              ),
            )
          else
            const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.videocam_off, color: Colors.grey, size: 64),
                  SizedBox(height: 16),
                  Text('Camera Not Available', style: TextStyle(color: Colors.white, fontSize: 18)),
                ],
              ),
            ),
            
          // 2. Dark Gradient Overlay at bottom for text readability
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: 300,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black.withOpacity(0.9), Colors.transparent],
                ),
              ),
            ),
          ),
          
          // 3. Top Bar (Recording Indicator & Timer)
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                  child: Row(
                    children: [
                      Icon(Icons.circle, color: _showRecordDot ? Colors.red : Colors.transparent, size: 12),
                      const SizedBox(width: 8),
                      const Text('REC', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 12),
                      Text(_formattedTime, style: const TextStyle(color: Colors.white)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                  child: Text('${_currentIndex + 1} / ${_questions.length}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          
          // 4. Question Text & Controls (Bottom)
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  _questions[_currentIndex],
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, shadows: [Shadow(blurRadius: 10, color: Colors.black)]),
                ),
                const SizedBox(height: 32),
                if (!_hasMicPermission)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 16.0),
                    child: Text('Warning: Microphone disabled.', style: TextStyle(color: Colors.redAccent, fontSize: 14)),
                  ),
                ElevatedButton(
                  onPressed: _next,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    minimumSize: const Size(200, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  ),
                  child: Text(_currentIndex < _questions.length - 1 ? 'Submit & Next' : 'Finish Interview', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        title: const Text('HR Interview Practice', style: TextStyle(color: Colors.white, fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.business_center, color: Colors.blue, size: 80),
              const SizedBox(height: 32),
              const Text('Formal Online Interview', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              const Text(
                'You will be asked 5 behavioral HR questions. Treat this like a real online interview. Look at the camera, speak clearly, and submit your answer to proceed.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 16, height: 1.5),
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: _startPractice,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Enter Interview Room', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompletionScreen() {
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
              const Text('Interview Completed', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
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
                        Text('${_questions.length}/${_questions.length}', style: const TextStyle(color: Colors.blue, fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('AI Coach Suggestions', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              _suggestionRow('Structure your response using the STAR method.'),
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
