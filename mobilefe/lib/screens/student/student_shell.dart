import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/screens/student/home_screen.dart';
import 'package:mobilefe/screens/student/leaderboard_screen.dart';
import 'package:mobilefe/screens/student/profile_screen.dart';
import 'package:mobilefe/screens/student/search_screen.dart';

class StudentShell extends ConsumerWidget {
  const StudentShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final int currentIndex = ref.watch(studentTabProvider);
    final List<Widget> screens = const <Widget>[
      HomeScreen(),
      SearchScreen(),
      LeaderboardScreen(),
      ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: currentIndex, children: screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (int index) {
          ref.read(studentTabProvider.notifier).setTab(index);
        },
        destinations: const <NavigationDestination>[
          NavigationDestination(icon: Icon(LucideIcons.home), label: 'Home'),
          NavigationDestination(
            icon: Icon(LucideIcons.search),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.trophy),
            label: 'Leaders',
          ),
          NavigationDestination(icon: Icon(LucideIcons.user), label: 'Profile'),
        ],
      ),
    );
  }
}
