class NotificationModel {
  final String id;
  final String title;
  final String content;
  final bool isRead;
  final String type;
  final Map<String, dynamic>? data;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.content,
    required this.isRead,
    required this.type,
    this.data,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      isRead: json['isRead'] ?? false,
      type: json['type'] ?? 'system',
      data: json['data'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}
