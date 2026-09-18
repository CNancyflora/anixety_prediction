import 'package:flutter/material.dart';
import 'main.dart'; // To navigate to LoginScreen
import 'register.dart'; // To navigate to RegisterScreen
class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617), // Very dark slate
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Top Navigation Mock
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.psychology, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 8),
                      const Text("CalmHire AI", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  TextButton(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const LoginScreen())),
                    child: const Text("Sign In", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  )
                ],
              ),
              const SizedBox(height: 40),
              
              // Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    const Text("Next-Gen AI Behavioral Analysis", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              // Title
              RichText(
                textAlign: TextAlign.center,
                text: const TextSpan(
                  style: TextStyle(fontSize: 42, fontWeight: FontWeight.bold, color: Colors.white, height: 1.1),
                  children: [
                    TextSpan(text: 'Prepare Better.\n'),
                    TextSpan(text: 'Speak Confidently.'),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Subtitle
              const Text(
                "Objective, deterministic mock interview and resume analysis to help you land your dream job without the guesswork.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 16, height: 1.5),
              ),
              const SizedBox(height: 40),
              
              // Get Started Button
              Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 300),
                height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                  ),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF3B82F6).withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 5))
                  ],
                ),
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const RegisterScreen()));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Get Started Free', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
              const SizedBox(height: 60),
              
              // Feature Cards (Stacked for mobile)
              _buildFeatureCard(Icons.mic, "Speaking Practice", "Record answers and track objective audio metrics like speaking pace and filler words."),
              const SizedBox(height: 16),
              _buildFeatureCard(Icons.video_camera_front, "Mock Interviews", "Simulate real interview pressure with timed questions and structured feedback."),
              const SizedBox(height: 16),
              _buildFeatureCard(Icons.document_scanner, "Resume Analyzer", "Check ATS compatibility and keyword density with our deterministic parsing engine."),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureCard(IconData icon, String title, String desc) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A), // Slightly lighter dark blue for cards
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: const Color(0xFF3B82F6).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: const Color(0xFF3B82F6), size: 24),
          ),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(desc, style: const TextStyle(color: Colors.grey, fontSize: 14, height: 1.4)),
        ],
      ),
    );
  }
}
