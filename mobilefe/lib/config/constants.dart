import 'package:flutter/material.dart';

class AppSpacing {
  AppSpacing._();

  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
}

class AppRadius {
  AppRadius._();

  static const BorderRadius soft = BorderRadius.all(Radius.circular(16));
  static const BorderRadius pill = BorderRadius.all(Radius.circular(999));
}

class AppAssets {
  AppAssets._();

  static const String onboarding1 = 'assets/onboarding_1.png';
  static const String onboarding2 = 'assets/onboarding_2.png';
  static const String onboarding3 = 'assets/onboarding_3.png';
  static const String defaultAvatar = 'https://i.pravatar.cc/150?img=47';
}
