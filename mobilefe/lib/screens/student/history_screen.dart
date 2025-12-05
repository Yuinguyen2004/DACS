import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/l10n/app_localizations.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/quiz_question_model.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/quiz/quiz_flow_models.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen>
    with TickerProviderStateMixin {
  late AnimationController _staggerController;
  late AnimationController _emptyStateController;

  @override
  void initState() {
    super.initState();
    _staggerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _emptyStateController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.invalidate(quizHistoryProvider);
      _staggerController.forward();
    });
  }

  @override
  void dispose() {
    _staggerController.dispose();
    _emptyStateController.dispose();
    super.dispose();
  }

  void _refreshHistory() {
    _staggerController.reset();
    ref.invalidate(quizHistoryProvider);
    _staggerController.forward();
  }

  String _getRelativeTime(DateTime date, AppLocalizations l10n) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);
    final difference = today.difference(dateOnly).inDays;

    if (difference == 0) return l10n.today;
    if (difference == 1) return l10n.yesterday;
    if (difference < 7) return '$difference ${l10n.daysAgo}';
    return '${date.day}/${date.month}/${date.year}';
  }

  Color _getScoreColor(int? score) {
    if (score == null) return AppTheme.textMuted;
    if (score >= 90) return const Color(0xFF10B981); // Emerald
    if (score >= 70) return const Color(0xFF3B82F6); // Blue
    if (score >= 50) return const Color(0xFFF59E0B); // Amber
    return const Color(0xFFEF4444); // Red
  }

  LinearGradient _getScoreGradient(int? score) {
    if (score == null) {
      return LinearGradient(
        colors: [AppTheme.textMuted.withOpacity(0.3), AppTheme.textMuted.withOpacity(0.1)],
      );
    }
    if (score >= 90) {
      return const LinearGradient(
        colors: [Color(0xFF10B981), Color(0xFF34D399)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }
    if (score >= 70) {
      return const LinearGradient(
        colors: [Color(0xFF3B82F6), Color(0xFF60A5FA)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }
    if (score >= 50) {
      return const LinearGradient(
        colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }
    return const LinearGradient(
      colors: [Color(0xFFEF4444), Color(0xFFF87171)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
  }

  String _getPerformanceLabel(int? score, AppLocalizations l10n) {
    if (score == null) return '';
    if (score >= 90) return l10n.excellent;
    if (score >= 70) return l10n.good;
    if (score >= 50) return l10n.fair;
    return l10n.needsImprovement;
  }

  IconData _getPerformanceIcon(int? score) {
    if (score == null) return LucideIcons.minus;
    if (score >= 90) return LucideIcons.trophy;
    if (score >= 70) return LucideIcons.medal;
    if (score >= 50) return LucideIcons.star;
    return LucideIcons.target;
  }

  Future<void> _resumeQuiz(String quizId) async {
    try {
      final apiService = ref.read(apiServiceProvider);

      final attemptData = await apiService.getActiveAttempt(quizId);
      if (attemptData == null) {
        if (mounted) {
          final l10n = AppLocalizations.of(context);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(l10n.error)));
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
        thumbnail:
            'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000',
      );

      context
          .push(
            AppRoute.quizTaking,
            extra: QuizTakingPayload(
              quiz: quiz,
              questions: questions,
              attemptId: attemptData['attempt_id'],
              remainingSeconds:
                  attemptData['remainingSeconds'] ??
                  (quiz.durationMinutes * 60),
              initialAnswers: initialAnswers,
            ),
          )
          .then((_) => _refreshHistory());
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error resuming quiz: $e')));
      }
    }
  }

  Future<void> _clearHistory() async {
    final l10n = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.trash2, color: Colors.red, size: 20),
            ),
            const SizedBox(width: 12),
            Text(l10n.clearHistory),
          ],
        ),
        content: Text(
          l10n.clearHistoryConfirm,
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(l10n.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(l10n.delete),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final apiService = ref.read(apiServiceProvider);
      final result = await apiService.clearTestHistory();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(LucideIcons.checkCircle, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Text(result['message'] ?? 'History cleared'),
              ],
            ),
            backgroundColor: AppTheme.accentBright,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.all(16),
          ),
        );
        _refreshHistory();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error clearing history: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final historyAsync = ref.watch(quizHistoryProvider);

    return Scaffold(
      backgroundColor: AppTheme.surfaceSoft,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // Custom App Bar
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: AppTheme.surfaceSoft,
            surfaceTintColor: Colors.transparent,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
              title: Text(
                l10n.history,
                style: const TextStyle(
                  fontFamily: 'Poppins',
                  fontWeight: FontWeight.w700,
                  fontSize: 24,
                  color: AppTheme.textPrimary,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppTheme.primaryVibrant.withOpacity(0.05),
                      AppTheme.surfaceSoft,
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              historyAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (history) {
                  final hasCompletedItems = history.any(
                    (item) => item['status'] != 'in_progress',
                  );
                  if (!hasCompletedItems) return const SizedBox.shrink();

                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: IconButton(
                      onPressed: _clearHistory,
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.red.withOpacity(0.1),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      icon: const Icon(
                        LucideIcons.trash2,
                        color: Colors.red,
                        size: 20,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),

          // Content
          historyAsync.when(
            loading: () => SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryVibrant.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const SizedBox(
                        width: 32,
                        height: 32,
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                          valueColor: AlwaysStoppedAnimation(AppTheme.primaryVibrant),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      l10n.loading,
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            error: (error, stack) => SliverFillRemaining(
              child: _buildErrorState(l10n, error.toString()),
            ),
            data: (history) {
              if (history.isEmpty) {
                return SliverFillRemaining(
                  child: _buildEmptyState(l10n),
                );
              }

              // Calculate stats
              final completedItems = history.where((h) => h['status'] != 'in_progress').toList();
              final averageScore = completedItems.isNotEmpty
                  ? completedItems
                      .map((h) => (h['score'] as num?)?.toDouble() ?? 0.0)
                      .reduce((a, b) => a + b) / completedItems.length
                  : 0.0;

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index == 0) {
                        // Stats Header
                        return _buildStatsHeader(
                          l10n,
                          history.length,
                          averageScore,
                          completedItems.length,
                        );
                      }

                      final itemIndex = index - 1;
                      final item = history[itemIndex];

                      return AnimatedBuilder(
                        animation: _staggerController,
                        builder: (context, child) {
                          final delay = (itemIndex * 0.1).clamp(0.0, 0.5);
                          final start = delay;
                          final end = (delay + 0.5).clamp(0.0, 1.0);

                          final animation = CurvedAnimation(
                            parent: _staggerController,
                            curve: Interval(start, end, curve: Curves.easeOutCubic),
                          );

                          return Transform.translate(
                            offset: Offset(0, 30 * (1 - animation.value)),
                            child: Opacity(
                              opacity: animation.value,
                              child: _buildHistoryCard(item, l10n, itemIndex),
                            ),
                          );
                        },
                      );
                    },
                    childCount: history.length + 1,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStatsHeader(
    AppLocalizations l10n,
    int totalAttempts,
    double averageScore,
    int completedCount,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryVibrant.withOpacity(0.1),
            AppTheme.secondaryVibrant.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppTheme.primaryVibrant.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStatItem(
              icon: LucideIcons.clipboardList,
              value: totalAttempts.toString(),
              label: l10n.totalAttempts,
              color: AppTheme.primaryVibrant,
            ),
          ),
          Container(
            width: 1,
            height: 40,
            color: AppTheme.textMuted.withOpacity(0.2),
          ),
          Expanded(
            child: _buildStatItem(
              icon: LucideIcons.target,
              value: '${averageScore.toStringAsFixed(0)}%',
              label: l10n.averageScore,
              color: _getScoreColor(averageScore.toInt()),
            ),
          ),
          Container(
            width: 1,
            height: 40,
            color: AppTheme.textMuted.withOpacity(0.2),
          ),
          Expanded(
            child: _buildStatItem(
              icon: LucideIcons.checkCircle,
              value: completedCount.toString(),
              label: l10n.completed,
              color: AppTheme.accentBright,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontFamily: 'Poppins',
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppTheme.textMuted,
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildHistoryCard(Map<String, dynamic> item, AppLocalizations l10n, int index) {
    final quiz = item['quiz_id'];
    final status = item['status'];
    final score = item['score'] as num?;
    final date = DateTime.parse(item['started_at']);
    final isInProgress = status == 'in_progress';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isInProgress ? AppTheme.primaryVibrant : _getScoreColor(score?.toInt()))
                .withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isInProgress ? () => _resumeQuiz(quiz['_id']) : null,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    // Score Ring / Progress Indicator
                    _buildScoreRing(score?.toInt(), isInProgress),
                    const SizedBox(width: 16),

                    // Quiz Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            quiz != null ? quiz['title'] : l10n.unknownQuiz,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: AppTheme.textPrimary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(
                                LucideIcons.calendar,
                                size: 14,
                                color: AppTheme.textMuted,
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  _getRelativeTime(date, l10n),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppTheme.textMuted,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (!isInProgress && score != null) ...[
                                const SizedBox(width: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _getScoreColor(score.toInt()).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        _getPerformanceIcon(score.toInt()),
                                        size: 12,
                                        color: _getScoreColor(score.toInt()),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        _getPerformanceLabel(score.toInt(), l10n),
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: _getScoreColor(score.toInt()),
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Score / Status
                    if (isInProgress)
                      _buildInProgressBadge(l10n)
                    else
                      _buildScoreDisplay(score?.toInt()),
                  ],
                ),

                // Resume Button for in-progress quizzes
                if (isInProgress) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: AppTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryVibrant.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => _resumeQuiz(quiz['_id']),
                        borderRadius: BorderRadius.circular(14),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              LucideIcons.play,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              l10n.resumeQuiz,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildScoreRing(int? score, bool isInProgress) {
    final color = isInProgress ? AppTheme.primaryVibrant : _getScoreColor(score);
    final gradient = isInProgress
        ? AppTheme.primaryGradient
        : _getScoreGradient(score);

    return SizedBox(
      width: 56,
      height: 56,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background ring
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withOpacity(0.1),
            ),
          ),
          // Progress ring
          if (!isInProgress && score != null)
            CustomPaint(
              size: const Size(56, 56),
              painter: _ScoreRingPainter(
                progress: score / 100,
                gradient: gradient,
                strokeWidth: 4,
              ),
            ),
          // Center icon or text
          if (isInProgress)
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: gradient,
              ),
              child: const Icon(
                LucideIcons.play,
                color: Colors.white,
                size: 18,
              ),
            )
          else
            Icon(
              _getPerformanceIcon(score),
              color: color,
              size: 24,
            ),
        ],
      ),
    );
  }

  Widget _buildInProgressBadge(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryVibrant.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            l10n.inProgress,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreDisplay(int? score) {
    if (score == null) {
      return const Text(
        '-',
        style: TextStyle(
          fontFamily: 'Poppins',
          fontWeight: FontWeight.w700,
          fontSize: 24,
          color: AppTheme.textMuted,
        ),
      );
    }

    return ShaderMask(
      shaderCallback: (bounds) => _getScoreGradient(score).createShader(bounds),
      child: Text(
        '$score%',
        style: const TextStyle(
          fontFamily: 'Poppins',
          fontWeight: FontWeight.w700,
          fontSize: 24,
          color: Colors.white,
        ),
      ),
    );
  }

  Widget _buildEmptyState(AppLocalizations l10n) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedBuilder(
              animation: _emptyStateController,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, math.sin(_emptyStateController.value * math.pi) * 8),
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.primaryVibrant.withOpacity(0.15),
                          AppTheme.secondaryVibrant.withOpacity(0.1),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.primaryVibrant.withOpacity(0.2),
                                AppTheme.secondaryVibrant.withOpacity(0.15),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            shape: BoxShape.circle,
                          ),
                        ),
                        ShaderMask(
                          shaderCallback: (bounds) =>
                              AppTheme.primaryGradient.createShader(bounds),
                          child: const Icon(
                            LucideIcons.history,
                            size: 40,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),
            Text(
              l10n.noHistoryYet,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontWeight: FontWeight.w600,
                fontSize: 20,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              l10n.startQuizToSeeHistory,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                color: AppTheme.textSecondary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            Container(
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryVibrant.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => context.go(AppRoute.dashboard),
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 14,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          LucideIcons.playCircle,
                          color: Colors.white,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          l10n.browseQuizzes,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(AppLocalizations l10n, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.alertCircle,
                size: 40,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              l10n.error,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontWeight: FontWeight.w600,
                fontSize: 18,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _refreshHistory,
              icon: const Icon(LucideIcons.refreshCw, size: 18),
              label: Text(l10n.retry),
            ),
          ],
        ),
      ),
    );
  }
}

// Custom painter for the score ring
class _ScoreRingPainter extends CustomPainter {
  final double progress;
  final LinearGradient gradient;
  final double strokeWidth;

  _ScoreRingPainter({
    required this.progress,
    required this.gradient,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    final rect = Rect.fromCircle(center: center, radius: radius);
    final paint = Paint()
      ..shader = gradient.createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Draw arc
    canvas.drawArc(
      rect,
      -math.pi / 2, // Start from top
      2 * math.pi * progress, // Sweep angle
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _ScoreRingPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
