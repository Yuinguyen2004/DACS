import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobilefe/data/mock_data.dart';
import 'package:mobilefe/models/user_model.dart';

enum QuizAccessFilter { all, free, premium }

final onboardingIndexProvider = NotifierProvider<OnboardingIndexNotifier, int>(
  OnboardingIndexNotifier.new,
);
final loginPasswordVisibilityProvider =
    NotifierProvider<BoolToggleNotifier, bool>(
      () => BoolToggleNotifier(initialState: true),
    );
final registerPasswordVisibilityProvider =
    NotifierProvider<BoolToggleNotifier, bool>(
      () => BoolToggleNotifier(initialState: true),
    );
final registerConfirmPasswordVisibilityProvider =
    NotifierProvider<BoolToggleNotifier, bool>(
      () => BoolToggleNotifier(initialState: true),
    );
final studentTabProvider = NotifierProvider<StudentTabNotifier, int>(
  StudentTabNotifier.new,
);
final selectedDifficultyProvider =
    NotifierProvider<SelectedDifficultyNotifier, String>(
      SelectedDifficultyNotifier.new,
    );
final currentUserProvider = NotifierProvider<CurrentUserNotifier, UserModel>(
  CurrentUserNotifier.new,
);
final quizAccessFilterProvider =
    NotifierProvider<QuizAccessFilterNotifier, QuizAccessFilter>(
  QuizAccessFilterNotifier.new,
);

class OnboardingIndexNotifier extends Notifier<int> {
  @override
  int build() => 0;

  void setIndex(int newIndex) => state = newIndex;
}

class StudentTabNotifier extends Notifier<int> {
  @override
  int build() => 0;

  void setTab(int index) => state = index;
}

class SelectedDifficultyNotifier extends Notifier<String> {
  @override
  String build() => 'All';

  void setFilter(String filter) => state = filter;
}

class CurrentUserNotifier extends Notifier<UserModel> {
  @override
  UserModel build() => userFree;

  void setPremium(bool isPremium) {
    state = state.copyWith(isPremium: isPremium);
  }

  void setUser(UserModel user) => state = user;
}

class QuizAccessFilterNotifier extends Notifier<QuizAccessFilter> {
  @override
  QuizAccessFilter build() => QuizAccessFilter.all;

  void setFilter(QuizAccessFilter filter) => state = filter;
}

class BoolToggleNotifier extends Notifier<bool> {
  BoolToggleNotifier({required this.initialState});

  final bool initialState;

  @override
  bool build() => initialState;

  void setValue(bool value) => state = value;

  void toggle() => state = !state;
}
