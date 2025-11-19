import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/create_quiz/create_quiz_entry.dart';
import 'package:mobilefe/widgets/primary_button.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    final user = ref.watch(currentUserProvider);
    final bool premiumOnly = ref.watch(premiumQuizzesOnlyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            children: <Widget>[
              CircleAvatar(
                radius: 48,
                backgroundImage: NetworkImage(user.avatarUrl),
              ),
              const SizedBox(height: 16),
              Text(user.name, style: textTheme.titleLarge),
              Text(user.email, style: textTheme.bodySmall),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: <Widget>[
                  _StatTile(
                    label: 'Quizzes',
                    value: user.quizzesTaken.toString(),
                  ),
                  _StatTile(
                    label: 'Avg. score',
                    value: '${user.averageScore.toStringAsFixed(0)}%',
                  ),
                  _StatTile(label: 'Points', value: user.points.toString()),
                ],
              ),
              const SizedBox(height: 32),
              PrimaryButton(
                label: 'Create New Quiz',
                onPressed: () => startCreateQuizFlow(context, ref),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => context.push(AppRoute.premium),
                icon: const Icon(LucideIcons.badgePlus),
                label: const Text('Upgrade to Premium'),
              ),
              const SizedBox(height: 24),
              ListTile(
                leading: const Icon(LucideIcons.settings),
                title: const Text('Account settings'),
                trailing: const Icon(LucideIcons.chevronRight),
                onTap: () {},
              ),
              ListTile(
                leading: const Icon(LucideIcons.logOut),
                title: const Text('Logout'),
                onTap: () {},
              ),
              const SizedBox(height: 24),
              Align(
                alignment: Alignment.centerLeft,
                child: Text('Developer Mode', style: textTheme.titleMedium),
              ),
              const SizedBox(height: 8),
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: <Widget>[
                    SwitchListTile(
                      title: const Text('Simulate Premium User'),
                      subtitle: const Text(
                        'Toggle to instantly unlock creator and AI tools.',
                      ),
                      value: user.isPremium,
                      onChanged: (value) => ref
                          .read(currentUserProvider.notifier)
                          .setPremium(value),
                    ),
                    const Divider(height: 0),
                    SwitchListTile(
                      title: const Text('Show Premium Quizzes Only'),
                      subtitle: const Text(
                        'Filter Home recommendations to premium content.',
                      ),
                      value: premiumOnly,
                      onChanged: (value) => ref
                          .read(premiumQuizzesOnlyProvider.notifier)
                          .setValue(value),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Text(value, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
