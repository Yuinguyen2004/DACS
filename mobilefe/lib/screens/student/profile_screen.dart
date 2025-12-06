import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/l10n/app_localizations.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/create_quiz/create_quiz_entry.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen>
    with TickerProviderStateMixin {
  late AnimationController _staggerController;
  late AnimationController _levelProgressController;
  late Animation<double> _levelProgressAnimation;

  @override
  void initState() {
    super.initState();
    _staggerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _levelProgressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _levelProgressAnimation = CurvedAnimation(
      parent: _levelProgressController,
      curve: Curves.easeOutCubic,
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _staggerController.forward();
      _levelProgressController.forward();
    });
  }

  @override
  void dispose() {
    _staggerController.dispose();
    _levelProgressController.dispose();
    super.dispose();
  }

  // Calculate user level based on points
  int _calculateLevel(int points) {
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    if (points < 2200) return 6;
    if (points < 3000) return 7;
    if (points < 4000) return 8;
    if (points < 5500) return 9;
    return 10;
  }

  int _getPointsForLevel(int level) {
    const levelPoints = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 999999];
    return levelPoints[level.clamp(0, 10)];
  }

  double _getLevelProgress(int points) {
    final level = _calculateLevel(points);
    final currentLevelPoints = _getPointsForLevel(level - 1);
    final nextLevelPoints = _getPointsForLevel(level);
    return ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)).clamp(0.0, 1.0);
  }

  String _getLevelTitle(int level, AppLocalizations l10n) {
    final titles = [
      l10n.levelNovice,
      l10n.levelLearner,
      l10n.levelStudent,
      l10n.levelScholar,
      l10n.levelExpert,
      l10n.levelMaster,
      l10n.levelGrandmaster,
      l10n.levelChampion,
      l10n.levelLegend,
      l10n.levelMythic,
    ];
    return titles[(level - 1).clamp(0, 9)];
  }

  Color _getLevelColor(int level) {
    final colors = [
      const Color(0xFF94A3B8), // Slate
      const Color(0xFF22C55E), // Green
      const Color(0xFF3B82F6), // Blue
      const Color(0xFF8B5CF6), // Purple
      const Color(0xFFEC4899), // Pink
      const Color(0xFFF59E0B), // Amber
      const Color(0xFFEF4444), // Red
      const Color(0xFF06B6D4), // Cyan
      const Color(0xFFD946EF), // Fuchsia
      const Color(0xFFFFD700), // Gold
    ];
    return colors[(level - 1).clamp(0, 9)];
  }

  List<_Achievement> _getAchievements(int quizzesTaken, double avgScore, int points) {
    return [
      _Achievement(
        icon: LucideIcons.rocket,
        title: 'First Steps',
        isUnlocked: quizzesTaken >= 1,
        color: const Color(0xFF3B82F6),
      ),
      _Achievement(
        icon: LucideIcons.flame,
        title: 'On Fire',
        isUnlocked: quizzesTaken >= 10,
        color: const Color(0xFFEF4444),
      ),
      _Achievement(
        icon: LucideIcons.target,
        title: 'Sharpshooter',
        isUnlocked: avgScore >= 80,
        color: const Color(0xFF10B981),
      ),
      _Achievement(
        icon: LucideIcons.trophy,
        title: 'Champion',
        isUnlocked: avgScore >= 95,
        color: const Color(0xFFF59E0B),
      ),
      _Achievement(
        icon: LucideIcons.zap,
        title: 'Power User',
        isUnlocked: quizzesTaken >= 50,
        color: const Color(0xFF8B5CF6),
      ),
      _Achievement(
        icon: LucideIcons.crown,
        title: 'Quiz Master',
        isUnlocked: points >= 1000,
        color: const Color(0xFFEC4899),
      ),
    ];
  }

  Widget _buildAnimatedItem({
    required Widget child,
    required int index,
    double delay = 0.1,
  }) {
    return AnimatedBuilder(
      animation: _staggerController,
      builder: (context, _) {
        final start = (index * delay).clamp(0.0, 0.7);
        final end = (start + 0.3).clamp(0.0, 1.0);
        final animation = CurvedAnimation(
          parent: _staggerController,
          curve: Interval(start, end, curve: Curves.easeOutCubic),
        );
        return Transform.translate(
          offset: Offset(0, 30 * (1 - animation.value)),
          child: Opacity(opacity: animation.value, child: child),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(currentUserProvider);
    final level = _calculateLevel(user.points);
    final levelProgress = _getLevelProgress(user.points);
    final levelColor = _getLevelColor(level);
    final achievements = _getAchievements(user.quizzesTaken, user.averageScore, user.points);
    final unlockedCount = achievements.where((a) => a.isUnlocked).length;

    return Scaffold(
      backgroundColor: AppTheme.surfaceSoft,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // Gradient Header
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF6366F1),
                    Color(0xFF8B5CF6),
                    Color(0xFFA855F7),
                  ],
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
                  child: Column(
                    children: [
                      // Header Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            l10n.profile,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          Row(
                            children: [
                              _HeaderIconButton(
                                icon: LucideIcons.bell,
                                onTap: () => context.push(AppRoute.notifications),
                              ),
                              const SizedBox(width: 8),
                              _HeaderIconButton(
                                icon: LucideIcons.settings,
                                onTap: () => context.push(AppRoute.accountSettings),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),

                      // Avatar with Level Ring
                      _buildAnimatedItem(
                        index: 0,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Animated level progress ring
                            AnimatedBuilder(
                              animation: _levelProgressAnimation,
                              builder: (context, child) {
                                return CustomPaint(
                                  size: const Size(140, 140),
                                  painter: _LevelRingPainter(
                                    progress: levelProgress * _levelProgressAnimation.value,
                                    color: levelColor,
                                    backgroundColor: Colors.white.withOpacity(0.2),
                                    strokeWidth: 4,
                                  ),
                                );
                              },
                            ),
                            // Avatar
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 4),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.2),
                                    blurRadius: 20,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 56,
                                backgroundColor: Colors.white,
                                foregroundImage: NetworkImage(user.avatarUrl),
                                onForegroundImageError: (_, __) {},
                                child: Icon(
                                  LucideIcons.user,
                                  size: 56,
                                  color: AppTheme.primaryVibrant.withOpacity(0.3),
                                ),
                              ),
                            ),
                            // Level badge
                            Positioned(
                              bottom: 0,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: levelColor,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: levelColor.withOpacity(0.4),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      LucideIcons.star,
                                      size: 14,
                                      color: Colors.white,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'LV $level',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Name
                      _buildAnimatedItem(
                        index: 1,
                        child: Text(
                          user.name,
                          style: const TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Email + Premium badge
                      _buildAnimatedItem(
                        index: 2,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              LucideIcons.mail,
                              size: 14,
                              color: Colors.white.withOpacity(0.8),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              user.email,
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white.withOpacity(0.8),
                              ),
                            ),
                            if (user.isPremium) ...[
                              const SizedBox(width: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(LucideIcons.crown, size: 12, color: Colors.white),
                                    SizedBox(width: 4),
                                    Text(
                                      'PRO',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Floating Profile Card
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: _buildAnimatedItem(
                index: 3,
                child: Container(
                  margin: const EdgeInsets.only(top: 0),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Level Title & Progress
                      Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: levelColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                LucideIcons.award,
                                color: levelColor,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _getLevelTitle(level, l10n),
                                    style: const TextStyle(
                                      fontFamily: 'Poppins',
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${user.points} / ${_getPointsForLevel(level)} ${l10n.pts}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              '${(levelProgress * 100).toInt()}%',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: levelColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        // Progress bar
                        AnimatedBuilder(
                          animation: _levelProgressAnimation,
                          builder: (context, child) {
                            return Container(
                              height: 8,
                              decoration: BoxDecoration(
                                color: levelColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: FractionallySizedBox(
                                  widthFactor: levelProgress * _levelProgressAnimation.value,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          levelColor,
                                          levelColor.withOpacity(0.7),
                                        ],
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 20),
                        // Stats Row
                        Row(
                          children: [
                            Expanded(
                              child: _CompactStatItem(
                                icon: LucideIcons.bookOpen,
                                value: user.quizzesTaken.toString(),
                                label: l10n.quizzes,
                                color: AppTheme.primaryVibrant,
                              ),
                            ),
                            Container(
                              width: 1,
                              height: 40,
                              color: AppTheme.textMuted.withOpacity(0.15),
                            ),
                            Expanded(
                              child: _CompactStatItem(
                                icon: LucideIcons.target,
                                value: '${user.averageScore.toStringAsFixed(0)}%',
                                label: l10n.averageScore,
                                color: AppTheme.accentBright,
                              ),
                            ),
                            Container(
                              width: 1,
                              height: 40,
                              color: AppTheme.textMuted.withOpacity(0.15),
                            ),
                            Expanded(
                              child: _CompactStatItem(
                                icon: LucideIcons.trophy,
                                value: user.points.toString(),
                                label: l10n.pts,
                                color: AppTheme.warningWarm,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                    // Achievements Section
                    _buildAnimatedItem(
                      index: 4,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                l10n.achievements,
                                style: const TextStyle(
                                  fontFamily: 'Poppins',
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryVibrant.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '$unlockedCount/${achievements.length}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primaryVibrant,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            height: 90,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: achievements.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 12),
                              itemBuilder: (context, index) {
                                final achievement = achievements[index];
                                return _AchievementBadge(achievement: achievement);
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Quick Actions
                    _buildAnimatedItem(
                      index: 5,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.quickActions,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: _ActionCard(
                                  icon: LucideIcons.plusCircle,
                                  label: l10n.createNewQuiz,
                                  gradient: AppTheme.primaryGradient,
                                  onTap: () => startCreateQuizFlow(context, ref),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _ActionCard(
                                  icon: LucideIcons.history,
                                  label: l10n.viewHistory,
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF10B981), Color(0xFF34D399)],
                                  ),
                                  onTap: () {
                                    // Switch to history tab
                                    ref.read(studentTabProvider.notifier).setTab(1);
                                  },
                                ),
                              ),
                            ],
                          ),
                          if (!user.isPremium) ...[
                            const SizedBox(height: 12),
                            _PremiumUpgradeCard(
                              onTap: () => context.push(AppRoute.premium),
                              l10n: l10n,
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Settings Section
                    _buildAnimatedItem(
                      index: 6,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.settings,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                _SettingsItem(
                                  icon: LucideIcons.user,
                                  title: l10n.editProfile,
                                  subtitle: l10n.updateYourInfo,
                                  color: AppTheme.primaryVibrant,
                                  onTap: () => context.push(AppRoute.editProfile),
                                ),
                                _SettingsDivider(),
                                _SettingsItem(
                                  icon: LucideIcons.lock,
                                  title: l10n.changePassword,
                                  subtitle: l10n.updatePassword,
                                  color: const Color(0xFF8B5CF6),
                                  onTap: () => context.push(AppRoute.changePassword),
                                ),
                                _SettingsDivider(),
                                _SettingsItem(
                                  icon: LucideIcons.globe,
                                  title: l10n.language,
                                  subtitle: l10n.selectLanguage,
                                  color: const Color(0xFF06B6D4),
                                  onTap: () => context.push(AppRoute.languageSettings),
                                ),
                                _SettingsDivider(),
                                _SettingsItem(
                                  icon: LucideIcons.helpCircle,
                                  title: l10n.helpAndSupport,
                                  subtitle: l10n.getHelp,
                                  color: const Color(0xFF10B981),
                                  onTap: () {},
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Logout Button
                    _buildAnimatedItem(
                      index: 7,
                      child: Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.red.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () async {
                              final apiService = ref.read(apiServiceProvider);
                              await apiService.logout();
                              ref.read(currentUserProvider.notifier).clearUser();
                              if (context.mounted) {
                                context.go(AppRoute.login);
                              }
                            },
                            borderRadius: BorderRadius.circular(16),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    LucideIcons.logOut,
                                    color: Colors.red.withOpacity(0.8),
                                    size: 20,
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    l10n.logout,
                                    style: TextStyle(
                                      fontFamily: 'Poppins',
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.red.withOpacity(0.8),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withOpacity(0.15),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
      ),
    );
  }
}

class _CompactStatItem extends StatelessWidget {
  const _CompactStatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontFamily: 'Poppins',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }
}

class _Achievement {
  final IconData icon;
  final String title;
  final bool isUnlocked;
  final Color color;

  _Achievement({
    required this.icon,
    required this.title,
    required this.isUnlocked,
    required this.color,
  });
}

class _AchievementBadge extends StatelessWidget {
  const _AchievementBadge({required this.achievement});

  final _Achievement achievement;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 75,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: achievement.isUnlocked
            ? achievement.color.withOpacity(0.1)
            : Colors.grey.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: achievement.isUnlocked
              ? achievement.color.withOpacity(0.3)
              : Colors.grey.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            achievement.icon,
            size: 28,
            color: achievement.isUnlocked ? achievement.color : Colors.grey.withOpacity(0.4),
          ),
          const SizedBox(height: 8),
          Text(
            achievement.title,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: achievement.isUnlocked ? achievement.color : Colors.grey,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.label,
    required this.gradient,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final LinearGradient gradient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: gradient.colors.first.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PremiumUpgradeCard extends StatelessWidget {
  const _PremiumUpgradeCard({required this.onTap, required this.l10n});

  final VoidCallback onTap;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF59E0B), Color(0xFFFBBF24), Color(0xFFFCD34D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF59E0B).withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    LucideIcons.crown,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.upgradeToPremium,
                        style: const TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l10n.unlockAllFeatures,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  LucideIcons.arrowRight,
                  color: Colors.white,
                  size: 24,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  const _SettingsItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                LucideIcons.chevronRight,
                color: AppTheme.textMuted,
                size: 18,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SettingsDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Divider(
        height: 1,
        color: AppTheme.textMuted.withOpacity(0.1),
      ),
    );
  }
}

class _LevelRingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final Color backgroundColor;
  final double strokeWidth;

  _LevelRingPainter({
    required this.progress,
    required this.color,
    required this.backgroundColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle
    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _LevelRingPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
