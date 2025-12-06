import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/services/subscription_service.dart';

class PremiumScreen extends ConsumerStatefulWidget {
  const PremiumScreen({super.key});

  @override
  ConsumerState<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends ConsumerState<PremiumScreen> {
  late StreamSubscription<String> _subscription;
  bool _isLoading = false;
  String _selectedPaymentMethod = 'zalopay'; // Default to ZaloPay

  @override
  void initState() {
    super.initState();
    final subscriptionService = ref.read(subscriptionServiceProvider);

    // Initialize IAP
    subscriptionService.initialize();

    _subscription = subscriptionService.purchaseStatusStream.listen((status) {
      if (!mounted) return;

      setState(() => _isLoading = status == 'pending');

      if (status == 'success') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Welcome to Premium! 🎉'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop(); // Go back to home
      } else if (status == 'error' || status == 'invalid') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Purchase failed. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
      } else if (status == 'no_products') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No products available. (Mock mode active?)'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }

  Future<void> _handlePurchase() async {
    setState(() => _isLoading = true);

    try {
      final subscriptionService = ref.read(subscriptionServiceProvider);

      if (_selectedPaymentMethod == 'zalopay') {
        await subscriptionService.buyPremiumWithZaloPay();
      } else {
        await subscriptionService.buyPremium();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildPaymentMethodOption(
    String value,
    String title,
    String subtitle,
  ) {
    final isSelected = _selectedPaymentMethod == value;

    return GestureDetector(
      onTap: () => setState(() => _selectedPaymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFFBBF24).withOpacity(0.2)
              : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFFBBF24)
                : Colors.white.withOpacity(0.1),
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_unchecked,
              color: isSelected ? const Color(0xFFFBBF24) : Colors.white60,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  const Color(0xFF1A1A2E),
                  AppTheme.primaryVibrant.withOpacity(0.3),
                ],
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Close Button
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    onPressed: () => context.pop(),
                    icon: const Icon(LucideIcons.x, color: Colors.white),
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Crown Icon
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFBBF24).withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.crown,
                            size: 64,
                            color: Color(0xFFFBBF24),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Title
                        Text(
                          'Unlock Premium',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Get unlimited access to all features',
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(color: Colors.white70),
                        ),
                        const SizedBox(height: 48),

                        // Features List
                        _buildFeatureItem(
                          context,
                          'Unlimited Quizzes',
                          'Take as many quizzes as you want',
                        ),
                        _buildFeatureItem(
                          context,
                          'Detailed Analytics',
                          'Track your progress with advanced charts',
                        ),
                        _buildFeatureItem(
                          context,
                          'Ad-Free Experience',
                          'Focus on learning without distractions',
                        ),
                        _buildFeatureItem(
                          context,
                          'Priority Support',
                          'Get help faster when you need it',
                        ),

                        const SizedBox(height: 48),

                        // Pricing Card
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: const Color(0xFFFBBF24).withOpacity(0.5),
                              width: 2,
                            ),
                          ),
                          child: Column(
                            children: [
                              Text(
                                'Monthly Plan',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(
                                      color: const Color(0xFFFBBF24),
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '100,000',
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineLarge
                                        ?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.only(
                                      bottom: 6,
                                      left: 4,
                                    ),
                                    child: Text(
                                      'VND',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                            color: Colors.white70,
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'per month',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(color: Colors.white54),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Payment Method Selection
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Payment Method',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildPaymentMethodOption(
                        'zalopay',
                        'ZaloPay',
                        'Fast and secure payment',
                      ),
                      const SizedBox(height: 8),
                      _buildPaymentMethodOption(
                        'google_pay',
                        'Google Play',
                        'In-app purchase (demo)',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Action Button
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handlePurchase,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFBBF24),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.black,
                              ),
                            )
                          : const Text(
                              'Get Premium Now',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(
    BuildContext context,
    String title,
    String subtitle,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              LucideIcons.check,
              color: Color(0xFFFBBF24),
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white54),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
