import 'package:flutter/material.dart';
import 'package:mobilefe/l10n/translations/en.dart';
import 'package:mobilefe/l10n/translations/vi.dart';

/// Supported locales in the app
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  /// Get the current AppLocalizations from context
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizations(const Locale('en'));
  }

  /// Check if a locale is supported
  static bool isSupported(Locale locale) {
    return ['en', 'vi'].contains(locale.languageCode);
  }

  /// Get supported locales
  static const List<Locale> supportedLocales = [
    Locale('en', 'US'), // English
    Locale('vi', 'VN'), // Vietnamese
  ];

  /// Get translation map based on current locale
  Map<String, String> get _localizedStrings {
    switch (locale.languageCode) {
      case 'vi':
        return viTranslations;
      case 'en':
      default:
        return enTranslations;
    }
  }

  /// Translate a key
  String translate(String key) {
    return _localizedStrings[key] ?? key;
  }

  // ============ Common ============
  String get appName => translate('app_name');
  String get loading => translate('loading');
  String get error => translate('error');
  String get success => translate('success');
  String get cancel => translate('cancel');
  String get confirm => translate('confirm');
  String get save => translate('save');
  String get delete => translate('delete');
  String get edit => translate('edit');
  String get back => translate('back');
  String get next => translate('next');
  String get done => translate('done');
  String get yes => translate('yes');
  String get no => translate('no');
  String get ok => translate('ok');
  String get retry => translate('retry');
  String get search => translate('search');
  String get noData => translate('no_data');
  String get comingSoon => translate('coming_soon');

  // ============ Auth ============
  String get login => translate('login');
  String get register => translate('register');
  String get logout => translate('logout');
  String get email => translate('email');
  String get password => translate('password');
  String get confirmPassword => translate('confirm_password');
  String get forgotPassword => translate('forgot_password');
  String get resetPassword => translate('reset_password');
  String get name => translate('name');
  String get welcomeBack => translate('welcome_back');
  String get signInToContinue => translate('sign_in_to_continue');
  String get createAccount => translate('create_account');
  String get joinUs => translate('join_us');
  String get alreadyHaveAccount => translate('already_have_account');
  String get dontHaveAccount => translate('dont_have_account');
  String get loginSuccessful => translate('login_successful');
  String get registerSuccessful => translate('register_successful');
  String get loginFailed => translate('login_failed');
  String get registerFailed => translate('register_failed');
  String get invalidCredentials => translate('invalid_credentials');
  String get connectionTimeout => translate('connection_timeout');
  String get connectionError => translate('connection_error');
  String get orContinueWith => translate('or_continue_with');

  // ============ Dashboard ============
  String get dashboard => translate('dashboard');
  String get home => translate('home');
  String get explore => translate('explore');
  String get history => translate('history');
  String get profile => translate('profile');
  String get helloUser => translate('hello_user');
  String get readyToLearn => translate('ready_to_learn');
  String get yourProgress => translate('your_progress');
  String get recentActivity => translate('recent_activity');
  String get viewAll => translate('view_all');
  String get filterQuizzes => translate('filter_quizzes');
  String get recommendedQuizzes => translate('recommended_quizzes');
  String get seeAll => translate('see_all');
  String get createNewQuiz => translate('create_new_quiz');
  String get noRecentActivity => translate('no_recent_activity');
  String get totalScore => translate('total_score');
  String get beginner => translate('beginner');
  String get intermediate => translate('intermediate');
  String get advanced => translate('advanced');
  String get pts => translate('pts');
  String get min => translate('min');
  String get qs => translate('qs');
  String get errorLoadingQuizzes => translate('error_loading_quizzes');
  String get errorLoadingActivities => translate('error_loading_activities');

  // ============ Quiz ============
  String get quiz => translate('quiz');
  String get quizzes => translate('quizzes');
  String get startQuiz => translate('start_quiz');
  String get continueQuiz => translate('continue_quiz');
  String get resumeQuiz => translate('resume_quiz');
  String get submitQuiz => translate('submit_quiz');
  String get questions => translate('questions');
  String get question => translate('question');
  String get timeLimit => translate('time_limit');
  String get minutes => translate('minutes');
  String get difficulty => translate('difficulty');
  String get easy => translate('easy');
  String get medium => translate('medium');
  String get hard => translate('hard');
  String get all => translate('all');
  String get free => translate('free');
  String get premium => translate('premium');
  String get score => translate('score');
  String get result => translate('result');
  String get passed => translate('passed');
  String get failed => translate('failed');
  String get correct => translate('correct');
  String get incorrect => translate('incorrect');
  String get timeUp => translate('time_up');
  String get quizCompleted => translate('quiz_completed');
  String get congratulations => translate('congratulations');
  String get tryAgain => translate('try_again');
  String get reviewAnswers => translate('review_answers');
  String get noQuizzesAvailable => translate('no_quizzes_available');

  // ============ History ============
  String get quizHistory => translate('quiz_history');
  String get noHistoryYet => translate('no_history_yet');
  String get clearHistory => translate('clear_history');
  String get clearHistoryConfirm => translate('clear_history_confirm');
  String get historyCleared => translate('history_cleared');
  String get completedOn => translate('completed_on');
  String get timeTaken => translate('time_taken');
  String get today => translate('today');
  String get yesterday => translate('yesterday');
  String get daysAgo => translate('days_ago');
  String get excellent => translate('excellent');
  String get good => translate('good');
  String get fair => translate('fair');
  String get needsImprovement => translate('needs_improvement');
  String get totalAttempts => translate('total_attempts');
  String get averageScore => translate('average_score');
  String get startQuizToSeeHistory => translate('start_quiz_to_see_history');
  String get browseQuizzes => translate('browse_quizzes');

  // ============ Settings ============
  String get settings => translate('settings');
  String get accountSettings => translate('account_settings');
  String get editProfile => translate('edit_profile');
  String get changePassword => translate('change_password');
  String get notifications => translate('notifications');
  String get privacy => translate('privacy');
  String get language => translate('language');
  String get selectLanguage => translate('select_language');
  String get english => translate('english');
  String get vietnamese => translate('vietnamese');
  String get theme => translate('theme');
  String get darkMode => translate('dark_mode');
  String get lightMode => translate('light_mode');
  String get systemDefault => translate('system_default');
  String get about => translate('about');
  String get version => translate('version');
  String get termsOfService => translate('terms_of_service');
  String get privacyPolicy => translate('privacy_policy');
  String get helpAndSupport => translate('help_and_support');
  String get dangerZone => translate('danger_zone');
  String get deleteAccount => translate('delete_account');
  String get deleteAccountWarning => translate('delete_account_warning');

  // ============ Premium/Subscription ============
  String get goPremium => translate('go_premium');
  String get premiumMember => translate('premium_member');
  String get subscription => translate('subscription');
  String get activeSubscription => translate('active_subscription');
  String get manageSubscription => translate('manage_subscription');
  String get upgradeNow => translate('upgrade_now');
  String get upgradeToPremium => translate('upgrade_to_premium');
  String get unlockAllFeatures => translate('unlock_all_features');
  String get premiumRequired => translate('premium_required');
  String get premiumBenefits => translate('premium_benefits');

  // ============ Activity Status ============
  String get inProgress => translate('in_progress');
  String get completed => translate('completed');
  String get noQuizzesAvailableRightNow =>
      translate('no_quizzes_available_right_now');
  String get allFreeQuizzesUnavailable =>
      translate('all_free_quizzes_unavailable');
  String get noPremiumQuizzesYet => translate('no_premium_quizzes_yet');
  String get unknownQuiz => translate('unknown_quiz');

  // ============ Notifications ============
  String get notificationsTitle => translate('notifications_title');
  String get noNotifications => translate('no_notifications');
  String get clearNotifications => translate('clear_notifications');
  String get clearNotificationsConfirm =>
      translate('clear_notifications_confirm');
  String get notificationsCleared => translate('notifications_cleared');
  String get markAllAsRead => translate('mark_all_as_read');

  // ============ Profile ============
  String get updateProfile => translate('update_profile');
  String get profileUpdated => translate('profile_updated');
  String get currentPassword => translate('current_password');
  String get newPassword => translate('new_password');
  String get passwordChanged => translate('password_changed');
  String get verified => translate('verified');
  String get achievements => translate('achievements');
  String get quickActions => translate('quick_actions');
  String get viewHistory => translate('view_history');
  String get updateYourInfo => translate('update_your_info');
  String get updatePassword => translate('update_password');
  String get getHelp => translate('get_help');
  String get levelNovice => translate('level_novice');
  String get levelLearner => translate('level_learner');
  String get levelStudent => translate('level_student');
  String get levelScholar => translate('level_scholar');
  String get levelExpert => translate('level_expert');
  String get levelMaster => translate('level_master');
  String get levelGrandmaster => translate('level_grandmaster');
  String get levelChampion => translate('level_champion');
  String get levelLegend => translate('level_legend');
  String get levelMythic => translate('level_mythic');

  // ============ Validation ============
  String get fieldRequired => translate('field_required');
  String get invalidEmail => translate('invalid_email');
  String get passwordTooShort => translate('password_too_short');
  String get passwordsDoNotMatch => translate('passwords_do_not_match');

  // ============ Onboarding ============
  String get skip => translate('skip');
  String get getStarted => translate('get_started');
  String get onboardingTitle1 => translate('onboarding_title_1');
  String get onboardingDesc1 => translate('onboarding_desc_1');
  String get onboardingTitle2 => translate('onboarding_title_2');
  String get onboardingDesc2 => translate('onboarding_desc_2');
  String get onboardingTitle3 => translate('onboarding_title_3');
  String get onboardingDesc3 => translate('onboarding_desc_3');
}

/// Localization delegate
class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => AppLocalizations.isSupported(locale);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(AppLocalizationsDelegate old) => false;
}
