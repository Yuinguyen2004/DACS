import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
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

  void _handleRegister(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Account created (mock). Login now!')),
    );
    context.go(AppRoute.login);
  }

  @override
  Widget build(BuildContext context) {
    final bool obscurePassword = ref.watch(registerPasswordVisibilityProvider);
    final bool obscureConfirm = ref.watch(
      registerConfirmPasswordVisibilityProvider,
    );

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
        title: const Text('Create account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              TextInputField(label: 'Full name', controller: _nameController),
              const SizedBox(height: 20),
              TextInputField(
                label: 'Email',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 20),
              TextInputField(
                label: 'Password',
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
                label: 'Confirm password',
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
                label: 'Create account',
                onPressed: () => _handleRegister(context),
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.center,
                child: TextButton(
                  onPressed: () => context.go(AppRoute.login),
                  child: const Text('Already have an account? Login'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
