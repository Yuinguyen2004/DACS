import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/widgets/quiz_card.dart';

class AllQuizzesScreen extends ConsumerStatefulWidget {
  const AllQuizzesScreen({super.key});

  @override
  ConsumerState<AllQuizzesScreen> createState() => _AllQuizzesScreenState();
}

class _AllQuizzesScreenState extends ConsumerState<AllQuizzesScreen> {
  String _selectedFilter = 'All';

  @override
  Widget build(BuildContext context) {
    final quizzesAsync = ref.watch(quizListProvider);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Quizzes'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Filter:',
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('All'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Free'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Premium'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Quizzes grid
          Expanded(
            child: quizzesAsync.when(
              data: (quizzes) {
                // Apply filter
                final filteredQuizzes = quizzes.where((quiz) {
                  if (_selectedFilter == 'All') return true;
                  if (_selectedFilter == 'Free') return !quiz.isPremiumContent;
                  if (_selectedFilter == 'Premium') return quiz.isPremiumContent;
                  return true;
                }).toList();

                if (filteredQuizzes.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          LucideIcons.inbox,
                          size: 64,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No quizzes found',
                          style: textTheme.titleMedium?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _selectedFilter == 'All'
                              ? 'There are no quizzes available yet'
                              : 'No $_selectedFilter quizzes available',
                          style: textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.85, // Adjusted for better proportions
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: filteredQuizzes.length,
                  itemBuilder: (context, index) {
                    return QuizCard(quiz: filteredQuizzes[index]);
                  },
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(),
              ),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      LucideIcons.alertCircle,
                      size: 64,
                      color: Colors.red.shade400,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Error loading quizzes',
                      style: textTheme.titleMedium?.copyWith(
                        color: Colors.red.shade600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      error.toString(),
                      style: textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = label;
        });
      },
      selectedColor: AppTheme.primaryVibrant.withOpacity(0.2),
      checkmarkColor: AppTheme.primaryVibrant,
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.primaryVibrant : AppTheme.textSecondary,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.primaryVibrant : Colors.grey.shade300,
      ),
    );
  }
}
