import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/offline/connectivity_service.dart';
import '../core/offline/sync_manager.dart';
import '../core/theme.dart';

/// Widget to display sync status in app bar
class SyncStatusWidget extends ConsumerWidget {
  const SyncStatusWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(onlineStatusProvider);
    final syncState = ref.watch(syncManagerProvider);

    if (!isOnline) {
      return _buildOfflineChip();
    }

    if (syncState.pendingCount > 0) {
      return _buildPendingSyncChip(context, ref, syncState.pendingCount);
    }

    if (syncState.status == SyncStatus.syncing) {
      return _buildSyncingChip();
    }

    return const SizedBox.shrink();
  }

  Widget _buildOfflineChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      margin: const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.cloud_off, size: 14, color: Colors.orange[700]),
          const SizedBox(width: 4),
          Text(
            'Offline',
            style: TextStyle(
              fontSize: 12,
              color: Colors.orange[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingSyncChip(BuildContext context, WidgetRef ref, int count) {
    return GestureDetector(
      onTap: () => _showSyncDialog(context, ref),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.sync, size: 14, color: AppTheme.primaryColor),
            const SizedBox(width: 4),
            Text(
              '$count pending',
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSyncingChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      margin: const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 4),
          Text(
            'Syncing...',
            style: TextStyle(
              fontSize: 12,
              color: Colors.blue,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  void _showSyncDialog(BuildContext context, WidgetRef ref) {
    final syncState = ref.read(syncManagerProvider);
    final syncManager = ref.read(syncManagerProvider.notifier);

    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sync Status',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.pending_actions),
                title: Text('${syncState.pendingCount} pending operations'),
                contentPadding: EdgeInsets.zero,
              ),
              if (syncState.failedCount > 0)
                ListTile(
                  leading: const Icon(Icons.error_outline, color: Colors.red),
                  title: Text('${syncState.failedCount} failed operations'),
                  contentPadding: EdgeInsets.zero,
                ),
              if (syncState.lastSync != null)
                ListTile(
                  leading: const Icon(Icons.access_time),
                  title: Text(
                    'Last sync: ${_formatDateTime(syncState.lastSync!)}',
                  ),
                  contentPadding: EdgeInsets.zero,
                ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        syncManager.downloadOfflineData();
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.download),
                      label: const Text('Download Data'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: syncState.pendingCount > 0
                          ? () {
                              syncManager.syncPending();
                              Navigator.pop(context);
                            }
                          : null,
                      icon: const Icon(Icons.sync),
                      label: const Text('Sync Now'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

/// Banner shown when offline
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(onlineStatusProvider);

    if (isOnline) return const SizedBox.shrink();

    return MaterialBanner(
      content: const Text('You are currently offline. Changes will be synced when online.'),
      backgroundColor: Colors.orange[50],
      leading: Icon(Icons.cloud_off, color: Colors.orange[700]),
      actions: [
        TextButton(
          onPressed: () => ref.read(syncManagerProvider.notifier).syncPending(),
          child: const Text('Retry'),
        ),
      ],
    );
  }
}
