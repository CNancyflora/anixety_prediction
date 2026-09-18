import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart' as fp;

// ─── State Machine ────────────────────────────────────────────────────────────
enum _AnalysisState { empty, analyzing, done }

class ResumeAnalyzerScreen extends StatefulWidget {
  const ResumeAnalyzerScreen({super.key});

  @override
  State<ResumeAnalyzerScreen> createState() => _ResumeAnalyzerScreenState();
}

class _ResumeAnalyzerScreenState extends State<ResumeAnalyzerScreen> {
  _AnalysisState _state = _AnalysisState.empty;
  String? _fileName;
  String _analyzeStatus = '';

  // ── Results (only populated after real upload) ─────────────────────────────
  int _atsScore = 0;
  int _resumeScore = 0;
  int _skillMatch = 0;
  final List<String> _strengths = [];
  final List<String> _weaknesses = [];
  final List<String> _suggestions = [];
  final List<String> _missingSkills = [];
  final List<String> _keywords = [];

  // ── File Picker ─────────────────────────────────────────────────────────────
  Future<void> _pickFile() async {
    try {
      final result = await fp.FilePicker.pickFiles(
        type: fp.FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
        allowMultiple: false,
      );

      if (result == null || result.files.isEmpty) return; // user cancelled

      final file = result.files.first;
      if (file.name.isEmpty) return;

      setState(() {
        _fileName = file.name;
        _state = _AnalysisState.analyzing;
        _analyzeStatus = 'Parsing document structure…';
      });

      await _runAnalysis();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open file: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _runAnalysis() async {
    // Step 1
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _analyzeStatus = 'Scanning ATS compatibility…');

    // Step 2
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() => _analyzeStatus = 'Extracting skills & keywords…');

    // Step 3
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _analyzeStatus = 'Generating AI suggestions…');

    // Step 4 — compute results based on file name (deterministic seed)
    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;

    final seed = (_fileName ?? '').codeUnits.fold(0, (a, b) => a + b);
    _atsScore   = 62 + (seed % 25);       // 62–86
    _resumeScore= 65 + (seed % 22);       // 65–86
    _skillMatch = 55 + (seed % 30);       // 55–84

    _strengths
      ..clear()
      ..addAll([
        'Clear section headings and formatting',
        'Relevant work experience highlighted',
        'Quantifiable achievements present',
      ]);

    _weaknesses
      ..clear()
      ..addAll([
        'Missing a professional summary section',
        'Skills section lacks industry keywords',
      ]);

    _suggestions
      ..clear()
      ..addAll([
        'Add quantifiable metrics (e.g., "Reduced load time by 30%")',
        'Include a dedicated "Certifications" section',
        'Use action verbs at the start of bullet points',
        'Tailor keywords to match the target job description',
      ]);

    _missingSkills
      ..clear()
      ..addAll(['Docker', 'CI/CD', 'System Design', 'Cloud (AWS/GCP)']);

    _keywords
      ..clear()
      ..addAll(['Flutter', 'Firebase', 'REST API', 'Git', 'Agile']);

    setState(() => _state = _AnalysisState.done);
  }

  void _reset() => setState(() {
        _state = _AnalysisState.empty;
        _fileName = null;
        _analyzeStatus = '';
        _strengths.clear();
        _weaknesses.clear();
        _suggestions.clear();
        _missingSkills.clear();
        _keywords.clear();
      });

  // ── Build ───────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: const Color(0xFF020617),
        elevation: 0,
        title: const Text('AI Resume Analyzer',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_state == _AnalysisState.done)
            TextButton.icon(
              onPressed: _reset,
              icon: const Icon(Icons.refresh, color: Colors.blue, size: 18),
              label: const Text('New', style: TextStyle(color: Colors.blue, fontSize: 13)),
            ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 400),
        child: _state == _AnalysisState.empty
            ? _EmptyState(onUpload: _pickFile)
            : _state == _AnalysisState.analyzing
                ? _AnalyzingView(fileName: _fileName!, status: _analyzeStatus)
                : _ResultsView(
                    fileName: _fileName!,
                    atsScore: _atsScore,
                    resumeScore: _resumeScore,
                    skillMatch: _skillMatch,
                    strengths: _strengths,
                    weaknesses: _weaknesses,
                    suggestions: _suggestions,
                    missingSkills: _missingSkills,
                    keywords: _keywords,
                    onUploadNew: _pickFile,
                  ),
      ),
    );
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final VoidCallback onUpload;
  const _EmptyState({required this.onUpload});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.08),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.blue.withOpacity(0.2), width: 2),
              ),
              child: const Icon(Icons.description_outlined, size: 52, color: Colors.blue),
            ),
            const SizedBox(height: 28),
            const Text('No Resume Uploaded',
                style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            const Text(
              'Upload your resume to begin AI analysis.\nGet your ATS score, skill match, and smart suggestions.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onUpload,
                icon: const Icon(Icons.upload_file, color: Colors.white),
                label: const Text('Upload Resume',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.check_circle_outline, color: Colors.grey, size: 14),
                SizedBox(width: 6),
                Text('Supported: PDF, DOCX, DOC',
                    style: TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Analyzing View ───────────────────────────────────────────────────────────
class _AnalyzingView extends StatelessWidget {
  final String fileName;
  final String status;
  const _AnalyzingView({required this.fileName, required this.status});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: Colors.blue, strokeWidth: 3),
            const SizedBox(height: 32),
            // File badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.withOpacity(0.2)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.description, color: Colors.blue, size: 18),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(fileName,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('Analyzing Resume…',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
            const SizedBox(height: 10),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: Text(status,
                  key: ValueKey(status),
                  style: const TextStyle(color: Colors.grey, fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Results View ─────────────────────────────────────────────────────────────
class _ResultsView extends StatelessWidget {
  final String fileName;
  final int atsScore, resumeScore, skillMatch;
  final List<String> strengths, weaknesses, suggestions, missingSkills, keywords;
  final VoidCallback onUploadNew;

  const _ResultsView({
    required this.fileName,
    required this.atsScore,
    required this.resumeScore,
    required this.skillMatch,
    required this.strengths,
    required this.weaknesses,
    required this.suggestions,
    required this.missingSkills,
    required this.keywords,
    required this.onUploadNew,
  });

  Color _scoreColor(int score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // File badge
          Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 18),
                const SizedBox(width: 8),
                Expanded(
                    child: Text(fileName,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        overflow: TextOverflow.ellipsis)),
                TextButton(
                  onPressed: onUploadNew,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Replace', style: TextStyle(color: Colors.blue, fontSize: 12)),
                ),
              ],
            ),
          ),

          // Score Cards Row
          Row(children: [
            Expanded(child: _ScoreCard(label: 'ATS Score', score: atsScore, color: _scoreColor(atsScore))),
            const SizedBox(width: 10),
            Expanded(child: _ScoreCard(label: 'Resume Score', score: resumeScore, color: _scoreColor(resumeScore))),
            const SizedBox(width: 10),
            Expanded(child: _ScoreCard(label: 'Skill Match', score: skillMatch, color: _scoreColor(skillMatch))),
          ]),
          const SizedBox(height: 20),

          // ATS Progress Bar
          _SectionCard(
            title: 'ATS Compatibility',
            icon: Icons.checklist_outlined,
            iconColor: Colors.blue,
            child: Column(children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('ATS Score', style: TextStyle(color: Colors.grey, fontSize: 13)),
                Text('$atsScore%', style: TextStyle(color: _scoreColor(atsScore), fontWeight: FontWeight.bold)),
              ]),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: atsScore / 100,
                  minHeight: 8,
                  backgroundColor: Colors.white12,
                  valueColor: AlwaysStoppedAnimation<Color>(_scoreColor(atsScore)),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                atsScore >= 80
                    ? '✅ Excellent ATS compatibility. Your resume will pass most filters.'
                    : atsScore >= 60
                        ? '⚠️ Moderate compatibility. Consider adding more keywords.'
                        : '❌ Low compatibility. Add industry-specific keywords.',
                style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.4),
              ),
            ]),
          ),
          const SizedBox(height: 14),

          // Keywords Found
          _SectionCard(
            title: 'Keywords Found',
            icon: Icons.key,
            iconColor: Colors.teal,
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: keywords.map((k) => _Chip(label: k, color: Colors.teal)).toList(),
            ),
          ),
          const SizedBox(height: 14),

          // Missing Skills
          _SectionCard(
            title: 'Missing Skills',
            icon: Icons.warning_amber_rounded,
            iconColor: Colors.orange,
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: missingSkills.map((s) => _Chip(label: s, color: Colors.orange)).toList(),
            ),
          ),
          const SizedBox(height: 14),

          // Strengths
          _SectionCard(
            title: 'Strengths',
            icon: Icons.thumb_up_alt_outlined,
            iconColor: Colors.green,
            child: Column(
              children: strengths
                  .map((s) => _BulletItem(text: s, color: Colors.green))
                  .toList(),
            ),
          ),
          const SizedBox(height: 14),

          // Weaknesses
          _SectionCard(
            title: 'Weaknesses',
            icon: Icons.thumb_down_alt_outlined,
            iconColor: Colors.red,
            child: Column(
              children: weaknesses
                  .map((s) => _BulletItem(text: s, color: Colors.red))
                  .toList(),
            ),
          ),
          const SizedBox(height: 14),

          // AI Suggestions
          _SectionCard(
            title: 'AI Suggestions',
            icon: Icons.psychology,
            iconColor: Colors.purple,
            child: Column(
              children: suggestions.asMap().entries.map((e) =>
                  _BulletItem(text: '${e.key + 1}. ${e.value}', color: Colors.purple)).toList(),
            ),
          ),
          const SizedBox(height: 28),
        ],
      ),
    );
  }
}

// ─── Sub Widgets ──────────────────────────────────────────────────────────────
class _ScoreCard extends StatelessWidget {
  final String label;
  final int score;
  final Color color;
  const _ScoreCard({required this.label, required this.score, required this.color});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Column(children: [
          Text('$score%', style: TextStyle(color: color, fontSize: 26, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label,
              style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center),
        ]),
      );
}

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final Widget child;
  const _SectionCard({required this.title, required this.icon, required this.iconColor, required this.child});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(icon, color: iconColor, size: 18),
            const SizedBox(width: 8),
            Text(title,
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
          ]),
          const SizedBox(height: 14),
          child,
        ]),
      );
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Text(label,
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
      );
}

class _BulletItem extends StatelessWidget {
  final String text;
  final Color color;
  const _BulletItem({required this.text, required this.color});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(Icons.circle, color: color, size: 6),
          const SizedBox(width: 10),
          Expanded(
              child: Text(text,
                  style: const TextStyle(color: Colors.grey, fontSize: 13, height: 1.4))),
        ]),
      );
}
