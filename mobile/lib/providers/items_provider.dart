import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/item.dart';

class ItemsState {
  final List<Item> items;
  final bool isLoading;
  final String? error;
  final int totalCount;
  final int currentPage;

  ItemsState({
    this.items = const [],
    this.isLoading = false,
    this.error,
    this.totalCount = 0,
    this.currentPage = 1,
  });

  ItemsState copyWith({
    List<Item>? items,
    bool? isLoading,
    String? error,
    int? totalCount,
    int? currentPage,
  }) {
    return ItemsState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      totalCount: totalCount ?? this.totalCount,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

class ItemsNotifier extends StateNotifier<ItemsState> {
  final ApiClient _apiClient = ApiClient();

  ItemsNotifier() : super(ItemsState());

  Future<void> loadItems({String? search, int page = 1}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.dio.get('/items', queryParameters: {
        'page': page,
        'limit': 20,
        if (search != null && search.isNotEmpty) 'search': search,
      });

      final data = response.data;
      final items = (data['data'] as List)
          .map((e) => Item.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        items: page == 1 ? items : [...state.items, ...items],
        isLoading: false,
        totalCount: data['meta']?['total'] ?? items.length,
        currentPage: page,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load items',
      );
    }
  }

  Future<Item?> getItemByBarcode(String barcode) async {
    try {
      final response = await _apiClient.dio.get('/items', queryParameters: {
        'barcode': barcode,
      });

      final data = response.data['data'] as List;
      if (data.isNotEmpty) {
        return Item.fromJson(data.first as Map<String, dynamic>);
      }
    } catch (_) {}
    return null;
  }

  Future<Item?> getItem(String id) async {
    try {
      final response = await _apiClient.dio.get('/items/$id');
      return Item.fromJson(response.data['data'] as Map<String, dynamic>);
    } catch (_) {}
    return null;
  }

  void refresh() {
    loadItems();
  }
}

final itemsProvider = StateNotifierProvider<ItemsNotifier, ItemsState>((ref) {
  return ItemsNotifier()..loadItems();
});

// Stock levels provider
class StockLevelsNotifier extends StateNotifier<AsyncValue<List<StockLevel>>> {
  final ApiClient _apiClient = ApiClient();

  StockLevelsNotifier() : super(const AsyncValue.loading());

  Future<void> loadStockLevels({String? warehouseId, bool lowStockOnly = false}) async {
    state = const AsyncValue.loading();

    try {
      final response = await _apiClient.dio.get('/inventory/stock-levels', queryParameters: {
        if (warehouseId != null) 'warehouseId': warehouseId,
        if (lowStockOnly) 'lowStockOnly': true,
      });

      final levels = (response.data['data'] as List)
          .map((e) => StockLevel.fromJson(e as Map<String, dynamic>))
          .toList();

      state = AsyncValue.data(levels);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final stockLevelsProvider =
    StateNotifierProvider<StockLevelsNotifier, AsyncValue<List<StockLevel>>>((ref) {
  return StockLevelsNotifier()..loadStockLevels();
});
