import 'package:mobilefe/models/quiz_leaderboard_entry.dart';

class QuizLeaderboard {
  const QuizLeaderboard({
    required this.quizId,
    required this.entries,
    required this.totalParticipants,
    this.quizTitle,
  });

  final String quizId;
  final String? quizTitle;
  final List<QuizLeaderboardEntry> entries;
  final int totalParticipants;

  factory QuizLeaderboard.fromJson(Map<String, dynamic> json) {
    final entriesList = json['entries'] as List<dynamic>? ?? [];
    return QuizLeaderboard(
      quizId: json['quizId']?.toString() ?? '',
      quizTitle: json['quizTitle'] as String?,
      totalParticipants: (json['totalParticipants'] as num?)?.toInt() ?? 0,
      entries: entriesList
          .map((e) => QuizLeaderboardEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
