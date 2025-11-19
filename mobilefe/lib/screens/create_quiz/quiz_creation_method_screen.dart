import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobilefe/screens/create_quiz/quiz_creation_models.dart';

class QuizCreationMethodScreen extends StatefulWidget {
  const QuizCreationMethodScreen({super.key, required this.quizType});

  final QuizType quizType;

  @override
  State<QuizCreationMethodScreen> createState() =>
      _QuizCreationMethodScreenState();
}

class _QuizCreationMethodScreenState extends State<QuizCreationMethodScreen> {
  final TextEditingController _promptController = TextEditingController();
  final TextEditingController _manualTitleController = TextEditingController();
  final TextEditingController _manualDescriptionController =
      TextEditingController();

  bool _isGenerating = false;
  String? _generationSummary;
  String? _uploadedFile;
  bool _isPremiumQuiz = false;

  @override
  void dispose() {
    _promptController.dispose();
    _manualTitleController.dispose();
    _manualDescriptionController.dispose();
    super.dispose();
  }

  Future<void> _simulateGeneration() async {
    if (_isGenerating) return;
    setState(() {
      _isGenerating = true;
      _generationSummary = null;
    });
    await Future<void>.delayed(const Duration(seconds: 3));
    if (!mounted) return;
    setState(() {
      _isGenerating = false;
      _generationSummary =
          'AI generated 10 questions with auto-graded answers for ${widget.quizType.title}.';
    });
  }

  void _selectFile() {
    setState(() {
      _uploadedFile = 'mock_course_outline.pdf';
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text('Create ${widget.quizType.title}'),
          bottom: const TabBar(
            tabs: <Widget>[
              Tab(text: 'AI generation'),
              Tab(text: 'Manual entry'),
            ],
          ),
        ),
        body: TabBarView(
          children: <Widget>[_buildAiTab(context), _buildManualTab(context)],
        ),
      ),
    );
  }

  Widget _buildAiTab(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          TextField(
            controller: _promptController,
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Describe the quiz you want',
              hintText: 'Example: “Create a 15-question IELTS vocabulary quiz”',
            ),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: _selectFile,
            child: DottedBorder(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 32),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    const Icon(LucideIcons.uploadCloud, size: 32),
                    const SizedBox(height: 8),
                    Text(
                      _uploadedFile ?? 'Upload PDF/Docx reference (optional)',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap to select a file',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _isGenerating ? null : _simulateGeneration,
              icon: _isGenerating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(LucideIcons.sparkles),
              label: Text(
                _isGenerating ? 'Generating...' : 'Generate quiz by AI',
              ),
            ),
          ),
          if (_generationSummary != null) ...<Widget>[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFE0F2FE),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Icon(LucideIcons.bot, color: Color(0xFF0369A1)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _generationSummary!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildManualTab(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          TextField(
            controller: _manualTitleController,
            decoration: const InputDecoration(labelText: 'Quiz title'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _manualDescriptionController,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(labelText: 'Description'),
          ),
          const SizedBox(height: 12),
          CheckboxListTile(
            value: _isPremiumQuiz,
            onChanged: (value) =>
                setState(() => _isPremiumQuiz = value ?? false),
            title: const Text('Is this a Premium quiz?'),
            subtitle: const Text(
              'Only premium learners can attempt this quiz when enabled.',
            ),
          ),
          const SizedBox(height: 16),
          Text('Questions', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          _QuestionPlaceholder(
            title: 'Question 1: Multiple choice template',
            subtitle: '4 options · 1 correct answer',
          ),
          const SizedBox(height: 12),
          _QuestionPlaceholder(
            title: 'Question 2: Fill in the blanks',
            subtitle: 'Text-based answer · 2 keywords',
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(LucideIcons.plus),
            label: const Text('Add question'),
          ),
        ],
      ),
    );
  }
}

class _QuestionPlaceholder extends StatelessWidget {
  const _QuestionPlaceholder({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: <Widget>[
          const Icon(LucideIcons.listChecks),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronRight),
        ],
      ),
    );
  }
}

class DottedBorder extends StatelessWidget {
  const DottedBorder({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFD0D5DD),
          style: BorderStyle.solid,
          width: 1,
        ),
      ),
      child: child,
    );
  }
}
