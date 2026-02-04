import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/stock_count.dart';

class StockCountState {
  final List<StockCount> stockCounts;
  final StockCount? currentCount;
  final bool isLoading;
  final String? error;

  StockCountState({
    this.stockCounts = const [],
    this.currentCount,
    this.isLoading = false,
    this.error,
  });

  StockCountState copyWith({
    List<StockCount>? stockCounts,
    StockCount? currentCount,
    bool? isLoading,
    String? error,
    bool clearCurrentCount = false,
  }) {
    return StockCountState(
      stockCounts: stockCounts ?? this.stockCounts,
      currentCount: clearCurrentCount ? null : (currentCount ?? this.currentCount),
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class StockCountNotifier extends StateNotifier<StockCountState> {
  final ApiClient _apiClient = ApiClient();

  StockCountNotifier() : super(StockCountState());

  Future<void> loadStockCounts() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.get('/inventory/stock-counts', queryParameters: {
        'limit': 50,
      });

      final counts = (response.data['data'] as List)
          .map((e) => StockCount.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        stockCounts: counts,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load stock counts',
      );
    }
  }

  Future<StockCount?> createStockCount({
    required String warehouseId,
    String? notes,
    List<String>? itemIds,
    String? categoryId,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.post('/inventory/stock-counts', data: {
        'warehouseId': warehouseId,
        if (notes != null) 'notes': notes,
        if (itemIds != null) 'itemIds': itemIds,
        if (categoryId != null) 'categoryId': categoryId,
      });

      final count = StockCount.fromJson(response.data['data'] as Map<String, dynamic>);
      state = state.copyWith(
        currentCount: count,
        isLoading: false,
      );

      // Refresh the list
      await loadStockCounts();

      return count;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to create stock count',
      );
      return null;
    }
  }

  Future<StockCount?> getStockCount(String id) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.get('/inventory/stock-counts/$id');
      final count = StockCount.fromJson(response.data['data'] as Map<String, dynamic>);
      state = state.copyWith(
        currentCount: count,
        isLoading: false,
      );
      return count;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load stock count',
      );
      return null;
    }
  }

  void updateLineCount(String lineId, int quantity) {
    final currentCount = state.currentCount;
    if (currentCount == null) return;

    final updatedLines = currentCount.lines.map((line) {
      if (line.id == lineId) {
        line.countedQty = quantity;
      }
      return line;
    }).toList();

    state = state.copyWith(
      currentCount: StockCount(
        id: currentCount.id,
        countNumber: currentCount.countNumber,
        warehouseId: currentCount.warehouseId,
        warehouseName: currentCount.warehouseName,
        notes: currentCount.notes,
        status: currentCount.status,
        countDate: currentCount.countDate,
        completedAt: currentCount.completedAt,
        createdAt: currentCount.createdAt,
        lines: updatedLines,
      ),
    );
  }

  Future<bool> recordCount(String lineId, int countedQuantity) async {
    final currentCount = state.currentCount;
    if (currentCount == null) return false;

    try {
      await _apiClient.dio.post(
        '/inventory/stock-counts/${currentCount.id}/count',
        data: {
          'lineId': lineId,
          'countedQuantity': countedQuantity,
        },
      );

      // Update local state
      updateLineCount(lineId, countedQuantity);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> completeStockCount() async {
    final currentCount = state.currentCount;
    if (currentCount == null) return false;

    state = state.copyWith(isLoading: true, error: null);

    try {
      await _apiClient.dio.post('/inventory/stock-counts/${currentCount.id}/complete');

      state = state.copyWith(
        isLoading: false,
        clearCurrentCount: true,
      );

      // Refresh the list
      await loadStockCounts();

      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to complete stock count',
      );
      return false;
    }
  }

  void clearCurrentCount() {
    state = state.copyWith(clearCurrentCount: true);
  }

  void refresh() {
    loadStockCounts();
  }
}

final stockCountProvider = StateNotifierProvider<StockCountNotifier, StockCountState>((ref) {
  return StockCountNotifier()..loadStockCounts();
});

// Provider for the current stock count
final currentStockCountProvider = Provider<StockCount?>((ref) {
  return ref.watch(stockCountProvider).currentCount;
});

// Provider for in-progress stock counts
final inProgressCountsProvider = Provider<List<StockCount>>((ref) {
  return ref.watch(stockCountProvider).stockCounts
      .where((c) => c.status == StockCountStatus.inProgress)
      .toList();
});
