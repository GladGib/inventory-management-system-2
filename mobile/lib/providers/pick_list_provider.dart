import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/pick_list.dart';
import '../models/sales_order.dart';

class PickListState {
  final List<PickList> pickLists;
  final List<SalesOrder> ordersReadyForPicking;
  final PickList? currentPickList;
  final bool isLoading;
  final String? error;

  PickListState({
    this.pickLists = const [],
    this.ordersReadyForPicking = const [],
    this.currentPickList,
    this.isLoading = false,
    this.error,
  });

  PickListState copyWith({
    List<PickList>? pickLists,
    List<SalesOrder>? ordersReadyForPicking,
    PickList? currentPickList,
    bool? isLoading,
    String? error,
    bool clearCurrentPickList = false,
  }) {
    return PickListState(
      pickLists: pickLists ?? this.pickLists,
      ordersReadyForPicking: ordersReadyForPicking ?? this.ordersReadyForPicking,
      currentPickList: clearCurrentPickList ? null : (currentPickList ?? this.currentPickList),
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class PickListNotifier extends StateNotifier<PickListState> {
  final ApiClient _apiClient = ApiClient();

  PickListNotifier() : super(PickListState());

  Future<void> loadOrdersReadyForPicking() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.get('/sales-orders', queryParameters: {
        'status': 'CONFIRMED',
        'limit': 100,
      });

      final data = response.data;
      final orders = (data['data'] as List)
          .map((e) => SalesOrder.fromJson(e as Map<String, dynamic>))
          .toList();

      // Also load PICKING status orders
      final pickingResponse = await _apiClient.dio.get('/sales-orders', queryParameters: {
        'status': 'PICKING',
        'limit': 100,
      });

      final pickingOrders = (pickingResponse.data['data'] as List)
          .map((e) => SalesOrder.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        ordersReadyForPicking: [...orders, ...pickingOrders],
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load orders',
      );
    }
  }

  Future<PickList?> createPickList(String orderId, {List<String>? lineIds}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.post(
        '/sales-orders/$orderId/pick-list',
        data: lineIds != null ? {'lineIds': lineIds} : null,
      );

      final pickList = PickList.fromJson(response.data['data'] as Map<String, dynamic>);
      state = state.copyWith(
        currentPickList: pickList,
        isLoading: false,
      );
      return pickList;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to create pick list',
      );
      return null;
    }
  }

  Future<PickList?> getPickList(String pickListId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.get('/pick-lists/$pickListId');
      final pickList = PickList.fromJson(response.data['data'] as Map<String, dynamic>);
      state = state.copyWith(
        currentPickList: pickList,
        isLoading: false,
      );
      return pickList;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load pick list',
      );
      return null;
    }
  }

  void updateLineQuantity(String lineId, int quantity) {
    final currentPickList = state.currentPickList;
    if (currentPickList == null) return;

    final updatedLines = currentPickList.lines.map((line) {
      if (line.id == lineId) {
        line.quantityPicked = quantity;
      }
      return line;
    }).toList();

    state = state.copyWith(
      currentPickList: PickList(
        id: currentPickList.id,
        pickListNumber: currentPickList.pickListNumber,
        salesOrderId: currentPickList.salesOrderId,
        salesOrderNumber: currentPickList.salesOrderNumber,
        status: currentPickList.status,
        createdAt: currentPickList.createdAt,
        completedAt: currentPickList.completedAt,
        lines: updatedLines,
      ),
    );
  }

  Future<bool> processPickList() async {
    final currentPickList = state.currentPickList;
    if (currentPickList == null) return false;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final linesData = currentPickList.lines.map((line) => line.toPickedJson()).toList();

      await _apiClient.dio.post(
        '/pick-lists/${currentPickList.id}/process',
        data: {'lines': linesData},
      );

      state = state.copyWith(
        isLoading: false,
        clearCurrentPickList: true,
      );

      // Refresh the orders list
      await loadOrdersReadyForPicking();

      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to process pick list',
      );
      return false;
    }
  }

  void clearCurrentPickList() {
    state = state.copyWith(clearCurrentPickList: true);
  }

  void refresh() {
    loadOrdersReadyForPicking();
  }
}

final pickListProvider = StateNotifierProvider<PickListNotifier, PickListState>((ref) {
  return PickListNotifier()..loadOrdersReadyForPicking();
});

// Provider for the current pick list
final currentPickListProvider = Provider<PickList?>((ref) {
  return ref.watch(pickListProvider).currentPickList;
});

// Provider for orders ready for picking
final ordersReadyForPickingProvider = Provider<List<SalesOrder>>((ref) {
  return ref.watch(pickListProvider).ordersReadyForPicking;
});
