import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/warehouse.dart';

class WarehousesNotifier extends StateNotifier<AsyncValue<List<Warehouse>>> {
  final ApiClient _apiClient = ApiClient();

  WarehousesNotifier() : super(const AsyncValue.loading());

  Future<void> loadWarehouses() async {
    state = const AsyncValue.loading();

    try {
      final response = await _apiClient.dio.get('/warehouses', queryParameters: {
        'limit': 100,
      });

      final warehouses = (response.data['data'] as List)
          .map((e) => Warehouse.fromJson(e as Map<String, dynamic>))
          .toList();

      state = AsyncValue.data(warehouses);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<List<BinLocation>> getBinLocations(String warehouseId) async {
    try {
      final response = await _apiClient.dio.get('/warehouses/$warehouseId/bins');

      return (response.data['data'] as List)
          .map((e) => BinLocation.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }
}

final warehousesProvider =
    StateNotifierProvider<WarehousesNotifier, AsyncValue<List<Warehouse>>>((ref) {
  return WarehousesNotifier()..loadWarehouses();
});

// Selected warehouse provider for operations
final selectedWarehouseProvider = StateProvider<Warehouse?>((ref) {
  final warehouses = ref.watch(warehousesProvider);
  return warehouses.whenOrNull(
    data: (list) => list.firstWhere((w) => w.isPrimary, orElse: () => list.first),
  );
});
