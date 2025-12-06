import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/config/app_theme.dart';
import 'package:mobilefe/config/app_router.dart';
import 'package:mobilefe/l10n/locale_provider.dart';
import 'package:mobilefe/providers/app_providers.dart';

class AccountSettingsScreen extends ConsumerStatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  ConsumerState<AccountSettingsScreen> createState() =>
      _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends ConsumerState<AccountSettingsScreen> {
  bool _isCanceling = false;

  String _formatSubscriptionType(String? type) {
    switch (type?.toLowerCase()) {
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'lifetime':
        return 'Lifetime';
      default:
        return 'Premium';
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat('MMM dd, yyyy').format(date);
  }

  Future<void> _cancelSubscription() async {
    final user = ref.read(currentUserProvider);
    final expiryDate = _formatDate(user.subscriptionEndDate);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(LucideIcons.alertCircle, color: Colors.orange),
            SizedBox(width: 12),
            Text('Are you sure?'),
          ],
        ),
        content: Text(
          'You will keep premium access until $expiryDate. After that, your account will be downgraded to Free.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep Subscription'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isCanceling = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.cancelSubscription();

      // Refresh user data
      await ref.read(currentUserProvider.notifier).fetchUser();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Subscription canceled. You have access until $expiryDate.',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to cancel subscription: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCanceling = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account Settings'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile Section
            Text(
              'Profile',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _SettingCard(
              icon: LucideIcons.user,
              title: 'Edit Profile',
              subtitle: 'Update your name and avatar',
              onTap: () => context.push(AppRoute.editProfile),
            ),
            const SizedBox(height: 12),
            _SettingCard(
              icon: LucideIcons.mail,
              title: 'Email',
              subtitle: user.email,
              onTap: () {}, // Email is read-only
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.accentBright.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Verified',
                  style: textTheme.labelSmall?.copyWith(
                    color: AppTheme.accentBright,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Security Section
            Text(
              'Security',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _SettingCard(
              icon: LucideIcons.lock,
              title: 'Change Password',
              subtitle: 'Update your password',
              onTap: () => context.push(AppRoute.changePassword),
            ),

            const SizedBox(height: 32),

            // Preferences Section
            Text(
              'Preferences',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _SettingCard(
              icon: LucideIcons.bell,
              title: 'Notifications',
              subtitle: 'Manage notification preferences',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Notifications - Coming soon')),
                );
              },
            ),
            const SizedBox(height: 12),
            _SettingCard(
              icon: LucideIcons.shield,
              title: 'Privacy',
              subtitle: 'Control your privacy settings',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Privacy - Coming soon')),
                );
              },
            ),
            const SizedBox(height: 12),
            _SettingCard(
              icon: LucideIcons.globe,
              title: 'Language',
              subtitle: ref.watch(localeProvider.notifier).getLanguageName(),
              onTap: () => context.push(AppRoute.languageSettings),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    ref.watch(localeProvider.notifier).getFlagEmoji(),
                    style: const TextStyle(fontSize: 20),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    LucideIcons.chevronRight,
                    color: AppTheme.textMuted,
                    size: 20,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Subscription Section (if premium)
            if (user.isPremium) ...[
              Text(
                'Subscription',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.warningWarm.withOpacity(0.1),
                      const Color(0xFFFBBF24).withOpacity(0.1),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.warningWarm.withOpacity(0.3),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            LucideIcons.crown,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${_formatSubscriptionType(user.subscriptionType)} Member',
                                style: textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              if (user.isCanceled)
                                Text(
                                  'Canceled - Expires ${_formatDate(user.subscriptionEndDate)}',
                                  style: textTheme.bodySmall?.copyWith(
                                    color: Colors.orange,
                                    fontWeight: FontWeight.w500,
                                  ),
                                )
                              else if (user.subscriptionType?.toLowerCase() ==
                                  'lifetime')
                                Text(
                                  'Lifetime access',
                                  style: textTheme.bodySmall?.copyWith(
                                    color: AppTheme.accentBright,
                                    fontWeight: FontWeight.w500,
                                  ),
                                )
                              else
                                Text(
                                  'Active until ${_formatDate(user.subscriptionEndDate)}',
                                  style: textTheme.bodySmall?.copyWith(
                                    color: AppTheme.textMuted,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    // Show cancel button only if not canceled and not lifetime
                    if (!user.isCanceled &&
                        user.subscriptionType?.toLowerCase() != 'lifetime') ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: TextButton(
                          onPressed: _isCanceling ? null : _cancelSubscription,
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.red,
                          ),
                          child: _isCanceling
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text('Cancel'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],

            // Danger Zone
            Text(
              'Danger Zone',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 12),
            _SettingCard(
              icon: LucideIcons.trash2,
              title: 'Delete Account',
              subtitle: 'Permanently delete your account',
              onTap: () {
                _showDeleteAccountDialog(context);
              },
              isDestructive: true,
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(LucideIcons.alertTriangle, color: Colors.red),
            SizedBox(width: 12),
            Text('Delete Account'),
          ],
        ),
        content: const Text(
          'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement actual delete account API call
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Account deletion - Coming soon'),
                  backgroundColor: Colors.red,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
  }
}

class _SettingCard extends StatelessWidget {
  const _SettingCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.trailing,
    this.isDestructive = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Widget? trailing;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? Colors.red : AppTheme.primaryVibrant;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        title: Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: isDestructive ? Colors.red : AppTheme.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppTheme.textMuted),
        ),
        trailing:
            trailing ??
            Icon(LucideIcons.chevronRight, color: AppTheme.textMuted, size: 20),
      ),
    );
  }
}
