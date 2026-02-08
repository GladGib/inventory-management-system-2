import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/goods_received.dart';
import '../models/purchase_order.dart';

class GoodsReceivingState {
  final List<PurchaseOrder> ordersToReceive;
  final List<GoodsReceivedNote> recentGRNs;
  final PurchaseOrder? currentOrder;
  final Map<String, int> receivedQuantities;
  final Map<String, String?> binLocations;
  final bool isLoading;
  final String? error;

  GoodsReceivingState({
    this.ordersToReceive = const [],
    this.recentGRNs = const [],
    this.currentOrder,
    this.receivedQuantities = const {},
    this.binLocations = const {},
    this.isLoading = false,
    this.error,
  });

  GoodsReceivingState copyWith({
    List<PurchaseOrder>? ordersToReceive,
    List<GoodsReceivedNote>? recentGRNs,
    PurchaseOrder? currentOrder,
    Map<String, int>? receivedQuantities,
    Map<String, String?>? binLocations,
    bool? isLoading,
    String? error,
    bool clearCurrentOrder = false,
  }) {
    return GoodsReceivingState(
      ordersToReceive: ordersToReceive ?? this.ordersToReceive,
      recentGRNs: recentGRNs ?? this.recentGRNs,
      currentOrder: clearCurrentOrder ? null : (currentOrder ?? this.currentOrder),
      receivedQuantities: receivedQuantities ?? this.receivedQuantities,
      binLocations: binLocations ?? this.binLocations,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class GoodsReceivingNotifier extends StateNotifier<GoodsReceivingState> {
  final ApiClient _apiClient = ApiClient();

  GoodsReceivingNotifier() : super(GoodsReceivingState());

  Future<void> loadOrdersToReceive({String? warehouseId}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Load ISSUED POs
      final issuedResponse = await _apiClient.dio.get('/purchase-orders', queryParameters: {
        'status': 'ISSUED',
        'limit': 100,
        if (warehouseId != null) 'warehouseId': warehouseId,
      });

      final issuedOrders = (issuedResponse.data['data'] as List)
          .map((e) => PurchaseOrder.fromJson(e as Map<String, dynamic>))
          .toList();

      // Load PARTIALLY_RECEIVED POs
      final partialResponse = await _apiClient.dio.get('/purchase-orders', queryParameters: {
        'status': 'PARTIALLY_RECEIVED',
        'limit': 100,
        if (warehouseId != null) 'warehouseId': warehouseId,
      });

      final partialOrders = (partialResponse.data['data'] as List)
          .map((e) => PurchaseOrder.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        ordersToReceive: [...issuedOrders, ...partialOrders],
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load orders',
      );
    }
  }

  Future<void> loadRecentGRNs({String? warehouseId}) async {
    try {
      final response = await _apiClient.dio.get('/purchase-orders/grn', queryParameters: {
        'limit': 20,
        if (warehouseId != null) 'warehouseId': warehouseId,
      });

      final grns = (response.data['data'] as List)
          .map((e) => GoodsReceivedNote.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(recentGRNs: grns);
    } catch (e) {
      // Ignore error for recent GRNs
    }
  }

  Future<PurchaseOrder?> selectOrder(String orderId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.get('/purchase-orders/$orderId');
      final order = PurchaseOrder.fromJson(response.data['data'] as Map<String, dynamic>);

      // Initialize received quantities and bin locations
      final receivedQty = <String, int>{};
      final binLocs = <String, String?>{};
      for (final line in order.items) {
        receivedQty[line.id] = 0;
        binLocs[line.id] = null;
      }

      state = state.copyWith(
        currentOrder: order,
        receivedQuantities: receivedQty,
        binLocations: binLocs,
        isLoading: false,
      );
      return order;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load order',
      );
      return null;
    }
  }

  void updateReceivedQuantity(String lineId, int quantity) {
    final updatedQty = Map<String, int>.from(state.receivedQuantities);
    updatedQty[lineId] = quantity;
    state = state.copyWith(receivedQuantities: updatedQty);
  }

  void updateBinLocation(String lineId, String? binLocationId) {
    final updatedBins = Map<String, String?>.from(state.binLocations);
    updatedBins[lineId] = binLocationId;
    state = state.copyWith(binLocations: updatedBins);
  }

  Future<GoodsReceivedNote?> createGRN({String? warehouseId, String? notes}) async {
    final currentOrder = state.currentOrder;
    if (currentOrder == null) return null;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final lines = currentOrder.items
          .where((line) {
            final received = state.receivedQuantities[line.id] ?? 0;
            return received > 0;
          })
          .map((line) => {
                'poLineId': line.id,
                'quantityReceived': state.receivedQuantities[line.id] ?? 0,
                if (state.binLocations[line.id] != null)
                  'binLocationId': state.binLocations[line.id],
              })
          .toList();

      if (lines.isEmpty) {
        state = state.copyWith(
          isLoading: false,
          error: 'No items to receive',
        );
        return null;
      }

      final response = await _apiClient.dio.post(
        '/purchase-orders/${currentOrder.id}/receive',
        data: {
          'lines': lines,
          if (warehouseId != null) 'warehouseId': warehouseId,
          if (notes != null) 'notes': notes,
        },
      );

      final grn = GoodsReceivedNote.fromJson(response.data['data'] as Map<String, dynamic>);

      state = state.copyWith(
        isLoading: false,
        clearCurrentOrder: true,
      );

      // Refresh lists
      await loadOrdersToReceive();
      await loadRecentGRNs();

      return grn;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to create GRN',
      );
      return null;
    }
  }

  void clearCurrentOrder() {
    state = state.copyWith(
      clearCurrentOrder: true,
      receivedQuantities: {},
      binLocations: {},
    );
  }

  void refresh() {
    loadOrdersToReceive();
    loadRecentGRNs();
  }
}

final goodsReceivingProvider =
    StateNotifierProvider<GoodsReceivingNotifier, GoodsReceivingState>((ref) {
  return GoodsReceivingNotifier()..loadOrdersToReceive();
});

// Provider for orders ready to receive
final ordersToReceiveProvider = Provider<List<PurchaseOrder>>((ref) {
  return ref.watch(goodsReceivingProvider).ordersToReceive;
});

// Provider for current order being received
final currentReceivingOrderProvider = Provider<PurchaseOrder?>((ref) {
  return ref.watch(goodsReceivingProvider).currentOrder;
});
