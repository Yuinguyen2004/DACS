import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/screens/create_quiz/quiz_creation_models.dart';

class QuizTypeSelectorScreen extends StatelessWidget {
  const QuizTypeSelectorScreen({super.key});

  void _onSelect(BuildContext context, QuizType type) {
    context.push(AppRoute.createQuizMethod, extra: type);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose quiz type')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'How would you like to start?',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Pick a quiz template that matches your content style. You can always tweak the details later.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView(
                children: <Widget>[
                  _QuizTypeCard(
                    icon: LucideIcons.zap,
                    type: QuizType.basic,
                    highlights: const <String>[
                      'Fast setup with text questions',
                      '4-choice answers with scoring',
                      'Perfect for practice drills',
                    ],
                    onTap: () => _onSelect(context, QuizType.basic),
                  ),
                  const SizedBox(height: 16),
                  _QuizTypeCard(
                    icon: LucideIcons.image,
                    type: QuizType.advanced,
                    highlights: const <String>[
                      'Attach images or audio per question',
                      'Ideal for visual or listening tests',
                      'Full control over question metadata',
                    ],
                    onTap: () => _onSelect(context, QuizType.advanced),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuizTypeCard extends StatelessWidget {
  const _QuizTypeCard({
    required this.icon,
    required this.type,
    required this.highlights,
    required this.onTap,
  });

  final IconData icon;
  final QuizType type;
  final List<String> highlights;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: const <BoxShadow>[
            BoxShadow(
              color: Color(0x11000000),
              blurRadius: 24,
              offset: Offset(0, 12),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            CircleAvatar(
              radius: 32,
              backgroundColor: theme.colorScheme.primary.withValues(
                alpha: 0.12,
              ),
              child: Icon(icon, color: theme.colorScheme.primary, size: 28),
            ),
            const SizedBox(height: 16),
            Text(type.title, style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(type.description, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 16),
            ...highlights.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: <Widget>[
                    const Icon(
                      LucideIcons.checkCircle2,
                      size: 18,
                      color: Color(0xFF16A34A),
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(item)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: onTap,
                icon: const Icon(LucideIcons.arrowRight),
                label: const Text('Use this'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
