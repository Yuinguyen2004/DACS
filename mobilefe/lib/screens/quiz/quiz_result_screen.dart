import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';

class QuizResultScreen extends ConsumerWidget {
  const QuizResultScreen({super.key, required this.payload});

  final QuizResultPayload payload;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final int total = payload.questions.length;
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Quiz result')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            if (payload.isTimeOut) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Icon(
                      LucideIcons.alarmClock,
                      color: colorScheme.onErrorContainer,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Time's Up!",
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: colorScheme.onErrorContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            SizedBox(
              height: 180,
              width: 180,
              child: Stack(
                fit: StackFit.expand,
                children: <Widget>[
                  CircularProgressIndicator(
                    value: payload.score / 100,
                    strokeWidth: 12,
                  ),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        Text(
                          '${payload.score}',
                          style: Theme.of(context).textTheme.headlineLarge,
                        ),
                        const SizedBox(height: 4),
                        const Text('Score'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'You answered ${payload.correctCount} / $total correctly',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () {
                // Invalidate history so it refreshes when user views it
                ref.invalidate(quizHistoryProvider);
                context.go(AppRoute.dashboard);
              },
              child: const Text('Back to Home'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {
                context.push(
                  AppRoute.quizLeaderboard,
                  extra: QuizLeaderboardPayload(
                    quizId: payload.quiz.id,
                    quizTitle: payload.quiz.title,
                  ),
                );
              },
              icon: const Icon(LucideIcons.trophy),
              label: const Text('View Leaderboard'),
            ),
            const SizedBox(height: 24),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Answer review',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            const SizedBox(height: 12),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: total,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final question = payload.questions[index];
                final selected = payload.selectedAnswers[index];
                final bool isCorrect = selected == question.correctIndex;
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isCorrect ? Colors.green : Colors.red,
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Icon(
                            isCorrect
                                ? LucideIcons.badgeCheck
                                : LucideIcons.xCircle,
                            color: isCorrect ? Colors.green : Colors.red,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Question ${index + 1}',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(question.prompt),
                      const SizedBox(height: 8),
                      Text(
                        'Your answer: ${selected != null && selected >= 0 && selected < question.options.length ? question.options[selected] : 'No answer'}',
                      ),
                      Text(
                        'Correct answer: ${question.correctIndex >= 0 && question.correctIndex < question.options.length ? question.options[question.correctIndex] : 'N/A'}',
                      ),
                    ],
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
