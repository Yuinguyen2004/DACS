import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/models/quiz_leaderboard.dart';
import 'package:mobilefe/models/quiz_leaderboard_entry.dart';
import 'package:mobilefe/models/user_quiz_rank.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';

class QuizLeaderboardScreen extends ConsumerWidget {
  const QuizLeaderboardScreen({super.key, required this.payload});

  final QuizLeaderboardPayload payload;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(quizLeaderboardProvider(payload.quizId));
    final myRankAsync = ref.watch(myQuizRankProvider(payload.quizId));
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: leaderboardAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _ErrorState(
          message: 'Failed to load leaderboard',
          onRetry: () => ref.invalidate(quizLeaderboardProvider(payload.quizId)),
        ),
        data: (leaderboard) => _LeaderboardContent(
          leaderboard: leaderboard,
          quizTitle: payload.quizTitle,
          currentUserId: currentUser.id,
          myRank: myRankAsync.value,
        ),
      ),
    );
  }
}

class _LeaderboardContent extends StatelessWidget {
  const _LeaderboardContent({
    required this.leaderboard,
    required this.quizTitle,
    required this.currentUserId,
    this.myRank,
  });

  final QuizLeaderboard leaderboard;
  final String quizTitle;
  final String currentUserId;
  final UserQuizRank? myRank;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final entries = leaderboard.entries;

    if (entries.isEmpty) {
      return const _EmptyState();
    }

    // Check if current user is in top entries
    final isUserInList = entries.any((e) => e.userId == currentUserId);
    final top3 = entries.take(3).toList();
    final rest = entries.length > 3 ? entries.sublist(3) : <QuizLeaderboardEntry>[];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Center(
            child: Column(
              children: [
                Text(
                  quizTitle,
                  style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  '${leaderboard.totalParticipants} participants',
                  style: textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Podium for top 3
          if (top3.isNotEmpty)
            _Podium(entries: top3, currentUserId: currentUserId),

          // Show my rank card if not in list
          if (!isUserInList && myRank != null) ...[
            const SizedBox(height: 24),
            _MyRankCard(myRank: myRank!),
          ],

          // List for ranks 4+
          if (rest.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Rankings', style: textTheme.titleMedium),
            const SizedBox(height: 12),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: rest.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final entry = rest[index];
                return _LeaderboardTile(
                  entry: entry,
                  isCurrentUser: entry.userId == currentUserId,
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _Podium extends StatelessWidget {
  const _Podium({required this.entries, required this.currentUserId});

  final List<QuizLeaderboardEntry> entries;
  final String currentUserId;

  @override
  Widget build(BuildContext context) {
    // Arrange as: 2nd, 1st, 3rd
    final first = entries.isNotEmpty ? entries[0] : null;
    final second = entries.length > 1 ? entries[1] : null;
    final third = entries.length > 2 ? entries[2] : null;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.amber.shade100, Colors.orange.shade50],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // 2nd place
          if (second != null)
            _PodiumEntry(
              entry: second,
              isCurrentUser: second.userId == currentUserId,
              medalColor: const Color(0xFF9CA3AF), // Silver
              height: 96,
              avatarSize: 56,
            )
          else
            const SizedBox(width: 80),

          // 1st place
          if (first != null)
            _PodiumEntry(
              entry: first,
              isCurrentUser: first.userId == currentUserId,
              medalColor: const Color(0xFFF59E0B), // Gold
              height: 128,
              avatarSize: 72,
              showCrown: true,
            )
          else
            const SizedBox(width: 80),

          // 3rd place
          if (third != null)
            _PodiumEntry(
              entry: third,
              isCurrentUser: third.userId == currentUserId,
              medalColor: const Color(0xFFD97706), // Bronze
              height: 80,
              avatarSize: 48,
            )
          else
            const SizedBox(width: 80),
        ],
      ),
    );
  }
}

class _PodiumEntry extends StatelessWidget {
  const _PodiumEntry({
    required this.entry,
    required this.isCurrentUser,
    required this.medalColor,
    required this.height,
    required this.avatarSize,
    this.showCrown = false,
  });

  final QuizLeaderboardEntry entry;
  final bool isCurrentUser;
  final Color medalColor;
  final double height;
  final double avatarSize;
  final bool showCrown;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final initial = (entry.username ?? 'U')[0].toUpperCase();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Crown for 1st place
        if (showCrown)
          Icon(LucideIcons.crown, color: medalColor, size: 28)
        else
          const SizedBox(height: 28),

        const SizedBox(height: 4),

        // Avatar with medal border
        Stack(
          alignment: Alignment.bottomRight,
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isCurrentUser ? const Color(0xFF3B82F6) : medalColor,
                  width: 3,
                ),
              ),
              child: CircleAvatar(
                radius: avatarSize / 2,
                backgroundColor: medalColor.withValues(alpha: 0.2),
                child: Text(
                  initial,
                  style: textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: medalColor,
                  ),
                ),
              ),
            ),
            // Rank badge
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: medalColor,
                shape: BoxShape.circle,
              ),
              child: Text(
                '${entry.rank}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 8),

        // Username
        SizedBox(
          width: 80,
          child: Column(
            children: [
              Text(
                entry.username ?? 'User',
                style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (isCurrentUser)
                Container(
                  margin: const EdgeInsets.only(top: 2),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'You',
                    style: TextStyle(color: Colors.white, fontSize: 10),
                  ),
                ),
            ],
          ),
        ),

        const SizedBox(height: 4),

        // Score
        Text(
          '${entry.score} pts',
          style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),

        // Time
        Text(
          _formatTime(entry.timeSpent),
          style: textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
        ),
      ],
    );
  }
}

class _LeaderboardTile extends StatelessWidget {
  const _LeaderboardTile({
    required this.entry,
    required this.isCurrentUser,
  });

  final QuizLeaderboardEntry entry;
  final bool isCurrentUser;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final initial = (entry.username ?? 'U')[0].toUpperCase();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCurrentUser ? const Color(0xFFEFF6FF) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: isCurrentUser
            ? Border.all(color: const Color(0xFF3B82F6), width: 2)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Rank circle
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${entry.rank}',
                style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Avatar
          CircleAvatar(
            radius: 20,
            backgroundColor: const Color(0xFF6366F1).withValues(alpha: 0.1),
            child: Text(
              initial,
              style: textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF6366F1),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        entry.username ?? 'User',
                        style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isCurrentUser) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'You',
                          style: TextStyle(color: Colors.white, fontSize: 10),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  _formatTime(entry.timeSpent),
                  style: textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
                ),
              ],
            ),
          ),

          // Score
          Text(
            '${entry.score}',
            style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

class _MyRankCard extends StatelessWidget {
  const _MyRankCard({required this.myRank});

  final UserQuizRank myRank;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF3B82F6), width: 2),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.star, color: Color(0xFF3B82F6), size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your Rank',
                  style: textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                ),
                Text(
                  '#${myRank.rank} of ${myRank.totalParticipants}',
                  style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${myRank.score}',
                style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              Text(
                'points',
                style: textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.trophy, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No one has completed this quiz yet',
              style: textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Be the first!',
              style: textTheme.bodyMedium?.copyWith(color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.alertCircle, size: 64, color: Colors.red[400]),
            const SizedBox(height: 16),
            Text(
              message,
              style: textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(LucideIcons.refreshCw),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatTime(int? seconds) {
  if (seconds == null) return '-';
  final mins = seconds ~/ 60;
  final secs = seconds % 60;
  return '${mins}m ${secs.toString().padLeft(2, '0')}s';
}
