import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// A widget that allows users to pick an image for quiz thumbnail.
/// Returns the image as a base64 data URL string.
class QuizThumbnailPicker extends StatefulWidget {
  const QuizThumbnailPicker({
    super.key,
    this.initialImage,
    required this.onImageChanged,
  });

  /// Initial image as base64 data URL or network URL
  final String? initialImage;

  /// Callback when image changes (returns base64 data URL or null if removed)
  final ValueChanged<String?> onImageChanged;

  @override
  State<QuizThumbnailPicker> createState() => _QuizThumbnailPickerState();
}

class _QuizThumbnailPickerState extends State<QuizThumbnailPicker> {
  final ImagePicker _picker = ImagePicker();
  String? _imageBase64;
  Uint8List? _imageBytes;
  bool _isLoading = false;

  // Max file size: 2MB
  static const int _maxFileSizeBytes = 2 * 1024 * 1024;
  // Max dimensions for compression
  static const double _maxWidth = 800;
  static const double _maxHeight = 800;
  // JPEG quality for compression
  static const int _imageQuality = 80;

  @override
  void initState() {
    super.initState();
    _imageBase64 = widget.initialImage;
    _loadInitialImage();
  }

  void _loadInitialImage() {
    if (_imageBase64 != null && _imageBase64!.startsWith('data:image')) {
      try {
        final parts = _imageBase64!.split(',');
        if (parts.length == 2) {
          _imageBytes = base64Decode(parts[1]);
        }
      } catch (e) {
        debugPrint('Error loading initial image: $e');
      }
    }
  }

  Future<void> _showImageSourcePicker() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Select Image Source',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    LucideIcons.image,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                title: const Text('Gallery'),
                subtitle: const Text('Choose from your photos'),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    LucideIcons.camera,
                    color: Theme.of(context).colorScheme.secondary,
                  ),
                ),
                title: const Text('Camera'),
                subtitle: const Text('Take a new photo'),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
            ],
          ),
        ),
      ),
    );

    if (source != null) {
      await _pickImage(source);
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    setState(() => _isLoading = true);

    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: _maxWidth,
        maxHeight: _maxHeight,
        imageQuality: _imageQuality,
      );

      if (pickedFile == null) {
        setState(() => _isLoading = false);
        return;
      }

      // Read file bytes
      final Uint8List bytes = await pickedFile.readAsBytes();

      // Check file size
      if (bytes.length > _maxFileSizeBytes) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Image is too large. Maximum size is 2MB.'),
              backgroundColor: Colors.red,
            ),
          );
        }
        setState(() => _isLoading = false);
        return;
      }

      // Determine MIME type
      String mimeType = 'image/jpeg';
      final extension = pickedFile.name.toLowerCase().split('.').last;
      if (extension == 'png') {
        mimeType = 'image/png';
      } else if (extension == 'gif') {
        mimeType = 'image/gif';
      } else if (extension == 'webp') {
        mimeType = 'image/webp';
      }

      // Convert to base64 data URL
      final base64String = base64Encode(bytes);
      final dataUrl = 'data:$mimeType;base64,$base64String';

      setState(() {
        _imageBytes = bytes;
        _imageBase64 = dataUrl;
        _isLoading = false;
      });

      widget.onImageChanged(dataUrl);
    } catch (e) {
      debugPrint('Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick image: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
      setState(() => _isLoading = false);
    }
  }

  void _removeImage() {
    setState(() {
      _imageBytes = null;
      _imageBase64 = null;
    });
    widget.onImageChanged(null);
  }

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(16);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quiz Thumbnail',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        InkWell(
          borderRadius: borderRadius,
          onTap: _isLoading ? null : _showImageSourcePicker,
          child: Container(
            width: double.infinity,
            height: 160,
            decoration: BoxDecoration(
              borderRadius: borderRadius,
              border: Border.all(
                color: Theme.of(context).colorScheme.outlineVariant,
                width: 2,
                style: _imageBytes == null ? BorderStyle.solid : BorderStyle.none,
              ),
              color: Theme.of(context).colorScheme.surface,
            ),
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(),
                  )
                : _imageBytes != null
                    ? Stack(
                        fit: StackFit.expand,
                        children: [
                          ClipRRect(
                            borderRadius: borderRadius,
                            child: Image.memory(
                              _imageBytes!,
                              fit: BoxFit.cover,
                            ),
                          ),
                          // Overlay gradient
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: borderRadius,
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.black.withOpacity(0.5),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                          // Action buttons
                          Positioned(
                            bottom: 8,
                            right: 8,
                            child: Row(
                              children: [
                                _ActionButton(
                                  icon: LucideIcons.pencil,
                                  onTap: _showImageSourcePicker,
                                  tooltip: 'Change image',
                                ),
                                const SizedBox(width: 8),
                                _ActionButton(
                                  icon: LucideIcons.trash2,
                                  onTap: _removeImage,
                                  tooltip: 'Remove image',
                                  isDestructive: true,
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            LucideIcons.imagePlus,
                            size: 40,
                            color: Theme.of(context).colorScheme.primary.withOpacity(0.7),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Tap to add thumbnail',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Theme.of(context).colorScheme.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Max 2MB (JPEG, PNG)',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Theme.of(context).colorScheme.outline,
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

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.onTap,
    required this.tooltip,
    this.isDestructive = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isDestructive ? Colors.red : Colors.white,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Tooltip(
          message: tooltip,
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Icon(
              icon,
              size: 18,
              color: isDestructive ? Colors.white : Colors.black87,
            ),
          ),
        ),
      ),
    );
  }
}
