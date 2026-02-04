import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Local storage service for offline data persistence
class OfflineStorage {
  static OfflineStorage? _instance;
  late SharedPreferences _prefs;

  OfflineStorage._();

  static Future<OfflineStorage> getInstance() async {
    if (_instance == null) {
      _instance = OfflineStorage._();
      _instance!._prefs = await SharedPreferences.getInstance();
    }
    return _instance!;
  }

  // Generic methods
  Future<bool> setString(String key, String value) => _prefs.setString(key, value);
  String? getString(String key) => _prefs.getString(key);

  Future<bool> setJson(String key, Map<String, dynamic> value) =>
      _prefs.setString(key, jsonEncode(value));

  Map<String, dynamic>? getJson(String key) {
    final str = _prefs.getString(key);
    if (str == null) return null;
    return jsonDecode(str) as Map<String, dynamic>;
  }

  Future<bool> setJsonList(String key, List<Map<String, dynamic>> value) =>
      _prefs.setString(key, jsonEncode(value));

  List<Map<String, dynamic>>? getJsonList(String key) {
    final str = _prefs.getString(key);
    if (str == null) return null;
    final list = jsonDecode(str) as List;
    return list.map((e) => e as Map<String, dynamic>).toList();
  }

  Future<bool> remove(String key) => _prefs.remove(key);
  Future<bool> clear() => _prefs.clear();

  // Specific storage keys
  static const String itemsKey = 'cached_items';
  static const String warehousesKey = 'cached_warehouses';
  static const String customersKey = 'cached_customers';
  static const String vendorsKey = 'cached_vendors';
  static const String salesOrdersKey = 'cached_sales_orders';
  static const String purchaseOrdersKey = 'cached_purchase_orders';
  static const String pickListsKey = 'cached_pick_lists';
  static const String stockCountsKey = 'cached_stock_counts';
  static const String syncQueueKey = 'offline_sync_queue';
  static const String lastSyncKey = 'last_sync_timestamp';

  // Cache items
  Future<void> cacheItems(List<Map<String, dynamic>> items) async {
    await setJsonList(itemsKey, items);
  }

  List<Map<String, dynamic>> getCachedItems() {
    return getJsonList(itemsKey) ?? [];
  }

  // Cache warehouses
  Future<void> cacheWarehouses(List<Map<String, dynamic>> warehouses) async {
    await setJsonList(warehousesKey, warehouses);
  }

  List<Map<String, dynamic>> getCachedWarehouses() {
    return getJsonList(warehousesKey) ?? [];
  }

  // Cache sales orders
  Future<void> cacheSalesOrders(List<Map<String, dynamic>> orders) async {
    await setJsonList(salesOrdersKey, orders);
  }

  List<Map<String, dynamic>> getCachedSalesOrders() {
    return getJsonList(salesOrdersKey) ?? [];
  }

  // Cache purchase orders
  Future<void> cachePurchaseOrders(List<Map<String, dynamic>> orders) async {
    await setJsonList(purchaseOrdersKey, orders);
  }

  List<Map<String, dynamic>> getCachedPurchaseOrders() {
    return getJsonList(purchaseOrdersKey) ?? [];
  }

  // Cache pick lists
  Future<void> cachePickLists(List<Map<String, dynamic>> pickLists) async {
    await setJsonList(pickListsKey, pickLists);
  }

  List<Map<String, dynamic>> getCachedPickLists() {
    return getJsonList(pickListsKey) ?? [];
  }

  // Cache stock counts
  Future<void> cacheStockCounts(List<Map<String, dynamic>> counts) async {
    await setJsonList(stockCountsKey, counts);
  }

  List<Map<String, dynamic>> getCachedStockCounts() {
    return getJsonList(stockCountsKey) ?? [];
  }

  // Last sync timestamp
  Future<void> setLastSync(DateTime timestamp) async {
    await setString(lastSyncKey, timestamp.toIso8601String());
  }

  DateTime? getLastSync() {
    final str = getString(lastSyncKey);
    if (str == null) return null;
    return DateTime.parse(str);
  }
}
