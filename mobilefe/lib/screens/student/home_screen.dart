import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/data/api_service.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/user_model.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/create_quiz/create_quiz_entry.dart';
import 'package:mobilefe/widgets/quiz_card.dart';
import 'package:mobilefe/widgets/recent_activity_tile.dart';
import 'package:mobilefe/widgets/section_header.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late Future<List<Map<String, dynamic>>> _recentActivityFuture;

  @override
  void initState() {
    super.initState();
    _loadRecentActivity();
  }

  void _loadRecentActivity() {
    _recentActivityFuture = ref.read(apiServiceProvider).getTestHistory();
  }

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    final UserModel user = ref.watch(currentUserProvider);
    ref.watch(userBootstrapProvider); // Trigger user fetch
    final QuizAccessFilter accessFilter = ref.watch(quizAccessFilterProvider);
    final AsyncValue<List<QuizModel>> quizListAsync = ref.watch(quizListProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _HeaderCard(textTheme: textTheme, user: user),
              const SizedBox(height: 24),
              Text('Filter quizzes', style: textTheme.titleMedium),
              const SizedBox(height: 8),
              _FilterChips(
                selectedFilter: accessFilter,
                onChanged: (value) => ref
                    .read(quizAccessFilterProvider.notifier)
                    .setFilter(value),
              ),
              const SizedBox(height: 24),
              SectionHeader(
                title: 'Recommended Quizzes',
                actionLabel: 'See all',
                onActionTap: () => context.push(AppRoute.allQuizzes),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 300,
                child: quizListAsync.when(
                  data: (quizzes) {
                    final visibleQuizzes = _filterQuizzes(quizzes, accessFilter);
                    return visibleQuizzes.isEmpty
                        ? _EmptyQuizState(filter: accessFilter)
                        : ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: visibleQuizzes.length,
                            itemBuilder: (context, index) {
                              final quiz = visibleQuizzes[index];
                              return QuizCard(quiz: quiz);
                            },
                          );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => Center(child: Text('Error loading quizzes')),
                ),
              ),
              const SizedBox(height: 32),
              SectionHeader(
                title: 'Recent Activity',
                actionLabel: 'View all',
                onActionTap: () => context.push(AppRoute.allActivity),
              ),
              const SizedBox(height: 16),
              FutureBuilder<List<Map<String, dynamic>>>(
                future: _recentActivityFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (snapshot.hasError) {
                    return Center(
                      child: Text('Error loading activities: ${snapshot.error}'),
                    );
                  }

                  final history = snapshot.data ?? [];
                  final recentHistory = history.take(3).toList();

                  if (recentHistory.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          'No recent activity',
                          style: textTheme.bodyMedium?.copyWith(
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    );
                  }

                  return Column(
                    children: recentHistory.map((item) {
                      final quiz = item['quiz_id'];
                      final status = item['status'];
                      final score = item['score'];
                      final date = DateTime.parse(item['started_at']);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: <Widget>[
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: status == 'in_progress'
                                      ? Colors.orange.withValues(alpha: 0.1)
                                      : Colors.indigo.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Icon(
                                  status == 'in_progress'
                                      ? LucideIcons.clock
                                      : LucideIcons.clipboardCheck,
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
                                      score != null
                                          ? 'Score: $score% · ${status == 'in_progress' ? 'In Progress' : 'Completed'}'
                                          : status == 'in_progress'
                                              ? 'In Progress'
                                              : 'Completed',
                                      style: textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: <Widget>[
                                  Text(
                                    '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}',
                                    style: textTheme.bodySmall,
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: status == 'in_progress'
                                          ? Colors.orange.withValues(alpha: 0.15)
                                          : Colors.green.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      status == 'in_progress' ? 'In Progress' : 'Completed',
                                      style: textTheme.bodySmall?.copyWith(
                                        color: status == 'in_progress'
                                            ? Colors.orange
                                            : Colors.green,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => startCreateQuizFlow(context, ref),
        icon: const Icon(LucideIcons.plus),
        label: const Text('Create New Quiz'),
      ),
    );
  }
}

class _HeaderCard extends StatefulWidget {
  const _HeaderCard({required this.textTheme, required this.user});

  final TextTheme textTheme;
  final UserModel user;

  @override
  State<_HeaderCard> createState() => _HeaderCardState();
}

class _HeaderCardState extends State<_HeaderCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _slideAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _slideAnimation = Tween<double>(
      begin: -50,
      end: 0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    ));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(_slideAnimation.value, 0),
          child: Transform.scale(
            scale: _scaleAnimation.value,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primaryVibrant,
                      AppTheme.secondaryVibrant,
                      const Color(0xFF8B5CF6),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryVibrant.withOpacity(0.3),
                      blurRadius: 32,
                      offset: const Offset(0, 16),
                    ),
                    BoxShadow(
                      color: AppTheme.secondaryVibrant.withOpacity(0.2),
                      blurRadius: 48,
                      offset: const Offset(0, 24),
                    ),
                  ],
                ),
                child: Stack(
                  children: [
                    // Decorative elements
                    Positioned(
                      top: -20,
                      right: -20,
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -10,
                      left: -10,
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.08),
                        ),
                      ),
                    ),
                    // Notification Icon
                    Positioned(
                      top: 0,
                      right: 0,
                      child: IconButton(
                        onPressed: () => context.push(AppRoute.notifications),
                        icon: const Icon(LucideIcons.bell),
                        color: Colors.white,
                        tooltip: 'Notifications',
                      ),
                    ),
                    // Main content
                    Padding(
                      padding: const EdgeInsets.only(top: 16), // Add padding for the icon
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [

                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      'Hello, ${widget.user.name}! 🎯',
                                      style: widget.textTheme.headlineMedium?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        height: 1.2,
                                      ),
                                    ),
                                  ),
                                  if (widget.user.isPremium) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            AppTheme.warningWarm,
                                            const Color(0xFFFBBF24),
                                          ],
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: [
                                          BoxShadow(
                                            color: AppTheme.warningWarm.withOpacity(0.4),
                                            blurRadius: 8,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(
                                            LucideIcons.crown,
                                            size: 14,
                                            color: Colors.white,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'PREMIUM',
                                            style: widget.textTheme.labelSmall?.copyWith(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w800,
                                              fontSize: 10,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          LucideIcons.badgeCheck,
                                          size: 16,
                                          color: Colors.white70,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          widget.user.level,
                                          style: widget.textTheme.bodyMedium?.copyWith(
                                            color: Colors.white70,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.white.withOpacity(0.25),
                                      Colors.white.withOpacity(0.15),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.2),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      LucideIcons.trophy,
                                      size: 20,
                                      color: Colors.white.withOpacity(0.9),
                                    ),
                                    const SizedBox(width: 8),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          '${widget.user.points} pts',
                                          style: widget.textTheme.titleMedium?.copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 18,
                                          ),
                                        ),
                                        Text(
                                          'Total Score',
                                          style: widget.textTheme.bodySmall?.copyWith(
                                            color: Colors.white70,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              if (!widget.user.isPremium) ...[
                                const SizedBox(height: 12),
                                InkWell(
                                  onTap: () => context.push(AppRoute.premium),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFBBF24),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          LucideIcons.crown,
                                          size: 16,
                                          color: Colors.black,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Upgrade to Premium',
                                          style: widget.textTheme.bodySmall?.copyWith(
                                            color: Colors.black,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(width: 20),
                        // Profile image with ring
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withOpacity(0.3),
                              width: 3,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 16,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 40,
                            backgroundColor: Colors.white.withOpacity(0.2),
                            foregroundImage: NetworkImage(widget.user.avatarUrl),
                            onForegroundImageError: (exception, stackTrace) {
                              // Silently handle image load errors
                            },
                            child: Icon(
                              LucideIcons.user,
                              size: 40,
                              color: Colors.white.withOpacity(0.7),
                            ),
                          ),
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
      },
    );
  }
}

class _FilterChips extends StatelessWidget {
  const _FilterChips({
    required this.selectedFilter,
    required this.onChanged,
  });

  final QuizAccessFilter selectedFilter;
  final ValueChanged<QuizAccessFilter> onChanged;

  String _labelFor(QuizAccessFilter filter) {
    switch (filter) {
      case QuizAccessFilter.all:
        return 'All';
      case QuizAccessFilter.free:
        return 'Free';
      case QuizAccessFilter.premium:
        return 'Premium';
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: QuizAccessFilter.values.map((filter) {
          final bool selected = selectedFilter == filter;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(_labelFor(filter)),
              selected: selected,
              onSelected: (_) => onChanged(filter),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _EmptyQuizState extends StatelessWidget {
  const _EmptyQuizState({required this.filter});

  final QuizAccessFilter filter;

  String get _message {
    switch (filter) {
      case QuizAccessFilter.all:
        return 'No quizzes available right now.';
      case QuizAccessFilter.free:
        return 'All free quizzes are currently unavailable.';
      case QuizAccessFilter.premium:
        return 'No premium quizzes available yet.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Text(
          _message,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ),
    );
  }
}

List<QuizModel> _filterQuizzes(
  List<QuizModel> quizzes,
  QuizAccessFilter filter,
) {
  switch (filter) {
    case QuizAccessFilter.all:
      return quizzes;
    case QuizAccessFilter.free:
      return quizzes.where((quiz) => !quiz.isPremiumContent).toList();
    case QuizAccessFilter.premium:
      return quizzes.where((quiz) => quiz.isPremiumContent).toList();
  }
}
