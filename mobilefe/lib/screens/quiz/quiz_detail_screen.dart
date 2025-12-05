import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/data/mock_data.dart';
import 'package:mobilefe/data/api_service.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';
import 'package:mobilefe/widgets/primary_button.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/models/quiz_question_model.dart';
class QuizDetailScreen extends ConsumerStatefulWidget {
  const QuizDetailScreen({super.key, required this.quiz});

  final QuizModel quiz;

  @override
  ConsumerState<QuizDetailScreen> createState() => _QuizDetailScreenState();
}

class _QuizDetailScreenState extends ConsumerState<QuizDetailScreen> {
  bool _isLoading = false;
  Map<String, dynamic>? _activeAttempt;

  @override
  void initState() {
    super.initState();
    _checkActiveAttempt();
  }

  Future<void> _checkActiveAttempt() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final attempt = await apiService.getActiveAttempt(widget.quiz.id);
      if (mounted) {
        setState(() {
          _activeAttempt = attempt;
        });
      }
    } catch (e) {
      // Ignore errors here, just assume no active attempt
      debugPrint('Error checking active attempt: $e');
    }
  }

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

  Future<void> _startQuiz(BuildContext context) async {
    setState(() => _isLoading = true);
    try {
      final apiService = ref.read(apiServiceProvider);
      Map<String, dynamic> attemptData;

      if (_activeAttempt != null) {
        // Resume
        attemptData = _activeAttempt!;
      } else {
        // Start new
        attemptData = await apiService.startTest(widget.quiz.id);
      }

      if (!mounted) return;

      // Parse questions
      final List<dynamic> questionsJson = attemptData['questions'];
      final questions = questionsJson.map((q) {
        final List<dynamic> answersJson = q['answers'];
        
        // Build full image URL if it's a relative path
        // Keep as-is if it's already a full URL (http/https) or a data URL (base64)
        String? imageUrl;
        if (q['image'] != null && q['image'].toString().isNotEmpty) {
          final img = q['image'].toString();
          if (img.startsWith('http') || img.startsWith('data:')) {
            imageUrl = img;
          } else {
            imageUrl = '${ApiService.baseUrl}$img';
          }
        }

        return QuizQuestion(
          id: q['_id'],
          prompt: q['content'],
          options: answersJson.map((a) => a['content'] as String).toList(),
          answerIds: answersJson.map((a) => a['_id'] as String).toList(),
          correctIndex: -1, // Not provided during test to prevent cheating
          imageUrl: imageUrl,
        );
      }).toList();

      // Parse draft answers if resuming
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

      context.push(
        AppRoute.quizTaking,
        extra: QuizTakingPayload(
          quiz: widget.quiz,
          questions: questions,
          attemptId: attemptData['attempt_id'],
          remainingSeconds: attemptData['remainingSeconds'] ?? (widget.quiz.durationMinutes * 60),
          initialAnswers: initialAnswers,
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error starting quiz: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
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
                widget.quiz.thumbnail,
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 200,
                  color: Colors.grey[300],
                  child: const Center(child: Icon(LucideIcons.image, size: 48, color: Colors.grey)),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(widget.quiz.title, style: textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text('by ${widget.quiz.author}', style: textTheme.bodyMedium),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                _InfoPill(
                  icon: LucideIcons.helpCircle,
                  label: '${widget.quiz.questionCount} questions',
                ),
                _InfoPill(
                  icon: LucideIcons.clock3,
                  label: '${widget.quiz.durationMinutes} min',
                ),
                _InfoPill(
                  icon: LucideIcons.sparkles,
                  label: _difficultyLabel(widget.quiz.difficulty),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Text('Overview', style: textTheme.titleLarge),
            const SizedBox(height: 12),
            Text(widget.quiz.description, style: textTheme.bodyLarge),
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
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  context.push(
                    AppRoute.quizLeaderboard,
                    extra: QuizLeaderboardPayload(
                      quizId: widget.quiz.id,
                      quizTitle: widget.quiz.title,
                    ),
                  );
                },
                icon: const Icon(LucideIcons.trophy),
                label: const Text('View Leaderboard'),
              ),
            ),
            const SizedBox(height: 12),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else
              PrimaryButton(
                label: _activeAttempt != null ? 'Resume Quiz' : 'Start Quiz',
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
