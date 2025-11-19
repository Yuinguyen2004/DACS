import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/data/mock_data.dart';
import 'package:mobilefe/widgets/category_chip.dart';
import 'package:mobilefe/widgets/quiz_card.dart';
import 'package:mobilefe/widgets/recent_activity_tile.dart';
import 'package:mobilefe/widgets/section_header.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _HeaderCard(textTheme: textTheme),
              const SizedBox(height: 24),
              SectionHeader(
                title: 'Recommended Quizzes',
                actionLabel: 'See all',
                onActionTap: () {},
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 300,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: mockQuizzes.length,
                  itemBuilder: (context, index) {
                    final quiz = mockQuizzes[index];
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
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.textTheme});

  final TextTheme textTheme;

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
                  'Hello, ${mockUser.name}',
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
                      mockUser.level,
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
                    '${mockUser.points} pts',
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
            backgroundImage: NetworkImage(mockUser.avatarUrl),
          ),
        ],
      ),
    );
  }
}
