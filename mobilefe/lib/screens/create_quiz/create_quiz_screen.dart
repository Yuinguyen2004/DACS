import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/models/create_quiz_models.dart';

class CreateQuizScreen extends ConsumerStatefulWidget {
  const CreateQuizScreen({super.key});

  @override
  ConsumerState<CreateQuizScreen> createState() => _CreateQuizScreenState();
}

class _CreateQuizScreenState extends ConsumerState<CreateQuizScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _timeLimitController = TextEditingController(text: '30');

  final List<_QuestionData> _questions = <_QuestionData>[];
  bool _isPremium = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  // AI Generation - support both web and mobile
  PlatformFile? _selectedPlatformFile; // For web compatibility
  bool _isProcessingAI = false;
  final TextEditingController _questionCountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _questions.add(_QuestionData());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _timeLimitController.dispose();
    _questionCountController.dispose();
    for (final question in _questions) {
      question.dispose();
    }
    super.dispose();
  }

  void _addQuestion() {
    setState(() => _questions.add(_QuestionData()));
  }

  void _removeQuestion(int index) {
    if (_questions.length > 1) {
      setState(() {
        _questions[index].dispose();
        _questions.removeAt(index);
      });
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'docx'],
        withData: kIsWeb, // Load file data for web
      );

      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedPlatformFile = result.files.first;
        });
      }
    } catch (e) {
      _showError('Error picking file: $e');
    }
  }

  Future<void> _processFileWithAI() async {
    if (_selectedPlatformFile == null) {
      _showError('Please select a file first');
      return;
    }

    setState(() {
      _isProcessingAI = true;
      _errorMessage = null;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final questionCount = int.tryParse(_questionCountController.text);

      final result = await apiService.processFileWithAI(
        platformFile: _selectedPlatformFile!,
        desiredQuestionCount: questionCount,
      );

      // Populate form with AI results
      if (mounted) {
        setState(() {
          _titleController.text = result['title'] ?? '';
          _descriptionController.text = result['description'] ?? '';

          // Clear existing questions and add AI-generated ones
          for (final q in _questions) {
            q.dispose();
          }
          _questions.clear();

          final aiQuestions = result['questions'] as List<dynamic>;
          for (final q in aiQuestions) {
            final questionData = _QuestionData();
            questionData.contentController.text = q['text'] ?? '';

            // Clear default empty answers first
            for (final answer in questionData.answers) {
              answer.dispose();
            }
            questionData.answers.clear();

            // Add AI-generated answer options
            final options = q['options'] as List<dynamic>;
            final correctIndex = q['correctAnswerIndex'] as int;

            for (int i = 0; i < options.length; i++) {
              questionData.answers.add(_AnswerData(
                content: options[i],
                isCorrect: i == correctIndex,
              ));
            }

            _questions.add(questionData);
          }

          _isProcessingAI = false;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Generated ${_questions.length} questions from file'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isProcessingAI = false;
        });
        _showError('AI processing failed: $e');
      }
    }
  }

  Future<void> _submitQuiz() async {
    // Validation
    if (_titleController.text.trim().isEmpty) {
      _showError('Please enter a quiz title');
      return;
    }

    if (_questions.isEmpty) {
      _showError('Please add at least one question');
      return;
    }

    for (int i = 0; i < _questions.length; i++) {
      final q = _questions[i];
      if (q.contentController.text.trim().isEmpty) {
        _showError('Question ${i + 1} is empty');
        return;
      }
      if (q.answers.length < 2) {
        _showError('Question ${i + 1} needs at least 2 answers');
        return;
      }
      if (!q.answers.any((a) => a.isCorrect)) {
        _showError('Question ${i + 1} needs a correct answer');
        return;
      }
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final apiService = ref.read(apiServiceProvider);

      // Step 1: Create quiz
      final quizData = await apiService.createQuiz(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        timeLimit: int.tryParse(_timeLimitController.text) ?? 30,
        isPremium: _isPremium,
      );

      final quizId = quizData['_id'];

      // Step 2: Create questions and answers
      for (final questionData in _questions) {
        final questionResponse = await apiService.createQuestion(
          quizId: quizId,
          content: questionData.contentController.text.trim(),
          type: 'mcq',
          image: questionData.imageUrl,
        );

        final questionId = questionResponse['_id'];

        // Step 3: Create answers for this question
        for (final answer in questionData.answers) {
          await apiService.createAnswer(
            questionId: questionId,
            content: answer.contentController.text.trim(),
            isCorrect: answer.isCorrect,
          );
        }
      }

      if (mounted) {
        // Invalidate quiz list to refresh homepage
        ref.invalidate(quizListProvider);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Quiz created successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
        _showError('Failed to create quiz: $e');
      }
    }
  }

  void _showError(String message) {
    setState(() {
      _errorMessage = message;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  InputDecoration _outlinedDecoration(
    BuildContext context,
    String label, {
    String? hint,
  }) {
    final Color outline = Theme.of(context).colorScheme.outlineVariant;
    final Color focused = Theme.of(context).colorScheme.primary;
    final BorderRadius radius = BorderRadius.circular(16);
    return InputDecoration(
      labelText: label,
      hintText: hint,
      border: OutlineInputBorder(borderRadius: radius),
      enabledBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide(color: outline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide(color: focused, width: 1.8),
      ),
      filled: true,
      fillColor: Theme.of(context).colorScheme.surface,
      alignLabelWithHint: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Create Quiz'),
          bottom: const TabBar(
            tabs: <Widget>[
              Tab(text: 'Manual Creation'),
              Tab(text: 'AI Generation'),
            ],
          ),
          actions: [
            if (_isSubmitting)
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            else
              TextButton.icon(
                onPressed: _submitQuiz,
                icon: const Icon(LucideIcons.check),
                label: const Text('Create'),
              ),
          ],
        ),
        body: TabBarView(
          children: <Widget>[
            _buildManualTab(context),
            _buildAiTab(context),
          ],
        ),
      ),
    );
  }

  Widget _buildManualTab(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          if (_errorMessage != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.alertCircle, color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red))),
                ],
              ),
            ),
          TextField(
            controller: _titleController,
            decoration: _outlinedDecoration(
              context,
              'Quiz Title',
              hint: 'E.g. JavaScript Fundamentals',
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _descriptionController,
            minLines: 3,
            maxLines: 5,
            decoration: _outlinedDecoration(
              context,
              'Description',
              hint: 'What should learners expect from this quiz?',
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _timeLimitController,
                  keyboardType: TextInputType.number,
                  decoration: _outlinedDecoration(
                    context,
                    'Time Limit (minutes)',
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: CheckboxListTile(
                  title: const Text('Premium'),
                  value: _isPremium,
                  onChanged: (value) => setState(() => _isPremium = value ?? false),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Questions', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _questions.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: EdgeInsets.only(bottom: index == _questions.length - 1 ? 0 : 16),
                child: _QuestionCard(
                  question: _questions[index],
                  index: index,
                  decorationBuilder: _outlinedDecoration,
                  onRemove: () => _removeQuestion(index),
                  canRemove: _questions.length > 1,
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _addQuestion,
            icon: const Icon(LucideIcons.plus),
            label: const Text('Add Question'),
          ),
        ],
      ),
    );
  }

  Widget _buildAiTab(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Upload a document and let AI generate quiz questions',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),
          _FilePickerTile(
            file: _selectedPlatformFile,
            onTap: _pickFile,
            onRemove: () => setState(() => _selectedPlatformFile = null),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _questionCountController,
            keyboardType: TextInputType.number,
            decoration: _outlinedDecoration(
              context,
              'Desired Question Count (optional)',
              hint: '5-100',
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _isProcessingAI ? null : _processFileWithAI,
              icon: _isProcessingAI
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(LucideIcons.sparkles),
              label: Text(_isProcessingAI ? 'Processing...' : 'Generate Questions'),
            ),
          ),
          if (_isProcessingAI) ...[
            const SizedBox(height: 16),
            const LinearProgressIndicator(),
            const SizedBox(height: 8),
            const Text('AI is analyzing your document...'),
          ],
        ],
      ),
    );
  }
}

class _QuestionData {
  final TextEditingController contentController = TextEditingController();
  String? imageUrl;
  final List<_AnswerData> answers = [];

  _QuestionData() {
    // Initialize with 4 empty answers
    for (int i = 0; i < 4; i++) {
      answers.add(_AnswerData());
    }
  }

  void dispose() {
    contentController.dispose();
    for (final answer in answers) {
      answer.dispose();
    }
  }
}

class _AnswerData {
  final TextEditingController contentController = TextEditingController();
  bool isCorrect;

  _AnswerData({String? content, this.isCorrect = false}) {
    if (content != null) {
      contentController.text = content;
    }
  }

  void dispose() {
    contentController.dispose();
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.question,
    required this.index,
    required this.decorationBuilder,
    required this.onRemove,
    required this.canRemove,
  });

  final _QuestionData question;
  final int index;
  final InputDecoration Function(BuildContext, String, {String? hint}) decorationBuilder;
  final VoidCallback onRemove;
  final bool canRemove;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Text(
                  'Question ${index + 1}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                if (canRemove)
                  IconButton(
                    tooltip: 'Remove question',
                    onPressed: onRemove,
                    icon: const Icon(LucideIcons.trash2, color: Colors.red),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: question.contentController,
              minLines: 2,
              maxLines: 4,
              decoration: decorationBuilder(
                context,
                'Question Text',
                hint: 'Enter your question here',
              ),
            ),
            const SizedBox(height: 16),
            Text('Answer Options', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            ...List.generate(question.answers.length, (answerIndex) {
              final answer = question.answers[answerIndex];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Radio<int>(
                      value: answerIndex,
                      groupValue: question.answers.indexWhere((a) => a.isCorrect),
                      onChanged: (value) {
                        // Mark this as correct, others as incorrect
                        for (int i = 0; i < question.answers.length; i++) {
                          question.answers[i].isCorrect = i == value;
                        }
                        // Force rebuild
                        (context as Element).markNeedsBuild();
                      },
                    ),
                    Expanded(
                      child: TextField(
                        controller: answer.contentController,
                        decoration: InputDecoration(
                          hintText: 'Answer ${answerIndex + 1}',
                          border: const OutlineInputBorder(),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _FilePickerTile extends StatelessWidget {
  const _FilePickerTile({
    required this.file,
    required this.onTap,
    required this.onRemove,
  });

  final PlatformFile? file;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final BorderRadius radius = BorderRadius.circular(20);
    return InkWell(
      borderRadius: radius,
      onTap: file == null ? onTap : null,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: radius,
          border: Border.all(
            color: Theme.of(context).colorScheme.outlineVariant,
            style: BorderStyle.solid,
            width: 2,
          ),
          color: Theme.of(context).colorScheme.surface,
        ),
        child: file == null
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  const Icon(LucideIcons.uploadCloud, size: 32),
                  const SizedBox(height: 12),
                  Text(
                    'Tap to upload PDF/DOCX',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Max 5MB',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              )
            : Row(
                children: <Widget>[
                  const Icon(LucideIcons.file, size: 32),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          file!.name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${(file!.size / 1024).toStringAsFixed(1)} KB',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    onPressed: onRemove,
                    icon: const Icon(LucideIcons.x),
                    label: const Text('Remove'),
                  ),
                ],
              ),
      ),
    );
  }
}
