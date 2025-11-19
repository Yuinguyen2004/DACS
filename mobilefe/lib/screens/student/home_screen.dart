import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/data/mock_data.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/user_model.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/create_quiz/create_quiz_entry.dart';
import 'package:mobilefe/widgets/category_chip.dart';
import 'package:mobilefe/widgets/quiz_card.dart';
import 'package:mobilefe/widgets/recent_activity_tile.dart';
import 'package:mobilefe/widgets/section_header.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    final UserModel user = ref.watch(currentUserProvider);
    final bool premiumOnly = ref.watch(premiumQuizzesOnlyProvider);
    final List<QuizModel> visibleQuizzes = premiumOnly
        ? mockQuizzes.where((quiz) => quiz.isPremiumContent).toList()
        : mockQuizzes;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _HeaderCard(textTheme: textTheme, user: user),
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
                    ? _EmptyPremiumState(premiumOnly: premiumOnly)
                    : ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: visibleQuizzes.length,
                        itemBuilder: (context, index) {
                          final quiz = visibleQuizzes[index];
                          return QuizCard(
                            quiz: quiz,
                            onTap: () =>
                                context.push(AppRoute.quizDetail, extra: quiz),
                          );
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
              const SizedBox(height: 24),
              SectionHeader(
                title: 'Categories',
                actionLabel: 'Customize',
                onActionTap: () {},
              ),
              const SizedBox(height: 16),
              GridView.count(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.2,
                children: categories
                    .map((category) => CategoryChip(category: category))
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

class _EmptyPremiumState extends StatelessWidget {
  const _EmptyPremiumState({required this.premiumOnly});

  final bool premiumOnly;

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
          premiumOnly
              ? 'No premium quizzes available yet.'
              : 'No quizzes found.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ),
    );
  }
}
