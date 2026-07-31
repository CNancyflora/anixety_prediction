import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

class VoicePracticeScreen extends StatefulWidget {
  final VoidCallback onCompleted;

  const VoicePracticeScreen({super.key, required this.onCompleted});

  @override
  State<VoicePracticeScreen> createState() => _VoicePracticeScreenState();
}

class _VoicePracticeScreenState extends State<VoicePracticeScreen>
    with SingleTickerProviderStateMixin {
  CameraController? _cameraController;
  bool _cameraReady = false;
  bool _micActive = false;
  bool _sessionStarted = false;
  bool _permissionsGranted = false;
  bool _isLoading = false;
  String _statusMessage = '';
  Timer? _micAnimTimer;
  final List<double> _micBars = List.generate(12, (_) => 0.2);
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
    _requestPermissionsAndInit();
  }

  @override
  void dispose() {
    _micAnimTimer?.cancel();
    _cameraController?.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _requestPermissionsAndInit() async {
    setState(() {
      _isLoading = true;
      _statusMessage = 'Requesting permissions…';
    });

    final cameraStatus = await Permission.camera.request();
    final micStatus = await Permission.microphone.request();

    if (!mounted) return;

    if (cameraStatus.isGranted && micStatus.isGranted) {
      setState(() {
        _permissionsGranted = true;
        _statusMessage = 'Starting camera…';
      });
      await _initCamera();
    } else {
      setState(() {
        _isLoading = false;
        _statusMessage = cameraStatus.isDenied
            ? 'Camera permission denied. Please allow it in Settings.'
            : 'Microphone permission denied. Please allow it in Settings.';
      });
    }
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        if (mounted) setState(() { _isLoading = false; _statusMessage = 'No cameras found on device.'; });
        return;
      }

      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: true,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() {
          _cameraReady = true;
          _isLoading = false;
          _statusMessage = '';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _statusMessage = 'Could not start camera: $e';
        });
      }
    }
  }

  void _startSession() {
    setState(() {
      _sessionStarted = true;
      _micActive = true;
    });
    _startMicAnimation();
  }

  void _startMicAnimation() {
    _micAnimTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      if (!mounted || !_micActive) return;
      setState(() {
        for (int i = 0; i < _micBars.length; i++) {
          _micBars[i] = 0.2 + Random().nextDouble() * 0.8;
        }
      });
    });
  }

  void _stopSession() {
    _micAnimTimer?.cancel();
    setState(() {
      _sessionStarted = false;
      _micActive = false;
      for (int i = 0; i < _micBars.length; i++) {
        _micBars[i] = 0.2;
      }
    });
  }

  void _completeSession() {
    _stopSession();
    widget.onCompleted();
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Voice & Pronunciation Practice',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Camera Preview
              Expanded(
                flex: 3,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: _sessionStarted
                          ? const Color(0xFF3B82F6)
                          : Colors.white.withOpacity(0.1),
                      width: _sessionStarted ? 2 : 1,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Camera feed or placeholder
                        if (_isLoading)
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const CircularProgressIndicator(color: Colors.blue),
                              const SizedBox(height: 16),
                              Text(_statusMessage, style: const TextStyle(color: Colors.grey), textAlign: TextAlign.center),
                            ],
                          )
                        else if (_cameraReady && _cameraController != null)
                          SizedBox.expand(
                            child: FittedBox(
                              fit: BoxFit.cover,
                              child: SizedBox(
                                width: _cameraController!.value.previewSize?.height ?? 1,
                                height: _cameraController!.value.previewSize?.width ?? 1,
                                child: CameraPreview(_cameraController!),
                              ),
                            ),
                          )
                        else
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.no_photography, color: Colors.white.withOpacity(0.2), size: 56),
                              const SizedBox(height: 12),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 24),
                                child: Text(
                                  _statusMessage.isNotEmpty ? _statusMessage : 'Camera unavailable',
                                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              if (_statusMessage.contains('Settings')) ...[
                                const SizedBox(height: 16),
                                TextButton(
                                  onPressed: () => openAppSettings(),
                                  child: const Text('Open Settings', style: TextStyle(color: Colors.blue)),
                                ),
                              ]
                            ],
                          ),

                        // Live badge when session active
                        if (_sessionStarted)
                          Positioned(
                            top: 12,
                            left: 12,
                            child: AnimatedBuilder(
                              animation: _pulseController,
                              builder: (_, __) => Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.red.withOpacity(0.7 + 0.3 * _pulseController.value),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.circle, color: Colors.white, size: 8),
                                    SizedBox(width: 6),
                                    Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),
                          ),

                        // Mic active icon
                        if (_micActive)
                          Positioned(
                            top: 12,
                            right: 12,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.3),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.mic, color: Colors.blue, size: 18),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Mic visualizer bar
              Container(
                height: 60,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.06)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: _micBars.map((h) => AnimatedContainer(
                    duration: const Duration(milliseconds: 80),
                    width: 6,
                    height: 40 * h,
                    decoration: BoxDecoration(
                      color: _micActive
                          ? Color.lerp(Colors.blue, Colors.purple, h)!
                          : Colors.grey.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  )).toList(),
                ),
              ),

              const SizedBox(height: 16),

              // Prompt card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.blue.withOpacity(0.2)),
                ),
                child: const Text(
                  '"Introduce yourself in 60 seconds. Focus on clear articulation and a confident tone."',
                  style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.5, fontStyle: FontStyle.italic),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 16),

              // Action buttons
              if (!_sessionStarted) ...[
                ElevatedButton.icon(
                  onPressed: _permissionsGranted && _cameraReady ? _startSession : null,
                  icon: const Icon(Icons.mic, color: Colors.white),
                  label: const Text('Start Practice', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    disabledBackgroundColor: Colors.white.withOpacity(0.1),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ] else ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _stopSession,
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.red),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('Stop', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: _completeSession,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('Complete ✓', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
