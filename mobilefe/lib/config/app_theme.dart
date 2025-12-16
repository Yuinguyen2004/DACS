import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTheme {
  AppTheme._();

  // Distinctive color palette - Educational Playful
  static const Color primaryVibrant = Color(0xFF6366F1); // Indigo 500
  static const Color secondaryVibrant = Color(0xFFEC4899); // Pink 500
  static const Color accentBright = Color(0xFF10B981); // Emerald 500
  static const Color warningWarm = Color(0xFFF59E0B); // Amber 500
  static const Color surfaceSoft = Color(0xFFF8FAFC); // Slate 50
  static const Color cardWhite = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF475569); // Slate 600
  static const Color textMuted = Color(0xFF94A3B8); // Slate 400

  // Gradient combinations for visual interest
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryVibrant, secondaryVibrant],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [accentBright, Color(0xFF34D399)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,

    // Custom color scheme
    colorScheme: const ColorScheme.light(
      primary: primaryVibrant,
      secondary: secondaryVibrant,
      surface: surfaceSoft,
      background: surfaceSoft,
      error: Color(0xFFEF4444),
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: textPrimary,
      onBackground: textPrimary,
    ),

    scaffoldBackgroundColor: surfaceSoft,

    // Enhanced typography with Poppins font family
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        fontFamily: 'Poppins',
        fontWeight: FontWeight.w800,
        fontSize: 32,
        height: 1.2,
        letterSpacing: -0.5,
      ),
      displayMedium: TextStyle(
        fontFamily: 'Poppins',
        fontWeight: FontWeight.w700,
        fontSize: 28,
        height: 1.3,
        letterSpacing: -0.25,
      ),
      headlineLarge: TextStyle(
        fontFamily: 'Poppins',
        fontWeight: FontWeight.w700,
        fontSize: 24,
        height: 1.3,
      ),
      headlineMedium: TextStyle(
        fontFamily: 'Poppins',
        fontWeight: FontWeight.w600,
        fontSize: 20,
        height: 1.4,
      ),
      titleLarge: TextStyle(
        fontFamily: 'Poppins',
        fontWeight: FontWeight.w600,
        fontSize: 18,
        height: 1.4,
      ),
      titleMedium: TextStyle(
        fontFamily: 'Poppins',
        fontWeight: FontWeight.w600,
        fontSize: 16,
        height: 1.4,
      ),
      titleSmall: TextStyle(
        fontFamily: 'Poppins',
        fontWeight: FontWeight.w500,
        fontSize: 14,
        height: 1.5,
      ),
      bodyLarge: TextStyle(
        fontFamily: 'Inter',
        fontSize: 16,
        height: 1.5,
        fontWeight: FontWeight.w400,
      ),
      bodyMedium: TextStyle(
        fontFamily: 'Inter',
        fontSize: 14,
        height: 1.5,
        fontWeight: FontWeight.w400,
      ),
      bodySmall: TextStyle(
        fontFamily: 'Inter',
        fontSize: 12,
        height: 1.4,
        fontWeight: FontWeight.w400,
      ),
      labelLarge: TextStyle(
        fontFamily: 'Poppins',
        fontWeight: FontWeight.w600,
        fontSize: 14,
        letterSpacing: 0.1,
      ),
    ).apply(
      bodyColor: textPrimary,
      displayColor: textPrimary,
    ),

    // Enhanced card theme
    cardTheme: CardThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 2,
      margin: EdgeInsets.zero,
      color: cardWhite,
      surfaceTintColor: Colors.white,
      shadowColor: Colors.black.withOpacity(0.1),
    ),

    // Premium input theme
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: textMuted.withOpacity(0.3), width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: textMuted.withOpacity(0.3), width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: primaryVibrant, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
      ),
      filled: true,
      fillColor: cardWhite,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      hintStyle: const TextStyle(
        color: textMuted,
        fontWeight: FontWeight.w400,
      ),
      labelStyle: const TextStyle(
        color: textSecondary,
        fontWeight: FontWeight.w500,
      ),
    ),

    // Enhanced button themes
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: primaryVibrant,
        foregroundColor: Colors.white,
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          letterSpacing: 0.1,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 0,
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryVibrant,
        side: const BorderSide(color: primaryVibrant, width: 1.5),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryVibrant,
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),

    // Enhanced chip theme
    chipTheme: ChipThemeData(
      backgroundColor: cardWhite,
      selectedColor: primaryVibrant,
      disabledColor: textMuted.withOpacity(0.2),
      labelStyle: const TextStyle(
        color: textPrimary,
        fontWeight: FontWeight.w500,
      ),
      secondaryLabelStyle: const TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: textMuted.withOpacity(0.2)),
      ),
    ),

    // Custom app bar theme
    appBarTheme: const AppBarTheme(
      backgroundColor: surfaceSoft,
      foregroundColor: textPrimary,
      elevation: 0,
      scrolledUnderElevation: 1,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        color: textPrimary,
        fontWeight: FontWeight.w600,
        fontSize: 18,
      ),
    ),

    // Navigation bar theme
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: cardWhite,
      surfaceTintColor: Colors.transparent,
      elevation: 2,
      labelTextStyle: MaterialStatePropertyAll(
        TextStyle(
          color: textMuted,
          fontWeight: FontWeight.w500,
          fontSize: 12,
        ),
      ),
      indicatorColor: primaryVibrant,
    ),

    // Floating action button theme
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: primaryVibrant,
      foregroundColor: Colors.white,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
    ),

    );
}
