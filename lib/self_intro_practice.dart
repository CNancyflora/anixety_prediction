import 'package:flutter/material.dart';
import 'dart:async';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

class SelfIntroPracticeScreen extends StatefulWidget {
  final VoidCallback onCompleted;
  const SelfIntroPracticeScreen({super.key, required this.onCompleted});

  @override
  State<SelfIntroPracticeScreen> createState() => _SelfIntroPracticeScreenState();
}

class _SelfIntroPracticeScreenState extends State<SelfIntroPracticeScreen> {
  bool _isPracticing = false;
  bool _isFinished = false;
  int _timeLeft = 120; // 2 minutes
  Timer? _timer;
  CameraController? _cameraController;
  bool _hasCameraPermission = false;
  bool _hasMicPermission = false;
  
  @override
  void dispose() {
    _timer?.cancel();
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
          _cameraController = CameraController(frontCam, ResolutionPreset.medium);
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
      _timeLeft = 120;
    });
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        _endPractice();
      }
    });
  }

  void _endPractice() {
    _timer?.cancel();
    _cameraController?.dispose();
    _cameraController = null;
    setState(() {
      _isPracticing = false;
      _isFinished = true;
    });
  }

  String get _formattedTime {
    int m = _timeLeft ~/ 60;
    int s = _timeLeft % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
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
                      _resultRow('Speaking duration', '${120 - _timeLeft} seconds'),
                      _resultRow('Responses completed', '1/1'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text('AI Coach Suggestions', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _suggestionRow('Try slowing down slightly while explaining your answer.'),
                _suggestionRow('Structure your response before speaking.'),
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

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        title: const Text('Self-Introduction Practice', style: TextStyle(color: Colors.white, fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Text('Practice introducing yourself confidently in a professional interview.', style: TextStyle(color: Colors.grey, fontSize: 14)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: const Text(
                'Introduce yourself as if you are speaking to an interviewer. Cover your education, skills, projects, experience, strengths, and career goals.',
                style: TextStyle(color: Colors.white, fontSize: 15),
              ),
            ),
            const SizedBox(height: 32),
            if (_isPracticing) ...[
              if (_hasCameraPermission && _cameraController != null && _cameraController!.value.isInitialized)
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                      aspectRatio: _cameraController!.value.aspectRatio,
                      child: CameraPreview(_cameraController!),
                    ),
                  ),
                )
              else
                Expanded(
                  child: Center(
                    child: Text(
                      _hasCameraPermission ? 'Initializing camera...' : 'Camera permission is required for video analysis.',
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(_hasMicPermission ? Icons.mic : Icons.mic_off, color: _hasMicPermission ? Colors.red : Colors.grey, size: 32),
                  const SizedBox(width: 16),
                  Text(_formattedTime, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                ],
              ),
              if (!_hasMicPermission)
                const Padding(
                  padding: EdgeInsets.only(top: 8.0),
                  child: Text('Microphone permission is required for voice analysis.', style: TextStyle(color: Colors.red, fontSize: 12)),
                ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _endPractice,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red, minimumSize: const Size(200, 50)),
                child: const Text('End Practice', style: TextStyle(color: Colors.white, fontSize: 16)),
              )
            ] else ...[
              const Spacer(),
              const Icon(Icons.timer, color: Colors.blue, size: 64),
              const SizedBox(height: 16),
              const Text('2:00', style: TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.bold)),
              const Spacer(),
              ElevatedButton(
                onPressed: _startPractice,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Start Practice', style: TextStyle(color: Colors.white, fontSize: 16)),
              )
            ]
          ],
        ),
      ),
    );
  }

  Widget _resultRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 16)),
          Text(value, style: const TextStyle(color: Colors.blue, fontSize: 16, fontWeight: FontWeight.bold)),
        ],
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
