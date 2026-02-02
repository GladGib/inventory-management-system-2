import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/stock_adjustment.dart';

class InventoryNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiClient _apiClient = ApiClient();

  InventoryNotifier() : super(const AsyncValue.data(null));

  Future<bool> createStockAdjustment(CreateStockAdjustmentRequest request) async {
    state = const AsyncValue.loading();

    try {
      await _apiClient.dio.post('/inventory/adjustments', data: request.toJson());
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> createStockTransfer({
    required String fromWarehouseId,
    required String toWarehouseId,
    required List<Map<String, dynamic>> items,
    String? notes,
  }) async {
    state = const AsyncValue.loading();

    try {
      await _apiClient.dio.post('/inventory/transfers', data: {
        'fromWarehouseId': fromWarehouseId,
        'toWarehouseId': toWarehouseId,
        'notes': notes,
        'items': items,
      });
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final inventoryProvider =
    StateNotifierProvider<InventoryNotifier, AsyncValue<void>>((ref) {
  return InventoryNotifier();
});

// Dashboard stats provider
class DashboardStats {
  final int totalItems;
  final int lowStockItems;
  final int pendingSalesOrders;
  final int pendingPurchaseOrders;

  DashboardStats({
    required this.totalItems,
    required this.lowStockItems,
    required this.pendingSalesOrders,
    required this.pendingPurchaseOrders,
  });
}

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final apiClient = ApiClient();

  try {
    final response = await apiClient.dio.get('/dashboard/stats');
    final data = response.data['data'];
    return DashboardStats(
      totalItems: data['totalItems'] ?? 0,
      lowStockItems: data['lowStockItems'] ?? 0,
      pendingSalesOrders: data['pendingSalesOrders'] ?? 0,
      pendingPurchaseOrders: data['pendingPurchaseOrders'] ?? 0,
    );
  } catch (_) {
    return DashboardStats(
      totalItems: 0,
      lowStockItems: 0,
      pendingSalesOrders: 0,
      pendingPurchaseOrders: 0,
    );
  }
});
