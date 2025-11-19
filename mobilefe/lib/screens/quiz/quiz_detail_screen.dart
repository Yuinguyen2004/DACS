import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/data/mock_data.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';
import 'package:mobilefe/widgets/primary_button.dart';

class QuizDetailScreen extends StatelessWidget {
  const QuizDetailScreen({super.key, required this.quiz});

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

  void _startQuiz(BuildContext context) {
    final questions = mockQuizQuestions[quiz.id];
    if (questions == null || questions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No questions available yet.')),
      );
      return;
    }

    context.push(
      AppRoute.quizTaking,
      extra: QuizTakingPayload(quiz: quiz, questions: questions),
    );
  }

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    final ColorScheme colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Quiz details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.network(
                quiz.thumbnail,
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 24),
            Text(quiz.title, style: textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text('by ${quiz.author}', style: textTheme.bodyMedium),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                _InfoPill(
                  icon: LucideIcons.helpCircle,
                  label: '${quiz.questionCount} questions',
                ),
                _InfoPill(
                  icon: LucideIcons.clock3,
                  label: '${quiz.durationMinutes} min',
                ),
                _InfoPill(
                  icon: LucideIcons.sparkles,
                  label: _difficultyLabel(quiz.difficulty),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Text('Overview', style: textTheme.titleLarge),
            const SizedBox(height: 12),
            Text(quiz.description, style: textTheme.bodyLarge),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: <Widget>[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colorScheme.onPrimaryContainer.withValues(
                        alpha: 0.1,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(LucideIcons.target),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text('Ready?', style: textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Stay focused and complete the quiz without closing the app.',
                          style: textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              label: 'Start quiz',
              onPressed: () => _startQuiz(context),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x11000000),
            blurRadius: 12,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: <Widget>[
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Text(label, style: textTheme.bodyMedium),
        ],
      ),
    );
  }
}
