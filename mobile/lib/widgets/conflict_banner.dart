import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/sync_service.dart';
import '../core/theme.dart';
import '../screens/conflict_review_screen.dart';

/// A small banner widget that appears when there are unresolved sync conflicts.
/// Place this at the top of screens where conflicts should be visible.
class ConflictBanner extends ConsumerWidget {
  const ConflictBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conflictCount = ref.watch(unresolvedConflictCountProvider);

    if (conflictCount == 0) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ConflictReviewScreen()),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: AppColors.warningBg,
          borderRadius: AppRadius.borderLg,
          border: Border.all(color: AppColors.warning.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(
              Icons.warning_amber_rounded,
              size: 18,
              color: Colors.orange[700],
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                conflictCount == 1
                    ? '1 conflict needs review'
                    : '$conflictCount conflicts need review',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.orange[800],
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              size: 18,
              color: Colors.orange[700],
            ),
          ],
        ),
      ),
    );
  }
}

/// Compact version of the conflict banner for use in app bars
class ConflictBadge extends ConsumerWidget {
  const ConflictBadge({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conflictCount = ref.watch(unresolvedConflictCountProvider);

    if (conflictCount == 0) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ConflictReviewScreen()),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: Colors.orange.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.warning_amber, size: 14, color: Colors.orange[700]),
            const SizedBox(width: 4),
            Text(
              '$conflictCount',
              style: TextStyle(
                fontSize: 12,
                color: Colors.orange[700],
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
