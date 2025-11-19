import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/models/quiz_model.dart';

class QuizCard extends StatelessWidget {
  const QuizCard({super.key, required this.quiz, this.onTap});

  final QuizModel quiz;
  final VoidCallback? onTap;

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

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 240,
        margin: const EdgeInsets.only(right: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
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
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(20),
              ),
              child: Image.network(
                quiz.thumbnail,
                height: 140,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
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
                      color: Colors.indigo.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${quiz.category} · ${_difficultyLabel(quiz.difficulty)}',
                      style: textTheme.bodySmall,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(quiz.title, style: textTheme.titleMedium),
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
    );
  }
}
