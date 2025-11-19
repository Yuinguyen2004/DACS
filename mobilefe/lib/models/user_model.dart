class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.avatarUrl,
    required this.level,
    required this.points,
    required this.quizzesTaken,
    required this.averageScore,
    required this.isPremium,
  });

  final String id;
  final String name;
  final String email;
  final String avatarUrl;
  final String level;
  final int points;
  final int quizzesTaken;
  final double averageScore;
  final bool isPremium;
}
