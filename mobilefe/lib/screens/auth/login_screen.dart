import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/l10n/app_localizations.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/widgets/primary_button.dart';
import 'package:mobilefe/widgets/social_button.dart';
import 'package:mobilefe/widgets/text_input_field.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  bool _isGoogleSignInLoading = false;

  // Google Sign In instance - using web client ID from Firebase console
  // serverClientId is required to get idToken for backend authentication
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId:
        '529424604089-hcdqr3r3obegmmbd2i68shn23i8lcfv8.apps.googleusercontent.com',
  );

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: const Interval(0.3, 1.0, curve: Curves.easeOutCubic),
          ),
        );

    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin(BuildContext context) async {
    final l10n = AppLocalizations.of(context);
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.login(_emailController.text, _passwordController.text);

      // Refresh user provider with retry
      bool fetchSuccess = await ref.read(currentUserProvider.notifier).fetchUser();

      // Retry once if fetch failed
      if (!fetchSuccess) {
        await Future.delayed(const Duration(milliseconds: 500));
        fetchSuccess = await ref.read(currentUserProvider.notifier).fetchUser();
      }

      // Invalidate bootstrap provider so it will re-fetch on home screen if needed
      ref.invalidate(userBootstrapProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.loginSuccessful),
            backgroundColor: AppTheme.accentBright,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        context.go(AppRoute.dashboard);
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = l10n.loginFailed;

        if (e is DioException) {
          // Extract error message from API response
          final responseData = e.response?.data;
          if (responseData is Map<String, dynamic> &&
              responseData['message'] != null) {
            errorMessage = responseData['message'];
          } else if (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.sendTimeout) {
            errorMessage = l10n.connectionTimeout;
          } else if (e.type == DioExceptionType.connectionError) {
            errorMessage = l10n.connectionError;
          }
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    }
  }

  /// Handle Google Sign-In
  Future<void> _handleGoogleSignIn(BuildContext context) async {
    final l10n = AppLocalizations.of(context);

    // Prevent multiple taps
    if (_isGoogleSignInLoading) return;

    setState(() {
      _isGoogleSignInLoading = true;
    });

    try {
      debugPrint('🔐 [GOOGLE] Starting Google Sign-In...');

      // Sign out first to ensure account picker shows
      await _googleSignIn.signOut();

      // Trigger Google Sign-In
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        // User cancelled the sign-in
        debugPrint('🔐 [GOOGLE] User cancelled sign-in');
        if (mounted) {
          setState(() {
            _isGoogleSignInLoading = false;
          });
        }
        return;
      }

      debugPrint('🔐 [GOOGLE] Got Google user: ${googleUser.email}');

      // Get authentication details
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      debugPrint('🔐 [GOOGLE] Got Google auth tokens');

      if (googleAuth.idToken == null) {
        throw Exception('Failed to get Google ID token');
      }

      // Create Firebase credential from Google tokens
      final credential = GoogleAuthProvider.credential(
        idToken: googleAuth.idToken,
        accessToken: googleAuth.accessToken,
      );

      // Sign in to Firebase with the Google credential
      debugPrint(
        '🔐 [GOOGLE] Signing in to Firebase with Google credential...',
      );
      final userCredential = await FirebaseAuth.instance.signInWithCredential(
        credential,
      );

      // Get Firebase ID token (this is what the backend expects)
      final firebaseIdToken = await userCredential.user?.getIdToken();

      if (firebaseIdToken == null) {
        throw Exception('Failed to get Firebase ID token');
      }

      debugPrint('🔐 [GOOGLE] Got Firebase ID token, calling backend...');

      // Call backend API with Firebase ID token
      final apiService = ref.read(apiServiceProvider);
      await apiService.loginWithGoogle(
        idToken: firebaseIdToken,
        email: googleUser.email,
        name: googleUser.displayName,
        photoURL: googleUser.photoUrl,
      );

      // Refresh user provider with retry
      bool fetchSuccess = await ref.read(currentUserProvider.notifier).fetchUser();

      // Retry once if fetch failed
      if (!fetchSuccess) {
        await Future.delayed(const Duration(milliseconds: 500));
        fetchSuccess = await ref.read(currentUserProvider.notifier).fetchUser();
      }

      // Invalidate bootstrap provider so it will re-fetch on home screen if needed
      ref.invalidate(userBootstrapProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.loginSuccessful),
            backgroundColor: AppTheme.accentBright,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        context.go(AppRoute.dashboard);
      }
    } catch (e) {
      debugPrint('❌ [GOOGLE] Error: $e');
      if (mounted) {
        String errorMessage = l10n.loginFailed;

        if (e is DioException) {
          final responseData = e.response?.data;
          if (responseData is Map<String, dynamic> &&
              responseData['message'] != null) {
            errorMessage = responseData['message'];
          }
        } else if (e.toString().contains('network_error')) {
          errorMessage = l10n.connectionError;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isGoogleSignInLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool obscurePassword = ref.watch(loginPasswordVisibilityProvider);
    final textTheme = Theme.of(context).textTheme;
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppTheme.surfaceSoft,
              Colors.white,
              AppTheme.primaryVibrant.withOpacity(0.05),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const SizedBox(height: 20),
                    // Logo and welcome section
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppTheme.primaryVibrant,
                              AppTheme.secondaryVibrant,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryVibrant.withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: const Icon(
                          LucideIcons.graduationCap,
                          size: 48,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    Center(
                      child: Text(
                        '${l10n.welcomeBack} 🎯',
                        style: textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Center(
                      child: Text(
                        l10n.signInToContinue,
                        style: textTheme.bodyLarge?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Email field
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextInputField(
                        label: l10n.email,
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Password field
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextInputField(
                        label: l10n.password,
                        controller: _passwordController,
                        obscureText: obscurePassword,
                        suffix: IconButton(
                          icon: Icon(
                            obscurePassword
                                ? LucideIcons.eyeOff
                                : LucideIcons.eye,
                            color: AppTheme.textMuted,
                          ),
                          onPressed: () {
                            ref
                                .read(loginPasswordVisibilityProvider.notifier)
                                .toggle();
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Forgot password
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {},
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                        ),
                        child: Text(
                          l10n.forgotPassword,
                          style: textTheme.bodyMedium?.copyWith(
                            color: AppTheme.primaryVibrant,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Login button
                    PrimaryButton(
                      label: l10n.login,
                      leading: const Icon(LucideIcons.logIn, size: 20),
                      onPressed: () => _handleLogin(context),
                      size: PrimaryButtonSize.large,
                    ),
                    const SizedBox(height: 32),

                    // Divider
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Container(
                            height: 1,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  AppTheme.textMuted.withOpacity(0.3),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            l10n.orContinueWith,
                            style: textTheme.bodySmall?.copyWith(
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Container(
                            height: 1,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  AppTheme.textMuted.withOpacity(0.3),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Social login buttons
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: _isGoogleSignInLoading
                                ? const SizedBox(
                                    height: 48,
                                    child: Center(
                                      child: SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: AppTheme.primaryVibrant,
                                        ),
                                      ),
                                    ),
                                  )
                                : SocialButton(
                                    icon: LucideIcons.mail,
                                    label: 'Google',
                                    onPressed: () =>
                                        _handleGoogleSignIn(context),
                                  ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: SocialButton(
                              icon: LucideIcons.facebook,
                              label: 'Facebook',
                              onPressed: () {},
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Register link
                    Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: <Widget>[
                          Text(
                            l10n.dontHaveAccount,
                            style: textTheme.bodyMedium?.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                          TextButton(
                            onPressed: () => context.push(AppRoute.register),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                            ),
                            child: Text(
                              l10n.createAccount,
                              style: textTheme.bodyMedium?.copyWith(
                                color: AppTheme.primaryVibrant,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
