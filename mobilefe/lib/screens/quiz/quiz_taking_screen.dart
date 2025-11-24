import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/models/quiz_question_model.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobilefe/providers/app_providers.dart';

class QuizTakingScreen extends ConsumerStatefulWidget {
  const QuizTakingScreen({super.key, required this.payload});

  final QuizTakingPayload payload;

  @override
  ConsumerState<QuizTakingScreen> createState() => _QuizTakingScreenState();
}

class _QuizTakingScreenState extends ConsumerState<QuizTakingScreen> {
  late PageController _pageController;
  int _currentIndex = 0;
  final Map<int, int> _selectedAnswers = <int, int>{};
  late Timer _timer;
  late int _remainingSeconds;
  bool _isSubmitting = false;
  Timer? _autosaveDebounce;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _remainingSeconds = widget.payload.remainingSeconds;
    _selectedAnswers.addAll(widget.payload.initialAnswers);
    _startTimer();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _timer.cancel();
    _autosaveDebounce?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (Timer timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
        // Heartbeat every minute could be added here if needed
      } else {
        _timer.cancel();
        _submitQuiz(timeUp: true);
      }
    });
  }

  String _formatTime(int seconds) {
    final int minutes = seconds ~/ 60;
    final int remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  void _onAnswerSelected(int questionIndex, int answerIndex) {
    setState(() {
      _selectedAnswers[questionIndex] = answerIndex;
    });
    _autosave();
  }

  void _autosave() {
    if (_autosaveDebounce?.isActive ?? false) _autosaveDebounce!.cancel();
    _autosaveDebounce = Timer(const Duration(seconds: 2), () {
      _performAutosave();
    });
  }

  Future<void> _performAutosave() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final List<Map<String, dynamic>> answers = [];
      _selectedAnswers.forEach((qIndex, aIndex) {
        final question = widget.payload.questions[qIndex];
        if (aIndex < question.answerIds.length) {
          answers.add({
            'question_id': question.id,
            'selected_answer_id': question.answerIds[aIndex],
            'client_seq': DateTime.now().millisecondsSinceEpoch,
          });
        }
      });

      if (answers.isNotEmpty) {
        await apiService.saveAnswers(widget.payload.attemptId, answers);
      }
    } catch (e) {
      debugPrint('Autosave error: $e');
    }
  }

  Future<void> _submitQuiz({bool timeUp = false}) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      
      // Prepare answers
      final List<Map<String, dynamic>> answers = [];
      _selectedAnswers.forEach((qIndex, aIndex) {
        final question = widget.payload.questions[qIndex];
        if (aIndex < question.answerIds.length) {
          answers.add({
            'question_id': question.id,
            'selected_answer_id': question.answerIds[aIndex],
          });
        }
      });

      final result = await apiService.submitTest(widget.payload.attemptId, answers);

      if (!mounted) return;

      // Fetch attempt details to get correct answers
      final attemptDetails = await apiService.getAttemptDetails(widget.payload.attemptId);
      
      // Update questions with correct answer information
      final updatedQuestions = widget.payload.questions.map((question) {
        // Find this question's answer in attempt details
        final questionAnswer = (attemptDetails['answers'] as List).firstWhere(
          (a) => a['question']['_id'] == question.id,
          orElse: () => null,
        );
        
        if (questionAnswer != null && questionAnswer['correct_answer'] != null) {
          final correctAnswerId = questionAnswer['correct_answer']['_id'];
          final correctIndex = question.answerIds.indexOf(correctAnswerId);
          
          return QuizQuestion(
            id: question.id,
            prompt: question.prompt,
            options: question.options,
            answerIds: question.answerIds,
            correctIndex: correctIndex >= 0 ? correctIndex : -1,
            imageUrl: question.imageUrl,
          );
        }
        
        return question;
      }).toList();

      if (!mounted) return;

      context.pushReplacement(
        AppRoute.quizResult,
        extra: QuizResultPayload(
          quiz: widget.payload.quiz,
          questions: updatedQuestions, // Use updated questions with correct answers
          selectedAnswers: _selectedAnswers,
          correctCount: result['correct_answers'] ?? 0,
          score: result['score'] ?? 0,
          attemptId: widget.payload.attemptId,
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error submitting quiz: $e')),
        );
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _nextPage() {
    if (_currentIndex < widget.payload.questions.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() {
        _currentIndex++;
      });
    }
  }

  void _previousPage() {
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() {
        _currentIndex--;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    final ColorScheme colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Row(
          children: <Widget>[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: <Widget>[
                  Icon(
                    LucideIcons.clock,
                    size: 16,
                    color: colorScheme.onErrorContainer,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatTime(_remainingSeconds),
                    style: textTheme.labelMedium?.copyWith(
                      color: colorScheme.onErrorContainer,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: _isSubmitting ? null : () => _submitQuiz(),
              child: _isSubmitting 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Submit'),
            ),
          ],
        ),
      ),
      body: Column(
        children: <Widget>[
          LinearProgressIndicator(
            value: (_currentIndex + 1) / widget.payload.questions.length,
            backgroundColor: colorScheme.surfaceContainerHighest,
          ),
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: widget.payload.questions.length,
              itemBuilder: (BuildContext context, int index) {
                final QuizQuestion question = widget.payload.questions[index];
                return SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'Question ${index + 1}/${widget.payload.questions.length}',
                        style: textTheme.labelLarge?.copyWith(
                          color: colorScheme.secondary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(question.prompt, style: textTheme.headlineSmall),
                      if (question.imageUrl != null) ...[
                        const SizedBox(height: 16),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.network(
                            question.imageUrl!,
                            height: 200,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ],
                      const SizedBox(height: 32),
                      ...List<Widget>.generate(question.options.length, (
                        int optionIndex,
                      ) {
                        final bool isSelected =
                            _selectedAnswers[index] == optionIndex;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            onTap: () => _onAnswerSelected(index, optionIndex),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color:
                                      isSelected
                                          ? colorScheme.primary
                                          : colorScheme.outline,
                                  width: isSelected ? 2 : 1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                                color:
                                    isSelected
                                        ? colorScheme.primaryContainer
                                        : null,
                              ),
                              child: Row(
                                children: <Widget>[
                                  Container(
                                    width: 24,
                                    height: 24,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color:
                                            isSelected
                                                ? colorScheme.primary
                                                : colorScheme.outline,
                                        width: 2,
                                      ),
                                      color:
                                          isSelected
                                              ? colorScheme.primary
                                              : null,
                                    ),
                                    child:
                                        isSelected
                                            ? Icon(
                                              Icons.check,
                                              size: 16,
                                              color: colorScheme.onPrimary,
                                            )
                                            : null,
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Text(
                                      question.options[optionIndex],
                                      style: textTheme.bodyLarge?.copyWith(
                                        color:
                                            isSelected
                                                ? colorScheme
                                                    .onPrimaryContainer
                                                : null,
                                        fontWeight:
                                            isSelected ? FontWeight.bold : null,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                TextButton.icon(
                  onPressed: _currentIndex > 0 ? _previousPage : null,
                  icon: const Icon(LucideIcons.arrowLeft),
                  label: const Text('Previous'),
                ),
                TextButton.icon(
                  onPressed:
                      _currentIndex < widget.payload.questions.length - 1
                          ? _nextPage
                          : null,
                  icon: const Icon(LucideIcons.arrowRight),
                  label: const Text('Next'),
                  iconAlignment: IconAlignment.end,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.question,
    required this.questionIndex,
    required this.selectedIndex,
    required this.onSelect,
  });

  final QuizQuestion question;
  final int questionIndex;
  final int? selectedIndex;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        transitionBuilder: (child, animation) {
          final offsetAnimation = Tween<Offset>(
            begin: const Offset(0.1, 0),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut));
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(position: offsetAnimation, child: child),
          );
        },
        child: Column(
          key: ValueKey(question.id),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Question ${questionIndex + 1}', style: textTheme.titleSmall),
            const SizedBox(height: 8),
            Text(question.prompt, style: textTheme.titleLarge),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.separated(
                itemCount: question.options.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, optionIndex) {
                  final String option = question.options[optionIndex];
                  final bool isSelected = selectedIndex == optionIndex;
                  final ColorScheme colorScheme = Theme.of(context).colorScheme;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeOut,
                    child: ListTile(
                      onTap: () => onSelect(optionIndex),
                      tileColor: isSelected
                          ? colorScheme.primaryContainer
                          : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isSelected
                              ? colorScheme.primary
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                      title: Text(option),
                      trailing: isSelected
                          ? const Icon(LucideIcons.check)
                          : null,
                    ),
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

class _QuestionMapSheet extends StatelessWidget {
  const _QuestionMapSheet({
    required this.total,
    required this.currentIndex,
    required this.selectedAnswers,
    required this.onJumpTo,
  });

  final int total;
  final int currentIndex;
  final Map<int, int> selectedAnswers;
  final ValueChanged<int> onJumpTo;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colorScheme = Theme.of(context).colorScheme;
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.5,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('Question map', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Row(
            children: <Widget>[
              _LegendDot(color: colorScheme.primary, label: 'Current'),
              const SizedBox(width: 12),
              _LegendDot(color: Colors.green, label: 'Answered'),
              const SizedBox(width: 12),
              _LegendDot(color: Colors.grey, label: 'Pending'),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1,
              ),
              itemCount: total,
              itemBuilder: (context, index) {
                final bool answered = selectedAnswers.containsKey(index);
                final bool isCurrent = index == currentIndex;
                Color bgColor = Colors.white;
                Color borderColor = const Color(0xFFE2E8F0);
                if (isCurrent) {
                  bgColor = colorScheme.primary.withValues(alpha: 0.15);
                  borderColor = colorScheme.primary;
                } else if (answered) {
                  bgColor = Colors.green.withValues(alpha: 0.12);
                  borderColor = Colors.green;
                }
                return InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => onJumpTo(index),
                  child: Container(
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: isCurrent ? colorScheme.primary : null,
                            ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Container(
          height: 12,
          width: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(999),
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
