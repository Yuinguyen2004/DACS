import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/l10n/app_localizations.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/student/home_screen.dart';
import 'package:mobilefe/screens/student/history_screen.dart';
import 'package:mobilefe/screens/student/profile_screen.dart';

class MainScreen extends ConsumerWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final int currentIndex = ref.watch(studentTabProvider);
    final List<Widget> tabs = const <Widget>[
      HomeScreen(),
      HistoryScreen(),
      ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: currentIndex, children: tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
        onDestinationSelected: (index) {
          // Refresh history when switching to History tab (index 1)
          if (index == 1) {
            ref.invalidate(quizHistoryProvider);
          }
          ref.read(studentTabProvider.notifier).setTab(index);
        },
        destinations: <NavigationDestination>[
          NavigationDestination(
            icon: const Icon(LucideIcons.home),
            label: l10n.home,
          ),
          NavigationDestination(
            icon: const Icon(LucideIcons.history),
            label: l10n.history,
          ),
          NavigationDestination(
            icon: const Icon(LucideIcons.user),
            label: l10n.profile,
          ),
        ],
      ),
    );
  }
}
