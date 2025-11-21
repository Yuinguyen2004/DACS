import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/providers/app_providers.dart';

Future<void> startCreateQuizFlow(BuildContext context, WidgetRef ref) async {
  final user = ref.read(currentUserProvider);
  if (user.isPremium) {
    context.push(AppRoute.createQuizMethod);
    return;
  }

  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                CircleAvatar(
                  backgroundColor: Theme.of(
                    context,
                  ).colorScheme.primary.withValues(alpha: 0.1),
                  child: Icon(
                    LucideIcons.wand,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Upgrade to Premium to create unlimited quizzes with AI!',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text('Premium perks:'),
            const SizedBox(height: 8),
            const _BenefitRow(text: 'AI-powered quiz generation'),
            const _BenefitRow(text: 'Upload files as knowledge sources'),
            const _BenefitRow(text: 'Advanced analytics for quiz attempts'),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                context.push(AppRoute.premium);
              },
              icon: const Icon(LucideIcons.badgePlus),
              label: const Text('Upgrade now'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Maybe later'),
            ),
          ],
        ),
      );
    },
  );
}

class _BenefitRow extends StatelessWidget {
  const _BenefitRow({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: <Widget>[
          const Icon(LucideIcons.star, size: 16, color: Color(0xFF6366F1)),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
