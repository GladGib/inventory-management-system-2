import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api_client.dart';
import 'offline_storage.dart';
import 'sync_queue.dart';
import 'connectivity_service.dart';

/// Status of the sync process
enum SyncStatus {
  idle,
  syncing,
  success,
  error,
}

/// State for sync operations
class SyncState {
  final SyncStatus status;
  final int pendingCount;
  final int failedCount;
  final String? error;
  final DateTime? lastSync;

  SyncState({
    this.status = SyncStatus.idle,
    this.pendingCount = 0,
    this.failedCount = 0,
    this.error,
    this.lastSync,
  });

  SyncState copyWith({
    SyncStatus? status,
    int? pendingCount,
    int? failedCount,
    String? error,
    DateTime? lastSync,
    bool clearError = false,
  }) {
    return SyncState(
      status: status ?? this.status,
      pendingCount: pendingCount ?? this.pendingCount,
      failedCount: failedCount ?? this.failedCount,
      error: clearError ? null : (error ?? this.error),
      lastSync: lastSync ?? this.lastSync,
    );
  }
}

/// Manages offline sync operations
class SyncManager extends StateNotifier<SyncState> {
  final ApiClient _apiClient = ApiClient();
  late OfflineStorage _storage;
  late SyncQueue _queue;
  Timer? _syncTimer;

  SyncManager() : super(SyncState()) {
    _init();
  }

  Future<void> _init() async {
    _storage = await OfflineStorage.getInstance();
    _queue = await SyncQueue.getInstance();
    _updateCounts();

    // Set up periodic sync (every 30 seconds when online)
    _syncTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => syncPending(),
    );
  }

  void _updateCounts() {
    state = state.copyWith(
      pendingCount: _queue.pendingCount,
      failedCount: _queue.getFailed().length,
      lastSync: _storage.getLastSync(),
    );
  }

  /// Queue an operation for offline sync
  Future<String> queueOperation(
    SyncOperationType type,
    Map<String, dynamic> data,
  ) async {
    final id = await _queue.add(type, data);
    _updateCounts();
    return id;
  }

  /// Sync all pending operations
  Future<void> syncPending() async {
    if (state.status == SyncStatus.syncing) return;

    final pending = _queue.getPending();
    if (pending.isEmpty) return;

    state = state.copyWith(status: SyncStatus.syncing, clearError: true);

    int synced = 0;
    int failed = 0;

    for (final op in pending) {
      try {
        await _executeOperation(op);
        await _queue.complete(op.id);
        synced++;
      } catch (e) {
        await _queue.markFailed(op.id, e.toString());
        failed++;
      }
    }

    await _storage.setLastSync(DateTime.now());
    _updateCounts();

    state = state.copyWith(
      status: failed == 0 ? SyncStatus.success : SyncStatus.error,
      error: failed > 0 ? '$failed operations failed' : null,
    );
  }

  Future<void> _executeOperation(SyncOperation op) async {
    switch (op.type) {
      case SyncOperationType.processPickList:
        await _apiClient.dio.post(
          '/pick-lists/${op.data['pickListId']}/process',
          data: {'lines': op.data['lines']},
        );
        break;

      case SyncOperationType.createGRN:
        await _apiClient.dio.post(
          '/purchase-orders/${op.data['purchaseOrderId']}/receive',
          data: op.data['grnData'],
        );
        break;

      case SyncOperationType.recordStockCount:
        await _apiClient.dio.post(
          '/inventory/stock-counts/${op.data['stockCountId']}/count',
          data: {
            'lineId': op.data['lineId'],
            'countedQuantity': op.data['countedQuantity'],
          },
        );
        break;

      case SyncOperationType.completeStockCount:
        await _apiClient.dio.post(
          '/inventory/stock-counts/${op.data['stockCountId']}/complete',
        );
        break;

      case SyncOperationType.stockAdjustment:
        await _apiClient.dio.post(
          '/inventory/adjustments',
          data: op.data,
        );
        break;
    }
  }

  /// Download data for offline use
  Future<void> downloadOfflineData() async {
    state = state.copyWith(status: SyncStatus.syncing, clearError: true);

    try {
      // Download items
      final itemsResponse = await _apiClient.dio.get('/items', queryParameters: {
        'limit': 1000,
      });
      await _storage.cacheItems(
        (itemsResponse.data['data'] as List)
            .map((e) => e as Map<String, dynamic>)
            .toList(),
      );

      // Download warehouses
      final warehousesResponse = await _apiClient.dio.get('/warehouses');
      await _storage.cacheWarehouses(
        (warehousesResponse.data['data'] as List)
            .map((e) => e as Map<String, dynamic>)
            .toList(),
      );

      // Download sales orders (confirmed and picking)
      final salesResponse = await _apiClient.dio.get('/sales-orders', queryParameters: {
        'status': 'CONFIRMED',
        'limit': 100,
      });
      await _storage.cacheSalesOrders(
        (salesResponse.data['data'] as List)
            .map((e) => e as Map<String, dynamic>)
            .toList(),
      );

      // Download purchase orders (issued and partially received)
      final purchasesResponse = await _apiClient.dio.get('/purchase-orders', queryParameters: {
        'status': 'ISSUED',
        'limit': 100,
      });
      await _storage.cachePurchaseOrders(
        (purchasesResponse.data['data'] as List)
            .map((e) => e as Map<String, dynamic>)
            .toList(),
      );

      // Download in-progress stock counts
      final countsResponse = await _apiClient.dio.get('/inventory/stock-counts', queryParameters: {
        'status': 'IN_PROGRESS',
        'limit': 50,
      });
      await _storage.cacheStockCounts(
        (countsResponse.data['data'] as List)
            .map((e) => e as Map<String, dynamic>)
            .toList(),
      );

      await _storage.setLastSync(DateTime.now());
      _updateCounts();

      state = state.copyWith(status: SyncStatus.success);
    } catch (e) {
      state = state.copyWith(
        status: SyncStatus.error,
        error: 'Failed to download offline data: $e',
      );
    }
  }

  /// Retry failed operations
  Future<void> retryFailed() async {
    final failed = _queue.getFailed();
    for (final op in failed) {
      // Reset retry count by re-adding
      await _queue.removeFailed(op.id);
      await _queue.add(op.type, op.data);
    }
    _updateCounts();
    await syncPending();
  }

  /// Clear failed operations
  Future<void> clearFailed() async {
    final failed = _queue.getFailed();
    for (final op in failed) {
      await _queue.removeFailed(op.id);
    }
    _updateCounts();
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }
}

/// Provider for sync manager
final syncManagerProvider = StateNotifierProvider<SyncManager, SyncState>((ref) {
  return SyncManager();
});

/// Provider for pending sync count
final pendingSyncCountProvider = Provider<int>((ref) {
  return ref.watch(syncManagerProvider).pendingCount;
});

/// Provider for sync status
final syncStatusProvider = Provider<SyncStatus>((ref) {
  return ref.watch(syncManagerProvider).status;
});
