import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/data/mock_data.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/user_model.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/create_quiz/create_quiz_entry.dart';
import 'package:mobilefe/widgets/quiz_card.dart';
import 'package:mobilefe/widgets/recent_activity_tile.dart';
import 'package:mobilefe/widgets/section_header.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    final UserModel user = ref.watch(currentUserProvider);
    final QuizAccessFilter accessFilter = ref.watch(quizAccessFilterProvider);
    final List<QuizModel> visibleQuizzes =
      _filterQuizzes(mockQuizzes, accessFilter);

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
                onActionTap: () {},
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 300,
                child: visibleQuizzes.isEmpty
                    ? _EmptyQuizState(filter: accessFilter)
                    : ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: visibleQuizzes.length,
                        itemBuilder: (context, index) {
                          final quiz = visibleQuizzes[index];
                          return QuizCard(quiz: quiz);
                        },
                      ),
              ),
              const SizedBox(height: 32),
              SectionHeader(
                title: 'Recent Activity',
                actionLabel: 'View all',
                onActionTap: () {},
              ),
              const SizedBox(height: 16),
              Column(
                children: recentActivities
                    .map(
                      (activity) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: RecentActivityTile(activity: activity),
                      ),
                    )
                    .toList(),
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

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.textTheme, required this.user});

  final TextTheme textTheme;
  final UserModel user;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: <Color>[Color(0xFF4F46E5), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x33212528),
            blurRadius: 24,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Hello, ${user.name}',
                  style: textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontSize: 22,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: <Widget>[
                    const Icon(LucideIcons.badgeCheck, color: Colors.white70),
                    const SizedBox(width: 6),
                    Text(
                      user.level,
                      style: textTheme.bodyMedium?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${user.points} pts',
                    style: textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          CircleAvatar(
            radius: 36,
            backgroundImage: NetworkImage(user.avatarUrl),
          ),
        ],
      ),
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
