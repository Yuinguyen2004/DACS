import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class CreateQuizScreen extends StatefulWidget {
  const CreateQuizScreen({super.key});

  @override
  State<CreateQuizScreen> createState() => _CreateQuizScreenState();
}

class _CreateQuizScreenState extends State<CreateQuizScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _promptController = TextEditingController();

  final List<_ManualQuestion> _questions = <_ManualQuestion>[];

  bool _hasCoverImage = false;
  String? _uploadedFileName;

  @override
  void initState() {
    super.initState();
    _questions.add(_ManualQuestion());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _promptController.dispose();
    for (final _ManualQuestion question in _questions) {
      question.dispose();
    }
    super.dispose();
  }

  void _toggleCoverImage() {
    setState(() => _hasCoverImage = !_hasCoverImage);
  }

  void _addQuestion() {
    setState(() => _questions.add(_ManualQuestion()));
  }

  void _toggleQuestionMedia(int index) {
    setState(() => _questions[index].showMedia = !_questions[index].showMedia);
  }

  void _handleUploadTap() {
    if (_uploadedFileName != null) return;
    setState(() => _uploadedFileName = 'demo_document.pdf');
  }

  void _removeUpload() {
    setState(() => _uploadedFileName = null);
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
          title: const Text('Create hybrid quiz'),
          bottom: const TabBar(
            tabs: <Widget>[
              Tab(text: 'Manual creation'),
              Tab(text: 'AI generation'),
            ],
          ),
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
          TextField(
            controller: _titleController,
            decoration: _outlinedDecoration(
              context,
              'Quiz title',
              hint: 'E.g. IELTS Academic hybrid practice',
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
          _CoverImagePicker(
            hasImage: _hasCoverImage,
            onTap: _toggleCoverImage,
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
                  onToggleMedia: () => _toggleQuestionMedia(index),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _addQuestion,
            icon: const Icon(LucideIcons.plus),
            label: const Text('Add question'),
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
          TextField(
            controller: _promptController,
            minLines: 5,
            maxLines: 8,
            decoration: _outlinedDecoration(
              context,
              'Tell AI what to build',
              hint:
                  'Example: “Create 10 hybrid science questions mixing images and text prompts for grade 8.”',
            ),
          ),
          const SizedBox(height: 20),
          _DottedUploadTile(
            fileName: _uploadedFileName,
            onTap: _handleUploadTap,
            onRemove: _removeUpload,
          ),
        ],
      ),
    );
  }
}

class _CoverImagePicker extends StatelessWidget {
  const _CoverImagePicker({
    required this.hasImage,
    required this.onTap,
  });

  final bool hasImage;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final Color outline = Theme.of(context).colorScheme.outlineVariant;
    final Color primary = Theme.of(context).colorScheme.primary;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text('Cover image', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Ink(
            height: 160,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: hasImage ? primary : outline,
                width: 1.5,
              ),
                color: hasImage
                  ? primary.withValues(alpha: 0.08)
                  : Theme.of(context).colorScheme.surface,
            ),
            child: Stack(
              children: <Widget>[
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      Icon(
                        hasImage ? LucideIcons.image : LucideIcons.imagePlus,
                        size: 34,
                        color: primary,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        hasImage
                            ? 'Mock cover image selected'
                            : 'Tap to add cover image',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
                if (hasImage)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: IconButton.filledTonal(
                      onPressed: onTap,
                      icon: const Icon(LucideIcons.x),
                      tooltip: 'Remove cover image',
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.question,
    required this.index,
    required this.decorationBuilder,
    required this.onToggleMedia,
  });

  final _ManualQuestion question;
  final int index;
  final InputDecoration Function(BuildContext, String, {String? hint})
      decorationBuilder;
  final VoidCallback onToggleMedia;

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
                IconButton(
                  tooltip:
                      question.showMedia ? 'Hide image placeholder' : 'Add image',
                  onPressed: onToggleMedia,
                  icon: Icon(
                    question.showMedia ? LucideIcons.x : LucideIcons.image,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: question.promptController,
              minLines: 3,
              maxLines: 4,
              decoration: decorationBuilder(
                context,
                'Question text',
                hint: 'Add a prompt or scenario for learners to answer.',
              ),
            ),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: question.showMedia
                  ? Padding(
                      key: const ValueKey('media'),
                      padding: const EdgeInsets.only(top: 16),
                      child: Container(
                        width: double.infinity,
                        height: 150,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outlineVariant,
                          ),
                            color: Theme.of(context)
                              .colorScheme
                              .surfaceContainerHighest,
                        ),
                        child: Stack(
                          children: <Widget>[
                            Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: <Widget>[
                                  const Icon(LucideIcons.image, size: 32),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Hybrid image placeholder',
                                    style:
                                        Theme.of(context).textTheme.bodyMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Tap the image icon to remove',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ManualQuestion {
  _ManualQuestion() : promptController = TextEditingController();

  final TextEditingController promptController;
  bool showMedia = false;

  void dispose() {
    promptController.dispose();
  }
}

class _DottedUploadTile extends StatelessWidget {
  const _DottedUploadTile({
    required this.fileName,
    required this.onTap,
    required this.onRemove,
  });

  final String? fileName;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final BorderRadius radius = BorderRadius.circular(20);
    return InkWell(
      borderRadius: radius,
      onTap: fileName == null ? onTap : null,
      child: Ink(
        decoration: BoxDecoration(borderRadius: radius),
        child: _DottedBorder(
          borderRadius: radius,
          color: Theme.of(context).colorScheme.outlineVariant,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: radius,
              color: Theme.of(context).colorScheme.surface,
            ),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: fileName == null
                  ? Column(
                      key: const ValueKey('empty'),
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        const Icon(LucideIcons.uploadCloud, size: 32),
                        const SizedBox(height: 12),
                        Text(
                          'Tap to upload PDF/Docs',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Share lesson plans or study notes to guide AI.',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    )
                  : Row(
                      key: const ValueKey('file'),
                      children: <Widget>[
                        const Icon(LucideIcons.file, size: 32),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                fileName!,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Attached mock reference document',
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
          ),
        ),
      ),
    );
  }
}

class _DottedBorder extends StatelessWidget {
  const _DottedBorder({
    required this.child,
    required this.borderRadius,
    required this.color,
  });

  final Widget child;
  final BorderRadius borderRadius;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: borderRadius,
      child: CustomPaint(
        painter: _DottedBorderPainter(color: color, radius: borderRadius.topLeft),
        child: child,
      ),
    );
  }
}

class _DottedBorderPainter extends CustomPainter {
  const _DottedBorderPainter({required this.color, required this.radius});

  final Color color;
  final Radius radius;

  @override
  void paint(Canvas canvas, Size size) {
    final RRect rRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      radius,
    );
    final ui.Path path = ui.Path()..addRRect(rRect);
    final Paint paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    const double dash = 6;
    const double gap = 4;
    for (final ui.PathMetric metric in path.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        final double next = distance + dash;
        final double end = next.clamp(0, metric.length).toDouble();
        canvas.drawPath(metric.extractPath(distance, end), paint);
        distance = end + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
