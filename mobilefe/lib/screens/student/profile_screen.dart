import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/data/mock_data.dart';
import 'package:mobilefe/widgets/primary_button.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: <Widget>[
            CircleAvatar(
              radius: 48,
              backgroundImage: NetworkImage(mockUser.avatarUrl),
            ),
            const SizedBox(height: 16),
            Text(mockUser.name, style: textTheme.titleLarge),
            Text(mockUser.email, style: textTheme.bodySmall),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: <Widget>[
                _StatTile(
                  label: 'Quizzes',
                  value: mockUser.quizzesTaken.toString(),
                ),
                _StatTile(
                  label: 'Avg. score',
                  value: '${mockUser.averageScore.toStringAsFixed(0)}%',
                ),
                _StatTile(label: 'Points', value: mockUser.points.toString()),
              ],
            ),
            const SizedBox(height: 32),
            PrimaryButton(
              label: 'Upgrade to Premium',
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Premium mock flow coming soon.'),
                  ),
                );
              },
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
          ],
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
