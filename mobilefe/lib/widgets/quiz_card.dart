import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/providers/app_providers.dart';

class QuizCard extends ConsumerWidget {
  const QuizCard({super.key, required this.quiz});

  final QuizModel quiz;

  String _difficultyLabel(QuizDifficulty difficulty) {
    switch (difficulty) {
      case QuizDifficulty.beginner:
        return 'Beginner';
      case QuizDifficulty.intermediate:
        return 'Intermediate';
      case QuizDifficulty.advanced:
        return 'Advanced';
    }
  }

  Color _borderColor(BuildContext context) {
    if (!quiz.isPremiumContent) return Colors.transparent;
    return Colors.amber.withValues(alpha: 0.6);
  }

  Widget _buildBadge(TextTheme textTheme) {
    final bool premium = quiz.isPremiumContent;
    final Color badgeColor = premium ? Colors.amber.shade600 : Colors.green.shade600;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: badgeColor,
        borderRadius: BorderRadius.circular(999),
        boxShadow: const <BoxShadow>[
          BoxShadow(color: Color(0x22000000), blurRadius: 6, offset: Offset(0, 3)),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(
            premium ? LucideIcons.crown : LucideIcons.badgeCheck,
            size: 14,
            color: Colors.white,
          ),
          const SizedBox(width: 6),
          Text(
            premium ? 'Premium' : 'FREE',
            style: textTheme.labelSmall?.copyWith(color: Colors.white, letterSpacing: 0.4),
          ),
        ],
      ),
    );
  }

  Future<void> _handleTap(BuildContext context, WidgetRef ref) async {
    final user = ref.read(currentUserProvider);
    final bool locked = quiz.isPremiumContent && !user.isPremium;
    if (locked) {
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Premium quiz'),
          content: const Text(
            'Nâng cấp tài khoản để mở khóa bài quiz Premium này và toàn bộ thư viện cao cấp.',
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Để sau'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.push(AppRoute.premium);
              },
              child: const Text('Nâng cấp'),
            ),
          ],
        ),
      );
      return;
    }

    context.push(AppRoute.quizDetail, extra: quiz);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Container(
      width: 240,
      margin: const EdgeInsets.only(right: 16),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        elevation: 0,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: () => _handleTap(context, ref),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: _borderColor(context), width: 1.5),
              boxShadow: const <BoxShadow>[
                BoxShadow(
                  color: Color(0x11212528),
                  blurRadius: 24,
                  offset: Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Stack(
                  children: <Widget>[
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(24),
                      ),
                      child: Image.network(
                        quiz.thumbnail,
                        height: 140,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: _buildBadge(textTheme),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.indigo.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${quiz.category} · ${_difficultyLabel(quiz.difficulty)}',
                          style: textTheme.bodySmall,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        quiz.title,
                        style: textTheme.titleMedium,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text('by ${quiz.author}', style: textTheme.bodySmall),
                      const SizedBox(height: 12),
                      Row(
                        children: <Widget>[
                          const Icon(LucideIcons.helpCircle, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            '${quiz.questionCount} Qs',
                            style: textTheme.bodySmall,
                          ),
                          const SizedBox(width: 16),
                          const Icon(LucideIcons.clock3, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            '${quiz.durationMinutes} min',
                            style: textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
