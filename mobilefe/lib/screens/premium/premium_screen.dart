import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/widgets/primary_button.dart';

class PremiumScreen extends StatelessWidget {
  const PremiumScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final List<_PlanCardData> plans = <_PlanCardData>[
      _PlanCardData(
        title: 'Monthly',
        price: '\$7.99',
        description: 'Cancel anytime',
        perks: const <String>[
          'Unlimited quiz creation',
          'AI assistant with 30 prompts/day',
          'Priority support channel',
        ],
      ),
      _PlanCardData(
        title: 'Yearly',
        price: '\$79.99',
        description: '2 months free',
        perks: const <String>[
          'Unlimited quiz creation',
          'AI assistant with 100 prompts/day',
          'Advanced analytics',
        ],
        highlight: true,
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Upgrade to Premium')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Unlock pro tools for educators',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Generate quizzes with AI, manage media-rich questions, and monitor learner performance in real time.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.separated(
                itemCount: plans.length,
                separatorBuilder: (_, __) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  final plan = plans[index];
                  return _PlanCard(plan: plan);
                },
              ),
            ),
            PrimaryButton(
              label: 'Start free trial',
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Mock payment flow coming soon.'),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanCardData {
  const _PlanCardData({
    required this.title,
    required this.price,
    required this.description,
    required this.perks,
    this.highlight = false,
  });

  final String title;
  final String price;
  final String description;
  final List<String> perks;
  final bool highlight;
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan});

  final _PlanCardData plan;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colorScheme = Theme.of(context).colorScheme;
    final Color borderColor = plan.highlight
        ? colorScheme.primary
        : const Color(0xFFE2E8F0);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor, width: 1.4),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x11000000),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Text(plan.title, style: Theme.of(context).textTheme.titleLarge),
              const Spacer(),
              if (plan.highlight)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: colorScheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'Best value',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: colorScheme.primary,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            plan.price,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          Text(plan.description),
          const SizedBox(height: 16),
          ...plan.perks.map(
            (perk) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: <Widget>[
                  const Icon(
                    LucideIcons.check,
                    size: 16,
                    color: Color(0xFF10B981),
                  ),
                  const SizedBox(width: 8),
                  Expanded(child: Text(perk)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
