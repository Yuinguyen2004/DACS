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

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? avatarUrl,
    String? level,
    int? points,
    int? quizzesTaken,
    double? averageScore,
    bool? isPremium,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      level: level ?? this.level,
      points: points ?? this.points,
      quizzesTaken: quizzesTaken ?? this.quizzesTaken,
      averageScore: averageScore ?? this.averageScore,
      isPremium: isPremium ?? this.isPremium,
    );
  }
}
