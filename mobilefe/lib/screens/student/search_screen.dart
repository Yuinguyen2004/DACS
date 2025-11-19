import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/data/mock_data.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/providers/app_providers.dart';

class SearchScreen extends ConsumerWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String filter = ref.watch(selectedDifficultyProvider);
    final List<QuizModel> filtered = filter == 'All'
        ? mockQuizzes
        : mockQuizzes
              .where((quiz) => quiz.difficulty.name == filter.toLowerCase())
              .toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Explore')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: <Widget>[
            TextField(
              decoration: InputDecoration(
                hintText: 'Search quizzes, subjects... ',
                prefixIcon: const Icon(LucideIcons.search),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 42,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children:
                    <String>['All', 'beginner', 'intermediate', 'advanced']
                        .map(
                          (option) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(
                                option[0].toUpperCase() + option.substring(1),
                              ),
                              selected: filter == option,
                              onSelected: (_) => ref
                                  .read(selectedDifficultyProvider.notifier)
                                  .setFilter(option),
                            ),
                          ),
                        )
                        .toList(),
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.separated(
                itemCount: filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final quiz = filtered[index];
                  return ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    tileColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    leading: CircleAvatar(
                      backgroundColor: Colors.indigo.withValues(alpha: 0.1),
                      child: const Icon(LucideIcons.bookOpen),
                    ),
                    title: Text(quiz.title),
                    subtitle: Text(
                      '${quiz.category} · ${quiz.questionCount} questions',
                    ),
                    trailing: const Icon(LucideIcons.chevronRight),
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
