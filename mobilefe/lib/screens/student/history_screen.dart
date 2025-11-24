
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/quiz_question_model.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  late Future<List<Map<String, dynamic>>> _historyFuture;

  @override
  void initState() {
    super.initState();
    _refreshHistory();
  }

  void _refreshHistory() {
    setState(() {
      _historyFuture = ref.read(apiServiceProvider).getTestHistory();
    });
  }

  Future<void> _resumeQuiz(String quizId) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      
      final attemptData = await apiService.getActiveAttempt(quizId);
      if (attemptData == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not find active attempt to resume.')),
          );
          _refreshHistory();
        }
        return;
      }

      if (!mounted) return;

      final List<dynamic> questionsJson = attemptData['questions'];
      final questions = questionsJson.map((q) {
        final List<dynamic> answersJson = q['answers'];
        return QuizQuestion(
          id: q['_id'],
          prompt: q['content'],
          options: answersJson.map((a) => a['content'] as String).toList(),
          answerIds: answersJson.map((a) => a['_id'] as String).toList(),
          correctIndex: -1,
          imageUrl: q['image'],
        );
      }).toList();

      final Map<int, int> initialAnswers = {};
      if (attemptData['draft_answers'] != null) {
        final List<dynamic> drafts = attemptData['draft_answers'];
        for (var draft in drafts) {
          final qId = draft['question_id'];
          final aId = draft['selected_answer_id'];
          
          final qIndex = questions.indexWhere((q) => q.id == qId);
          if (qIndex != -1) {
            final aIndex = questions[qIndex].answerIds.indexOf(aId);
            if (aIndex != -1) {
              initialAnswers[qIndex] = aIndex;
            }
          }
        }
      }

      final quizData = attemptData['quiz'];
      final quiz = QuizModel(
        id: quizData['_id'],
        title: quizData['title'],
        description: quizData['description'] ?? '',
        author: 'Unknown',
        category: 'General',
        difficulty: QuizDifficulty.intermediate,
        questionCount: questions.length,
        durationMinutes: quizData['time_limit'] ?? 30,
        thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
      );

      context.push(
        AppRoute.quizTaking,
        extra: QuizTakingPayload(
          quiz: quiz,
          questions: questions,
          attemptId: attemptData['attempt_id'],
          remainingSeconds: attemptData['remainingSeconds'] ?? (quiz.durationMinutes * 60),
          initialAnswers: initialAnswers,
        ),
      ).then((_) => _refreshHistory());

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error resuming quiz: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    final ColorScheme colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('History')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _historyFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.alertCircle, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error loading history: ${snapshot.error}'),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _refreshHistory,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final history = snapshot.data ?? [];

          if (history.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Icon(
                    LucideIcons.history,
                    size: 64,
                    color: colorScheme.outline.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No quiz history yet',
                    style: textTheme.titleMedium?.copyWith(
                      color: colorScheme.outline,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: history.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final item = history[index];
              final quiz = item['quiz_id'];
              final status = item['status'];
              final score = item['score'];
              final date = DateTime.parse(item['started_at']);
              final isInProgress = status == 'in_progress';

              return Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: colorScheme.outlineVariant),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: <Widget>[
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: isInProgress 
                                ? colorScheme.primaryContainer 
                                : (score != null && score >= 80 
                                    ? Colors.green.withOpacity(0.1) 
                                    : colorScheme.surfaceContainerHighest),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              isInProgress ? LucideIcons.play : LucideIcons.trophy,
                              color: isInProgress 
                                ? colorScheme.primary 
                                : (score != null && score >= 80 ? Colors.green : colorScheme.onSurfaceVariant),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Text(
                                  quiz != null ? quiz['title'] : 'Unknown Quiz',
                                  style: textTheme.titleMedium,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${date.day}/${date.month}/${date.year}',
                                  style: textTheme.bodySmall?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: <Widget>[
                              if (isInProgress)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: colorScheme.primaryContainer,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'In Progress',
                                    style: textTheme.labelSmall?.copyWith(
                                      color: colorScheme.onPrimaryContainer,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                )
                              else
                                Text(
                                  score != null ? '$score%' : '-',
                                  style: textTheme.titleLarge?.copyWith(
                                    color: score != null && score >= 80 ? Colors.green : null,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      if (isInProgress) ...[
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () => _resumeQuiz(quiz['_id']),
                            icon: const Icon(LucideIcons.play, size: 16),
                            label: const Text('Resume Quiz'),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.passed});

  final bool passed;

  @override
  Widget build(BuildContext context) {
    final Color background = passed
        ? Colors.green.withOpacity(0.15)
        : Colors.red.withOpacity(0.15);
    final Color textColor = passed ? Colors.green : Colors.red;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        passed ? 'Passed' : 'Failed',
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

