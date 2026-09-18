import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'firebase_options.dart';
import 'dashboard.dart';
import 'landing.dart';
import 'register.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CalmHire AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF020617),
        colorScheme: ColorScheme.fromSeed(
          brightness: Brightness.dark,
          seedColor: const Color(0xFF3B82F6),
        ),
      ),
      home: const LandingScreen(),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin() async {
    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.message ?? "Authentication failed. Please check your credentials.";
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = "An unexpected error occurred. Please try again.";
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 400,
              height: 400,
              decoration: const BoxDecoration(
                color: Color(0x332563EB),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            right: -100,
            child: Container(
              width: 400,
              height: 400,
              decoration: const BoxDecoration(
                color: Color(0x334F46E5),
                shape: BoxShape.circle,
              ),
            ),
          ),
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 100, sigmaY: 100),
            child: Container(color: Colors.transparent),
          ),
          
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 420),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Center(
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF2563EB), Color(0xFF6366F1)],
                                ),
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF3B82F6).withOpacity(0.3),
                                    blurRadius: 20,
                                    offset: const Offset(0, 10),
                                  )
                                ],
                              ),
                              padding: const EdgeInsets.all(3),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF020617),
                                  borderRadius: BorderRadius.circular(21),
                                ),
                                child: const Icon(Icons.psychology, color: Colors.white, size: 40),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          
                          const Text(
                            'CALMHIRE AI',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFF60A5FA),
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 8),
                          RichText(
                            textAlign: TextAlign.center,
                            text: const TextSpan(
                              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                              children: [
                                TextSpan(text: 'Welcome Back,\n'),
                                TextSpan(text: 'Nancy Flora', style: TextStyle(color: Color(0xFF60A5FA))),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Prepare smarter. Perform confidently.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey.shade400, fontSize: 16),
                          ),
                          const SizedBox(height: 32),
                          
                          if (_errorMessage != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(bottom: 20),
                              decoration: BoxDecoration(
                                color: Colors.amber.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.amber.withOpacity(0.3)),
                              ),
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: Colors.amber, fontSize: 13),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          
                          const Text('Email / Username', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _emailController,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.white.withOpacity(0.05),
                              prefixIcon: const Icon(Icons.email_outlined, color: Colors.grey),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: Color(0xFF3B82F6)),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Password', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              TextButton(
                                onPressed: () async {
                                  if (_emailController.text.trim().isEmpty) {
                                    setState(() => _errorMessage = "Please enter your email to reset password.");
                                    return;
                                  }
                                  try {
                                    await FirebaseAuth.instance.sendPasswordResetEmail(email: _emailController.text.trim());
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text("Password reset email sent!"), backgroundColor: Colors.green)
                                    );
                                  } catch (e) {
                                    setState(() => _errorMessage = "Error sending reset email. Please try again.");
                                  }
                                },
                                child: const Text('Forgot Password?', style: TextStyle(color: Color(0xFF60A5FA), fontSize: 12, fontWeight: FontWeight.bold)),
                              )
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.white.withOpacity(0.05),
                              prefixIcon: const Icon(Icons.lock_outline, color: Colors.grey),
                              suffixIcon: IconButton(
                                icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(color: Color(0xFF3B82F6)),
                              ),
                            ),
                          ),
                          const SizedBox(height: 32),
                          
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              gradient: const LinearGradient(
                                colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF3B82F6).withOpacity(0.3),
                                  blurRadius: 15,
                                  offset: const Offset(0, 5),
                                )
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _handleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                padding: const EdgeInsets.symmetric(vertical: 20),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: _isLoading 
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text(
                                    'Sign In',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Google Sign In Button
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              color: Colors.white.withOpacity(0.05),
                              border: Border.all(color: Colors.white.withOpacity(0.1)),
                            ),
                            child: ElevatedButton.icon(
                              onPressed: _isLoading ? null : () async {
                                setState(() => _isLoading = true);
                                try {
                                  // Clear previous google session to force account picker
                                  await GoogleSignIn().signOut();
                                  // Attempt Google Sign-In
                                  final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();
                                  if (googleUser == null) {
                                    // User canceled
                                    setState(() => _isLoading = false);
                                    return;
                                  }

                                  final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
                                  final AuthCredential credential = GoogleAuthProvider.credential(
                                    accessToken: googleAuth.accessToken,
                                    idToken: googleAuth.idToken,
                                  );

                                  final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
                                  
                                  // If new user, create a Firestore document
                                  if (userCredential.additionalUserInfo?.isNewUser ?? false) {
                                    await FirebaseFirestore.instance.collection('users').doc(userCredential.user!.uid).set({
                                      'fullName': userCredential.user!.displayName ?? '',
                                      'email': userCredential.user!.email ?? '',
                                      'createdAt': FieldValue.serverTimestamp(),
                                      'phone': '',
                                      'location': '',
                                      'photoURL': userCredential.user!.photoURL ?? '',
                                    });
                                  }

                                  if (mounted) {
                                    Navigator.pushReplacement(
                                      context,
                                      MaterialPageRoute(builder: (context) => const DashboardScreen()),
                                    );
                                  }
                                } catch (e) {
                                  print("Google Sign In Error: $e");
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text("Google Sign-In failed. Check SHA-1 configuration."),
                                        backgroundColor: Colors.red,
                                      )
                                    );
                                    setState(() => _isLoading = false);
                                  }
                                }
                              },
                              icon: const Icon(Icons.g_mobiledata, color: Colors.white, size: 32),
                              label: const Text(
                                'Continue with Google',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text("New to CalmHire AI? ", style: TextStyle(color: Colors.grey)),
                              TextButton(
                                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const RegisterScreen())),
                                child: const Text("Sign Up", style: TextStyle(color: Color(0xFF3B82F6), fontWeight: FontWeight.bold)),
                              )
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
