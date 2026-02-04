enum StockCountStatus {
  inProgress,
  completed;

  static StockCountStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'COMPLETED':
        return StockCountStatus.completed;
      default:
        return StockCountStatus.inProgress;
    }
  }

  String get displayName {
    switch (this) {
      case StockCountStatus.inProgress:
        return 'In Progress';
      case StockCountStatus.completed:
        return 'Completed';
    }
  }

  String toApiString() {
    switch (this) {
      case StockCountStatus.inProgress:
        return 'IN_PROGRESS';
      case StockCountStatus.completed:
        return 'COMPLETED';
    }
  }
}

class StockCountLine {
  final String id;
  final String itemId;
  final String? itemCode;
  final String? itemName;
  final int systemQty;
  int? countedQty;
  final String? binLocationId;
  final String? binLocationCode;

  StockCountLine({
    required this.id,
    required this.itemId,
    this.itemCode,
    this.itemName,
    required this.systemQty,
    this.countedQty,
    this.binLocationId,
    this.binLocationCode,
  });

  int get variance => (countedQty ?? systemQty) - systemQty;
  bool get hasVariance => variance != 0;
  bool get isCounted => countedQty != null;

  factory StockCountLine.fromJson(Map<String, dynamic> json) {
    return StockCountLine(
      id: json['id'] as String,
      itemId: json['itemId'] as String,
      itemCode: json['itemCode'] as String?,
      itemName: json['itemName'] as String?,
      systemQty: json['systemQty'] as int? ?? json['systemQuantity'] as int? ?? 0,
      countedQty: json['countedQty'] as int? ?? json['countedQuantity'] as int?,
      binLocationId: json['binLocationId'] as String?,
      binLocationCode: json['binLocationCode'] as String?,
    );
  }

  Map<String, dynamic> toCountJson() {
    return {
      'lineId': id,
      'countedQuantity': countedQty ?? 0,
    };
  }
}

class StockCount {
  final String id;
  final String countNumber;
  final String warehouseId;
  final String? warehouseName;
  final String? notes;
  final StockCountStatus status;
  final DateTime countDate;
  final DateTime? completedAt;
  final DateTime createdAt;
  final List<StockCountLine> lines;

  StockCount({
    required this.id,
    required this.countNumber,
    required this.warehouseId,
    this.warehouseName,
    this.notes,
    required this.status,
    required this.countDate,
    this.completedAt,
    required this.createdAt,
    required this.lines,
  });

  int get totalItems => lines.length;
  int get countedItems => lines.where((l) => l.isCounted).length;
  int get varianceItems => lines.where((l) => l.hasVariance).length;
  double get progressPercent {
    if (totalItems == 0) return 0;
    return (countedItems / totalItems) * 100;
  }

  bool get isComplete => countedItems == totalItems;

  factory StockCount.fromJson(Map<String, dynamic> json) {
    return StockCount(
      id: json['id'] as String,
      countNumber: json['countNumber'] as String,
      warehouseId: json['warehouseId'] as String,
      warehouseName: json['warehouseName'] as String?,
      notes: json['notes'] as String?,
      status: StockCountStatus.fromString(json['status'] as String? ?? 'IN_PROGRESS'),
      countDate: json['countDate'] != null
          ? DateTime.parse(json['countDate'] as String)
          : DateTime.now(),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      lines: (json['lines'] as List<dynamic>?)
              ?.map((e) => StockCountLine.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
