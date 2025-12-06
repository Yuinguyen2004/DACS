import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/models/activity_model.dart';

class RecentActivityTile extends StatelessWidget {
  const RecentActivityTile({super.key, required this.activity});

  final ActivityModel activity;

  Color _statusColor(ActivityStatus status) {
    switch (status) {
      case ActivityStatus.completed:
        return Colors.green;
      case ActivityStatus.inProgress:
        return Colors.orange;
    }
  }

  String _statusLabel(ActivityStatus status) {
    switch (status) {
      case ActivityStatus.completed:
        return 'Completed';
      case ActivityStatus.inProgress:
        return 'In Progress';
    }
  }

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: <Widget>[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.indigo.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(LucideIcons.clipboardCheck),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(activity.quizTitle, style: textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Score: ${activity.score} · ${_statusLabel(activity.status)}',
                  style: textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              Text(
                '${activity.completedOn.hour.toString().padLeft(2, '0')}:${activity.completedOn.minute.toString().padLeft(2, '0')}',
                style: textTheme.bodySmall,
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: _statusColor(activity.status).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  _statusLabel(activity.status),
                  style: textTheme.bodySmall?.copyWith(
                    color: _statusColor(activity.status),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
