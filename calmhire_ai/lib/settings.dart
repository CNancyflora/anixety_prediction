import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'landing.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  // ── Controllers ──────────────────────────────────────────────────────────────
  final _nameCtrl  = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  // ── Prefs State ───────────────────────────────────────────────────────────────
  bool _darkMode            = true;
  bool _notifications       = true;
  bool _dailyReminder       = false;
  bool _weeklyProgress      = false;
  String _language          = 'English (US)';

  // ── UI State ──────────────────────────────────────────────────────────────────
  bool _isLoading       = true;
  bool _isSavingProfile = false;
  bool _isLoggingOut    = false;

  final _auth      = FirebaseAuth.instance;
  final _firestore = FirebaseFirestore.instance;
  User? get _user  => _auth.currentUser;

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────────
  Future<void> _loadUserData() async {
    if (_user == null) { setState(() => _isLoading = false); return; }

    try {
      final doc = await _firestore.collection('users').doc(_user!.uid).get();
      final data = doc.data() ?? {};

      setState(() {
        _nameCtrl.text  = data['fullName']  ?? _user!.displayName ?? '';
        _emailCtrl.text = data['email']     ?? _user!.email       ?? '';
        _phoneCtrl.text = data['phone']     ?? '';
        _darkMode       = data['darkMode']       ?? true;
        _notifications  = data['notifications']  ?? true;
        _dailyReminder  = data['dailyReminder']  ?? false;
        _weeklyProgress = data['weeklyProgress'] ?? false;
        _language       = data['language']       ?? 'English (US)';
        _isLoading      = false;
      });
    } catch (_) {
      // fallback to Auth data
      setState(() {
        _nameCtrl.text  = _user!.displayName ?? '';
        _emailCtrl.text = _user!.email       ?? '';
        _isLoading      = false;
      });
    }
  }

  // ── Profile Save ───────────────────────────────────────────────────────────────
  Future<void> _saveProfile() async {
    if (_user == null) return;
    setState(() => _isSavingProfile = true);
    try {
      // Update Firebase Auth display name
      await _user!.updateDisplayName(_nameCtrl.text.trim());

      // Update Firestore
      await _firestore.collection('users').doc(_user!.uid).set({
        'fullName': _nameCtrl.text.trim(),
        'email'  : _emailCtrl.text.trim(),
        'phone'  : _phoneCtrl.text.trim(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      _showSnack('✅ Profile updated successfully.', Colors.green);
    } catch (e) {
      _showSnack('Error saving profile: $e', Colors.red);
    } finally {
      if (mounted) setState(() => _isSavingProfile = false);
    }
  }

  // ── Prefs Save ─────────────────────────────────────────────────────────────────
  Future<void> _savePrefs() async {
    if (_user == null) return;
    try {
      await _firestore.collection('users').doc(_user!.uid).set({
        'darkMode'       : _darkMode,
        'notifications'  : _notifications,
        'dailyReminder'  : _dailyReminder,
        'weeklyProgress' : _weeklyProgress,
        'language'       : _language,
      }, SetOptions(merge: true));
      _showSnack('✅ Preferences saved.', Colors.green);
    } catch (e) {
      _showSnack('Error saving preferences: $e', Colors.red);
    }
  }

  // ── Password Change ────────────────────────────────────────────────────────────
  void _changePassword() {
    final oldCtrl     = TextEditingController();
    final newCtrl     = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool saving       = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Change Password',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _dialogField(oldCtrl,     'Current Password',  Icons.lock_outline,         obscure: true),
              const SizedBox(height: 12),
              _dialogField(newCtrl,     'New Password',       Icons.lock_open,            obscure: true),
              const SizedBox(height: 12),
              _dialogField(confirmCtrl, 'Confirm Password',   Icons.lock_reset,           obscure: true),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              onPressed: saving ? null : () async {
                if (newCtrl.text != confirmCtrl.text) {
                  _showSnack('Passwords do not match.', Colors.red); return;
                }
                if (newCtrl.text.length < 6) {
                  _showSnack('Password must be at least 6 characters.', Colors.red); return;
                }
                setLocal(() => saving = true);
                try {
                  final cred = EmailAuthProvider.credential(
                    email: _user!.email!,
                    password: oldCtrl.text,
                  );
                  await _user!.reauthenticateWithCredential(cred);
                  await _user!.updatePassword(newCtrl.text);
                  if (mounted) {
                    Navigator.pop(ctx);
                    _showSnack('✅ Password changed successfully.', Colors.green);
                  }
                } on FirebaseAuthException catch (e) {
                  _showSnack(e.message ?? 'Failed to change password.', Colors.red);
                  setLocal(() => saving = false);
                }
              },
              child: saving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Update', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  // ── Delete Account ─────────────────────────────────────────────────────────────
  void _deleteAccount() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Account', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
        content: const Text(
          'This will permanently delete your account and all data. This action cannot be undone.',
          style: TextStyle(color: Colors.grey, height: 1.4),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final uid = _user!.uid;
                // Delete Firestore data
                await _firestore.collection('users').doc(uid).delete();
                // Delete Auth user
                await _user!.delete();
                await GoogleSignIn().signOut();
                if (mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LandingScreen()),
                    (r) => false,
                  );
                }
              } on FirebaseAuthException catch (e) {
                _showSnack(e.message ?? 'Please re-login and try again.', Colors.red);
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // ── Export Data ────────────────────────────────────────────────────────────────
  Future<void> _exportData() async {
    if (_user == null) return;
    try {
      final doc = await _firestore.collection('users').doc(_user!.uid).get();
      final assessSnap = await _firestore
          .collection('users').doc(_user!.uid)
          .collection('assessments')
          .get();

      final userData = doc.data() ?? {};
      final sessionCount = assessSnap.docs.length;

      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Your Data', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _dataRow('Name',     userData['fullName']  ?? '-'),
                _dataRow('Email',    userData['email']     ?? '-'),
                _dataRow('Phone',    userData['phone']     ?? '-'),
                _dataRow('Sessions', '$sessionCount'),
                _dataRow('Joined',   userData['createdAt'] != null
                    ? (userData['createdAt'] as Timestamp).toDate().toString().split(' ')[0]
                    : '-'),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close', style: TextStyle(color: Colors.blue)),
            ),
          ],
        ),
      );
    } catch (e) {
      _showSnack('Error exporting data: $e', Colors.red);
    }
  }

  Widget _dataRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 80, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
        const SizedBox(width: 8),
        Expanded(child: Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600))),
      ],
    ),
  );

  // ── Clear History ──────────────────────────────────────────────────────────────
  void _clearHistory() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Clear Interview History', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('All interview sessions and assessment data will be deleted.', style: TextStyle(color: Colors.grey)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                if (_user == null) return;
                final snap = await _firestore
                    .collection('users').doc(_user!.uid)
                    .collection('assessments')
                    .get();
                final batch = _firestore.batch();
                for (final doc in snap.docs) { batch.delete(doc.reference); }
                await batch.commit();
                _showSnack('✅ Interview history cleared.', Colors.green);
              } catch (e) {
                _showSnack('Error clearing history: $e', Colors.red);
              }
            },
            child: const Text('Clear', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // ── Language Picker ────────────────────────────────────────────────────────────
  void _pickLanguage() {
    final langs = ['English (US)', 'English (UK)', 'Hindi', 'Tamil', 'Spanish', 'French'];
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Select Language', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          ...langs.map((l) => ListTile(
            title: Text(l, style: const TextStyle(color: Colors.white)),
            trailing: _language == l ? const Icon(Icons.check, color: Colors.blue) : null,
            onTap: () {
              setState(() => _language = l);
              Navigator.pop(ctx);
              _savePrefs();
            },
          )),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  // ── Logout ─────────────────────────────────────────────────────────────────────
  Future<void> _logout() async {
    setState(() => _isLoggingOut = true);
    try {
      await GoogleSignIn().signOut();
      await _auth.signOut();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LandingScreen()),
          (r) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoggingOut = false);
        _showSnack('Logout failed: $e', Colors.red);
      }
    }
  }

  void _confirmLogout() => showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Text('Logout?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      content: const Text('Are you sure you want to logout?', style: TextStyle(color: Colors.grey)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          onPressed: () { Navigator.pop(ctx); _logout(); },
          child: const Text('Logout', style: TextStyle(color: Colors.white)),
        ),
      ],
    ),
  );

  // ── Helpers ────────────────────────────────────────────────────────────────────
  void _showSnack(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: color, behavior: SnackBarBehavior.floating),
    );
  }

  Widget _dialogField(TextEditingController ctrl, String hint, IconData icon, {bool obscure = false}) =>
      TextField(
        controller: ctrl,
        obscureText: obscure,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.grey),
          prefixIcon: Icon(icon, color: Colors.grey, size: 20),
          filled: true,
          fillColor: Colors.white.withOpacity(0.05),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF3B82F6))),
        ),
      );

  // ── BUILD ──────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF020617),
        body: Center(child: CircularProgressIndicator(color: Colors.blue)),
      );
    }

    final photoUrl = _user?.photoURL;
    final initials = (_nameCtrl.text.isNotEmpty ? _nameCtrl.text[0] : 'U').toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: const Color(0xFF020617),
        elevation: 0,
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          // ── Profile Section ───────────────────────────────────────────────────
          _SectionHeader(title: 'PROFILE'),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
            ),
            child: Column(children: [
              // Avatar
              Center(
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: const Color(0xFF3B82F6).withOpacity(0.2),
                      backgroundImage: (photoUrl != null && photoUrl.isNotEmpty)
                          ? NetworkImage(photoUrl)
                          : null,
                      child: (photoUrl == null || photoUrl.isEmpty)
                          ? Text(initials, style: const TextStyle(color: Colors.blue, fontSize: 30, fontWeight: FontWeight.bold))
                          : null,
                    ),
                    Positioned(
                      bottom: 0, right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFF020617), width: 2),
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _InputField(ctrl: _nameCtrl,  label: 'Full Name',  icon: Icons.person_outline),
              const SizedBox(height: 12),
              _InputField(ctrl: _emailCtrl, label: 'Email',      icon: Icons.email_outlined),
              const SizedBox(height: 12),
              _InputField(ctrl: _phoneCtrl, label: 'Phone',      icon: Icons.phone_outlined, inputType: TextInputType.phone),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSavingProfile ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isSavingProfile
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Save Changes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ]),
          ),

          const SizedBox(height: 28),

          // ── Preferences ────────────────────────────────────────────────────────
          _SectionHeader(title: 'PREFERENCES'),
          const SizedBox(height: 12),
          _SwitchTile(
            icon: Icons.dark_mode_outlined, label: 'Dark Mode', value: _darkMode,
            onChanged: (v) { setState(() => _darkMode = v); _savePrefs(); },
          ),
          _SwitchTile(
            icon: Icons.notifications_outlined, label: 'Push Notifications', value: _notifications,
            onChanged: (v) { setState(() => _notifications = v); _savePrefs(); },
          ),
          _SwitchTile(
            icon: Icons.alarm, label: 'Daily Practice Reminder', value: _dailyReminder,
            onChanged: (v) { setState(() => _dailyReminder = v); _savePrefs(); },
          ),
          _SwitchTile(
            icon: Icons.bar_chart, label: 'Weekly Progress Report', value: _weeklyProgress,
            onChanged: (v) { setState(() => _weeklyProgress = v); _savePrefs(); },
          ),
          _ArrowTile(
            icon: Icons.language_outlined, label: 'Language', subtitle: _language,
            onTap: _pickLanguage,
          ),

          const SizedBox(height: 28),

          // ── Account ────────────────────────────────────────────────────────────
          _SectionHeader(title: 'ACCOUNT'),
          const SizedBox(height: 12),
          _ArrowTile(icon: Icons.lock_outline,    label: 'Change Password',     onTap: _changePassword),
          _ArrowTile(icon: Icons.download_outlined, label: 'Export My Data',     onTap: _exportData),
          _ArrowTile(icon: Icons.history,         label: 'Clear Interview History', onTap: _clearHistory),
          _ArrowTile(icon: Icons.delete_outline,  label: 'Delete Account',       onTap: _deleteAccount, color: Colors.redAccent),

          const SizedBox(height: 28),

          // ── Logout ─────────────────────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isLoggingOut ? null : _confirmLogout,
              icon: _isLoggingOut
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.redAccent, strokeWidth: 2))
                  : const Icon(Icons.logout, color: Colors.redAccent),
              label: Text(
                _isLoggingOut ? 'Logging out…' : 'Logout Account',
                style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 15),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent.withOpacity(0.08),
                padding: const EdgeInsets.symmetric(vertical: 16),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.redAccent.withOpacity(0.3)),
                ),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ]),
      ),
    );
  }
}

// ─── Reusable Widgets ──────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) => Text(
    title,
    style: const TextStyle(
      color: Colors.grey, fontSize: 11,
      fontWeight: FontWeight.bold, letterSpacing: 1.6,
    ),
  );
}

class _InputField extends StatelessWidget {
  final TextEditingController ctrl;
  final String label;
  final IconData icon;
  final TextInputType? inputType;

  const _InputField({required this.ctrl, required this.label, required this.icon, this.inputType});

  @override
  Widget build(BuildContext context) => TextField(
    controller: ctrl,
    keyboardType: inputType,
    style: const TextStyle(color: Colors.white),
    decoration: InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.grey, fontSize: 13),
      prefixIcon: Icon(icon, color: Colors.grey, size: 20),
      filled: true,
      fillColor: Colors.white.withOpacity(0.04),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF3B82F6))),
    ),
  );
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchTile({required this.icon, required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.02),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Colors.white.withOpacity(0.05)),
    ),
    child: Row(children: [
      Icon(icon, color: Colors.grey, size: 20),
      const SizedBox(width: 14),
      Expanded(child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500))),
      Switch(value: value, onChanged: onChanged, activeColor: const Color(0xFF3B82F6)),
    ]),
  );
}

class _ArrowTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  final Color? color;

  const _ArrowTile({required this.icon, required this.label, required this.onTap, this.subtitle, this.color});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(children: [
        Icon(icon, color: color ?? Colors.grey, size: 20),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: TextStyle(color: color ?? Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
          if (subtitle != null)
            Text(subtitle!, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ])),
        Icon(Icons.chevron_right, color: color ?? Colors.grey, size: 20),
      ]),
    ),
  );
}
