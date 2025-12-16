import 'package:flutter/material.dart';
import 'package:mobilefe/config/app_theme.dart';

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.leading,
    this.backgroundColor,
    this.foregroundColor,
    this.isDestructive = false,
    this.size = PrimaryButtonSize.medium,
    this.isLoading = false,
  });

  final String label;
  final VoidCallback onPressed;
  final Widget? leading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool isDestructive;
  final PrimaryButtonSize size;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final Color bgColor = backgroundColor ??
        (isDestructive ? theme.colorScheme.error : AppTheme.primaryVibrant);
    final Color fgColor = foregroundColor ?? Colors.white;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(_getBorderRadius()),
          splashColor: fgColor.withOpacity(0.1),
          highlightColor: fgColor.withOpacity(0.05),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            padding: _getPadding(),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isLoading
                    ? [bgColor.withOpacity(0.7), bgColor.withOpacity(0.5)]
                    : [bgColor, bgColor.withOpacity(0.9)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(_getBorderRadius()),
              boxShadow: onPressed != null && !isLoading
                  ? [
                      BoxShadow(
                        color: bgColor.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (leading != null && !isLoading) ...[
                  IconTheme(
                    data: IconThemeData(
                      color: fgColor,
                      size: _getIconSize(),
                    ),
                    child: leading!,
                  ),
                  SizedBox(width: _getSpacing()),
                ],
                if (isLoading)
                  SizedBox(
                    width: _getIconSize(),
                    height: _getIconSize(),
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(fgColor),
                    ),
                  ),
                if (isLoading) SizedBox(width: _getSpacing()),
                Text(
                  label,
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: fgColor,
                    fontSize: _getFontSize(),
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  double _getBorderRadius() {
    switch (size) {
      case PrimaryButtonSize.small:
        return 12;
      case PrimaryButtonSize.medium:
        return 16;
      case PrimaryButtonSize.large:
        return 20;
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case PrimaryButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 10);
      case PrimaryButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 16);
      case PrimaryButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 32, vertical: 20);
    }
  }

  double _getFontSize() {
    switch (size) {
      case PrimaryButtonSize.small:
        return 14;
      case PrimaryButtonSize.medium:
        return 16;
      case PrimaryButtonSize.large:
        return 18;
    }
  }

  double _getIconSize() {
    switch (size) {
      case PrimaryButtonSize.small:
        return 16;
      case PrimaryButtonSize.medium:
        return 20;
      case PrimaryButtonSize.large:
        return 24;
    }
  }

  double _getSpacing() {
    switch (size) {
      case PrimaryButtonSize.small:
        return 8;
      case PrimaryButtonSize.medium:
        return 12;
      case PrimaryButtonSize.large:
        return 16;
    }
  }
}

enum PrimaryButtonSize {
  small,
  medium,
  large,
}
