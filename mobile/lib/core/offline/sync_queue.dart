import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

/// Types of offline operations
enum SyncOperationType {
  processPickList,
  createGRN,
  recordStockCount,
  completeStockCount,
  stockAdjustment,
}

/// A single offline operation to be synced
class SyncOperation {
  final String id;
  final SyncOperationType type;
  final Map<String, dynamic> data;
  final DateTime createdAt;
  final int retryCount;
  final String? lastError;

  SyncOperation({
    required this.id,
    required this.type,
    required this.data,
    required this.createdAt,
    this.retryCount = 0,
    this.lastError,
  });

  factory SyncOperation.fromJson(Map<String, dynamic> json) {
    return SyncOperation(
      id: json['id'] as String,
      type: SyncOperationType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => SyncOperationType.stockAdjustment,
      ),
      data: json['data'] as Map<String, dynamic>,
      createdAt: DateTime.parse(json['createdAt'] as String),
      retryCount: json['retryCount'] as int? ?? 0,
      lastError: json['lastError'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'data': data,
      'createdAt': createdAt.toIso8601String(),
      'retryCount': retryCount,
      'lastError': lastError,
    };
  }

  SyncOperation copyWith({
    int? retryCount,
    String? lastError,
  }) {
    return SyncOperation(
      id: id,
      type: type,
      data: data,
      createdAt: createdAt,
      retryCount: retryCount ?? this.retryCount,
      lastError: lastError ?? this.lastError,
    );
  }
}

/// Manages the queue of offline operations
class SyncQueue {
  static const String _queueKey = 'offline_sync_queue';
  static const int maxRetries = 3;

  static SyncQueue? _instance;
  late SharedPreferences _prefs;
  List<SyncOperation> _operations = [];

  SyncQueue._();

  static Future<SyncQueue> getInstance() async {
    if (_instance == null) {
      _instance = SyncQueue._();
      _instance!._prefs = await SharedPreferences.getInstance();
      await _instance!._loadQueue();
    }
    return _instance!;
  }

  Future<void> _loadQueue() async {
    final str = _prefs.getString(_queueKey);
    if (str != null) {
      final list = jsonDecode(str) as List;
      _operations = list
          .map((e) => SyncOperation.fromJson(e as Map<String, dynamic>))
          .toList();
    }
  }

  Future<void> _saveQueue() async {
    final list = _operations.map((e) => e.toJson()).toList();
    await _prefs.setString(_queueKey, jsonEncode(list));
  }

  /// Add an operation to the queue
  Future<String> add(SyncOperationType type, Map<String, dynamic> data) async {
    final id = const Uuid().v4();
    final operation = SyncOperation(
      id: id,
      type: type,
      data: data,
      createdAt: DateTime.now(),
    );
    _operations.add(operation);
    await _saveQueue();
    return id;
  }

  /// Get all pending operations
  List<SyncOperation> getPending() {
    return _operations.where((op) => op.retryCount < maxRetries).toList();
  }

  /// Get count of pending operations
  int get pendingCount => getPending().length;

  /// Check if there are pending operations
  bool get hasPending => pendingCount > 0;

  /// Mark an operation as completed and remove it
  Future<void> complete(String id) async {
    _operations.removeWhere((op) => op.id == id);
    await _saveQueue();
  }

  /// Mark an operation as failed and increment retry count
  Future<void> markFailed(String id, String error) async {
    final index = _operations.indexWhere((op) => op.id == id);
    if (index >= 0) {
      _operations[index] = _operations[index].copyWith(
        retryCount: _operations[index].retryCount + 1,
        lastError: error,
      );
      await _saveQueue();
    }
  }

  /// Get failed operations (exceeded max retries)
  List<SyncOperation> getFailed() {
    return _operations.where((op) => op.retryCount >= maxRetries).toList();
  }

  /// Remove a failed operation
  Future<void> removeFailed(String id) async {
    _operations.removeWhere((op) => op.id == id);
    await _saveQueue();
  }

  /// Clear all operations
  Future<void> clearAll() async {
    _operations.clear();
    await _saveQueue();
  }
}
