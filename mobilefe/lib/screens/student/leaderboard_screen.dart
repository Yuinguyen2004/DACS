import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/data/mock_data.dart';

class LeaderboardScreen extends StatelessWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFE0E7FF),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: <Widget>[
                  Text('Weekly champions', style: textTheme.titleLarge),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: leaderboardEntries.take(3).map((entry) {
                      return Column(
                        children: <Widget>[
                          CircleAvatar(
                            radius: entry.rank == 1 ? 34 : 28,
                            foregroundImage: NetworkImage(entry.avatarUrl),
                            onForegroundImageError: (exception, stackTrace) {
                              // Silently handle image load errors
                            },
                            child: Icon(
                              LucideIcons.user,
                              size: entry.rank == 1 ? 34 : 28,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            entry.name,
                            style: textTheme.bodyMedium,
                            textAlign: TextAlign.center,
                          ),
                          Text(
                            '#${entry.rank} · ${entry.score} pts',
                            style: textTheme.bodySmall,
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.separated(
                itemCount: leaderboardEntries.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final entry = leaderboardEntries[index];
                  return ListTile(
                    tileColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    leading: CircleAvatar(child: Text(entry.rank.toString())),
                    title: Text(entry.name),
                    subtitle: Text('${entry.score} pts'),
                    trailing: const Icon(LucideIcons.chevronRight),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
