import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

/// Represents a conflict between local and server data
class SyncConflict {
  final String id;
  final String entityType; // 'pick_list', 'grn', 'stock_count', etc.
  final String entityId;
  final String entityName;
  final Map<String, dynamic> localData;
  final Map<String, dynamic> serverData;
  final DateTime detectedAt;
  final ConflictResolution? resolution;

  SyncConflict({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.entityName,
    required this.localData,
    required this.serverData,
    required this.detectedAt,
    this.resolution,
  });

  SyncConflict copyWith({
    ConflictResolution? resolution,
  }) {
    return SyncConflict(
      id: id,
      entityType: entityType,
      entityId: entityId,
      entityName: entityName,
      localData: localData,
      serverData: serverData,
      detectedAt: detectedAt,
      resolution: resolution ?? this.resolution,
    );
  }

  factory SyncConflict.fromJson(Map<String, dynamic> json) {
    return SyncConflict(
      id: json['id'] as String,
      entityType: json['entityType'] as String,
      entityId: json['entityId'] as String,
      entityName: json['entityName'] as String,
      localData: json['localData'] as Map<String, dynamic>,
      serverData: json['serverData'] as Map<String, dynamic>,
      detectedAt: DateTime.parse(json['detectedAt'] as String),
      resolution: json['resolution'] != null
          ? ConflictResolution.values.firstWhere(
              (e) => e.name == json['resolution'],
              orElse: () => ConflictResolution.pending,
            )
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'entityType': entityType,
      'entityId': entityId,
      'entityName': entityName,
      'localData': localData,
      'serverData': serverData,
      'detectedAt': detectedAt.toIso8601String(),
      'resolution': resolution?.name,
    };
  }
}

/// Resolution options for a sync conflict
enum ConflictResolution {
  pending,
  keepLocal,
  keepServer,
  merge,
}

/// Tracks entity versions for offline conflict detection
class VersionTracker {
  static const String _versionsKey = 'entity_versions';

  late SharedPreferences _prefs;
  Map<String, int> _versions = {};

  VersionTracker._();

  static VersionTracker? _instance;

  static Future<VersionTracker> getInstance() async {
    if (_instance == null) {
      _instance = VersionTracker._();
      _instance!._prefs = await SharedPreferences.getInstance();
      _instance!._loadVersions();
    }
    return _instance!;
  }

  void _loadVersions() {
    final str = _prefs.getString(_versionsKey);
    if (str != null) {
      final map = jsonDecode(str) as Map<String, dynamic>;
      _versions = map.map((k, v) => MapEntry(k, v as int));
    }
  }

  Future<void> _saveVersions() async {
    await _prefs.setString(_versionsKey, jsonEncode(_versions));
  }

  /// Get the stored version for an entity
  int getVersion(String entityType, String entityId) {
    final key = '$entityType:$entityId';
    return _versions[key] ?? 0;
  }

  /// Update the stored version for an entity
  Future<void> setVersion(
      String entityType, String entityId, int version) async {
    final key = '$entityType:$entityId';
    _versions[key] = version;
    await _saveVersions();
  }

  /// Remove version tracking for an entity
  Future<void> removeVersion(String entityType, String entityId) async {
    final key = '$entityType:$entityId';
    _versions.remove(key);
    await _saveVersions();
  }

  /// Clear all tracked versions
  Future<void> clearAll() async {
    _versions.clear();
    await _saveVersions();
  }
}

/// State for the conflict sync service
class ConflictSyncState {
  final List<SyncConflict> conflicts;
  final bool isChecking;
  final String? error;

  ConflictSyncState({
    this.conflicts = const [],
    this.isChecking = false,
    this.error,
  });

  ConflictSyncState copyWith({
    List<SyncConflict>? conflicts,
    bool? isChecking,
    String? error,
    bool clearError = false,
  }) {
    return ConflictSyncState(
      conflicts: conflicts ?? this.conflicts,
      isChecking: isChecking ?? this.isChecking,
      error: clearError ? null : (error ?? this.error),
    );
  }

  /// Number of unresolved conflicts
  int get unresolvedCount =>
      conflicts.where((c) => c.resolution == null || c.resolution == ConflictResolution.pending).length;

  /// Whether there are unresolved conflicts
  bool get hasConflicts => unresolvedCount > 0;
}

/// Service that handles offline conflict detection and resolution
class ConflictSyncService extends StateNotifier<ConflictSyncState> {
  static const String _conflictsKey = 'sync_conflicts';

  final ApiClient _apiClient = ApiClient();
  late VersionTracker _versionTracker;
  late SharedPreferences _prefs;

  ConflictSyncService() : super(ConflictSyncState()) {
    _init();
  }

  Future<void> _init() async {
    _prefs = await SharedPreferences.getInstance();
    _versionTracker = await VersionTracker.getInstance();
    _loadConflicts();
  }

  void _loadConflicts() {
    final str = _prefs.getString(_conflictsKey);
    if (str != null) {
      final list = jsonDecode(str) as List;
      final conflicts = list
          .map((e) => SyncConflict.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(conflicts: conflicts);
    }
  }

  Future<void> _saveConflicts() async {
    final list = state.conflicts.map((c) => c.toJson()).toList();
    await _prefs.setString(_conflictsKey, jsonEncode(list));
  }

  /// Check for conflicts between local data and server data.
  /// Call this before syncing an offline operation.
  Future<SyncConflict?> detectConflict({
    required String entityType,
    required String entityId,
    required String entityName,
    required Map<String, dynamic> localData,
  }) async {
    state = state.copyWith(isChecking: true, clearError: true);

    try {
      // Get the version we had when the local change was made
      final localVersion = _versionTracker.getVersion(entityType, entityId);

      // Fetch current server data
      final serverData = await _fetchServerData(entityType, entityId);

      if (serverData == null) {
        state = state.copyWith(isChecking: false);
        return null; // Entity doesn't exist on server, no conflict
      }

      // Compare versions - if server version is newer, we have a conflict
      final serverVersion = _extractVersion(serverData);

      if (serverVersion > localVersion && localVersion > 0) {
        // Version mismatch - conflict detected
        final conflictId =
            '${entityType}_${entityId}_${DateTime.now().millisecondsSinceEpoch}';
        final conflict = SyncConflict(
          id: conflictId,
          entityType: entityType,
          entityId: entityId,
          entityName: entityName,
          localData: localData,
          serverData: serverData,
          detectedAt: DateTime.now(),
        );

        final updatedConflicts = [...state.conflicts, conflict];
        state = state.copyWith(
          conflicts: updatedConflicts,
          isChecking: false,
        );
        await _saveConflicts();
        return conflict;
      }

      state = state.copyWith(isChecking: false);
      return null; // No conflict
    } catch (e) {
      state = state.copyWith(
        isChecking: false,
        error: 'Failed to check for conflicts: $e',
      );
      return null;
    }
  }

  /// Resolve a conflict with the chosen resolution
  Future<void> resolveConflict(
    String conflictId,
    ConflictResolution resolution,
  ) async {
    final updatedConflicts = state.conflicts.map((c) {
      if (c.id == conflictId) {
        return c.copyWith(resolution: resolution);
      }
      return c;
    }).toList();

    state = state.copyWith(conflicts: updatedConflicts);

    // Apply the resolution
    final conflict = updatedConflicts.firstWhere((c) => c.id == conflictId);
    await _applyResolution(conflict);
    await _saveConflicts();
  }

  /// Apply a conflict resolution
  Future<void> _applyResolution(SyncConflict conflict) async {
    try {
      switch (conflict.resolution) {
        case ConflictResolution.keepLocal:
          // Re-submit local data to server
          await _submitToServer(
            conflict.entityType,
            conflict.entityId,
            conflict.localData,
          );
          break;

        case ConflictResolution.keepServer:
          // Just update local version tracking
          final serverVersion = _extractVersion(conflict.serverData);
          await _versionTracker.setVersion(
            conflict.entityType,
            conflict.entityId,
            serverVersion,
          );
          break;

        case ConflictResolution.merge:
          // Merge local and server data (local changes take precedence
          // for fields that were modified locally)
          final merged = Map<String, dynamic>.from(conflict.serverData);
          merged.addAll(conflict.localData);
          await _submitToServer(
            conflict.entityType,
            conflict.entityId,
            merged,
          );
          break;

        default:
          break;
      }

      // Remove resolved conflict
      _removeConflict(conflict.id);
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to apply resolution: $e',
      );
    }
  }

  /// Remove a resolved conflict from the list
  void _removeConflict(String conflictId) {
    final updatedConflicts =
        state.conflicts.where((c) => c.id != conflictId).toList();
    state = state.copyWith(conflicts: updatedConflicts);
    _saveConflicts();
  }

  /// Dismiss all resolved conflicts
  Future<void> dismissResolved() async {
    final unresolved = state.conflicts
        .where((c) =>
            c.resolution == null ||
            c.resolution == ConflictResolution.pending)
        .toList();
    state = state.copyWith(conflicts: unresolved);
    await _saveConflicts();
  }

  /// Clear all conflicts
  Future<void> clearAll() async {
    state = state.copyWith(conflicts: []);
    await _saveConflicts();
  }

  /// Track a new version when data is saved locally
  Future<void> trackVersion(
    String entityType,
    String entityId,
    int version,
  ) async {
    await _versionTracker.setVersion(entityType, entityId, version);
  }

  /// Fetch server data for a given entity
  Future<Map<String, dynamic>?> _fetchServerData(
    String entityType,
    String entityId,
  ) async {
    try {
      final endpoint = _getEndpoint(entityType, entityId);
      final response = await _apiClient.dio.get(endpoint);
      return response.data['data'] as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  /// Submit data to server
  Future<void> _submitToServer(
    String entityType,
    String entityId,
    Map<String, dynamic> data,
  ) async {
    final endpoint = _getEndpoint(entityType, entityId);
    await _apiClient.dio.put(endpoint, data: data);
  }

  /// Get the API endpoint for a given entity type
  String _getEndpoint(String entityType, String entityId) {
    switch (entityType) {
      case 'pick_list':
        return '/pick-lists/$entityId';
      case 'grn':
        return '/purchase-orders/grn/$entityId';
      case 'stock_count':
        return '/inventory/stock-counts/$entityId';
      case 'stock_adjustment':
        return '/inventory/adjustments/$entityId';
      default:
        return '/$entityType/$entityId';
    }
  }

  /// Extract version number from server data
  int _extractVersion(Map<String, dynamic> data) {
    // Use updatedAt timestamp as version, converted to milliseconds
    if (data.containsKey('updatedAt')) {
      try {
        return DateTime.parse(data['updatedAt'] as String)
            .millisecondsSinceEpoch;
      } catch (_) {
        return 0;
      }
    }
    if (data.containsKey('version')) {
      return data['version'] as int? ?? 0;
    }
    return 0;
  }
}

/// Provider for the conflict sync service
final conflictSyncProvider =
    StateNotifierProvider<ConflictSyncService, ConflictSyncState>((ref) {
  return ConflictSyncService();
});

/// Provider for unresolved conflict count
final unresolvedConflictCountProvider = Provider<int>((ref) {
  return ref.watch(conflictSyncProvider).unresolvedCount;
});

/// Provider for whether there are unresolved conflicts
final hasConflictsProvider = Provider<bool>((ref) {
  return ref.watch(conflictSyncProvider).hasConflicts;
});
