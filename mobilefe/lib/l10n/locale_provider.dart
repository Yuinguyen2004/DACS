import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobilefe/l10n/app_localizations.dart';

const String _localeStorageKey = 'app_locale';
const _storage = FlutterSecureStorage();

/// Provider for the current locale
final localeProvider = NotifierProvider<LocaleNotifier, Locale>(
  LocaleNotifier.new,
);

/// Notifier for managing app locale
class LocaleNotifier extends Notifier<Locale> {
  @override
  Locale build() {
    // Initialize with device locale, then try to load saved locale
    _loadSavedLocale();
    return _getDeviceLocale();
  }

  /// Get the device's current locale
  static Locale _getDeviceLocale() {
    final deviceLocale = ui.PlatformDispatcher.instance.locale;

    // Check if the device locale is supported, otherwise fallback to English
    if (AppLocalizations.isSupported(deviceLocale)) {
      return deviceLocale;
    }

    // Default to English if device language is not supported
    return const Locale('en', 'US');
  }

  /// Load saved locale from storage
  Future<void> _loadSavedLocale() async {
    try {
      final savedLocale = await _storage.read(key: _localeStorageKey);

      if (savedLocale != null) {
        // Parse saved locale string (format: "en_US" or "vi_VN")
        final parts = savedLocale.split('_');
        if (parts.isNotEmpty) {
          final languageCode = parts[0];
          final countryCode = parts.length > 1 ? parts[1] : null;
          final locale = Locale(languageCode, countryCode);

          if (AppLocalizations.isSupported(locale)) {
            state = locale;
            return;
          }
        }
      }
    } catch (e) {
      // On error, just use device locale
      debugPrint('Failed to load locale: $e');
    }
  }

  /// Change the app locale
  Future<void> setLocale(Locale newLocale) async {
    if (!AppLocalizations.isSupported(newLocale)) {
      return; // Don't set unsupported locales
    }

    state = newLocale;

    // Save to storage
    try {
      final localeString =
          '${newLocale.languageCode}_${newLocale.countryCode ?? ''}';
      await _storage.write(key: _localeStorageKey, value: localeString);
    } catch (e) {
      // Failed to save, but locale is still updated in memory
      debugPrint('Failed to save locale: $e');
    }
  }

  /// Reset to device locale
  Future<void> resetToDeviceLocale() async {
    final deviceLocale = _getDeviceLocale();
    await setLocale(deviceLocale);
  }

  /// Get the current language name for display
  String getLanguageName() {
    switch (state.languageCode) {
      case 'vi':
        return 'Tiếng Việt';
      case 'en':
      default:
        return 'English';
    }
  }

  /// Get flag emoji for current locale
  String getFlagEmoji() {
    switch (state.languageCode) {
      case 'vi':
        return '🇻🇳';
      case 'en':
      default:
        return '🇺🇸';
    }
  }
}

/// Helper extension for easy access to translations
extension LocalizationExtension on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
