import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/models/quiz_question_model.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';

class QuizTakingScreen extends StatefulWidget {
  const QuizTakingScreen({super.key, required this.payload});

  final QuizTakingPayload payload;

  @override
  State<QuizTakingScreen> createState() => _QuizTakingScreenState();
}

class _QuizTakingScreenState extends State<QuizTakingScreen> {
  late final PageController _pageController;
  late final Timer _timer;
  late int _remainingSeconds;
  int _currentIndex = 0;
  bool _submitted = false;
  final Map<int, int> _selectedAnswers = <int, int>{};

  List<QuizQuestion> get _questions => widget.payload.questions;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.96);
    _remainingSeconds = widget.payload.quiz.durationMinutes * 60;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_remainingSeconds == 0) {
        _submit(auto: true);
      } else {
        setState(() => _remainingSeconds--);
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _selectAnswer(int questionIndex, int optionIndex) {
    HapticFeedback.selectionClick();
    setState(() {
      _selectedAnswers[questionIndex] = optionIndex;
    });
  }

  void _goTo(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _submit({bool auto = false}) {
    if (_submitted) return;
    _submitted = true;
    if (_timer.isActive) {
      _timer.cancel();
    }
    final int correctCount = _questions.asMap().entries.where((entry) {
      final selected = _selectedAnswers[entry.key];
      return selected != null && selected == entry.value.correctIndex;
    }).length;
    final int total = _questions.length;
    final double ratio = total == 0 ? 0 : correctCount / total;
    final int score = (ratio * 100).round();

    if (!mounted) return;
    if (auto) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Time is up! Showing your result.')),
      );
    }

    context.pushReplacement(
      AppRoute.quizResult,
      extra: QuizResultPayload(
        quiz: widget.payload.quiz,
        questions: _questions,
        selectedAnswers: Map<int, int>.from(_selectedAnswers),
        correctCount: correctCount,
        score: score,
      ),
    );
  }

  void _openQuestionSheet() {
    final int total = _questions.length;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return _QuestionMapSheet(
          total: total,
          currentIndex: _currentIndex,
          selectedAnswers: _selectedAnswers,
          onJumpTo: (index) {
            Navigator.of(context).pop();
            _goTo(index);
          },
        );
      },
    );
  }

  String _formatTime(int totalSeconds) {
    final int minutes = totalSeconds ~/ 60;
    final int seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final int total = _questions.length;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.payload.quiz.title),
        actions: <Widget>[
          TextButton(onPressed: () => _submit(), child: const Text('Submit')),
        ],
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: <Widget>[
                LinearProgressIndicator(value: (_currentIndex + 1) / total),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: <Widget>[
                    Text('Question ${_currentIndex + 1}/$total'),
                    Row(
                      children: <Widget>[
                        const Icon(LucideIcons.clock3, size: 16),
                        const SizedBox(width: 4),
                        Text(_formatTime(_remainingSeconds)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              physics: const BouncingScrollPhysics(),
              itemCount: total,
              onPageChanged: (value) => setState(() => _currentIndex = value),
              itemBuilder: (context, index) {
                final question = _questions[index];
                final selectedIndex = _selectedAnswers[index];
                return AnimatedBuilder(
                  animation: _pageController,
                  builder: (context, child) {
                    double scale = 1;
                    if (_pageController.hasClients &&
                        _pageController.position.haveDimensions) {
                      final double page =
                          _pageController.page ??
                          _pageController.initialPage.toDouble();
                      final double distance = (page - index).abs();
                      scale = (1 - distance * 0.08).clamp(0.9, 1.0);
                    }
                    return Transform.scale(scale: scale, child: child);
                  },
                  child: _QuestionCard(
                    question: question,
                    questionIndex: index,
                    selectedIndex: selectedIndex,
                    onSelect: (option) => _selectAnswer(index, option),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: <Widget>[
                Expanded(
                  child: FilledButton.tonal(
                    onPressed: _currentIndex == 0
                        ? null
                        : () => _goTo(_currentIndex - 1),
                    child: const Text('Previous'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _currentIndex == total - 1
                        ? () => _submit()
                        : () => _goTo(_currentIndex + 1),
                    child: Text(_currentIndex == total - 1 ? 'Submit' : 'Next'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openQuestionSheet,
        label: const Text('Question map'),
        icon: const Icon(LucideIcons.grid),
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
