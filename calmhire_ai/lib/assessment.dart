import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dashboard.dart';

class Question {
  final int id;
  final String text;
  final String type; // 'scale' or 'choice'
  final List<String>? options;
  final String? minLabel;
  final String? maxLabel;

  Question({
    required this.id,
    required this.text,
    required this.type,
    this.options,
    this.minLabel,
    this.maxLabel,
  });
}

class AssessmentScreen extends StatefulWidget {
  const AssessmentScreen({super.key});

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  int _currentStep = 0;
  final Map<int, dynamic> _answers = {};
  bool _isCalculating = false;
  bool _showResults = false;
  String _resultType = 'low'; // 'low', 'medium', 'high'
  int _stressScore = 0;

  final List<Question> _questions = [
    Question(id: 1, text: "How stressed do you feel before an interview?", type: "scale", minLabel: "Very Calm", maxLabel: "Extremely Stressed"),
    Question(id: 2, text: "How confident do you feel about attending this interview?", type: "scale", minLabel: "Not Confident", maxLabel: "Very Confident"),
    Question(id: 3, text: "How many hours did you sleep last night?", type: "choice", options: ["Less than 4 hours", "4–6 hours", "6–8 hours", "More than 8 hours"]),
    Question(id: 4, text: "How many interviews have you attended before?", type: "choice", options: ["0", "1–3", "4–10", "More than 10"]),
    Question(id: 5, text: "How much time did you prepare for this interview?", type: "choice", options: ["Less than 1 hour", "1–3 hours", "1 day", "More than 1 day"]),
    Question(id: 6, text: "Are you comfortable introducing yourself in front of interviewers?", type: "choice", options: ["Yes", "Sometimes", "No"]),
    Question(id: 7, text: "Can you maintain eye contact while speaking?", type: "choice", options: ["Easily", "Sometimes", "Difficult"]),
    Question(id: 8, text: "How comfortable are you answering unexpected questions?", type: "scale", minLabel: "Anxious", maxLabel: "Comfortable"),
    Question(id: 9, text: "Do you feel nervous when speaking in English or technical discussions?", type: "choice", options: ["Always", "Sometimes", "Never"]),
    Question(id: 10, text: "Do your hands shake, voice crack, or heart beat faster during interviews?", type: "choice", options: ["Often", "Sometimes", "Never"]),
    Question(id: 11, text: "Can you explain your projects confidently?", type: "choice", options: ["Yes", "Somewhat", "No"]),
    Question(id: 12, text: "How well do you handle pressure situations?", type: "scale", minLabel: "Poorly", maxLabel: "Excellent"),
  ];

  void _nextStep() async {
    if (_currentStep < _questions.length - 1) {
      setState(() {
        _currentStep++;
      });
    } else {
      setState(() {
        _isCalculating = true;
      });

      int calculatedStress = 0;
      calculatedStress += (_answers[1] as int? ?? 5);
      calculatedStress += (11 - (_answers[2] as int? ?? 5));
      calculatedStress += (11 - (_answers[8] as int? ?? 5));
      calculatedStress += (11 - (_answers[12] as int? ?? 5));

      String type = 'low';
      if (calculatedStress >= 26) {
        type = 'high';
      } else if (calculatedStress >= 18) {
        type = 'medium';
      } else {
        type = 'low';
      }

      _stressScore = calculatedStress;
      _resultType = type;

      // Save to Cloud Firestore
      try {
        final user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          await FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .collection('assessments')
              .add({
            'answers': _answers.map((k, v) => MapEntry(k.toString(), v)),
            'stressScore': calculatedStress,
            'anxietyLevel': type,
            'createdAt': FieldValue.serverTimestamp(),
          });
        }
      } catch (e) {
        debugPrint("Firestore save error: $e");
      }

      await Future.delayed(const Duration(milliseconds: 1500));

      if (mounted) {
        setState(() {
          _isCalculating = false;
          _showResults = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isCalculating) {
      return Scaffold(
        backgroundColor: const Color(0xFF020617),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              SizedBox(
                width: 60,
                height: 60,
                child: CircularProgressIndicator(color: Color(0xFF3B82F6), strokeWidth: 3),
              ),
              SizedBox(height: 24),
              Text(
                "AI Behavioral Analysis...",
                style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text(
                "Evaluating anxiety thresholds and stress indicators.",
                style: TextStyle(color: Colors.grey, fontSize: 14),
              )
            ],
          ),
        ),
      );
    }

    if (_showResults) {
      Color badgeColor = _resultType == 'low' 
          ? Colors.green 
          : _resultType == 'medium' 
              ? Colors.amber 
              : Colors.red;

      String levelText = _resultType == 'low' ? 'Low Anxiety' : _resultType == 'medium' ? 'Medium Anxiety' : 'High Anxiety';
      int confidence = _resultType == 'low' ? 88 : _resultType == 'medium' ? 62 : 35;

      return Scaffold(
        backgroundColor: const Color(0xFF020617),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Assessment Complete", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                const Text("Here are your real-time AI behavioral insights.", style: TextStyle(color: Colors.grey, fontSize: 14)),
                const SizedBox(height: 32),

                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: badgeColor.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("ANXIETY LEVEL", style: TextStyle(color: badgeColor, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                      const SizedBox(height: 4),
                      Text(levelText, style: TextStyle(color: badgeColor, fontSize: 28, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("CONFIDENCE SCORE", style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text("$confidence%", style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("STRESS SCORE", style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text("$_stressScore", style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // AI Recommendation Card
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
                        children: const [
                          Icon(Icons.psychology, color: Color(0xFF60A5FA), size: 20),
                          SizedBox(width: 8),
                          Text("AI RECOMMENDATIONS", style: TextStyle(color: Color(0xFF60A5FA), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_resultType == 'low') ...[
                        _buildRecommendationItem(Icons.check_circle_outline, "Maintain your natural speaking pace and steady posture."),
                        _buildRecommendationItem(Icons.lightbulb_outline, "Challenge yourself with complex technical mock questions."),
                      ] else if (_resultType == 'medium') ...[
                        _buildRecommendationItem(Icons.self_improvement, "Take 3 deep, controlled breaths before answering questions."),
                        _buildRecommendationItem(Icons.mic_none, "Practise vocal projection & steady eye contact in AI Coach."),
                        _buildRecommendationItem(Icons.auto_stories, "Use the STAR technique (Situation, Task, Action, Result)."),
                      ] else ...[
                        _buildRecommendationItem(Icons.timer_outlined, "Pause 2-3 seconds before speaking to organize your thoughts."),
                        _buildRecommendationItem(Icons.record_voice_over, "Complete the Self-Introduction practice module in AI Coach."),
                        _buildRecommendationItem(Icons.health_and_safety_outlined, "Perform relaxation exercises prior to live interviews."),
                      ],
                    ],
                  ),
                ),

                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (context) => const DashboardScreen()),
                        (route) => false,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text("Return to Dashboard", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                )
              ],
            ),
          ),
        ),
      );
    }

    final question = _questions[_currentStep];
    final progress = (_currentStep + 1) / _questions.length;

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text("Question ${_currentStep + 1} of ${_questions.length}", style: const TextStyle(color: Colors.white, fontSize: 16)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.white10,
            color: const Color(0xFF3B82F6),
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Text(
                question.text,
                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, height: 1.3),
              ),
              const SizedBox(height: 40),

              if (question.type == 'scale') ...[
                StatefulBuilder(
                  builder: (context, setScaleState) {
                    double currentVal = (_answers[question.id] as int? ?? 5).toDouble();
                    return Column(
                      children: [
                        Slider(
                          value: currentVal,
                          min: 1,
                          max: 10,
                          divisions: 9,
                          activeColor: const Color(0xFF3B82F6),
                          onChanged: (val) {
                            setScaleState(() {
                              _answers[question.id] = val.toInt();
                            });
                          },
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(question.minLabel ?? "Min", style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            Text("${currentVal.toInt()}", style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 24, fontWeight: FontWeight.bold)),
                            Text(question.maxLabel ?? "Max", style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        )
                      ],
                    );
                  },
                )
              ] else ...[
                Expanded(
                  child: ListView.builder(
                    itemCount: question.options?.length ?? 0,
                    itemBuilder: (context, index) {
                      final opt = question.options![index];
                      final isSelected = _answers[question.id] == opt;

                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _answers[question.id] = opt;
                          });
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF3B82F6).withOpacity(0.15) : Colors.white.withOpacity(0.04),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.08),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(opt, style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                              if (isSelected) const Icon(Icons.check_circle, color: Color(0xFF3B82F6)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                )
              ],

              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: (_answers[question.id] != null || question.type == 'scale') ? _nextStep : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    disabledBackgroundColor: Colors.white10,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    _currentStep == _questions.length - 1 ? "Submit Assessment" : "Continue",
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecommendationItem(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.grey, size: 18),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4))),
        ],
      ),
    );
  }
}
