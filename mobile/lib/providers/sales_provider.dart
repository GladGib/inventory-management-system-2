import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/sales_order.dart';

class SalesOrdersState {
  final List<SalesOrder> orders;
  final bool isLoading;
  final String? error;
  final int totalCount;

  SalesOrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.error,
    this.totalCount = 0,
  });

  SalesOrdersState copyWith({
    List<SalesOrder>? orders,
    bool? isLoading,
    String? error,
    int? totalCount,
  }) {
    return SalesOrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      totalCount: totalCount ?? this.totalCount,
    );
  }
}

class SalesOrdersNotifier extends StateNotifier<SalesOrdersState> {
  final ApiClient _apiClient = ApiClient();

  SalesOrdersNotifier() : super(SalesOrdersState());

  Future<void> loadOrders({SalesOrderStatus? status}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.get('/sales-orders', queryParameters: {
        'limit': 50,
        if (status != null) 'status': status.name.toUpperCase(),
      });

      final data = response.data;
      final orders = (data['data'] as List)
          .map((e) => SalesOrder.fromJson(e as Map<String, dynamic>))
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

  Future<SalesOrder?> getOrder(String id) async {
    try {
      final response = await _apiClient.dio.get('/sales-orders/$id');
      return SalesOrder.fromJson(response.data['data'] as Map<String, dynamic>);
    } catch (_) {}
    return null;
  }

  Future<List<PickListItem>> getPickList(String orderId) async {
    try {
      final response = await _apiClient.dio.get('/sales-orders/$orderId/pick-list');
      return (response.data['data']['items'] as List)
          .map((e) => PickListItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<bool> processPickList(String orderId, List<Map<String, dynamic>> items) async {
    try {
      await _apiClient.dio.post('/sales-orders/$orderId/process-pick-list', data: {
        'items': items,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> shipOrder(String orderId, {String? trackingNumber}) async {
    try {
      await _apiClient.dio.post('/sales-orders/$orderId/ship', data: {
        if (trackingNumber != null) 'trackingNumber': trackingNumber,
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

final salesOrdersProvider =
    StateNotifierProvider<SalesOrdersNotifier, SalesOrdersState>((ref) {
  return SalesOrdersNotifier()..loadOrders(status: SalesOrderStatus.confirmed);
});

// Orders ready for picking
final pickingOrdersProvider = Provider<List<SalesOrder>>((ref) {
  final state = ref.watch(salesOrdersProvider);
  return state.orders
      .where((o) =>
          o.status == SalesOrderStatus.confirmed ||
          o.status == SalesOrderStatus.processing)
      .toList();
});
