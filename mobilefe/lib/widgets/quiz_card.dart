import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/l10n/app_localizations.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/providers/app_providers.dart';

class QuizCard extends ConsumerStatefulWidget {
  const QuizCard({super.key, required this.quiz});

  final QuizModel quiz;

  @override
  ConsumerState<QuizCard> createState() => _QuizCardState();
}

class _QuizCardState extends ConsumerState<QuizCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  String _difficultyLabel(QuizDifficulty difficulty, AppLocalizations l10n) {
    switch (difficulty) {
      case QuizDifficulty.beginner:
        return l10n.beginner;
      case QuizDifficulty.intermediate:
        return l10n.intermediate;
      case QuizDifficulty.advanced:
        return l10n.advanced;
    }
  }

  Color _getDifficultyColor() {
    switch (widget.quiz.difficulty) {
      case QuizDifficulty.beginner:
        return AppTheme.accentBright;
      case QuizDifficulty.intermediate:
        return AppTheme.warningWarm;
      case QuizDifficulty.advanced:
        return const Color(0xFFEF4444);
    }
  }

  Widget _buildPremiumBadge(TextTheme textTheme, AppLocalizations l10n) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.warningWarm, const Color(0xFFFBBF24)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.warningWarm.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.crown, size: 16, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            l10n.premium,
            style: textTheme.labelSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFreeBadge(TextTheme textTheme, AppLocalizations l10n) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.accentBright, const Color(0xFF34D399)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.accentBright.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.badgeCheck, size: 16, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            l10n.free,
            style: textTheme.labelSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleTap() async {
    final user = ref.read(currentUserProvider);
    final bool locked = widget.quiz.isPremiumContent && !user.isPremium;

    if (locked) {
      _animationController.forward().then((_) {
        _animationController.reverse();
      });

      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: Row(
            children: [
              Icon(LucideIcons.lock, color: AppTheme.warningWarm, size: 24),
              const SizedBox(width: 12),
              const Text('Premium Quiz'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Unlock this premium quiz and access our entire collection of exclusive content.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _FeatureItem(icon: LucideIcons.zap, text: 'Advanced topics'),
                  _FeatureItem(
                    icon: LucideIcons.award,
                    text: 'Expert questions',
                  ),
                  _FeatureItem(
                    icon: LucideIcons.trendingUp,
                    text: 'Detailed analytics',
                  ),
                ],
              ),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
              child: const Text('Maybe later'),
            ),
            FilledButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                context.push(AppRoute.premium);
              },
              icon: const Icon(LucideIcons.crown, size: 18),
              label: const Text('Upgrade Now'),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.warningWarm,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      );
      return;
    }

    _animationController.forward().then((_) {
      _animationController.reverse();
    });

    context.push(AppRoute.quizDetail, extra: widget.quiz);
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final l10n = AppLocalizations.of(context);
    // Use responsive width: take 70% of screen width, with min 240 and max 300
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = (screenWidth * 0.7).clamp(240.0, 300.0);

    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            width: cardWidth,
            margin: const EdgeInsets.only(right: 16),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(24),
              child: InkWell(
                borderRadius: BorderRadius.circular(24),
                onTap: _handleTap,
                onHighlightChanged: (isHighlighted) {
                  setState(() {
                    _isHovered = isHighlighted;
                  });
                  if (isHighlighted) {
                    _animationController.forward();
                  } else {
                    _animationController.reverse();
                  }
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: AppTheme.cardWhite,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: widget.quiz.isPremiumContent
                          ? AppTheme.warningWarm.withOpacity(0.3)
                          : Colors.transparent,
                      width: 2,
                    ),
                    boxShadow: _isHovered
                        ? [
                            BoxShadow(
                              color: AppTheme.primaryVibrant.withOpacity(0.2),
                              blurRadius: 32,
                              offset: const Offset(0, 16),
                            ),
                            BoxShadow(
                              color: AppTheme.secondaryVibrant.withOpacity(0.1),
                              blurRadius: 48,
                              offset: const Offset(0, 24),
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 24,
                              offset: const Offset(0, 12),
                            ),
                          ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Image section with overlay
                      Stack(
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(22),
                            ),
                            child: Stack(
                              children: [
                                _buildThumbnailImage(),
                                // Gradient overlay
                                Container(
                                  height: 130, // Match image height
                                  decoration: BoxDecoration(
                                    borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(22),
                                    ),
                                    gradient: LinearGradient(
                                      colors: [
                                        Colors.transparent,
                                        Colors.black.withOpacity(0.7),
                                      ],
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Positioned(
                            top: 12,
                            right: 12,
                            child: widget.quiz.isPremiumContent
                                ? _buildPremiumBadge(textTheme, l10n)
                                : _buildFreeBadge(textTheme, l10n),
                          ),
                          Positioned(
                            bottom: 12,
                            left: 12,
                            right: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.6),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    _getDifficultyIcon(),
                                    size: 14,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      _difficultyLabel(
                                        widget.quiz.difficulty,
                                        l10n,
                                      ),
                                      style: textTheme.bodySmall?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      // Content section
                      Flexible(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                            // Category
                            Row(
                              children: [
                                Flexible(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _getDifficultyColor().withOpacity(
                                        0.1,
                                      ),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: _getDifficultyColor()
                                            .withOpacity(0.3),
                                      ),
                                    ),
                                    child: Text(
                                      widget.quiz.category,
                                      style: textTheme.bodySmall?.copyWith(
                                        color: _getDifficultyColor(),
                                        fontWeight: FontWeight.w600,
                                        fontSize: 11,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Title
                            Text(
                              widget.quiz.title,
                              style: textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                                height: 1.2,
                                fontSize: 15,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),

                            // Author
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 8,
                                  backgroundColor: AppTheme.textMuted
                                      .withOpacity(0.2),
                                  child: Icon(
                                    LucideIcons.user,
                                    size: 10,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    widget.quiz.author,
                                    style: textTheme.bodySmall?.copyWith(
                                      color: AppTheme.textSecondary,
                                      fontSize: 11,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            // Stats
                            Row(
                              children: [
                                _StatItem(
                                  icon: LucideIcons.helpCircle,
                                  label: '${widget.quiz.questionCount}',
                                  sublabel: l10n.qs,
                                ),
                                const SizedBox(width: 12),
                                _StatItem(
                                  icon: LucideIcons.clock3,
                                  label: '${widget.quiz.durationMinutes}',
                                  sublabel: l10n.min,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    },
  );
}

  IconData _getDifficultyIcon() {
    switch (widget.quiz.difficulty) {
      case QuizDifficulty.beginner:
        return LucideIcons.star;
      case QuizDifficulty.intermediate:
        return LucideIcons.zap;
      case QuizDifficulty.advanced:
        return LucideIcons.target;
    }
  }

  /// Builds the thumbnail image widget, handling both base64 data URLs and network URLs
  Widget _buildThumbnailImage() {
    final thumbnail = widget.quiz.thumbnail;

    // Check if it's a base64 data URL
    if (thumbnail.startsWith('data:image')) {
      try {
        final parts = thumbnail.split(',');
        if (parts.length == 2) {
          final Uint8List bytes = base64Decode(parts[1]);
          return Image.memory(
            bytes,
            height: 130,
            width: double.infinity,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => _buildPlaceholderImage(),
          );
        }
      } catch (e) {
        debugPrint('Error decoding base64 image: $e');
      }
      return _buildPlaceholderImage();
    }

    // Otherwise treat as network URL
    return Image.network(
      thumbnail,
      height: 130,
      width: double.infinity,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => _buildPlaceholderImage(),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      height: 130,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryVibrant.withOpacity(0.8),
            AppTheme.secondaryVibrant.withOpacity(0.6),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Icon(
          LucideIcons.image,
          size: 48,
          color: Colors.white.withOpacity(0.7),
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.label,
    required this.sublabel,
  });

  final IconData icon;
  final String label;
  final String sublabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
                fontSize: 12,
              ),
            ),
            Text(
              sublabel,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textMuted,
                fontSize: 9,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _FeatureItem extends StatelessWidget {
  const _FeatureItem({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppTheme.accentBright),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppTheme.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
