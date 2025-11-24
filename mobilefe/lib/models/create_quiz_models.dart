/// Models for quiz creation flow
class QuizCreationData {
  String title;
  String description;
  int timeLimit; // in minutes
  bool isPremium;
  String? image;
  List<QuestionCreationData> questions;

  QuizCreationData({
    required this.title,
    this.description = '',
    this.timeLimit = 30,
    this.isPremium = false,
    this.image,
    List<QuestionCreationData>? questions,
  }) : questions = questions ?? [];

  Map<String, dynamic> toJson() => {
        'title': title,
        'description': description,
        'time_limit': timeLimit,
        'is_premium': isPremium,
        if (image != null) 'image': image,
      };
}

class QuestionCreationData {
  String content;
  String type; // 'mcq' or 'true_false'
  String? image;
  List<AnswerData> answers;

  QuestionCreationData({
    required this.content,
    this.type = 'mcq',
    this.image,
    List<AnswerData>? answers,
  }) : answers = answers ?? [];

  Map<String, dynamic> toJson() => {
        'content': content,
        'type': type,
        if (image != null) 'image': image,
      };
}

class AnswerData {
  String id; // temporary ID for frontend tracking
  String content;
  bool isCorrect;

  AnswerData({
    required this.id,
    required this.content,
    this.isCorrect = false,
  });

  Map<String, dynamic> toJson() => {
        'content': content,
        'is_correct': isCorrect,
      };
}
