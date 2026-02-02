import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/purchase_order.dart';

class PurchaseOrdersState {
  final List<PurchaseOrder> orders;
  final bool isLoading;
  final String? error;
  final int totalCount;

  PurchaseOrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.error,
    this.totalCount = 0,
  });

  PurchaseOrdersState copyWith({
    List<PurchaseOrder>? orders,
    bool? isLoading,
    String? error,
    int? totalCount,
  }) {
    return PurchaseOrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      totalCount: totalCount ?? this.totalCount,
    );
  }
}

class PurchaseOrdersNotifier extends StateNotifier<PurchaseOrdersState> {
  final ApiClient _apiClient = ApiClient();

  PurchaseOrdersNotifier() : super(PurchaseOrdersState());

  Future<void> loadOrders({PurchaseOrderStatus? status}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.get('/purchase-orders', queryParameters: {
        'limit': 50,
        if (status != null) 'status': status.name.toUpperCase(),
      });

      final data = response.data;
      final orders = (data['data'] as List)
          .map((e) => PurchaseOrder.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        orders: orders,
        isLoading: false,
        totalCount: data['meta']?['total'] ?? orders.length,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load orders',
      );
    }
  }

  Future<PurchaseOrder?> getOrder(String id) async {
    try {
      final response = await _apiClient.dio.get('/purchase-orders/$id');
      return PurchaseOrder.fromJson(response.data['data'] as Map<String, dynamic>);
    } catch (_) {}
    return null;
  }

  Future<bool> createGRN(String orderId, List<GRNItem> items, {String? notes}) async {
    try {
      await _apiClient.dio.post('/purchase-orders/$orderId/grn', data: {
        'receivedDate': DateTime.now().toIso8601String().split('T')[0],
        'notes': notes,
        'items': items
            .where((i) => i.receivingQuantity > 0)
            .map((i) => {
                  'itemId': i.itemId,
                  'receivedQuantity': i.receivingQuantity,
                  if (i.binLocationId != null) 'binLocationId': i.binLocationId,
                })
            .toList(),
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  void refresh() {
    loadOrders();
  }
}

final purchaseOrdersProvider =
    StateNotifierProvider<PurchaseOrdersNotifier, PurchaseOrdersState>((ref) {
  return PurchaseOrdersNotifier()..loadOrders(status: PurchaseOrderStatus.confirmed);
});

// Orders ready for receiving
final receivingOrdersProvider = Provider<List<PurchaseOrder>>((ref) {
  final state = ref.watch(purchaseOrdersProvider);
  return state.orders
      .where((o) =>
          o.status == PurchaseOrderStatus.confirmed ||
          o.status == PurchaseOrderStatus.partial)
      .toList();
});
