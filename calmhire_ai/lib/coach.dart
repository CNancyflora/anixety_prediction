import 'package:flutter/material.dart';
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
