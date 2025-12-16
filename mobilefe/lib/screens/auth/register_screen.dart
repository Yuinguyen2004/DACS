import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/l10n/app_localizations.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/widgets/primary_button.dart';
import 'package:mobilefe/widgets/text_input_field.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late final TextEditingController _confirmPasswordController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister(BuildContext context) async {
    final l10n = AppLocalizations.of(context);
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l10n.passwordsDoNotMatch)));
      return;
    }

    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.register(
        _emailController.text,
        _passwordController.text,
        _nameController.text,
      );

      // Fetch user profile after successful registration with retry
      bool fetchSuccess = await ref.read(currentUserProvider.notifier).fetchUser();

      // Retry once if fetch failed (token might need a moment to propagate)
      if (!fetchSuccess) {
        await Future.delayed(const Duration(milliseconds: 500));
        fetchSuccess = await ref.read(currentUserProvider.notifier).fetchUser();
      }

      // Invalidate bootstrap provider so it will re-fetch on home screen if needed
      ref.invalidate(userBootstrapProvider);

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(l10n.registerSuccessful)));
        // Go directly to dashboard since user is already authenticated
        context.go(AppRoute.dashboard);
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = l10n.registerFailed;

        if (e is DioException) {
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

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(errorMessage)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool obscurePassword = ref.watch(registerPasswordVisibilityProvider);
    final bool obscureConfirm = ref.watch(
      registerConfirmPasswordVisibilityProvider,
    );

    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
        title: Text(l10n.createAccount),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              TextInputField(label: l10n.name, controller: _nameController),
              const SizedBox(height: 20),
              TextInputField(
                label: l10n.email,
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 20),
              TextInputField(
                label: l10n.password,
                controller: _passwordController,
                obscureText: obscurePassword,
                suffix: IconButton(
                  icon: Icon(
                    obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                  ),
                  onPressed: () {
                    ref
                        .read(registerPasswordVisibilityProvider.notifier)
                        .toggle();
                  },
                ),
              ),
              const SizedBox(height: 20),
              TextInputField(
                label: l10n.confirmPassword,
                controller: _confirmPasswordController,
                obscureText: obscureConfirm,
                suffix: IconButton(
                  icon: Icon(
                    obscureConfirm ? LucideIcons.eyeOff : LucideIcons.eye,
                  ),
                  onPressed: () {
                    ref
                        .read(
                          registerConfirmPasswordVisibilityProvider.notifier,
                        )
                        .toggle();
                  },
                ),
              ),
              const SizedBox(height: 28),
              PrimaryButton(
                label: l10n.createAccount,
                onPressed: () => _handleRegister(context),
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.center,
                child: TextButton(
                  onPressed: () => context.go(AppRoute.login),
                  child: Text(l10n.alreadyHaveAccount),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
