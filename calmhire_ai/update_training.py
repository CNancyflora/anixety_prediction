import os

lib_dir = r"c:\Anxiety PDD\calmhire_ai\lib"

# --- 1. coach.dart ---
coach_code = '''import 'package:flutter/material.dart';
import 'voice_practice.dart';
import 'self_intro_practice.dart';
import 'communication_practice.dart';
import 'hr_interview_practice.dart';

class CoachScreen extends StatefulWidget {
  const CoachScreen({super.key});

  @override
  State<CoachScreen> createState() => _CoachScreenState();
}

class _CoachScreenState extends State<CoachScreen> {
  final List<Map<String, dynamic>> _modules = [
    {
      'id': 'self-intro',
      'title': 'Self Introduction Practice',
      'desc': 'Craft and rehearse a compelling personal introduction.',
      'duration': '2 min',
      'icon': Icons.person_outline,
      'isCompleted': false,
      'isLocked': false,
    },
    {
      'id': 'communication',
      'title': 'Communication Skills',
      'desc': 'Strengthen verbal clarity and active listening.',
      'duration': '5 min',
      'icon': Icons.menu_book_outlined,
      'isCompleted': false,
      'isLocked': false,
    },
    {
      'id': 'voice',
      'title': 'Voice & Pronunciation Practice',
      'desc': 'Improve articulation, pace, and vocal projection.',
      'duration': '5 min',
      'icon': Icons.mic_none_outlined,
      'isCompleted': false,
      'isLocked': false,
    },
    {
      'id': 'hr-interview',
      'title': 'HR Interview Practice',
      'desc': 'Practise common behavioral HR questions.',
      'duration': '10 min',
      'icon': Icons.chat_bubble_outline,
      'isCompleted': false,
      'isLocked': false,
    },
  ];

  void _markCompleted(String moduleId) {
    setState(() {
      final idx = _modules.indexWhere((m) => m['id'] == moduleId);
      if (idx != -1) {
        _modules[idx]['isCompleted'] = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    int completedCount = _modules.where((m) => m['isCompleted'] == true).length;
    double progress = _modules.isEmpty ? 0 : completedCount / _modules.length;

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: const Color(0xFF020617),
        elevation: 0,
        title: const Text('AI Training Coach', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress Banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('TRAINING PROGRESS', style: TextStyle(color: Color(0xFF60A5FA), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                      Text('$completedCount / ${_modules.length} Completed', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 8,
                      backgroundColor: Colors.white.withOpacity(0.05),
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF3B82F6)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            const Text('Modules', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 16),

            ..._modules.map((mod) {
              bool isDone = mod['isCompleted'];
              bool isLocked = mod['isLocked'];

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDone ? Colors.green.withOpacity(0.03) : Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDone 
                      ? Colors.green.withOpacity(0.2) 
                      : isLocked 
                        ? Colors.white.withOpacity(0.03) 
                        : Colors.blue.withOpacity(0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isLocked ? Colors.white.withOpacity(0.05) : const Color(0xFF2563EB).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(
                        mod['icon'],
                        color: isLocked ? Colors.grey : const Color(0xFF60A5FA),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            mod['title'],
                            style: TextStyle(
                              color: isLocked ? Colors.grey : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            mod['desc'],
                            style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (isDone)
                      const Icon(Icons.check_circle, color: Colors.green, size: 24)
                    else if (isLocked)
                      const Icon(Icons.lock_outline, color: Colors.grey, size: 20)
                    else
                      ElevatedButton(
                        onPressed: () async {
                          final String id = mod['id'];
                          Widget screen;
                          if (id == 'self-intro') {
                            screen = SelfIntroPracticeScreen(onCompleted: () => _markCompleted(id));
                          } else if (id == 'communication') {
                            screen = CommunicationPracticeScreen(onCompleted: () => _markCompleted(id));
                          } else if (id == 'voice') {
                            screen = VoicePracticeScreen(onCompleted: () => _markCompleted(id));
                          } else {
                            screen = HrInterviewPracticeScreen(onCompleted: () => _markCompleted(id));
                          }
                          await Navigator.push(context, MaterialPageRoute(builder: (context) => screen));
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Start', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
'''

# --- 2. self_intro_practice.dart ---
self_intro_code = '''import 'package:flutter/material.dart';
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
'''

# --- 3. communication_practice.dart ---
comm_code = '''import 'package:flutter/material.dart';
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
'''

# --- 4. voice_practice.dart ---
voice_code = '''import 'package:flutter/material.dart';
import 'dart:async';
import 'package:permission_handler/permission_handler.dart';

class VoicePracticeScreen extends StatefulWidget {
  final VoidCallback onCompleted;
  const VoicePracticeScreen({super.key, required this.onCompleted});

  @override
  State<VoicePracticeScreen> createState() => _VoicePracticeScreenState();
}

class _VoicePracticeScreenState extends State<VoicePracticeScreen> {
  final List<String> _items = [
    "Communication", "Confidence", "Professional", "Opportunity", "Development",
    "Technology", "Artificial Intelligence", "Data Science", "Collaboration",
    "Leadership", "Experience", "Responsibility", "Problem-solving", "Innovation",
    "Presentation",
    "I am confident in my ability to learn and adapt.",
    "I enjoy solving challenging problems.",
    "I work effectively as part of a team.",
    "I am passionate about continuous learning.",
    "I can communicate technical ideas clearly."
  ];
  
  int _currentIndex = 0;
  bool _isRecording = false;
  bool _hasMicPermission = false;

  void _listen() {
    // TTS mockup since package isn't added
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Playing pronunciation...')));
  }

  Future<void> _startPractice() async {
    final status = await Permission.microphone.request();
    setState(() {
      _hasMicPermission = status.isGranted;
    });

    if (_hasMicPermission) {
      setState(() => _isRecording = true);
      // Mock recording duration
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _isRecording = false);
      });
    }
  }

  void _next() {
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
              Text('Item ${_currentIndex + 1} of ${_items.length}', style: const TextStyle(color: Colors.grey, fontSize: 16)),
              const SizedBox(height: 32),
              Text(
                _items[_currentIndex],
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
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
                      label: const Text('Practice', style: TextStyle(color: Colors.white)),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
                    ),
                  ],
                ),
              if (!_hasMicPermission && !_isRecording && _items.isNotEmpty)
                 const Padding(
                  padding: EdgeInsets.only(top: 16.0),
                  child: Text('Microphone permission is required for voice analysis.', style: TextStyle(color: Colors.red, fontSize: 12)),
                ),
              const Spacer(),
              ElevatedButton(
                onPressed: _next,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white.withOpacity(0.1),
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: Text(_currentIndex < _items.length - 1 ? 'Next' : 'Finish', style: const TextStyle(color: Colors.white)),
              ),
              const SizedBox(height: 16),
              const Text('Repeat 3 times for best results', style: TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
'''

# --- 5. hr_interview_practice.dart ---
hr_code = '''import 'package:flutter/material.dart';
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
      _timeSpent = 0;
    });
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _timeSpent++);
    });
  }

  void _next() {
    if (_currentIndex < _questions.length - 1) {
      setState(() => _currentIndex++);
    } else {
      _timer?.cancel();
      _cameraController?.dispose();
      _cameraController = null;
      setState(() {
        _isPracticing = false;
        _isFinished = true;
      });
    }
  }

  void _prev() {
    if (_currentIndex > 0) {
      setState(() => _currentIndex--);
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
                          const Text('Speaking duration', style: TextStyle(color: Colors.white, fontSize: 16)),
                          Text('${_timeSpent}s', style: const TextStyle(color: Colors.blue, fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
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
                _suggestionRow('Structure your response before speaking.'),
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

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        title: const Text('HR Interview Practice', style: TextStyle(color: Colors.white, fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Text('Question ${_currentIndex + 1}/${_questions.length}', style: const TextStyle(color: Colors.blue, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text(
              _questions[_currentIndex],
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
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
                  Text('${_timeSpent}s', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                ],
              ),
              if (!_hasMicPermission)
                const Padding(
                  padding: EdgeInsets.only(top: 8.0),
                  child: Text('Microphone permission is required for voice analysis.', style: TextStyle(color: Colors.red, fontSize: 12)),
                ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _currentIndex > 0 ? _prev : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.1),
                        minimumSize: const Size(0, 50),
                      ),
                      child: const Text('Previous', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _next,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        minimumSize: const Size(0, 50),
                      ),
                      child: Text(_currentIndex < _questions.length - 1 ? 'Next' : 'Finish', style: const TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              )
            ] else ...[
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
'''

def write_file(name, content):
    with open(os.path.join(lib_dir, name), 'w', encoding='utf-8') as f:
        f.write(content)

write_file('coach.dart', coach_code)
write_file('self_intro_practice.dart', self_intro_code)
write_file('communication_practice.dart', comm_code)
write_file('voice_practice.dart', voice_code)
write_file('hr_interview_practice.dart', hr_code)

print("Files created successfully.")
