import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'assessment.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: const Color(0xFF020617),
        elevation: 0,
        title: const Text('Performance Analytics', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: user != null 
          ? FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .collection('assessments')
              .orderBy('createdAt', descending: true)
              .snapshots()
          : const Stream.empty(),
        builder: (context, snapshot) {
          final docs = snapshot.data?.docs ?? [];
          final hasData = docs.isNotEmpty;

          if (!hasData) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.blue.withOpacity(0.2)),
                      ),
                      child: const Icon(Icons.analytics, size: 64, color: Colors.blue),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'No Analytics Available',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Complete your first assessment and mock interview to generate personalized performance analytics.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey, fontSize: 14),
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const AssessmentScreen()),
                        );
                      },
                      icon: const Icon(Icons.videocam, color: Colors.white),
                      label: const Text('Start Assessment', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // Calculate average stats from docs
          int total = docs.length;
          int lowCount = 0, medCount = 0, highCount = 0;
          for (var doc in docs) {
            final data = doc.data() as Map<String, dynamic>;
            final level = data['anxietyLevel'] ?? 'low';
            if (level == 'low') lowCount++;
            else if (level == 'medium') medCount++;
            else highCount++;
          }

          int avgConfidence = ((lowCount * 88 + medCount * 62 + highCount * 35) / total).round();

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('YOUR PROGRESS', style: TextStyle(color: Color(0xFF60A5FA), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                const SizedBox(height: 4),
                const Text('Performance Breakdown', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 24),

                // Stat Summary Cards
                Row(
                  children: [
                    Expanded(child: _buildMetricCard('Avg Confidence', '$avgConfidence%', Icons.bolt, Colors.blue)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMetricCard('Sessions', '$total', Icons.check_circle, Colors.green)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildMetricCard('Voice Clarity', '85%', Icons.mic, Colors.purple)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMetricCard('Eye Contact', '78%', Icons.visibility, Colors.amber)),
                  ],
                ),

                const SizedBox(height: 32),
                const Text('Anxiety Distribution', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 16),

                _buildDistributionBar('Low Anxiety', lowCount, total, Colors.green),
                const SizedBox(height: 12),
                _buildDistributionBar('Medium Anxiety', medCount, total, Colors.amber),
                const SizedBox(height: 12),
                _buildDistributionBar('High Anxiety', highCount, total, Colors.red),

                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.blue.withOpacity(0.15)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2563EB),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.psychology, color: Colors.white, size: 28),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('AI Performance Insights', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 4),
                            Text(
                              avgConfidence >= 70 
                                ? 'Great job! Your confidence level is consistently high. Keep practicing to maintain peak delivery.'
                                : 'You are making steady progress! Focus on eye contact and steady voice pace during your next session.',
                              style: const TextStyle(color: Colors.grey, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMetricCard(String label, String val, IconData icon, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color[400], size: 24),
          const SizedBox(height: 12),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(val, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildDistributionBar(String title, int count, int total, MaterialColor color) {
    double pct = total > 0 ? (count / total) : 0;
    int percentage = (pct * 100).round();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            Text('$count session ($percentage%)', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 8,
            backgroundColor: Colors.white.withOpacity(0.05),
            valueColor: AlwaysStoppedAnimation<Color>(color[400]!),
          ),
        )
      ],
    );
  }
}
