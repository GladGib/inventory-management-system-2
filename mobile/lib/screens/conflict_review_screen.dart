import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/sync_service.dart';
import '../core/theme.dart';

class ConflictReviewScreen extends ConsumerWidget {
  const ConflictReviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conflictState = ref.watch(conflictSyncProvider);
    final conflicts = conflictState.conflicts;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sync Conflicts'),
        actions: [
          if (conflicts.any((c) =>
              c.resolution != null &&
              c.resolution != ConflictResolution.pending))
            TextButton(
              onPressed: () {
                ref.read(conflictSyncProvider.notifier).dismissResolved();
              },
              child: const Text('Clear Resolved'),
            ),
        ],
      ),
      body: conflicts.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.check_circle_outline,
                    size: 64,
                    color: AppColors.success,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No conflicts',
                    style: AppTypography.h4,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'All data is in sync.',
                    style: AppTypography.small,
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: conflicts.length,
              itemBuilder: (context, index) {
                final conflict = conflicts[index];
                return _ConflictCard(
                  conflict: conflict,
                  onResolve: (resolution) {
                    ref
                        .read(conflictSyncProvider.notifier)
                        .resolveConflict(conflict.id, resolution);
                  },
                );
              },
            ),
    );
  }
}

class _ConflictCard extends StatelessWidget {
  final SyncConflict conflict;
  final ValueChanged<ConflictResolution> onResolve;

  const _ConflictCard({
    required this.conflict,
    required this.onResolve,
  });

  @override
  Widget build(BuildContext context) {
    final isResolved = conflict.resolution != null &&
        conflict.resolution != ConflictResolution.pending;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.borderLg,
        side: BorderSide(
          color: isResolved ? AppColors.success : AppColors.warning,
          width: isResolved ? 1 : 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  isResolved
                      ? Icons.check_circle
                      : Icons.warning_amber_rounded,
                  color: isResolved ? AppColors.success : AppColors.warning,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        conflict.entityName,
                        style: AppTypography.bodyMedium,
                      ),
                      Text(
                        '${_formatEntityType(conflict.entityType)} - Detected ${_formatTime(conflict.detectedAt)}',
                        style: AppTypography.caption,
                      ),
                    ],
                  ),
                ),
                if (isResolved)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.successBg,
                      borderRadius: AppRadius.borderFull,
                    ),
                    child: Text(
                      _formatResolution(conflict.resolution!),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: AppColors.success,
                      ),
                    ),
                  ),
              ],
            ),

            if (!isResolved) ...[
              const Divider(height: 24),

              // Local vs Server comparison
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Local data column
                  Expanded(
                    child: _DataColumn(
                      title: 'Your Changes',
                      color: AppColors.primary,
                      data: conflict.localData,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Server data column
                  Expanded(
                    child: _DataColumn(
                      title: 'Server Data',
                      color: Colors.purple,
                      data: conflict.serverData,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Resolution buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          onResolve(ConflictResolution.keepLocal),
                      icon: const Icon(Icons.phone_android, size: 16),
                      label: const Text('Keep Mine'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          onResolve(ConflictResolution.keepServer),
                      icon: const Icon(Icons.cloud, size: 16),
                      label: const Text('Keep Server'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.purple,
                        side: const BorderSide(color: Colors.purple),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () =>
                          onResolve(ConflictResolution.merge),
                      icon: const Icon(Icons.merge, size: 16),
                      label: const Text('Merge'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatEntityType(String type) {
    switch (type) {
      case 'pick_list':
        return 'Pick List';
      case 'grn':
        return 'Goods Received';
      case 'stock_count':
        return 'Stock Count';
      case 'stock_adjustment':
        return 'Stock Adjustment';
      default:
        return type;
    }
  }

  String _formatResolution(ConflictResolution resolution) {
    switch (resolution) {
      case ConflictResolution.keepLocal:
        return 'Kept Local';
      case ConflictResolution.keepServer:
        return 'Kept Server';
      case ConflictResolution.merge:
        return 'Merged';
      default:
        return 'Pending';
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _DataColumn extends StatelessWidget {
  final String title;
  final Color color;
  final Map<String, dynamic> data;

  const _DataColumn({
    required this.title,
    required this.color,
    required this.data,
  });

  @override
  Widget build(BuildContext context) {
    // Show only the most relevant fields
    final displayKeys = _getDisplayKeys(data);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: AppRadius.borderMd,
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          const SizedBox(height: 8),
          ...displayKeys.map((key) {
            final value = data[key];
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_formatKey(key)}: ',
                    style: AppTypography.caption.copyWith(fontSize: 11),
                  ),
                  Expanded(
                    child: Text(
                      _formatValue(value),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  /// Get the most relevant keys to display (skip internal fields)
  List<String> _getDisplayKeys(Map<String, dynamic> data) {
    const skipKeys = {
      'id',
      'createdAt',
      'updatedAt',
      'organizationId',
      'version',
    };

    return data.keys
        .where((k) => !skipKeys.contains(k))
        .take(5)
        .toList();
  }

  String _formatKey(String key) {
    // Convert camelCase to readable format
    return key
        .replaceAllMapped(
          RegExp(r'[A-Z]'),
          (match) => ' ${match.group(0)}',
        )
        .trim()
        .split(' ')
        .map((w) => w.isNotEmpty
            ? '${w[0].toUpperCase()}${w.substring(1)}'
            : w)
        .join(' ');
  }

  String _formatValue(dynamic value) {
    if (value == null) return '-';
    if (value is Map || value is List) return '...';
    return value.toString();
  }
}
