import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

class MockInterviewScreen extends StatefulWidget {
  const MockInterviewScreen({super.key});

  @override
  State<MockInterviewScreen> createState() => _MockInterviewScreenState();
}

class _MockInterviewScreenState extends State<MockInterviewScreen> {
  bool _isCameraEnabled = false;
  bool _isMicEnabled = false;
  bool _isSessionActive = false;
  bool _isInitializing = false;

  CameraController? _cameraController;

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _toggleCamera(bool enable) async {
    if (!enable) {
      setState(() {
        _isCameraEnabled = false;
        _cameraController?.dispose();
        _cameraController = null;
      });
      return;
    }

    setState(() => _isInitializing = true);
    final status = await Permission.camera.request();
    
    if (status.isGranted) {
      try {
        final cameras = await availableCameras();
        if (cameras.isNotEmpty) {
          final frontCamera = cameras.firstWhere(
            (c) => c.lensDirection == CameraLensDirection.front,
            orElse: () => cameras.first,
          );
          
          // Re-create controller
          _cameraController = CameraController(
            frontCamera,
            ResolutionPreset.medium,
            enableAudio: _isMicEnabled,
          );
          
          await _cameraController!.initialize();
          
          if (mounted) {
            setState(() {
              _isCameraEnabled = true;
              _isInitializing = false;
            });
          }
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isCameraEnabled = false;
            _isInitializing = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to initialize camera: $e')));
        }
      }
    } else {
      if (mounted) {
        setState(() {
          _isCameraEnabled = false;
          _isInitializing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Camera permission is required.')));
      }
    }
  }

  Future<void> _toggleMic(bool enable) async {
    if (!enable) {
      setState(() => _isMicEnabled = false);
      return;
    }

    final status = await Permission.microphone.request();
    if (status.isGranted) {
      setState(() => _isMicEnabled = true);
      
      // If camera is already on, restart it to apply mic changes
      if (_isCameraEnabled) {
        await _toggleCamera(false);
        await _toggleCamera(true);
      }
    } else {
      setState(() => _isMicEnabled = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Microphone permission is required.')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Mock Interview', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Stack(
        children: [
          // Background visual flair
          Positioned(
            top: -50,
            left: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: const BoxDecoration(color: Color(0x224F46E5), shape: BoxShape.circle),
            ),
          ),
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
            child: Container(color: Colors.transparent),
          ),
          
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Video feed placeholder
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: _isCameraEnabled ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.1), width: _isCameraEnabled ? 2 : 1),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            if (_isInitializing)
                              const CircularProgressIndicator(color: Colors.blue)
                            else if (_isCameraEnabled && _cameraController != null && _cameraController!.value.isInitialized)
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
                                  Icon(Icons.videocam_off, color: Colors.white.withOpacity(0.2), size: 64),
                                  const SizedBox(height: 16),
                                  const Text("Camera is disabled", style: TextStyle(color: Colors.grey)),
                                ],
                              ),
                              
                            // Status Indicators
                            Positioned(
                              top: 16,
                              right: 16,
                              child: Row(
                                children: [
                                  if (_isMicEnabled)
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(color: Colors.blue.withOpacity(0.2), shape: BoxShape.circle),
                                      child: const Icon(Icons.mic, color: Colors.blue, size: 16),
                                    ),
                                  const SizedBox(width: 8),
                                  if (_isCameraEnabled)
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(color: Colors.green.withOpacity(0.2), shape: BoxShape.circle),
                                      child: const Icon(Icons.videocam, color: Colors.green, size: 16),
                                    ),
                                ],
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Device Controls
                  if (!_isSessionActive) ...[
                    const Text("Device Setup", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildDeviceToggle("Camera Access", Icons.videocam, _isCameraEnabled, _toggleCamera),
                    const SizedBox(height: 12),
                    _buildDeviceToggle("Microphone Access", Icons.mic, _isMicEnabled, _toggleMic),
                    const SizedBox(height: 32),
                    
                    ElevatedButton(
                      onPressed: (_isCameraEnabled && _isMicEnabled) ? () => setState(() => _isSessionActive = true) : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        disabledBackgroundColor: Colors.white.withOpacity(0.1),
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Start AI Interview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ] else ...[
                    const Text("Current Question", style: TextStyle(color: Colors.blue, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.blue.withOpacity(0.3)),
                      ),
                      child: const Text(
                        "Tell me about a time you had to adapt to a significant change in a project.",
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600, height: 1.4),
                      ),
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton(
                      onPressed: () => setState(() => _isSessionActive = false),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.withOpacity(0.1),
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Colors.red)),
                      ),
                      child: const Text('End Interview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.red)),
                    ),
                  ]
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeviceToggle(String title, IconData icon, bool value, Function(bool) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.grey),
              const SizedBox(width: 16),
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            ],
          ),
          Switch(
            value: value,
            onChanged: _isInitializing ? null : onChanged,
            activeColor: const Color(0xFF3B82F6),
          ),
        ],
      ),
    );
  }
}
