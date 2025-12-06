import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/models/category_model.dart';

class CategoryChip extends StatelessWidget {
  const CategoryChip({super.key, required this.category});

  final CategoryModel category;

  IconData _iconFromName(String name) {
    switch (name) {
      case 'calculator':
        return LucideIcons.calculator;
      case 'atom':
        return LucideIcons.atom;
      case 'book-open-text':
        return LucideIcons.bookOpenCheck;
      case 'laptop':
        return LucideIcons.laptop;
      case 'library':
        return LucideIcons.library;
      case 'dna':
        return LucideIcons.dna;
      default:
        return LucideIcons.circle;
    }
  }

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.indigo.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(_iconFromName(category.icon), color: Colors.indigo),
          ),
          const SizedBox(height: 8),
          Text(category.name, style: textTheme.bodyMedium),
        ],
      ),
    );
  }
}
