import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/widgets/primary_button.dart';

class EmptyQuizState extends StatefulWidget {
  const EmptyQuizState({
    super.key,
    required this.filter,
    this.onActionTap,
  });

  final String filter;
  final VoidCallback? onActionTap;

  @override
  State<EmptyQuizState> createState() => _EmptyQuizStateState();
}

class _EmptyQuizStateState extends State<EmptyQuizState>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _floatAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    _floatAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));

    _animationController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 24),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppTheme.cardWhite,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryVibrant.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
          border: Border.all(
            color: AppTheme.primaryVibrant.withOpacity(0.1),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, _floatAnimation.value * 10),
                  child: Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.primaryVibrant.withOpacity(0.1),
                            AppTheme.secondaryVibrant.withOpacity(0.1),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _getIcon(),
                        size: 64,
                        color: AppTheme.primaryVibrant,
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
            Text(
              'No ${widget.filter.toLowerCase()} quizzes',
              style: textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _getMessage(),
              style: textTheme.bodyLarge?.copyWith(
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (widget.onActionTap != null) ...[
              const SizedBox(height: 24),
              PrimaryButton(
                label: 'Explore Other Quizzes',
                leading: const Icon(LucideIcons.search, size: 20),
                onPressed: widget.onActionTap!,
                size: PrimaryButtonSize.medium,
              ),
            ],
            const SizedBox(height: 16),
            // Floating decorative elements
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _DecorativeDot(color: AppTheme.primaryVibrant),
                const SizedBox(width: 8),
                _DecorativeDot(color: AppTheme.secondaryVibrant),
                const SizedBox(width: 8),
                _DecorativeDot(color: AppTheme.accentBright),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getMessage() {
    switch (widget.filter.toLowerCase()) {
      case 'all':
        return 'We\'re adding new quizzes every day. Check back soon for fresh content!';
      case 'free':
        return 'All free quizzes are currently unavailable. Try premium content for an enhanced learning experience!';
      case 'premium':
        return 'No premium quizzes available at the moment. Upgrade to unlock our growing collection!';
      default:
        return 'No quizzes in this category. Try exploring other categories!';
    }
  }

  IconData _getIcon() {
    switch (widget.filter.toLowerCase()) {
      case 'all':
        return LucideIcons.inbox;
      case 'free':
        return LucideIcons.gift;
      case 'premium':
        return LucideIcons.crown;
      default:
        return LucideIcons.search;
    }
  }
}

class _DecorativeDot extends StatefulWidget {
  const _DecorativeDot({required this.color});

  final Color color;

  @override
  State<_DecorativeDot> createState() => _DecorativeDotState();
}

class _DecorativeDotState extends State<_DecorativeDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }
}