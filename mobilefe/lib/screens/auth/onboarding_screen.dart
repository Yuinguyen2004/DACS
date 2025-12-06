import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/providers/app_providers.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  late final PageController _pageController;

  final List<_OnboardingContent> _slides = const <_OnboardingContent>[
    _OnboardingContent(
      icon: LucideIcons.target,
      title: 'Master quizzes anywhere',
      description:
          'Practice curated quizzes designed by top mentors and track progress in real time.',
    ),
    _OnboardingContent(
      icon: LucideIcons.users,
      title: 'Compete with friends',
      description:
          'Climb the leaderboard, unlock badges, and stay motivated with friendly competition.',
    ),
    _OnboardingContent(
      icon: LucideIcons.sparkles,
      title: 'Create & share exams',
      description:
          'Teachers can spin up engaging quizzes with powerful controls right from mobile.',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _pageController.addListener(_handlePageChange);
  }

  void _handlePageChange() {
    final int newIndex = _pageController.page?.round() ?? 0;
    ref.read(onboardingIndexProvider.notifier).setIndex(newIndex);
  }

  @override
  void dispose() {
    _pageController.removeListener(_handlePageChange);
    _pageController.dispose();
    super.dispose();
  }

  void _next(BuildContext context, int index) {
    if (index == _slides.length - 1) {
      context.go(AppRoute.login);
    } else {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final int currentIndex = ref.watch(onboardingIndexProvider);
    final TextTheme textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            children: <Widget>[
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.go(AppRoute.login),
                  child: const Text('Skip'),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _slides.length,
                  itemBuilder: (context, index) {
                    final slide = _slides[index];
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        Container(
                          height: 220,
                          width: 220,
                          decoration: BoxDecoration(
                            color: Colors.indigo.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(120),
                          ),
                          child: Icon(
                            slide.icon,
                            size: 120,
                            color: Colors.indigo,
                          ),
                        ),
                        const SizedBox(height: 48),
                        Text(
                          slide.title,
                          style: textTheme.headlineMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          slide.description,
                          style: textTheme.bodyLarge?.copyWith(
                            color: Colors.black54,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    );
                  },
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (int index) {
                  final bool isActive = index == currentIndex;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    height: 8,
                    width: isActive ? 24 : 8,
                    decoration: BoxDecoration(
                      color: isActive
                          ? Colors.indigo
                          : Colors.indigo.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => _next(context, currentIndex),
                  child: Text(
                    currentIndex == _slides.length - 1 ? 'Get started' : 'Next',
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go(AppRoute.login),
                child: const Text('Already have an account? Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingContent {
  const _OnboardingContent({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;
}
